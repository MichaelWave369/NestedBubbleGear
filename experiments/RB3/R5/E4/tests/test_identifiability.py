from __future__ import annotations

import copy
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("nbg_r5_e4_audit", ROOT/"audit_identifiability.py")
assert SPEC and SPEC.loader
audit=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(audit)

RUNNER_SPEC = importlib.util.spec_from_file_location("nbg_r5_e4_runner", ROOT.parents[1]/"src"/"rb3.py")
assert RUNNER_SPEC and RUNNER_SPEC.loader
runner=importlib.util.module_from_spec(RUNNER_SPEC)
RUNNER_SPEC.loader.exec_module(runner)


class IdentifiabilityTests(unittest.TestCase):
    def setUp(self):
        self.data=audit.read_json(audit.CASEBOOK_PATH)
        self.rows=audit.read_rows()
        self.timing=audit.read_json(audit.timing_audit.DATA)

    def reject(self,edit,error):
        src=copy.deepcopy(self.data)
        rs=copy.deepcopy(self.rows)
        tm=copy.deepcopy(self.timing)
        edit(src,rs,tm)
        with self.assertRaisesRegex(ValueError,error):
            audit.check_casebook(src,rs,tm)

    def test_static_audit_identifies_exact_four_collisions(self):
        r=audit.audit()
        self.assertEqual(r["status"],"PASS_RB3_R5_E4_COARSE_FEATURE_IDENTIFIABILITY_AUDIT")
        self.assertEqual(r["candidate_rows"],64)
        self.assertEqual(r["distinct_frozen_predictor_vectors"],57)
        self.assertEqual(r["opposing_label_predictor_groups"],4)
        self.assertEqual(r["candidate_rows_in_opposing_label_groups"],10)
        self.assertEqual(r["fit_eligible_rows"],0)
        self.assertEqual(r["independent_reviews_completed"],0)
        self.assertFalse(r["real_model_execution_authorized"])

    def test_all_contradictions_are_in_one_source_lineage(self):
        r=audit.audit()
        self.assertEqual({x["source_id"] for x in r["review_priority_cases"]},
                         {"RB2-S002","RB2-S003"})
        self.assertEqual(len(r["review_priority_cases"]),4)

    def test_source_readout_differences_are_not_overgeneralized(self):
        r=audit.audit()
        self.assertEqual(
            r["readout_delay_unequal_case_ids"],
            ["C1_NEURON_VS_ASTROCYTE_DIFFERENTIATION"])
        self.assertEqual(
            r["source_time_not_confirmed_case_ids"],
            ["C4_2014_DIFFERENT_NEURONAL_TRANSCRIPTS"])

    def test_conflicting_labels_are_not_same_assay(self):
        groups=audit.conflicting_groups(audit.feature_groups(self.rows))
        self.assertEqual(len(groups),4)
        self.assertTrue(all(len({r["reported_direction"] for r in group})>1 for group in groups))

    def test_can_render_review_report_without_training(self):
        txt=audit.markdown_report(audit.audit())
        self.assertIn("**UNATTESTED DIAGNOSTIC. NO MODEL RUN.**",txt)
        self.assertIn("Rows in conflicting groups: 10",txt)
        self.assertIn("C4_2014_DIFFERENT_NEURONAL_TRANSCRIPTS",txt)

    def test_fabricated_reviewer_attestation_rejected(self):
        self.reject(lambda src,rows,t:src["review_status"]["independent_review_attestations"].append("fiction"),"forged independent")

    def test_model_authorization_rejected(self):
        self.reject(lambda src,rows,t:src["review_status"].__setitem__("model_execution_authorized",True),"model run authorized")

    def test_casebook_cannot_promote_eligible_row(self):
        self.reject(lambda src,rows,t:src["review_status"].__setitem__("fit_eligible_rows",10),"forged eligible")

    def test_cannot_hide_opposing_label_case(self):
        self.reject(lambda src,rows,t:src["cases"].pop(),"four documented")

    def test_cannot_erase_source_target_difference(self):
        self.reject(lambda src,rows,t:src["cases"][1]["expected_labels"].__setitem__(1,"INCREASE"),"case outcomes changed")

    def test_cannot_invent_timepoint_for_2014(self):
        self.reject(lambda src,rows,t:src["cases"][3].__setitem__("known_source_time_difference","All measured at 3 days"),"unverified 2014")

    def test_cannot_erase_gfap_readout_delay(self):
        def edit(src,rows,t):
            target=next(x for x in t["source_row_crosswalk"]["RB2-S002"]
                        if x["row_id"]=="RB3R1-S002-04")
            target["post_exposure_culture_days_before_assay"]=0
        self.reject(edit,"delayed astrocyte")

    def test_cannot_add_hidden_analyte_as_model_feature(self):
        def edit(src,rows,t):
            row=next(x for x in rows if x["row_id"]=="RB3R1-S002-04")
            row["endpoint_class"]="ASSAY_GFAP"
        self.reject(edit,"new/missing opposing-label collision")

    def test_cannot_drop_null_candidate_to_boost_performance(self):
        def edit(src,rows,t):
            rows[:]=[x for x in rows if x["row_id"]!="RB3R1-S002-04"]
        self.reject(edit,"new/missing opposing-label collision")

    def test_cannot_reclassify_negative_sox2_expression(self):
        def edit(src,rows,t):
            row=next(x for x in rows if x["row_id"]=="RB3R1-S003-14")
            row["reported_direction"]="INCREASE"
        self.reject(edit,"new/missing opposing-label collision")

    def test_cannot_remove_claim_caution(self):
        self.reject(lambda src,rows,t:src["promotion_blocks"].remove(
            "DO_NOT_DROP_CONFLICTING_ROWS_TO_IMPROVE_SCORE"),"claim boundary")

    def test_source_doi_cannot_be_swapped(self):
        self.reject(lambda src,rows,t:src["source_evidence"][0].__setitem__("doi","10.unknown"),"source DOI")

    def test_original_real_model_execution_remains_blocked(self):
        with self.assertRaisesRegex(RuntimeError,"REFUSED_RB3_REAL_ROWS"):
            runner.execute(ROOT.parents[1]/"R1"/"additional_rows.csv")


if __name__=="__main__":
    unittest.main()

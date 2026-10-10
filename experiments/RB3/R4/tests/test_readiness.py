from __future__ import annotations

import copy
import importlib.util
import json
from pathlib import Path
import unittest

R4 = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("rb3_r4_audit", R4 / "audit_readiness.py")
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("could not load RB3 R4 audit")
v = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v)

RUNSPEC = importlib.util.spec_from_file_location("rb3_r4_runner", R4.parent / "src" / "rb3.py")
if RUNSPEC is None or RUNSPEC.loader is None:
    raise RuntimeError("could not load frozen RB3 runner")
rb3 = importlib.util.module_from_spec(RUNSPEC)
RUNSPEC.loader.exec_module(rb3)

class RB3R4Tests(unittest.TestCase):
    def setUp(self):
        self.studies = {
            s["id"]:s for s in v.read_json(v.RB2 / "corpus_manifest.json")["records"]
        }
        self.register = v.read_json(R4 / "unresolved_studies.json")
        self.policy = v.read_json(R4 / "admission_policy.json")
        self.represented = {
            "RB2-S001","RB2-S002","RB2-S003","RB2-S004","RB2-S006",
            "RB2-S010","RB2-S011","RB2-S012","RB2-S014"
        }

    def _reg(self, change):
        data = copy.deepcopy(self.register)
        change(data)
        with self.assertRaises(AssertionError):
            v.validate_study_register(data, self.studies, self.represented)

    def _policy(self, change):
        data = copy.deepcopy(self.policy)
        change(data)
        with self.assertRaises(AssertionError):
            v.validate_admission_policy(data)

    def test_complete_r4_audit_blocks_real_fit(self):
        r=v.audit()
        self.assertEqual(r["status"],"PASS_RB3_R4_SOURCE_ADMISSIBILITY_AUDIT")
        self.assertEqual(r["result_classification"],v.BLOCKED_CLASS)
        self.assertEqual(r["candidate_rows"],64)
        self.assertEqual(r["candidate_sources"],9)
        self.assertEqual(r["candidate_lineages"],8)
        self.assertEqual(r["unrepresented_lineages"],["L005","L006","L010"])
        self.assertEqual(r["new_fit_eligible_rows"],0)
        self.assertFalse(r["real_model_execution_authorized"])

    def test_no_candidate_can_be_directly_fit(self):
        with self.assertRaisesRegex(RuntimeError,"REFUSED_RB3_REAL_ROWS"):
            rb3.execute(v.RB3 / "R3" / "additional_rows.csv")

    def test_source_claim_cannot_be_promoted(self):
        self._reg(lambda d: d["sources"][0].__setitem__("eligible_for_model_freeze",True))

    def test_pooled_null_not_exact_per_arm(self):
        def tamper(d):
            src = next(x for x in d["sources"] if x["source_id"] == "RB2-S013")
            src["comparison_facts"][0]["per_arm_assignment"] = "VERIFIED"
        self._reg(tamper)

    def test_missing_duration_cannot_be_invented(self):
        def tamper(d):
            src = next(x for x in d["sources"] if x["source_id"] == "RB2-S009")
            src["nominal_stimulus"]["durations_hours"] = [2,4,6]
        self._reg(tamper)

    def test_per_arm_3h_6h_non_difference_is_not_sham_null(self):
        def tamper(d):
            src = next(x for x in d["sources"] if x["source_id"] == "RB2-S008")
            src["comparison_facts"] = [c for c in src["comparison_facts"]
                                        if c["direction"]!="NULL_BETWEEN_EXPOSURE_ARMS"]
        self._reg(tamper)

    def test_nulled_field_may_not_be_relabelled_50hz(self):
        def tamper(d):
            src = next(x for x in d["sources"] if x["source_id"]=="RB2-S013")
            src["nominal_stimulus"]["other_regimes"] = ["ambient laboratory","vertical 50 Hz"]
        self._reg(tamper)

    def test_source_record_cannot_add_model_rows(self):
        self._reg(lambda d: d.__setitem__("row_count_added",16))

    def test_lineage_mapping_requires_manifest(self):
        self._reg(lambda d: d["sources"][0].__setitem__("lineage_id","L001"))

    def test_independent_review_cannot_be_skipped(self):
        self._policy(lambda d: d["authorization"].__setitem__("independent_review_required",False))

    def test_candidate_csv_cannot_be_fit_ready(self):
        self._policy(lambda d: d["authorization"].__setitem__("candidate_csvs_are_never_fit_ready",False))

    def test_corpus_insufficiency_must_void(self):
        self._policy(lambda d: d["stop_conditions"].remove(
            "IF_LESS_THAN_11_HOLDOUT_CAPABLE_LINEAGES_AFTER_REVIEW_FLAG_VOID"
        ))

    def test_policy_cannot_authorize_execution(self):
        self._policy(lambda d: d["authorization"].__setitem__("execution_authorized",True))

if __name__=="__main__":
    unittest.main()

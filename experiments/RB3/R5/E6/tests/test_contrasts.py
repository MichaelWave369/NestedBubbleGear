from __future__ import annotations

import copy
import importlib.util
from pathlib import Path
import unittest

E6 = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("e6_source_claims", E6/"audit_contrasts.py")
assert SPEC and SPEC.loader
a=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(a)

RB3SPEC=importlib.util.spec_from_file_location("e6_original_rb3",E6.parents[1]/"src"/"rb3.py")
assert RB3SPEC and RB3SPEC.loader
runner=importlib.util.module_from_spec(RB3SPEC)
RB3SPEC.loader.exec_module(runner)


class AbstractAtomicityTests(unittest.TestCase):
    def setUp(self):
        self.book=a.load_json(a.DATA_PATH)
        self.packet=a.packet_builder.packet()
        self.manifest=a.load_json(a.RB2/"corpus_manifest.json")
        self.unresolved=a.load_json(a.RB3/"R4/unresolved_studies.json")

    def reject(self,change,error):
        d=copy.deepcopy(self.book)
        change(d)
        with self.assertRaisesRegex(ValueError,error):
            a.validate(d,self.packet,self.manifest,self.unresolved)

    def claim(self,d,ident):
        return next(x for x in d["claim_atoms"] if x["claim_id"]==ident)

    def test_positive_no_fit_source_audit(self):
        result=a.audit()
        self.assertEqual(result["status"],a.STATUS)
        self.assertEqual(result["abstract_claim_atoms"],10)
        self.assertEqual(result["new_model_candidate_rows"],0)
        self.assertEqual(result["independent_source_reviews"],0)
        self.assertEqual(result["missing_candidate_lineages"],["L005","L006","L010"])
        self.assertFalse(result["model_execution_authorized"])

    def test_cannot_relabel_exposed_3h_6h_comparison_as_sham(self):
        self.reject(lambda d:self.claim(d,"S008-PROLIFERATION-3H-VS-6H").__setitem__(
            "comparator_class","EXPOSED_3H_VS_SHAM"),"wrongly interpreted as sham")

    def test_cannot_relabel_g1_6h_3h_comparison_as_sham(self):
        self.reject(lambda d:self.claim(d,"S008-G1-6H-VS-3H").__setitem__(
            "comparator_class","EXPOSED_6H_VS_SHAM"),"wrongly interpreted as sham")

    def test_cannot_expand_s013_pooled_claim_into_direct_comparison(self):
        self.reject(lambda d:self.claim(d,"S013-POOLED-NULL").__setitem__(
            "comparator_class","VERTICAL_50HZ_VS_NULLED_1D"),"pooled multi-regime")

    def test_cannot_forge_signoff(self):
        self.reject(lambda d:self.claim(d,"S013-POOLED-NULL").__setitem__(
            "independently_reviewed",True),"forged independent review")

    def test_cannot_invent_per_arm_figure(self):
        self.reject(lambda d:self.claim(d,"S008-PROLIFERATION-EARLY").__setitem__(
            "per_arm_figure_table_locator","Figure 1"),"unextracted per-arm")

    def test_cannot_invent_numeric_p_value(self):
        self.reject(lambda d:self.claim(d,"S009-PROLIFERATION-DURATION").__setitem__(
            "statistic","P_EQ_0_01"),"p-value fabricated")

    def test_cannot_turn_16h_into_early_effect(self):
        self.reject(lambda d:self.claim(d,"S008-PROLIFERATION-LATE").__setitem__(
            "outcome","AUTHOR_REPORTED_INCREASE"),"late outcome confused")

    def test_cannot_treat_u0126_as_sham_baseline(self):
        self.reject(lambda d:self.claim(d,"S009-U0126-CONTEXT").__setitem__(
            "claim_scope","ABSTRACT_AGGREGATE"),"co-intervention")

    def test_cannot_invent_s009_exposure_duration(self):
        self.reject(lambda d:d["source_metadata"]["RB2-S009"].__setitem__(
            "specified_exposure_hours",[1,3,5]),"duration inferred")

    def test_cannot_call_s008_human_cells(self):
        self.reject(lambda d:d["source_metadata"]["RB2-S008"].__setitem__(
            "population","HUMAN_MESENCHYMAL_STEM_CELLS"),"may not be human")

    def test_cannot_equate_nulled_to_vertical_s013_regime(self):
        self.reject(lambda d:d["source_metadata"]["RB2-S013"]["regimes"].__setitem__(
            1,"VERTICAL_50_HZ_6_MICROTESLA_RMS"),"field regime/day conflation")

    def test_cannot_claim_full_text_was_reviewed(self):
        self.reject(lambda d:d["source_metadata"]["RB2-S008"].__setitem__(
            "fulltext_per_arm_checked",True),"wrongly called full-text checked")

    def test_cannot_approve_abstract_training_rows(self):
        self.reject(lambda d:self.claim(d,"S008-PROLIFERATION-EARLY").__setitem__(
            "promotable_to_rb3",True),"abstract promoted")

    def test_cannot_forge_fit_permission(self):
        self.reject(lambda d:d.__setitem__("model_execution_authorized",True),
                    "model execution authorized")

    def test_cannot_change_missing_source_id(self):
        self.reject(lambda d:d["source_metadata"]["RB2-S008"].__setitem__(
            "pmid","99999999"),"source pmid drift")

    def test_cannot_delete_inconvenient_abstract_claim(self):
        self.reject(lambda d:d["claim_atoms"].pop(),"claim count changed")

    def test_source_abstracts_are_not_independent_experiments(self):
        txt=a.markdown(a.audit())
        self.assertIn("ABSTRACT-ONLY",txt)
        self.assertIn("not sham",txt)
        self.assertIn("one pooled multi-regime null",txt)

    def test_original_real_model_still_refuses_candidate(self):
        with self.assertRaisesRegex(RuntimeError,"REFUSED_RB3_REAL_ROWS"):
            runner.execute(a.RB3/"R3"/"additional_rows.csv")


if __name__=="__main__":
    unittest.main()

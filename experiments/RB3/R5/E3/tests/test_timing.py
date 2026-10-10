from __future__ import annotations

import copy
import importlib.util
from pathlib import Path
import unittest

E3 = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("rb3_r5_e3_timing", E3 / "audit_timing.py")
assert SPEC and SPEC.loader
m=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(m)

RUNNER_SPEC = importlib.util.spec_from_file_location("rb3_r5_e3_runner", E3.parents[1] / "src" / "rb3.py")
assert RUNNER_SPEC and RUNNER_SPEC.loader
runner=importlib.util.module_from_spec(RUNNER_SPEC)
RUNNER_SPEC.loader.exec_module(runner)


class PrimaryHtmlCrosswalkTests(unittest.TestCase):
    def setUp(self):
        self.reference=m.load_json(m.DATA)

    def check_rejection(self,change,fragment):
        data=copy.deepcopy(self.reference)
        change(data)
        with self.assertRaisesRegex(ValueError,fragment):
            m.checked_crosswalk(data)

    def test_positive_unattested_spotcheck(self):
        r=m.audit()
        self.assertEqual(r["status"],"PASS_RB3_R5_E3_UNATTESTED_SOURCE_TIMING_SPOTCHECK")
        self.assertEqual(r["spotcheck_rows"],18)
        self.assertEqual(r["source_ids"],["RB2-S001","RB2-S002"])
        self.assertEqual(r["independent_review_attestations"],0)
        self.assertEqual(r["reviewed_eligible_rows"],0)
        self.assertFalse(r["model_execution_authorized"])
        self.assertFalse(r["readout_time_is_model_feature"])

    def test_two_delayed_assays_not_relabelled_as_exposure(self):
        r=m.audit()
        self.assertEqual(r["delayed_readouts"],{
            "RB3R1-S002-02":7,
            "RB3R1-S002-04":3,
        })

    def test_gfap_cell_fraction_and_mrna_use_distinct_assay_readout_times(self):
        rows={x["row_id"]:x for x in self.reference["source_row_crosswalk"]["RB2-S002"]}
        self.assertEqual(rows["RB3R1-S002-04"]["post_exposure_culture_days_before_assay"],3)
        self.assertEqual(rows["RB3R1-S002-06"]["post_exposure_culture_days_before_assay"],0)
        self.assertEqual(rows["RB3R1-S002-04"]["exposure_hours_per_day"],4)
        self.assertEqual(rows["RB3R1-S002-06"]["exposure_hours_per_day"],4)

    def test_2016_secondary_neurosphere_7_day_delay_cannot_be_erased(self):
        self.check_rejection(
            lambda d: d["source_row_crosswalk"]["RB2-S002"][1].__setitem__(
                "post_exposure_culture_days_before_assay",0),
            "delayed measurement",
        )

    def test_2016_gfap_3_day_delay_cannot_be_erased(self):
        self.check_rejection(
            lambda d: d["source_row_crosswalk"]["RB2-S002"][3].__setitem__(
                "post_exposure_culture_days_before_assay",0),
            "delayed measurement",
        )

    def test_2016_readout_schedule_tamper_refused(self):
        self.check_rejection(
            lambda d: d["source_row_crosswalk"]["RB2-S002"][3].__setitem__(
                "assay_readout_timing","SAMPLED_AFTER_3D_EXPOSURE"),
            "wrong assay readout",
        )

    def test_source_figures_must_align_with_original_receipts(self):
        self.check_rejection(
            lambda d: d["source_row_crosswalk"]["RB2-S002"][3].__setitem__(
                "figure_or_table","Figure 3C"),
            "figure/panel locator",
        )

    def test_p_value_drift_refused(self):
        self.check_rejection(
            lambda d: d["source_row_crosswalk"]["RB2-S001"][0].__setitem__(
                "p_vs_sham","0.049"),
            "R0 source p",
        )

    def test_numeric_mean_drift_refused(self):
        self.check_rejection(
            lambda d: d["source_row_crosswalk"]["RB2-S001"][0].__setitem__(
                "measured_mean_from_source",999.0),
            "R0 source mean",
        )

    def test_replicate_count_drift_refused(self):
        self.check_rejection(
            lambda d: d["source_row_crosswalk"]["RB2-S001"][3].__setitem__(
                "biological_replicates_n",5),
            "R0 source replication count",
        )

    def test_invented_2016_p_value_refused(self):
        self.check_rejection(
            lambda d: d["source_row_crosswalk"]["RB2-S002"][0].__setitem__(
                "p_vs_sham","0.001"),
            "S002 exact numeric evidence invented",
        )

    def test_invented_2016_mean_refused(self):
        self.check_rejection(
            lambda d: d["source_row_crosswalk"]["RB2-S002"][0].__setitem__(
                "measured_mean_from_source",123),
            "S002 exact numeric evidence invented",
        )

    def test_fake_independent_reviewer_refused(self):
        self.check_rejection(
            lambda d: d["independent_reviewer_attestations"].append({"name":"not actually reviewed"}),
            "fake independent review",
        )

    def test_fake_authorized_training_refused(self):
        self.check_rejection(
            lambda d: d.__setitem__("model_execution_authorized",True),
            "model authorization",
        )

    def test_source_membership_tamper_refused(self):
        self.check_rejection(
            lambda d: d["source_records"]["RB2-S002"].__setitem__(
                "lineage","L009"),
            "source lineage mismatch",
        )

    def test_readout_confounds_must_remain_visible(self):
        self.check_rejection(
            lambda d: d["blocking_flags"].remove(
                "GFAP_CELL_FRACTION_HAS_THREE_DAY_UNEXPOSED_MATURATION"),
            "scientific caution flag drift",
        )

    def test_author_report_not_misrepresented_as_independent(self):
        self.check_rejection(
            lambda d: d["source_records"]["RB2-S001"].__setitem__(
                "provenance","INDEPENDENTLY_VERIFIED"),
            "misrepresented as independent",
        )

    def test_no_model_fit_from_partial_candidates(self):
        with self.assertRaisesRegex(RuntimeError,"REFUSED_RB3_REAL_ROWS"):
            runner.execute(E3.parents[1] / "R0" / "candidate_rows.csv")


if __name__=="__main__":
    unittest.main()

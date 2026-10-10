from __future__ import annotations

import csv
import importlib.util
import tempfile
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("r3_validator", ROOT / "validate_candidate.py")
assert SPEC is not None and SPEC.loader is not None
v = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v)

RBSPEC = importlib.util.spec_from_file_location("r3_runner", ROOT.parent / "src" / "rb3.py")
assert RBSPEC is not None and RBSPEC.loader is not None
rb3 = importlib.util.module_from_spec(RBSPEC)
RBSPEC.loader.exec_module(rb3)


class R3AuditTests(unittest.TestCase):
    def test_static_evidence(self):
        r = v.audit()
        self.assertEqual(r["status"], "PASS_RB3_R3_PROVISIONAL_EVIDENCE_AUDIT")
        self.assertEqual(r["added_candidate_rows"], 8)
        self.assertEqual(r["total_candidate_rows"], 64)
        self.assertEqual(r["papers"], 9)
        self.assertEqual(r["lineages"], 8)
        self.assertFalse(r["model_execution_authorized"])

    def test_real_fit_refused(self):
        with self.assertRaisesRegex(RuntimeError, "REFUSED_RB3_REAL_ROWS"):
            rb3.execute(ROOT / "additional_rows.csv")

    def test_incomplete_sources_not_silently_filled(self):
        triage = v.load_json(ROOT / "source_triage.json")
        self.assertEqual(len(triage["items"]), 5)
        self.assertIn("RB2-S013", {x["source_id"] for x in triage["items"]})

    def test_pooled_claims_not_promoted(self):
        evidence = v.load_json(ROOT / "source_evidence.json")
        self.assertTrue(all(not x["eligible_for_model_freeze"] for x in evidence["records"]))
        self.assertTrue(all(x["independent_review"] == "PENDING" for x in evidence["records"]))

    def modify_and_refuse(self, modify):
        original = v.RB3 / v.FILES[-1]
        fields, rows = v.load_csv(original)
        with tempfile.TemporaryDirectory() as temp:
            tmp = Path(temp) / "modified.csv"
            modify(rows)
            with tmp.open("w",encoding="utf8",newline="") as f:
                writer = csv.DictWriter(f,fieldnames=fields)
                writer.writeheader()
                writer.writerows(rows)
            prior = v.FILES
            try:
                # Replace only the R3 entry with an absolute temporary CSV.
                v.FILES = prior[:-1] + (str(tmp),)
                with self.assertRaises((AssertionError, ValueError)):
                    v.audit()
            finally:
                v.FILES = prior

    def test_forbid_lineage_swap(self):
        self.modify_and_refuse(lambda rows: rows[0].__setitem__("lineage_id","L005"))

    def test_forbid_unit_swap(self):
        self.modify_and_refuse(lambda rows: rows[3].__setitem__("amplitude_value_si","0.01"))

    def test_forbid_unreviewed_significance_upgrade(self):
        self.modify_and_refuse(lambda rows: rows[3].__setitem__("reported_significance","SIGNIFICANT"))

    def test_forbid_fabricated_s004_duration(self):
        self.modify_and_refuse(lambda rows: rows[0].__setitem__("exposure_duration_s","3600"))

    def test_forbid_dna_harm_caveat_erasure(self):
        self.modify_and_refuse(lambda rows: rows[-1].__setitem__("extraction_note","no risk context"))

    def test_forbid_frequency_override(self):
        self.modify_and_refuse(lambda rows: rows[-1].__setitem__("frequency_hz","7.83"))


if __name__ == "__main__":
    unittest.main()

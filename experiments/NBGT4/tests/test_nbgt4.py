import importlib.util
import sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"nbgt4.py"
spec=importlib.util.spec_from_file_location("nbgt4",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class NBGT4Tests(unittest.TestCase):
    def result(self): return m.run_suite()

    def test_all_fifteen_checks_pass(self):
        r=self.result()
        self.assertEqual((r["checks_passed"],r["checks_total"],r["verdict"]),(15,15,"PASS_NBGT4"))

    def test_generic_arrow_maps_only_to_alleged_link(self):
        r=m.ingest(m.frozen_fixture())
        x=next(x for x in r["accepted"] if x["record_id"]=="R01")
        self.assertEqual((x["relation"],x["evidence_status"]),("ALLEGED_LINK","ALLEGED"))

    def test_missing_provenance_is_rejected(self):
        r=m.ingest(m.frozen_fixture())
        self.assertTrue(any(x["record_id"]=="R09" and x["reason"]=="MISSING_PROVENANCE" for x in r["rejected"]))

    def test_ambiguous_label_is_unknown_not_guessed(self):
        r=m.ingest(m.frozen_fixture())
        x=next(x for x in r["ambiguous"] if x["record_id"]=="R05")
        self.assertEqual(x["subject"],"UNKNOWN")

    def test_adjacency_is_not_an_edge(self):
        r=m.ingest(m.frozen_fixture())
        self.assertEqual(r["no_edge"][0]["reason"],"ADJACENCY_IS_NOT_AN_EDGE")
        self.assertFalse(any(x["record_id"]=="R04" for x in r["accepted"]+r["disputed"]))

    def test_unsupported_relation_is_refused(self):
        r=m.ingest(m.frozen_fixture())
        self.assertTrue(any(x["record_id"]=="R06" and x["reason"]=="UNSUPPORTED_RELATION" for x in r["rejected"]))

    def test_chronology_has_no_causal_inference(self):
        r=m.ingest(m.frozen_fixture())
        x=next(x for x in r["accepted"] if x["record_id"]=="R03")
        self.assertEqual(x["relation"],"OCCURRED_BEFORE")
        self.assertEqual(x["causal_inference"],"NONE")

    def test_duplicate_mirror_is_one_lineage(self):
        r=m.ingest(m.frozen_fixture())
        self.assertEqual(r["duplicate_groups"][0]["independent_lineage_count"],1)

    def test_disputed_claim_remains_inspectable(self):
        r=m.ingest(m.frozen_fixture())
        ids={x["record_id"] for x in r["disputed"]}
        self.assertTrue({"R07","R08"}.issubset(ids))

    def test_hypothesis_is_separate(self):
        r=m.ingest(m.frozen_fixture())
        self.assertEqual([x["record_id"] for x in r["analyst_hypotheses"]],["H01"])
        self.assertFalse(any(x["record_id"]=="H01" for x in r["accepted"]+r["disputed"]))

    def test_density_does_not_change_focal_semantics(self):
        a=m.ingest(m.frozen_fixture())
        b=m.ingest(m.frozen_fixture(extra_density=128))
        a1=next(x for x in a["accepted"] if x["record_id"]=="R01")
        b1=next(x for x in b["accepted"] if x["record_id"]=="R01")
        self.assertEqual((a1["relation"],a1["evidence_status"]),(b1["relation"],b1["evidence_status"]))

    def test_audit_buckets_are_machine_readable(self):
        r=m.ingest(m.frozen_fixture())
        for key in ("accepted","disputed","ambiguous","rejected","no_edge","analyst_hypotheses","duplicate_groups","counts"):
            self.assertIn(key,r)

    def test_input_order_is_canonical(self):
        a=m.ingest(m.frozen_fixture())
        b=m.ingest(list(reversed(m.frozen_fixture())))
        self.assertEqual(m.canonical(a),m.canonical(b))

    def test_replay_exact(self):
        a=m.ingest(m.frozen_fixture())
        b=m.ingest(m.frozen_fixture())
        self.assertEqual(m.canonical(a),m.canonical(b))

    def test_invalid_origin_refused(self):
        record=m.frozen_fixture()[0]
        record=dict(record,origin_kind="MAGIC_TRUTH_ORACLE")
        with self.assertRaises(ValueError): m.ingest([record])

if __name__=="__main__":
    unittest.main()

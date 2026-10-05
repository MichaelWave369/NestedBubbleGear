import importlib.util
import sys
from pathlib import Path
import unittest

P = Path(__file__).resolve().parents[1] / "src" / "nbgt9.py"
spec = importlib.util.spec_from_file_location("nbgt9", P)
m = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = m
spec.loader.exec_module(m)


class NBGT9Tests(unittest.TestCase):
    def fixture(self):
        return m.frozen_fixture()

    def test_all_twenty_two_checks_pass(self):
        r = m.run_suite()[0]
        self.assertEqual((r["checks_passed"], r["checks_total"], r["verdict"]), (22,22,"PASS_NBGT9"))

    def test_registry_hash_validates(self):
        _, registry, *_ = self.fixture()
        self.assertTrue(m.validate_source_registry(registry))

    def test_duplicate_source_id_rejected(self):
        s={"source_id":"S","label":"x","independence_group":"G","locator":"synthetic://x","source_kind":"TEST"}
        with self.assertRaises(ValueError):
            m.make_source_registry([s,s])

    def test_independence_group_required(self):
        s={"source_id":"S","label":"x","independence_group":"","locator":"synthetic://x","source_kind":"TEST"}
        with self.assertRaises(ValueError):
            m.make_source_registry([s])

    def test_bundle_a_validates(self):
        *_, a, _, _ = self.fixture()
        self.assertTrue(m.validate_bundle(a))

    def test_manifest_tamper_fails(self):
        *_, a, _, _ = self.fixture()
        bad=m.deepcopy(a); bad["manifest"]["bundle_id"]="TAMPERED"
        with self.assertRaises(ValueError):
            m.validate_bundle(bad)

    def test_payload_tamper_fails(self):
        *_, a, _, _ = self.fixture()
        bad=m.deepcopy(a); bad["payload"]["captures"][0]["capture_id"]="TAMPERED"
        with self.assertRaises(ValueError):
            m.validate_bundle(bad)

    def test_object_tamper_fails(self):
        *_, a, _, _ = self.fixture()
        bad=m.deepcopy(a); digest=next(iter(bad["object_bytes"])); bad["object_bytes"][digest]=b"tampered"
        with self.assertRaises(ValueError):
            m.validate_bundle(bad)

    def test_parent_manifest_chain_links(self):
        *_, a, b, c = self.fixture()
        self.assertEqual(b["manifest"]["parent_manifest_hash"],a["manifest"]["manifest_hash"])
        self.assertEqual(c["manifest"]["parent_manifest_hash"],b["manifest"]["manifest_hash"])

    def test_first_import_adds_three_objects(self):
        *_, a, _, _ = self.fixture()
        r=m.import_bundle(a,{})
        self.assertEqual((r["objects_added"],r["objects_reused"]),(3,0))

    def test_second_import_reuses_three_objects(self):
        *_, a, b, _ = self.fixture()
        store={}; m.import_bundle(a,store); r=m.import_bundle(b,store)
        self.assertEqual((r["objects_added"],r["objects_reused"]),(0,3))

    def test_well_formed_import_is_not_trusted(self):
        *_, a, _, _ = self.fixture()
        self.assertEqual(m.import_bundle(a,{})["trust_state"],"REVIEW_REQUIRED")

    def test_duplicate_mirror_cluster_detected(self):
        _, registry, captures, *_ = self.fixture()
        c=m.mirror_clusters(registry,captures)
        self.assertEqual(len(c),1)
        self.assertEqual(set(c[0]["capture_ids"]),{"CAP_A_V1","CAP_MIRROR_V1"})

    def test_mirror_does_not_count_as_independent(self):
        _, registry, captures, *_ = self.fixture()
        c=m.mirror_clusters(registry,captures)[0]
        self.assertEqual(c["independent_count"],1)
        self.assertFalse(c["counts_as_multiple_independent_sources"])

    def test_drift_history_uses_stable_source_id(self):
        _, _, captures, *_ = self.fixture()
        d=m.drift_history(captures)
        self.assertEqual((len(d),d[0]["source_id"]),(1,"SRC_ARCHIVE"))

    def test_reviewer_conflict_preserved(self):
        _, _, _, _, a, b, c = self.fixture()
        merged=m.merge_bundles([a,b,c],merged_bundle_id="M",created_at="T")
        self.assertEqual(m.merged_review_state("CAP_OPPOSE",merged["payload"]["decisions"]),"REVIEW_CONFLICT")

    def test_reviewer_attribution_preserved(self):
        _, _, _, _, a, b, c = self.fixture()
        merged=m.merge_bundles([a,b,c],merged_bundle_id="M",created_at="T")
        self.assertEqual({d["reviewer_id"] for d in merged["payload"]["decisions"]},{"ALICE","BOB","CAROL"})

    def test_no_last_write_wins_on_conflict(self):
        claim, registry, captures, _, a, b, c = self.fixture()
        merged=m.merge_bundles([a,b,c],merged_bundle_id="M",created_at="T")
        state=m.derive_claim_state(claim,registry,captures,merged["payload"]["decisions"])
        self.assertEqual(state["capture_review_states"]["CAP_OPPOSE"],"REVIEW_CONFLICT")
        self.assertEqual(state["review_status"],"CORROBORATED")

    def test_source_status_immutable(self):
        claim, registry, captures, _, a, b, c = self.fixture()
        merged=m.merge_bundles([a,b,c],merged_bundle_id="M",created_at="T")
        state=m.derive_claim_state(claim,registry,captures,merged["payload"]["decisions"])
        self.assertEqual((claim["source_status"],state["source_status"]),("ALLEGED","ALLEGED"))

    def test_merge_preserves_four_unique_decisions(self):
        _, _, _, _, a, b, c = self.fixture()
        merged=m.merge_bundles([a,b,c],merged_bundle_id="M",created_at="T")
        self.assertEqual(len(merged["payload"]["decisions"]),4)

    def test_merged_decision_chain_valid(self):
        _, _, _, _, a, b, c = self.fixture()
        merged=m.merge_bundles([a,b,c],merged_bundle_id="M",created_at="T")
        self.assertEqual(m.validate_decision_chain(merged["payload"]["decisions"]),merged["manifest"]["decision_head"])

    def test_registry_conflict_refused(self):
        _, registry, *_ = self.fixture()
        other=m.deepcopy(registry)
        other["sources"][0]["independence_group"]="OTHER"
        other["registry_sha256"]=m.sha256_obj({k:v for k,v in other.items() if k!="registry_sha256"})
        with self.assertRaises(ValueError):
            m.merge_registries([registry,other])

    def test_portable_roundtrip_exact(self):
        _, _, _, _, a, b, c = self.fixture()
        merged=m.merge_bundles([a,b,c],merged_bundle_id="M",created_at="T")
        rt=m.portable_import(m.portable_export(merged))
        self.assertEqual(m.canonical(rt["manifest"]),m.canonical(merged["manifest"]))
        self.assertEqual(m.canonical(rt["payload"]),m.canonical(merged["payload"]))
        self.assertEqual(rt["object_bytes"],merged["object_bytes"])

    def test_offline_replay_deterministic(self):
        claim, _, _, _, a, b, c = self.fixture()
        merged=m.merge_bundles([a,b,c],merged_bundle_id="M",created_at="T")
        rt=m.portable_import(m.portable_export(merged))
        astate=m.derive_claim_state(claim,merged["payload"]["registry"],merged["payload"]["captures"],merged["payload"]["decisions"])
        bstate=m.derive_claim_state(claim,rt["payload"]["registry"],rt["payload"]["captures"],rt["payload"]["decisions"])
        self.assertEqual(astate,bstate)

    def test_merge_order_canonical(self):
        _, _, _, _, a, b, c = self.fixture()
        x=m.merge_bundles([a,b,c],merged_bundle_id="M",created_at="T")
        y=m.merge_bundles([c,a,b],merged_bundle_id="M",created_at="T")
        self.assertEqual(m.canonical(x["payload"]),m.canonical(y["payload"]))


if __name__=="__main__":
    unittest.main()

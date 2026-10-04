import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah37.py"
spec=importlib.util.spec_from_file_location("ah37",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH37Tests(unittest.TestCase):
    def result(self):
        return m.run_experiment()

    def test_epoch0_collapses_privacy(self):
        r=self.result()
        self.assertAlmostEqual(r["observers"]["EPOCH0_ONLY"]["residual_privacy_bits"],0.0,places=12)

    def test_fresh_epoch1_has_positive_privacy(self):
        r=self.result()
        self.assertAlmostEqual(r["observers"]["FRESH_E1"]["residual_privacy_bits"],0.4,places=12)

    def test_legacy_observer_remains_collapsed(self):
        r=self.result()
        self.assertAlmostEqual(r["observers"]["LEGACY_E0_E1"]["residual_privacy_bits"],0.0,places=12)

    def test_public_commitment_observer_collapses(self):
        r=self.result()
        self.assertAlmostEqual(r["observers"]["PUBLIC_COMMITMENT_E0_E1"]["residual_privacy_bits"],0.0,places=12)

    def test_public_commitment_alone_collapses(self):
        r=self.result()
        self.assertAlmostEqual(r["observers"]["PUBLIC_COMMITMENT_ONLY"]["residual_privacy_bits"],0.0,places=12)

    def test_metadata_only_preserves_fresh_privacy(self):
        r=self.result()
        self.assertAlmostEqual(r["observers"]["METADATA_ONLY_E0_E1"]["residual_privacy_bits"],0.4,places=12)

    def test_public_commitment_has_nine_classes(self):
        r=self.result()
        self.assertEqual(r["enumeration"]["distinct_public_commitments"],9)

    def test_public_commitment_enumeration_unique(self):
        r=self.result()
        self.assertTrue(r["enumeration"]["every_digest_maps_to_one_target"])

    def test_epoch0_has_nine_snapshot_classes(self):
        r=self.result()
        self.assertEqual(r["enumeration"]["distinct_epoch0_snapshots"],9)

    def test_fresh_beats_legacy(self):
        r=self.result()["observers"]
        self.assertGreater(r["FRESH_E1"]["residual_privacy_bits"],r["LEGACY_E0_E1"]["residual_privacy_bits"])

    def test_fresh_beats_public_commitment(self):
        r=self.result()["observers"]
        self.assertGreater(r["FRESH_E1"]["residual_privacy_bits"],r["PUBLIC_COMMITMENT_E0_E1"]["residual_privacy_bits"])

    def test_profiles_exact(self):
        r=self.result()
        self.assertEqual(r["epoch0_profile"],[
            m.TRIAGE,m.COMMON_ONLY,m.FULL_STATUS,m.COMMON_ONLY,m.COMMON_ONLY
        ])
        self.assertEqual(r["epoch1_profile"],[
            m.COMMON_ONLY,m.COMMON_ONLY,m.FULL_STATUS,m.COMMON_ONLY,m.COMMON_ONLY
        ])

    def test_seal_receipt_panel_independent(self):
        p=m.build_panels()
        vals=[m.canonical(m.SEAL_RECEIPT) for _ in p.values()]
        self.assertEqual(len(set(vals)),1)

    def test_commitment_is_deterministic(self):
        p=next(iter(m.build_panels().values()))
        z=m.snapshot(p,m.EPOCH0_PROFILE)
        self.assertEqual(m.public_commitment(z),m.public_commitment(z))

    def test_replay_exact(self):
        self.assertEqual(m.canonical(m.run_experiment()),m.canonical(m.run_experiment()))

if __name__=="__main__":
    unittest.main()

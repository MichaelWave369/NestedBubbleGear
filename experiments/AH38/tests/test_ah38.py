import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah38.py"
spec=importlib.util.spec_from_file_location("ah38",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH38Tests(unittest.TestCase):
    def result(self):
        return m.run_experiment()

    def test_fresh_e1_privacy(self):
        self.assertAlmostEqual(self.result()["observers"]["FRESH_E1"]["residual_privacy_bits"],0.4,places=12)

    def test_public_digest_leaks_in_frozen_domain(self):
        self.assertAlmostEqual(self.result()["observers"]["PUBLIC_DIGEST_E1"]["residual_privacy_bits"],0.0,places=12)

    def test_public_salt_does_not_help(self):
        r=self.result()["observers"]
        self.assertAlmostEqual(r["PUBLIC_SALT_DIGEST_E1"]["residual_privacy_bits"],0.0,places=12)

    def test_finite_hmac_keyspace_enumerates(self):
        r=self.result()
        self.assertEqual(r["finite_hmac"]["distinct_enumerated_tags"],72)
        self.assertTrue(r["finite_hmac"]["every_observed_tag_identifies_one_target"])

    def test_finite_hmac_observer_collapses(self):
        self.assertAlmostEqual(self.result()["observers"]["FINITE_KEYSPACE_HMAC_TAG_E1"]["residual_privacy_bits"],0.0,places=12)

    def test_finite_secret_salt_enumerates(self):
        r=self.result()
        self.assertEqual(r["finite_secret_salt"]["distinct_enumerated_digests"],72)
        self.assertTrue(r["finite_secret_salt"]["every_observed_digest_identifies_one_target"])

    def test_finite_secret_salt_observer_collapses(self):
        self.assertAlmostEqual(self.result()["observers"]["FINITE_SECRET_SALT_DIGEST_E1"]["residual_privacy_bits"],0.0,places=12)

    def test_mediated_verification_preserves_fresh_privacy(self):
        r=self.result()["observers"]
        self.assertAlmostEqual(r["MEDIATED_VERIFIED_E1"]["residual_privacy_bits"],0.4,places=12)

    def test_mediated_equals_fresh(self):
        r=self.result()["observers"]
        self.assertAlmostEqual(
            r["MEDIATED_VERIFIED_E1"]["residual_privacy_bits"],
            r["FRESH_E1"]["residual_privacy_bits"],
            places=12
        )

    def test_key_authorized_verifier_collapses(self):
        self.assertAlmostEqual(self.result()["observers"]["KEY_AUTHORIZED_VERIFIER"]["residual_privacy_bits"],0.0,places=12)

    def test_large_keyspace_claim_refused(self):
        self.assertEqual(
            self.result()["large_secret_keyspace_claim"],
            "NO_INFORMATION_THEORETIC_CLAIM_FOR_LARGE_SECRET_KEYSPACE"
        )

    def test_public_digest_has_nine_classes(self):
        self.assertEqual(self.result()["public_digest"]["distinct_values"],9)

    def test_public_salt_has_nine_classes(self):
        self.assertEqual(self.result()["public_salt_digest"]["distinct_values"],9)

    def test_mediated_receipt_constant(self):
        self.assertEqual(self.result()["observers"]["MEDIATED_VERIFIED_E1"]["descriptor_classes"],7)

    def test_replay_exact(self):
        self.assertEqual(m.canonical(m.run_experiment()),m.canonical(m.run_experiment()))

if __name__=="__main__":
    unittest.main()

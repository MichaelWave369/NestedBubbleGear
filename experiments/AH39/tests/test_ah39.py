import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah39.py"
spec=importlib.util.spec_from_file_location("ah39",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH39Tests(unittest.TestCase):
    def result(self):
        return m.run_experiment()

    def test_fresh_e1_privacy(self):
        self.assertAlmostEqual(self.result()["observers"]["FRESH_E1"]["residual_privacy_bits"],0.4,places=12)

    def test_public_tag_already_collapsed(self):
        self.assertAlmostEqual(self.result()["observers"]["P0_TAG_PUBLIC_BEFORE_KEY"]["residual_privacy_bits"],0.0,places=12)

    def test_key_after_public_tag_changes_nothing(self):
        r=self.result()["observers"]
        self.assertAlmostEqual(r["P0_TAG_PUBLIC_BEFORE_KEY"]["residual_privacy_bits"],
                               r["P1_KEY_DISCLOSED_AFTER_PUBLIC_TAG"]["residual_privacy_bits"],places=12)

    def test_key_without_tag_preserves_privacy(self):
        self.assertAlmostEqual(self.result()["observers"]["W1_KEY_DISCLOSED_TAG_STILL_WITHHELD"]["residual_privacy_bits"],0.4,places=12)

    def test_mediated_before_key_preserves_privacy(self):
        self.assertAlmostEqual(self.result()["observers"]["W0_TAG_WITHHELD_BEFORE_KEY"]["residual_privacy_bits"],0.4,places=12)

    def test_tag_release_after_key_collapses(self):
        self.assertAlmostEqual(self.result()["observers"]["W2_TAG_RELEASED_AFTER_KEY"]["residual_privacy_bits"],0.0,places=12)

    def test_key_revoke_does_not_erase_history(self):
        self.assertAlmostEqual(self.result()["observers"]["P2_KEY_REVOKED_HISTORY_PERSISTS"]["residual_privacy_bits"],0.0,places=12)

    def test_status_public_branch(self):
        s=self.result()["statuses"]
        self.assertEqual(s["P0_TAG_PUBLIC_BEFORE_KEY"],"ALREADY_DECLASSIFIED_BEFORE_KEY_DISCLOSURE")
        self.assertEqual(s["P1_KEY_DISCLOSED_AFTER_PUBLIC_TAG"],"ALREADY_DECLASSIFIED_BEFORE_KEY_DISCLOSURE")

    def test_status_withheld_key(self):
        self.assertEqual(self.result()["statuses"]["W1_KEY_DISCLOSED_TAG_STILL_WITHHELD"],
                         "KEY_DISCLOSED_BUT_AUTHENTICATOR_WITHHELD")

    def test_status_late_tag(self):
        self.assertEqual(self.result()["statuses"]["W2_TAG_RELEASED_AFTER_KEY"],
                         "RETROACTIVE_AUTHENTICATOR_DECLASSIFICATION")

    def test_finite_keyspace_72(self):
        self.assertEqual(self.result()["finite_keyspace"]["distinct_enumerated_tags"],72)

    def test_finite_tags_unique_target(self):
        self.assertTrue(self.result()["finite_keyspace"]["all_observed_tags_unique_target"])

    def test_large_keyspace_claim_refused(self):
        self.assertEqual(self.result()["large_secret_keyspace_claim"],
                         "NO_INFORMATION_THEORETIC_CLAIM_FOR_LARGE_SECRET_KEYSPACE")

    def test_descriptor_classes(self):
        o=self.result()["observers"]
        self.assertEqual(o["FRESH_E1"]["descriptor_classes"],7)
        self.assertEqual(o["P0_TAG_PUBLIC_BEFORE_KEY"]["descriptor_classes"],9)
        self.assertEqual(o["W1_KEY_DISCLOSED_TAG_STILL_WITHHELD"]["descriptor_classes"],7)
        self.assertEqual(o["W2_TAG_RELEASED_AFTER_KEY"]["descriptor_classes"],9)

    def test_replay_exact(self):
        self.assertEqual(m.canonical(m.run_experiment()),m.canonical(m.run_experiment()))

if __name__=="__main__":
    unittest.main()

import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah40.py"
spec=importlib.util.spec_from_file_location("ah40",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH40Tests(unittest.TestCase):
    def result(self):
        return m.run_experiment()

    def test_eight_coalitions(self):
        self.assertEqual(self.result()["coalition_count"],8)

    def test_four_verification_coalitions(self):
        rows=self.result()["coalitions"]
        self.assertEqual(sum(r["verify"]["authority"]=="ALLOW" for r in rows),4)

    def test_one_declassification_coalition(self):
        rows=self.result()["coalitions"]
        self.assertEqual(sum(r["declassify"]["authority"]=="ALLOW" for r in rows),1)

    def test_verification_minimal_pairs(self):
        self.assertEqual(self.result()["minimal_verification_coalitions"],[
            ["VERIFIER_A","VERIFIER_B"],
            ["VERIFIER_A","VERIFIER_C"],
            ["VERIFIER_B","VERIFIER_C"],
        ])

    def test_verification_pairs_preserve_privacy(self):
        for r in self.result()["coalitions"]:
            if r["verify"]["authority"]=="ALLOW":
                self.assertAlmostEqual(r["verify_public_stats"]["residual_privacy_bits"],0.4,places=12)

    def test_declassification_requires_three(self):
        rows=self.result()["coalitions"]
        allowed=[r for r in rows if r["declassify"]["authority"]=="ALLOW"]
        self.assertEqual(allowed[0]["coalition"],list(m.VERIFIERS))

    def test_declassification_collapses_privacy(self):
        rows=self.result()["coalitions"]
        allowed=[r for r in rows if r["declassify"]["authority"]=="ALLOW"][0]
        self.assertAlmostEqual(allowed["declassify_public_stats"]["residual_privacy_bits"],0.0,places=12)

    def test_full_coalition_verify_only_stays_private(self):
        row=[r for r in self.result()["coalitions"] if r["coalition"]==list(m.VERIFIERS)][0]
        self.assertAlmostEqual(row["verify_public_stats"]["residual_privacy_bits"],0.4,places=12)

    def test_full_coalition_actions_differ(self):
        row=[r for r in self.result()["coalitions"] if r["coalition"]==list(m.VERIFIERS)][0]
        self.assertGreater(
            row["verify_public_stats"]["residual_privacy_bits"],
            row["declassify_public_stats"]["residual_privacy_bits"]
        )

    def test_debug_transcript_collapses(self):
        self.assertAlmostEqual(
            self.result()["debug_transcript_control"]["residual_privacy_bits"],0.0,places=12
        )

    def test_verify_refusal(self):
        r=m.action_receipt(("VERIFIER_A",),m.VERIFY_ONLY)
        self.assertEqual(r["refusal"],"REFUSE_VERIFICATION_QUORUM")

    def test_declassify_pair_refusal(self):
        r=m.action_receipt(("VERIFIER_A","VERIFIER_B"),m.DECLASSIFY)
        self.assertEqual(r["refusal"],"REFUSE_DECLASSIFICATION_QUORUM")

    def test_refusals_contain_no_public_output(self):
        for c in m.coalitions():
            for action in (m.VERIFY_ONLY,m.DECLASSIFY):
                r=m.action_receipt(c,action)
                if r["authority"]=="DENY":
                    self.assertNotIn("public_output",r)

    def test_fresh_e1_is_point_four(self):
        self.assertAlmostEqual(self.result()["fresh_e1"]["residual_privacy_bits"],0.4,places=12)

    def test_replay_exact(self):
        self.assertEqual(m.canonical(m.run_experiment()),m.canonical(m.run_experiment()))

if __name__=="__main__":
    unittest.main()

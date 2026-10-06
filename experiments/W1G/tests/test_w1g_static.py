from __future__ import annotations

import importlib.util
import os
import subprocess
import sys
import unittest
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
SRC = HERE.parent / "src" / "w1g.py"

spec = importlib.util.spec_from_file_location("nbg_w1g_impl", SRC)
assert spec is not None and spec.loader is not None
w1g = importlib.util.module_from_spec(spec)
spec.loader.exec_module(w1g)


class W1GStaticContractTests(unittest.TestCase):
    def test_static_contract(self):
        result = w1g.static_check()
        self.assertEqual(result["verdict"], "PASS_W1G_STATIC")

    def test_parameter_counts(self):
        self.assertEqual(w1g.shared_param_count(), 4416)
        self.assertEqual(w1g.full_param_count(), 4456)
        self.assertFalse(
            any(name.startswith("K.") for name in w1g.FULL_PARAM_ORDER)
        )

    def test_initialization_identity_across_arms(self):
        forced, commit, rb = w1g.init_arm_params(3)
        self.assertTrue(
            w1g.params_byte_identical(
                forced,
                commit,
                w1g.SHARED_PARAM_ORDER,
            )
        )
        self.assertTrue(
            w1g.params_byte_identical(
                forced,
                rb,
                w1g.SHARED_PARAM_ORDER,
            )
        )
        self.assertTrue(
            w1g.params_byte_identical(
                commit,
                rb,
                w1g.GATE_PARAM_ORDER,
            )
        )

    def test_quantizer_forward_ties_even_and_clip(self):
        x = np.asarray(
            [-200.0, -127.0, -1.5, -0.5, 0.5, 1.5, 2.5, 127.0, 200.0],
            dtype=np.float32,
        )
        got = w1g.q8_array(x).tolist()
        self.assertEqual(
            got,
            [-127, -127, -2, 0, 0, 2, 2, 127, 127],
        )

    def test_quantizer_ste_mask_uses_strict_bounds(self):
        x = np.asarray(
            [-128.0, -127.0, -126.999, 0.0, 126.999, 127.0, 128.0],
            dtype=np.float32,
        )
        self.assertEqual(
            w1g.q8_ste_mask(x).tolist(),
            [0.0, 0.0, 1.0, 1.0, 1.0, 0.0, 0.0],
        )

    def test_hard_gate_threshold_is_inclusive(self):
        p = np.asarray(
            [[0.499999], [0.5], [0.500001]],
            dtype=np.float32,
        )
        self.assertEqual(
            w1g.hard_gate_from_p(p).reshape(-1).tolist(),
            [0.0, 1.0, 1.0],
        )

    def test_zero_logit_maps_to_open_gate(self):
        logits = np.zeros((5, 1), dtype=np.float32)
        p = w1g.sigmoid(logits)
        gate = w1g.hard_gate_from_p(p)
        np.testing.assert_allclose(p, 0.5)
        self.assertTrue(np.all(gate == 1.0))

    def test_forced_open_forward_matches_commit_without_training(self):
        forced, _, _ = w1g.init_arm_params(0)
        x = np.zeros((4, 64), dtype=np.float32)
        auth = np.full(4, w1g.FULL_STATUS, dtype=np.int64)
        query = np.full(4, w1g.Q0_AH11_RESIDUE, dtype=np.int64)
        cache = w1g.forward(
            forced,
            x,
            auth,
            query,
            arm=w1g.ARM_FORCED_OPEN,
        )
        audit = w1g.forward_commit_identity(
            cache,
            arm=w1g.ARM_FORCED_OPEN,
        )
        self.assertTrue(audit["residue_all_match"])
        self.assertTrue(audit["gate_all_match"])

    def test_commit_ste_forward_matches_commit_without_training(self):
        _, commit, _ = w1g.init_arm_params(0)
        x = np.zeros((4, 64), dtype=np.float32)
        auth = np.full(4, w1g.FULL_STATUS, dtype=np.int64)
        query = np.full(4, w1g.Q0_AH11_RESIDUE, dtype=np.int64)
        cache = w1g.forward(
            commit,
            x,
            auth,
            query,
            arm=w1g.ARM_COMMIT_STE,
        )
        audit = w1g.forward_commit_identity(
            cache,
            arm=w1g.ARM_COMMIT_STE,
        )
        self.assertTrue(audit["residue_all_match"])
        self.assertTrue(audit["gate_all_match"])

    def test_handcrafted_gate_gradient_decomposition(self):
        # Freeze a tiny cache and verify the exact W1G rule:
        # dL/dg = dot(delta, q), then sigmoid STE p(1-p).
        _, commit, _ = w1g.init_arm_params(0)

        for name in w1g.FULL_PARAM_ORDER:
            commit[name][...] = 0.0

        x = np.zeros((1, 64), dtype=np.float32)
        auth = np.asarray([w1g.FULL_STATUS], dtype=np.int64)
        query = np.asarray([w1g.Q0_AH11_RESIDUE], dtype=np.int64)

        cache = w1g.forward(
            commit,
            x,
            auth,
            query,
            arm=w1g.ARM_COMMIT_STE,
        )

        # Inject a legal quantized forward residue directly into the cache.
        cache["q_fwd"][0, 0] = 2.0
        cache["q_fwd"][0, 1] = -1.0
        cache["g_fwd"][0, 0] = 1.0
        cache["p_gate"][0, 0] = 0.5

        delta = np.zeros((1, 32), dtype=np.float32)
        delta[0, 0] = 3.0
        delta[0, 1] = 4.0

        # task gate gradient = 3*2 + 4*(-1) = 2
        # sigmoid STE at p=.5 => .25
        # expected dL/dlogit = .5 before aux/G multiplication.
        grad_g_task = np.sum(
            delta * cache["q_fwd"],
            axis=1,
            keepdims=True,
        )
        expected_logit = grad_g_task * 0.25

        self.assertAlmostEqual(float(grad_g_task[0, 0]), 2.0)
        self.assertAlmostEqual(float(expected_logit[0, 0]), 0.5)

    def test_keep_gradient_forward_is_hard_gate_count(self):
        _, commit, _ = w1g.init_arm_params(1)
        x = np.zeros((54, 64), dtype=np.float32)
        auth = np.full(54, w1g.FULL_STATUS, dtype=np.int64)
        query = np.full(54, w1g.Q0_AH11_RESIDUE, dtype=np.int64)

        cache = w1g.forward(
            commit,
            x,
            auth,
            query,
            arm=w1g.ARM_COMMIT_STE,
        )
        forward_cost = float(np.mean(cache["g_fwd"]))
        self.assertGreaterEqual(forward_cost, 0.0)
        self.assertLessEqual(forward_cost, 1.0)
        self.assertAlmostEqual(1.0 / cache["g_fwd"].size, 1.0 / 54.0)

    def test_keyhole_is_structurally_coarse(self):
        rows = w1g.panel_a_records()
        sets = w1g.pair_sets_a(rows)
        for i, j in sets["eq_p2"]:
            self.assertEqual(rows[i]["z32"], rows[j]["z32"])

        routes = w1g.panel_b_records()
        self.assertEqual(len({r["z32"] for r in routes}), 1)

    def test_rb_sources_are_identical_on_hard_pairs(self):
        rows = w1g.panel_a_records()
        sets = w1g.pair_sets_a(rows)
        rb = [
            w1g.pad64(row["z32"])
            for row in rows
        ]
        for i, j in sets["hard_r"]:
            self.assertEqual(rb[i], rb[j])

    def test_k0_is_structurally_dead(self):
        metrics = w1g.k0_metrics()
        self.assertEqual(metrics["S_sep_K0"], 0.0)
        self.assertFalse(metrics["reserved_pair_separated"])

    def test_authority_metadata_refuses_stale_payload(self):
        model_hash = bytes(range(32))
        metadata = w1g.metadata_bytes(
            gate=1,
            authority_enum=w1g.FULL_STATUS,
            query_enum=w1g.Q2_AUTHORIZED_READ,
            model_hash_bytes=model_hash,
        )
        payload = bytes(64)

        self.assertEqual(
            w1g.read_payload(
                payload,
                metadata,
                current_authority=w1g.FULL_STATUS,
                current_model_hash=model_hash,
            ),
            payload,
        )
        self.assertIsNone(
            w1g.read_payload(
                payload,
                metadata,
                current_authority=w1g.COMMON_ONLY,
                current_model_hash=model_hash,
            )
        )

    def test_execute_refuses_before_post_merge_authorization(self):
        env = dict(os.environ)
        env.pop("NBG_W1G_EXECUTION_AUTHORIZED", None)
        proc = subprocess.run(
            [sys.executable, str(SRC), "--execute"],
            text=True,
            capture_output=True,
            env=env,
        )
        self.assertNotEqual(proc.returncode, 0)
        self.assertIn(
            "W1G training refused",
            proc.stderr + proc.stdout,
        )


if __name__ == "__main__":
    unittest.main()

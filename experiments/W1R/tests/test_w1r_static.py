from __future__ import annotations

import importlib.util
import subprocess
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE.parent / "src" / "w1r.py"

spec = importlib.util.spec_from_file_location("nbg_w1r_impl", SRC)
assert spec is not None and spec.loader is not None
w1r = importlib.util.module_from_spec(spec)
spec.loader.exec_module(w1r)


class W1RStaticContractTests(unittest.TestCase):
    def test_static_contract(self):
        result = w1r.static_check()
        self.assertEqual(result["verdict"], "PASS_W1R_STATIC")

    def test_parameter_count_and_no_learned_keyhole(self):
        self.assertEqual(w1r.parameter_count(), 4456)
        self.assertFalse(any(name.startswith("K.") for name in w1r.PARAM_ORDER))
        self.assertEqual(
            list(w1r.PARAM_ORDER),
            [
                "E1.weight", "E1.bias",
                "E2.weight", "E2.bias",
                "R.weight", "R.bias",
                "G.weight", "G.bias",
            ],
        )

    def test_panel_a_equal_p2_is_byte_identical_keyhole(self):
        rows = w1r.panel_a_records()
        sets = w1r.pair_sets_a(rows)
        for i, j in sets["eq_p2"]:
            self.assertEqual(rows[i]["z32"], rows[j]["z32"])
            self.assertEqual(len(rows[i]["z32"]), 32)

    def test_panel_b_all_routes_share_ready_keyhole(self):
        rows = w1r.panel_b_records()
        self.assertEqual(len({row["z32"] for row in rows}), 1)
        self.assertEqual(rows[0]["z32"], (1,) + (0,) * 31)

    def test_k0_cannot_separate_hidden_pairs(self):
        metrics = w1r.k0_metrics()
        self.assertEqual(metrics["S_sep_K0"], 0.0)
        self.assertFalse(metrics["reserved_pair_separated"])

    def test_rb_hard_pair_inputs_are_identical(self):
        rows = w1r.panel_a_records()
        sets = w1r.pair_sets_a(rows)
        rb_sources = [w1r.pad64(row["z32"]) for row in rows]
        for i, j in sets["hard_r"]:
            self.assertEqual(rb_sources[i], rb_sources[j])

    def test_rb_route_inputs_are_identical(self):
        rows = [r for r in w1r.panel_b_records() if r["split"] == "train"]
        sources = [w1r.pad64(w1r.keyhole_b_ready()) for _ in rows]
        self.assertEqual(len(set(sources)), 1)

    def test_canonical_ah11_witness_is_residue_required(self):
        rows = w1r.panel_a_records()
        sets = w1r.pair_sets_a(rows)
        ia = next(
            i for i, row in enumerate(rows)
            if row["U"] == "I" and row["V"] == "A" and row["k"] == 0
        )
        ai = next(
            i for i, row in enumerate(rows)
            if row["U"] == "A" and row["V"] == "I" and row["k"] == 0
        )
        self.assertIn(
            tuple(sorted((ia, ai))),
            {tuple(sorted(pair)) for pair in sets["hard_r"]},
        )
        self.assertEqual(rows[ia]["z32"], rows[ai]["z32"])

    def test_route_split_is_frozen(self):
        rows = w1r.panel_b_records()
        self.assertEqual(
            [r["name"] for r in rows if r["split"] == "train"],
            ["R00", "R01", "R02", "R03", "R04", "R05"],
        )
        self.assertEqual(
            [r["name"] for r in rows if r["split"] == "validation"],
            ["R06", "R07", "R08"],
        )
        self.assertEqual(
            [r["name"] for r in rows if r["split"] == "test"],
            ["R09", "R10", "R11"],
        )
        self.assertEqual(
            [r["name"] for r in rows if r["split"] == "reserved"],
            ["NORTH", "SOUTH"],
        )

    def test_int8_rounding_and_metadata_contract(self):
        self.assertEqual(
            [w1r.q8_scalar(x) for x in (0.5, 1.5, 2.5, -0.5, -1.5)],
            [0, 2, 2, 0, -2],
        )
        self.assertEqual(w1r.q8_scalar(999), 127)
        self.assertEqual(w1r.q8_scalar(-999), -127)

        metadata = w1r.metadata_bytes(
            gate=1,
            authority_enum=w1r.FULL_STATUS,
            query_enum=w1r.Q2_AUTHORIZED_READ,
            model_hash_bytes=bytes(32),
        )
        self.assertEqual(len(metadata), 67)

    def test_authority_gate_refuses_stale_payload(self):
        model_hash = bytes(range(32))
        metadata = w1r.metadata_bytes(
            gate=1,
            authority_enum=w1r.FULL_STATUS,
            query_enum=w1r.Q2_AUTHORIZED_READ,
            model_hash_bytes=model_hash,
        )
        payload = bytes(64)

        self.assertEqual(
            w1r.read_payload(
                payload,
                metadata,
                current_authority=w1r.FULL_STATUS,
                current_model_hash=model_hash,
            ),
            payload,
        )
        self.assertIsNone(
            w1r.read_payload(
                payload,
                metadata,
                current_authority=w1r.COMMON_ONLY,
                current_model_hash=model_hash,
            )
        )

    def test_epistemic_fields_are_not_model_inputs(self):
        manifest = w1r.model_input_manifest()
        self.assertEqual(
            manifest["allowed"],
            ["authority_enum", "query_enum", "x64"],
        )
        forbidden = set(manifest["forbidden"])
        for field in (
            "origin",
            "confidence",
            "evidenceId",
            "lineage",
            "recordFingerprint",
        ):
            self.assertIn(field, forbidden)

    def test_execute_refuses_before_post_merge_authorization(self):
        proc = subprocess.run(
            [sys.executable, str(SRC), "--execute"],
            text=True,
            capture_output=True,
            env={},
        )
        self.assertNotEqual(proc.returncode, 0)
        self.assertIn("W1R training refused", proc.stderr + proc.stdout)


if __name__ == "__main__":
    unittest.main()

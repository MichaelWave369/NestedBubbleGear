from __future__ import annotations

import importlib.util
import subprocess
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE.parent / "src" / "w1.py"

spec = importlib.util.spec_from_file_location("nbg_w1_impl", SRC)
assert spec is not None and spec.loader is not None
w1 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(w1)


class W1StaticContractTests(unittest.TestCase):
    def test_static_contract(self):
        result = w1.static_check()
        self.assertEqual(result["verdict"], "PASS_W1_STATIC")

    def test_parameter_count(self):
        self.assertEqual(w1.parameter_count(), 5512)

    def test_int8_rounding_and_clipping(self):
        self.assertEqual(
            [w1.q8_scalar(x) for x in (0.5, 1.5, 2.5, -0.5, -1.5)],
            [0, 2, 2, 0, -2],
        )
        self.assertEqual(w1.q8_scalar(1000), 127)
        self.assertEqual(w1.q8_scalar(-1000), -127)

    def test_metadata_exactly_67_bytes_and_authority_gates_read(self):
        model_hash = bytes(range(32))
        meta = w1.metadata_bytes(
            gate=1,
            authority_enum=w1.FULL_STATUS,
            query_enum=w1.Q2_AUTHORIZED_READ,
            model_hash_bytes=model_hash,
        )
        payload = bytes(range(64))
        self.assertEqual(len(meta), 67)
        self.assertEqual(
            w1.read_payload(
                payload,
                meta,
                current_authority=w1.FULL_STATUS,
                current_model_hash=model_hash,
            ),
            payload,
        )
        self.assertIsNone(
            w1.read_payload(
                payload,
                meta,
                current_authority=w1.COMMON_ONLY,
                current_model_hash=model_hash,
            )
        )

    def test_route_split_and_reserved_pair(self):
        rows = w1.panel_b_records()
        self.assertEqual(
            [r["name"] for r in rows if r["split"] == "train"],
            [f"R{i:02d}" for i in range(6)],
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

    def test_common_projection_erases_route(self):
        rows = w1.panel_b_records()
        self.assertEqual(
            len({w1.route_source(r, w1.COMMON_ONLY) for r in rows}),
            1,
        )

    def test_ah11_canonical_witness_is_in_hard_set(self):
        rows = w1.panel_a_records()
        sets = w1.pair_sets_a(rows)
        ia = next(
            i for i, r in enumerate(rows)
            if r["U"] == "I" and r["V"] == "A" and r["k"] == 0
        )
        ai = next(
            i for i, r in enumerate(rows)
            if r["U"] == "A" and r["V"] == "I" and r["k"] == 0
        )
        self.assertIn(tuple(sorted((ia, ai))), {tuple(sorted(p)) for p in sets["hard"]})

    def test_execute_refuses_without_post_merge_authorization(self):
        proc = subprocess.run(
            [sys.executable, str(SRC), "--execute"],
            text=True,
            capture_output=True,
            env={},
        )
        self.assertNotEqual(proc.returncode, 0)
        self.assertIn("W1 training refused", proc.stderr + proc.stdout)


if __name__ == "__main__":
    unittest.main()

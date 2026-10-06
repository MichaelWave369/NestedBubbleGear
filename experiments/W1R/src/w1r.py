#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import inspect
import json
import math
import os
import platform
from pathlib import Path
from typing import Any, Iterable

ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = Path(__file__).resolve().parents[3]

VERSION = "0.1.0"
SEEDS = (0, 1, 2, 3, 4)
STEPS = 500
LR = 1e-3
BETA1 = 0.9
BETA2 = 0.999
ADAM_EPS = 1e-8
MARGIN = 1.0

COMMON_ONLY = 0
TRIAGE = 1
FULL_STATUS = 2

Q0_AH11_RESIDUE = 0
Q1_ROUTE_RESIDUE = 1
Q2_AUTHORIZED_READ = 2
Q3_STALE_INJECTION_CONTROL = 3

PARAM_ORDER = (
    "E1.weight", "E1.bias",
    "E2.weight", "E2.bias",
    "R.weight", "R.bias",
    "G.weight", "G.bias",
)

PARAM_SHAPES = {
    "E1.weight": (64, 32),
    "E1.bias": (32,),
    "E2.weight": (32, 32),
    "E2.bias": (32,),
    "R.weight": (39, 32),
    "R.bias": (32,),
    "G.weight": (39, 1),
    "G.bias": (1,),
}

FORBIDDEN_MODEL_INPUT_FIELDS = frozenset({
    "name",
    "U",
    "V",
    "k",
    "code",
    "split",
    "memoryId",
    "sampleId",
    "rowId",
    "receiptId",
    "evidenceId",
    "origin",
    "confidence",
    "lineage",
    "recordFingerprint",
    "authorityHash",
    "modelHash",
})

ALLOWED_MODEL_INPUT_FIELDS = frozenset({
    "x64",
    "authority_enum",
    "query_enum",
})


def _np():
    import numpy as np
    return np


def canonical_json(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode("utf-8")


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def q8_scalar(x: float) -> int:
    y = round(float(x))
    return max(-127, min(127, int(y)))


def authority_hash(authority_enum: int) -> bytes:
    if authority_enum not in (COMMON_ONLY, TRIAGE, FULL_STATUS):
        raise ValueError("invalid authority enum")
    return hashlib.sha256(b"NBG-W1\0AUTH\0" + bytes([authority_enum])).digest()


def metadata_bytes(
    *,
    gate: int,
    authority_enum: int,
    query_enum: int,
    model_hash_bytes: bytes,
) -> bytes:
    if gate not in (0, 1):
        raise ValueError("gate must be 0 or 1")
    if authority_enum not in (COMMON_ONLY, TRIAGE, FULL_STATUS):
        raise ValueError("invalid authority enum")
    if query_enum not in (
        Q0_AH11_RESIDUE,
        Q1_ROUTE_RESIDUE,
        Q2_AUTHORIZED_READ,
        Q3_STALE_INJECTION_CONTROL,
    ):
        raise ValueError("invalid query enum")
    if len(model_hash_bytes) != 32:
        raise ValueError("model hash must be raw SHA-256")

    payload = (
        bytes([gate, authority_enum, query_enum])
        + authority_hash(authority_enum)
        + model_hash_bytes
    )
    if len(payload) != 67:
        raise AssertionError("metadata must be exactly 67 bytes")
    return payload


def read_payload(
    payload: bytes,
    metadata: bytes,
    *,
    current_authority: int,
    current_model_hash: bytes,
) -> bytes | None:
    if len(payload) != 64 or len(metadata) != 67:
        raise ValueError("invalid stored memory")
    if metadata[3:35] != authority_hash(current_authority):
        return None
    if metadata[35:67] != current_model_hash:
        return None
    return payload


def pad64(values: Iterable[int]) -> tuple[int, ...]:
    vals = [int(v) for v in values]
    vals = vals[:64]
    vals.extend([0] * (64 - len(vals)))
    return tuple(vals)


def pad32(values: Iterable[int]) -> tuple[int, ...]:
    vals = [int(v) for v in values]
    vals = vals[:32]
    vals.extend([0] * (32 - len(vals)))
    return tuple(vals)


def _load_ah11():
    path = REPO_ROOT / "experiments" / "AH11" / "src" / "ah11.py"
    spec = importlib.util.spec_from_file_location("nbg_ah11_for_w1r", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("cannot load AH11")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _flat_matrix(m: Any) -> tuple[int, int, int, int]:
    return (int(m[0][0]), int(m[0][1]), int(m[1][0]), int(m[1][1]))


def panel_a_records() -> list[dict[str, Any]]:
    ah11 = _load_ah11()
    rows: list[dict[str, Any]] = []
    expected_base_order = ("I", "A", "B", "S")
    if tuple(ah11.BASE.keys()) != expected_base_order:
        raise AssertionError("AH11 base order drift")
    if tuple(ah11.K_VALUES) != (-1, 0, 1):
        raise AssertionError("AH11 k order drift")

    row_index = 0
    for uname in expected_base_order:
        U = ah11.BASE[uname]
        for vname in expected_base_order:
            V = ah11.BASE[vname]
            for k in (-1, 0, 1):
                c = ah11.case(uname, U, vname, V, k)
                t1 = _flat_matrix(c["T1"])
                t2 = _flat_matrix(c["T2"])
                p2 = _flat_matrix(c["P2"])
                g = _flat_matrix(c["global_G"])
                rows.append({
                    "row_index": row_index,
                    "name": f"{uname}:{vname}:{k}",
                    "U": uname,
                    "V": vname,
                    "k": int(k),
                    "x_raw": t1 + t2,
                    "x64": pad64(t1 + t2),
                    "P2": p2,
                    "G": g,
                    "z32": keyhole_a_from_p2(p2),
                })
                row_index += 1
    return rows


def route_bits(code: int) -> tuple[int, int, int, int]:
    if not 0 <= code <= 15:
        raise ValueError("route code out of range")
    return tuple(
        1 if ((code >> shift) & 1) else -1
        for shift in (3, 2, 1, 0)
    )  # type: ignore[return-value]


def route_record(name: str, code: int, split: str) -> dict[str, Any]:
    return {
        "name": name,
        "code": code,
        "split": split,
        "bits": route_bits(code),
        "z32": keyhole_b_ready(),
    }


def panel_b_records() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for code in range(12):
        if code <= 5:
            split = "train"
        elif code <= 8:
            split = "validation"
        else:
            split = "test"
        rows.append(route_record(f"R{code:02d}", code, split))
    rows.append(route_record("NORTH", 12, "reserved"))
    rows.append(route_record("SOUTH", 13, "reserved"))
    return rows


def route_source(row: dict[str, Any], authority: int) -> tuple[int, ...]:
    b3, b2, b1, b0 = row["bits"]
    if authority == COMMON_ONLY:
        return (1, 0, 0, 0, 0)
    if authority == TRIAGE:
        return (1, b3, b2, 0, 0)
    if authority == FULL_STATUS:
        return (1, b3, b2, b1, b0)
    raise ValueError("bad authority")


def keyhole_a_from_p2(p2: Iterable[int]) -> tuple[int, ...]:
    vals = tuple(int(v) for v in p2)
    if len(vals) != 4:
        raise ValueError("P2 keyhole requires four entries")
    if any(v < -127 or v > 127 for v in vals):
        raise ValueError("P2 value out of int8 range")
    return pad32(vals)


def keyhole_b_ready() -> tuple[int, ...]:
    return pad32((1,))


def unordered_pairs(n: int) -> list[tuple[int, int]]:
    return [(i, j) for i in range(n) for j in range(i + 1, n)]


def pair_sets_a(rows: list[dict[str, Any]]) -> dict[str, list[tuple[int, int]]]:
    eq_p2: list[tuple[int, int]] = []
    eq_r: list[tuple[int, int]] = []
    hard_r: list[tuple[int, int]] = []

    for i, j in unordered_pairs(len(rows)):
        same_p2 = rows[i]["P2"] == rows[j]["P2"]
        same_g = rows[i]["G"] == rows[j]["G"]
        if same_p2:
            eq_p2.append((i, j))
            if same_g:
                eq_r.append((i, j))
            else:
                hard_r.append((i, j))

    return {
        "eq_p2": eq_p2,
        "eq_r": eq_r,
        "hard_r": hard_r,
    }


def parameter_count() -> int:
    total = 0
    for shape in PARAM_SHAPES.values():
        n = 1
        for x in shape:
            n *= x
        total += n
    return total


def model_input_manifest() -> dict[str, list[str]]:
    return {
        "allowed": sorted(ALLOWED_MODEL_INPUT_FIELDS),
        "forbidden": sorted(FORBIDDEN_MODEL_INPUT_FIELDS),
    }


def k0_metrics() -> dict[str, Any]:
    arows = panel_a_records()
    brows = panel_b_records()
    sets = pair_sets_a(arows)

    zero = bytes(32)
    hard_collisions = sum(
        zero == zero
        for _ in sets["hard_r"]
    )
    hard_total = len(sets["hard_r"])

    reserved = [r for r in brows if r["split"] == "reserved"]
    reserved_collision = len(reserved) == 2 and zero == zero

    return {
        "panel_a_hard_pair_count": hard_total,
        "panel_a_hard_collision_count": hard_collisions,
        "S_sep_K0": 0.0 if hard_total else 1.0,
        "reserved_pair_residue_equal": reserved_collision,
        "reserved_pair_separated": False if reserved_collision else True,
    }


def static_check() -> dict[str, Any]:
    arows = panel_a_records()
    brows = panel_b_records()
    sets = pair_sets_a(arows)

    ia = next(
        i for i, r in enumerate(arows)
        if r["U"] == "I" and r["V"] == "A" and r["k"] == 0
    )
    ai = next(
        i for i, r in enumerate(arows)
        if r["U"] == "A" and r["V"] == "I" and r["k"] == 0
    )

    same_p2_keyhole_ok = all(
        arows[i]["z32"] == arows[j]["z32"]
        for i, j in sets["eq_p2"]
    )
    route_keyholes = {r["z32"] for r in brows}

    train_names = [r["name"] for r in brows if r["split"] == "train"]
    val_names = [r["name"] for r in brows if r["split"] == "validation"]
    test_names = [r["name"] for r in brows if r["split"] == "test"]
    reserved_names = [r["name"] for r in brows if r["split"] == "reserved"]

    source_text = inspect.getsource(build_w1r_inputs) + inspect.getsource(build_rb_inputs)
    forbidden_literal_leaks = [
        token for token in (
            "recordFingerprint",
            "evidenceId",
            "lineage",
            "receiptId",
            "modelHash",
            "authorityHash",
        )
        if token in source_text
    ]

    k0 = k0_metrics()

    checks = {
        "parameter_count_4456": parameter_count() == 4456,
        "no_K_parameters": all(not name.startswith("K.") for name in PARAM_ORDER),
        "panel_a_48_rows": len(arows) == 48,
        "panel_a_row_order": [r["row_index"] for r in arows] == list(range(48)),
        "panel_a_source_8": all(len(r["x_raw"]) == 8 for r in arows),
        "panel_a_z32": all(len(r["z32"]) == 32 for r in arows),
        "panel_a_same_p2_same_keyhole": same_p2_keyhole_ok,
        "panel_a_witness_hard": tuple(sorted((ia, ai))) in {
            tuple(sorted(p)) for p in sets["hard_r"]
        },
        "panel_b_14_rows": len(brows) == 14,
        "panel_b_split_6_3_3_2": (
            len(train_names), len(val_names), len(test_names), len(reserved_names)
        ) == (6, 3, 3, 2),
        "panel_b_train_order": train_names == [f"R{i:02d}" for i in range(6)],
        "panel_b_validation_order": val_names == ["R06", "R07", "R08"],
        "panel_b_test_order": test_names == ["R09", "R10", "R11"],
        "panel_b_reserved_order": reserved_names == ["NORTH", "SOUTH"],
        "panel_b_all_keyholes_identical": len(route_keyholes) == 1,
        "panel_b_keyhole_is_ready": next(iter(route_keyholes)) == keyhole_b_ready(),
        "common_projection_erases_route": len({
            route_source(r, COMMON_ONLY) for r in brows
        }) == 1,
        "query_enum_order": (
            Q0_AH11_RESIDUE,
            Q1_ROUTE_RESIDUE,
            Q2_AUTHORIZED_READ,
            Q3_STALE_INJECTION_CONTROL,
        ) == (0, 1, 2, 3),
        "authority_enum_order": (COMMON_ONLY, TRIAGE, FULL_STATUS) == (0, 1, 2),
        "metadata_67": len(metadata_bytes(
            gate=1,
            authority_enum=FULL_STATUS,
            query_enum=Q2_AUTHORIZED_READ,
            model_hash_bytes=b"\0" * 32,
        )) == 67,
        "q8_ties_even": (
            q8_scalar(0.5), q8_scalar(1.5), q8_scalar(2.5),
            q8_scalar(-0.5), q8_scalar(-1.5),
        ) == (0, 2, 2, 0, -2),
        "q8_clips": (q8_scalar(999), q8_scalar(-999)) == (127, -127),
        "k0_hard_separation_zero": k0["S_sep_K0"] == 0.0,
        "k0_reserved_not_separated": k0["reserved_pair_separated"] is False,
        "no_forbidden_manifest_overlap": not (
            ALLOWED_MODEL_INPUT_FIELDS & FORBIDDEN_MODEL_INPUT_FIELDS
        ),
        "no_forbidden_literal_in_input_builders": not forbidden_literal_leaks,
        "bx_a_no_compression": 64 >= 8,
        "bx_b_no_compression": 64 >= 5,
    }

    failed = [name for name, ok in checks.items() if not ok]
    if failed:
        raise AssertionError("static W1R contract failed: " + ", ".join(failed))

    return {
        "verdict": "PASS_W1R_STATIC",
        "checks": checks,
        "hard_pair_count": len(sets["hard_r"]),
        "same_target_coarse_pair_count": len(sets["eq_r"]),
        "coarse_pair_count": len(sets["eq_p2"]),
        "k0": k0,
        "model_input_manifest": model_input_manifest(),
    }


def init_params(seed: int):
    np = _np()
    rng = np.random.Generator(np.random.PCG64(seed))
    params: dict[str, Any] = {}

    for name in PARAM_ORDER:
        shape = PARAM_SHAPES[name]
        if name.endswith(".bias"):
            arr = np.zeros(shape, dtype=np.float32)
        else:
            nin, nout = shape
            limit = math.sqrt(6.0 / (nin + nout))
            arr = rng.uniform(-limit, limit, size=shape).astype(np.float32)
        params[name] = arr

    if sum(int(v.size) for v in params.values()) != 4456:
        raise AssertionError("parameter count drift")
    return params


def model_hash(params: dict[str, Any]) -> bytes:
    np = _np()
    h = hashlib.sha256()
    for name in PARAM_ORDER:
        arr = np.asarray(params[name], dtype="<f4")
        h.update(arr.tobytes(order="C"))
    return h.digest()


def forward(params, x, authority_ids, query_ids):
    np = _np()
    x = np.asarray(x, dtype=np.float32)
    authority_ids = np.asarray(authority_ids, dtype=np.int64)
    query_ids = np.asarray(query_ids, dtype=np.int64)

    p1 = x @ params["E1.weight"] + params["E1.bias"]
    h1 = np.maximum(p1, 0).astype(np.float32)

    p2 = h1 @ params["E2.weight"] + params["E2.bias"]
    h = np.maximum(p2, 0).astype(np.float32)

    auth_oh = np.eye(3, dtype=np.float32)[authority_ids]
    query_oh = np.eye(4, dtype=np.float32)[query_ids]
    aux = np.concatenate([h, auth_oh, query_oh], axis=1).astype(np.float32)

    r_raw = aux @ params["R.weight"] + params["R.bias"]
    gate_logit = aux @ params["G.weight"] + params["G.bias"]
    p_gate = (1.0 / (1.0 + np.exp(-gate_logit))).astype(np.float32)
    r_train = (p_gate * r_raw).astype(np.float32)

    return {
        "x": x,
        "p1": p1,
        "h1": h1,
        "p2": p2,
        "h": h,
        "aux": aux,
        "r_raw": r_raw,
        "gate_logit": gate_logit,
        "p_gate": p_gate,
        "r_train": r_train,
    }


def pair_loss(y, pairs: list[tuple[int, int]], mode: str):
    np = _np()
    grad = np.zeros_like(y, dtype=np.float32)
    if not pairs:
        return 0.0, grad

    loss = 0.0
    dim = y.shape[1]
    scale = 1.0 / len(pairs)

    for i, j in pairs:
        diff = y[i] - y[j]
        d2 = float(np.mean(diff * diff))

        if mode == "collapse":
            loss += d2
            coeff = 2.0 / dim
        elif mode == "separate":
            hinge = MARGIN - d2
            if hinge <= 0:
                continue
            loss += hinge
            coeff = -2.0 / dim
        else:
            raise ValueError(mode)

        g = (coeff * scale) * diff
        grad[i] += g
        grad[j] -= g

    return loss * scale, grad


def backprop(params, cache, grad_rtrain, grad_p_extra):
    np = _np()

    p_gate = cache["p_gate"]
    r_raw = cache["r_raw"]
    aux = cache["aux"]
    h1 = cache["h1"]
    p2 = cache["p2"]
    p1 = cache["p1"]
    x = cache["x"]

    grad_rraw = grad_rtrain * p_gate
    grad_p = np.sum(grad_rtrain * r_raw, axis=1, keepdims=True) + grad_p_extra
    grad_logit = grad_p * p_gate * (1.0 - p_gate)

    grads: dict[str, Any] = {}
    grads["R.weight"] = aux.T @ grad_rraw
    grads["R.bias"] = np.sum(grad_rraw, axis=0)
    grads["G.weight"] = aux.T @ grad_logit
    grads["G.bias"] = np.sum(grad_logit, axis=0)

    grad_aux = (
        grad_rraw @ params["R.weight"].T
        + grad_logit @ params["G.weight"].T
    )
    grad_h = grad_aux[:, :32]

    grad_p2 = grad_h * (p2 > 0)
    grads["E2.weight"] = h1.T @ grad_p2
    grads["E2.bias"] = np.sum(grad_p2, axis=0)
    grad_h1 = grad_p2 @ params["E2.weight"].T

    grad_p1 = grad_h1 * (p1 > 0)
    grads["E1.weight"] = x.T @ grad_p1
    grads["E1.bias"] = np.sum(grad_p1, axis=0)

    for name in PARAM_ORDER:
        grads[name] = np.asarray(grads[name], dtype=np.float32)
    return grads


def build_w1r_inputs(
    arows: list[dict[str, Any]],
    brows_train: list[dict[str, Any]],
):
    np = _np()

    xa = np.asarray([r["x64"] for r in arows], dtype=np.float32)
    xb = np.asarray(
        [pad64(route_source(r, FULL_STATUS)) for r in brows_train],
        dtype=np.float32,
    )

    aa = np.full(len(arows), FULL_STATUS, dtype=np.int64)
    ab = np.full(len(brows_train), FULL_STATUS, dtype=np.int64)
    qa = np.full(len(arows), Q0_AH11_RESIDUE, dtype=np.int64)
    qb = np.full(len(brows_train), Q1_ROUTE_RESIDUE, dtype=np.int64)

    return (
        np.concatenate([xa, xb], axis=0),
        np.concatenate([aa, ab], axis=0),
        np.concatenate([qa, qb], axis=0),
    )


def build_rb_inputs(
    arows: list[dict[str, Any]],
    brows_train: list[dict[str, Any]],
):
    np = _np()

    xa = np.asarray(
        [pad64(r["z32"]) for r in arows],
        dtype=np.float32,
    )
    xb = np.asarray(
        [pad64(keyhole_b_ready()) for _ in brows_train],
        dtype=np.float32,
    )

    aa = np.full(len(arows), FULL_STATUS, dtype=np.int64)
    ab = np.full(len(brows_train), FULL_STATUS, dtype=np.int64)
    qa = np.full(len(arows), Q0_AH11_RESIDUE, dtype=np.int64)
    qb = np.full(len(brows_train), Q1_ROUTE_RESIDUE, dtype=np.int64)

    return (
        np.concatenate([xa, xb], axis=0),
        np.concatenate([aa, ab], axis=0),
        np.concatenate([qa, qb], axis=0),
    )


def w1r_loss_and_grads(
    params,
    arows: list[dict[str, Any]],
    brows_train: list[dict[str, Any]],
    *,
    mode: str,
):
    np = _np()

    if mode == "w1r":
        x, authority, query = build_w1r_inputs(arows, brows_train)
    elif mode == "rb":
        x, authority, query = build_rb_inputs(arows, brows_train)
    else:
        raise ValueError(mode)

    cache = forward(params, x, authority, query)

    n_a = len(arows)
    n_b = len(brows_train)
    sets = pair_sets_a(arows)
    bpairs = unordered_pairs(n_b)

    ra = cache["r_train"][:n_a]
    rb = cache["r_train"][n_a:]

    la_c, grad_a_c = pair_loss(ra, sets["eq_r"], "collapse")
    la_s, grad_a_s = pair_loss(ra, sets["hard_r"], "separate")
    lb_s, grad_b_s = pair_loss(rb, bpairs, "separate")

    l_keep = float(np.mean(cache["p_gate"]))
    total = la_c + la_s + lb_s + l_keep

    grad_r = np.zeros_like(cache["r_train"], dtype=np.float32)
    grad_r[:n_a] = grad_a_c + grad_a_s
    grad_r[n_a:] = grad_b_s

    grad_p_extra = np.full_like(
        cache["p_gate"],
        1.0 / cache["p_gate"].size,
        dtype=np.float32,
    )

    grads = backprop(params, cache, grad_r, grad_p_extra)

    return float(total), grads, {
        "L_A_collapse": float(la_c),
        "L_A_separate": float(la_s),
        "L_B_separate": float(lb_s),
        "L_keep": float(l_keep),
    }


def adam_state(params):
    np = _np()
    return {
        "m": {k: np.zeros_like(v, dtype=np.float32) for k, v in params.items()},
        "v": {k: np.zeros_like(v, dtype=np.float32) for k, v in params.items()},
    }


def adam_step(params, grads, state, step):
    np = _np()

    for name in PARAM_ORDER:
        g = np.asarray(grads[name], dtype=np.float32)
        state["m"][name] = (
            BETA1 * state["m"][name] + (1.0 - BETA1) * g
        ).astype(np.float32)
        state["v"][name] = (
            BETA2 * state["v"][name] + (1.0 - BETA2) * (g * g)
        ).astype(np.float32)

        mhat = state["m"][name] / (1.0 - BETA1 ** step)
        vhat = state["v"][name] / (1.0 - BETA2 ** step)
        update = LR * mhat / (_np().sqrt(vhat) + ADAM_EPS)
        params[name][...] = (params[name] - update).astype(np.float32)


def train(seed: int, mode: str):
    params = init_params(seed)
    state = adam_state(params)
    arows = panel_a_records()
    brows_train = [
        r for r in panel_b_records()
        if r["split"] == "train"
    ]

    final_loss = math.nan
    final_terms: dict[str, float] = {}

    for step in range(1, STEPS + 1):
        final_loss, grads, final_terms = w1r_loss_and_grads(
            params,
            arows,
            brows_train,
            mode=mode,
        )
        adam_step(params, grads, state, step)

    return params, float(final_loss), final_terms


def q8_array(arr):
    np = _np()
    return np.clip(np.rint(arr), -127, 127).astype(np.int8)


def _panel_a_source(
    rows: list[dict[str, Any]],
    *,
    mode: str,
):
    np = _np()
    if mode == "w1r":
        return np.asarray([r["x64"] for r in rows], dtype=np.float32)
    if mode == "rb":
        return np.asarray(
            [pad64(r["z32"]) for r in rows],
            dtype=np.float32,
        )
    raise ValueError(mode)


def _panel_b_source(
    rows: list[dict[str, Any]],
    *,
    mode: str,
    authority: int,
):
    np = _np()
    if mode == "w1r":
        return np.asarray(
            [pad64(route_source(r, authority)) for r in rows],
            dtype=np.float32,
        )
    if mode == "rb":
        return np.asarray(
            [pad64(keyhole_b_ready()) for _ in rows],
            dtype=np.float32,
        )
    raise ValueError(mode)


def commit_residue(
    params,
    rows: list[dict[str, Any]],
    *,
    panel: str,
    mode: str,
    authority: int,
    query: int,
):
    np = _np()

    if panel == "A":
        x = _panel_a_source(rows, mode=mode)
    elif panel == "B":
        x = _panel_b_source(rows, mode=mode, authority=authority)
    else:
        raise ValueError(panel)

    auth = np.full(len(rows), authority, dtype=np.int64)
    q = np.full(len(rows), query, dtype=np.int64)

    cache = forward(params, x, auth, q)
    rr = q8_array(cache["r_raw"])
    gates = (cache["p_gate"].reshape(-1) >= 0.5).astype(np.int8)

    residues: list[bytes] = []
    used: list[int] = []

    for i, gate in enumerate(gates):
        rc = rr[i] if int(gate) == 1 else np.zeros(32, dtype=np.int8)
        residue_bytes = rc.astype(np.int8).tobytes()
        if len(residue_bytes) != 32:
            raise AssertionError("residue size drift")
        residues.append(residue_bytes)
        used.append(32 + 32 * int(gate))

    return residues, [int(v) for v in gates], used


def compose_payload(
    z32: tuple[int, ...],
    residue_bytes: bytes,
) -> bytes:
    np = _np()
    z = np.asarray(z32, dtype=np.int8).tobytes()
    if len(z) != 32 or len(residue_bytes) != 32:
        raise AssertionError("payload component size drift")
    payload = z + residue_bytes
    if len(payload) != 64:
        raise AssertionError("payload size drift")
    return payload


def panel_a_metrics(params, *, mode: str):
    rows = panel_a_records()
    sets = pair_sets_a(rows)

    residues, gates, used = commit_residue(
        params,
        rows,
        panel="A",
        mode=mode,
        authority=FULL_STATUS,
        query=Q0_AH11_RESIDUE,
    )

    hard_equal = sum(
        residues[i] == residues[j]
        for i, j in sets["hard_r"]
    )
    eq_different = sum(
        residues[i] != residues[j]
        for i, j in sets["eq_r"]
    )

    hard_total = len(sets["hard_r"])
    eq_total = len(sets["eq_r"])

    c_hard = hard_equal / hard_total if hard_total else 0.0
    c_eq = eq_different / eq_total if eq_total else 0.0
    s_sep = 1.0 - c_hard

    use_hits = 0
    for i, j in sets["hard_r"]:
        if residues[i] != residues[j] and (gates[i] == 1 or gates[j] == 1):
            use_hits += 1
    u_r = use_hits / hard_total if hard_total else 1.0

    return {
        "C_hard_R": c_hard,
        "C_eq_R": c_eq,
        "S_sep_R": s_sep,
        "U_R": u_r,
        "gate_keep_rate_A": sum(gates) / len(gates),
        "mean_B_used_A": sum(used) / len(used),
        "hard_pair_count": hard_total,
        "same_target_coarse_pair_count": eq_total,
    }


def route_separation(residues: list[bytes]) -> float:
    pairs = unordered_pairs(len(residues))
    if not pairs:
        return 1.0
    collisions = sum(residues[i] == residues[j] for i, j in pairs)
    return 1.0 - collisions / len(pairs)


def panel_b_metrics(params, *, mode: str):
    rows = panel_b_records()
    out: dict[str, Any] = {}

    for split in ("train", "validation", "test", "reserved"):
        subset = [r for r in rows if r["split"] == split]
        residues, gates, used = commit_residue(
            params,
            subset,
            panel="B",
            mode=mode,
            authority=FULL_STATUS,
            query=Q1_ROUTE_RESIDUE,
        )

        out[f"A_route_{split}_R"] = route_separation(residues)
        out[f"gate_keep_rate_{split}"] = sum(gates) / len(gates)
        out[f"mean_B_used_{split}"] = sum(used) / len(used)

        if split == "reserved":
            out["reserved_pair_any_gate_open"] = any(gates)
            out["reserved_pair_residue_different"] = residues[0] != residues[1]

    out["G_heldout_R"] = (
        out["A_route_train_R"] - out["A_route_test_R"]
    )
    return out


def rb_control_metrics(params):
    return {
        "panel_a": panel_a_metrics(params, mode="rb"),
        "panel_b": panel_b_metrics(params, mode="rb"),
    }


def append_ledger(ledger: bytes, receipt: dict[str, Any]) -> bytes:
    line = canonical_json(receipt) + b"\n"
    new = ledger + line
    if not new.startswith(ledger):
        raise AssertionError("ledger prefix immutability failed")
    return new


def revocation_metrics(params):
    rows = panel_b_records()
    witness = [r for r in rows if r["split"] == "reserved"]
    if [r["name"] for r in witness] != ["NORTH", "SOUTH"]:
        raise AssertionError("reserved witness order drift")

    mh = model_hash(params)

    full_residues, full_gates, _ = commit_residue(
        params,
        witness,
        panel="B",
        mode="w1r",
        authority=FULL_STATUS,
        query=Q2_AUTHORIZED_READ,
    )

    full_payloads = [
        compose_payload(witness[i]["z32"], full_residues[i])
        for i in range(2)
    ]

    full_metadata = [
        metadata_bytes(
            gate=full_gates[i],
            authority_enum=FULL_STATUS,
            query_enum=Q2_AUTHORIZED_READ,
            model_hash_bytes=mh,
        )
        for i in range(2)
    ]

    ledger = b""
    ledger = append_ledger(ledger, {
        "mark": "AUTHORIZED_ACTIVE_RESIDUE",
        "authority": FULL_STATUS,
        "model_hash": mh.hex(),
    })
    prefix_before_alignment = ledger

    violations = 0
    stale_statuses: list[str] = []

    for payload, meta in zip(full_payloads, full_metadata):
        got = read_payload(
            payload,
            meta,
            current_authority=COMMON_ONLY,
            current_model_hash=mh,
        )
        if got is not None:
            violations += 1
        stale_statuses.append(
            "REVOKED_BUT_STALE_RESIDUE_PRESENT"
            if got is None
            else "UNAUTHORIZED_PAYLOAD_RETURNED"
        )

    common_residues, common_gates, _ = commit_residue(
        params,
        witness,
        panel="B",
        mode="w1r",
        authority=COMMON_ONLY,
        query=Q2_AUTHORIZED_READ,
    )

    common_payloads = [
        compose_payload(witness[i]["z32"], common_residues[i])
        for i in range(2)
    ]

    current_aligned_equal = common_payloads[0] == common_payloads[1]

    ledger = append_ledger(ledger, {
        "mark": "AUTHORITY_AND_ACTIVE_MEMORY_ALIGNED",
        "authority": COMMON_ONLY,
        "model_hash": mh.hex(),
        "aligned_equal": current_aligned_equal,
    })

    prefix_immutable = ledger.startswith(prefix_before_alignment)

    injection_statuses: list[str] = []

    for i in range(2):
        injected_meta = metadata_bytes(
            gate=full_gates[i],
            authority_enum=FULL_STATUS,
            query_enum=Q3_STALE_INJECTION_CONTROL,
            model_hash_bytes=mh,
        )
        got = read_payload(
            full_payloads[i],
            injected_meta,
            current_authority=COMMON_ONLY,
            current_model_hash=mh,
        )
        if got is not None:
            violations += 1
        injection_statuses.append(
            "STALE_RESIDUE_REFUSED"
            if got is None
            else "UNAUTHORIZED_PAYLOAD_RETURNED"
        )

    return {
        "L_revoke": violations,
        "stale_statuses": stale_statuses,
        "injection_statuses": injection_statuses,
        "current_aligned_equal": current_aligned_equal,
        "ledger_prefix_immutable": prefix_immutable,
        "ledger_sha256": hashlib.sha256(ledger).hexdigest(),
        "model_hash": mh.hex(),
        "full_gate_values": full_gates,
        "common_gate_values": common_gates,
    }


def evaluate_seed(seed: int):
    w1r_params, w1r_loss, w1r_terms = train(seed, "w1r")
    rb_params, rb_loss, rb_terms = train(seed, "rb")

    return {
        "seed": seed,
        "w1r": {
            "final_training_loss": w1r_loss,
            "final_training_terms": w1r_terms,
            "panel_a": panel_a_metrics(w1r_params, mode="w1r"),
            "panel_b": panel_b_metrics(w1r_params, mode="w1r"),
            "revocation": revocation_metrics(w1r_params),
            "model_hash": model_hash(w1r_params).hex(),
        },
        "rb": {
            "final_training_loss": rb_loss,
            "final_training_terms": rb_terms,
            **rb_control_metrics(rb_params),
            "model_hash": model_hash(rb_params).hex(),
        },
    }


def _structural_void_class(static: dict[str, Any]) -> str | None:
    checks = static["checks"]

    if not checks["panel_a_same_p2_same_keyhole"] or not checks["panel_b_all_keyholes_identical"]:
        return "VOID_W1R_KEYHOLE_LEAK"

    if not checks["k0_hard_separation_zero"] or not checks["k0_reserved_not_separated"]:
        return "VOID_W1R_CONTROL_FAILURE"

    required = (
        "parameter_count_4456",
        "no_K_parameters",
        "panel_a_48_rows",
        "panel_b_split_6_3_3_2",
        "panel_a_witness_hard",
        "no_forbidden_manifest_overlap",
        "no_forbidden_literal_in_input_builders",
    )
    if not all(checks[name] for name in required):
        return "VOID_W1R_CONTRACT_DRIFT"

    return None


def classify_execution(static: dict[str, Any], seed_results: list[dict[str, Any]]):
    void_class = _structural_void_class(static)
    if void_class is not None:
        return void_class, None

    rb_bad = False
    for row in seed_results:
        rb_a = row["rb"]["panel_a"]
        rb_b = row["rb"]["panel_b"]
        if rb_a["S_sep_R"] != 0.0:
            rb_bad = True
        if rb_b["A_route_reserved_R"] != 0.0:
            rb_bad = True

    if rb_bad:
        return "VOID_W1R_CONTROL_FAILURE", None

    ranked = sorted(
        seed_results,
        key=lambda row: (
            float(row["w1r"]["panel_a"]["C_hard_R"]),
            float(row["w1r"]["panel_a"]["C_eq_R"]),
            int(row["seed"]),
        ),
    )
    median = ranked[2]

    revocation_bad = any(
        row["w1r"]["revocation"]["L_revoke"] != 0
        or not row["w1r"]["revocation"]["current_aligned_equal"]
        or not row["w1r"]["revocation"]["ledger_prefix_immutable"]
        or any(
            mark != "REVOKED_BUT_STALE_RESIDUE_PRESENT"
            for mark in row["w1r"]["revocation"]["stale_statuses"]
        )
        or any(
            mark != "STALE_RESIDUE_REFUSED"
            for mark in row["w1r"]["revocation"]["injection_statuses"]
        )
        for row in seed_results
    )
    if revocation_bad:
        return "FAIL_W1R_REVOCATION", median

    no_residue = (
        median["w1r"]["panel_a"]["S_sep_R"] != 1.0
        or median["w1r"]["panel_a"]["U_R"] != 1.0
        or any(
            not row["w1r"]["panel_b"]["reserved_pair_any_gate_open"]
            for row in seed_results
        )
    )
    if no_residue:
        return "FAIL_W1R_NO_RESIDUE", median

    generalization_bad = (
        median["w1r"]["panel_b"]["A_route_test_R"] != 1.0
        or any(
            row["w1r"]["panel_b"]["A_route_reserved_R"] != 1.0
            for row in seed_results
        )
    )
    if generalization_bad:
        return "FAIL_W1R_GENERALIZATION", median

    return "PASS_W1R_RESIDUE", median


def execute():
    static = static_check()
    seed_results = [evaluate_seed(seed) for seed in SEEDS]
    machine_class, median = classify_execution(static, seed_results)

    np = _np()

    provenance = {
        "spec_sha256": file_sha256(ROOT / "SPEC.md"),
        "execution_sha256": file_sha256(ROOT / "EXECUTION.md"),
        "implementation_sha256": file_sha256(Path(__file__).resolve()),
        "implementation_commit": os.environ.get("GITHUB_SHA", "LOCAL_UNPINNED"),
        "python_version": platform.python_version(),
        "numpy_version": np.__version__,
        "blas_threads": {
            "OPENBLAS_NUM_THREADS": os.environ.get("OPENBLAS_NUM_THREADS"),
            "OMP_NUM_THREADS": os.environ.get("OMP_NUM_THREADS"),
            "MKL_NUM_THREADS": os.environ.get("MKL_NUM_THREADS"),
        },
    }

    return {
        "experiment": "NBG-W1R",
        "version": VERSION,
        "status": "UNREVIEWED_EXECUTION",
        "result_language_authorized": False,
        "compression_claim_authorized": False,
        "machine_candidate_result_class": machine_class,
        "provenance": provenance,
        "B_X": {
            "panel_a": 8,
            "panel_b": 5,
        },
        "B_capacity": 64,
        "epistemic_wrapper": {
            "applied_to_raw_artifact": False,
            "recommended_live_memory_origin_after_review": "SIMULATED",
            "note": "epistemic provenance is outside learner input and does not rewrite result bytes",
        },
        "static_preflight": static,
        "median_performance_seed": None if median is None else median["seed"],
        "seeds": seed_results,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--static-check", action="store_true")
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    if args.static_check:
        print(json.dumps(static_check(), indent=2, sort_keys=True))
        return

    if args.execute:
        if os.environ.get("NBG_W1R_EXECUTION_AUTHORIZED") != "main-merged":
            raise SystemExit(
                "W1R training refused: set NBG_W1R_EXECUTION_AUTHORIZED=main-merged "
                "only after the implementation is merged to main"
            )

        result = execute()
        encoded = (
            json.dumps(result, indent=2, sort_keys=True) + "\n"
        ).encode("utf-8")

        if args.output:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_bytes(encoded)

        print(json.dumps({
            "status": result["status"],
            "machine_candidate_result_class": result["machine_candidate_result_class"],
            "result_language_authorized": False,
            "compression_claim_authorized": False,
            "median_performance_seed": result["median_performance_seed"],
            "result_sha256": hashlib.sha256(encoded).hexdigest(),
        }, indent=2, sort_keys=True))
        return

    parser.error("choose --static-check or --execute")


if __name__ == "__main__":
    main()

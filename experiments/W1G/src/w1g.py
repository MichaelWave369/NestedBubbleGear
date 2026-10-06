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

ARM_FORCED_OPEN = "FORCED_OPEN"
ARM_COMMIT_STE = "COMMIT_STE"
ARM_RB_STE = "RB_STE"

SHARED_PARAM_ORDER = (
    "E1.weight", "E1.bias",
    "E2.weight", "E2.bias",
    "R.weight", "R.bias",
)

GATE_PARAM_ORDER = (
    "G.weight", "G.bias",
)

FULL_PARAM_ORDER = SHARED_PARAM_ORDER + GATE_PARAM_ORDER

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
    "ledgerHash",
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


def pad64(values: Iterable[int]) -> tuple[int, ...]:
    vals = [int(v) for v in values][:64]
    vals.extend([0] * (64 - len(vals)))
    return tuple(vals)


def pad32(values: Iterable[int]) -> tuple[int, ...]:
    vals = [int(v) for v in values][:32]
    vals.extend([0] * (32 - len(vals)))
    return tuple(vals)


def q8_scalar(x: float) -> int:
    y = round(float(x))
    return max(-127, min(127, int(y)))


def q8_array(arr):
    np = _np()
    return np.clip(np.rint(arr), -127, 127).astype(np.int8)


def q8_forward(arr):
    np = _np()
    return q8_array(arr).astype(np.float32)


def q8_ste_mask(arr):
    np = _np()
    x = np.asarray(arr, dtype=np.float32)
    return ((x > -127.0) & (x < 127.0)).astype(np.float32)


def hard_gate_from_p(p):
    np = _np()
    return (np.asarray(p, dtype=np.float32) >= 0.5).astype(np.float32)


def sigmoid(x):
    np = _np()
    x = np.asarray(x, dtype=np.float32)
    return (1.0 / (1.0 + np.exp(-x))).astype(np.float32)


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

    result = (
        bytes([gate, authority_enum, query_enum])
        + authority_hash(authority_enum)
        + model_hash_bytes
    )
    if len(result) != 67:
        raise AssertionError("metadata must be 67 bytes")
    return result


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


def _load_ah11():
    path = REPO_ROOT / "experiments" / "AH11" / "src" / "ah11.py"
    spec = importlib.util.spec_from_file_location("nbg_ah11_for_w1g", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("cannot load AH11")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _flat_matrix(m: Any) -> tuple[int, int, int, int]:
    return (
        int(m[0][0]), int(m[0][1]),
        int(m[1][0]), int(m[1][1]),
    )


def keyhole_a_from_p2(p2: Iterable[int]) -> tuple[int, ...]:
    vals = tuple(int(v) for v in p2)
    if len(vals) != 4:
        raise ValueError("P2 keyhole requires four entries")
    if any(v < -127 or v > 127 for v in vals):
        raise ValueError("P2 value out of int8 range")
    return pad32(vals)


def keyhole_b_ready() -> tuple[int, ...]:
    return pad32((1,))


def panel_a_records() -> list[dict[str, Any]]:
    ah11 = _load_ah11()
    expected = ("I", "A", "B", "S")
    if tuple(ah11.BASE.keys()) != expected:
        raise AssertionError("AH11 base order drift")
    if tuple(ah11.K_VALUES) != (-1, 0, 1):
        raise AssertionError("AH11 k order drift")

    rows: list[dict[str, Any]] = []
    idx = 0
    for uname in expected:
        U = ah11.BASE[uname]
        for vname in expected:
            V = ah11.BASE[vname]
            for k in (-1, 0, 1):
                c = ah11.case(uname, U, vname, V, k)
                t1 = _flat_matrix(c["T1"])
                t2 = _flat_matrix(c["T2"])
                p2 = _flat_matrix(c["P2"])
                g = _flat_matrix(c["global_G"])
                rows.append({
                    "row_index": idx,
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
                idx += 1
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


def count_params(param_order: tuple[str, ...]) -> int:
    total = 0
    for name in param_order:
        n = 1
        for dim in PARAM_SHAPES[name]:
            n *= dim
        total += n
    return total


def shared_param_count() -> int:
    return count_params(SHARED_PARAM_ORDER)


def full_param_count() -> int:
    return count_params(FULL_PARAM_ORDER)


def _xavier(rng, shape):
    np = _np()
    nin, nout = shape
    limit = math.sqrt(6.0 / (nin + nout))
    return rng.uniform(-limit, limit, size=shape).astype(np.float32)


def init_arm_params(seed: int):
    np = _np()
    rng = np.random.Generator(np.random.PCG64(seed))
    shared: dict[str, Any] = {}

    for name in SHARED_PARAM_ORDER:
        shape = PARAM_SHAPES[name]
        if name.endswith(".bias"):
            shared[name] = np.zeros(shape, dtype=np.float32)
        else:
            shared[name] = _xavier(rng, shape)

    gate: dict[str, Any] = {}
    for name in GATE_PARAM_ORDER:
        shape = PARAM_SHAPES[name]
        if name.endswith(".bias"):
            gate[name] = np.zeros(shape, dtype=np.float32)
        else:
            gate[name] = _xavier(rng, shape)

    forced = {name: shared[name].copy() for name in SHARED_PARAM_ORDER}
    commit = {
        **{name: shared[name].copy() for name in SHARED_PARAM_ORDER},
        **{name: gate[name].copy() for name in GATE_PARAM_ORDER},
    }
    rb = {
        **{name: shared[name].copy() for name in SHARED_PARAM_ORDER},
        **{name: gate[name].copy() for name in GATE_PARAM_ORDER},
    }

    return forced, commit, rb


def params_byte_identical(a, b, names: tuple[str, ...]) -> bool:
    np = _np()
    return all(
        np.asarray(a[name], dtype="<f4").tobytes(order="C")
        == np.asarray(b[name], dtype="<f4").tobytes(order="C")
        for name in names
    )


def model_hash(params: dict[str, Any], arm: str) -> bytes:
    np = _np()
    names = SHARED_PARAM_ORDER if arm == ARM_FORCED_OPEN else FULL_PARAM_ORDER
    h = hashlib.sha256()
    for name in names:
        h.update(
            np.asarray(params[name], dtype="<f4").tobytes(order="C")
        )
    return h.digest()


def build_model_inputs(
    arows: list[dict[str, Any]],
    brows_train: list[dict[str, Any]],
    *,
    arm: str,
):
    np = _np()

    if arm in (ARM_FORCED_OPEN, ARM_COMMIT_STE):
        xa = np.asarray([r["x64"] for r in arows], dtype=np.float32)
        xb = np.asarray(
            [pad64(route_source(r, FULL_STATUS)) for r in brows_train],
            dtype=np.float32,
        )
    elif arm == ARM_RB_STE:
        xa = np.asarray(
            [pad64(r["z32"]) for r in arows],
            dtype=np.float32,
        )
        xb = np.asarray(
            [pad64((1,)) for _ in brows_train],
            dtype=np.float32,
        )
    else:
        raise ValueError(arm)

    aa = np.full(len(arows), FULL_STATUS, dtype=np.int64)
    ab = np.full(len(brows_train), FULL_STATUS, dtype=np.int64)
    qa = np.full(len(arows), Q0_AH11_RESIDUE, dtype=np.int64)
    qb = np.full(len(brows_train), Q1_ROUTE_RESIDUE, dtype=np.int64)

    return (
        np.concatenate([xa, xb], axis=0),
        np.concatenate([aa, ab], axis=0),
        np.concatenate([qa, qb], axis=0),
    )


def panel_source(
    rows: list[dict[str, Any]],
    *,
    panel: str,
    arm: str,
    authority: int,
):
    np = _np()

    if panel == "A":
        if arm in (ARM_FORCED_OPEN, ARM_COMMIT_STE):
            return np.asarray([r["x64"] for r in rows], dtype=np.float32)
        if arm == ARM_RB_STE:
            return np.asarray(
                [pad64(r["z32"]) for r in rows],
                dtype=np.float32,
            )
    elif panel == "B":
        if arm in (ARM_FORCED_OPEN, ARM_COMMIT_STE):
            return np.asarray(
                [pad64(route_source(r, authority)) for r in rows],
                dtype=np.float32,
            )
        if arm == ARM_RB_STE:
            return np.asarray(
                [pad64((1,)) for _ in rows],
                dtype=np.float32,
            )

    raise ValueError((panel, arm, authority))


def forward(
    params,
    x,
    authority_ids,
    query_ids,
    *,
    arm: str,
):
    np = _np()

    x = np.asarray(x, dtype=np.float32)
    authority_ids = np.asarray(authority_ids, dtype=np.int64)
    query_ids = np.asarray(query_ids, dtype=np.int64)

    pre1 = x @ params["E1.weight"] + params["E1.bias"]
    h1 = np.maximum(pre1, 0).astype(np.float32)

    pre2 = h1 @ params["E2.weight"] + params["E2.bias"]
    h = np.maximum(pre2, 0).astype(np.float32)

    auth_oh = np.eye(3, dtype=np.float32)[authority_ids]
    query_oh = np.eye(4, dtype=np.float32)[query_ids]
    aux = np.concatenate([h, auth_oh, query_oh], axis=1).astype(np.float32)

    r_raw = aux @ params["R.weight"] + params["R.bias"]
    q_fwd = q8_forward(r_raw)
    q_mask = q8_ste_mask(r_raw)

    if arm == ARM_FORCED_OPEN:
        p_gate = None
        gate_logit = None
        g_fwd = np.ones((len(x), 1), dtype=np.float32)
    elif arm in (ARM_COMMIT_STE, ARM_RB_STE):
        gate_logit = aux @ params["G.weight"] + params["G.bias"]
        p_gate = sigmoid(gate_logit)
        g_fwd = hard_gate_from_p(p_gate)
    else:
        raise ValueError(arm)

    r_task = (g_fwd * q_fwd).astype(np.float32)

    return {
        "x": x,
        "pre1": pre1,
        "h1": h1,
        "pre2": pre2,
        "h": h,
        "aux": aux,
        "r_raw": r_raw,
        "q_fwd": q_fwd,
        "q_mask": q_mask,
        "gate_logit": gate_logit,
        "p_gate": p_gate,
        "g_fwd": g_fwd,
        "r_task": r_task,
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
            if hinge <= 0.0:
                continue
            loss += hinge
            coeff = -2.0 / dim
        else:
            raise ValueError(mode)

        g = (coeff * scale) * diff
        grad[i] += g
        grad[j] -= g

    return float(loss * scale), grad


def backward(
    params,
    cache,
    grad_r_task,
    *,
    arm: str,
    keep_grad_per_row: float = 0.0,
):
    np = _np()

    q_fwd = cache["q_fwd"]
    q_mask = cache["q_mask"]
    g_fwd = cache["g_fwd"]
    aux = cache["aux"]
    h1 = cache["h1"]
    pre2 = cache["pre2"]
    pre1 = cache["pre1"]
    x = cache["x"]

    # Quantizer STE branch.
    grad_q = grad_r_task * g_fwd
    grad_r_raw = grad_q * q_mask

    grads: dict[str, Any] = {}
    grads["R.weight"] = aux.T @ grad_r_raw
    grads["R.bias"] = np.sum(grad_r_raw, axis=0)

    grad_aux = grad_r_raw @ params["R.weight"].T

    if arm in (ARM_COMMIT_STE, ARM_RB_STE):
        p_gate = cache["p_gate"]
        if p_gate is None:
            raise AssertionError("missing p_gate")
        grad_g_task = np.sum(grad_r_task * q_fwd, axis=1, keepdims=True)
        grad_g = grad_g_task + np.full_like(
            grad_g_task,
            keep_grad_per_row,
            dtype=np.float32,
        )
        grad_logit = grad_g * p_gate * (1.0 - p_gate)

        grads["G.weight"] = aux.T @ grad_logit
        grads["G.bias"] = np.sum(grad_logit, axis=0)
        grad_aux = grad_aux + grad_logit @ params["G.weight"].T
    elif arm != ARM_FORCED_OPEN:
        raise ValueError(arm)

    grad_h = grad_aux[:, :32]

    grad_pre2 = grad_h * (pre2 > 0)
    grads["E2.weight"] = h1.T @ grad_pre2
    grads["E2.bias"] = np.sum(grad_pre2, axis=0)

    grad_h1 = grad_pre2 @ params["E2.weight"].T
    grad_pre1 = grad_h1 * (pre1 > 0)
    grads["E1.weight"] = x.T @ grad_pre1
    grads["E1.bias"] = np.sum(grad_pre1, axis=0)

    names = SHARED_PARAM_ORDER if arm == ARM_FORCED_OPEN else FULL_PARAM_ORDER
    for name in names:
        grads[name] = np.asarray(grads[name], dtype=np.float32)

    return grads


def loss_and_grads(
    params,
    arows: list[dict[str, Any]],
    brows_train: list[dict[str, Any]],
    *,
    arm: str,
):
    np = _np()

    x, authority, query = build_model_inputs(
        arows,
        brows_train,
        arm=arm,
    )
    cache = forward(
        params,
        x,
        authority,
        query,
        arm=arm,
    )

    n_a = len(arows)
    n_b = len(brows_train)
    sets = pair_sets_a(arows)
    bpairs = unordered_pairs(n_b)

    ra = cache["r_task"][:n_a]
    rb = cache["r_task"][n_a:]

    la_c, grad_a_c = pair_loss(ra, sets["eq_r"], "collapse")
    la_s, grad_a_s = pair_loss(ra, sets["hard_r"], "separate")
    lb_s, grad_b_s = pair_loss(rb, bpairs, "separate")

    grad_r = np.zeros_like(cache["r_task"], dtype=np.float32)
    grad_r[:n_a] = grad_a_c + grad_a_s
    grad_r[n_a:] = grad_b_s

    if arm == ARM_FORCED_OPEN:
        l_keep = 0.0
        keep_grad = 0.0
    else:
        l_keep = float(np.mean(cache["g_fwd"]))
        keep_grad = 1.0 / cache["g_fwd"].size

    total = float(la_c + la_s + lb_s + l_keep)
    grads = backward(
        params,
        cache,
        grad_r,
        arm=arm,
        keep_grad_per_row=keep_grad,
    )

    return total, grads, {
        "L_A_collapse": float(la_c),
        "L_A_separate": float(la_s),
        "L_B_separate": float(lb_s),
        "L_keep": float(l_keep),
    }


def adam_state(params, arm: str):
    np = _np()
    names = SHARED_PARAM_ORDER if arm == ARM_FORCED_OPEN else FULL_PARAM_ORDER
    return {
        "m": {name: np.zeros_like(params[name], dtype=np.float32) for name in names},
        "v": {name: np.zeros_like(params[name], dtype=np.float32) for name in names},
    }


def adam_step(params, grads, state, step: int, *, arm: str):
    np = _np()
    names = SHARED_PARAM_ORDER if arm == ARM_FORCED_OPEN else FULL_PARAM_ORDER

    for name in names:
        g = np.asarray(grads[name], dtype=np.float32)
        state["m"][name] = (
            BETA1 * state["m"][name]
            + (1.0 - BETA1) * g
        ).astype(np.float32)
        state["v"][name] = (
            BETA2 * state["v"][name]
            + (1.0 - BETA2) * (g * g)
        ).astype(np.float32)

        mhat = state["m"][name] / (1.0 - BETA1 ** step)
        vhat = state["v"][name] / (1.0 - BETA2 ** step)
        update = LR * mhat / (np.sqrt(vhat) + ADAM_EPS)
        params[name][...] = (params[name] - update).astype(np.float32)


def train_from_initial(params, *, arm: str):
    arows = panel_a_records()
    brows_train = [
        r for r in panel_b_records()
        if r["split"] == "train"
    ]

    state = adam_state(params, arm)
    final_loss = math.nan
    final_terms: dict[str, float] = {}

    for step in range(1, STEPS + 1):
        final_loss, grads, final_terms = loss_and_grads(
            params,
            arows,
            brows_train,
            arm=arm,
        )
        adam_step(
            params,
            grads,
            state,
            step,
            arm=arm,
        )

    return params, float(final_loss), final_terms


def final_forward(
    params,
    rows: list[dict[str, Any]],
    *,
    panel: str,
    arm: str,
    authority: int,
    query: int,
):
    np = _np()
    x = panel_source(
        rows,
        panel=panel,
        arm=arm,
        authority=authority,
    )
    auth = np.full(len(rows), authority, dtype=np.int64)
    q = np.full(len(rows), query, dtype=np.int64)
    return forward(
        params,
        x,
        auth,
        q,
        arm=arm,
    )


def committed_from_cache(cache, *, arm: str):
    np = _np()
    q = q8_array(cache["r_raw"])

    if arm == ARM_FORCED_OPEN:
        gates = np.ones(len(q), dtype=np.int8)
    elif arm in (ARM_COMMIT_STE, ARM_RB_STE):
        gates = cache["g_fwd"].reshape(-1).astype(np.int8)
    else:
        raise ValueError(arm)

    residues: list[bytes] = []
    used: list[int] = []
    for idx, gate in enumerate(gates):
        if int(gate) == 1:
            row = q[idx]
        else:
            row = np.zeros(32, dtype=np.int8)
        residues.append(row.astype(np.int8).tobytes())
        used.append(32 + 32 * int(gate))

    return residues, [int(x) for x in gates], used


def forward_commit_identity(cache, *, arm: str) -> dict[str, Any]:
    np = _np()
    residues, gates, _ = committed_from_cache(cache, arm=arm)

    residue_matches: list[bool] = []
    gate_matches: list[bool] = []

    for i in range(len(residues)):
        forward_i8 = np.asarray(
            cache["r_task"][i],
            dtype=np.int8,
        ).tobytes()
        residue_matches.append(forward_i8 == residues[i])

        if arm == ARM_FORCED_OPEN:
            gate_matches.append(gates[i] == 1)
        else:
            gate_matches.append(
                int(cache["g_fwd"][i, 0]) == gates[i]
            )

    return {
        "row_count": len(residues),
        "residue_all_match": all(residue_matches),
        "gate_all_match": all(gate_matches),
        "residue_mismatch_count": sum(not x for x in residue_matches),
        "gate_mismatch_count": sum(not x for x in gate_matches),
    }


def diagnostics(cache, *, arm: str) -> dict[str, Any]:
    np = _np()
    r_raw = np.asarray(cache["r_raw"], dtype=np.float32)
    q = q8_array(r_raw)

    if arm == ARM_FORCED_OPEN:
        p_min = p_mean = p_max = None
        gate_rate = 1.0
    else:
        p = np.asarray(cache["p_gate"], dtype=np.float32)
        p_min = float(np.min(p))
        p_mean = float(np.mean(p))
        p_max = float(np.max(p))
        gate_rate = float(np.mean(cache["g_fwd"]))

    return {
        "p_gate_min": p_min,
        "p_gate_mean": p_mean,
        "p_gate_max": p_max,
        "gate_keep_rate": gate_rate,
        "r_raw_abs_mean": float(np.mean(np.abs(r_raw))),
        "r_raw_abs_max": float(np.max(np.abs(r_raw))),
        "q8_saturation_fraction": float(
            np.mean((r_raw <= -127.0) | (r_raw >= 127.0))
        ),
        "q8_zero_fraction": float(np.mean(q == 0)),
    }


def panel_a_metrics(params, *, arm: str):
    rows = panel_a_records()
    sets = pair_sets_a(rows)
    cache = final_forward(
        params,
        rows,
        panel="A",
        arm=arm,
        authority=FULL_STATUS,
        query=Q0_AH11_RESIDUE,
    )
    residues, gates, used = committed_from_cache(cache, arm=arm)

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
        if (
            residues[i] != residues[j]
            and (gates[i] == 1 or gates[j] == 1)
        ):
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
        "diagnostics": diagnostics(cache, arm=arm),
        "identity_audit": forward_commit_identity(cache, arm=arm),
    }


def route_separation(residues: list[bytes]) -> float:
    pairs = unordered_pairs(len(residues))
    if not pairs:
        return 1.0
    collisions = sum(
        residues[i] == residues[j]
        for i, j in pairs
    )
    return 1.0 - collisions / len(pairs)


def panel_b_metrics(params, *, arm: str):
    rows = panel_b_records()
    out: dict[str, Any] = {}

    for split in ("train", "validation", "test", "reserved"):
        subset = [r for r in rows if r["split"] == split]
        cache = final_forward(
            params,
            subset,
            panel="B",
            arm=arm,
            authority=FULL_STATUS,
            query=Q1_ROUTE_RESIDUE,
        )
        residues, gates, used = committed_from_cache(cache, arm=arm)

        out[f"A_route_{split}_R"] = route_separation(residues)
        out[f"gate_keep_rate_{split}"] = sum(gates) / len(gates)
        out[f"mean_B_used_{split}"] = sum(used) / len(used)
        out[f"diagnostics_{split}"] = diagnostics(cache, arm=arm)
        out[f"identity_audit_{split}"] = forward_commit_identity(
            cache,
            arm=arm,
        )

        if split == "reserved":
            out["reserved_pair_any_gate_open"] = any(gates)
            out["reserved_pair_residue_different"] = (
                residues[0] != residues[1]
            )

    out["G_heldout_R"] = (
        out["A_route_train_R"] - out["A_route_test_R"]
    )
    return out


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


def append_ledger(ledger: bytes, receipt: dict[str, Any]) -> bytes:
    line = canonical_json(receipt) + b"\n"
    new = ledger + line
    if not new.startswith(ledger):
        raise AssertionError("ledger prefix immutability failed")
    return new


def materialize(
    params,
    rows: list[dict[str, Any]],
    *,
    arm: str,
    authority: int,
    query: int,
):
    cache = final_forward(
        params,
        rows,
        panel="B",
        arm=arm,
        authority=authority,
        query=query,
    )
    residues, gates, _ = committed_from_cache(cache, arm=arm)
    payloads = [
        compose_payload(rows[i]["z32"], residues[i])
        for i in range(len(rows))
    ]
    mh = model_hash(params, arm)
    metas = [
        metadata_bytes(
            gate=gates[i],
            authority_enum=authority,
            query_enum=query,
            model_hash_bytes=mh,
        )
        for i in range(len(rows))
    ]
    return {
        "payloads": payloads,
        "metadata": metas,
        "gates": gates,
        "model_hash": mh,
        "cache": cache,
    }


def revocation_metrics(params, *, arm: str):
    if arm not in (ARM_FORCED_OPEN, ARM_COMMIT_STE):
        raise ValueError("scientific-arm revocation only")

    rows = [
        r for r in panel_b_records()
        if r["split"] == "reserved"
    ]
    if [r["name"] for r in rows] != ["NORTH", "SOUTH"]:
        raise AssertionError("reserved witness order drift")

    full = materialize(
        params,
        rows,
        arm=arm,
        authority=FULL_STATUS,
        query=Q2_AUTHORIZED_READ,
    )

    ledger = b""
    ledger = append_ledger(ledger, {
        "mark": "AUTHORIZED_ACTIVE_RESIDUE",
        "arm": arm,
        "authority": FULL_STATUS,
        "model_hash": full["model_hash"].hex(),
    })
    prefix = ledger

    violations = 0
    stale_statuses: list[str] = []

    for payload, meta in zip(full["payloads"], full["metadata"]):
        got = read_payload(
            payload,
            meta,
            current_authority=COMMON_ONLY,
            current_model_hash=full["model_hash"],
        )
        if got is not None:
            violations += 1
        stale_statuses.append(
            "REVOKED_BUT_STALE_RESIDUE_PRESENT"
            if got is None
            else "UNAUTHORIZED_PAYLOAD_RETURNED"
        )

    common = materialize(
        params,
        rows,
        arm=arm,
        authority=COMMON_ONLY,
        query=Q2_AUTHORIZED_READ,
    )

    current_aligned_equal = (
        common["payloads"][0] == common["payloads"][1]
    )

    ledger = append_ledger(ledger, {
        "mark": "AUTHORITY_AND_ACTIVE_MEMORY_ALIGNED",
        "arm": arm,
        "authority": COMMON_ONLY,
        "model_hash": common["model_hash"].hex(),
        "aligned_equal": current_aligned_equal,
    })

    prefix_immutable = ledger.startswith(prefix)
    injection_statuses: list[str] = []

    for i in range(2):
        injected_meta = metadata_bytes(
            gate=full["gates"][i],
            authority_enum=FULL_STATUS,
            query_enum=Q3_STALE_INJECTION_CONTROL,
            model_hash_bytes=full["model_hash"],
        )
        got = read_payload(
            full["payloads"][i],
            injected_meta,
            current_authority=COMMON_ONLY,
            current_model_hash=full["model_hash"],
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
        "model_hash": full["model_hash"].hex(),
        "full_gate_values": full["gates"],
        "common_gate_values": common["gates"],
    }


def k0_metrics() -> dict[str, Any]:
    rows = panel_a_records()
    sets = pair_sets_a(rows)
    hard_total = len(sets["hard_r"])
    return {
        "panel_a_hard_pair_count": hard_total,
        "S_sep_K0": 0.0 if hard_total else 1.0,
        "reserved_pair_separated": False,
    }


def model_input_manifest() -> dict[str, list[str]]:
    return {
        "allowed": sorted(ALLOWED_MODEL_INPUT_FIELDS),
        "forbidden": sorted(FORBIDDEN_MODEL_INPUT_FIELDS),
    }


def static_check() -> dict[str, Any]:
    np = _np()
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

    forced, commit, rb = init_arm_params(0)

    train_names = [r["name"] for r in brows if r["split"] == "train"]
    val_names = [r["name"] for r in brows if r["split"] == "validation"]
    test_names = [r["name"] for r in brows if r["split"] == "test"]
    reserved_names = [r["name"] for r in brows if r["split"] == "reserved"]

    source_text = inspect.getsource(build_model_inputs) + inspect.getsource(panel_source)
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

    z_a_ok = all(
        arows[i]["z32"] == arows[j]["z32"]
        for i, j in sets["eq_p2"]
    )
    z_b_set = {r["z32"] for r in brows}

    zero_logits = np.zeros((4, 1), dtype=np.float32)
    initial_gate = hard_gate_from_p(sigmoid(zero_logits))

    q_test = np.asarray([
        [-128.0, -127.0, -126.5, -0.5, 0.5, 1.5, 126.5, 127.0, 128.0]
    ], dtype=np.float32)
    q_mask = q8_ste_mask(q_test).reshape(-1).tolist()

    k0 = k0_metrics()

    checks = {
        "forced_param_count_4416": shared_param_count() == 4416,
        "commit_param_count_4456": full_param_count() == 4456,
        "no_K_parameters": all(
            not name.startswith("K.")
            for name in FULL_PARAM_ORDER
        ),
        "shared_init_forced_commit_identical": params_byte_identical(
            forced, commit, SHARED_PARAM_ORDER
        ),
        "shared_init_forced_rb_identical": params_byte_identical(
            forced, rb, SHARED_PARAM_ORDER
        ),
        "gate_init_commit_rb_identical": params_byte_identical(
            commit, rb, GATE_PARAM_ORDER
        ),
        "initial_zero_logit_gate_open": bool(np.all(initial_gate == 1.0)),
        "quantizer_mask_strict": q_mask == [
            0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0
        ],
        "q8_ties_even": (
            q8_scalar(0.5), q8_scalar(1.5), q8_scalar(2.5),
            q8_scalar(-0.5), q8_scalar(-1.5),
        ) == (0, 2, 2, 0, -2),
        "q8_clips": (q8_scalar(999), q8_scalar(-999)) == (127, -127),
        "panel_a_48_rows": len(arows) == 48,
        "panel_a_same_p2_same_keyhole": z_a_ok,
        "panel_a_witness_hard": tuple(sorted((ia, ai))) in {
            tuple(sorted(p)) for p in sets["hard_r"]
        },
        "panel_b_split_6_3_3_2": (
            len(train_names), len(val_names), len(test_names), len(reserved_names)
        ) == (6, 3, 3, 2),
        "panel_b_train_order": train_names == [f"R{i:02d}" for i in range(6)],
        "panel_b_validation_order": val_names == ["R06", "R07", "R08"],
        "panel_b_test_order": test_names == ["R09", "R10", "R11"],
        "panel_b_reserved_order": reserved_names == ["NORTH", "SOUTH"],
        "panel_b_keyhole_identical": len(z_b_set) == 1,
        "panel_b_keyhole_ready": next(iter(z_b_set)) == keyhole_b_ready(),
        "common_projection_erases_route": len({
            route_source(r, COMMON_ONLY) for r in brows
        }) == 1,
        "metadata_67": len(metadata_bytes(
            gate=1,
            authority_enum=FULL_STATUS,
            query_enum=Q2_AUTHORIZED_READ,
            model_hash_bytes=b"\0" * 32,
        )) == 67,
        "k0_hard_separation_zero": k0["S_sep_K0"] == 0.0,
        "k0_reserved_not_separated": k0["reserved_pair_separated"] is False,
        "no_forbidden_manifest_overlap": not (
            ALLOWED_MODEL_INPUT_FIELDS & FORBIDDEN_MODEL_INPUT_FIELDS
        ),
        "no_forbidden_literal_in_input_builders": not forbidden_literal_leaks,
        "compression_firewall_A": 64 >= 8,
        "compression_firewall_B": 64 >= 5,
    }

    # Handcrafted forward/commit identity checks, no optimizer.
    x = np.zeros((3, 64), dtype=np.float32)
    a = np.full(3, FULL_STATUS, dtype=np.int64)
    q = np.full(3, Q0_AH11_RESIDUE, dtype=np.int64)

    forced_cache = forward(
        forced, x, a, q, arm=ARM_FORCED_OPEN
    )
    commit_cache = forward(
        commit, x, a, q, arm=ARM_COMMIT_STE
    )
    rb_cache = forward(
        rb, x, a, q, arm=ARM_RB_STE
    )

    forced_audit = forward_commit_identity(
        forced_cache, arm=ARM_FORCED_OPEN
    )
    commit_audit = forward_commit_identity(
        commit_cache, arm=ARM_COMMIT_STE
    )
    rb_audit = forward_commit_identity(
        rb_cache, arm=ARM_RB_STE
    )

    checks["forced_handcrafted_identity"] = (
        forced_audit["residue_all_match"]
        and forced_audit["gate_all_match"]
    )
    checks["commit_handcrafted_identity"] = (
        commit_audit["residue_all_match"]
        and commit_audit["gate_all_match"]
    )
    checks["rb_handcrafted_identity"] = (
        rb_audit["residue_all_match"]
        and rb_audit["gate_all_match"]
    )

    failed = [name for name, ok in checks.items() if not ok]
    if failed:
        raise AssertionError(
            "static W1G contract failed: " + ", ".join(failed)
        )

    return {
        "verdict": "PASS_W1G_STATIC",
        "checks": checks,
        "hard_pair_count": len(sets["hard_r"]),
        "same_target_coarse_pair_count": len(sets["eq_r"]),
        "coarse_pair_count": len(sets["eq_p2"]),
        "k0": k0,
        "model_input_manifest": model_input_manifest(),
    }


def evaluate_arm_seed(initial_params, *, arm: str):
    params, final_loss, final_terms = train_from_initial(
        initial_params,
        arm=arm,
    )

    panel_a = panel_a_metrics(params, arm=arm)
    panel_b = panel_b_metrics(params, arm=arm)

    record: dict[str, Any] = {
        "final_training_loss": final_loss,
        "final_training_terms": final_terms,
        "panel_a": panel_a,
        "panel_b": panel_b,
        "model_hash": model_hash(params, arm).hex(),
    }

    if arm in (ARM_FORCED_OPEN, ARM_COMMIT_STE):
        record["revocation"] = revocation_metrics(params, arm=arm)

    return record


def evaluate_seed(seed: int):
    forced_init, commit_init, rb_init = init_arm_params(seed)

    return {
        "seed": seed,
        "forced_open": evaluate_arm_seed(
            forced_init,
            arm=ARM_FORCED_OPEN,
        ),
        "commit_ste": evaluate_arm_seed(
            commit_init,
            arm=ARM_COMMIT_STE,
        ),
        "rb_ste": evaluate_arm_seed(
            rb_init,
            arm=ARM_RB_STE,
        ),
    }


def all_identity_audits_pass(seed_results: list[dict[str, Any]]) -> bool:
    for row in seed_results:
        for key in ("forced_open", "commit_ste", "rb_ste"):
            arm = row[key]
            if not arm["panel_a"]["identity_audit"]["residue_all_match"]:
                return False
            if not arm["panel_a"]["identity_audit"]["gate_all_match"]:
                return False
            for split in ("train", "validation", "test", "reserved"):
                audit = arm["panel_b"][f"identity_audit_{split}"]
                if not audit["residue_all_match"]:
                    return False
                if not audit["gate_all_match"]:
                    return False
    return True


def median_record(seed_results: list[dict[str, Any]], arm_key: str):
    ranked = sorted(
        seed_results,
        key=lambda row: (
            float(row[arm_key]["panel_a"]["C_hard_R"]),
            float(row[arm_key]["panel_a"]["C_eq_R"]),
            int(row["seed"]),
        ),
    )
    return ranked[2]


def scientific_revocation_bad(seed_results: list[dict[str, Any]]) -> bool:
    for row in seed_results:
        for arm_key in ("forced_open", "commit_ste"):
            rev = row[arm_key]["revocation"]
            if rev["L_revoke"] != 0:
                return True
            if not rev["current_aligned_equal"]:
                return True
            if not rev["ledger_prefix_immutable"]:
                return True
            if any(
                x != "REVOKED_BUT_STALE_RESIDUE_PRESENT"
                for x in rev["stale_statuses"]
            ):
                return True
            if any(
                x != "STALE_RESIDUE_REFUSED"
                for x in rev["injection_statuses"]
            ):
                return True
    return False


def classify_execution(
    static: dict[str, Any],
    seed_results: list[dict[str, Any]],
):
    checks = static["checks"]

    if (
        not checks["panel_a_same_p2_same_keyhole"]
        or not checks["panel_b_keyhole_identical"]
    ):
        return "VOID_W1G_KEYHOLE_LEAK", None, None

    k0_bad = (
        static["k0"]["S_sep_K0"] != 0.0
        or static["k0"]["reserved_pair_separated"] is not False
    )

    rb_bad = any(
        row["rb_ste"]["panel_a"]["S_sep_R"] != 0.0
        or row["rb_ste"]["panel_b"]["A_route_reserved_R"] != 0.0
        for row in seed_results
    )

    if k0_bad or rb_bad:
        return "VOID_W1G_CONTROL_FAILURE", None, None

    if not all_identity_audits_pass(seed_results):
        return "VOID_W1G_CONTRACT_DRIFT", None, None

    if scientific_revocation_bad(seed_results):
        return "FAIL_W1G_REVOCATION", None, None

    forced_median = median_record(seed_results, "forced_open")
    forced_ok = (
        forced_median["forced_open"]["panel_a"]["S_sep_R"] == 1.0
        and forced_median["forced_open"]["panel_b"]["A_route_test_R"] == 1.0
        and all(
            row["forced_open"]["panel_b"]["A_route_reserved_R"] == 1.0
            for row in seed_results
        )
    )
    if not forced_ok:
        return (
            "FAIL_W1G_REPRESENTATION_COMMIT",
            forced_median,
            None,
        )

    commit_median = median_record(seed_results, "commit_ste")
    gate_ok = (
        commit_median["commit_ste"]["panel_a"]["S_sep_R"] == 1.0
        and commit_median["commit_ste"]["panel_a"]["U_R"] == 1.0
        and all(
            row["commit_ste"]["panel_b"]["reserved_pair_any_gate_open"]
            for row in seed_results
        )
    )
    if not gate_ok:
        return (
            "FAIL_W1G_GATE_ALIGNMENT",
            forced_median,
            commit_median,
        )

    gen_ok = (
        commit_median["commit_ste"]["panel_b"]["A_route_test_R"] == 1.0
        and all(
            row["commit_ste"]["panel_b"]["A_route_reserved_R"] == 1.0
            for row in seed_results
        )
    )
    if not gen_ok:
        return (
            "FAIL_W1G_GENERALIZATION",
            forced_median,
            commit_median,
        )

    return (
        "PASS_W1G_COMMIT_ALIGNED_RESIDUE",
        forced_median,
        commit_median,
    )


def execute():
    static = static_check()
    seed_results = [evaluate_seed(seed) for seed in SEEDS]
    machine_class, forced_median, commit_median = classify_execution(
        static,
        seed_results,
    )

    np = _np()

    return {
        "experiment": "NBG-W1G",
        "version": VERSION,
        "status": "UNREVIEWED_EXECUTION",
        "result_language_authorized": False,
        "compression_claim_authorized": False,
        "machine_candidate_result_class": machine_class,
        "provenance": {
            "spec_sha256": file_sha256(ROOT / "SPEC.md"),
            "execution_sha256": file_sha256(ROOT / "EXECUTION.md"),
            "implementation_sha256": file_sha256(Path(__file__).resolve()),
            "implementation_commit": os.environ.get(
                "GITHUB_SHA",
                "LOCAL_UNPINNED",
            ),
            "workflow_run_id": os.environ.get("GITHUB_RUN_ID"),
            "python_version": platform.python_version(),
            "numpy_version": np.__version__,
            "blas_threads": {
                "OPENBLAS_NUM_THREADS": os.environ.get("OPENBLAS_NUM_THREADS"),
                "OMP_NUM_THREADS": os.environ.get("OMP_NUM_THREADS"),
                "MKL_NUM_THREADS": os.environ.get("MKL_NUM_THREADS"),
            },
        },
        "B_X": {
            "panel_a": 8,
            "panel_b": 5,
        },
        "B_capacity": 64,
        "static_preflight": static,
        "forced_open_median_seed": (
            None if forced_median is None else forced_median["seed"]
        ),
        "commit_ste_median_seed": (
            None if commit_median is None else commit_median["seed"]
        ),
        "epistemic_wrapper": {
            "applied_to_raw_artifact": False,
            "recommended_live_memory_origin_after_review": "SIMULATED",
        },
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
        if os.environ.get("NBG_W1G_EXECUTION_AUTHORIZED") != "main-merged":
            raise SystemExit(
                "W1G training refused: set "
                "NBG_W1G_EXECUTION_AUTHORIZED=main-merged "
                "only after implementation is merged to main"
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
            "machine_candidate_result_class": result[
                "machine_candidate_result_class"
            ],
            "result_language_authorized": False,
            "compression_claim_authorized": False,
            "forced_open_median_seed": result[
                "forced_open_median_seed"
            ],
            "commit_ste_median_seed": result[
                "commit_ste_median_seed"
            ],
            "result_sha256": hashlib.sha256(encoded).hexdigest(),
        }, indent=2, sort_keys=True))
        return

    parser.error("choose --static-check or --execute")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
import os
from dataclasses import dataclass
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

Q0_AH11_GLOBAL = 0
Q1_PROBE_LATENT_ROUTE = 1
Q2_AUTHORIZED_READ = 2
Q3_STALE_INJECTION_CONTROL = 3

PARAM_ORDER = (
    "E1.weight", "E1.bias",
    "E2.weight", "E2.bias",
    "K.weight", "K.bias",
    "R.weight", "R.bias",
    "G.weight", "G.bias",
)

PARAM_SHAPES = {
    "E1.weight": (64, 32),
    "E1.bias": (32,),
    "E2.weight": (32, 32),
    "E2.bias": (32,),
    "K.weight": (32, 32),
    "K.bias": (32,),
    "R.weight": (39, 32),
    "R.bias": (32,),
    "G.weight": (39, 1),
    "G.bias": (1,),
}


def _np():
    import numpy as np
    return np


def canonical_json(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode("utf-8")


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def q8_scalar(x: float) -> int:
    # Python round() is nearest with ties-to-even for exact .5 cases.
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
    if query_enum not in (0, 1, 2, 3):
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


def pad64(values: Iterable[int]) -> list[int]:
    vals = [int(v) for v in values]
    vals = vals[:64]
    vals.extend([0] * (64 - len(vals)))
    return vals


def _load_ah11():
    path = REPO_ROOT / "experiments" / "AH11" / "src" / "ah11.py"
    spec = importlib.util.spec_from_file_location("nbg_ah11_for_w1", path)
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
    for uname, U in ah11.BASE.items():
        for vname, V in ah11.BASE.items():
            for k in ah11.K_VALUES:
                c = ah11.case(uname, U, vname, V, k)
                t1 = _flat_matrix(c["T1"])
                t2 = _flat_matrix(c["T2"])
                rows.append({
                    "name": f"{uname}:{vname}:{k}",
                    "U": uname,
                    "V": vname,
                    "k": int(k),
                    "x_raw": t1 + t2,
                    "x64": tuple(pad64(t1 + t2)),
                    "P2": tuple(_flat_matrix(c["P2"])),
                    "G": tuple(_flat_matrix(c["global_G"])),
                })
    return rows


def route_bits(code: int) -> tuple[int, int, int, int]:
    if not 0 <= code <= 15:
        raise ValueError("route code out of range")
    bits = tuple(1 if ((code >> shift) & 1) else -1 for shift in (3, 2, 1, 0))
    return bits  # type: ignore[return-value]


def route_record(name: str, code: int, split: str) -> dict[str, Any]:
    bits = route_bits(code)
    return {
        "name": name,
        "code": code,
        "split": split,
        "bits": bits,
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
    eq_g: list[tuple[int, int]] = []
    neq_g: list[tuple[int, int]] = []
    eq_p2: list[tuple[int, int]] = []
    neq_p2: list[tuple[int, int]] = []
    hard: list[tuple[int, int]] = []
    for i, j in unordered_pairs(len(rows)):
        same_g = rows[i]["G"] == rows[j]["G"]
        same_p2 = rows[i]["P2"] == rows[j]["P2"]
        (eq_g if same_g else neq_g).append((i, j))
        (eq_p2 if same_p2 else neq_p2).append((i, j))
        if same_p2 and not same_g:
            hard.append((i, j))
    return {
        "eq_g": eq_g,
        "neq_g": neq_g,
        "eq_p2": eq_p2,
        "neq_p2": neq_p2,
        "hard": hard,
    }


def parameter_count() -> int:
    total = 0
    for shape in PARAM_SHAPES.values():
        n = 1
        for x in shape:
            n *= x
        total += n
    return total


def static_check() -> dict[str, Any]:
    a = panel_a_records()
    b = panel_b_records()
    pairs = pair_sets_a(a)

    ia = [i for i, r in enumerate(a) if r["U"] == "I" and r["V"] == "A" and r["k"] == 0]
    ai = [i for i, r in enumerate(a) if r["U"] == "A" and r["V"] == "I" and r["k"] == 0]
    if len(ia) != 1 or len(ai) != 1:
        raise AssertionError("canonical AH11 witness missing")

    checks = {
        "parameter_count_5512": parameter_count() == 5512,
        "panel_a_48": len(a) == 48,
        "panel_a_source_8": all(len(r["x_raw"]) == 8 for r in a),
        "panel_a_witness_hard": tuple(sorted((ia[0], ai[0]))) in {
            tuple(sorted(p)) for p in pairs["hard"]
        },
        "panel_b_14_total": len(b) == 14,
        "panel_b_split_6_3_3_2": (
            sum(r["split"] == "train" for r in b),
            sum(r["split"] == "validation" for r in b),
            sum(r["split"] == "test" for r in b),
            sum(r["split"] == "reserved" for r in b),
        ) == (6, 3, 3, 2),
        "north_south_codes_12_13": (
            next(r["code"] for r in b if r["name"] == "NORTH"),
            next(r["code"] for r in b if r["name"] == "SOUTH"),
        ) == (12, 13),
        "common_projection_erases_route": len({
            route_source(r, COMMON_ONLY) for r in b
        }) == 1,
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
        "bx_a_8_no_compression": 64 >= 8,
        "bx_b_5_no_compression": 64 >= 5,
    }
    failed = [k for k, v in checks.items() if not v]
    if failed:
        raise AssertionError(f"static W1 contract failed: {failed}")
    return {
        "verdict": "PASS_W1_STATIC",
        "checks": checks,
        "hard_pair_count": len(pairs["hard"]),
        "eq_g_pair_count": len(pairs["eq_g"]),
        "eq_p2_pair_count": len(pairs["eq_p2"]),
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
    if sum(int(v.size) for v in params.values()) != 5512:
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

    z = h @ params["K.weight"] + params["K.bias"]

    auth_oh = np.eye(3, dtype=np.float32)[authority_ids]
    query_oh = np.eye(4, dtype=np.float32)[query_ids]
    aux = np.concatenate([h, auth_oh, query_oh], axis=1).astype(np.float32)

    r_raw = aux @ params["R.weight"] + params["R.bias"]
    gate_logit = aux @ params["G.weight"] + params["G.bias"]
    p_gate = (1.0 / (1.0 + np.exp(-gate_logit))).astype(np.float32)
    r_train = (p_gate * r_raw).astype(np.float32)
    memory = np.concatenate([z, r_train], axis=1).astype(np.float32)

    return {
        "x": x,
        "p1": p1,
        "h1": h1,
        "p2": p2,
        "h": h,
        "z": z,
        "aux": aux,
        "r_raw": r_raw,
        "gate_logit": gate_logit,
        "p_gate": p_gate,
        "r_train": r_train,
        "memory": memory,
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


def backprop(params, cache, grad_z, grad_rtrain, grad_p_extra):
    np = _np()

    p_gate = cache["p_gate"]
    r_raw = cache["r_raw"]
    aux = cache["aux"]
    h = cache["h"]
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

    grads["K.weight"] = h.T @ grad_z
    grads["K.bias"] = np.sum(grad_z, axis=0)
    grad_h = grad_h + grad_z @ params["K.weight"].T

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


def _arrays_a(rows):
    np = _np()
    x = np.asarray([r["x64"] for r in rows], dtype=np.float32)
    auth = np.full(len(rows), FULL_STATUS, dtype=np.int64)
    query = np.full(len(rows), Q0_AH11_GLOBAL, dtype=np.int64)
    return x, auth, query


def _arrays_b(rows, authority=FULL_STATUS, query=Q1_PROBE_LATENT_ROUTE):
    np = _np()
    x = np.asarray([pad64(route_source(r, authority)) for r in rows], dtype=np.float32)
    auth = np.full(len(rows), authority, dtype=np.int64)
    q = np.full(len(rows), query, dtype=np.int64)
    return x, auth, q


def w1_loss_and_grads(params, arows, brows_train):
    np = _np()
    xa, aa, qa = _arrays_a(arows)
    xb, ab, qb = _arrays_b(brows_train)

    x = np.concatenate([xa, xb], axis=0)
    auth = np.concatenate([aa, ab], axis=0)
    query = np.concatenate([qa, qb], axis=0)
    cache = forward(params, x, auth, query)

    n_a = len(arows)
    n_b = len(brows_train)
    sets = pair_sets_a(arows)
    bpairs = unordered_pairs(n_b)

    z_a = cache["z"][:n_a]
    z_b = cache["z"][n_a:]
    m_a = cache["memory"][:n_a]
    m_b = cache["memory"][n_a:]

    lc_a, gz_a = pair_loss(z_a, sets["eq_p2"], "collapse")
    lc_b, gz_b = pair_loss(z_b, bpairs, "collapse")
    ld_a, gm_hard = pair_loss(m_a, sets["hard"], "separate")
    ld_b, gm_b = pair_loss(m_b, bpairs, "separate")
    lf_c, gm_eqg = pair_loss(m_a, sets["eq_g"], "collapse")
    lf_s, gm_neqg = pair_loss(m_a, sets["neq_g"], "separate")

    l_collapse = 0.5 * (lc_a + lc_b)
    l_dist = 0.5 * (ld_a + ld_b)
    l_future = 0.5 * (lf_c + lf_s)
    l_keep = float(np.mean(cache["p_gate"]))
    total = l_collapse + l_dist + l_future + l_keep

    grad_z = np.zeros_like(cache["z"], dtype=np.float32)
    grad_m = np.zeros_like(cache["memory"], dtype=np.float32)

    grad_z[:n_a] += 0.5 * gz_a
    grad_z[n_a:] += 0.5 * gz_b

    grad_m[:n_a] += 0.5 * gm_hard
    grad_m[n_a:] += 0.5 * gm_b
    grad_m[:n_a] += 0.5 * gm_eqg + 0.5 * gm_neqg

    grad_z += grad_m[:, :32]
    grad_rtrain = grad_m[:, 32:]

    grad_p_extra = np.full_like(
        cache["p_gate"],
        1.0 / cache["p_gate"].size,
        dtype=np.float32,
    )
    grads = backprop(params, cache, grad_z, grad_rtrain, grad_p_extra)
    return float(total), grads


def recon_loss_and_grads(params, arows):
    np = _np()
    x, auth, query = _arrays_a(arows)
    cache = forward(params, x, auth, query)
    diff = cache["memory"] - x
    loss = float(np.mean(diff * diff))
    grad_m = (2.0 / diff.size) * diff
    grad_z = grad_m[:, :32].astype(np.float32)
    grad_r = grad_m[:, 32:].astype(np.float32)
    gp = np.zeros_like(cache["p_gate"], dtype=np.float32)
    grads = backprop(params, cache, grad_z, grad_r, gp)
    return loss, grads


def noncausal_loss_and_grads(params, arows):
    np = _np()
    x, auth, query = _arrays_a(arows)
    cache = forward(params, x, auth, query)
    sets = pair_sets_a(arows)
    lc, gm_c = pair_loss(cache["memory"], sets["eq_p2"], "collapse")
    ls, gm_s = pair_loss(cache["memory"], sets["neq_p2"], "separate")
    loss = 0.5 * (lc + ls)
    grad_m = 0.5 * gm_c + 0.5 * gm_s
    grad_z = grad_m[:, :32].astype(np.float32)
    grad_r = grad_m[:, 32:].astype(np.float32)
    gp = np.zeros_like(cache["p_gate"], dtype=np.float32)
    grads = backprop(params, cache, grad_z, grad_r, gp)
    return float(loss), grads


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
        update = LR * mhat / (np.sqrt(vhat) + ADAM_EPS)
        params[name][...] = (params[name] - update).astype(np.float32)


def train(seed: int, mode: str):
    params = init_params(seed)
    state = adam_state(params)
    arows = panel_a_records()
    brows = [r for r in panel_b_records() if r["split"] == "train"]

    loss = math.nan
    for step in range(1, STEPS + 1):
        if mode == "w1":
            loss, grads = w1_loss_and_grads(params, arows, brows)
        elif mode == "recon":
            loss, grads = recon_loss_and_grads(params, arows)
        elif mode == "noncausal":
            loss, grads = noncausal_loss_and_grads(params, arows)
        else:
            raise ValueError(mode)
        adam_step(params, grads, state, step)
    return params, float(loss)


def q8_array(arr):
    np = _np()
    return np.clip(np.rint(arr), -127, 127).astype(np.int8)


def commit_records(params, rows, *, panel: str, authority: int, query: int):
    np = _np()
    if panel == "A":
        x = np.asarray([r["x64"] for r in rows], dtype=np.float32)
    elif panel == "B":
        x = np.asarray([pad64(route_source(r, authority)) for r in rows], dtype=np.float32)
    else:
        raise ValueError(panel)

    auth = np.full(len(rows), authority, dtype=np.int64)
    q = np.full(len(rows), query, dtype=np.int64)
    cache = forward(params, x, auth, q)

    zc = q8_array(cache["z"])
    rr = q8_array(cache["r_raw"])
    gates = (cache["p_gate"].reshape(-1) >= 0.5).astype(np.int8)

    memories: list[bytes] = []
    used: list[int] = []
    for i, g in enumerate(gates):
        rc = rr[i] if int(g) == 1 else np.zeros(32, dtype=np.int8)
        payload = np.concatenate([zc[i], rc]).astype(np.int8).tobytes()
        if len(payload) != 64:
            raise AssertionError("committed payload size drift")
        memories.append(payload)
        used.append(32 + 32 * int(g))
    return memories, [int(x) for x in gates], used


def _eq_metric(descriptors, rows):
    sets = pair_sets_a(rows)

    def different(i, j):
        return descriptors[i] != descriptors[j]

    c_eq = (
        sum(different(i, j) for i, j in sets["eq_g"]) / len(sets["eq_g"])
        if sets["eq_g"] else 0.0
    )
    c_hard = (
        sum(not different(i, j) for i, j in sets["hard"]) / len(sets["hard"])
        if sets["hard"] else 0.0
    )
    s_sep = 1.0 - c_hard
    error = 0.5 * (c_eq + c_hard)
    return {
        "C_eq": c_eq,
        "C_hard": c_hard,
        "S_sep": s_sep,
        "task_error": error,
    }


def panel_a_metrics(params, rows):
    memories, gates, used = commit_records(
        params, rows, panel="A", authority=FULL_STATUS, query=Q0_AH11_GLOBAL
    )
    metrics = _eq_metric(memories, rows)
    metrics["mean_B_used"] = sum(used) / len(used)
    metrics["gate_keep_rate"] = sum(gates) / len(gates)
    return metrics


def p2_metrics(rows):
    return _eq_metric([r["P2"] for r in rows], rows)


def route_accuracy(memories: list[bytes]) -> float:
    pairs = unordered_pairs(len(memories))
    if not pairs:
        return 1.0
    collisions = sum(memories[i] == memories[j] for i, j in pairs)
    return 1.0 - collisions / len(pairs)


def panel_b_metrics(params, rows):
    out: dict[str, float] = {}
    for split in ("train", "validation", "test", "reserved"):
        subset = [r for r in rows if r["split"] == split]
        memories, gates, used = commit_records(
            params,
            subset,
            panel="B",
            authority=FULL_STATUS,
            query=Q1_PROBE_LATENT_ROUTE,
        )
        out[f"A_route_{split}"] = route_accuracy(memories)
        out[f"mean_B_used_{split}"] = sum(used) / len(used)
        out[f"gate_keep_rate_{split}"] = sum(gates) / len(gates)
    out["G_heldout"] = out["A_route_train"] - out["A_route_test"]
    return out


def append_ledger(ledger: bytes, receipt: dict[str, Any]) -> bytes:
    line = canonical_json(receipt) + b"\n"
    new = ledger + line
    if not new.startswith(ledger):
        raise AssertionError("ledger prefix immutability failed")
    return new


def revocation_metrics(params, rows):
    np = _np()
    north = next(r for r in rows if r["name"] == "NORTH")
    south = next(r for r in rows if r["name"] == "SOUTH")
    witness = [north, south]

    mh = model_hash(params)
    full_payloads, full_gates, _ = commit_records(
        params,
        witness,
        panel="B",
        authority=FULL_STATUS,
        query=Q2_AUTHORIZED_READ,
    )
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
    prefix_after_authorized = ledger

    violations = 0
    stale_statuses = []
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
            "REVOKED_BUT_STALE_RESIDUE_PRESENT" if got is None else "UNAUTHORIZED_PAYLOAD_RETURNED"
        )

    common_payloads, common_gates, _ = commit_records(
        params,
        witness,
        panel="B",
        authority=COMMON_ONLY,
        query=Q2_AUTHORIZED_READ,
    )
    aligned_equal = common_payloads[0] == common_payloads[1]

    ledger = append_ledger(ledger, {
        "mark": "AUTHORITY_AND_ACTIVE_MEMORY_ALIGNED",
        "authority": COMMON_ONLY,
        "model_hash": mh.hex(),
        "aligned_equal": aligned_equal,
    })
    prefix_ok = ledger.startswith(prefix_after_authorized)

    injection_statuses = []
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
            "STALE_RESIDUE_REFUSED" if got is None else "UNAUTHORIZED_PAYLOAD_RETURNED"
        )

    return {
        "L_revoke": violations,
        "stale_statuses": stale_statuses,
        "injection_statuses": injection_statuses,
        "current_aligned_equal": aligned_equal,
        "ledger_prefix_immutable": prefix_ok,
        "ledger_sha256": hashlib.sha256(ledger).hexdigest(),
        "model_hash": mh.hex(),
        "common_gate_values": common_gates,
    }


def evaluate_seed(seed: int):
    arows = panel_a_records()
    brows = panel_b_records()

    w1, w1_loss = train(seed, "w1")
    recon, recon_loss = train(seed, "recon")
    noncausal, noncausal_loss = train(seed, "noncausal")

    ma = panel_a_metrics(w1, arows)
    mr = panel_a_metrics(recon, arows)
    mn = panel_a_metrics(noncausal, arows)
    pb = panel_b_metrics(w1, brows)
    rv = revocation_metrics(w1, brows)

    strong = min(mr["task_error"], mn["task_error"])
    delta = strong - ma["task_error"]

    return {
        "seed": seed,
        "final_training_loss": {
            "w1": w1_loss,
            "recon": recon_loss,
            "noncausal": noncausal_loss,
        },
        "panel_a": {
            "w1": ma,
            "recon": mr,
            "noncausal": mn,
            "p2": p2_metrics(arows),
            "stronger_baseline_error": strong,
            "D_seed": delta,
        },
        "panel_b": pb,
        "revocation": rv,
    }


def execute():
    results = [evaluate_seed(seed) for seed in SEEDS]

    dvals = sorted(float(r["panel_a"]["D_seed"]) for r in results)
    median_d = dvals[len(dvals) // 2]

    ranked = sorted(
        results,
        key=lambda r: (float(r["panel_a"]["w1"]["task_error"]), int(r["seed"])),
    )
    median_seed_record = ranked[len(ranked) // 2]

    all_revoke = all(r["revocation"]["L_revoke"] == 0 for r in results)
    all_reserved = all(
        abs(r["panel_b"]["A_route_reserved"] - 1.0) < 1e-12 for r in results
    )
    all_revocation_structure = all(
        r["revocation"]["current_aligned_equal"]
        and r["revocation"]["ledger_prefix_immutable"]
        and all(x == "REVOKED_BUT_STALE_RESIDUE_PRESENT" for x in r["revocation"]["stale_statuses"])
        and all(x == "STALE_RESIDUE_REFUSED" for x in r["revocation"]["injection_statuses"])
        for r in results
    )

    median_ssep = median_seed_record["panel_a"]["w1"]["S_sep"]
    median_test = median_seed_record["panel_b"]["A_route_test"]

    candidate_pass = (
        all_revoke
        and all_reserved
        and all_revocation_structure
        and median_d > 0.0
        and abs(median_ssep - 1.0) < 1e-12
        and abs(median_test - 1.0) < 1e-12
    )

    np = _np()
    import platform

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
        "experiment": "NBG-W1",
        "version": VERSION,
        "status": "UNREVIEWED_EXECUTION",
        "machine_candidate_verdict": "PASS_W1" if candidate_pass else "FAIL_W1",
        "result_language_authorized": False,
        "compression_claim_authorized": False,
        "provenance": provenance,
        "B_X": {"panel_a": 8, "panel_b": 5},
        "B_capacity": 64,
        "CR": {"panel_a": 8.0, "panel_b": 12.8},
        "aggregate": {
            "median_D": median_d,
            "median_performance_seed": median_seed_record["seed"],
            "median_seed_S_sep": median_ssep,
            "median_seed_A_route_test": median_test,
            "all_seeds_L_revoke_zero": all_revoke,
            "all_seeds_reserved_pair_separated": all_reserved,
            "all_seeds_revocation_structure_passed": all_revocation_structure,
        },
        "seeds": results,
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
        if os.environ.get("NBG_W1_EXECUTION_AUTHORIZED") != "main-merged":
            raise SystemExit(
                "W1 training refused: set NBG_W1_EXECUTION_AUTHORIZED=main-merged "
                "only after the implementation is merged to main"
            )
        result = execute()
        encoded = (json.dumps(result, indent=2, sort_keys=True) + "\n").encode("utf-8")
        if args.output:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_bytes(encoded)
        print(json.dumps({
            "status": result["status"],
            "machine_candidate_verdict": result["machine_candidate_verdict"],
            "result_language_authorized": False,
            "median_D": result["aggregate"]["median_D"],
            "median_performance_seed": result["aggregate"]["median_performance_seed"],
            "result_sha256": hashlib.sha256(encoded).hexdigest(),
        }, indent=2, sort_keys=True))
        return

    parser.error("choose --static-check or --execute")


if __name__ == "__main__":
    main()

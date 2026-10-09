#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import random
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = Path(__file__).resolve().parents[3]
RB2 = REPO_ROOT / "experiments" / "RB2"

VERSION = "0.1.0"
SEED = 369
FOLDS = 5
STEPS = 1000
LR = 0.05
L2 = 0.01

TARGET_CLASSES = ("DECREASE", "NULL", "INCREASE")
BUBBLES = (
    "B0_FIELD",
    "B1_MEMBRANE_CHANNEL",
    "B2_INTRACELLULAR_SIGNAL",
    "B3_TRANSCRIPTION_CELL_STATE",
    "B4_CELL_BEHAVIOR_PATTERN",
    "B5_TISSUE_FUNCTION",
)

ARMS = (
    "FREQ_ONLY",
    "MULTIPARAMETER",
    "SHUFFLED_BOUNDARY",
    "LABEL_PERMUTATION",
    "SYNTHETIC_WINDOW_POSITIVE",
)

NUMERIC_MULTI = (
    "frequency_hz",
    "amplitude_value_si",
    "exposure_duration_s",
    "repeated_exposure_count",
)

CATEGORICAL_MULTI = (
    "field_type",
    "waveform",
    "geometry_or_orientation",
    "system_class",
    "species",
    "sample_class",
    "endpoint_class",
    "bubble_from",
    "bubble_to",
)

FORBIDDEN_FEATURE_FIELDS = frozenset({
    "row_id", "source_id", "lineage_id", "source_locator",
    "title", "author", "authors", "doi", "pmid", "journal",
    "study_year", "year", "reported_direction", "reported_significance",
    "effect_size_value", "effect_size_type", "mechanism_claim_class",
    "extraction_note", "record_digest_sha256",
})

EXPECTED_MANIFEST_DIGEST = "2a91f27c113fb4ae3b63ec8bfad2b2c1c99e84417bd5f3e095c803b9e4c4e351"
LINEAGE_ORDER_DOMAIN = "NBG-RB2-LINEAGE-ORDER-v0.1.0:"
EXPECTED_FOLDS = {
    0: ("L004", "L002", "L005"),
    1: ("L003", "L006"),
    2: ("L009", "L007"),
    3: ("L011", "L008"),
    4: ("L010", "L001"),
}


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def corpus_digest(manifest: dict[str, Any]) -> str:
    payload = "".join(
        str(row["record_digest_sha256"]) + "\n"
        for row in manifest["records"]
    ).encode("utf-8")
    return sha256_bytes(payload)


def canonical_lineage_folds(lineages: list[str]) -> dict[int, tuple[str, ...]]:
    ordered = sorted(
        lineages,
        key=lambda x: hashlib.sha256(
            (LINEAGE_ORDER_DOMAIN + x).encode("utf-8")
        ).hexdigest(),
    )
    out: dict[int, list[str]] = {i: [] for i in range(FOLDS)}
    for i, lineage in enumerate(ordered):
        out[i % FOLDS].append(lineage)
    return {k: tuple(v) for k, v in out.items()}


def static_check() -> dict[str, Any]:
    manifest = load_json(RB2 / "corpus_manifest.json")
    schema = load_json(RB2 / "extraction_schema.json")
    context = load_json(RB2 / "context_registry.json")

    checks: dict[str, bool] = {}
    checks["manifest_digest"] = corpus_digest(manifest) == EXPECTED_MANIFEST_DIGEST
    checks["manifest_declared_digest"] = (
        manifest.get("manifest_digest_sha256") == EXPECTED_MANIFEST_DIGEST
    )
    checks["source_count"] = len(manifest["records"]) == 14
    lineages = sorted({r["lineage"] for r in manifest["records"]})
    checks["lineage_count"] = len(lineages) == 11
    checks["folds"] = canonical_lineage_folds(lineages) == EXPECTED_FOLDS
    checks["context_not_model_input"] = context.get("model_input") is False
    checks["arms"] = ARMS == (
        "FREQ_ONLY",
        "MULTIPARAMETER",
        "SHUFFLED_BOUNDARY",
        "LABEL_PERMUTATION",
        "SYNTHETIC_WINDOW_POSITIVE",
    )
    required = set(schema["required_fields"])
    checks["required_target"] = "reported_direction" in required
    checks["required_lineage"] = "lineage_id" in required
    checks["no_forbidden_numeric"] = not (
        set(NUMERIC_MULTI) & FORBIDDEN_FEATURE_FIELDS
    )
    checks["no_forbidden_categorical"] = not (
        set(CATEGORICAL_MULTI) & FORBIDDEN_FEATURE_FIELDS
    )
    checks["no_privileged_frequency"] = all(
        x not in NUMERIC_MULTI and x not in CATEGORICAL_MULTI
        for x in ("7.83", "10.5", "14.1")
    )
    checks["bubble_vocabulary"] = (
        len(BUBBLES) == 6 and len(set(BUBBLES)) == 6
    )

    if not all(checks.values()):
        failed = sorted(k for k, ok in checks.items() if not ok)
        raise AssertionError(
            "RB3 static contract failed: " + ", ".join(failed)
        )
    return checks


def parse_float(value: Any) -> float | None:
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return float(int(value))
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


class Preprocessor:
    def __init__(
        self,
        numeric: tuple[str, ...],
        categorical: tuple[str, ...],
    ):
        self.numeric = numeric
        self.categorical = categorical
        self.medians: dict[str, float] = {}
        self.means: dict[str, float] = {}
        self.scales: dict[str, float] = {}
        self.vocab: dict[str, tuple[str, ...]] = {}
        self.feature_names: list[str] = []

    def fit(self, rows: list[dict[str, Any]]) -> "Preprocessor":
        if not rows:
            raise ValueError("empty training rows")

        self.feature_names = []

        for field in self.numeric:
            vals = sorted(
                v
                for r in rows
                if (v := parse_float(r.get(field))) is not None
            )

            if vals:
                if len(vals) % 2:
                    median = vals[len(vals) // 2]
                else:
                    median = (
                        vals[len(vals) // 2 - 1]
                        + vals[len(vals) // 2]
                    ) / 2
            else:
                median = 0.0

            filled = [parse_float(r.get(field)) for r in rows]
            filled2 = [median if v is None else v for v in filled]
            mean = sum(filled2) / len(filled2)
            var = sum((v - mean) ** 2 for v in filled2) / len(filled2)
            scale = math.sqrt(var) or 1.0

            self.medians[field] = median
            self.means[field] = mean
            self.scales[field] = scale
            self.feature_names.extend(
                [field, field + "__MISSING"]
            )

        for field in self.categorical:
            vals = sorted({
                str(r.get(field))
                for r in rows
                if r.get(field) not in (None, "")
            })
            self.vocab[field] = tuple(vals)
            for value in vals:
                self.feature_names.append(
                    f"{field}=={value}"
                )
            self.feature_names.append(
                f"{field}==__UNK__"
            )

        return self

    def transform_row(
        self,
        row: dict[str, Any],
    ) -> list[float]:
        out: list[float] = []

        for field in self.numeric:
            raw = parse_float(row.get(field))
            missing = raw is None
            value = self.medians[field] if missing else raw
            out.append(
                (value - self.means[field]) / self.scales[field]
            )
            out.append(1.0 if missing else 0.0)

        for field in self.categorical:
            raw = (
                None
                if row.get(field) in (None, "")
                else str(row.get(field))
            )
            vocab = self.vocab[field]
            for value in vocab:
                out.append(1.0 if raw == value else 0.0)
            out.append(
                1.0
                if raw is not None and raw not in vocab
                else 0.0
            )

        return out

    def transform(
        self,
        rows: list[dict[str, Any]],
    ) -> list[list[float]]:
        return [self.transform_row(r) for r in rows]


def softmax(logits: list[float]) -> list[float]:
    m = max(logits)
    exps = [math.exp(v - m) for v in logits]
    total = sum(exps)
    return [v / total for v in exps]


class SoftmaxRegression:
    def __init__(
        self,
        n_features: int,
        n_classes: int = 3,
    ):
        self.n_features = n_features
        self.n_classes = n_classes
        self.w = [
            [0.0 for _ in range(n_features + 1)]
            for _ in range(n_classes)
        ]

    def fit(
        self,
        x: list[list[float]],
        y: list[int],
    ) -> "SoftmaxRegression":
        if not x or len(x) != len(y):
            raise ValueError("invalid training matrix")

        for _ in range(STEPS):
            grad = [
                [0.0 for _ in range(self.n_features + 1)]
                for _ in range(self.n_classes)
            ]

            for row, target in zip(x, y):
                xb = row + [1.0]
                probs = softmax([
                    sum(
                        wj * xv
                        for wj, xv in zip(wc, xb)
                    )
                    for wc in self.w
                ])

                for c in range(self.n_classes):
                    err = probs[c] - (
                        1.0 if c == target else 0.0
                    )
                    for j, xv in enumerate(xb):
                        grad[c][j] += err * xv

            n = float(len(x))
            for c in range(self.n_classes):
                for j in range(self.n_features + 1):
                    reg = (
                        0.0
                        if j == self.n_features
                        else L2 * self.w[c][j]
                    )
                    self.w[c][j] -= LR * (
                        grad[c][j] / n + reg
                    )

        return self

    def predict_proba(
        self,
        x: list[list[float]],
    ) -> list[list[float]]:
        out = []
        for row in x:
            xb = row + [1.0]
            out.append(
                softmax([
                    sum(
                        wj * xv
                        for wj, xv in zip(wc, xb)
                    )
                    for wc in self.w
                ])
            )
        return out

    def predict(
        self,
        x: list[list[float]],
    ) -> list[int]:
        return [
            max(
                range(self.n_classes),
                key=lambda c: p[c],
            )
            for p in self.predict_proba(x)
        ]


def balanced_accuracy(
    y_true: list[int],
    y_pred: list[int],
) -> float:
    recalls = []

    for c in range(len(TARGET_CLASSES)):
        idx = [
            i
            for i, y in enumerate(y_true)
            if y == c
        ]
        if not idx:
            continue

        recalls.append(
            sum(
                1
                for i in idx
                if y_pred[i] == c
            ) / len(idx)
        )

    return (
        sum(recalls) / len(recalls)
        if recalls
        else 0.0
    )


def macro_f1(
    y_true: list[int],
    y_pred: list[int],
) -> float:
    scores = []

    for c in range(len(TARGET_CLASSES)):
        tp = sum(
            1
            for a, b in zip(y_true, y_pred)
            if a == c and b == c
        )
        fp = sum(
            1
            for a, b in zip(y_true, y_pred)
            if a != c and b == c
        )
        fn = sum(
            1
            for a, b in zip(y_true, y_pred)
            if a == c and b != c
        )

        if tp == 0 and fp == 0 and fn == 0:
            continue

        precision = (
            tp / (tp + fp)
            if tp + fp
            else 0.0
        )
        recall = (
            tp / (tp + fn)
            if tp + fn
            else 0.0
        )

        scores.append(
            2 * precision * recall / (
                precision + recall
            )
            if precision + recall
            else 0.0
        )

    return (
        sum(scores) / len(scores)
        if scores
        else 0.0
    )


def multiclass_brier(
    y_true: list[int],
    probs: list[list[float]],
) -> float:
    if not y_true:
        return 0.0

    total = 0.0
    for y, p in zip(y_true, probs):
        total += sum(
            (
                p[c]
                - (
                    1.0 if c == y else 0.0
                )
            ) ** 2
            for c in range(len(TARGET_CLASSES))
        )

    return total / len(y_true)


def target_index(row: dict[str, Any]) -> int:
    target = str(row.get("reported_direction"))
    if target not in TARGET_CLASSES:
        raise ValueError(
            f"unsupported target {target}"
        )
    return TARGET_CLASSES.index(target)


def feature_spec(
    arm: str,
) -> tuple[tuple[str, ...], tuple[str, ...]]:
    if arm == "FREQ_ONLY":
        return ("frequency_hz",), ()

    if arm in (
        "MULTIPARAMETER",
        "SHUFFLED_BOUNDARY",
        "LABEL_PERMUTATION",
    ):
        return NUMERIC_MULTI, CATEGORICAL_MULTI

    raise ValueError(arm)


def shuffle_boundaries(
    rows: list[dict[str, Any]],
    seed: int,
) -> list[dict[str, Any]]:
    rng = random.Random(seed)
    pairs = [
        (
            r.get("bubble_from"),
            r.get("bubble_to"),
        )
        for r in rows
    ]
    rng.shuffle(pairs)

    out = []
    for row, pair in zip(rows, pairs):
        copy = dict(row)
        copy["bubble_from"], copy["bubble_to"] = pair
        out.append(copy)

    return out


def permute_training_labels(
    rows: list[dict[str, Any]],
    seed: int,
) -> list[dict[str, Any]]:
    rng = random.Random(seed)
    labels = [
        r["reported_direction"]
        for r in rows
    ]
    rng.shuffle(labels)

    out = []
    for row, label in zip(rows, labels):
        copy = dict(row)
        copy["reported_direction"] = label
        out.append(copy)

    return out


def evaluate_arm(
    train: list[dict[str, Any]],
    test: list[dict[str, Any]],
    arm: str,
    seed: int = SEED,
) -> dict[str, float]:
    train_rows = train
    test_rows = test

    if arm == "SHUFFLED_BOUNDARY":
        train_rows = shuffle_boundaries(
            train,
            seed,
        )
        test_rows = shuffle_boundaries(
            test,
            seed + 1,
        )

    if arm == "LABEL_PERMUTATION":
        train_rows = permute_training_labels(
            train,
            seed,
        )

    numeric, categorical = feature_spec(arm)

    pp = Preprocessor(
        numeric,
        categorical,
    ).fit(train_rows)

    x_train = pp.transform(train_rows)
    x_test = pp.transform(test_rows)

    y_train = [
        target_index(r)
        for r in train_rows
    ]
    y_test = [
        target_index(r)
        for r in test_rows
    ]

    model = SoftmaxRegression(
        len(x_train[0])
    ).fit(
        x_train,
        y_train,
    )

    probs = model.predict_proba(x_test)
    pred = [
        max(
            range(len(TARGET_CLASSES)),
            key=lambda c: p[c],
        )
        for p in probs
    ]

    return {
        "balanced_accuracy": balanced_accuracy(
            y_test,
            pred,
        ),
        "macro_f1": macro_f1(
            y_test,
            pred,
        ),
        "brier": multiclass_brier(
            y_test,
            probs,
        ),
    }


def synthetic_rows() -> list[dict[str, Any]]:
    rows = []
    systems = (
        "NEURAL",
        "EPIDERMAL",
        "FIBROBLAST",
    )
    endpoints = (
        "PROLIFERATION",
        "DIFFERENTIATION",
    )
    idx = 0

    for system_i, system in enumerate(systems):
        for endpoint_i, endpoint in enumerate(endpoints):
            for freq in (
                5.0,
                10.0,
                20.0,
                50.0,
            ):
                for amp in (
                    0.0001,
                    0.0005,
                    0.0010,
                    0.0050,
                ):
                    for duration in (
                        900.0,
                        3600.0,
                    ):
                        latent = (
                            0.02 * freq
                            + 450.0 * amp
                            + duration / 2400.0
                            + (
                                0.7
                                if system == "NEURAL"
                                else (
                                    -0.4
                                    if system == "FIBROBLAST"
                                    else 0.0
                                )
                            )
                            + (
                                0.3
                                if endpoint == "DIFFERENTIATION"
                                else 0.0
                            )
                        )

                        if latent >= 2.1:
                            label = "INCREASE"
                        elif latent <= 1.0:
                            label = "NULL"
                        else:
                            label = "DECREASE"

                        rows.append({
                            "row_id": f"SYN-{idx:04d}",
                            "lineage_id": (
                                f"SYN-L{(idx % 12):02d}"
                            ),
                            "frequency_hz": freq,
                            "amplitude_value_si": amp,
                            "exposure_duration_s": duration,
                            "repeated_exposure_count": (
                                1.0 + (idx % 3)
                            ),
                            "field_type": "MAGNETIC",
                            "waveform": "SINUSOIDAL",
                            "geometry_or_orientation": "SYNTHETIC",
                            "system_class": system,
                            "species": "SYNTHETIC",
                            "sample_class": system,
                            "endpoint_class": endpoint,
                            "bubble_from": "B0_FIELD",
                            "bubble_to": BUBBLES[
                                1 + (
                                    (
                                        system_i
                                        + endpoint_i
                                    )
                                    % 5
                                )
                            ],
                            "reported_direction": label,
                        })
                        idx += 1

    return rows


def synthetic_control() -> dict[str, Any]:
    rows = synthetic_rows()
    train = [
        r
        for i, r in enumerate(rows)
        if i % 4 != 0
    ]
    test = [
        r
        for i, r in enumerate(rows)
        if i % 4 == 0
    ]

    freq = evaluate_arm(
        train,
        test,
        "FREQ_ONLY",
    )
    multi = evaluate_arm(
        train,
        test,
        "MULTIPARAMETER",
    )

    passed = (
        multi["balanced_accuracy"] >= 0.75
        and multi["macro_f1"] >= 0.70
        and (
            multi["balanced_accuracy"]
            - freq["balanced_accuracy"]
        ) >= 0.25
    )

    return {
        "passed": passed,
        "freq_only": freq,
        "multiparameter": multi,
    }


def load_rows_csv(
    path: Path,
) -> list[dict[str, Any]]:
    with path.open(
        "r",
        encoding="utf-8",
        newline="",
    ) as handle:
        rows = list(
            csv.DictReader(handle)
        )

    if not rows:
        raise ValueError(
            "empty extraction table"
        )

    return rows


def fold_partition(
    rows: list[dict[str, Any]],
    k: int,
) -> tuple[
    list[dict[str, Any]],
    list[dict[str, Any]],
    list[dict[str, Any]],
]:
    test_lineages = set(
        EXPECTED_FOLDS[k]
    )
    valid_lineages = set(
        EXPECTED_FOLDS[
            (k + 1) % FOLDS
        ]
    )

    train: list[dict[str, Any]] = []
    valid: list[dict[str, Any]] = []
    test: list[dict[str, Any]] = []

    for row in rows:
        lineage = row.get("lineage_id")

        if lineage in test_lineages:
            test.append(row)
        elif lineage in valid_lineages:
            valid.append(row)
        else:
            train.append(row)

    return train, valid, test


def execute(
    rows_path: Path,
) -> dict[str, Any]:
    static_check()

    syn = synthetic_control()
    if not syn["passed"]:
        return {
            "result": "VOID_RB3_CONTROL_FAILURE",
            "synthetic": syn,
        }

    rows = load_rows_csv(rows_path)

    supported = [
        r
        for r in rows
        if r.get("reported_direction")
        in TARGET_CLASSES
    ]

    if len(supported) != len(rows):
        raise ValueError(
            "RB3 rows must have target "
            "INCREASE/DECREASE/NULL only"
        )

    fold_reports = []

    for k in range(FOLDS):
        train, valid, test = fold_partition(
            supported,
            k,
        )

        if (
            not train
            or not valid
            or not test
        ):
            return {
                "result": (
                    "VOID_RB3_"
                    "INSUFFICIENT_LINEAGE_HOLDOUT"
                ),
                "fold": k,
            }

        train_lineages = {
            r["lineage_id"]
            for r in train
        }
        valid_lineages = {
            r["lineage_id"]
            for r in valid
        }
        test_lineages = {
            r["lineage_id"]
            for r in test
        }

        if (
            train_lineages & valid_lineages
            or train_lineages & test_lineages
            or valid_lineages & test_lineages
        ):
            return {
                "result": "VOID_RB3_SOURCE_LEAK",
                "fold": k,
            }

        arms = {}
        for arm in (
            "FREQ_ONLY",
            "MULTIPARAMETER",
            "SHUFFLED_BOUNDARY",
            "LABEL_PERMUTATION",
        ):
            arms[arm] = evaluate_arm(
                train,
                test,
                arm,
                seed=SEED + k,
            )

        fold_reports.append({
            "fold": k,
            "arms": arms,
            "n_train": len(train),
            "n_validation": len(valid),
            "n_test": len(test),
        })

    def mean_metric(
        arm: str,
        metric: str,
    ) -> float:
        return (
            sum(
                fr["arms"][arm][metric]
                for fr in fold_reports
            )
            / FOLDS
        )

    summary = {
        arm: {
            metric: mean_metric(
                arm,
                metric,
            )
            for metric in (
                "balanced_accuracy",
                "macro_f1",
                "brier",
            )
        }
        for arm in (
            "FREQ_ONLY",
            "MULTIPARAMETER",
            "SHUFFLED_BOUNDARY",
            "LABEL_PERMUTATION",
        )
    }

    multi = summary["MULTIPARAMETER"]
    freq = summary["FREQ_ONLY"]
    shuffled = summary[
        "SHUFFLED_BOUNDARY"
    ]
    permuted = summary[
        "LABEL_PERMUTATION"
    ]

    if max(
        multi["balanced_accuracy"],
        freq["balanced_accuracy"],
        shuffled["balanced_accuracy"],
    ) <= permuted["balanced_accuracy"]:
        result = (
            "FAIL_RB3_"
            "NO_REPRODUCIBLE_STRUCTURE"
        )
    elif (
        multi["macro_f1"]
        < freq["macro_f1"] + 0.05
    ):
        result = (
            "FAIL_RB3_"
            "MULTIPARAMETER_NO_ADVANTAGE"
        )
    elif (
        multi["macro_f1"]
        < shuffled["macro_f1"] + 0.03
    ):
        result = (
            "FAIL_RB3_"
            "BOUNDARY_NO_ADVANTAGE"
        )
    else:
        wins = sum(
            1
            for fr in fold_reports
            if (
                fr["arms"][
                    "MULTIPARAMETER"
                ]["macro_f1"]
                >
                fr["arms"][
                    "SHUFFLED_BOUNDARY"
                ]["macro_f1"]
            )
        )

        result = (
            "QUALIFIED_RB3_"
            "NESTED_RESPONSE_STRUCTURE"
            if wins >= 3
            else (
                "QUALIFIED_RB3_"
                "MULTIPARAMETER_RESPONSE"
            )
        )

    return {
        "protocol": "NBG-RB3",
        "version": VERSION,
        "result": result,
        "synthetic": syn,
        "summary": summary,
        "folds": fold_reports,
        "claim_boundary": (
            "Computational classification of "
            "frozen literature rows only; "
            "not a treatment, causal, or "
            "clinical result."
        ),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--static-check",
        action="store_true",
    )
    parser.add_argument(
        "--synthetic-check",
        action="store_true",
    )
    parser.add_argument(
        "--execute",
        type=Path,
    )
    parser.add_argument(
        "--output",
        type=Path,
    )
    args = parser.parse_args()

    if args.static_check:
        print(json.dumps({
            "status": "PASS_RB3_STATIC",
            "checks": static_check(),
        }, indent=2, sort_keys=True))
        return 0

    if args.synthetic_check:
        static_check()
        result = synthetic_control()
        print(json.dumps(
            result,
            indent=2,
            sort_keys=True,
        ))
        return (
            0
            if result["passed"]
            else 1
        )

    if args.execute:
        result = execute(args.execute)
        payload = (
            json.dumps(
                result,
                indent=2,
                sort_keys=True,
            )
            + "\n"
        )

        if args.output:
            args.output.parent.mkdir(
                parents=True,
                exist_ok=True,
            )
            args.output.write_text(
                payload,
                encoding="utf-8",
            )

        print(payload, end="")
        return 0

    parser.error(
        "choose --static-check, "
        "--synthetic-check, or --execute"
    )
    return 2


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""RB3-R5-E5 exact-input optimistic oracle bound, NOT model training.

The label-informed lookup deliberately leaks true labels to establish an
upper bound for deterministic functions on the frozen 13 input fields.
It cannot establish test accuracy, biological validity or review approval.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import math
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

E5 = Path(__file__).resolve().parent
R5 = E5.parent
RB3 = R5.parent
RB2 = RB3.parent / "RB2"
POLICY = E5 / "ceiling_policy.json"

sys.path.insert(0, str(R5 / "E4"))
import audit_identifiability as e4  # noqa: E402
sys.path.insert(0, str(R5))
import build_review_packet as previous  # noqa: E402

RUNNER_SPEC = importlib.util.spec_from_file_location("rb3_e5_frozen_runner", RB3 / "src/rb3.py")
if RUNNER_SPEC is None or RUNNER_SPEC.loader is None:
    raise RuntimeError("frozen model source not importable")
frozen = importlib.util.module_from_spec(RUNNER_SPEC)
RUNNER_SPEC.loader.exec_module(frozen)

EXPECTED_COUNTS_BY_FOLD = {0:27,1:3,2:14,3:11,4:9}
EXPECTED_MISSING_BY_FOLD = {0:("L005",),1:("L006",),2:(),3:(),4:("L010",)}
EXPECTED_LINEAGE_ROWS = {
    "L001":9,"L002":18,"L003":3,"L004":9,"L005":0,"L006":0,
    "L007":12,"L008":8,"L009":2,"L010":0,"L011":3,
}
EXPECTED_COLLISIONS = {
    ("RB3R1-S002-03","RB3R1-S002-04"),
    ("RB3R1-S002-05","RB3R1-S002-06"),
    ("RB3R1-S002-07","RB3R1-S002-08","RB3R1-S002-09"),
    ("RB3R1-S003-13","RB3R1-S003-14","RB3R1-S003-15"),
}
BOUND_STATUS = "PASS_RB3_R5_E5_CANDIDATE_ORACLE_CEILING_ONLY"


def require(ok: bool, message: str) -> None:
    if not ok:
        raise ValueError("RB3-R5-E5 REFUSED: " + message)


def json_file(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf8"))


def fold_map_from_original() -> dict[int, tuple[str, ...]]:
    manifest=json_file(RB2 / "corpus_manifest.json")
    require(manifest["manifest_digest_sha256"] == previous.RB2_MANIFEST_DIGEST,
            "frozen RB2 source digest changed")
    lineages=sorted({source["lineage"] for source in manifest["records"]})
    require(len(lineages)==11, "frozen source-lineage count changed")
    require(frozen.canonical_lineage_folds(lineages) == frozen.EXPECTED_FOLDS,
            "frozen model lineage-fold rule changed")
    orig={int(k):tuple(v) for k,v in manifest["split_policy"]["folds"].items()}
    require(orig == frozen.EXPECTED_FOLDS, "manifest/model fold mapping differs")
    require(manifest["split_policy"]["type"] == "GROUPED_5_FOLD_LINEAGE_CROSS_VALIDATION",
            "original grouped split changed")
    return orig


def group_bound(rows: list[dict[str,str]]) -> dict[str,Any]:
    fields=tuple(previous.MODEL_FIELDS)
    require(len(fields)==13 and len(set(fields))==13,"frozen predictor field count changed")
    require("source_id" not in fields and "lineage_id" not in fields and "reported_direction" not in fields,
            "leakage field included in model features")
    groups: dict[tuple[str,...],list[dict[str,str]]] = defaultdict(list)
    for row in rows:
        require(row["reported_direction"] in frozen.TARGET_CLASSES, "unsupported target class")
        groups[tuple(row[k] for k in fields)].append(row)
    n=len(rows)
    theoretical_correct=sum(
        max(Counter(x["reported_direction"] for x in group).values())
        for group in groups.values()
    )
    errors=n-theoretical_correct
    conflicts=sorted(
        [
            {
                "row_ids":sorted(x["row_id"] for x in group),
                "sources":sorted({x["source_id"] for x in group}),
                "lineages":sorted({x["lineage_id"] for x in group}),
                "labels":dict(sorted(Counter(x["reported_direction"] for x in group).items())),
                "minimum_errors":len(group)-max(Counter(x["reported_direction"] for x in group).values()),
            }
            for group in groups.values()
            if len({x["reported_direction"] for x in group})>1
        ],
        key=lambda item:item["row_ids"],
    )
    return {
        "candidate_rows":n,
        "exact_input_vectors":len(groups),
        "opposing_label_groups":len(conflicts),
        "rows_in_opposing_groups":sum(sum(c["labels"].values()) for c in conflicts),
        "oracle_best_correct":theoretical_correct,
        "oracle_unavoidable_errors":errors,
        "oracle_ceiling_fraction":f"{theoretical_correct}/{n}" if n else "UNDEFINED_NO_ROWS",
        "oracle_ceiling_pct":round(100*theoretical_correct/n,8) if n else None,
        "conflicting_groups":conflicts,
    }


def checked_bound(policy: dict[str,Any], rows: list[dict[str,str]],
                  folds: dict[int,tuple[str,...]]) -> dict[str,Any]:
    require(policy["id"] == "NBG-RB3-R5-E5-FEATURE-CEILING-POLICY", "policy identity drift")
    require(policy["version"] == "0.1.0", "policy version drift")
    require(policy["status"] == "DIAGNOSTIC_ONLY_NOT_MODEL_FIT", "model fit misrepresented")
    require(policy["frozen_predictor_count"] == len(previous.MODEL_FIELDS) == 13,
            "frozen predictor schema changed")
    require(policy["target_labels"] == list(frozen.TARGET_CLASSES),
            "target label order changed")
    require(policy["candidate_rows"] == len(rows) == 64, "candidate number changed")
    require(len(set(r["row_id"] for r in rows)) == len(rows),"duplicate candidate row")
    require(len(set(r["source_id"] for r in rows)) == policy["candidate_source_count"] == 9,
            "source coverage changed")
    require(len(set(r["lineage_id"] for r in rows)) == policy["candidate_lineages"] == 8,
            "lineage coverage changed")
    require(policy["frozen_lineages"] == 11, "original lineage number changed")
    require(policy["stop_result"] == previous.BLOCK_CLASS,
            "model execution block changed")
    require(policy["bound_definition"].startswith("For every exact original"),
            "label-informed ceiling definition removed")

    configured={int(k):tuple(v) for k,v in policy["frozen_fold_lineages"].items()}
    require(configured==folds==frozen.EXPECTED_FOLDS, "fold reassignment or fold metadata drift")
    require(sum(len(v) for v in folds.values()) == 11,"frozen lineage count missing")
    lineage_counts=Counter(row["lineage_id"] for row in rows)
    for lin,n in EXPECTED_LINEAGE_ROWS.items():
        require(lineage_counts.get(lin,0)==n,"source lineage candidate count changed: "+lin)
    require(set(lineage_counts)=={lin for lin in EXPECTED_LINEAGE_ROWS if EXPECTED_LINEAGE_ROWS[lin]>0},
            "invented missing-lineage candidates")

    restrictions=policy["scientific_gates"]
    require(restrictions["independent_review_attestations"]==0,
            "independent review approval fabricated")
    require(restrictions["reviewed_eligible_rows"]==0,
            "fit-eligible row promotion fabricated")
    require(restrictions["real_execution_authorized"] is False,
            "real model execution authorized")
    for flag in ("no_model_training","no_label_or_row_modification",
                 "no_posthoc_predictor_extension","no_heldout_accuracy_claim",
                 "no_source_paper_equivalence_claim","no_medical_or_regenerative_claim",
                 "may_recommend_void_if_corpus_inadequate"):
        require(restrictions.get(flag) is True,"scientific claim firewall disabled: "+flag)
    require(len(policy["explanations"])>=8 and all(policy["explanations"]),
            "evidence caveats removed")

    summary=group_bound(rows)
    bound=policy["mathematical_bound"]
    require(summary["exact_input_vectors"]==57 and
            summary["opposing_label_groups"]==4 and
            summary["rows_in_opposing_groups"]==10,
            "original R5 E4 collision accounting changed")
    require({tuple(item["row_ids"]) for item in summary["conflicting_groups"]}==EXPECTED_COLLISIONS,
            "conflict row IDs altered")
    require(all(item["minimum_errors"]==1 for item in summary["conflicting_groups"]),
            "per-group unavoidable-error accounting drift")
    require(summary["oracle_best_correct"]==bound["oracle_best_correct"]==60,
            "oracle numerator changed")
    require(summary["oracle_unavoidable_errors"]==bound["oracle_unavoidable_errors"]==4,
            "minimum error count changed")
    require(bound["oracle_accuracy_upper_bound_fraction"]=="60/64",
            "oracle fraction misreported")
    require(bound["oracle_minimum_error_fraction"]=="4/64",
            "oracle error fraction misreported")
    require(math.isclose(summary["oracle_ceiling_pct"],bound["oracle_accuracy_upper_bound_pct"],
                          rel_tol=0,abs_tol=1e-9),
            "oracle percentage changed")
    require(bound["no_statistical_confidence_interval"] is True,
            "invented statistical uncertainty")

    l002=[x for x in rows if x["lineage_id"]=="L002"]
    l002_bound=group_bound(l002)
    require(l002_bound["oracle_best_correct"]==bound["lineage_L002_best_correct"]==14
            and l002_bound["candidate_rows"]==bound["lineage_L002_total_rows"]==18,
            "L002 lineage bound misreported")
    require(l002_bound["oracle_unavoidable_errors"]==4,
            "L002 contradiction location changed")

    frozen_lineage_set={lin for ls in folds.values() for lin in ls}
    observed_lineages=set(lineage_counts)
    folds_report=[]
    for idx,holdout in sorted(folds.items()):
        subset=[row for row in rows if row["lineage_id"] in holdout]
        stats=group_bound(subset)
        missing=sorted(set(holdout)-observed_lineages)
        require(tuple(missing)==EXPECTED_MISSING_BY_FOLD[idx],
                "unreviewed test-fold gaps changed")
        require(missing == policy["missing_lineage_map"][str(idx)],
                "hidden incomplete lineage coverage in policy")
        require(stats["candidate_rows"] == EXPECTED_COUNTS_BY_FOLD[idx] ==
                policy["expected_candidate_rows_by_fold"][str(idx)],
                "heldout candidate row counts changed")
        if idx==0:
            require(stats["oracle_best_correct"]==bound["test_fold_0_candidate_best_correct"]==23,
                    "fold0 oracle numerator drift")
            require(stats["candidate_rows"]==bound["test_fold_0_candidate_total_rows"]==27,
                    "fold0 oracle denominator drift")
            require(stats["oracle_unavoidable_errors"]==4,
                    "L002 mixed labels missing from fold0")
        else:
            require(stats["oracle_unavoidable_errors"]==0,
                    "additional label collisions outside L002")
        folds_report.append({
            "test_fold":idx,
            "frozen_test_lineages":list(holdout),
            "candidate_rows":len(subset),
            "missing_lineages":missing,
            "oracle_upper_bound_fraction":stats["oracle_ceiling_fraction"],
            "unavoidable_candidate_errors":stats["oracle_unavoidable_errors"],
            "not_a_cross_validation_result":True,
        })
    require(frozen_lineage_set==set(EXPECTED_LINEAGE_ROWS),"frozen lineage universe changed")
    require(sum(f["candidate_rows"] for f in folds_report)==64,
            "test fold accounting lost candidates")
    require(sum(f["unavoidable_candidate_errors"] for f in folds_report)==4,
            "irreducible collision errors shifted")

    return {
        "status":BOUND_STATUS,
        "scientific_state":"UNREVIEWED_SOURCE_ATTRIBUTED_CANDIDATES_ONLY",
        "candidate_rows":64,
        "candidate_sources":9,
        "represented_candidate_lineages":8,
        "missing_candidate_lineages":["L005","L006","L010"],
        "unique_frozen_feature_vectors":summary["exact_input_vectors"],
        "mixed_label_groups":summary["opposing_label_groups"],
        "mixed_label_rows":summary["rows_in_opposing_groups"],
        "oracle_best_correct_with_true_labels":summary["oracle_best_correct"],
        "unavoidable_in_sample_errors":summary["oracle_unavoidable_errors"],
        "optimistic_in_sample_upper_bound_pct":summary["oracle_ceiling_pct"],
        "L002_lineage_oracle_upper_bound_fraction":l002_bound["oracle_ceiling_fraction"],
        "test_folds":folds_report,
        "independent_review_attestations":0,
        "actual_trained_model_metrics":None,
        "heldout_accuracy":None,
        "real_model_execution_authorized":False,
        "warning":"This is a label-informed in-sample upper bound on unreviewed candidate labels, NOT achieved model accuracy, cross-validation, independent validation or biological efficacy.",
    }


def audit() -> dict[str,Any]:
    prior=e4.audit()
    require(prior["candidate_rows"]==64 and prior["opposing_label_predictor_groups"]==4,
            "E4 collision baseline changed")
    packet=previous.packet()
    require(packet["candidate_rows"]==64 and packet["reviewed_eligible_rows"]==0 and
            packet["independent_review_attestations"]==0 and
            packet["execution_authorized"] is False,
            "real review approval claimed prematurely")
    require(not (RB3/"FROZEN_ROWS.csv").exists() and not (RB3/"REAL_ROWS_FREEZE.json").exists(),
            "premature training freeze present")
    require(frozen.static_check()["passed"] is True,
            "frozen RB3 static protocol no longer qualified")
    return checked_bound(json_file(POLICY),e4.read_rows(),fold_map_from_original())


def markdown(report: dict[str,Any]) -> str:
    lines=[
        "# NBG-RB3-R5-E5: Exact-frozen-input oracle ceiling",
        "",
        "**NOT A TRAINED MODEL, NOT HELDOUT ACCURACY, NOT INDEPENDENT BIOLOGICAL REVIEW.**",
        "",
        "| Diagnostic | Source-attributed candidates |",
        "|---|---:|",
        f"| Candidate observations | {report['candidate_rows']} |",
        f"| Distinct E0 exact inputs | {report['unique_frozen_feature_vectors']} |",
        f"| Conflicting input groups | {report['mixed_label_groups']} |",
        f"| Rows in those groups | {report['mixed_label_rows']} |",
        f"| Forced errors under any deterministic mapping | {report['unavoidable_in_sample_errors']} |",
        f"| Optimistic label-informed upper bound | {report['oracle_best_correct_with_true_labels']}/{report['candidate_rows']} ({report['optimistic_in_sample_upper_bound_pct']}%) |",
        "",
        "## Original source-lineage holdout",
        "",
        "| Test fold | Frozen test lineages | Candidate rows | Absent test lineage | Oracle fraction (NOT CV) |",
        "|---|---|---:|---|---|",
    ]
    for fold in report["test_folds"]:
        lines.append("| "+" | ".join([
            str(fold["test_fold"]),
            ", ".join(fold["frozen_test_lineages"]),
            str(fold["candidate_rows"]),
            ", ".join(fold["missing_lineages"]) or "none",
            fold["oracle_upper_bound_fraction"],
        ])+" |")
    lines+=["","The bound is computed with access to the **true candidate labels** and is",
            "only an optimistic mathematical ceiling for deterministic functions of",
            "the frozen predictors. No real model was executed and there are **zero**",
            "independently reviewed eligible source rows. Three frozen lineages remain",
            "without candidate conditions; the original heldout study is still blocked.",
            "","**Do not compare this ceiling to an empirical model score or human outcome.**",""]
    return "\n".join(lines)


def main() -> int:
    parser=argparse.ArgumentParser()
    group=parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--audit",action="store_true")
    group.add_argument("--markdown",action="store_true")
    args=parser.parse_args()
    result=audit()
    print(markdown(result) if args.markdown else json.dumps(result,indent=2,sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Prepare source-level review dossiers for humans. No adjudication or fitting."""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

E2 = Path(__file__).resolve().parent
R5 = E2.parent
E1 = R5 / "E1"
sys.path.insert(0, str(E1))
import review_intake as intake  # noqa: E402

BLOCKED = "BLOCKED_RB3_REAL_FIT_AWAITING_INDEPENDENT_REVIEW"
VERSION = "0.1.0"


def require(ok: bool, message: str) -> None:
    if not ok:
        raise ValueError("RB3-R5-E2 REFUSED: " + message)


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def canonical(data: Any) -> bytes:
    return (json.dumps(data, sort_keys=True, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def md_escape(value: Any) -> str:
    """Single-line table-safe Markdown; no executable HTML in source fields."""
    s = str(value)
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
             .replace("|", "\\|").replace("\n", " ").replace("\r", " "))


def dossier_for_source(source: dict[str, Any], candidates: list[dict[str, Any]],
                       access: dict[str, Any] | None, packet_sha: str) -> str:
    require(source["source_outcome"] == "NO_ADMISSIBLE_ROWS_VERIFIED",
            "source already appears reviewed")
    require(all(c["review_status"] == "PENDING_INDEPENDENT_REVIEW" and not c["fit_eligible"]
                for c in candidates), "candidate marked approved")
    sid = source["source_id"]
    lines = [
        "# " + sid + " | Independent evidence review request",
        "",
        "**Status: UNREVIEWED. Dossier only. NOT proof of any experiment or human signoff.**",
        "",
        f"- Frozen source: \`{sid}\` / lineage \`{source['lineage_id']}\`",
        f"- DOI: \`{source['doi']}\`",
        f"- PMID: \`{source['pmid']}\`",
        f"- Bibliographic page: {source['citation_url']}",
        f"- Review priority: **{source['priority']}**",
        f"- Existing candidate comparisons: **{len(candidates)}**",
        f"- Frozen review packet SHA-256: \`{packet_sha}\`",
        "",
        "## What must be checked",
        "",
        "Obtain the actual primary Methods/Results and figures or tables. For each",
        "candidate, identify exposure arm, control comparator, measured biological",
        "endpoint, assay timepoint and statistical statement. Do not infer",
        "condition-level outcomes from pooled source summaries.",
        "",
        "### Known source-specific risks",
        "",
    ]
    lines += ["- " + md_escape(flag) for flag in source["risk_flags"]]
    if access:
        require(access["source_id"] == sid, "source access crosslink wrong")
        lines += [
            "",
            "### Unresolved primary-text questions",
            "",
        ] + ["- " + md_escape(q) for q in access["request_exactly"]]
        lines += [
            "",
            "Full-text access last recorded: \`" + access["access_status"] + "\`",
            "",
            "Bibliographic / publisher landing pages (not verified full text):",
            "",
        ] + ["- " + link for link in access["landing_pages"]]
    lines += ["", "## Frozen candidate references", ""]
    if not candidates:
        lines += [
            "**Zero extracted candidate comparisons.** This is a missing-evidence",
            "queue item, NOT a negative experiment or a null measurement.",
            "",
            "If primary text yields a defensible condition × endpoint comparison,",
            "record the specific figure/table and propose a *separate extraction PR*.",
            "Never add rows to a reviewer form and silently call them fit-ready.",
        ]
    else:
        lines += [
            "| Row ID | Endpoint | Nominal Hz | Amplitude | Evidence class |",
            "|---|---|---|---|---|",
        ]
        for row in candidates:
            lines.append(
                "| " + " | ".join(md_escape(row[k]) for k in (
                    "row_id", "endpoint", "frequency_hz", "amplitude_original",
                    "source_attribution_class")) + " |")
        lines += [
            "",
            "### Exact-row identity ledger",
            "",
            "The reviewer must preserve these exact candidate SHA-256 digests:",
            "",
        ] + [
            "- \`" + c["row_id"] + "\` : \`" + c["candidate_row_digest_sha256"] + "\`"
            for c in candidates
        ]
    lines += [
        "",
        "## Submit source evidence, not a result claim",
        "",
        "Generate a draft intake form with:",
        "",
        "\`\`\`sh",
        f"python experiments/RB3/R5/E1/review_intake.py --source {sid} > review-{sid}.json",
        "\`\`\`",
        "",
        "Fill only statements supported by actual primary figures/tables, then check:",
        "",
        "\`\`\`sh",
        f"python experiments/RB3/R5/E1/review_intake.py --validate review-{sid}.json",
        "\`\`\`",
        "",
        "Submit an evidence request/review issue using the repository's",
        "**RB3 source evidence review** issue form, or submit an intake draft",
        "in a separate PR for actual independent adjudication.",
        "",
        "Never upload paywalled article copies, secrets, reviewer private contact",
        "details or unlicensed publisher figures to this public repository.",
        "",
        "**No reviewer has been assigned or independently authenticated by this",
        "dossier. No model fit, scientific result, or exposure advice is authorized.**",
        "",
    ]
    return "\n".join(lines)


def prepare() -> tuple[dict[str, bytes], dict[str, Any]]:
    packet = intake.previous.packet()
    access = intake.registry()
    unresolved = intake.check_registry(packet, access)
    require(packet["status"] == BLOCKED, "source packet no longer blocked")
    require(packet["independent_review_attestations"] == 0, "reviewer attestation falsely present")
    require(packet["reviewed_eligible_rows"] == 0 and not packet["execution_authorized"],
            "review packet falsely authorizes fit")
    require(len(packet["source_queue"]) == 14 and len(packet["row_queue"]) == 64,
            "frozen source or candidate count drift")
    sources = {s["source_id"]: s for s in packet["source_queue"]}
    require(len(sources) == 14, "duplicate source")
    candidate_map = {sid: [] for sid in sources}
    for row in packet["row_queue"]:
        require(row["source_id"] in candidate_map, "candidate outside source set")
        candidate_map[row["source_id"]].append(row)
    require(sum(map(len, candidate_map.values())) == 64, "candidate mapping incomplete")
    require({sid for sid, rows in candidate_map.items() if not rows} ==
            {"RB2-S005","RB2-S007","RB2-S008","RB2-S009","RB2-S013"},
            "unexpected unresolved source set")
    outputs: dict[str, bytes] = {}
    lines = [
        "# NBG-RB3-R5-E2: Unattested primary-source review dispatch",
        "",
        "**REVIEW REQUESTS, NOT REVIEW RESULTS**",
        "",
        f"Packet SHA-256: \`{packet['packet_sha256']}\`",
        "",
        "14 frozen sources, 64 attributed candidate comparisons, 8/11 lineages represented,",
        "0 independent reviews completed, 0 approved rows, and no authorized model run.",
        "",
        "Open a per-source dossier to see the paper's evidence gaps and candidate",
        "fingerprints. These pages contain links and extraction metadata only,",
        "not copyrighted article copies or any independent source signoff.",
        "",
        "| Source | Lineage | Priority | Candidates | Evidence request |",
        "|---|---|---|---:|---|",
    ]
    for sid in sorted(sources):
        source = sources[sid]
        candidates = candidate_map[sid]
        filename = sid + ".md"
        outputs["dossiers/" + filename] = dossier_for_source(
            source, candidates, unresolved.get(sid), packet["packet_sha256"]
        ).encode("utf-8")
        lines.append("| " + " | ".join((
            md_escape(sid), md_escape(source["lineage_id"]),
            md_escape(source["priority"]), str(len(candidates)),
            "[Open dossier](dossiers/" + filename + ")",
        )) + " |")
    lines += [
        "",
        "### Essential scientific boundary",
        "",
        "A positive audit here only means the immutable evidence inventory can be",
        "dispatched for external review. It does not establish biological validity,",
        "experimental replication, independent reviewer identity, medical efficacy",
        "or a resonant healing frequency.",
        "",
        "The original group-holdout design may still be VOID if source evidence is insufficient.",
        "",
    ]
    outputs["README.md"] = "\n".join(lines).encode("utf-8")
    outputs["review_packet.json"] = canonical(packet)
    hashes = {name:digest(raw) for name,raw in sorted(outputs.items())}
    manifest = {
        "schema_id":"NBG-RB3-R5-E2-DISPATCH-MANIFEST",
        "version":VERSION,
        "status":"UNATTESTED_REVIEW_DISPATCH_ONLY",
        "source_count":14,
        "row_count":64,
        "reviewed_eligible_rows":0,
        "execution_authorized":False,
        "source_ids":sorted(sources),
        "packet_sha256":packet["packet_sha256"],
        "file_sha256":hashes,
        "warning":"Artifact hashes establish exact dispatch bytes only, not review quality or original published results.",
    }
    outputs["artifact_manifest.json"] = canonical(manifest)
    return outputs, manifest


def write_bundle(output_dir: Path) -> dict[str, Any]:
    outputs, manifest = prepare()
    resolved = output_dir.resolve()
    repo = intake.previous.RB2.parent.parent.resolve()
    require(resolved != repo and repo not in resolved.parents,
            "review bundle must be outside the tracked repository")
    require(not resolved.exists() or not any(resolved.iterdir()),
            "output directory must be new/empty to avoid stale review files")
    for name, raw in sorted(outputs.items()):
        path = resolved / name
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_bytes(raw)
        require(digest(path.read_bytes()) == digest(raw), "disk write digest mismatch")
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser()
    opt = parser.add_mutually_exclusive_group(required=True)
    opt.add_argument("--audit",action="store_true")
    opt.add_argument("--out-dir",type=Path)
    args = parser.parse_args()
    outputs, manifest = prepare()
    result = {
        "status":"PASS_RB3_R5_E2_DISPATCH_READINESS_UNATTESTED",
        "dispatch_file_count":len(outputs),
        "source_dossiers":len([x for x in outputs if x.startswith("dossiers/")]),
        "candidate_rows":manifest["row_count"],
        "reviewed_rows":0,
        "model_fit_authorized":False,
        "packet_sha256":manifest["packet_sha256"],
        "manifest_sha256":digest(outputs["artifact_manifest.json"]),
    }
    if args.out_dir is not None:
        write_bundle(args.out_dir)
        result["artifact_output_dir"] = str(args.out_dir)
    print(json.dumps(result,sort_keys=True,indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

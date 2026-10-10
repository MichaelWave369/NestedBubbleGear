#!/usr/bin/env python3
"""Audit primary abstract CLAIM CONTRASTS, never create RB3 model rows.

The source claims are from source-limited bibliographic abstracts. Structural
checks do not establish independent human review or source-science accuracy.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any

E6 = Path(__file__).resolve().parent
R5 = E6.parent
RB3 = R5.parent
RB2 = RB3.parent / "RB2"
sys.path.insert(0,str(R5))
import build_review_packet as packet_builder  # noqa: E402

DATA_PATH = E6 / "abstract_contrasts.json"
SOURCE_IDS = {"RB2-S008","RB2-S009","RB2-S013"}
EXPECTED_IDS = {
  "S008-PROLIFERATION-EARLY","S008-PROLIFERATION-3H-VS-6H",
  "S008-G1-VS-CONTROL","S008-G1-6H-VS-3H",
  "S008-PROLIFERATION-LATE","S008-CELL-CYCLE-LATE",
  "S009-PROLIFERATION-DURATION","S009-OSTEOGENIC-DURATION",
  "S009-U0126-CONTEXT","S013-POOLED-NULL",
}
S008_EXPOSED_DIRECT = {
    "S008-PROLIFERATION-3H-VS-6H":"EXPOSED_3H_VS_EXPOSED_6H",
    "S008-G1-6H-VS-3H":"EXPOSED_6H_VS_EXPOSED_3H",
}
S008_LATE = {"S008-PROLIFERATION-LATE","S008-CELL-CYCLE-LATE"}
EXPECTED_REGIMES = [
  "AMBIENT_LABORATORY","NULLED","CA_ION_CYCLOTRON_RESONANCE_50_HZ",
  "VERTICAL_50_HZ_6_MICROTESLA_RMS"
]
BLOCKED_OUTCOMES = {
  "AUTHOR_REPORTED_INCREASE","AUTHOR_REPORTED_NO_SIGNIFICANT_DIFFERENCE",
  "AUTHOR_REPORTED_ATTENUATION"
}
BLOCKED_CLASSES = {
  "ABSTRACT_AGGREGATE","DIRECT_EXPOSED_ARM_COMPARISON",
  "MECHANISM_CONTEXT_ONLY"
}
STATUS="PASS_RB3_R5_E6_ABSTRACT_ATOMICITY_NO_PROMOTION"


def require(ok:bool, message:str)->None:
    if not ok:
        raise ValueError("RB3-R5-E6 REFUSED: "+message)


def load_json(path:Path)->dict[str,Any]:
    return json.loads(path.read_text(encoding="utf8"))


def validate(d:dict[str,Any], packet:dict[str,Any], manifest:dict[str,Any],
             unresolved:dict[str,Any])->dict[str,Any]:
    require(d["ledger_id"]=="NBG-RB3-R5-E6-ABSTRACT-CONTRAST-LEDGER",
            "registry identity")
    require(d["status"]=="SOURCE_ABSTRACT_CONTRAST_TRIAGE_NOT_INDEPENDENT_REVIEW",
            "source-level claim wrongly promoted")
    require(d["version"]=="0.1.0","version drift")
    require(d["claim_warning"] and d["scope"],"claim provenance warning removed")
    require(d["source_count"]==3 and d["claim_atom_count"]==10,
            "original author-claim atomicity count changed")
    require(d["new_condition_by_endpoint_candidate_rows"]==0,
            "abstract atom converted to candidate row")
    require(d["independently_reviewed_rows"]==0,
            "source claims fabricated independent review")
    require(d["model_execution_authorized"] is False,
            "model execution authorized")
    require(d["no_source_access_bypass"] is True,"source access control removed")
    require(set(d["safety_claims_blocked"])=={
        "HUMAN_COMPLETE_TISSUE_REGENERATION","CLINICAL_HEALING_FREQUENCY",
        "DNA_DIRECT_ANTENNA_PROOF","SAFE_FIELD_DOSE"},
        "medical science firewall weakened")
    require(d["source_request_issue"]==
            "https://github.com/MichaelWave369/NestedBubbleGear/issues/92",
            "full text review issue drift")

    sources={s["id"]:s for s in manifest["records"]}
    require(len(sources)==14 and manifest["lineage_count"]==11,"RB2 source freeze drift")
    require(manifest["manifest_digest_sha256"]==
            packet_builder.RB2_MANIFEST_DIGEST,"frozen corpus source hash drift")
    require(set(d["source_metadata"])==SOURCE_IDS,"changed frozen source scope")
    r4source={s["source_id"]:s for s in unresolved["sources"]}
    require(SOURCE_IDS <= set(r4source),"R4 missing source lineage")
    require({s["source_id"] for s in packet["source_queue"]}==set(sources),
            "R5 human-review packet source drift")
    require({r["source_id"] for r in packet["row_queue"]}.isdisjoint(SOURCE_IDS),
            "an unresolved source suddenly became a candidate")
    require(packet["candidate_rows"]==64 and
            packet["independent_review_attestations"]==0 and
            packet["reviewed_eligible_rows"]==0 and
            packet["execution_authorized"] is False,
            "prior candidate reviews promoted")
    for source_id,record in d["source_metadata"].items():
        manifest_source=sources[source_id]
        r4=r4source[source_id]
        for key in ("doi","pmid","lineage_id"):
            expected=manifest_source["lineage"] if key=="lineage_id" else manifest_source[key]
            require(record[key]==expected,source_id+" source "+key+" drift")
            require(record[key]==r4["lineage_id" if key=="lineage_id" else key],
                    source_id+" R4 provenance drift")
        require(record["url"]==f"https://pubmed.ncbi.nlm.nih.gov/{record['pmid']}/",
                source_id+" bibliographic source drift")
        require(record["secondary_url"].startswith("https://"),
                source_id+" secondary source URL invalid")
        require(record["fulltext_per_arm_checked"] is False,
                source_id+" abstract wrongly called full-text checked")
        require(record["access_limit"] in {
            "PUBMED_AND_PUBLISHER_ABSTRACT_ONLY",
            "PUBMED_ABSTRACT_AND_REQUEST_FULLTEXT_ROUTE",
            "PUBMED_ABSTRACT_ONLY"
        },source_id+" fulltext availability fabricated")
        require(record["requested_material"],source_id+" no figure/table request")
        require(record["population"],source_id+" no biological system")
        require(record["frequency_hz"]==r4["nominal_stimulus"]["frequency_hz"],
                source_id+" exposure frequency drift")
        if source_id=="RB2-S008":
            require(record["population"]=="CULTURED_NORMAL_RAT_MESENCHYMAL_STEM_CELLS",
                    "S008 species may not be human")
            require(record["amplitude_tesla"]==0.01 and
                    record["specified_exposure_hours"]==[3,6] and
                    record["observed_readout_hours_after_treatment"]==[16],
                    "S008 exposure and late time mismatch")
        elif source_id=="RB2-S009":
            require(record["amplitude_tesla"]==0.001 and
                    record["specified_exposure_hours"] is None,
                    "S009 duration inferred from abstract")
        else:
            require(record["amplitude_tesla"]==0.000006 and
                    record["regimes"]==EXPECTED_REGIMES and
                    record["exposure_days"]==[1,4,7,21],
                    "S013 field regime/day conflation")
            require(record["population"]=="MOUSE_FDCP_MIX_A4_PROGENITOR_CELL_LINE",
                    "S013 misclassified cell population")

    claims=d["claim_atoms"]
    require(len(claims)==10,"claim count changed")
    byid={r["claim_id"]:r for r in claims}
    require(len(byid)==10 and set(byid)==EXPECTED_IDS,
            "claim added, omitted or duplicated")
    require(Counter(x["source_id"] for x in claims)=={
        "RB2-S008":6,"RB2-S009":3,"RB2-S013":1},
        "source-level claim distribution changed")
    for claim in claims:
        ident=claim["claim_id"]
        require(claim["source_id"] in SOURCE_IDS,ident+" is not frozen source")
        require(claim["claim_scope"] in BLOCKED_CLASSES,ident+" unsupported claim scope")
        require(claim["outcome"] in BLOCKED_OUTCOMES,ident+" unsupported outcome")
        require(claim["statistic"] in {
            "P_LT_0_05","P_GT_0_05","NO_NUMERIC_P_IN_ABSTRACT"
        },ident+" p-value fabricated")
        require(claim["independently_reviewed"] is False,
                ident+" forged independent review")
        require(claim["per_arm_figure_table_locator"] is None and
                claim["per_arm_effect_size"] is None and
                claim["per_arm_sample_size"] is None,
                ident+" unextracted per-arm details fabricated")
        require(claim["promotable_to_rb3"] is False,
                ident+" abstract promoted to RB3 condition")
        require(claim["interpretation"] and claim["endpoint"] and
                claim["readout_window"] and claim["comparator_class"],
                ident+" missing contrast source context")
        require(not claim["outcome"].startswith("TRUE_ZERO"),
                ident+" nonsignificant changed to zero-effect proof")
    for ident,comp in S008_EXPOSED_DIRECT.items():
        claim=byid[ident]
        require(claim["comparator_class"]==comp and
                claim["claim_scope"]=="DIRECT_EXPOSED_ARM_COMPARISON",
                ident+" wrongly interpreted as sham comparator")
    early=byid["S008-PROLIFERATION-EARLY"]
    compare=byid["S008-PROLIFERATION-3H-VS-6H"]
    require(early["outcome"]=="AUTHOR_REPORTED_INCREASE" and
            early["statistic"]=="P_LT_0_05" and
            early["claim_scope"]=="ABSTRACT_AGGREGATE",
            "S008 early pooled effect misassigned")
    require(compare["outcome"]=="AUTHOR_REPORTED_NO_SIGNIFICANT_DIFFERENCE" and
            compare["statistic"]=="P_GT_0_05",
            "S008 between-arm no-difference reclassified")
    for ident in S008_LATE:
        c=byid[ident]
        require(c["readout_window"]=="16_HOURS_AFTER_TREATMENT" and
                c["outcome"]=="AUTHOR_REPORTED_NO_SIGNIFICANT_DIFFERENCE" and
                c["statistic"]=="P_GT_0_05" and
                c["claim_scope"]=="ABSTRACT_AGGREGATE",
                ident+" late outcome confused with early")
    require(byid["S008-G1-6H-VS-3H"]["outcome"]=="AUTHOR_REPORTED_INCREASE",
            "S008 G1 direct 6h/3h direction changed")
    require(byid["S009-OSTEOGENIC-DURATION"]["endpoint"]==
            "MULTIPLE_OSTEOGENIC_ENDPOINTS" and
            byid["S009-OSTEOGENIC-DURATION"]["readout_window"]==
            "DURATION_DEPENDENT_UNSPECIFIED",
            "S009 osteogenic outcome split by invented durations")
    require(byid["S009-U0126-CONTEXT"]["claim_scope"]=="MECHANISM_CONTEXT_ONLY" and
            byid["S009-U0126-CONTEXT"]["comparator_class"]=="U0126_VS_WITHOUT_U0126",
            "S009 MEK/ERK co-intervention promoted as baseline")
    require(byid["S013-POOLED-NULL"]["comparator_class"]==
            "MULTI_REGIME_MULTI_DAY_POOLED" and
            byid["S013-POOLED-NULL"]["claim_scope"]=="ABSTRACT_AGGREGATE",
            "S013 pooled multi-regime abstract expanded as per-arm null")
    require(not (RB3/"FROZEN_ROWS.csv").exists() and
            not (RB3/"REAL_ROWS_FREEZE.json").exists(),
            "unapproved real model freeze")
    return {
        "status":STATUS,
        "abstract_claim_atoms":len(claims),
        "source_ids":sorted(SOURCE_IDS),
        "new_model_candidate_rows":0,
        "independent_source_reviews":0,
        "known_16h_S008_late_claims":len(S008_LATE),
        "exposed_arm_to_exposed_arm_claims":len(S008_EXPOSED_DIRECT),
        "S009_inhibitor_context_claims":1,
        "S013_pooled_multiregime_claims":1,
        "missing_candidate_lineages":["L005","L006","L010"],
        "model_execution_authorized":False,
        "ledger_sha256":hashlib.sha256(DATA_PATH.read_bytes()).hexdigest(),
        "review_issue_url":d["source_request_issue"],
    }


def audit()->dict[str,Any]:
    return validate(load_json(DATA_PATH), packet_builder.packet(),
                    load_json(RB2/"corpus_manifest.json"),
                    load_json(RB3/"R4/unresolved_studies.json"))


def markdown(summary:dict[str,Any])->str:
    return "\n".join([
        "# RB3-R5-E6 | Source-abstract comparator audit",
        "",
        "**ABSTRACT-ONLY. Zero independently verified full-text per-arm comparisons.**",
        "",
        f"- Primary-source studies: {len(summary['source_ids'])}",
        f"- Typed abstract-level claim atoms: {summary['abstract_claim_atoms']}",
        f"- Direct exposed-arm contrasts (not sham): {summary['exposed_arm_to_exposed_arm_claims']}",
        f"- Late S008 16-hour pooled claims: {summary['known_16h_S008_late_claims']}",
        "- S009 inhibitor: mechanism context, not a baseline exposed/sham comparison",
        "- S013: one pooled multi-regime null claim, not per-regime/day negatives",
        "",
        "| Frozen source | Needed full-text evidence |",
        "|---|---|",
        "| RB2-S008 / L005 | 3h-vs-sham / 6h-vs-sham, early and 16h endpoint tables |",
        "| RB2-S009 / L006 | 15 Hz duration-by-osteogenic assay tables; U0126 separated |",
        "| RB2-S013 / L010 | ambient/nulled/cyclotron/vertical regime-by-day sham results |",
        "",
        "All three original source lineages remain absent from fit-ready evidence.",
        "No medical efficacy, mechanism, safe dose or human regeneration finding follows.",
        "",
    ])


if __name__=="__main__":
    parser=argparse.ArgumentParser()
    g=parser.add_mutually_exclusive_group(required=True)
    g.add_argument("--audit",action="store_true")
    g.add_argument("--markdown",action="store_true")
    args=parser.parse_args()
    report=audit()
    print(markdown(report) if args.markdown else json.dumps(report,indent=2,sort_keys=True))

#!/usr/bin/env python3
"""Find possible lawful primary full-text access routes, NOT verify source science.

Europe PMC metadata is a discovery aid only. We do not retrieve full-text
articles, scrape paywalls, invent figures, approve rows, or run RB3 models.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

E8 = Path(__file__).resolve().parent
R5 = E8.parent
RB3 = R5.parent
sys.path.insert(0, str(R5 / "E1"))
import review_intake as e1  # noqa: E402
sys.path.insert(0, str(R5 / "E7"))
import reconcile_reviews as e7  # noqa: E402

REGISTRY = E8 / "access_probe_policy.json"
FOCUS = ("RB2-S005", "RB2-S007", "RB2-S008", "RB2-S009", "RB2-S013")
MISSING_LINEAGES = ("L005","L006","L010")
ENDPOINT = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
STOP = "BLOCKED_RB3_REAL_FIT_AWAITING_INDEPENDENT_REVIEW"

STATUS = {
    "OA_METADATA_ROUTE": "OA_REPOSITORY_CANDIDATE_NOT_INSPECTED",
    "NOT_CONFIRMED": "FULLTEXT_ACCESS_UNCONFIRMED",
    "NOT_INDEXED": "EUROPE_PMC_RECORD_NOT_RETURNED",
    "NETWORK": "METADATA_PROBE_FAILED",
    "INVALID": "RECORD_IDENTITY_OR_METADATA_INVALID",
}


def require(ok: bool, message: str) -> None:
    if not ok:
        raise ValueError("RB3-R5-E8 REFUSED: " + message)


def load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def canonical(data: Any) -> bytes:
    return json.dumps(data, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def expected_sources() -> list[dict[str,Any]]:
    packet=e1.previous.packet()
    refs=e1.check_registry(packet,e1.registry())
    require(set(refs)==set(FOCUS), "five unresolved source set changed")
    bysource={x["source_id"]:x for x in packet["source_queue"]}
    require(len(packet["row_queue"])==64 and len(packet["source_queue"])==14,
            "original reviewer packet changed")
    require(packet["reviewed_eligible_rows"]==0 and
            packet["independent_review_attestations"]==0 and
            packet["execution_authorized"] is False,
            "review packet improperly approved")
    sources=[]
    for sid in FOCUS:
        source=bysource[sid]
        require(source["candidate_rows"]==0, sid+" has new unreviewed candidate rows")
        original=refs[sid]
        require(source["doi"]==original["doi"] and
                source["pmid"]==original["pmid"] and
                source["lineage_id"]==original["lineage_id"],
                "source DOI/PMID/lineage changed")
        sources.append({
            "source_id":sid, "lineage_id":source["lineage_id"],
            "doi":source["doi"],"pmid":source["pmid"],
            "priority":original["priority"],
            "primary_questions":original["request_exactly"],
            "known_landing_pages":original["landing_pages"],
        })
    return sources


def check_policy(policy: dict[str,Any]) -> None:
    require(policy["schema_id"]=="NBG-RB3-R5-E8-OPEN-ACCESS-PROBE",
            "policy identity changed")
    require(policy["version"]=="0.1.0", "version changed")
    require(policy["scope"]=="LEGAL_ACCESS_METADATA_DISCOVERY_NOT_FULLTEXT_REVIEW",
            "source access mislabeled as review")
    require(policy["provider"]=="EUROPE_PMC_RESTFUL_SEARCH",
            "provider identity changed")
    require(policy["provider_url"]==ENDPOINT, "API endpoint changed")
    require(policy["focus_source_ids"]==list(FOCUS), "source identity scope changed")
    require(policy["missing_candidate_lineages"]==list(MISSING_LINEAGES),
            "source-lineage deficit hidden")
    require(policy["actual_independent_fulltext_reviews"]==0,
            "fake independent reviews")
    require(policy["reviewed_fit_eligible_rows"]==0,
            "fake fit-ready rows")
    require(policy["training_authorized"] is False and
            policy["execution_authorized"] is False,
            "real-data training authorized")
    require(policy["never_download_article_content"] is True and
            policy["never_assume_hasPDF_means_open_access"] is True and
            policy["network_error_is_not_no_fulltext"] is True,
            "fulltext handling safety rule disabled")
    require(policy["no_publication_figure_or_effect_invention"] is True,
            "publication figures can be fabricated")


def query_url(pmid: str) -> str:
    require(bool(re.fullmatch(r"[0-9]{6,10}",pmid)), "invalid PubMed identifier")
    params={
        "query":f"EXT_ID:{pmid} AND SRC:MED",
        "format":"json",
        "resultType":"lite",
        "pageSize":"5",
    }
    return ENDPOINT + "?" + urllib.parse.urlencode(params)


def fetch_metadata(url: str) -> dict[str,Any]:
    # Only static, verified Europe PMC endpoint URLs created via query_url.
    require(url.startswith(ENDPOINT+"?"), "disallowed network origin")
    request=urllib.request.Request(
        url,
        headers={"User-Agent":"NBG-RB3-source-access/0.1 (metadata-only; public-research)","Accept":"application/json"}
    )
    with urllib.request.urlopen(request,timeout=8) as res:
        require(res.status==200,"non-200 Europe PMC response")
        raw=res.read(1024*1024+1)
    require(len(raw)<=1024*1024,"metadata response too large")
    parsed=json.loads(raw.decode("utf-8"))
    require(isinstance(parsed,dict),"invalid metadata JSON")
    return parsed


def interpret(source: dict[str,Any], payload: dict[str,Any] | None,
              error: str | None = None) -> dict[str,Any]:
    sid=source["source_id"]
    base={
        "source_id":sid,
        "lineage_id":source["lineage_id"],
        "doi":source["doi"],
        "pmid":source["pmid"],
        "priority":source["priority"],
        "pubmed_url":f"https://pubmed.ncbi.nlm.nih.gov/{source['pmid']}/",
        "api_query_url":query_url(source["pmid"]),
        "known_landing_pages":source["known_landing_pages"],
        "review_questions":source["primary_questions"],
        "pmcid":None,
        "candidate_repository_url":None,
        "is_open_access_metadata":None,
        "has_pdf_metadata":None,
        "fulltext_retrieved":False,
        "fulltext_figures_checked":False,
        "license_verified":False,
        "independent_review_approved":False,
        "new_model_rows":0,
        "fit_authorized":False,
        "probe_state":STATUS["NOT_CONFIRMED"],
        "diagnostic":None,
    }
    if error is not None:
        base["probe_state"]=STATUS["NETWORK"]
        base["diagnostic"]="Provider request error; cannot infer absence of lawful full text"
        return base
    require(payload is not None and isinstance(payload,dict),"missing response")
    results=payload.get("resultList",{}).get("result",[])
    require(isinstance(results,list),"Europe PMC result not a list")
    if not results:
        base["probe_state"]=STATUS["NOT_INDEXED"]
        base["diagnostic"]="No matching record returned by this provider; not evidence fulltext does not exist"
        return base
    matches=[
        result for result in results
        if isinstance(result,dict) and
        str(result.get("id",""))==source["pmid"] and
        str(result.get("source","")).upper()=="MED" and
        str(result.get("doi","")).casefold()==source["doi"].casefold()
    ]
    if len(matches)!=1:
        base["probe_state"]=STATUS["INVALID"]
        base["diagnostic"]="Metadata DOI/PMID/source did not uniquely match frozen RB2 source"
        return base
    item=matches[0]
    oa=item.get("isOpenAccess")
    pdf=item.get("hasPDF")
    require(oa in (None,"Y","N"),"invalid Europe PMC isOpenAccess indicator")
    require(pdf in (None,"Y","N"),"invalid Europe PMC hasPDF indicator")
    pmcid=item.get("pmcid")
    require(pmcid is None or isinstance(pmcid,str),"invalid PMCID data type")
    base["is_open_access_metadata"]=oa
    base["has_pdf_metadata"]=pdf
    base["pmcid"]=pmcid if pmcid and re.fullmatch(r"PMC[0-9]+",pmcid) else None
    if oa=="Y" and base["pmcid"]:
        base["probe_state"]=STATUS["OA_METADATA_ROUTE"]
        base["candidate_repository_url"]="https://europepmc.org/articles/"+base["pmcid"]
        base["diagnostic"]="Europe PMC metadata indicates OA/PMCID route; access, license and figures NOT verified"
    else:
        base["diagnostic"]="No independently inspectable full-text route verified by this metadata response"
    return base


def check_record(source: dict[str,Any], record: dict[str,Any]) -> None:
    require(record["source_id"]==source["source_id"] and
            record["lineage_id"]==source["lineage_id"] and
            record["doi"]==source["doi"] and
            record["pmid"]==source["pmid"],
            "source metadata identity mismatches frozen registry")
    require(record["pubmed_url"]==f"https://pubmed.ncbi.nlm.nih.gov/{source['pmid']}/",
            "PubMed link changed")
    require(record["api_query_url"]==query_url(source["pmid"]),
            "provider query no longer source-specific")
    require(record["known_landing_pages"]==source["known_landing_pages"],
            "source accessibility links changed")
    require(record["review_questions"]==source["primary_questions"],
            "per-arm evidence requests hidden")
    require(record["probe_state"] in STATUS.values(),"unknown access state")
    for key in ("fulltext_retrieved","fulltext_figures_checked",
                "license_verified","independent_review_approved","fit_authorized"):
        require(record[key] is False, "unverified access/science promoted: "+key)
    require(type(record["new_model_rows"]) is int and record["new_model_rows"]==0,
            "metadata probe fabricated experimental rows")
    require(record["is_open_access_metadata"] in (None,"Y","N"),"invalid OA signal")
    require(record["has_pdf_metadata"] in (None,"Y","N"),"invalid PDF signal")
    if record["probe_state"]==STATUS["OA_METADATA_ROUTE"]:
        require(record["is_open_access_metadata"]=="Y" and
                isinstance(record["pmcid"],str) and
                bool(re.fullmatch(r"PMC[0-9]+",record["pmcid"])) and
                record["candidate_repository_url"]==
                "https://europepmc.org/articles/"+record["pmcid"],
                "OA route promoted without valid matching PMCID")
    else:
        require(record["candidate_repository_url"] is None,
                "non-OA record given invented verified repository link")
    require(record["diagnostic"],"missing human interpretation warning")


def build_report(records:list[dict[str,Any]],mode:str,
                 retrieved_at_utc:str | None=None)->dict[str,Any]:
    require(mode in ("LIVE_PROVIDER_METADATA_NOT_FULLTEXT","OFFLINE_READINESS_NO_NETWORK"),
            "invalid report mode")
    sources=expected_sources()
    require([x["source_id"] for x in records]==list(FOCUS),
            "report source list incomplete")
    for ref,r in zip(sources,records):
        check_record(ref,r)
    return {
        "schema_id":"NBG-RB3-R5-E8-ACCESS-PROBE-REPORT",
        "version":"0.1.0",
        "report_class":mode,
        "retrieved_at_utc":retrieved_at_utc if mode.startswith("LIVE") else None,
        "metadata_oa_route_candidates":sum(x["probe_state"]==STATUS["OA_METADATA_ROUTE"] for x in records),
        "provider_errors":sum(x["probe_state"]==STATUS["NETWORK"] for x in records),
        "sources_checked":len(records),
        "source_results":records,
        "actual_fulltext_figures_inspected":0,
        "independent_source_review_approvals":0,
        "fit_eligible_rows":0,
        "model_execution_authorized":False,
        "scientific_status":STOP,
        "provenance_warning":"A provider metadata OA flag or PDF indicator is not human inspection, evidence accuracy, permission to redistribute or a model-eligible source row.",
    }


def audit()->dict[str,Any]:
    check_policy(load(REGISTRY))
    e7.audit()
    sources=expected_sources()
    offline=[interpret(s,{"resultList":{"result":[]}}) for s in sources]
    report=build_report(offline,"OFFLINE_READINESS_NO_NETWORK")
    require(report["sources_checked"]==5 and
            report["actual_fulltext_figures_inspected"]==0 and
            report["fit_eligible_rows"]==0,
            "offline source audit falsely positive")
    return {
        "status":"PASS_RB3_R5_E8_ACCESS_DISCOVERY_READINESS_NOT_REVIEWED",
        "frozen_unresolved_sources":len(sources),
        "missing_lineages":list(MISSING_LINEAGES),
        "generated_pmid_queries":[query_url(s["pmid"]) for s in sources],
        "source_packet_sha256":e1.previous.packet()["packet_sha256"],
        "independent_reviews":0,
        "approved_model_rows":0,
        "real_execution_authorized":False,
    }


def markdown(report:dict[str,Any])->str:
    lines=[
        "# R5-E8 | Legal full-text access locator",
        "",
        "**PROVIDER METADATA ONLY. No publisher article body fetched, no figure inspected, no external review approved.**",
        "",
        f"Provider run: \`{report['report_class']}\`",
        f"Time: \`{report['retrieved_at_utc'] or 'OFFLINE_NO_LIVE_CHECK'}\`",
        "",
        "| RB2 paper | Lineage | Probe state | Candidate repository route |",
        "|---|---|---|---|",
    ]
    for x in report["source_results"]:
        lines.append("| "+ " | ".join([
            x["source_id"],x["lineage_id"],x["probe_state"],
            x["candidate_repository_url"] or "(not located / not checked)",
        ])+" |")
    lines += [
        "",
        "The presence or absence of an indexed route is NOT a legal-access",
        "determination and NOT a full-text source review. Resolve open-access",
        "licensing and inspect original Methods/figures separately.",
        "",
        "Submit exact assay, comparator, timepoint and figure evidence through",
        "research issue #92 and the existing E1/E7 reviewer workflow.",
        "",
        "**No fit or clinical claim is authorized.**",
        "",
    ]
    return "\n".join(lines)


def main()->int:
    parser=argparse.ArgumentParser()
    choice=parser.add_mutually_exclusive_group(required=True)
    choice.add_argument("--audit",action="store_true")
    choice.add_argument("--probe-live",action="store_true")
    choice.add_argument("--validate-report",type=Path)
    parser.add_argument("--out-dir",type=Path,
                        help="For --probe-live only. Must be a new or empty directory outside repository.")
    args=parser.parse_args()
    if args.audit:
        require(args.out_dir is None, "audit never writes report")
        print(json.dumps(audit(),indent=2,sort_keys=True))
        return 0
    if args.validate_report:
        require(args.out_dir is None, "validation never writes report")
        obj=load(args.validate_report)
        require(obj["schema_id"]=="NBG-RB3-R5-E8-ACCESS-PROBE-REPORT" and
                obj["version"]=="0.1.0", "invalid probe report schema")
        require(obj["report_class"] in ("LIVE_PROVIDER_METADATA_NOT_FULLTEXT",
                "OFFLINE_READINESS_NO_NETWORK"), "invalid report provenance")
        original=build_report(obj["source_results"],obj["report_class"],
                              obj["retrieved_at_utc"])
        require(obj==original, "report fields tampered or scientific status promoted")
        print(json.dumps({"status":"VALID_METADATA_REPORT_NOT_PRIMARY_REVIEW",
                         "source_count":original["sources_checked"],
                         "reviewed_rows":0},indent=2))
        return 0
    require(args.probe_live and args.out_dir is not None,
            "live probe requires explicit --out-dir")
    audit()
    output=args.out_dir.resolve()
    root=RB3.parent.parent.resolve()
    require(output!=root and root not in output.parents,
            "live metadata must never be written into repository")
    require(not output.exists() or not any(output.iterdir()),
            "output directory contains stale access probe")
    records=[]
    for source in expected_sources():
        try:
            response=fetch_metadata(query_url(source["pmid"]))
            rec=interpret(source,response)
        except (OSError,TimeoutError,ValueError,UnicodeError,json.JSONDecodeError) as exc:
            # No credentials, article content or exception data is logged.
            rec=interpret(source,None,error=type(exc).__name__)
        records.append(rec)
    timestamp=datetime.now(timezone.utc).isoformat(timespec="seconds")
    report=build_report(records,"LIVE_PROVIDER_METADATA_NOT_FULLTEXT",timestamp)
    output.mkdir(parents=True,exist_ok=True)
    json_path=output/"access_report.json"
    json_path.write_text(json.dumps(report,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    (output/"access_report.md").write_text(markdown(report),encoding="utf-8")
    checked=build_report(load(json_path)["source_results"],"LIVE_PROVIDER_METADATA_NOT_FULLTEXT",timestamp)
    require(checked==report,"persisted source metadata changed")
    print(json.dumps({"status":"ACCESS_ROUTE_METADATA_PROBED_NOT_REVIEWED",
                      "source_count":len(records),
                      "oa_metadata_route_candidates":report["metadata_oa_route_candidates"],
                      "provider_errors":report["provider_errors"],
                      "report_sha256":hashlib.sha256(json_path.read_bytes()).hexdigest(),
                      "approved_rows":0,"model_run_authorized":False},indent=2))
    return 0


if __name__=="__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Verify source timing crosswalk against frozen candidate/evidence receipts.

This audit compares published-source transcription with existing R0/R1 records.
It cannot authenticate independent reviewers or authorize a biological model fit.
"""
from __future__ import annotations

import copy
import csv
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

E3 = Path(__file__).resolve().parent
R5 = E3.parent
RB3 = R5.parent
RB2 = RB3.parent / "RB2"
DATA = E3 / "primary_html_spotcheck.json"

sys.path.insert(0, str(R5))
import build_review_packet as existing_packet  # noqa: E402

EXPECTED_R0 = {
    "RB3R0-S001-01":("Figure 3C",168.5,"0.078",5),
    "RB3R0-S001-02":("Figure 3C",299.3,"<0.001",5),
    "RB3R0-S001-03":("Figure 3C",321.8,"<0.001",5),
    "RB3R0-S001-04":("Figure 3B",157.1,"0.027",4),
    "RB3R0-S001-05":("Figure 3B",182.0,"0.002",4),
    "RB3R0-S001-06":("Figure 3B",147.2,"0.073",4),
    "RB3R0-S001-07":("Figure 3G",2.56,"0.295",5),
    "RB3R0-S001-08":("Figure 3G",2.96,"0.009",5),
    "RB3R0-S001-09":("Figure 3G",2.52,"0.380",5),
}
EXPECTED_S002_TIME = {
    "RB3R1-S002-01":(0,"Figure 2C","IMMEDIATE_POST_3D_EXPOSURE"),
    "RB3R1-S002-02":(7,"Figure 2F","SEVEN_DAY_UNEXPOSED_REPLATING_AFTER_3D_EXPOSURE"),
    "RB3R1-S002-03":(0,"Figure 3B","FIXED_AFTER_3D_EXPOSURE"),
    "RB3R1-S002-04":(3,"Figure 3D","THREE_DAY_UNEXPOSED_MATURATION_AFTER_3D_EXPOSURE"),
    "RB3R1-S002-05":(0,"Figure 3C","SAMPLED_AFTER_3D_EXPOSURE"),
    "RB3R1-S002-06":(0,"Figure 3E","SAMPLED_AFTER_3D_EXPOSURE"),
    "RB3R1-S002-07":(0,"Figure 4B","FIXED_AFTER_3D_EXPOSURE"),
    "RB3R1-S002-08":(0,"Figure 4C","FIXED_AFTER_3D_EXPOSURE"),
    "RB3R1-S002-09":(0,"Figure 4D","FIXED_AFTER_3D_EXPOSURE"),
}
EXPECTED_FLAGS = {
    "DIFFERENT_READOUT_TIMEPOINTS_ARE_NOT_SAME_CONDITION",
    "SECONDARY_NEUROSPHERE_HAS_SEVEN_DAY_UNEXPOSED_GROWTH",
    "GFAP_CELL_FRACTION_HAS_THREE_DAY_UNEXPOSED_MATURATION",
    "GFAP_MRNA_AT_END_OF_EXPOSURE_DIFFERENT_FROM_CELL_FRACTION",
    "NULL_NOT_EQUIVALENCE",
    "ORIGINAL_MODEL_HAS_NO_READOUT_TIME_FEATURE",
    "COARSE_FEATURE_LABEL_COLLISIONS_NOT_CAUSAL_EVIDENCE",
}


def require(condition, problem):
    if not condition:
        raise ValueError("RB3-R5-E3 REFUSED: " + problem)


def load_json(path):
    return json.loads(Path(path).read_text(encoding="utf8"))


def load_csv(path):
    with Path(path).open(encoding="utf8",newline="") as stream:
        reader=csv.DictReader(stream)
        return list(reader)


def checked_crosswalk(data):
    require(data["registry_id"] == "NBG-RB3-R5-E3-SOURCE-TIMING-CROSSWALK", "registry identity")
    require(data["version"] == "0.1.0", "version")
    require(data["status"] == "UNATTESTED_PRIMARY_HTML_SPOTCHECK", "false independent-review status")
    require(data["independent_reviewer_attestations"] == [], "fake independent review")
    require(data["reviewed_eligible_row_count"] == 0, "fake approved-row count")
    require(data["model_execution_authorized"] is False, "model authorization")
    require(set(data["source_records"]) == {"RB2-S001","RB2-S002"}, "source set altered")
    require(set(data["source_row_crosswalk"]) == set(data["source_records"]), "missing crosswalk")
    require(set(data["blocking_flags"]) == EXPECTED_FLAGS, "scientific caution flag drift")
    require(len(data["blocking_flags"]) == len(EXPECTED_FLAGS), "duplicate caution flags")
    require(data["checks"]["total_spotchecked"] == 18, "count changed")
    for key in ("preserve_original_candidate_csv","preserve_frozen_model_features",
                "no_inferred_signal_harmonics","no_source_new_labels",
                "no_independent_review_claim"):
        require(data["checks"].get(key) is True, "protection disabled: "+key)

    manifest=load_json(RB2/"corpus_manifest.json")
    by_source={x["id"]:x for x in manifest["records"]}
    for sid,source in data["source_records"].items():
        frozen=by_source[sid]
        require(source["doi"] == frozen["doi"], "source DOI mismatch")
        require(source["pmid"] == frozen["pmid"], "source PMID mismatch")
        require(source["lineage"] == frozen["lineage"], "source lineage mismatch")
        require(source["primary_html"].startswith("https://"), "invalid original publisher link")
        require(source["provenance"] == "ASSISTANT_PRIMARY_PUBLISHER_HTML_SPOTCHECK_NOT_INDEPENDENT",
                "source misrepresented as independent")
        require(source["inspected_sections"] and source["limitation"],"missing source scope")

    r0rows={x["row_id"]:x for x in load_csv(RB3/"R0/candidate_rows.csv")}
    r1rows={x["row_id"]:x for x in load_csv(RB3/"R1/additional_rows.csv")}
    r0evidence={x["row_id"]:x for x in load_json(RB3/"R0/row_evidence.json")["records"]}
    r1evidence={x["row_id"]:x for x in load_json(RB3/"R1/source_evidence.json")["records"]}
    require(set(r0rows) == set(EXPECTED_R0), "R0 original observation drift")
    r1_s002={rid:x for rid,x in r1rows.items() if x["source_id"] == "RB2-S002"}
    require(set(r1_s002) == set(EXPECTED_S002_TIME), "R1 2016 row set drift")

    packet=existing_packet.packet()
    require(packet["candidate_rows"] == 64, "original review packet altered")
    require(packet["reviewed_eligible_rows"] == 0 and packet["independent_review_attestations"] == 0,
            "prior review state falsely advanced")
    require(packet["execution_authorized"] is False,"prior review authorized model fit")
    packet_ids={x["row_id"]:x for x in packet["row_queue"]}

    s001=data["source_row_crosswalk"]["RB2-S001"]
    s002=data["source_row_crosswalk"]["RB2-S002"]
    require(len(s001) == data["checks"]["count_r0"] == 9, "R0 count")
    require(len(s002) == data["checks"]["count_r1_s002"] == 9, "R1 count")
    require({x["row_id"] for x in s001} == set(EXPECTED_R0), "R0 spotcheck ID mismatch")
    require({x["row_id"] for x in s002} == set(EXPECTED_S002_TIME), "R1 spotcheck ID mismatch")
    require(len({x["row_id"] for x in s001+s002}) == 18, "duplicate spotcheck ID")

    report={"row_timings":[]}
    for row in s001+s002:
        rid=row["row_id"]
        is_r0=rid in EXPECTED_R0
        frozen=r0rows[rid] if is_r0 else r1_s002[rid]
        proof=r0evidence[rid] if is_r0 else r1evidence[rid]
        require(frozen["source_id"] == ("RB2-S001" if is_r0 else "RB2-S002"),
                "source swap")
        require(row["exposure_days"] == 3, "source exposure days changed")
        require(row["exposure_hours_per_day"] == (1 if is_r0 else 4), "source daily exposure mismatch")
        require(str(row["exposure_hours_per_day"]*3600) == frozen["exposure_duration_s"],
                "source per-session field disagrees")
        require(frozen["repeated_exposure_count"] == "3", "frozen repeat count drift")
        require(row["assay"] == proof["assay"], "source assay mismatch")
        require(row["figure_or_table"] == (proof["figure"] if is_r0 else proof["figure_or_table"]),
                "figure/panel locator mismatch")
        require(row["comparator"] == ("0 mT sham" if is_r0 else "sham"),
                "comparison not against sham")
        require(row["post_exposure_culture_days_before_assay"] >= 0, "negative assay lag")
        require(row["text_anchor"] and row["timepoint_note"], "source timing rationale missing")
        require(rid in packet_ids and packet_ids[rid]["fit_eligible"] is False,
                "row not in frozen unapproved review packet")
        if is_r0:
            figure,mean,p,n=EXPECTED_R0[rid]
            require(row["post_exposure_culture_days_before_assay"] == 0, "R0 3-day assay lag fabricated")
            require(row["assay_readout_timing"] == "AFTER_3_DAY_EXPOSURE_COURSE",
                    "R0 observation time changed")
            require(row["figure_or_table"] == figure, "R0 figure mismatch")
            require(row["measured_mean_from_source"] == mean and proof["mean"] == mean,
                    "R0 source mean changed")
            require(row["p_vs_sham"] == p and proof["p_vs_sham"] == p,
                    "R0 source p changed")
            require(row["biological_replicates_n"] == n and proof["n"] == n,
                    "R0 source replication count changed")
        else:
            delay,figure,assay_time=EXPECTED_S002_TIME[rid]
            require(row["post_exposure_culture_days_before_assay"] == delay,
                    "delayed measurement was reassigned to exposure day")
            require(row["assay_readout_timing"] == assay_time, "wrong assay readout timing")
            require(row["figure_or_table"] == figure, "2016 figure mismatch")
            require(row["measured_mean_from_source"] is None and row["p_vs_sham"] is None,
                    "S002 exact numeric evidence invented")
            require(row["biological_replicates_n"] == 5,
                    "2016 source figure biological experiments drift")
            require(frozen["reported_direction"] == proof["reported_direction"] and
                    frozen["reported_significance"] == proof["reported_significance"],
                    "2016 source outcome/receipt disagreement")
        report["row_timings"].append((rid,row["post_exposure_culture_days_before_assay"]))
    require(not (RB3/"FROZEN_ROWS.csv").exists(), "real dataset unexpectedly frozen")
    require(not (RB3/"REAL_ROWS_FREEZE.json").exists(), "real fit unexpectedly authorized")
    return {
        "status":"PASS_RB3_R5_E3_UNATTESTED_SOURCE_TIMING_SPOTCHECK",
        "spotcheck_rows":18,
        "source_ids":sorted(data["source_records"]),
        "delayed_readouts":{rid:delay for rid,delay in report["row_timings"] if delay>0},
        "readout_time_is_model_feature":False,
        "independent_review_attestations":0,
        "reviewed_eligible_rows":0,
        "model_execution_authorized":False,
        "crosswalk_sha256":hashlib.sha256(DATA.read_bytes()).hexdigest(),
        "review_packet_sha256":packet["packet_sha256"],
    }


def audit():
    return checked_crosswalk(load_json(DATA))


if __name__=="__main__":
    print(json.dumps(audit(),sort_keys=True,indent=2))

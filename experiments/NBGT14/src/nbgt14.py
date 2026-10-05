#!/usr/bin/env python3
from __future__ import annotations

from copy import deepcopy
from itertools import combinations
from pathlib import Path
import hashlib
import importlib.util
import json
import sys

VERSION="0.1.0"
ROOT=Path(__file__).resolve().parents[1]
T13_PATH=ROOT.parent/"NBGT13"/"src"/"nbgt13.py"
_spec=importlib.util.spec_from_file_location("nbgt13_for_t14",T13_PATH)
t13=importlib.util.module_from_spec(_spec)
sys.modules[_spec.name]=t13
_spec.loader.exec_module(t13)

t12=t13.t12
t11=t13.t11
BOUNDARY="KEYHOLE_EQUIVALENCE_NOT_CAUSAL_IDENTITY"


def canonical(obj):
    return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()


def sha256_obj(obj):
    return hashlib.sha256(canonical(obj)).hexdigest()


def frozen_context():
    base,bundle,registry,records,ledger,*_=t12.frozen_fixture()
    receipts=t13.make_intervention_receipts(ledger)
    by_id={r["intervention_id"]:r for r in receipts}
    branches={iid:t13.build_single_branch(ledger,receipt) for iid,receipt in by_id.items()}
    return base,bundle,registry,records,ledger,receipts,by_id,branches


def keyhole_signature(*,bundle,reviewer_registry,policy_records,events,known_cutoff,valid_time,evidence_known_cutoff=10):
    policy=t13.selected_policy(policy_records,events,known_cutoff,valid_time)
    if policy is None:
        outcome="NO_ACTIVE_POLICY"
    else:
        try:
            _,outcome=t13.outcome_at(
                bundle=bundle,
                reviewer_registry=reviewer_registry,
                policy_records=policy_records,
                events=events,
                known_cutoff=known_cutoff,
                valid_time=valid_time,
                evidence_known_cutoff=evidence_known_cutoff,
            )
        except ValueError:
            outcome="NO_RESOLUTION"
    return {
        "known_cutoff":known_cutoff,
        "valid_time":valid_time,
        "policy_version_id":policy,
        "governance_outcome":outcome,
    }


def temporal_signature(*,bundle,reviewer_registry,policy_records,events,max_known=12,max_valid=12,evidence_known_cutoff=10):
    rows=[]
    for known in range(1,max_known+1):
        for valid in range(1,max_valid+1):
            rows.append(keyhole_signature(
                bundle=bundle,
                reviewer_registry=reviewer_registry,
                policy_records=policy_records,
                events=events,
                known_cutoff=known,
                valid_time=valid,
                evidence_known_cutoff=evidence_known_cutoff,
            ))
    payload={
        "max_known":max_known,
        "max_valid":max_valid,
        "evidence_known_cutoff":evidence_known_cutoff,
        "rows":rows,
    }
    return {
        "rows":rows,
        "signature_hash":sha256_obj(payload),
    }


def build_signature_table(*,bundle,reviewer_registry,policy_records,branches,target_known=10,target_valid=10):
    table={}
    for intervention_id,branch in sorted(branches.items()):
        target=keyhole_signature(
            bundle=bundle,
            reviewer_registry=reviewer_registry,
            policy_records=policy_records,
            events=branch["branch_ledger"],
            known_cutoff=target_known,
            valid_time=target_valid,
        )
        full=temporal_signature(
            bundle=bundle,
            reviewer_registry=reviewer_registry,
            policy_records=policy_records,
            events=branch["branch_ledger"],
        )
        row={
            "intervention_id":intervention_id,
            "branch_ledger_head":branch["branch_ledger_head"],
            "target_signature":{
                "policy_version_id":target["policy_version_id"],
                "governance_outcome":target["governance_outcome"],
            },
            "target_signature_hash":sha256_obj({
                "policy_version_id":target["policy_version_id"],
                "governance_outcome":target["governance_outcome"],
            }),
            "temporal_signature_hash":full["signature_hash"],
            "temporal_rows":full["rows"],
        }
        row["row_hash"]=sha256_obj(row)
        table[intervention_id]=row
    return table


def pair_receipt(left_id,right_id,signature_table,target_known=10,target_valid=10):
    if left_id==right_id:
        raise ValueError("pair requires two distinct interventions")
    left_id,right_id=sorted([left_id,right_id])
    if left_id not in signature_table or right_id not in signature_table:
        raise ValueError("unknown intervention ID")
    left=signature_table[left_id]
    right=signature_table[right_id]
    target_equal=left["target_signature"]==right["target_signature"]

    residue=[]
    for lrow,rrow in zip(left["temporal_rows"],right["temporal_rows"]):
        ls=(lrow["policy_version_id"],lrow["governance_outcome"])
        rs=(rrow["policy_version_id"],rrow["governance_outcome"])
        if ls!=rs:
            residue.append({
                "known_cutoff":lrow["known_cutoff"],
                "valid_time":lrow["valid_time"],
                "left_policy":lrow["policy_version_id"],
                "right_policy":rrow["policy_version_id"],
                "left_outcome":lrow["governance_outcome"],
                "right_outcome":rrow["governance_outcome"],
            })

    temporal_equivalent=len(residue)==0
    first_separator=residue[0] if residue else None
    if target_equal and temporal_equivalent:
        classification="TEMPORALLY_EQUIVALENT_IN_QUERY_FAMILY"
    elif target_equal:
        classification="KEYHOLE_EQUIVALENT_TEMPORALLY_DISTINCT"
    else:
        classification="TARGET_DISTINCT"

    receipt={
        "experiment":"NBG-T14",
        "version":VERSION,
        "pair_id":f"{left_id}__{right_id}",
        "left_intervention_id":left_id,
        "right_intervention_id":right_id,
        "target_keyhole":{"known_cutoff":target_known,"valid_time":target_valid},
        "left_target_signature":left["target_signature"],
        "right_target_signature":right["target_signature"],
        "target_equivalent":target_equal,
        "temporal_equivalent":temporal_equivalent,
        "classification":classification,
        "left_branch_ledger_head":left["branch_ledger_head"],
        "right_branch_ledger_head":right["branch_ledger_head"],
        "left_temporal_signature_hash":left["temporal_signature_hash"],
        "right_temporal_signature_hash":right["temporal_signature_hash"],
        "residue_count":len(residue),
        "first_separating_keyhole":first_separator,
        "minimal_separating_keyhole_family":[] if temporal_equivalent else [{
            "known_cutoff":first_separator["known_cutoff"],
            "valid_time":first_separator["valid_time"],
        }],
        "minimal_separator_cardinality":0 if temporal_equivalent else 1,
        "governance_residue_hash":sha256_obj(residue),
        "truth_claim":BOUNDARY,
        "causal_claim":"NONE_EQUIVALENCE_CLASS_IS_NOT_CAUSAL_IDENTITY",
    }
    receipt["receipt_hash"]=sha256_obj(receipt)
    return receipt


def validate_pair_receipt(receipt,signature_table):
    frozen=deepcopy(receipt)
    expected=frozen.pop("receipt_hash")
    if sha256_obj(frozen)!=expected:
        raise ValueError("pair receipt hash mismatch")
    rebuilt=pair_receipt(
        receipt["left_intervention_id"],
        receipt["right_intervention_id"],
        signature_table,
        target_known=receipt["target_keyhole"]["known_cutoff"],
        target_valid=receipt["target_keyhole"]["valid_time"],
    )
    if canonical(rebuilt)!=canonical(receipt):
        raise ValueError("pair receipt replay mismatch")
    if receipt["truth_claim"]!=BOUNDARY:
        raise ValueError("pair truth boundary mismatch")
    return True


def target_equivalence_classes(signature_table):
    groups={}
    for intervention_id,row in signature_table.items():
        key=(
            row["target_signature"]["policy_version_id"],
            row["target_signature"]["governance_outcome"],
        )
        groups.setdefault(key,[]).append(intervention_id)
    classes=[]
    for key,ids in groups.items():
        ids=sorted(ids)
        payload={
            "policy_version_id":key[0],
            "governance_outcome":key[1],
            "intervention_ids":ids,
        }
        classes.append({
            **payload,
            "class_hash":sha256_obj(payload),
        })
    classes.sort(key=lambda row:(str(row["policy_version_id"]),row["governance_outcome"],row["intervention_ids"]))
    return classes


def temporal_equivalence_classes(signature_table):
    groups={}
    for intervention_id,row in signature_table.items():
        groups.setdefault(row["temporal_signature_hash"],[]).append(intervention_id)
    classes=[]
    for signature_hash,ids in groups.items():
        payload={
            "temporal_signature_hash":signature_hash,
            "intervention_ids":sorted(ids),
        }
        classes.append({
            **payload,
            "class_hash":sha256_obj(payload),
        })
    classes.sort(key=lambda row:(row["intervention_ids"],row["temporal_signature_hash"]))
    return classes


def build_equivalence_atlas(*,bundle,reviewer_registry,policy_records,branches,target_known=10,target_valid=10):
    table=build_signature_table(
        bundle=bundle,
        reviewer_registry=reviewer_registry,
        policy_records=policy_records,
        branches=branches,
        target_known=target_known,
        target_valid=target_valid,
    )
    pairs=[
        pair_receipt(a,b,table,target_known,target_valid)
        for a,b in combinations(sorted(table),2)
    ]
    target_equal=[p for p in pairs if p["target_equivalent"]]
    hidden_residue=[p for p in target_equal if not p["temporal_equivalent"]]
    full_equiv=[p for p in target_equal if p["temporal_equivalent"]]
    atlas={
        "experiment":"NBG-T14",
        "version":VERSION,
        "target_keyhole":{"known_cutoff":target_known,"valid_time":target_valid},
        "signature_table":{k:{kk:vv for kk,vv in v.items() if kk!="temporal_rows"} for k,v in sorted(table.items())},
        "target_equivalence_classes":target_equivalence_classes(table),
        "temporal_equivalence_classes":temporal_equivalence_classes(table),
        "pair_receipts":pairs,
        "counts":{
            "interventions":len(table),
            "pairs":len(pairs),
            "target_equivalent_pairs":len(target_equal),
            "hidden_residue_pairs":len(hidden_residue),
            "temporally_equivalent_pairs":len(full_equiv),
        },
        "truth_claim":BOUNDARY,
    }
    atlas["atlas_hash"]=sha256_obj(atlas)
    return atlas,table


def validate_equivalence_atlas(atlas,signature_table):
    frozen=deepcopy(atlas)
    expected=frozen.pop("atlas_hash")
    if sha256_obj(frozen)!=expected:
        raise ValueError("equivalence atlas hash mismatch")
    if atlas["truth_claim"]!=BOUNDARY:
        raise ValueError("atlas truth boundary mismatch")
    if atlas["counts"]["pairs"]!=36:
        raise ValueError("expected 36 pair receipts")
    for receipt in atlas["pair_receipts"]:
        validate_pair_receipt(receipt,signature_table)
    return True


def find_pair(atlas,left_id,right_id):
    pair_id="__".join(sorted([left_id,right_id]))
    for receipt in atlas["pair_receipts"]:
        if receipt["pair_id"]==pair_id:
            return receipt
    raise KeyError(pair_id)


def run_suite():
    base,bundle,registry,records,ledger,receipts,by_id,branches=frozen_context()
    observed_before=canonical(ledger)
    atlas,table=build_equivalence_atlas(
        bundle=bundle,
        reviewer_registry=registry,
        policy_records=records,
        branches=branches,
    )

    deactivation_pair=find_pair(atlas,"I_REMOVE_DEACTIVATE","I_DELAY_DEACTIVATE_11")
    normal2_pair=find_pair(atlas,"I_REMOVE_REGISTER_NORMAL2","I_DELAY_REGISTER_NORMAL2_11")
    ledger_control_pair=find_pair(atlas,"I_ALTER_DEACTIVATE_PAYLOAD_ONLY","I_REMOVE_SUPERSEDE_NORMAL1")
    alter_vs_control=find_pair(atlas,"I_ALTER_DEACTIVATE_VALID10","I_ALTER_DEACTIVATE_PAYLOAD_ONLY")

    target_classes=atlas["target_equivalence_classes"]
    temporal_classes=atlas["temporal_equivalence_classes"]
    largest_target=max(target_classes,key=lambda row:len(row["intervention_ids"]))
    multi_temporal=[row for row in temporal_classes if len(row["intervention_ids"])>1]

    checks=[
        {"name":"atlas:valid","pass":validate_equivalence_atlas(atlas,table)},
        {"name":"atlas:nine_interventions","pass":atlas["counts"]["interventions"]==9},
        {"name":"atlas:thirty_six_pairs","pass":atlas["counts"]["pairs"]==36},
        {"name":"observed:ledger_immutable","pass":canonical(ledger)==observed_before},
        {"name":"source:status_alleged","pass":base["source_status"]=="ALLEGED"},
        {"name":"deactivation:target_equivalent","pass":deactivation_pair["target_equivalent"]},
        {"name":"deactivation:temporally_distinct","pass":not deactivation_pair["temporal_equivalent"]},
        {"name":"deactivation:classification","pass":deactivation_pair["classification"]=="KEYHOLE_EQUIVALENT_TEMPORALLY_DISTINCT"},
        {"name":"deactivation:separator_singleton","pass":deactivation_pair["minimal_separator_cardinality"]==1},
        {"name":"deactivation:separator_exists","pass":deactivation_pair["first_separating_keyhole"] is not None},
        {"name":"deactivation:residue_nonzero","pass":deactivation_pair["residue_count"]>0},
        {"name":"normal2:target_equivalent","pass":normal2_pair["target_equivalent"]},
        {"name":"normal2:temporally_distinct","pass":not normal2_pair["temporal_equivalent"]},
        {"name":"normal2:separator_singleton","pass":normal2_pair["minimal_separator_cardinality"]==1},
        {"name":"normal2:residue_nonzero","pass":normal2_pair["residue_count"]>0},
        {"name":"ledger_controls:target_equivalent","pass":ledger_control_pair["target_equivalent"]},
        {"name":"ledger_controls:temporally_equivalent","pass":ledger_control_pair["temporal_equivalent"]},
        {"name":"ledger_controls:classification","pass":ledger_control_pair["classification"]=="TEMPORALLY_EQUIVALENT_IN_QUERY_FAMILY"},
        {"name":"ledger_controls:no_separator","pass":ledger_control_pair["minimal_separator_cardinality"]==0 and ledger_control_pair["first_separating_keyhole"] is None},
        {"name":"ledger_controls:residue_zero","pass":ledger_control_pair["residue_count"]==0},
        {"name":"ledger_controls:heads_different","pass":ledger_control_pair["left_branch_ledger_head"]!=ledger_control_pair["right_branch_ledger_head"]},
        {"name":"alter_control:target_equivalent","pass":alter_vs_control["target_equivalent"]},
        {"name":"alter_control:temporally_distinct","pass":not alter_vs_control["temporal_equivalent"]},
        {"name":"target_classes:at_least_three","pass":len(target_classes)>=3},
        {"name":"target_classes:largest_multi","pass":len(largest_target["intervention_ids"])>=3},
        {"name":"temporal_classes:multi_class_exists","pass":len(multi_temporal)>=1},
        {"name":"pair_receipts:all_hashed","pass":all("receipt_hash" in p for p in atlas["pair_receipts"])},
        {"name":"pair_receipts:all_boundary","pass":all(p["truth_claim"]==BOUNDARY for p in atlas["pair_receipts"])},
        {"name":"pair_receipts:no_causal_identity","pass":all(p["causal_claim"]=="NONE_EQUIVALENCE_CLASS_IS_NOT_CAUSAL_IDENTITY" for p in atlas["pair_receipts"])},
        {"name":"pair_receipts:canonical_ids","pass":all(p["left_intervention_id"]<p["right_intervention_id"] for p in atlas["pair_receipts"])},
        {"name":"separators:minimal_zero_or_one","pass":all(p["minimal_separator_cardinality"] in (0,1) for p in atlas["pair_receipts"])},
        {"name":"residue:hashes_present","pass":all(len(p["governance_residue_hash"])==64 for p in atlas["pair_receipts"])},
        {"name":"replay:atlas_deterministic","pass":canonical(atlas)==canonical(build_equivalence_atlas(bundle=bundle,reviewer_registry=registry,policy_records=records,branches=branches)[0])},
        {"name":"replay:pair_deterministic","pass":canonical(deactivation_pair)==canonical(pair_receipt("I_REMOVE_DEACTIVATE","I_DELAY_DEACTIVATE_11",table))},
    ]

    result={
        "experiment":"NBG-T14",
        "version":VERSION,
        "witness":{
            "target_keyhole":{"known_cutoff":10,"valid_time":10},
            "interventions":atlas["counts"]["interventions"],
            "pairs":atlas["counts"]["pairs"],
            "target_equivalent_pairs":atlas["counts"]["target_equivalent_pairs"],
            "hidden_residue_pairs":atlas["counts"]["hidden_residue_pairs"],
            "temporally_equivalent_pairs":atlas["counts"]["temporally_equivalent_pairs"],
            "deactivation_pair":{
                "classification":deactivation_pair["classification"],
                "first_separator":deactivation_pair["first_separating_keyhole"],
                "residue_count":deactivation_pair["residue_count"],
            },
            "normal2_pair":{
                "classification":normal2_pair["classification"],
                "first_separator":normal2_pair["first_separating_keyhole"],
                "residue_count":normal2_pair["residue_count"],
            },
            "ledger_control_pair":{
                "classification":ledger_control_pair["classification"],
                "residue_count":ledger_control_pair["residue_count"],
                "ledger_heads_different":ledger_control_pair["left_branch_ledger_head"]!=ledger_control_pair["right_branch_ledger_head"],
            },
            "largest_target_class":largest_target,
            "multi_temporal_classes":multi_temporal,
        },
        "checks":checks,
        "checks_passed":sum(bool(c["pass"]) for c in checks),
        "checks_total":len(checks),
    }
    result["verdict"]="PASS_NBGT14" if result["checks_passed"]==result["checks_total"] else "FAIL_NBGT14"
    result["result_hash"]=sha256_obj(result)
    return result,{
        "equivalence_atlas":atlas,
        "deactivation_pair":deactivation_pair,
        "normal2_pair":normal2_pair,
        "ledger_control_pair":ledger_control_pair,
        "signature_table":{k:{kk:vv for kk,vv in v.items() if kk!="temporal_rows"} for k,v in table.items()},
    }


def main():
    result,artifacts=run_suite()
    out=ROOT/"results"
    out.mkdir(parents=True,exist_ok=True)
    for name,obj in {
        "equivalence_atlas.json":artifacts["equivalence_atlas"],
        "deactivation_pair.json":artifacts["deactivation_pair"],
        "normal2_pair.json":artifacts["normal2_pair"],
        "ledger_control_pair.json":artifacts["ledger_control_pair"],
        "signature_table.json":artifacts["signature_table"],
    }.items():
        (out/name).write_text(json.dumps(obj,indent=2,sort_keys=True)+"\n")
    data=(json.dumps(result,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(data)
    print(json.dumps({
        "verdict":result["verdict"],
        "checks":f"{result['checks_passed']}/{result['checks_total']}",
        "target_equivalent_pairs":result["witness"]["target_equivalent_pairs"],
        "hidden_residue_pairs":result["witness"]["hidden_residue_pairs"],
        "temporally_equivalent_pairs":result["witness"]["temporally_equivalent_pairs"],
        "deactivation_separator":result["witness"]["deactivation_pair"]["first_separator"],
        "failed_checks":[c["name"] for c in result["checks"] if not c["pass"]],
        "result_sha256":hashlib.sha256(data).hexdigest(),
    },indent=2))
    if result["verdict"]!="PASS_NBGT14":
        raise SystemExit(1)


if __name__=="__main__":
    main()

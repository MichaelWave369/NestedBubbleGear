#!/usr/bin/env python3
from __future__ import annotations

from copy import deepcopy
from itertools import combinations
from pathlib import Path
import hashlib
import importlib.util
import json
import math
import sys

VERSION="0.1.0"
ROOT=Path(__file__).resolve().parents[1]
T14_PATH=ROOT.parent/"NBGT14"/"src"/"nbgt14.py"
_spec=importlib.util.spec_from_file_location("nbgt14_for_t15",T14_PATH)
t14=importlib.util.module_from_spec(_spec)
sys.modules[_spec.name]=t14
_spec.loader.exec_module(t14)

BOUNDARY="OBSERVER_SYNTHESIS_RELATIVE_TO_DECLARED_QUERY_LANGUAGE"
CHANNELS=("POLICY","OUTCOME","JOINT")
FULL_FAMILY_IDS=(
    "I_ALTER_DEACTIVATE_PAYLOAD_ONLY",
    "I_ALTER_DEACTIVATE_VALID10",
    "I_DELAY_ACTIVATE_EMERGENCY_7",
    "I_DELAY_DEACTIVATE_11",
    "I_DELAY_REGISTER_NORMAL2_11",
    "I_REMOVE_DEACTIVATE",
    "I_REMOVE_REGISTER_EMERGENCY",
    "I_REMOVE_REGISTER_NORMAL2",
    "I_REMOVE_SUPERSEDE_NORMAL1",
)
DISTINGUISHABLE_EIGHT_IDS=tuple(
    iid for iid in FULL_FAMILY_IDS
    if iid!="I_ALTER_DEACTIVATE_PAYLOAD_ONLY"
)
RESTRICTED_WITNESS_IDS=(
    "I_DELAY_ACTIVATE_EMERGENCY_7",
    "I_REMOVE_SUPERSEDE_NORMAL1",
)


def canonical(obj):
    return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()


def sha256_obj(obj):
    return hashlib.sha256(canonical(obj)).hexdigest()


def observer_cost(known_cutoff,valid_time):
    # A frozen resource proxy only. It is not epistemic value.
    return int(known_cutoff)+int(valid_time)


def keyhole_id(known_cutoff,valid_time):
    return f"k{known_cutoff}_t{valid_time}"


def admissible_keyholes(max_known=12,max_valid=12):
    return [
        {
            "keyhole_id":keyhole_id(k,t),
            "known_cutoff":k,
            "valid_time":t,
            "observer_cost":observer_cost(k,t),
        }
        for k in range(1,max_known+1)
        for t in range(1,max_valid+1)
    ]


def frozen_context():
    base,bundle,registry,records,ledger,receipts,by_id,branches=t14.frozen_context()
    return {
        "base_claim":base,
        "bundle":bundle,
        "reviewer_registry":registry,
        "policy_records":records,
        "observed_ledger":ledger,
        "branches":branches,
    }


def validate_channel(channel):
    if channel not in CHANNELS:
        raise ValueError(f"unsupported observer channel: {channel}")
    return channel


def signature_for_row(row,channel):
    validate_channel(channel)
    if channel=="POLICY":
        return {"policy_version_id":row["policy_version_id"]}
    if channel=="OUTCOME":
        return {"governance_outcome":row["governance_outcome"]}
    return {
        "policy_version_id":row["policy_version_id"],
        "governance_outcome":row["governance_outcome"],
    }


def observe_intervention(*,context,intervention_id,keyhole,channel):
    if intervention_id not in context["branches"]:
        raise ValueError(f"unknown intervention: {intervention_id}")
    validate_channel(channel)
    cache=context.setdefault("_observation_cache",{})
    cache_key=(
        intervention_id,
        int(keyhole["known_cutoff"]),
        int(keyhole["valid_time"]),
        channel,
    )
    if cache_key in cache:
        return deepcopy(cache[cache_key])
    row=t14.keyhole_signature(
        bundle=context["bundle"],
        reviewer_registry=context["reviewer_registry"],
        policy_records=context["policy_records"],
        events=context["branches"][intervention_id]["branch_ledger"],
        known_cutoff=keyhole["known_cutoff"],
        valid_time=keyhole["valid_time"],
    )
    signature=signature_for_row(row,channel)
    cache[cache_key]=deepcopy(signature)
    return signature


def canonical_family(family_ids,context):
    ids=tuple(sorted(family_ids))
    if not ids:
        raise ValueError("observer synthesis requires at least one intervention")
    if len(ids)!=len(set(ids)):
        raise ValueError("duplicate intervention in family")
    missing=[iid for iid in ids if iid not in context["branches"]]
    if missing:
        raise ValueError(f"unknown interventions: {missing}")
    return ids


def pair_universe(family_ids):
    return list(combinations(tuple(sorted(family_ids)),2))


def partition_family(*,context,family_ids,keyhole,channel):
    groups={}
    for iid in sorted(family_ids):
        sig=observe_intervention(
            context=context,
            intervention_id=iid,
            keyhole=keyhole,
            channel=channel,
        )
        skey=canonical(sig).decode()
        groups.setdefault(skey,{"signature":sig,"intervention_ids":[]})
        groups[skey]["intervention_ids"].append(iid)
    rows=[
        {
            "signature":group["signature"],
            "intervention_ids":sorted(group["intervention_ids"]),
        }
        for _,group in sorted(groups.items())
    ]
    return rows


def coverage_for_keyhole(*,context,family_ids,keyhole,channel,pairs):
    signatures={
        iid:canonical(observe_intervention(
            context=context,
            intervention_id=iid,
            keyhole=keyhole,
            channel=channel,
        ))
        for iid in family_ids
    }
    mask=0
    separated=[]
    for index,(left,right) in enumerate(pairs):
        if signatures[left]!=signatures[right]:
            mask|=1<<index
            separated.append([left,right])
    return mask,separated


def compressed_candidates(*,context,family_ids,channel,keyholes=None):
    family_ids=canonical_family(family_ids,context)
    validate_channel(channel)
    keyholes=keyholes or admissible_keyholes()
    pairs=pair_universe(family_ids)
    by_mask={}
    for keyhole in keyholes:
        mask,separated=coverage_for_keyhole(
            context=context,
            family_ids=family_ids,
            keyhole=keyhole,
            channel=channel,
            pairs=pairs,
        )
        if mask==0:
            continue
        row={
            **keyhole,
            "coverage_mask":mask,
            "separated_pair_count":len(separated),
            "separated_pairs":separated,
        }
        previous=by_mask.get(mask)
        ranking=(row["observer_cost"],row["known_cutoff"],row["valid_time"])
        if previous is None or ranking<(
            previous["observer_cost"],
            previous["known_cutoff"],
            previous["valid_time"],
        ):
            by_mask[mask]=row

    candidates=list(by_mask.values())

    # Remove candidates whose separation set is a subset of an equally-or-cheaper candidate.
    keep=[]
    for candidate in candidates:
        dominated=False
        for other in candidates:
            if other is candidate:
                continue
            if candidate["coverage_mask"] | other["coverage_mask"] != other["coverage_mask"]:
                continue
            if (
                other["observer_cost"],
                other["known_cutoff"],
                other["valid_time"],
            ) <= (
                candidate["observer_cost"],
                candidate["known_cutoff"],
                candidate["valid_time"],
            ):
                dominated=True
                break
        if not dominated:
            keep.append(candidate)

    keep.sort(key=lambda row:(
        row["observer_cost"],
        row["known_cutoff"],
        row["valid_time"],
        -row["separated_pair_count"],
    ))
    return keep,pairs


def greedy_upper_bound(candidates,universe_mask):
    chosen=[]
    covered=0
    remaining=list(candidates)
    while covered!=universe_mask:
        ranked=[]
        for candidate in remaining:
            gain=(candidate["coverage_mask"] & ~covered).bit_count()
            if gain:
                ranked.append((
                    -gain,
                    candidate["observer_cost"],
                    candidate["known_cutoff"],
                    candidate["valid_time"],
                    candidate,
                ))
        if not ranked:
            return None
        ranked.sort(key=lambda row:row[:-1])
        selected=ranked[0][-1]
        chosen.append(selected)
        covered|=selected["coverage_mask"]
        remaining=[row for row in remaining if row["keyhole_id"]!=selected["keyhole_id"]]
    return chosen


def _public_keyhole(row):
    return {
        "keyhole_id":row["keyhole_id"],
        "known_cutoff":row["known_cutoff"],
        "valid_time":row["valid_time"],
        "observer_cost":row["observer_cost"],
        "separated_pair_count":row["separated_pair_count"],
    }


def synthesize_static_observer(*,context,family_ids,channel,keyholes=None):
    family_ids=canonical_family(family_ids,context)
    validate_channel(channel)
    keyholes=keyholes or admissible_keyholes()
    candidates,pairs=compressed_candidates(
        context=context,
        family_ids=family_ids,
        channel=channel,
        keyholes=keyholes,
    )
    universe_mask=(1<<len(pairs))-1 if pairs else 0
    union_mask=0
    for candidate in candidates:
        union_mask|=candidate["coverage_mask"]

    unresolved=[
        list(pair)
        for index,pair in enumerate(pairs)
        if not (union_mask & (1<<index))
    ]

    base={
        "experiment":"NBG-T15",
        "version":VERSION,
        "mode":"STATIC_MINIMAL_OBSERVER",
        "channel":channel,
        "family_ids":list(family_ids),
        "admissible_keyhole_count":len(keyholes),
        "compressed_candidate_count":len(candidates),
        "pair_count":len(pairs),
        "truth_claim":BOUNDARY,
        "cost_note":"observer_cost=known_cutoff+valid_time is a frozen resource proxy, not epistemic value",
    }

    if unresolved:
        receipt={
            **base,
            "status":"REFUSE_UNSEPARABLE",
            "minimal_cardinality":None,
            "total_observer_cost":None,
            "selected_keyholes":[],
            "unseparable_pairs":unresolved,
        }
        receipt["selection_receipt_hash"]=sha256_obj(receipt)
        return receipt

    if universe_mask==0:
        receipt={
            **base,
            "status":"PASS",
            "minimal_cardinality":0,
            "total_observer_cost":0,
            "selected_keyholes":[],
            "unseparable_pairs":[],
        }
        receipt["selection_receipt_hash"]=sha256_obj(receipt)
        return receipt

    greedy=greedy_upper_bound(candidates,universe_mask)
    if greedy is None:
        raise AssertionError("separable universe lacked greedy cover")

    winning=None
    for size in range(1,len(greedy)+1):
        best_at_size=None
        for combo in combinations(candidates,size):
            mask=0
            for candidate in combo:
                mask|=candidate["coverage_mask"]
            if mask!=universe_mask:
                continue
            public=sorted((_public_keyhole(row) for row in combo),key=lambda row:(
                row["known_cutoff"],row["valid_time"]
            ))
            ranking=(
                sum(row["observer_cost"] for row in combo),
                tuple((row["known_cutoff"],row["valid_time"]) for row in public),
            )
            if best_at_size is None or ranking<best_at_size[0]:
                best_at_size=(ranking,public)
        if best_at_size is not None:
            winning=best_at_size[1]
            break

    if winning is None:
        raise AssertionError("exact static observer search failed")

    receipt={
        **base,
        "status":"PASS",
        "minimal_cardinality":len(winning),
        "total_observer_cost":sum(row["observer_cost"] for row in winning),
        "selected_keyholes":winning,
        "unseparable_pairs":[],
    }
    receipt["selection_receipt_hash"]=sha256_obj(receipt)
    return receipt


def validate_static_receipt(receipt,context):
    frozen=deepcopy(receipt)
    expected=frozen.pop("selection_receipt_hash")
    if sha256_obj(frozen)!=expected:
        raise ValueError("static selection receipt hash mismatch")
    replay=synthesize_static_observer(
        context=context,
        family_ids=receipt["family_ids"],
        channel=receipt["channel"],
    )
    if canonical(replay)!=canonical(receipt):
        raise ValueError("static selection receipt replay mismatch")
    return True


def split_score(partition):
    sizes=[len(row["intervention_ids"]) for row in partition]
    total=sum(sizes)
    before=math.comb(total,2)
    unresolved=sum(math.comb(size,2) for size in sizes if size>=2)
    return before-unresolved


def choose_next_keyhole(*,context,family_ids,channel,used_keyhole_ids=()):
    family_ids=canonical_family(family_ids,context)
    validate_channel(channel)
    used=set(used_keyhole_ids)
    ranked=[]
    for keyhole in admissible_keyholes():
        if keyhole["keyhole_id"] in used:
            continue
        partition=partition_family(
            context=context,
            family_ids=family_ids,
            keyhole=keyhole,
            channel=channel,
        )
        score=split_score(partition)
        if score<=0:
            continue
        ranked.append((
            -score,
            keyhole["observer_cost"],
            keyhole["known_cutoff"],
            keyhole["valid_time"],
            keyhole,
            partition,
        ))
    if not ranked:
        return None
    ranked.sort(key=lambda row:row[:4])
    _,_,_,_,keyhole,partition=ranked[0]
    receipt={
        "candidate_family_ids":list(family_ids),
        "channel":channel,
        "used_keyhole_ids":sorted(used),
        "selected_keyhole":deepcopy(keyhole),
        "split_score":split_score(partition),
        "partition":partition,
        "selection_rule":"MAX_PAIR_SPLIT_THEN_MIN_COST_THEN_EARLIEST_KEYHOLE",
        "truth_claim":BOUNDARY,
    }
    receipt["query_selection_hash"]=sha256_obj(receipt)
    return receipt


def validate_query_selection_receipt(receipt,context):
    frozen=deepcopy(receipt)
    expected=frozen.pop("query_selection_hash")
    if sha256_obj(frozen)!=expected:
        raise ValueError("query selection receipt hash mismatch")
    replay=choose_next_keyhole(
        context=context,
        family_ids=receipt["candidate_family_ids"],
        channel=receipt["channel"],
        used_keyhole_ids=receipt["used_keyhole_ids"],
    )
    if replay is None or canonical(replay)!=canonical(receipt):
        raise ValueError("query selection receipt replay mismatch")
    return True


def synthesize_adaptive_observer(*,context,family_ids,channel):
    family_ids=canonical_family(family_ids,context)
    validate_channel(channel)
    receipts=[]

    def build(ids,used,depth):
        ids=tuple(sorted(ids))
        if len(ids)<=1:
            return {
                "node_kind":"RESOLVED_LEAF",
                "depth":depth,
                "intervention_ids":list(ids),
            }

        selection=choose_next_keyhole(
            context=context,
            family_ids=ids,
            channel=channel,
            used_keyhole_ids=used,
        )
        if selection is None:
            return {
                "node_kind":"REFUSE_UNSEPARABLE",
                "depth":depth,
                "intervention_ids":list(ids),
                "reason":"NO_ADMISSIBLE_KEYHOLE_SPLITS_REMAINING_FAMILY",
            }

        receipts.append(selection)
        chosen=selection["selected_keyhole"]["keyhole_id"]
        children=[]
        for group in selection["partition"]:
            child=build(
                group["intervention_ids"],
                tuple(sorted(set(used)|{chosen})),
                depth+1,
            )
            children.append({
                "signature":group["signature"],
                "intervention_ids":group["intervention_ids"],
                "child":child,
            })
        return {
            "node_kind":"QUERY",
            "depth":depth,
            "intervention_ids":list(ids),
            "selection_receipt_hash":selection["query_selection_hash"],
            "selected_keyhole":selection["selected_keyhole"],
            "split_score":selection["split_score"],
            "children":children,
        }

    tree=build(family_ids,tuple(),0)

    def walk(node):
        stats={
            "leaf_count":0,
            "resolved_leaf_count":0,
            "unresolved_leaf_count":0,
            "worst_case_depth":node["depth"],
            "query_node_count":0,
            "keyhole_ids":set(),
        }
        if node["node_kind"]=="QUERY":
            stats["query_node_count"]=1
            stats["keyhole_ids"].add(node["selected_keyhole"]["keyhole_id"])
            for childrow in node["children"]:
                childstats=walk(childrow["child"])
                stats["leaf_count"]+=childstats["leaf_count"]
                stats["resolved_leaf_count"]+=childstats["resolved_leaf_count"]
                stats["unresolved_leaf_count"]+=childstats["unresolved_leaf_count"]
                stats["worst_case_depth"]=max(stats["worst_case_depth"],childstats["worst_case_depth"])
                stats["query_node_count"]+=childstats["query_node_count"]
                stats["keyhole_ids"]|=childstats["keyhole_ids"]
        else:
            stats["leaf_count"]=1
            stats["resolved_leaf_count"]=1 if node["node_kind"]=="RESOLVED_LEAF" else 0
            stats["unresolved_leaf_count"]=1 if node["node_kind"]=="REFUSE_UNSEPARABLE" else 0
        return stats

    stats=walk(tree)
    payload={
        "experiment":"NBG-T15",
        "version":VERSION,
        "mode":"ADAPTIVE_OBSERVER",
        "channel":channel,
        "family_ids":list(family_ids),
        "tree":tree,
        "query_selection_receipts":receipts,
        "stats":{
            "leaf_count":stats["leaf_count"],
            "resolved_leaf_count":stats["resolved_leaf_count"],
            "unresolved_leaf_count":stats["unresolved_leaf_count"],
            "worst_case_depth":stats["worst_case_depth"],
            "query_node_count":stats["query_node_count"],
            "distinct_keyhole_count":len(stats["keyhole_ids"]),
            "distinct_keyhole_ids":sorted(stats["keyhole_ids"]),
        },
        "status":"PASS" if stats["unresolved_leaf_count"]==0 else "REFUSE_UNSEPARABLE",
        "truth_claim":BOUNDARY,
    }
    payload["adaptive_receipt_hash"]=sha256_obj(payload)
    return payload


def validate_adaptive_receipt(receipt,context):
    frozen=deepcopy(receipt)
    expected=frozen.pop("adaptive_receipt_hash")
    if sha256_obj(frozen)!=expected:
        raise ValueError("adaptive receipt hash mismatch")
    for query_receipt in receipt["query_selection_receipts"]:
        validate_query_selection_receipt(query_receipt,context)
    replay=synthesize_adaptive_observer(
        context=context,
        family_ids=receipt["family_ids"],
        channel=receipt["channel"],
    )
    if canonical(replay)!=canonical(receipt):
        raise ValueError("adaptive receipt replay mismatch")
    return True


def compare_static_adaptive(static_receipt,adaptive_receipt):
    payload={
        "static":{
            "status":static_receipt["status"],
            "minimal_cardinality":static_receipt["minimal_cardinality"],
            "total_observer_cost":static_receipt["total_observer_cost"],
            "selected_keyholes":static_receipt["selected_keyholes"],
        },
        "adaptive":{
            "status":adaptive_receipt["status"],
            "worst_case_depth":adaptive_receipt["stats"]["worst_case_depth"],
            "query_node_count":adaptive_receipt["stats"]["query_node_count"],
            "distinct_keyhole_count":adaptive_receipt["stats"]["distinct_keyhole_count"],
            "distinct_keyhole_ids":adaptive_receipt["stats"]["distinct_keyhole_ids"],
        },
        "comparison_note":"Static cardinality and adaptive depth are different observer contracts; neither metric is declared epistemic value.",
        "truth_claim":BOUNDARY,
    }
    payload["comparison_hash"]=sha256_obj(payload)
    return payload


def run_suite():
    context=frozen_context()
    observed_before=canonical(context["observed_ledger"])

    static_joint=synthesize_static_observer(
        context=context,
        family_ids=DISTINGUISHABLE_EIGHT_IDS,
        channel="JOINT",
    )
    static_policy_pair=synthesize_static_observer(
        context=context,
        family_ids=RESTRICTED_WITNESS_IDS,
        channel="POLICY",
    )
    static_outcome_pair=synthesize_static_observer(
        context=context,
        family_ids=RESTRICTED_WITNESS_IDS,
        channel="OUTCOME",
    )
    static_full9=synthesize_static_observer(
        context=context,
        family_ids=FULL_FAMILY_IDS,
        channel="JOINT",
    )
    adaptive_joint=synthesize_adaptive_observer(
        context=context,
        family_ids=DISTINGUISHABLE_EIGHT_IDS,
        channel="JOINT",
    )
    adaptive_full9=synthesize_adaptive_observer(
        context=context,
        family_ids=FULL_FAMILY_IDS,
        channel="JOINT",
    )
    comparison=compare_static_adaptive(static_joint,adaptive_joint)

    full9_unseparable={tuple(pair) for pair in static_full9["unseparable_pairs"]}
    expected_equiv_pair=tuple(sorted((
        "I_ALTER_DEACTIVATE_PAYLOAD_ONLY",
        "I_REMOVE_SUPERSEDE_NORMAL1",
    )))

    checks=[
        {"name":"channels:three","pass":CHANNELS==("POLICY","OUTCOME","JOINT")},
        {"name":"keyholes:144","pass":len(admissible_keyholes())==144},
        {"name":"family:full_nine","pass":len(FULL_FAMILY_IDS)==9},
        {"name":"family:distinguishable_eight","pass":len(DISTINGUISHABLE_EIGHT_IDS)==8},
        {"name":"observed:ledger_immutable","pass":canonical(context["observed_ledger"])==observed_before},
        {"name":"static_joint:pass","pass":static_joint["status"]=="PASS"},
        {"name":"static_joint:positive_cardinality","pass":static_joint["minimal_cardinality"] is not None and static_joint["minimal_cardinality"]>0},
        {"name":"static_joint:keyholes_match_cardinality","pass":len(static_joint["selected_keyholes"])==static_joint["minimal_cardinality"]},
        {"name":"static_joint:cost_positive","pass":static_joint["total_observer_cost"]>0},
        {"name":"static_joint:valid","pass":validate_static_receipt(static_joint,context)},
        {"name":"static_joint:no_unseparable_pairs","pass":static_joint["unseparable_pairs"]==[]},
        {"name":"policy_pair:pass","pass":static_policy_pair["status"]=="PASS"},
        {"name":"policy_pair:one_keyhole","pass":static_policy_pair["minimal_cardinality"]==1},
        {"name":"policy_pair:valid","pass":validate_static_receipt(static_policy_pair,context)},
        {"name":"outcome_pair:refused","pass":static_outcome_pair["status"]=="REFUSE_UNSEPARABLE"},
        {"name":"outcome_pair:pair_reported","pass":static_outcome_pair["unseparable_pairs"]==[list(sorted(RESTRICTED_WITNESS_IDS))]},
        {"name":"outcome_pair:no_selected_keyholes","pass":static_outcome_pair["selected_keyholes"]==[]},
        {"name":"outcome_pair:valid","pass":validate_static_receipt(static_outcome_pair,context)},
        {"name":"full9:refused","pass":static_full9["status"]=="REFUSE_UNSEPARABLE"},
        {"name":"full9:known_equiv_pair_present","pass":expected_equiv_pair in full9_unseparable},
        {"name":"full9:no_selected_keyholes","pass":static_full9["selected_keyholes"]==[]},
        {"name":"full9:valid","pass":validate_static_receipt(static_full9,context)},
        {"name":"adaptive8:pass","pass":adaptive_joint["status"]=="PASS"},
        {"name":"adaptive8:all_resolved","pass":adaptive_joint["stats"]["unresolved_leaf_count"]==0},
        {"name":"adaptive8:eight_resolved_leaves","pass":adaptive_joint["stats"]["resolved_leaf_count"]==8},
        {"name":"adaptive8:positive_depth","pass":adaptive_joint["stats"]["worst_case_depth"]>0},
        {"name":"adaptive8:query_receipts","pass":len(adaptive_joint["query_selection_receipts"])==adaptive_joint["stats"]["query_node_count"]},
        {"name":"adaptive8:valid","pass":validate_adaptive_receipt(adaptive_joint,context)},
        {"name":"adaptive9:refused","pass":adaptive_full9["status"]=="REFUSE_UNSEPARABLE"},
        {"name":"adaptive9:unresolved_leaf","pass":adaptive_full9["stats"]["unresolved_leaf_count"]>=1},
        {"name":"adaptive9:valid","pass":validate_adaptive_receipt(adaptive_full9,context)},
        {"name":"adaptive9:known_pair_survives","pass":any(
            node_pair==set(expected_equiv_pair)
            for node_pair in _unresolved_leaf_sets(adaptive_full9["tree"])
        )},
        {"name":"comparison:static_status","pass":comparison["static"]["status"]=="PASS"},
        {"name":"comparison:adaptive_status","pass":comparison["adaptive"]["status"]=="PASS"},
        {"name":"comparison:hash","pass":len(comparison["comparison_hash"])==64},
        {"name":"selection:all_query_receipts_valid","pass":all(
            validate_query_selection_receipt(row,context)
            for row in adaptive_joint["query_selection_receipts"]
        )},
        {"name":"selection:rule_frozen","pass":all(
            row["selection_rule"]=="MAX_PAIR_SPLIT_THEN_MIN_COST_THEN_EARLIEST_KEYHOLE"
            for row in adaptive_joint["query_selection_receipts"]
        )},
        {"name":"cost:proxy_disclaimer","pass":"not epistemic value" in static_joint["cost_note"]},
        {"name":"truth:static_boundary","pass":static_joint["truth_claim"]==BOUNDARY},
        {"name":"truth:adaptive_boundary","pass":adaptive_joint["truth_claim"]==BOUNDARY},
        {"name":"replay:static_deterministic","pass":canonical(static_joint)==canonical(synthesize_static_observer(context=context,family_ids=DISTINGUISHABLE_EIGHT_IDS,channel="JOINT"))},
        {"name":"replay:adaptive_deterministic","pass":canonical(adaptive_joint)==canonical(synthesize_adaptive_observer(context=context,family_ids=DISTINGUISHABLE_EIGHT_IDS,channel="JOINT"))},
    ]

    result={
        "experiment":"NBG-T15",
        "version":VERSION,
        "witness":{
            "static_joint_eight":{
                "status":static_joint["status"],
                "minimal_cardinality":static_joint["minimal_cardinality"],
                "total_observer_cost":static_joint["total_observer_cost"],
                "selected_keyholes":static_joint["selected_keyholes"],
            },
            "restricted_policy_pair":{
                "status":static_policy_pair["status"],
                "minimal_cardinality":static_policy_pair["minimal_cardinality"],
                "selected_keyholes":static_policy_pair["selected_keyholes"],
            },
            "restricted_outcome_pair":{
                "status":static_outcome_pair["status"],
                "unseparable_pairs":static_outcome_pair["unseparable_pairs"],
            },
            "full9_joint":{
                "status":static_full9["status"],
                "unseparable_pairs":static_full9["unseparable_pairs"],
            },
            "adaptive8_stats":adaptive_joint["stats"],
            "adaptive9_stats":adaptive_full9["stats"],
            "adaptive8_root":adaptive_joint["tree"].get("selected_keyhole"),
        },
        "checks":checks,
        "checks_passed":sum(bool(row["pass"]) for row in checks),
        "checks_total":len(checks),
    }
    result["verdict"]="PASS_NBGT15" if result["checks_passed"]==result["checks_total"] else "FAIL_NBGT15"
    result["result_hash"]=sha256_obj(result)
    return result,{
        "static_joint_eight":static_joint,
        "static_policy_pair":static_policy_pair,
        "static_outcome_pair_refusal":static_outcome_pair,
        "static_full9_refusal":static_full9,
        "adaptive_joint_eight":adaptive_joint,
        "adaptive_full9":adaptive_full9,
        "observer_comparison":comparison,
    }


def _unresolved_leaf_sets(tree):
    rows=[]
    def walk(node):
        if node["node_kind"]=="REFUSE_UNSEPARABLE":
            rows.append(set(node["intervention_ids"]))
            return
        if node["node_kind"]=="QUERY":
            for child in node["children"]:
                walk(child["child"])
    walk(tree)
    return rows


def main():
    result,artifacts=run_suite()
    out=ROOT/"results"
    out.mkdir(parents=True,exist_ok=True)
    for name,obj in {
        "static_joint_eight.json":artifacts["static_joint_eight"],
        "static_policy_pair.json":artifacts["static_policy_pair"],
        "static_outcome_pair_refusal.json":artifacts["static_outcome_pair_refusal"],
        "static_full9_refusal.json":artifacts["static_full9_refusal"],
        "adaptive_joint_eight.json":artifacts["adaptive_joint_eight"],
        "adaptive_full9.json":artifacts["adaptive_full9"],
        "observer_comparison.json":artifacts["observer_comparison"],
    }.items():
        (out/name).write_text(json.dumps(obj,indent=2,sort_keys=True)+"\n")
    data=(json.dumps(result,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(data)
    print(json.dumps({
        "verdict":result["verdict"],
        "checks":f"{result['checks_passed']}/{result['checks_total']}",
        "static_cardinality":result["witness"]["static_joint_eight"]["minimal_cardinality"],
        "static_keyholes":result["witness"]["static_joint_eight"]["selected_keyholes"],
        "policy_pair_keyholes":result["witness"]["restricted_policy_pair"]["selected_keyholes"],
        "outcome_pair_status":result["witness"]["restricted_outcome_pair"]["status"],
        "full9_status":result["witness"]["full9_joint"]["status"],
        "adaptive8_stats":result["witness"]["adaptive8_stats"],
        "adaptive8_root":result["witness"]["adaptive8_root"],
        "adaptive9_stats":result["witness"]["adaptive9_stats"],
        "failed_checks":[row["name"] for row in result["checks"] if not row["pass"]],
        "result_sha256":hashlib.sha256(data).hexdigest(),
    },indent=2))
    if result["verdict"]!="PASS_NBGT15":
        raise SystemExit(1)


if __name__=="__main__":
    main()

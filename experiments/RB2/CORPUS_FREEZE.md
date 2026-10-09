# NBG-RB2 v0.1.0 — Literature Corpus Freeze

## Status

**Corpus/protocol freeze only. No predictive model has been run and no scientific result is authorized.**

RB2 turns the RB1 hypothesis into a fixed evidence surface before RB3 modeling.

## Frozen source set

RB2 contains **14 primary experimental EMF records across 11 source lineages**.

The set intentionally includes:

- positive responses;
- null responses;
- decreased-proliferation responses;
- multiple frequencies where available;
- multiple field amplitudes where available;
- neural, epidermal, mesenchymal, fibroblast and hematopoietic systems;
- both in-vitro and one in-vivo neural lineage.

A paper was not included merely because it used the words regeneration, resonance, Schumann, DNA antenna, or healing.

## Eligibility

A primary record is eligible when all of the following hold:

1. it reports an experimental electromagnetic or magnetic-field exposure;
2. frequency is known or extractable;
3. at least one biological endpoint maps to the RB1 endpoint vocabulary;
4. a sham/control comparison or explicit within-study comparison exists;
5. the source has a stable bibliographic identifier;
6. enough exposure metadata exist to distinguish the condition from a bare frequency label.

## Exclusions from predictive corpus

The following are excluded as RB3 model rows:

- reviews and meta-analyses;
- theoretical/commentary papers;
- endogenous bioelectric manipulations without an externally specified EMF exposure;
- case reports without a controlled comparator;
- viral/social-media frequency claims;
- sources where frequency cannot be established;
- duplicate publications of the same experimental condition unless separately justified.

Excluded material may appear in the context registry, which is **not model input**.

## Context quarantine

The planarian bioelectric-regeneration papers and the Blank/Goodman DNA-fractal-antenna proposal are retained as mechanism/hypothesis context only.

That means:

`context evidence != predictive row`

and:

`gene expression change != direct DNA coupling`

## Lineage groups

Lineages prevent related studies from leaking across evaluation boundaries.

- L001 — Tang 2025 spinal neural stem-cell study
- L002 — Ma/Third Military Medical University embryonic neural stem-cell line
- L003 — Grassi/Piacentini/Cuccurazzu calcium-channel neurogenesis line
- L004 — Guangdong human epidermal stem-cell line
- L005 — rat MSC 50 Hz / 10 mT temporal study
- L006 — rat BMSC 15 Hz osteogenic/time-duration study
- L007 — human dermal fibroblast magnetotherapy study
- L008 — Supino human fibroblast/MCF-7 null study
- L009 — Nafziger human hematopoietic progenitor null study
- L010 — Reipert multipotential hematopoietic progenitor null study
- L011 — Wolf fibroblast/leukemia redox/DNA-damage study

Lineage assignment is conservative. Shared authorship alone does not force a shared lineage, but a clearly connected experimental program is grouped when leakage risk is plausible.

## Frozen five-fold lineage evaluation

Unique lineages are sorted by:

`SHA256("NBG-RB2-LINEAGE-ORDER-v0.1.0:" + lineage_id)`

and assigned round-robin to folds 0..4.

Frozen folds:

- Fold 0: L004, L002, L005
- Fold 1: L003, L006
- Fold 2: L009, L007
- Fold 3: L011, L008
- Fold 4: L010, L001

For outer test fold `k`:

- test = fold `k`
- validation = fold `(k + 1) mod 5`
- train = remaining three folds

This prevents any source lineage from being used simultaneously for training and held-out evaluation.

## Freeze digest

Corpus manifest digest:

`b0fbfa33e848fafaddaa73fbf1066d8c2a542ec57e415d57fbea8f4979d15993`

The digest is over the ordered newline-separated record digests in `corpus_manifest.json`.

## Missingness rule

Unknown is a valid value.

RB2 forbids:

- guessing an exposure duration from another paper;
- copying an apparatus parameter from a related source without direct evidence;
- converting "not reported" into zero;
- treating a range midpoint as a reported value;
- filling missing geometry/orientation from laboratory convention.

## Outcome firewall

The corpus records retain broad source-reported direction summaries for audit and corpus balance.

Those summaries are **labels, never features**.

RB3 must construct training rows from field/context variables only and may not ingest source identity, title, author, DOI, PMID, year, result prose, significance text, or direction summary as predictors.

## No privileged frequencies

7.83 Hz, 10.5 Hz and 14.1 Hz remain unprivileged.

The frozen corpus happens to contain frequencies supported by included primary studies, including 1, 5, 10, 15 and 50 Hz. Absence of a viral frequency from the corpus is not a negative experimental result about that frequency; it means the RB2 eligibility search did not freeze a qualifying primary source for it.

## Safety boundary

RB2 is literature/computation infrastructure.

It provides no human exposure schedule, treatment recommendation, cure claim, regeneration prescription or device instruction.

## Next rung

After RB2 merges green, RB3 may implement the frozen extraction table and the five preregistered arms:

- FREQ_ONLY
- MULTIPARAMETER
- SHUFFLED_BOUNDARY
- LABEL_PERMUTATION
- SYNTHETIC_WINDOW_POSITIVE

RB3 implementation must not change the RB2 source set, lineage folds, endpoint vocabulary or anti-leakage rules.

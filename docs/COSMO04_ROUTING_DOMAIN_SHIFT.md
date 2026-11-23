# COSMO-04 · Held-Out Routing Falsification and Cost Accounting

**Research status:** synthetic graph benchmark, **SIMULATED / authority NONE**. Executable Altermath protocol: [R32 COSMO-04](https://github.com/MichaelWave369/Altermath/blob/main/docs/cosmo04.md). Live dashboard follows a successful [Altermath Pages deploy](https://michaelwave369.github.io/Altermath/#cosmo04).

## Claim and predeclared alternative

**Claim under challenge:** "Nested Blob/Gear hierarchy improves practical routing performance."

**Primary null:** metadata hierarchy alone produces no improvement if a flat routing algorithm uses exactly the same indexed gateway graph and observations.

**Competing explanation:** an indexed overlay can sometimes reduce route-search work, but the benefit depends on graph topology, index preparation cost, and query volume. The flat encoding can represent the *same* overlay.

This track does not assert that the physical universe consists of software graphs. Universe-birth drawings motivated a metaphor, not scientific cosmological evidence.

## Specific model

16 nodes, four preassigned 4-node groups, positive integer weighted undirected edges. Each group has fixed path/chord structure; cross-group edges differ by **chain**, **ring**, **star**, or **mesh** topology. The deterministic graph generator and seeds are fixed.

- **Training:** chain/ring seeds 11,13, four graphs; 960 routes.
- **Validation:** star seeds 17,19, two graphs; 480 routes.
- **Holdout:** mesh seeds 23,29, two graphs; 480 routes.
- **Target:** minimum total edge weight for each ordered non-self source/destination pair.
- **Baseline:** raw flat Dijkstra on original graph.
- **Indexed-flat:** one reusable within-group all-pairs/gateway index, with exact query overlay.
- **Nested:** same exact gateway index and search as indexed-flat, with parent and portal metadata.
- **Independent oracle:** Floyd–Warshall on each original weighted graph.
- **Policy:** train two separate choices for same-group vs cross-group routes; validation picks cheapest among raw, indexed, and trained policy **without** seeing mesh holdout costs.

The result is held out by **synthetic graph family**, not by secret independent data. There is no general-purpose learning and no genuine external network traces in this rung.

## Accounting rules

Measured unit = one Dijkstra vertex scan, one directed adjacency relaxation check, or one overlay-edge candidate examination. Index preprocessing uses sixteen 4-node Dijkstra runs and is billed once per graph if the workload uses the index. The result is **not elapsed CPU time, actual RAM, or device network throughput**.

Store the serialized indexed-flat and nested JSON lengths separately; the nested encoding **does not have an identical storage budget** because it includes ancestry metadata. Never mislabel matching route-data access as equal memory allocations.

All 8 × 240 routes must match independent shortest-path results before performance is considered. Negative effects must remain visible.

## Result under exact fixture and unit definition

Validation:
- Raw: 79,194 work units.
- Indexed: 22,312 work units.
- The selector chooses indexed.

Holdout mesh:
- Raw: **80,520** work units, **480/480** correct.
- Indexed-flat: **97,576** units, **480/480** correct.
- Nested: **97,576** units, **480/480** correct.
- Relative index disadvantage: roughly **21.2%**.
- Indexed-flat/nested parity is mechanically expected because the same index and routing kernel are used.

This is a documented **negative result** for the selected policy on changed synthetic topology, not evidence that hierarchy is useless generally. Crucially, a positive comparison against an *unindexed* flat baseline alone would not prove that the nesting itself matters.

## Nonclaims / interpretation

The result neither proves nor disproves extra dimensions, cosmic bubbles, white holes, black-hole filaments, multiverse formation, AI consciousness, or a 3–6–9 fundamental physical law. Source labels and nested group IDs describe computer data structures only.

COSMO-01–03 remain frozen/unmodified. This protocol makes no production changes to routing permissions, PhiMemory9, PhiKernel or NBGPocketMesh.

## Next test gate

COSMO-05 should add an independently sourced workload, real timing/peak-RSS measurements with reproducible hardware specs, memory-budget matched indexes, graph drift, random graph generator families, policy robustness across repeated seeds, and truly sealed holdout data. Only then can we approach a general claim of practical computational gain.

# Licensing Policy

Nested Bubble/Gear contains both **software** and **research/content**. They use different licenses intentionally.

## 1. Software and executable code — MIT

Unless a file says otherwise, executable source code and software infrastructure in this repository are licensed under the **MIT License**.

This includes, for example:

- React/Vite application code;
- Python experiment harnesses;
- unit tests;
- CI/workflow configuration;
- build and utility scripts.

See the root [LICENSE](LICENSE).

SPDX identifier:

```text
MIT
```

## 2. Research and documentation content — CC BY 4.0

Unless a file, archived package, or external source says otherwise, original NBG research/content is licensed under the **Creative Commons Attribution 4.0 International License (CC BY 4.0)**.

This includes, for example:

- research prose and explanatory documentation in `docs/`;
- experiment specifications, result summaries, receipts, and non-code explanatory artifacts;
- original diagrams and figures created for NBG;
- original explanatory text and visual research content rendered by the public NBG site;
- original tabular/data compilations where copyright or database rights apply.

Canonical license:

https://creativecommons.org/licenses/by/4.0/

SPDX identifier:

```text
CC-BY-4.0
```

## 3. Attribution

A reasonable attribution for CC BY 4.0 material is:

> Michael Hughes, Nested Bubble/Gear (NBG), version/release or DOI when available, licensed CC BY 4.0.

When adapting CC BY 4.0 material, indicate that changes were made and retain available attribution/license notices.

## 4. Frozen experiment packages

Frozen packages preserve their byte-level research record.

- executable source and tests are treated as MIT-licensed software unless the package states otherwise;
- original protocol/specification/result prose and research-content artifacts are treated as CC BY 4.0 unless the package or archived record states otherwise;
- a package-specific or Zenodo-record-specific license notice governs that artifact if it differs from this repository-wide default.

A checksum identifies bytes; it does not replace the applicable license notice.

## 5. Third-party material

This policy does **not** relicense third-party material.

External quotations, figures, datasets, images, software dependencies, or other incorporated works remain subject to their own licenses, permissions, exceptions, or limitations.

## 6. Why the split exists

Creative Commons recommends software-specific licenses for software, while CC licenses can be used for documentation and other creative/research material.

Accordingly:

```text
CODE / SOFTWARE        -> MIT
RESEARCH / DOCUMENTS   -> CC BY 4.0
THIRD-PARTY MATERIAL   -> its own terms
```

This keeps the repository aligned with open-source software practice while matching the attribution-oriented licensing used for NBG research documents and archival releases.

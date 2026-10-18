# Portolan decisions

Status: **accepted direction**, recorded 2026-10. Items marked *proposed* still need the user's confirmation. Nothing in this repository implements these decisions yet: there are no schemas, validators, pins file, or pipelines.

This document covers packaging, validation, and distribution: **how** a Colouring delivery is shipped. **What** a building is and what the frontend may rely on is a separate question, handled in the [building contract](building-contract.md).

## Context

The goal is one canonical last data product that a pipeline from any country or region produces and the GeoLibre Colouring extension consumes. Writing our own manifest, catalog, checksum, licence, and style formats would duplicate work that [Portolan](https://www.portolan-sdi.org/) already specifies, validates, and tools. Portolan is an open specification and toolkit that publishes geospatial data as a static STAC catalog with GeoParquet, PMTiles, styles, thumbnails, `README.md`, and `AGENTS.md`.

Reference repositories (read only, not dependencies): [portolan-sdi](https://github.com/portolan-sdi) — `portolan-spec`, `portolan-cli`, `portolan-skills`.

## Decisions

### P1. A Colouring delivery is a Portolan catalog

`data/delivery/<catalog>/` is a Portolan catalog root: `catalog.json`, `README.md`, `AGENTS.md`, and one directory per collection. Each collection has `collection.json`, `README.md`, `AGENTS.md`, its GeoParquet data asset, its PMTiles, `styles/`, and a thumbnail.

Colouring defines a **profile on top of Portolan**, not a parallel format. Colouring-specific metadata goes into Colouring fields on the STAC objects, under a `colouring:` prefix. The exact fields are defined in the building contract. Colouring never redefines a field that Portolan or STAC already defines.

### P2. Conformance means passing the validators, not claiming conformance

A delivery is valid only if both checks pass on the actual files:

1. `portolan check --strict`, using Portolan's validator (`rashid`) at the pinned version.
2. A Colouring check for the rules Portolan does not know about. This check does not exist yet. Its scope is set by the building contract.

A statement in `AGENTS.md`, a manifest, or an agent's summary is not evidence of conformance.

### P3. Portolan versions are pinned

| Component | Pinned version | Observed in |
| --- | --- | --- |
| Portolan spec | `v0.2.0` (`https://schemas.portolan-sdi.org/portolan/v0.2.0/schema.json`) | `portolan-spec` tag |
| `portolan-cli` | `0.8.0` | PyPI release, `portolan-skills/pins.toml` |
| `rashid` | `0.3.0` | `portolan-skills/pins.toml` |

The Portolan spec and CLI are both pre-1.0, and breaking changes are expected. A pin is moved only deliberately, after the reference example has been rechecked.

*Proposed mechanism:* a `pins.toml` in this repository plus a locked CLI install, modelled on `portolan-skills/pins.toml` and its drift check. **No git submodule.** A submodule would add the 81 MB spec repository and submodule handling to every fork, yet would not pin the CLI, which is the component that actually runs. Published Portolan schemas are immutable, so pinning the schema URI already pins the spec.

### P4. Portolan is authoritative for PMTiles; there is no separate Colouring MVT profile

- PMTiles follow Portolan: a collection-level `rel: "pmtiles"` link of type `application/vnd.pmtiles`, a non-empty `pmtiles:layers`, and at least one style when PMTiles are present.
- GeoParquet is the data of record. PMTiles is a lossy visualisation derivative: features are simplified and dropped by zoom, a null value is an absent property, and integer and float encodings vary per value. One-to-one feature counts or exact numeric types are never expected from tiles.
- Colouring adds cross-checks only, for example that every property a theme style reads exists in the tiles. It does not add a second tile specification.
- Which columns go into tiles, and at which zooms, is pipeline configuration. `portolan-cli` exposes `pmtiles.include_cols`, `pmtiles.min_zoom`, `pmtiles.max_zoom`, `pmtiles.layer`, and `pmtiles.attribution` (read in the CLI source code, not yet tested).

### P5. Styles follow Portolan

Styles are MapLibre GL v8 files under `styles/`, are collection assets with role `style`, and each has a human-readable `title`. Exactly one carries `default`.

One available Colouring theme corresponds to one style, conventionally named `style-<theme_id>`. Legend semantics, availability, and coverage that a MapLibre style cannot express live in the Colouring metadata defined by the building contract.

### P6. Languages follow Portolan's multilingual catalog practice (*proposed*)

Translations are alternate metadata trees (`en/`, `de/`, …), linked with `alternate` links and the STAC Language extension, as described in `portolan-spec/specs/best-practices/multilingual-catalogs.md`. This would replace the separate `i18n/<lang>/colouring.json` bundles of the Hamburg releases. How plugin-only UI text and legend labels are translated remains a building-contract question.

### P7. Publishing is outside this repository's scope

The work of `colouring-contracts` ends at a validated local catalog. Uploading the catalog (`portolan push`, S3, a private cloud, or another host), registering it, and wiring hosting into the frontend are manual decisions by the user or the frontend side. No agent publishes without separate explicit authorisation.

### P8. Reuse Portolan tools; build only the Colouring domain layer

Conversion (including Hilbert ordering), PMTiles generation, thumbnails, READMEs, checks, and push come from `portolan-cli`. `portolan-skills` serve as the reference for agent workflows: bootstrap, enrich-metadata, thumbnails, and catalog-grader. Colouring adds only what Portolan cannot know:

- the building semantics
- the theme and capability metadata
- the Colouring check
- an agent workflow that maps raw data onto the contract and asks for approval

### P9. Fork model: country pipelines are free, the contract is not

Every country or region forks this repository and adapts its pipeline to its own data. The repository has two zones:

| Zone | Owner | Content |
| --- | --- | --- |
| Contract zone | upstream | Colouring profile, contract documents, pins, Colouring check, reference example. Not edited in a fork; changes go upstream as pull requests. |
| Country zone | fork | Source adapters, pipeline (for example Bruin), Docker setup, local codelists and crosswalks. Free to change. |

The Germany pipeline's stack (Bruin, PostGIS/3DCityDB, GDAL, tippecanoe) is a reference, not a requirement. A delivery records which contract and Portolan versions it was validated against.

## What Portolan does not decide

The following are deliberately left to the [building contract](building-contract.md):

- the canonical building attributes and their meanings
- how theme and attribute capabilities are declared
- how the frontend reacts to them
- legacy migration from the Hamburg release

## Consequences for the existing Hamburg release

The checks below were run on `hh-2026-07.18`, using the Parquet footer and a file listing only. `rashid` was not run.

| Requirement | Status |
| --- | --- |
| GeoParquet 1.1, ZSTD, bbox covering with statistics, ≤150k rows per row group | Met |
| Spatial ordering (buildings: 6 row groups, all consecutive pairs overlap, mean row-group bbox about 55 % of the extent) | Likely not met. Approximation, not the validator's exact rule |
| STAC catalog and collections, `README.md` and `AGENTS.md`, styles, thumbnail, `providers` | Missing |
| Checksums | SHA-256 hex present; multihash needed |
| Licence: ALKIS `DL-DE-BY-2.0` | Usable SPDX identifier |
| Licence: ISBE material typology ("no licence published") | Blocking: Portolan forbids `proprietary`, and `other` needs a licence link |

The existing release is not modified. Any Portolan-conformant Hamburg delivery is a new delivery.

The Hamburg formats `themes.v1.json`, `i18n/*/colouring.json`, `latest.json`, and `manifest_version: 2` are **legacy**. They are not versions of the new contract.

## Operational limits

On the reference workstation, Portolan CLI parallelism (`--workers`) and tippecanoe or GDAL threads stay at 4 or fewer, one heavy job at a time, consistent with the machine-safety rules in the user's global instructions.

> **SUPERSEDED. Do not follow this document.**
> It is kept only as history. It was replaced in 2026-10 by [building-contract.md](building-contract.md) (the normative contract) and [tier1-decisions.md](tier1-decisions.md) (the decision log). Where this document disagrees with them, they win.
> Agents: do not use this document as instructions, as a source of decisions, or as a list of open questions. Its capability idea is carried into the building contract; its tiers, attribute names and the per-country columns are obsolete.

# Frontend data contract: draft and open questions

Status: **draft for review. Not a standard, not implemented.** This document is meant to be reviewed by another agent or person. Section 9 lists every open question; nothing in it is decided.

Packaging, PMTiles, styles, versions, and publishing are settled separately in [portolan-decisions.md](portolan-decisions.md). This document only asks: **what is the canonical last data product that pipelines from anywhere in the world deliver to the Colouring frontend, and how does the frontend know what a particular delivery contains?**

## 1. Goal and constraints

- **One canonical product.** Any producer (any country, region, or source type) delivers the same kind of product, and one frontend codebase displays it without `if country === …` logic.
- **Sustainable.** Adding a country does not change the contract or the frontend.
- **Easy to develop and extend.** Adding an attribute or a theme is a data and metadata change first. Frontend code changes only when a genuinely new kind of visualisation is needed.
- **Honest about meaning.** The same name and type do not imply the same measurement. Missing data is never `0`, `""`, or an invented class.
- **Data of record versus view.** GeoParquet is the data of record; PMTiles is a lossy view (see Portolan decision P4).

## 2. The core idea: a broad vocabulary, declared capabilities, a capability-gated UI

The proposed model separates three things that the Hamburg release currently mixes.

```text
(1) Attribute registry      what the contract can describe (broad, borrowed from established models)
(2) Theme catalog           which map themes and UI components exist, and which attributes they need
(3) Delivery capabilities   what THIS delivery actually contains (declared and computed per delivery)
                                       │
                                       ▼
Frontend                    shows exactly what (3) enables; never assumes (1) or (2) is populated
```

- **Attribute registry.** A vocabulary that can be wider than any single dataset. Definitions are borrowed from established building models, so they are not invented per country: INSPIRE Buildings, CityGML 3.0, Overture Maps buildings, and Colouring Cities core fields. Most producers fill only a small part of it.
- **Theme catalog.** Each theme or UI component (a map theme, a filter, a card field, a 3D extrusion) names the registry attributes it requires.
- **Delivery capabilities.** Each delivery states which attributes are present, with which meaning (reference, unit, method, source), and with what coverage. The coverage is computed from the data by tooling, never written by hand.

The open behavioural question (§9, Q-UI-1) is what the frontend does with a theme whose attributes the delivery does not declare. Two plausible rules:

| Situation | Option A | Option B |
| --- | --- | --- |
| Attribute **not declared** by the delivery (the producer never had such data) | Theme/component **hidden** | Shown as inactive with an explanation |
| Attribute **declared but empty** for this region (`no-data`) | Shown **inactive with a reason** | Shown inactive with a reason |
| Declared, partially filled | Active, with coverage shown | Same |
| Declared, `restricted` (licence or access) | Inactive, reason given | Same |
| Load or network failure | UI error state, never shown as "no data" | Same |

Option A keeps the UI clean when the registry grows, for example after adding INSPIRE or CityGML attributes that few producers have. Option B makes gaps visible across regions. A mixed rule is also possible: core themes always visible, extended themes hidden unless declared.

## 3. Proposed layering of the contract

| Layer | Role | Where it lives (proposal) |
| --- | --- | --- |
| Semantic contract | Attribute names, meaning, unit, null semantics, codelists, reference systems | Single normative source in this repository (see Q-SRC-1) |
| Physical representation | GeoParquet column types; tile property rules | GeoParquet: derived from the semantic contract. PMTiles: Portolan (P4) plus Colouring cross-checks |
| Delivery metadata | Capabilities, themes, coverage, lineage | `colouring:` fields on Portolan `catalog.json` and `collection.json` |

## 4. Candidate canonical building attributes

These candidates are tiered by how universal they are. The Hamburg column shows what `hh-2026-07.18` contains, as verified by reading the release files. The analogue columns are recalled from the respective specifications and **must be verified against the official documents before any decision** (Q-REG-2).

### Tier A: identity (required in every delivery)

| Attribute | Type | Rule | Hamburg |
| --- | --- | --- | --- |
| `building_id` | string | Unique within the catalog; present on every tile feature | `building_id` (ALKIS `gml_id`) |
| `geometry` | Polygon / MultiPolygon | GeoParquet 1.1, spatially ordered | MultiPolygon, EPSG:25832 |

### Tier B: canonical core

These columns are always present in GeoParquet (typed `null` when unknown). They appear in tiles only when declared.

| Attribute | Type | Meaning | INSPIRE BU (verify) | CityGML 3.0 (verify) | Overture (verify) | Hamburg |
| --- | --- | --- | --- | --- | --- | --- |
| `footprint_m2` | number | Footprint area computed from the geometry in a metric CRS | — | — | — | `footprint_m2` |
| `height_m` | number | Height; **low and high reference declared** | `heightAboveGround` + `heightReference` | `height` with `lowReference`/`highReference` | `height` | `height_m` (LoD2; documented as lowest ground point → highest roof edge) |
| `storeys_above_ground` | integer | Number of storeys above ground | `numberOfFloorsAboveGround` | `storeysAboveGround` | `num_floors` | `storeys` (ALKIS above-ground storeys) |
| `construction_year` | integer | Year; **event declared** (start, completion, earliest recorded, …) | `dateOfConstruction` (beginning/end/anyPoint) | `yearOfConstruction` | — | `construction_year` (earliest ALKIS `baujahr`; value 1500 suspected placeholder) |
| `use_group` | enum | Small shared use classification | `currentUse` | `function` / `usage` | `class` / `subtype` | Not present; derivable from local `use_class` |
| `is_underground` | boolean | Structure below ground | — | — | `is_underground` | `is_underground` |

The proposed `use_group` values (12): `residential`, `mixed_residential`, `commercial`, `industrial`, `public`, `leisure`, `transport`, `utilities`, `agriculture_forestry`, `ancillary`, `other`, `unknown`. Hamburg's 11 local `use_class` values map one-to-one onto this list according to the pipeline's own catalogue labels. The local `use_class` would remain as local detail.

### Tier C: optional profiles and local columns

- **parcels.** On the building: `parcel_id`. As a separate collection: `parcel_id`, `area_m2`, `built_ratio`.
- **energy.** Values such as `final_energy_kwh_m2a` and `heating_need_kwh_m2a`, with a required declaration of whether they are measured or modelled, plus model, scenario, and reference-area method.
- **material.** For example the estimated main facade material. In Hamburg this is currently blocked by the ISBE licence issue.
- **Extended registry attributes** from INSPIRE, CityGML, or Overture (roof shape, eaves height, storeys below ground, condition, …). Not populated by most producers; gated in the UI by capabilities.
- **Local columns** (for example Hamburg's `gebaeudefunktion`, `nutzung_class`) are allowed when documented in `table:columns`. They must not reuse a canonical name with a different meaning.

### Meaning metadata lives once per collection, not per row (proposal)

```json
"colouring:attributes": {
  "height_m":          { "unit": "m", "low_reference": "lowestGroundPoint", "high_reference": "highestRoofEdge",
                         "value_nature": "modelled", "source": "lod2", "coverage": 0.984 },
  "construction_year": { "event": "earliest_recorded", "coverage": 0.427 },
  "use_group":         { "crosswalk_from": "use_class", "lossy": false, "coverage": 1.0 }
}
```

This example is illustrative. Using INSPIRE or CityGML reference codes for height is one option (Q-ATT-2).

## 5. Delivery capabilities and themes (proposal)

Each collection declares a role and its themes:

```json
"colouring:role": "buildings",
"colouring:themes": [
  { "id": "height", "requires": ["height_m"], "availability": "available",
    "coverage": { "share": 0.984, "denominator": "all buildings in collection" },
    "style": "style-height" },
  { "id": "energy_final", "requires": ["final_energy_kwh_m2a"], "availability": "no-data",
    "reason": { "code": "source-not-available" } }
]
```

- Availability is computed by tooling from the data and the theme's `requires`.
- Data states (`available`, `no-data`, `restricted`, …) are distinct from pipeline states and from UI loading/error states.
- Each available theme has a Portolan style (P5). Legend classes and labels come from either the style or the Colouring metadata (Q-THM-2).

## 6. How the frontend reads a delivery (proposal)

1. The input is a `catalog.json` URL, which replaces `themes.v1.json` and `latest.json`.
2. Find collections by `colouring:role` (`buildings` required, `parcels` optional), not by fixed IDs.
3. Read the PMTiles link and `pmtiles:layers` (Portolan).
4. Read `colouring:attributes` and `colouring:themes`, and build the theme chooser, card fields, and filters from them using the Q-UI-1 rule.
5. Apply the theme's style.
6. Language: the Portolan alternate-language trees (P6). Plugin-only UI strings remain in the plugin.
7. Reject or clearly explain an unsupported contract version.

**Frontend extensibility rule (proposal).** Components are generic by *kind*: categorical, numeric steps, boolean, year, card field formats. A new attribute or theme needs only registry, catalog, and delivery metadata. Only a new kind of visualisation needs plugin code, and that code must be keyed to a theme or attribute ID from the catalog.

## 7. Change rule: data first, then frontend (proposal)

When someone wants a new frontend feature:

1. Define the attribute's meaning, unit, references, and null semantics.
2. Add it to the attribute registry and the theme catalog, then bump the contract version.
3. Add a reference example and a Colouring-check rule.
4. Producers deliver it where they can; elsewhere it stays undeclared or `no-data`.
5. Only then implement the frontend side, and test it against a delivery that has the attribute and one that does not.

## 8. Input from an external review, evaluated

An external deep-research review of the earlier vision note was considered as input, not as rules. That review predates the Portolan decision.

| Review point | Evaluation |
| --- | --- |
| Put the normative core first; separate normative text from explanatory text | Adopted as structure. Sections 4–6 should become the normative part once decided |
| Name the single source of truth in one sentence | Adopted as question Q-SRC-1 |
| Three layers: semantic, physical, release | Adopted, modified: the physical tile profile and the release packaging are now Portolan's (P1, P4) |
| "MVT is a lossy delivery profile by design" | Adopted (P4) |
| Validate real artefacts, not declared metadata | Adopted (P2) |
| Avoid name collisions such as `themes.v0.json` versus `themes.v1.json` | Adopted. Proposed release-side names are `colouring:*` STAC fields, not a `themes` file; a contract-side catalog could be named `theme-catalog.v0.json` |
| Keep v0 ruthlessly small | Adopted as question Q-SCOPE-1 (Tier A + B, or smaller) |
| A second producer could be a second source type within the same country | Adopted as question Q-TEST-1 |
| Own manifest, themes, and i18n files in a release directory | Superseded by Portolan (P1, P5, P6) |
| JSON Schema `x-*` keywords for contract annotations | Open; depends on Q-SRC-1 |

## 9. Open questions for review

### Source of truth and scope

- **Q-SRC-1.** What is the single normative source? (a) A JSON Schema (2020-12) of the Colouring STAC extension, with everything else derived from it. (b) A registry file (YAML or JSON) from which the schema, documentation, and types are generated.
- **Q-SCOPE-1.** Is v0 Tier A + Tier B, or smaller (for example `building_id`, `geometry`, `height_m`, `construction_year`, `use_group`)?
- **Q-SCOPE-2.** What is the minimum set of files and metadata for a delivery to be accepted, beyond what Portolan already requires?

### Attributes

- **Q-ATT-1.** Is `use_group` with the 12 proposed values the right shared classification, with `use_class` kept as the local code? Or should an existing classification be adopted (INSPIRE `CurrentUseValue`, Overture `class`, the Colouring core land-use groups)?
- **Q-ATT-2.** Height: one `height_m` with declared low/high references (possibly INSPIRE or CityGML reference codes), or names that encode the reference (`height_apex_m` / `height_eaves_m`, as Colouring core does)?
- **Q-ATT-3.** Rename Hamburg `storeys` to `storeys_above_ground`? It is not a tile attribute today, so the change is cheap.
- **Q-ATT-4.** Should the core include a per-row `region_code`, for deliveries split into states or provinces? Or is region a catalog/collection property only?
- **Q-ATT-5.** Should the core include `building_kind` (building / building part / structure) and per-row provenance (`source_id`, `source_date`)?
- **Q-ATT-6.** Construction year: which event vocabulary? What is the sentinel policy (for example Hamburg's 1500)?
- **Q-ATT-7.** When is a crosswalk "lossy", and how is that shown to users?

### Registry and extensibility

- **Q-REG-1.** Which external models feed the attribute registry (INSPIRE Buildings, CityGML 3.0, Overture, Colouring core), and how is each borrowed definition cited?
- **Q-REG-2.** Who verifies the analogue columns in §4 against the official specifications?
- **Q-REG-3.** Namespace for Colouring metadata: is `colouring:` acceptable as a STAC extension prefix? Should it become a published extension schema later?
- **Q-REG-4.** How are local or country extensions named and kept from colliding with future canonical names?

### Themes and UI behaviour

- **Q-UI-1.** Undeclared attributes: hide (option A), show inactive (option B), or a mixed rule (core visible, extended hidden)?
- **Q-UI-2.** Which availability states: `available`, `no-data`, `restricted`, `not-applicable`? Does `unavailable` from the Hamburg release map to `no-data`?
- **Q-UI-3.** How is the coverage denominator expressed and shown?
- **Q-UI-4.** When a selected theme is not available after a region switch: keep the selection with an explanation and a neutral map (current proposal), or something else?
- **Q-UI-5.** 3D extrusion when `height_m` is missing: today it renders as 0 m. What should it be instead?
- **Q-THM-1.** Should themes have fixed shared colour scales for cross-region comparison, separate from local themes? How is "not comparable" signalled?
- **Q-THM-2.** Where do legend classes and labels live: in the MapLibre style, in `colouring:themes`, or generated from one into the other?

### Versioning, migration, testing

- **Q-VER-1.** How do contract versions relate to the Portolan pin? Can a contract version require a minimum Portolan version?
- **Q-MIG-1.** Should the plugin keep a legacy reader for `themes.v1.json` releases during migration, or switch hard to catalogs?
- **Q-TEST-1.** Which second producer tests v0: a different country (for example Austria; no data is available locally yet), or a second source type within Germany?
- **Q-TEST-2.** Which reference example ships in this repository: a Hamburg-mini catalog, a synthetic one, or both? Licensing has to be checked for any real data.

### Governance

- **Q-GOV-1.** Who approves changes to the registry and theme catalog, and how do forks propose them upstream?

## 10. Notes for the reviewing agent

- Read [portolan-decisions.md](portolan-decisions.md) first. Portolan matters there are decided; do not reopen them here unless a question depends on them.
- Verify the §4 analogue columns against the official INSPIRE Buildings, CityGML 3.0, and Overture building schemas, and cite them.
- Facts about the Hamburg release come from inspecting `hh-2026-07.18` read-only (GeoParquet footer and column statistics, PMTiles metadata, a few decoded tiles). They describe one release, not a universal schema.
- Do not implement schemas, validators, pipelines, or frontend changes. Answer or refine the questions, and mark every proposed answer as a proposal.

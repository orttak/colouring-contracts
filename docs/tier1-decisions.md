# Tier 1 decisions

Status: **accepted decisions**, recorded 2026-10. Items marked *proposed* still need the user's confirmation. Nothing here is implemented: there is no registry file, schema, Colouring check, or frontend change yet.

This file records **what** was decided for Tier 1, **why**, and **on which evidence**. The normative text that producers and the frontend follow is the [building contract](building-contract.md). Packaging decisions stay in [portolan-decisions.md](portolan-decisions.md) and are not reopened here.

These decisions replace the following documents, which are kept as history only:

- `superseded-frontend-data-contract-draft.md`
- `superseded-tier1-skeleton-research.md`
- `superseded-external-contract-draft-v0.1.0.md`

They also replace the Tier 1 naming rule ("Tier 1 names follow colouring-core", A6) in `geolibre/docs/colouring-tier-kararlari.md`.

## Decisions

### Foundations

| # | Decision | Reason |
| --- | --- | --- |
| T1 | Tier 1 uses **its own attribute names**. Meanings are anchored on **INSPIRE Buildings** (primary) and **CityGML 3.0** (secondary). colouring-core field names are migration aliases only. | colouring-core names carry UK-specific or unclear meanings: `date_year` is the construction *start*, the reference of `size_height_apex` is undefined, and `current_landuse_order` derives from the British NLUD. A name that is reused with a different meaning breaks comparison across countries. |
| T2 | CityGML references use **3.0 terms** (`dateOfConstruction`, `dateOfDemolition`, `conditionOfConstruction`), not 2.0 terms (`yearOfConstruction`, `yearOfDemolition`). | CityGML 3.0 is the anchor. |
| T3 | Energy is anchored on the **CityGML Energy ADE**. It is still based on CityGML 2.0 and is expected to move to 3.0. Crosswalks pin the exact ADE version they use. | The ADE is still being developed and may change. |
| T4 | The contract is **international**. It is derived from standards and global building concepts, never from one country's data model or codes. Mapping country data onto the contract is the fork's job (P9). | One contract for every country. |

### Structure

| # | Decision | Reason |
| --- | --- | --- |
| T5 | There are **eight category slots**: Identity, Land Use, Size, Age, Typology, Construction, Planning, Energy. There are two optional profiles for later: Street Context and Resilience. Team and Community are not part of the data delivery. | Several of the twelve CCRP categories are unnecessary for a pipeline delivery. |
| T6 | **Required attributes:** `building_id`, `geometry` (with a declared `geometry_reference`), `record_kind`. | These are the minimum needed to identify a record and show it on a map. |
| T7 | **Levels.** *Required*: in every delivery. *Core*: worldwide meaning; used for map themes, filters and the card. *Extended*: optional and international; shown as card detail by default. *Energy*: optional energy attributes. *Tier 2*: country- or source-specific attributes only, with a prefix (`de_`, `osm_`, …). | An international INSPIRE list such as `BuildingNatureValue` is *extended*, not Tier 2. |
| T8 | **Extended attributes may later be collected from users.** A future contribution UI fills the same attribute definitions and declares `method = crowdsourced`. The contribution service itself is outside the data delivery. | Many detail attributes (roof shape, materials, building nature) are rarely available from official sources. |
| T9 | **No data, no column.** When a delivery has no value at all for an attribute, the column is omitted and the collection metadata declares the attribute as not provided. A column is never all-null. | User decision. Capability gating in the frontend works from the metadata. |

### Meaning and measurement

| # | Decision | Reason or evidence |
| --- | --- | --- |
| T10 | **Height has a fixed meaning.** `height_m` runs from the lowest ground point to the highest roof edge, without chimneys or antennas. A value measured to any other reference is never placed into `height_m`. *Revised 2026-10:* A value measured to `highestPoint` goes into the international **extended** attribute `height_highest_point_m`, with the same lower reference. It is a card detail and never replaces `height_m` in the height theme or in extrusion. General-roof or unspecified heights are converted with a declared crosswalk or withheld. There is still no highest-point height in core. | In INSPIRE `ElevationReferenceValue`, `highestPoint` includes "installations, such as chimneys and antennas". One property must have one meaning. `highestPoint` is an international reference, so it is not Tier 2. A dedicated attribute keeps such source heights instead of losing them (external review, 2026-10). |
| T11 | **Construction years.** `construction_year` is the year construction was **completed** (CityGML 3.0 `dateOfConstruction`; the end of an INSPIRE `DateOfEvent`). `construction_start_year` is a separate attribute. | Core's `date_year` is the start year; CityGML's date is the completion date. They must never be copied into each other. |
| T12 | **Storeys.** `storeys_above_ground` counts all storeys above ground, **including attic storeys**. Storeys below ground are a separate attribute. | User decision. |
| T13 | **Lifecycle.** *Revised 2026-10:* each buildings collection declares `colouring:lifecycle_policy`: `current_only` (no `demolished` records) or `includes_historic` (demolished records allowed; the retained scope is documented). A re-delivered building keeps its `building_id`. Absence from a later delivery is never read as demolition. By default the frontend hides `demolished` and `projected` records on the map, in filters and in statistics; the user can show them. The check rejects `demolished` records under `current_only`. *Replaces:* "a demolished building always stays in later deliveries". | INSPIRE `ConditionOfConstructionValue` has six values and is not extensible. Requiring every demolished building to stay forever mixed a current inventory with a historic one (external review, 2026-10). |
| T14 | **Which records belong in the delivery.** Buildings in the INSPIRE sense. Buildings that are entirely underground (for example underground car parks) are allowed and are flagged with `is_underground` (extended). Non-building structures that sources deliver as buildings (canopies, towers, silos, …) are allowed and are labelled with `building_nature` (extended, card detail). `building_nature` is separate from the use list and does not add classes to it. | INSPIRE models these structures as buildings with a `buildingNature` value (`BuildingNatureValue`, extensibility open). |

### Building use

| # | Decision | Reason or evidence |
| --- | --- | --- |
| T15 | **Two use attributes.** `current_use` holds the five INSPIRE top-level values. `current_use_detail` holds eleven Colouring classes, each one a narrower value under an INSPIRE parent. A source that knows only the INSPIRE top level fills `current_use` only. *Revised 2026-10:* the parent is always one of the five top-level values. `public_services`, `education` and `health` have the parent `commerceAndServices`, not `publicServices`. `publicServices` (and `office`, `trade`, …) are delivered only in `current_use_inspire_code`, which must lie under `current_use`. A narrower code is never derived from the Colouring class alone. | INSPIRE `CurrentUseValue` allows narrower values ("narrower" extensibility). The earlier table named `publicServices` as a parent. That contradicted the Registry evidence below, and every record of those three classes would have failed the parent-consistency rule (external review, 2026-10). |
| T16 | **The eleven classes:** `residential`, `agriculture_forestry`, `industrial`, `commercial`, `hospitality`, `leisure`, `public_services`, `education`, `health`, `ancillary`, `other`. There is no `mixed` class and no `unknown` class; an unknown use is `null`. | Merge of two earlier drafts, approved by the user. |
| T17 | **Mixed use.** The dominant use is the use with the largest floor-area share. `use_is_mixed = true` when any other use has a share of 20 % or more. | INSPIRE `CurrentUse.percentage`: "generally the percentage of floor area dedicated to this given use". The 20 % threshold is a user decision. |
| T18 | **Building use is not a POI.** The use class describes the whole building or its main use. A business inside a building used mainly for something else (for example a café in an apartment block) is a POI. It does not change the building's class. *Reworded 2026-10, same meaning:* the presence of a POI alone never determines the building's use. The use requires building-level evidence. A detached restaurant building is `hospitality` because of what the building is, not because of a POI inside it. *Proposed:* POIs go into a separate optional collection later, linked by `building_id`. | Eurostat CC excludes "restaurants in apartment buildings", "shops in buildings mainly used for other purposes", and "carparks in buildings mainly used for other purposes" from the respective classes. A separate `food_and_drink` class was rejected as not building-focused. |
| T19 | **Placement of specific buildings.** Hotels, other short-stay lodging, and detached restaurant or bar buildings → `hospitality`. Shopping centres, department stores and petrol stations → `commercial`. Warehouses, silos and reservoirs → `industrial`. Energy and water utility buildings → `industrial`. Stations and terminals → `public_services`. Detached car parks → `commercial`; a garage serving a main building → `ancillary`. Places of worship → `public_services`. Public administration and courts → `public_services`. Residences for communities (student homes, retirement homes without medical care) → `residential`. Care homes with nursing or medical care → `health`. | Eurostat CC classes 1211–1212, 1230, 1252, 1241–1242, 1264 and 1130. **Deliberate deviations from CC:** CC puts government offices and courts under offices (1220) and places of worship under "other non-residential" (1272). INSPIRE supports the first deviation: its `publicServices` description prefers public service over office for a building such as a city hall. |

### Documents

| # | Decision |
| --- | --- |
| T20 | The normative text is [building-contract.md](building-contract.md); this file is the decision log. *Proposed:* a machine-readable registry file (YAML) later becomes the single source, from which the Colouring check, frontend types and documentation are generated. *Decided 2026-10:* the registry is **authoritative for the Tier 1 UI metadata**: `category`, `kind`, `labels`, `filter`, `legend` (contract §8.1). A delivery never declares or overrides these for a Tier 1 column. The registry is not created yet (O5). |
| T21 | The planning and energy attributes come from the external draft and have not been reviewed one by one. They stay in the contract as **draft** attributes. |

### Added after the external review (2026-10)

| # | Decision | Reason |
| --- | --- | --- |
| T22 | **Construction attributes are building-level.** `structural_material`, `facade_material`, `roof_covering_material` and `structural_system` hold the dominant value for the building as a whole. Per-surface materials (CityGML `WallSurface`, `RoofSurface`) are outside Tier 1. The code lists stay open (O2). **Publishing gate:** no delivery may contain a Tier 1 column whose code list is still to be defined. Until it is, such data is delivered as a Tier 2 column. How a value was obtained is expressed with the existing metadata: `method = inferred` for typology-derived values; `crosswalk_id` and `crosswalk_lossy` for reduced source classifications. | A value is only comparable when its scope and code list are fixed. The existing metadata already covers observed versus inferred and lossy reduction, so no new per-row columns are needed. The gate makes contract §2 (codes from a declared list) explicit; it applies equally to `roof_shape` and `building_attachment_type`. |
| T23 | **Global UI vocabulary for Tier 2.** Every Tier 2 attribute declares `category`, `kind`, `labels` (with `en`, plus `code_labels` for coded values), `filter` and `legend`, taken from one closed vocabulary with allowed `kind` / `filter` / `legend` combinations (contract §8.1). The vocabulary changes only with a contract version. Missing-value handling is global and cannot be declared per attribute. | The frontend contains no country-specific code. It can render a new country's attribute only if the attribute describes itself in terms the frontend already knows. Fixing Tier 1 in the registry (T20) keeps Tier 1 comparable across countries. |
| T24 | **Theme `minzoom`.** Every theme in `colouring:themes` declares `minzoom`: the lowest zoom at which it renders building-level features. It is never below the buildings tile layer's minimum zoom. Tiles carry the theme's properties from `minzoom` upward. Below `minzoom` the theme is inactive and the frontend asks the user to zoom in. Small-scale aggregation is **not** required (O8). | Requiring building-level properties at every zoom is not realistic for large areas. Aggregation would need its own semantic rules, for example how to summarise years or uses. |

## Evidence checked (2026-10)

- **INSPIRE Registry** JSON (`https://inspire.ec.europa.eu/codelist/<Name>/<Name>.en.json`):
  - `CurrentUseValue`: status Valid, extensibility *narrower*, 13 values. Top level: `residential`, `agriculture`, `industrial`, `commerceAndServices`, `ancillary`. `office`, `trade` and `publicServices` are children of `commerceAndServices`. `individualResidence`, `collectiveResidence` and `residenceForCommunities` are children of `residential`. `twoDwellings` and `moreThanTwoDwelling` (singular) are children of `collectiveResidence`. Rechecked 2026-10: the `publicServices` examples include schools, hospitals, government buildings, prisons, rescue stations and transport stations. A building that is both office and public service, such as a city hall, is preferably `publicServices`. The `trade` examples include shops, supermarkets, hotels and restaurants.
  - `ElevationReferenceValue`: extensibility *none*. **The registry has defective identifiers.** `lowestgroundPoint` resolves (lower-case `g`), `lowestGroundPoint` returns 404, and the list also contains the corrupt identifiers `loweseu-technicalroundPoint` and `higheseu-technicalroundPoint`. These are marked Invalid, with successors `lowestgroundPoint` and `highestgroundPoint`. The contract cites the URIs that resolve. `highestPoint` and `highestRoofEdge` are registered with these spellings (rechecked 2026-10).
  - `ConditionOfConstructionValue`: six values, extensibility *none*.
  - `HeightStatusValue`: `measured`, `estimated`.
  - `BuildingNatureValue`: extensibility *open*. It includes `canopy`, `tower`, `dam`, `silo`, `storageTank`, `windTurbine`, `church`, `mosque`, `synagogue`, `temple`, among others.
  - `RoofTypeValue`: **not in the Registry** (404). It is only an informative list of the extended INSPIRE schema, so the Colouring roof shape list must be defined by the contract itself.
- **INSPIRE Buildings Technical Guidelines** (D2.8.III.2): `CurrentUseValue` is "partly based on and adapted from the Eurostat classification of types of constructions (for the classification of residential buildings)". `CurrentUse.percentage` is "generally the percentage of floor area". The room-level `RoomNatureValue` (Annex C, open list) separates `catering`, `recreation`, `trade`, `store` and `habitation`.
- **Eurostat Classification of Types of Constructions (CC)**: read from the English explanatory notes of the Hungarian statistics office (ÉJ, stated by KSH to be identical to CC) and checked against the Slovak version. The original Eurostat handbook was not found online.
  - <https://www.ksh.hu/docs/osztalyozasok/epitmenyjegyzek/ej_tartalom_eng.pdf>
  - <https://static.slov-lex.sk/static/SK/ZZ/2000/128/20000501.html>

## Open items

| # | Item |
| --- | --- |
| O1 | Which core attributes become map themes, and a shared cross-country colour palette for them. *Proposed:* use, height, construction year, storeys, construction condition. Default `minzoom` values per theme are also open (T24 only requires that each theme declares one). |
| O2 | Code lists for extended attributes: roof shape, structural material, facade material, roof covering, attachment type, structural system. They may wait until the contribution UI is designed. **However**, under T22 a code list must be defined before any delivery uses that attribute under its Tier 1 name. If the first real delivery wants one of them (for example a facade material from a typology-based source), that code list comes first. Research input, not a decision: [tabula-episcope-research.md](tabula-episcope-research.md). It finds that TABULA has no material code list and no facade or roof covering material, and it lists open questions Q1–Q7. |
| O3 | A one-by-one review of the planning and energy attributes. |
| O4 | The POI collection: its source, attributes, and how it links to buildings. |
| O5 | The registry file and the Colouring check (implementation; needs separate approval). The registry also holds the Tier 1 UI metadata (T20). How the frontend obtains the registry for a contract version (bundled or fetched from a URI) is open. |
| O6 | The Colouring STAC extension schema URI and its publication. |
| O7 | Governance: who approves changes to the contract, and how forks propose them. |
| O8 | Optional small-scale representations below a theme's `minzoom` (aggregated grids or district summaries): whether to offer them, and with which aggregation semantics per attribute kind. |
| O9 | Whether a Tier 2 attribute may form its own map theme in `colouring:themes`, or may only appear as a filter and card detail. |

## Revision 2026-10 (external review)

An external review of contract 0.1.0 (draft) led to seven approved corrections. The contract version stays **0.1.0 (draft)** because nothing has been published or implemented.

| Change | Contract sections | Decisions |
| --- | --- | --- |
| INSPIRE `publicServices` hierarchy fixed; use consistency rules extended | §5.2, §6.3, §10 | T15, T19 (evidence) |
| `height_highest_point_m` added (extended) | §5.3, §7.1, §9.3, §10 | T10 |
| Construction attributes are building-level; code-list publishing gate | §2, §5.5, §5.6, §10 | T22, O2 |
| POI wording clarified, same semantics | §3.5 | T18 |
| Registry authoritative for Tier 1 UI metadata; Tier 2 UI vocabulary | §2, §8, §8.1, §9.1, §9.3, §10 | T20, T23, O5, O9 |
| `colouring:lifecycle_policy` | §3.4, §6.4, §8, §9.3, §10 | T13 |
| Theme `minzoom`; aggregation not required | §8, §9.3, §9.4, §10 | T24, O1, O8 |

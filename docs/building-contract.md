# Colouring building contract

Contract version: **0.1.0 (draft)**. Status: **normative draft**, 2026-10. Not published, not implemented, not validated. There is no registry file, schema, or Colouring check yet.

This document defines the canonical building data that a delivery from any country or region provides to the Colouring frontend. It also defines how a delivery declares what it contains, and how the frontend reacts to that declaration.

- Packaging, PMTiles, styles, pins and publishing are governed by [portolan-decisions.md](portolan-decisions.md). This document does not redefine them.
- The reasons and evidence behind each rule are in [tier1-decisions.md](tier1-decisions.md) (`T…` numbers below).

The key words **MUST**, **MUST NOT**, **SHOULD** and **MAY** are normative.

## 1. Scope and anchors

- **Semantic anchors (T1–T3).**
  - INSPIRE Buildings (D2.8.III.2) is the primary anchor.
  - CityGML 3.0 is the secondary anchor.
  - The CityGML Energy ADE is the anchor for energy; it is currently based on CityGML 2.0, and its exact version is pinned in each crosswalk.
  - Eurostat's *Classification of Types of Constructions* (CC) guides the placement of buildings into use classes.

  Colouring attribute names are Colouring names. They are **not** official INSPIRE or CityGML property names, and no endorsement by CCRP, OGC or INSPIRE is claimed.
- **International (T4).** Every definition here is independent of any country. Mapping country data onto it is done in the fork's country zone (P9).
- **Out of scope:**
  - packaging and publishing (Portolan)
  - country ETL
  - user contribution services
  - POIs (see §3.5)
  - Team and Community data

## 2. General rules

| Topic | Rule |
| --- | --- |
| One meaning | An attribute has the same meaning in every delivery: the same unit, the same event, the same measurement reference, the same classification. A matching name and type is not enough. |
| Null | `null` means *unknown for this record*. `0`, `""`, negative sentinels, `9999`, `unknown` or placeholder years MUST NOT encode a missing value. `0` is a real zero. |
| Booleans | `true` = confirmed yes, `false` = confirmed no, `null` = unknown. `false` MAY only be written when the source demonstrably covers the case completely (for example a complete heritage register or full hazard coverage). |
| Codes | Categorical values are short, stable, lower-case codes from a code list declared in §6. Display labels and translations live in metadata (§8.1), not in the data. `other` means *a known value outside the list*, never *unknown*. An attribute whose code list is still *to be defined* MUST NOT be delivered under its Tier 1 name. Until the code list is part of a contract version, such data MAY only be delivered as a Tier 2 column (T22). |
| No data, no column (T9) | If a delivery has no non-null value at all for an attribute, the column MUST be omitted, and the collection metadata declares the attribute as `not_provided`. A delivered column MUST contain at least one non-null value. |
| Method | Every delivered attribute declares one `method`: `measured`, `administrative_record`, `inferred`, `modelled`, `crowdsourced`, or `derived_geometry`. Measured and modelled values MUST NOT be mixed in one column. If the method differs per row, the producer either adds a declared per-row field or splits the data into homogeneous collections. |
| Provenance | Each delivered attribute declares its source (linked to the STAC providers and assets), source date, coverage, and, where a crosswalk was used, the crosswalk id and whether it is lossy. |
| Tier 2 | Country- or source-specific columns use a prefix (`de_`, `gb_`, `osm_`, `overture_`, …) and are declared with the same metadata. A Tier 2 column MUST NOT reuse or shadow a Tier 1 name. |

## 3. Records in scope

### 3.1 What a record is

A record represents a **building** in the INSPIRE sense ("an enclosed construction above and/or underground", D2.8.III.2) or a **building part**.

- `record_kind` states which of the two a record is.
- Building parts keep `parent_building_id`. Values that belong to parts MUST NOT be aggregated to the building arbitrarily.

### 3.2 Identity

- `building_id` is unique within its collection.
- It SHOULD be stable across deliveries when the source allows it. The producer documents the namespace and how ids are generated, split and merged.
- An id is globally unique only together with its catalog.

### 3.3 Underground buildings and non-building structures (T14)

- **Underground buildings.** A building that is entirely underground (for example an underground car park) MAY be delivered. It is flagged with `is_underground = true`.
- **Non-building structures.** Sources sometimes deliver such structures as buildings, for example canopies, towers, silos, storage tanks or wind turbines. These MAY be delivered. They SHOULD carry `building_nature` (§6.5), so that the frontend can show them as such and exclude them from building statistics.

### 3.4 Lifecycle (T13)

Each buildings collection declares `colouring:lifecycle_policy` (§8). The policy states whether the delivery is a current inventory or also keeps buildings that no longer exist.

| Policy | Meaning |
| --- | --- |
| `current_only` | A current inventory: buildings that exist at the source date, plus projected buildings and buildings under construction. No record has `construction_condition = demolished`. |
| `includes_historic` | The delivery also keeps buildings that no longer exist. Such records have `construction_condition = demolished` and SHOULD carry `demolition_year`. The producer documents which historic records are kept, for example all demolitions recorded since a given year. |

- A building that is delivered again keeps its `building_id` (§3.2), including when a later delivery marks it as demolished.
- A building that is missing from a later delivery is **not** evidence of demolition. Neither the producer nor the frontend infers `demolished` from absence.
- Planned buildings and buildings under construction use `projected` and `underConstruction` under either policy.
- **Default frontend filtering.** By default the map, the filters and the statistics show the existing building stock. Records with `construction_condition` `demolished` or `projected` are hidden. All other values, and `null`, are shown. The user can show hidden records through the condition filter. Statistics state which conditions they include.

### 3.5 Building use versus POI (T18)

- The use attributes describe the **whole building or its main use**.
- A **point of interest (POI)** is a business or facility located in a building, for example a café or shop on the ground floor of an apartment block, or a restaurant in a shopping centre.
- **The presence of a POI alone never determines `current_use` or `current_use_detail`.** The use is assigned from building-level evidence: a statement about the building as a whole, such as a register or cadastral use, a building-level source classification, or floor-area shares (§7.5). A POI record is not building-level evidence by itself.
- Example: a detached restaurant building is `hospitality` because the building as a whole is used as a restaurant (§6.3), not because a restaurant POI lies inside it. A restaurant on the ground floor of an apartment block does not change the block's class.
- A POI contributes to `use_is_mixed` only through its floor-area share (§7.5).
- *Proposed:* POIs are delivered later as a separate optional collection, linked by `building_id` (O4).

## 4. Categories and levels

### 4.1 Categories (T5)

There are eight category slots. The frontend always shows them in this order:

1. Identity
2. Land Use
3. Size
4. Age
5. Typology
6. Construction
7. Planning
8. Energy

Two optional profiles come later and are hidden when absent: **Street Context** and **Resilience**. A category is a UI grouping, not a dataset that must be filled.

### 4.2 Levels (T7)

| Level | Code | Meaning |
| --- | --- | --- |
| Required | R | Present and non-null in every delivery |
| Core | C | Worldwide meaning. Feeds map themes, filters and the card. Present only if the delivery has data (T9) |
| Extended | X | Optional international attribute. Shown as card detail by default. May later be filled by user contributions (`method = crowdsourced`) |
| Energy | E | Optional energy attribute (draft, §5.8) |
| Tier 2 | — | Country- or source-specific, prefixed (§2) |

## 5. Attribute dictionary

Types are Arrow types in GeoParquet. The "Reference" column states semantic alignment, not name identity. Attributes marked *draft* have not been reviewed individually (T21).

### 5.1 Identity

| Column | Type | Level | Definition | Reference |
| --- | --- | --- | --- | --- |
| `building_id` | utf8 | R | Stable identifier of the building or building part within the producer's namespace | INSPIRE `inspireId`; CityGML `gml:id` |
| `geometry` | geometry | R | 2D Polygon or MultiPolygon outline. The collection declares `geometry_reference` (§6.7) | INSPIRE `geometry2D` |
| `record_kind` | utf8 | R | `building` or `building_part` (§6.1) | INSPIRE / CityGML Building, BuildingPart |
| `parent_building_id` | utf8 | X | Building that a building part belongs to | CityGML BuildingPart |
| `source_feature_id` | utf8 | X | Identifier of the object in the source, with its namespace declared | INSPIRE `externalReference` |
| `name` | utf8 | X | Public name of the building | CityGML `name` |
| `is_underground` | bool | X | The building lies entirely below ground | — |

### 5.2 Land Use

| Column | Type | Level | Definition | Reference |
| --- | --- | --- | --- | --- |
| `current_use` | utf8 | C | Dominant actual use, INSPIRE top level (§6.2) | INSPIRE `currentUse` |
| `current_use_detail` | utf8 | C | Dominant actual use, Colouring class (§6.3) | INSPIRE `currentUse` (narrower values); Eurostat CC |
| `use_is_mixed` | bool | C | Another use has a floor-area share of 20 % or more (§7.5) | INSPIRE `CurrentUse.percentage` |
| `current_use_inspire_code` | utf8 | X | The most specific INSPIRE `CurrentUseValue` code known, for example `individualResidence` or `publicServices` (§6.3) | INSPIRE `currentUse` |
| `intended_use` | utf8 | X | Officially intended function, using the §6.3 codes. This is not the actual use | CityGML `function` |
| `residential_floor_share_pct` | float64, % | X | Share of floor area used for dwelling | INSPIRE `CurrentUse.percentage` |

### 5.3 Size

| Column | Type | Level | Definition | Reference |
| --- | --- | --- | --- | --- |
| `footprint_area_m2` | float64, m² | C | Area of the ground footprint, computed in a metric CRS. Only delivered when `geometry_reference = ground_footprint` | Derived from the geometry |
| `height_m` | float64, m | C | Lowest ground point to highest roof edge (§7.1) | INSPIRE `HeightAboveGround`; CityGML `Height` |
| `storeys_above_ground` | int32 | C | Storeys above ground, including attic storeys (§7.3) | INSPIRE `numberOfFloorsAboveGround`; CityGML `storeysAboveGround` |
| `storeys_below_ground` | int32 | X | Storeys below ground. `0` = confirmed none | INSPIRE `numberOfFloorsBelowGround`; CityGML `storeysBelowGround` |
| `height_highest_point_m` | float64, m | X | Lowest ground point to the highest point of the building, **including** installations such as chimneys and antennas (§7.1). Card detail; never replaces `height_m` | INSPIRE `HeightAboveGround` with `highestPoint` |
| `height_eaves_m` | float64, m | X | Lowest ground point to the eaves; the eaves reference is declared (§7.1) | INSPIRE `generalEave` / `lowestEave` / `highestEave` |
| `floor_area_m2` | float64, m² | X | Floor area under a declared measurement convention (§7.4) | INSPIRE `officialArea` (CLGE references) |
| `gross_building_volume_m3` | float64, m³ | X | Gross enclosed volume under a declared method | Derived from CityGML solids |
| `geometry_lod` | utf8 | X | Level of detail of the source 3D model. Not a quality score | CityGML LoD |

### 5.4 Age

| Column | Type | Level | Definition | Reference |
| --- | --- | --- | --- | --- |
| `construction_year` | int32 | C | Year construction was **completed** | CityGML 3.0 `dateOfConstruction`; INSPIRE `dateOfConstruction` end |
| `construction_start_year` | int32 | C | Year construction began | INSPIRE `dateOfConstruction` beginning |
| `construction_condition` | utf8 | C | Lifecycle state (§6.4) | INSPIRE / CityGML 3.0 `conditionOfConstruction` |
| `construction_year_earliest` | int32 | X | Earliest plausible completion year when the exact year is unknown | INSPIRE `DateOfEvent` |
| `construction_year_latest` | int32 | X | Latest plausible completion year when the exact year is unknown | INSPIRE `DateOfEvent` |
| `last_major_renovation_year` | int32 | X | Year of the last major renovation | INSPIRE `dateOfRenovation` |
| `demolition_year` | int32 | X | Year of demolition | CityGML 3.0 `dateOfDemolition`; INSPIRE `dateOfDemolition` |

### 5.5 Typology

| Column | Type | Level | Definition | Reference |
| --- | --- | --- | --- | --- |
| `building_nature` | utf8 | X | Nature of a noticeable or non-building structure (§6.5) | INSPIRE `buildingNature` |
| `roof_shape` | utf8 | X | Dominant roof shape. **Code list to be defined** (O2); not deliverable under this name until then (§2) | CityGML `roofType`; INSPIRE `roofType` (informative only) |
| `building_attachment_type` | utf8 | X | Detached, semi-detached, end-terrace or mid-terrace. **Code list to be defined** (O2); not deliverable under this name until then (§2) | — |
| `roof_slope_deg` | float64, ° | X | Representative pitch of the main roof surface | Derived from CityGML roof geometry |

### 5.6 Construction

All four attributes are extended, and their code lists are **to be defined** (O2).

**Scope (T22).** Each attribute holds one value for the **building as a whole**: the dominant material or system of the named element, meaning the one with the largest share of that element. Per-surface values, for example materials of individual CityGML `WallSurface` or `RoofSurface` objects, are outside Tier 1.

**Publishing gate (T22).** Before a delivery may contain one of these columns under its Tier 1 name, its code list MUST be defined in a contract version (§2). Until then, the data MAY only be delivered as a Tier 2 column.

**Meaning of a value.** The existing metadata states how a value was obtained:

- A material observed on the building (survey, imagery, register) declares its `method` accordingly.
- A material derived from a building typology or age class is `method = inferred`.
- A value reduced from a finer source classification declares `crosswalk_id` and `crosswalk_lossy = true`.

| Column | Type | Level | Definition | Reference |
| --- | --- | --- | --- | --- |
| `structural_material` | utf8 | X | Dominant load-bearing material of the building. Not the facade | INSPIRE `materialOfStructure` |
| `facade_material` | utf8 | X | Dominant visible material of the building's external walls | INSPIRE `materialOfFacade` |
| `roof_covering_material` | utf8 | X | Dominant roof covering material of the building | INSPIRE `materialOfRoof` |
| `structural_system` | utf8 | X | Predominant load-bearing system of the building | GEM taxonomy |

### 5.7 Planning (draft)

Planning attributes are claims about legal status, not measurements. Binding plan geometry belongs in a separate `planning_zones` collection. An attribute attached to a building by spatial intersection is a derived view: its date, legal force and intersection method are declared, and an ambiguous intersection gives `null`.

| Column | Type | Level | Definition |
| --- | --- | --- | --- |
| `heritage_designated` | bool | X | The building is on a formal protected-building register. `false` only with complete register coverage |
| `in_heritage_area` | bool | X | The building lies in a designated heritage or conservation area. This is not individual protection |
| `in_world_heritage_site` | bool | X | The building lies in a UNESCO World Heritage Site; core zone and buffer zone are distinguished |
| `demolition_proposed` | bool | X | A documented active demolition proposal exists. Not a permit and not an executed demolition |
| `planning_zone_id` | utf8 | X | Identifier of the applicable zoning element, only if it matches uniquely |
| `planned_use_hilucs` | utf8 | X | Planned land use (INSPIRE HILUCS). Never the same as the building's actual use |
| `planning_document_id` | utf8 | X | Identifier of the relevant plan document, with jurisdiction and validity dates |
| `planning_max_height_m` | float64, m | X | Legal maximum height, with its vertical reference |
| `planning_max_far` | float64 | X | Legal maximum floor-area ratio (floor area / plot area). Not a measured value |
| `planning_max_site_coverage` | float64, 0–1 | X | Legal maximum site coverage (footprint / plot area). Distinct from FAR |
| `planning_regulation_ids` | list<utf8> | X | Applicable regulation identifiers. In GeoParquet only, never in tiles |

### 5.8 Energy (draft)

Every energy attribute declares:

- its energy basis: `useful_demand`, `final_demand`, `metered_final_consumption`, or `primary_demand`
- its reference year or period, end uses and carriers
- its method and model version, and any scenario or weather normalisation
- its reference floor area
- for primary energy, its conversion-factor set

Several periods, scenarios or carriers for one building go into a separate `energy_observations` collection. Certificate classes are local schemes and are **not** comparable across schemes.

| Column | Type | Level | Definition |
| --- | --- | --- | --- |
| `energy_certificate_class` | utf8 | E | Rating under a named scheme; requires scheme and date |
| `energy_certificate_scheme` | utf8 | E | Machine-readable scheme identifier |
| `energy_certificate_date` | date32 | E | Assessment date |
| `conditioned_floor_area_m2` | float64, m² | E | Reference floor area for energy metrics, with its definition |
| `space_heating_useful_demand_kwh_a` | float64, kWh/a | E | Annual useful space-heating demand |
| `cooling_useful_demand_kwh_a` | float64, kWh/a | E | Annual useful cooling demand |
| `dhw_useful_demand_kwh_a` | float64, kWh/a | E | Annual useful domestic hot water demand |
| `final_energy_demand_kwh_a` | float64, kWh/a | E | Annual modelled final energy demand |
| `final_energy_demand_kwh_m2a` | float64, kWh/(m²·a) | E | Annual final energy demand per reference floor area; consistent with the two columns above |
| `final_energy_consumption_kwh_a` | float64, kWh/a | E | Annual metered final energy consumption. Never substituted for demand |
| `primary_energy_demand_kwh_a` | float64, kWh/a | E | Annual modelled primary energy demand |
| `main_heating_system` | utf8 | E | Predominant heating technology |
| `main_heating_carrier` | utf8 | E | Predominant heating energy carrier. Not the same as the system |
| `solar_pv_present` | bool | E | A PV installation is known to exist |
| `pv_installed_capacity_kwp` | float64, kWp | E | Installed PV peak capacity |
| `energy_reference_year` | int32 | E | Reference year of the energy values |

## 6. Code lists

INSPIRE identifiers are given as registered in the INSPIRE Registry, under the prefix `http://inspire.ec.europa.eu/codelist/`.

### 6.1 `record_kind`

| Code | Meaning |
| --- | --- |
| `building` | A building |
| `building_part` | A part of a building with its own attributes. `parent_building_id` SHOULD be set |

### 6.2 `current_use` (INSPIRE top level)

| Code | INSPIRE identifier | INSPIRE definition (abridged) |
| --- | --- | --- |
| `residential` | `CurrentUseValue/residential` | Used for residential purposes |
| `agriculture` | `CurrentUseValue/agriculture` | Used for agricultural activities |
| `industrial` | `CurrentUseValue/industrial` | Used for secondary-sector (industrial) activities |
| `commerceAndServices` | `CurrentUseValue/commerceAndServices` | Used for tertiary-sector activities (commerce and services) |
| `ancillary` | `CurrentUseValue/ancillary` | Small building used only in connection with a larger main building |

### 6.3 `current_use_detail` (Colouring classes)

Each class is a narrower value under one of the five INSPIRE top-level values of §6.2. The "INSPIRE parent" column always holds one of those five values. The CC column gives the Eurostat class used for guidance.

| Code | INSPIRE parent | Includes | Excludes (goes to) | CC |
| --- | --- | --- | --- | --- |
| `residential` | residential | Houses, apartment buildings; residences for communities (student homes, retirement homes without medical care, hostels for the homeless) | Hotels (`hospitality`); care homes with nursing or medical care (`health`) | 1110–1130 |
| `agriculture_forestry` | agriculture | Barns, stables, agricultural storage, greenhouses, forestry buildings | Food factories (`industrial`) | 1271 |
| `industrial` | industrial | Factories, workshops; warehouses, silos, reservoirs, cold stores; energy and water utility buildings | Agricultural storage (`agriculture_forestry`) | 1251, 1252 |
| `commercial` | commerceAndServices | Office buildings; shops, shopping centres, department stores, indoor markets; petrol stations; detached car parks | Government offices and courts (`public_services`); shops in buildings used mainly for something else (POI) | 1220, 1230, 1242 |
| `hospitality` | commerceAndServices | Hotels, motels, inns, pensions; youth hostels, holiday lodging; detached restaurant, café or bar buildings | Restaurants in apartment buildings or shopping centres (POI) | 1211, 1212 |
| `leisure` | commerceAndServices | Cinemas, theatres, concert halls; museums, libraries, archives; indoor sports halls and pools | Open-air sports grounds and parks (not buildings) | 1261, 1262, 1265 |
| `public_services` | commerceAndServices | Public administration, courts, parliaments; police, fire stations, prisons; stations and terminals; places of worship | Schools (`education`); hospitals (`health`) | 1220 (deviation), 1241, 1272 (deviation), 1274 |
| `education` | commerceAndServices | Kindergartens, schools, universities, research buildings | Student residences (`residential`); university hospitals (`health`) | 1263 |
| `health` | commerceAndServices | Hospitals, clinics; care homes with nursing or medical care; veterinary clinics | Retirement homes without care (`residential`) | 1264 |
| `ancillary` | ancillary | Garages, sheds and small outbuildings that serve a main building | Detached car parks (`commercial`) | — |
| `other` | — | A known use that fits none of the classes. `current_use` is then `null` unless the INSPIRE parent is known | Unknown use (`null`) | — |

There is no `mixed` class (see `use_is_mixed`) and no `unknown` class (use `null`).

**Consistency rules (T15).**

1. When `current_use` and `current_use_detail` are both delivered, `current_use` MUST equal the parent of `current_use_detail`. The exception is `other`, which has no parent.
2. When `current_use_inspire_code` is delivered, it MUST be a registered `CurrentUseValue` code. That code MUST be `current_use` itself or a descendant of it in the INSPIRE hierarchy.
3. When `current_use_detail` is also delivered, `current_use_inspire_code` SHOULD be one of the typical narrower codes listed below for that class. Another code under the same parent is a warning, not an error.
4. A narrower code is **never derived from the Colouring class alone**. For example, `education` does not imply `publicServices`. The code is delivered only when the source supports it through a declared crosswalk.

Typical narrower INSPIRE codes. They are informative; the INSPIRE Registry is authoritative.

| Class | Typical `current_use_inspire_code` values |
| --- | --- |
| `residential` | `individualResidence`; `collectiveResidence` (narrower: `twoDwellings`, `moreThanTwoDwelling`); `residenceForCommunities` |
| `commercial` | `office`, `trade` |
| `hospitality` | `trade` (INSPIRE lists hotels and restaurants as trade examples) |
| `public_services` | `publicServices`. Places of worship have no narrower code |
| `education` | `publicServices` |
| `health` | `publicServices` |
| `agriculture_forestry`, `industrial`, `leisure`, `ancillary` | No narrower code is registered; only the parent |

### 6.4 `construction_condition`

These are the values of INSPIRE `ConditionOfConstructionValue`. The list is not extensible.

| Code | Meaning |
| --- | --- |
| `functional` | In use or usable |
| `declined` | Cannot be used normally, but walls and roof still exist |
| `ruin` | Partly demolished; main elements destroyed; visible remains |
| `demolished` | Demolished; no visible remains. Only allowed when `colouring:lifecycle_policy = includes_historic` (§3.4) |
| `projected` | Being designed; construction has not started |
| `underConstruction` | Under initial construction; not yet functional |

### 6.5 `building_nature`

`building_nature` uses the INSPIRE `BuildingNatureValue` codes as registered. Examples: `canopy`, `tower`, `silo`, `storageTank`, `windTurbine`, `greenhouse`, `shed`, `stadium`, `church`, `mosque`, `synagogue`, `temple`, `castle`.

- The INSPIRE list is open. Colouring does not add values without a contract version change.
- `building_nature` is a card detail. It does not replace or extend the use classes.

### 6.6 `method`

The values are `measured`, `administrative_record`, `inferred`, `modelled`, `crowdsourced` and `derived_geometry` (§2).

### 6.7 `geometry_reference` (collection metadata)

| Code | Meaning |
| --- | --- |
| `ground_footprint` | Outline where the building meets the ground |
| `roofprint` | Outline of the roof or eaves as seen from above, for example from aerial imagery |

The mapping to INSPIRE `HorizontalGeometryReferenceValue` is to be verified. If a collection mixes both references, a per-row field is required.

## 7. Measurement rules

### 7.1 Height

`height_m` is measured from the lowest ground point (`ElevationReferenceValue/lowestgroundPoint`, as registered) to the highest roof edge (`ElevationReferenceValue/highestRoofEdge`). This definition is fixed (T10).

`height_highest_point_m` is measured from the same lowest ground point to the highest point (`ElevationReferenceValue/highestPoint`). According to INSPIRE, the highest point includes installations such as chimneys and antennas.

- A value measured to `highestPoint` goes into `height_highest_point_m`, never into `height_m`.
- A value measured to an eaves level goes into `height_eaves_m`.
- A value measured to a general roof level, or an unspecified "height", MUST NOT be placed in any height attribute as it is. It is either converted to the reference of one of these attributes with a declared and documented method (`crosswalk_id`, `crosswalk_lossy`), or withheld.
- `height_highest_point_m` never replaces `height_m`. It does not feed the height theme or extrusion (§9.3). It is a card detail.
- When both are delivered from the same source and source date, `height_highest_point_m` ≥ `height_m`. A violation is a check warning.
- Storey counts alone never establish a height attribute.
- The collection declares the height status (`measured` or `estimated`, from INSPIRE `HeightStatusValue`) for each delivered height attribute.
- `height_eaves_m` declares which eaves reference it uses: `generalEave`, `lowestEave` or `highestEave`.

### 7.2 Years

- `construction_year` is the **completion** year.
- `construction_start_year` is the start year. The two are never copied into each other.
- `construction_year_earliest` and `construction_year_latest` express uncertainty about the completion year. A range is never turned into a fake exact year.
- Placeholder years are `null`.

### 7.3 Storeys

`storeys_above_ground` counts every storey above ground, including attic storeys. Storeys below ground are counted only in `storeys_below_ground`.

### 7.4 Areas and ratios

- `floor_area_m2` declares its convention: `gross_external`, `gross_internal`, `net_usable`, or a declared national standard. Values with different conventions are not compared.
- `footprint_area_m2` is never computed from a roofprint.
- FAR (floor area / plot area) and site coverage (footprint / plot area) are different quantities and are never conflated.

### 7.5 Dominant and mixed use

- The dominant use is the use with the largest floor-area share. It determines `current_use` and `current_use_detail`.
- `use_is_mixed = true` when any other use has a floor-area share of 20 % or more. `use_is_mixed = false` only when the shares are known.
- When the source gives no shares, the producer uses the source's declared primary use and sets `use_is_mixed` to `null` unless the source states it.

### 7.6 Energy

The rules for energy attributes are given in §5.8.

## 8. Collection metadata (`colouring:` fields)

The fields below are Colouring fields on the Portolan `collection.json`. They never redefine STAC or Portolan fields.

| Field | Content |
| --- | --- |
| `colouring:contract_version` | `0.1.0` |
| `colouring:role` | `buildings`; other roles are `planning_zones`, `energy_observations`, `parcels`, and later `places` |
| `colouring:object_granularity` | `building`, `building_part`, or `mixed` |
| `colouring:geometry_reference` | `ground_footprint` or `roofprint` (§6.7) |
| `colouring:lifecycle_policy` | `current_only` or `includes_historic` (§3.4). Required on the `buildings` collection |
| `colouring:attributes` | Map keyed by column name, covering every delivered Tier 1 and Tier 2 column, plus every Tier 1 attribute declared as `not_provided`. Each entry holds: `tier`, `level`, `type`, `unit`, `codelist`, `method`, `source_id`, `source_date`, `coverage` `{non_null_count, total_count, fraction}`, plus the references from §7 where applicable (`low_reference`, `high_reference`, `area_reference`, `energy_basis`, `period`, `scenario`, `crosswalk_id`, `crosswalk_lossy`, `comparable_group`). Tier 2 entries also hold the UI fields of §8.1 |
| `colouring:themes` | The themes this delivery offers (§9.2): `id`, `requires`, `availability`, `coverage`, `style`, `minzoom` (§9.3) |
| `colouring:links` | Typed joins to other collections (planning, energy, parcels, places) |
| `colouring:quality` | Validation results. Written only by the Colouring check |

`coverage` is computed by tooling from the actual GeoParquet, never written by hand.

### 8.1 UI metadata (T20, T23)

UI metadata tells the frontend where an attribute appears and how it is labelled, filtered and drawn. It uses five fields: `category`, `kind`, `labels`, `filter` and `legend`.

- **Tier 1: the attribute registry is authoritative.** For every Tier 1 attribute, the five fields come from the attribute registry of the declared contract version (T20). A delivery MUST NOT declare or override them for a Tier 1 column. The registry does not exist yet, and how the frontend obtains it is open (O5). Until it exists, the Tier 1 `category` is the §5 subsection that lists the attribute.
- **Tier 2: the delivery declares them.** Every Tier 2 entry in `colouring:attributes` MUST declare all five fields, using only the vocabulary below. The vocabulary is global and closed: it changes only with a contract version. The frontend contains no country-specific code, so it can only render what this vocabulary describes.
- **Missing values are not declarable.** Null handling is always the global rule (§2, §9.3): a neutral "no data" state. No attribute can declare its own.

| Field | Allowed values |
| --- | --- |
| `category` | `identity`, `land_use`, `size`, `age`, `typology`, `construction`, `planning`, `energy` (§4.1); `street_context`, `resilience` only when that profile is declared |
| `kind` | `identifier`, `text`, `boolean`, `categorical`, `ordinal`, `quantitative`, `year`, `date` |
| `labels` | Map from a BCP 47 language tag to a display label. MUST include `en`. A `categorical` or `ordinal` attribute also declares `code_labels` (code → language map) for every code. An `ordinal` attribute declares its codes in order |
| `filter` | `none`, `multi_select`, `range`, `boolean` |
| `legend` | `none`, `discrete`, `ordered`, `steps`, `continuous` |

Allowed combinations:

| `kind` | `filter` | `legend` |
| --- | --- | --- |
| `identifier`, `text` | `none` | `none` |
| `boolean` | `boolean` or `none` | `discrete` or `none` |
| `categorical` | `multi_select` or `none` | `discrete` or `none` |
| `ordinal` | `multi_select`, `range` or `none` | `ordered` or `none` |
| `quantitative`, `year`, `date` | `range` or `none` | `steps`, `continuous` or `none` |

A `boolean` filter always offers three states: yes, no, and unknown (§2).

## 9. Frontend behaviour

### 9.1 Reading a delivery

1. The input is a Portolan `catalog.json` URL.
2. The frontend finds the collection with `colouring:role = buildings`, then its PMTiles link and styles (Portolan).
3. An unsupported major contract version is rejected with a clear message.
4. The theme chooser, the filters and the card are built from `colouring:attributes` and `colouring:themes`. UI metadata comes from the registry for Tier 1 and from the delivery for Tier 2 (§8.1). There is no country-specific code.

### 9.2 Availability states

| State | Meaning | UI |
| --- | --- | --- |
| `available` | Delivered with data; coverage may be partial | Active; coverage shown |
| `not_provided` | Not in this delivery (column omitted, T9) | Core themes: visible but inactive, with the reason. Extended attributes: not shown on the card |
| `restricted` | Withheld for licence or access reasons | Inactive, with the reason |
| `not_applicable` | Does not apply to this region | Inactive, with the reason |

A network or load failure is an error state. It is never displayed as missing data.

### 9.3 Rules

- All eight categories are always visible, even when none of their attributes is available. Street Context and Resilience are hidden unless declared.
- Extended attributes appear as card details when delivered.
- Missing values use a neutral fill. They are never shown as `0` or as a fake class.
- Without `height_m`, a building falls back to a 2D footprint. It is never extruded to 0 m, and never extruded from `height_highest_point_m`.
- Rendering follows the attribute's `kind`, `filter` and `legend` (§8.1): discrete colours for categories, ordered colours for ordinal values, declared steps or scales for numbers.
- The default condition filter of §3.4 applies to the map, the filters and the statistics.
- Local certificate classes use local legends only.
- GeoParquet is the data of record. PMTiles is a lossy view. Tiles carry `building_id` plus every property that a delivered theme's style, filter or legend reads, from the theme's `minzoom` up to the maximum zoom of the tiles.
- **Theme `minzoom` (T24).** Every theme in `colouring:themes` declares `minzoom`: the lowest zoom at which the theme renders building-level features. It MUST NOT be lower than the minimum zoom of the buildings tile layer. Below `minzoom` the theme is inactive, and the frontend asks the user to zoom in. It never shows an empty map as missing data. Tiles may still drop features by zoom (portolan-decisions); `minzoom` is about properties, not feature counts.
- Small-scale aggregated representations, for example grids or district summaries, are **not** required. They are not defined by this version (O8).

### 9.4 Proposed themes (O1)

| Theme | Attribute | Kind |
| --- | --- | --- |
| `use` | `current_use_detail`, falling back to `current_use` | Categorical |
| `height` | `height_m` | Numeric steps, optional extrusion |
| `construction_year` | `construction_year` | Chronological steps |
| `storeys` | `storeys_above_ground` | Ordinal |
| `condition` | `construction_condition` | Categorical |

Each delivered theme has one Portolan style named `style-<theme_id>` (P5) and declares its `minzoom` (§9.3). A shared cross-country palette is still open (O1).

## 10. Colouring check (specified, not implemented)

A delivery is valid only when **both** `portolan check --strict` (pinned) and the Colouring check pass on the actual files (P2). The Colouring check SHALL verify:

1. **Contract version and schema.** The contract version, the required collection and columns, and Arrow types against this dictionary. `building_id` is unique and non-empty; geometries are valid with a declared CRS and `geometry_reference`.
2. **Values.** Values against types, ranges and code lists. No Tier 1 column whose code list is still to be defined (§2). The use hierarchy rules of §6.3: `current_use` / `current_use_detail` parent consistency, and `current_use_inspire_code` registered and under `current_use`. A narrower code that is not typical for the class is a warning. No sentinel values. No all-null columns (T9).
3. **Meaning.** Measurement references are present and allowed (height, eaves, area, energy basis). `height_highest_point_m` ≥ `height_m` where both come from the same source and date (warning). `false` booleans are backed by declared complete coverage.
4. **Metadata.** `colouring:attributes` for every delivered column and every `not_provided` attribute. Recomputed coverage. Unique Tier 2 prefixes. Tier 1 entries carry no UI fields. Every Tier 2 entry has all five UI fields, only vocabulary values, an allowed `kind` / `filter` / `legend` combination, an `en` label, and `code_labels` for every delivered code (§8.1).
5. **Lifecycle.** `colouring:lifecycle_policy` is present and valid. With `current_only`, no record has `construction_condition = demolished` (error). With `includes_historic`, a demolished record without `demolition_year` is a warning.
6. **Themes and tiles.** `colouring:themes` against the data. Every theme declares `minzoom`, which is not below the tile layer's minimum zoom. Every style references tile properties that actually exist from `minzoom` up to the maximum zoom, checked by decoding real tiles at `minzoom` and at the maximum zoom.
7. **Energy and planning.** Arithmetic consistency of energy totals, intensities and reference areas; planning provenance and ambiguity rules.
8. **Report.** A human- and machine-readable report with record ids. Zero errors are required; warnings are published with counts.

The test fixtures are synthetic and international. Examples: a 3D-model source, an OSM-only 2D source, buildings with parts, demolished and underground buildings under both lifecycle policies, a source with highest-point heights, a `public_services` record with and without `current_use_inspire_code`, a Tier 2 column with UI metadata, a certificate without demand values, and unknown / zero / false cases.

## 11. Versioning and change

- The contract uses semantic versioning, separate from the Portolan pin.
- Any change of name, type, unit, code list or meaning is a version change with a migration note.
- New attributes follow "data first, then frontend": define the meaning, add it to the contract, add a check rule and a fixture, then implement the frontend.
- A Tier 2 attribute is promoted to Tier 1 only when all of the following hold: the same tested definition exists in at least two independent source contexts; it has a code list, unit and references; mapping examples and fixtures exist; the contract version is bumped after review.

## 12. References

- INSPIRE Buildings Technical Guidelines D2.8.III.2: <https://inspire-mif.github.io/technical-guidelines/data/bu/dataspecification_bu.html>
- INSPIRE Registry code lists: <https://inspire.ec.europa.eu/codelist/> (JSON at `<Name>/<Name>.en.json`)
- CityGML 3.0 Conceptual Model (OGC 20-010): <https://docs.ogc.org/is/20-010/20-010.html>
- Energy ADE: <https://github.com/tudelft3d/Energy_ADE>
- Eurostat Classification of Types of Constructions, via the KSH English explanatory notes: <https://www.ksh.hu/docs/osztalyozasok/epitmenyjegyzek/ej_tartalom_eng.pdf>
- Portolan specification: <https://github.com/portolan-sdi/portolan-spec> (pinned in [portolan-decisions.md](portolan-decisions.md))
- Colouring Cities Research Programme: <https://colouringcities.org/>

> **SUPERSEDED. Do not follow this document.**
> It is kept only as history. It was replaced in 2026-10 by [building-contract.md](building-contract.md) (the normative contract) and [tier1-decisions.md](tier1-decisions.md) (the decision log). Where this document disagrees with them, they win.
> Agents: do not use this document as instructions, as a source of decisions, or as a list of open questions. It was written by an external agent without file access; missing files it mentions are expected. Its rules were reviewed and partly adopted; its use code list and several references were replaced.

# Colouring Building Delivery — Frontend Data Contract v0.1.0 (DRAFT)

**Status:** PROPOSAL FOR REVIEW, NOT ADOPTED; NOT IMPLEMENTED OR VALIDATED. 2026-10-18.  
**Scope:** Canonical final GeoParquet building representation; optional profiles; declared `colouring:*` STAC metadata; frontend behavior; cross-checks against PMTiles/Portolan styles.  
**Non-goals:** replace INSPIRE, CityGML or Energy ADE; replace Portolan metadata; prescribe country ETL engine; publish data; claim official CCRP/OGC/INSPIRE endorsement.

## 0. Decisions and standards hierarchy

1. **Portolan is packaging authority** (pinned profile v0.2.0; portolan-cli 0.8.0; rashid 0.3.0). This document adds *only* Colouring semantics and UI requirements; it does not establish competing catalog, tile, style, checksum, or licence formats. See `portolan-decisions.md` (provided in conversation).
2. **INSPIRE Buildings is the primary semantic anchor** for building identity, geometry semantics, actual use, height references, temporal events, materials and floors. INSPIRE Land Use / Planned Land Use is the authority for *planning context*, including zoning, planned land use and supplementary regulations. INSPIRE Protected Sites and authoritative local lists anchor heritage statements. These are references, **not claims that our flat columns are official INSPIRE property names**.
3. **CityGML 3.0 is a secondary semantic anchor**, particularly actual `usage` versus intended `function`, `Building`/`BuildingPart`, geometry LoDs, roof shape, construction year, and storeys. A data producer does not need to ingest GML.
4. **Energy ADE 3.0 (beta/developing) is the energy domain anchor**. Energy ADE 3.0 currently extends CityGML 2.0, not 3.0. Its nested resource/time-series/device/certificate concepts are projected into a selected *building-baseline* GeoParquet view below; flat names are Colouring names and require one-to-many source mappings. Historic series/multiple models stay in separate related tables.
5. **CCRP/Colouring Cities supplies questions and UI categories**, not unquestioned canonical field names. Existing UK-centric `colouring-core` fields are migration aliases only; crosswalk verification is required.
6. **Every property has one meaning across countries.** Same type is insufficient: unit, event, measure reference, energy basis, source observation and legal scope must match. No unverified default crosswalk.
7. **Eight global *category slots***: Identity, Land Use, Size, Age, Typology, Construction, Planning Context & Controls, Energy. A category is always visible in the navigation (possibly unavailable), but its attributes are activated by declared capabilities. It is **not** eight obligatorily populated datasets.
8. **Two extension profiles** initially: Street Context, Resilience. They have the same validation and UI mechanisms as the global slots but are hidden when absent. Community contributions and author/team profiles are out of scope for the data delivery; they can be separate plugin services.

### 0.1 Global fields vs obligations

- `required` = non-null column in every building GeoParquet delivery (`building_id`, `geometry`, `record_kind`). `geometry` is projected 2D Polygon/MultiPolygon; its *representation* must be declared.
- `core` = stable worldwide attribute name and meaning, but *optional data*. **The physical column may be absent** if the source cannot produce it; if present, missing values are typed null.
- `extended` = globally defined but generally narrower availability or different legal/measurement dependencies. Optional.
- `energy` = optional but first-class **eighth core theme/category**; certificate labels are explicitly **not globally comparable**.
- `profile` = opt-in Street Context / Resilience sub-profile; methods and scenarios compulsory.
- Tier 2 = country/source-prefixed fields documented with the same metadata schema. No fork changes a canonical definition.

## 1. Canonical physical representation

| Aspect | Rule |
|---|---|
| Primary data | GeoParquet 1.1; actual Arrow types in registry YAML; at most one logical building record per `building_id` per collection snapshot |
| `geometry` | GeoParquet WKB Polygon/MultiPolygon, valid nonempty polygons; CRS explicit, transform to WGS84 internally for tiles; collection declares `geometry_reference` (`ground_footprint`, `roofprint`); base geometry is **not** 3D LoD2 solid |
| Logical granularity | Preserve building/part distinction via `record_kind`, `parent_building_id`; do not aggregate part-level values to a building arbitrarily |
| Area | Compute `footprint_area_m2` only if geometry is actual ground footprint. Use appropriate metric / equal-area CRS; never call roofprint area ground footprint |
| Float | `float64` in GeoParquet; floating point quality checks; min/max and declared units. PMTiles may round, encode numbers differently, simplify geometry, and omit per-zoom values |
| Categorical | UTF8 short stable codes (not localized display names), codelist URI/version or Colouring local registry; null for unclassifiable |
| Null | `null` = unknown / not available for this record. Empty string, zero, negative sentinels, `9999`, `unknown` or `other` MUST NOT encode missing observations; `other` is only a documented *known* remainder class |
| Booleans | `true`, `false`, `null` = confirmed yes, confirmed no, unverified/unknown. Negative only if spatial/list coverage is demonstrably complete |
| Temporal | Calendar years `int32`, actual certificate date `date32` (`YYYY-MM-DD`); construction *start* and *completion* not interchangeable. No unsupported placeholder year |
| Links/arrays | Additional relation collections and URLs should be in catalog or GeoParquet; MVT need not carry arrays; frontend follows declared links/joins |
| PMTiles | Portolan-authoritative, lossy visual derivative. Always carries `building_id`; properties required for declared available tile themes must be present at specified zoom levels where those features render |
| ID | `building_id` unique within collection, stable across updates when producer source supports it; document namespace, generation policy and split/merge lineage. ID alone is **not** globally unique without catalog scope |
| Provenance | Per-field source, method, source date, validity, coverage and crosswalk status in collection metadata; if per-row heterogeneity materially affects meaning, add a declared row-level field or split homogeneous collection |

### 1.1 Measurement profiles (non-negotiable)

- `height_m`: canonical *lowest ground contact* → *highest roof construction edge* (exclude antennas). Producers must establish equivalent INSPIRE height reference pair. Other values (`highestPoint`, general/eaves, OSM unspecified `height`) are **not silently coerced**; use documented conversion, separate field, or withhold. `height_m` is **not** a CityGML LoD label. `geometry_lod` describes source 3D model detail only.
- `height_eaves_m`: eave reference in metadata is mandatory (e.g. `generalEave`); not interchanged with `height_m`.
- `floor_area_m2`: reference method is required (`gross_external`, `gross_internal`, `net_usable`, nationally coded equivalent). Different conventions do not get the same comparison group.
- `construction_year`: completed year (CityGML `yearOfConstruction`). `construction_start_year` separate. Earliest/latest means uncertainty **about completion**, not the project start/end sequence. No interpolation from a range into fake precise date.
- `current_use_group` (actual use) and `planned_use_hilucs` (legal/planned zone) are **different entities and different semantics**. A location in a commercial zone does not prove that its building is commercially used.
- `planning_max_far` = maximum legal ratio of total regulatory floor area / plot area. `planning_max_site_coverage` = maximum footprint / plot area. Neither is a measured current FAR. They have **different** dimensions/area conventions and must not be conflated.
- Energy: distinguish (i) *useful* end-use demand, (ii) *final* modeled demand, (iii) actual *final* energy consumption, and (iv) *primary* modeled energy. `kWh/a` versus `kWh/(m2*a)` distinct; reference heated/conditioned floor area, carrier factors, methodology and baseline year are declared. A-to-G EPC letters do **not** form a global comparison scale.

## 2. Canonical field dictionary

**Codes:** R = required; C = global core optional; X = extended optional; E = Energy slot optional; P = opt-in Street Context / Resilience. All fields nullable except R. Physical types correspond to Arrow (GeoParquet). Field sources describe semantic *alignment*, not 1:1 attribute name identity.

### Identity & Location — 6 attributes

| Column | Type | Tier | Definition | Semantic reference | UI |
|---|---|---|---|---|---|
| `building_id` | `utf8` | R | Stable identifier of the represented building/building part within the producer identity namespace | INSPIRE BU inspireId / CityGML gml:id | identity, search |
| `geometry` | `geometry` | R | Ground-projected 2D outline of represented object; interpretation declared | INSPIRE BU geometry2D and HorizontalGeometryReferenceValue | map, pick |
| `record_kind` | `utf8` | R | Entity represented by this record | INSPIRE BU Building / BuildingPart, CityGML Building / BuildingPart | card |
| `parent_building_id` | `utf8` | X | Parent building identifier for a building part | CityGML BuildingPart | card |
| `source_feature_id` | `utf8` | X | Original upstream object identifier, with explicit source namespace | INSPIRE BU ExternalReference | card |
| `name` | `utf8` | X | Publicly available building name | CityGML name | card |

**Validation notes:**
- `building_id`: unique not-empty; source identifier namespace required.
- `geometry`: Polygon or MultiPolygon; declared footprint or roofprint reference.
- `record_kind`: enum:building,building_part; never silently collapse parts.

### Land Use (Actual & Intended) — 5 attributes

| Column | Type | Tier | Definition | Semantic reference | UI |
|---|---|---|---|---|---|
| `current_use_group` | `utf8` | C | Harmonised dominant actual building use | INSPIRE BU CurrentUseValue; CityGML usage | theme, filter, card |
| `current_use_inspire_code` | `utf8` | X | Full INSPIRE CurrentUseValue code or provider-defined narrower code | INSPIRE BU currentUse | card, filter |
| `use_is_mixed` | `bool` | X | Confirmed multiple actual building uses | INSPIRE BU CurrentUse multiplicity | filter, card |
| `intended_use_group` | `utf8` | X | Harmonised officially intended building function; NOT current use | CityGML function | theme, card |
| `residential_floor_share_pct` | `float64` percent | X | Share of building floor space devoted to residential use | INSPIRE BU CurrentUse percentage | filter, card |

**Validation notes:**

### Size & Geometry — 8 attributes

| Column | Type | Tier | Definition | Semantic reference | UI |
|---|---|---|---|---|---|
| `footprint_area_m2` | `float64` m2 | C | 2D footprint area, not area of roof overhangs | INSPIRE BU horizontal geometry; derived | theme, filter, card |
| `height_m` | `float64` m | C | Vertical distance from lowest terrain intersection to highest roof edge (roof construction top) | INSPIRE BU HeightAboveGround (reference semantics); CityGML measured height | theme, filter, extrusion |
| `height_eaves_m` | `float64` m | X | Terrain-to-eaves vertical difference using declared eaves reference | INSPIRE BU ElevationReferenceValue | theme, filter, card |
| `storeys_above_ground` | `int32` count | C | Number of storeys mainly above ground including inhabited attic where counted | INSPIRE BU numberOfFloorsAboveGround; CityGML storeysAboveGround | theme, filter, card |
| `storeys_below_ground` | `int32` count | X | Number of storeys mainly below ground | INSPIRE BU numberOfFloorsBelowGround | filter, card |
| `floor_area_m2` | `float64` m2 | X | Floor area in explicitly declared measurement convention | INSPIRE BU OfficialArea and CLGE reference | theme, filter, card |
| `gross_building_volume_m3` | `float64` m3 | X | Gross enclosed 3D building volume with declared method | CityGML solids derived | theme, filter, card |
| `geometry_lod` | `utf8` | X | LoD of input 3D building model, not confidence or precision | CityGML LoD | card |

**Validation notes:**

### Age & History — 7 attributes

| Column | Type | Tier | Definition | Semantic reference | UI |
|---|---|---|---|---|---|
| `construction_start_year` | `int32` year | C | Year construction began; not the completion year | INSPIRE BU DateOfEvent beginning | theme, filter, card |
| `construction_year` | `int32` year | C | Year of building completion | CityGML yearOfConstruction; INSPIRE BU DateOfEvent end | theme, filter, card |
| `construction_year_earliest` | `int32` year | X | Earliest plausible building completion year if exact completion unknown | INSPIRE BU DateOfEvent bounds | filter, card |
| `construction_year_latest` | `int32` year | X | Latest plausible building completion year if exact completion unknown | INSPIRE BU DateOfEvent bounds | filter, card |
| `last_major_renovation_year` | `int32` year | X | Year of latest major documented renovation | INSPIRE BU dateOfRenovation | theme, card |
| `demolition_year` | `int32` year | X | Year when this building was demolished | CityGML yearOfDemolition | filter, card |
| `construction_condition` | `utf8` | X | Status of building construction or existence | INSPIRE BU ConditionOfConstructionValue | theme, filter, card |

**Validation notes:**

### Typology & Form — 4 attributes

| Column | Type | Tier | Definition | Semantic reference | UI |
|---|---|---|---|---|---|
| `roof_shape` | `utf8` | C | Dominant roof shape mapped to restricted global presentation codes | INSPIRE BU RoofTypeValue; CityGML roofType; Overture roof_shape | theme, filter, card |
| `building_attachment_type` | `utf8` | X | Physical arrangement relative to attached buildings | CCRP Typology (design proposal) | theme, filter, card |
| `building_nature_code` | `utf8` | X | Building nature classification as defined by INSPIRE | INSPIRE BU BuildingNatureValue | theme, card |
| `roof_slope_deg` | `float64` degree | X | Representative pitch of principal roof surface | CityGML roof geometry derived | filter, card |

**Validation notes:**

### Construction & Materials — 4 attributes

| Column | Type | Tier | Definition | Semantic reference | UI |
|---|---|---|---|---|---|
| `structural_material` | `utf8` | C | Main load-bearing structure material; NOT facade cladding | INSPIRE BU MaterialOfStructureValue | theme, filter, card |
| `facade_material` | `utf8` | X | Main observable exterior facade material | INSPIRE BU MaterialOfFacadeValue; Overture facade_material | theme, filter, card |
| `roof_covering_material` | `utf8` | X | Primary weathering material on roof surface | INSPIRE BU MaterialOfRoofValue | theme, filter, card |
| `structural_system` | `utf8` | X | Predominant load-bearing system | GEM global earthquake model / CCRP Construction | theme, filter, card |

**Validation notes:**

### Planning Context & Controls — 11 attributes

| Column | Type | Tier | Definition | Semantic reference | UI |
|---|---|---|---|---|---|
| `planning_zone_id` | `utf8` | X | Identifier of intersecting legally applicable plan zone, if uniquely matchable | INSPIRE Land Use Planned Land Use ZoningElement | card |
| `planned_use_hilucs` | `utf8` | X | Officially planned land use category for applicable zoning object | INSPIRE Land Use Planned Land Use HILUCS | theme, filter, card |
| `planning_document_id` | `utf8` | X | Relevant planning document identifier | INSPIRE Land Use SpatialPlan/OfficialDocumentation | card |
| `planning_max_height_m` | `float64` m | X | Legal maximum permitted structure height if explicitly set | INSPIRE LU SupplementaryRegulation; local legal source | theme, filter, card |
| `planning_max_far` | `float64` ratio | X | Maximum allowed floor-area ratio (floor area / parcel area) | INSPIRE LU SupplementaryRegulation; jurisdiction-specific | filter, card |
| `planning_max_site_coverage` | `float64` ratio | X | Maximum allowed site coverage ratio (footprint / parcel area) | INSPIRE LU SupplementaryRegulation; jurisdiction-specific | filter, card |
| `heritage_designated` | `bool` | C | Object formally included on protected-building heritage register | CCRP Planning & Conservation; local legal register | theme, filter, card |
| `in_heritage_area` | `bool` | X | Building intersects a legally designated heritage/conservation area | CCRP Planning & Conservation; INSPIRE Protected Sites | theme, filter, card |
| `in_world_heritage_site` | `bool` | X | Building lies within officially designated UNESCO World Heritage Site geometry | CCRP Planning & Conservation; UNESCO | theme, filter, card |
| `demolition_proposed` | `bool` | X | Documented active proposal for building demolition | CCRP Planning Controls; local planning procedures | theme, filter, card |
| `planning_regulation_ids` | `list_utf8` | X | Set of applicable regulation feature identifiers | INSPIRE LU SupplementaryRegulation | card |

**Validation notes:**
- `planning_zone_id`: link to planning_zones collection; refuse ambiguous intersection.
- `planned_use_hilucs`: never confuse with current building use; may be many-to-many.
- `planning_document_id`: jurisdiction/source and validity dates mandatory.
- `planning_max_height_m`: vertical datum, ground reference, interpretation mandatory.
- `planning_max_far`: nonnegative; floor-area and parcel-area measurement methods required.
- `planning_max_site_coverage`: 0..1; distinct from FAR.
- `heritage_designated`: false only after complete authoritative register coverage.
- `in_heritage_area`: false only after reliable spatial coverage; spatial intersection method required.
- `in_world_heritage_site`: distinguish site core from buffer zones.
- `demolition_proposed`: proposal not permit or actual demolition; valid at explicit date.
- `planning_regulation_ids`: list in Parquet, NOT MVT; link to plan collection.

### Energy Performance & Systems — 16 attributes

| Column | Type | Tier | Definition | Semantic reference | UI |
|---|---|---|---|---|---|
| `energy_certificate_class` | `utf8` | E | Rating label under a named assessment scheme, NOT globally comparable | INSPIRE BU energyPerformance; Energy ADE 3 EnergyPerformanceCertificate | theme, filter, card |
| `energy_certificate_scheme` | `utf8` | E | Machine readable certificate scheme identifier | Energy ADE 3 EnergyPerformanceCertificate | card |
| `energy_certificate_date` | `date32` | E | Date of certificate assessment | INSPIRE BU dateOfAssessment; Energy ADE 3 certificate | card |
| `conditioned_floor_area_m2` | `float64` m2 | E | Reference conditioned floor area for energy metrics | Energy ADE 3 building physics / thermal zones | filter, card |
| `space_heating_useful_demand_kwh_a` | `float64` kWh/a | E | Annual useful thermal energy demand for space heating | Energy ADE 3 Resources / Time series conceptual mapping | theme, filter, card |
| `cooling_useful_demand_kwh_a` | `float64` kWh/a | E | Annual useful cooling demand | Energy ADE 3 Resources / Time series conceptual mapping | theme, filter, card |
| `dhw_useful_demand_kwh_a` | `float64` kWh/a | E | Annual useful domestic hot water thermal demand | Energy ADE 3 Resources / Time series conceptual mapping | theme, filter, card |
| `final_energy_demand_kwh_a` | `float64` kWh/a | E | Annual calculated final energy demand across explicitly declared end uses | Energy ADE 3 Resources / Time series conceptual mapping | theme, filter, card |
| `final_energy_consumption_kwh_a` | `float64` kWh/a | E | Annual actually consumed final delivered energy for declared carriers | Energy ADE 3 Resources / Time series conceptual mapping | theme, filter, card |
| `primary_energy_demand_kwh_a` | `float64` kWh/a | E | Annual modeled primary energy demand | Energy ADE 3 Resources / Time series conceptual mapping | theme, filter, card |
| `final_energy_demand_kwh_m2a` | `float64` kWh/(m2*a) | E | Annual final energy demand per declared reference floor area | Energy ADE 3 derived intensity | theme, filter, card |
| `main_heating_system` | `utf8` | E | Predominant installed building heating technology | INSPIRE BU HeatingSystemValue; Energy ADE 3 Devices | theme, filter, card |
| `main_heating_carrier` | `utf8` | E | Predominant supplied energy carrier for heating | INSPIRE BU HeatingSourceValue; Energy ADE 3 Resources | theme, filter, card |
| `pv_installed_capacity_kwp` | `float64` kWp | E | Installed rated electrical peak capacity of PV system | Energy ADE 3 Devices | theme, filter, card |
| `solar_pv_present` | `bool` | E | PV installation known to exist on the building | Energy ADE 3 Devices | theme, filter, card |
| `energy_reference_year` | `int32` year | E | Calendar year of measured energy consumption or model reference | Energy ADE 3 time series / schedules | card |

**Validation notes:**
- `energy_certificate_class`: requires scheme, jurisdiction, method and assessment date; local-theme-only by default.
- `energy_certificate_scheme`: required whenever certificate class populated.
- `energy_certificate_date`: required whenever certificate class populated.
- `conditioned_floor_area_m2`: area definition and zone aggregation required.
- `space_heating_useful_demand_kwh_a`: nonnegative; distinct from final energy; baseline scenario and reporting period.
- `cooling_useful_demand_kwh_a`: nonnegative; distinguish delivered cooling from electricity consumption.
- `dhw_useful_demand_kwh_a`: nonnegative; scope building, baseline.
- `final_energy_demand_kwh_a`: nonnegative; modeled, end-use scope mandatory; not measured consumption.
- `final_energy_consumption_kwh_a`: nonnegative; observation year/meter coverage required.
- `primary_energy_demand_kwh_a`: factor scheme/country/year required; never compare across incompatible factors.
- `final_energy_demand_kwh_m2a`: must match final_energy_demand_kwh_a / conditioned_floor_area_m2 when both present.
- `main_heating_system`: inspire codelist or approved mapping; multiple systems require separate devices table.
- `main_heating_carrier`: not interchangeable with heating system type.
- `pv_installed_capacity_kwp`: >=0; 0 only when confirmed no installed capacity.
- `solar_pv_present`: false only from adequate verified dataset.
- `energy_reference_year`: mandatory where mixed year per building.

### Optional: Street Context — 4 attributes

| Column | Type | Tier | Definition | Semantic reference | UI |
|---|---|---|---|---|---|
| `street_frontage_m` | `float64` m | P | Building frontage length measured along a selected adjacent street | CCRP Street Context | filter, card |
| `nearest_street_distance_m` | `float64` m | P | Shortest planimetric distance to chosen public street network | CCRP Street Context | filter, card |
| `tree_canopy_share_50m` | `float64` ratio | P | Fraction of 50 m buffer covered by tree canopy | CCRP Street Context, derived | theme, filter, card |
| `impervious_share_100m` | `float64` ratio | P | Fraction of 100 m buffer classified impervious | CCRP Street Context, derived | theme, filter, card |

**Validation notes:**

### Optional: Resilience — 3 attributes

| Column | Type | Tier | Definition | Semantic reference | UI |
|---|---|---|---|---|---|
| `flood_exposed` | `bool` | P | Footprint intersects a named flood hazard scenario footprint | CCRP Resilience; model-derived | theme, filter, card |
| `flood_depth_m` | `float64` m | P | Modeled inundation depth under a single declared event scenario | CCRP Resilience; flood model | theme, filter, card |
| `heat_exposure_c` | `float64` C | P | Outdoor heat metric in a defined climate scenario/time window | CCRP Resilience; climate model | theme, filter, card |

**Validation notes:**
- `flood_exposed`: false only with full hazard coverage; scenario, event and source mandatory.
- `flood_depth_m`: >=0; sampling statistic and return period/scenario mandatory.
- `heat_exposure_c`: metric e.g. daily max temp must be documented; not direct building thermal comfort.

## 3. Reference codelists and mapping policy

Code lists below are **Colouring presentation codelists**, not copies of INSPIRE code lists. Source codes preserve their canonical URI/version in the mapping registry. The actual registry file includes these lists as `code_lists` and exposes column types as Arrow data types.

- `current_use_group`: residential, mixed, commercial_services, industrial, public_services, education, health, hospitality, transport_logistics, agriculture, ancillary, other. **Draft crosswalk:** precise INSPIRE CurrentUseValue codes → these presentation groups, manually reviewed. INSPIRE actual `CurrentUse` can be multivalued and proportion-based; no forced dominant use unless threshold and source evidence documented.
- `roof_shape`: flat, gable, hip, half_hip, shed, mansard, gambrel, pyramid, dome, complex, other. Map from INSPIRE RoofTypeValue / CityGML RoofTypeValue only with a reviewed lookup; broad labels are deliberate.
- `structural_material`: wood, masonry, reinforced_concrete, steel, earth, other. These broad bins are **lossy** relative to INSPIRE MaterialOfStructureValue; mappings and confidence are declared.
- `heritage_designated` is **not** the same as `in_heritage_area`. A building can be inside conservation zoning yet not individually protected. National heritage grade/designation is Tier 2 (e.g. `gb_listing_grade`, `de_denkmal_status`).
- `planned_use_hilucs` is an INSPIRE LU HILUCS identifier, not the custom actual-use presentation code. Preserve precise hierarchical code and version; multi-zone and mixed-plan cases require relation collection or null.
- If upstream field is `osm:building:levels`, it maps to `storeys_above_ground` only after level-count convention is checked; it **never** establishes `height_m` alone.
- If a field has no unambiguous crosswalk, it stays null at Tier 1 and may appear under Tier 2.

### 3.1 Country/source Tier 2

Columns use `de_<snake_case>`, `gb_<snake_case>`, `jp_<snake_case>`, `us_<snake_case>` or registered provider prefixes `osm_<...>`, `overture_<...>`, `alkis_<...>`. Namespace prefixes and canonical IDs are centrally reserved; never overwrite Tier 1.

Each Tier 2 field must declare: column name; label/translations; Arrow type; semantics; unit; classification URI+version; source provider/source publication; legal relevance if any; coverage; UI kind; rendering/style configuration; optional crosswalk (mapping table/hash/version; lossy yes/no); shareable licensing status. Requiring a standard provider/country prefix is a **Colouring convention**, not INSPIRE.

Never expose personal names of developers/owners or restricted data simply because a country source has a field; privacy/access rights are a separate release gate.

## 4. STAC `colouring:` profile and capabilities

The Portolan catalog root `catalog.json` and `collection.json` remain STAC / Portolan objects. Colouring-specific fields are namespaced under `colouring:`. The JSON example `colouring-collection-example.v0.1.0.json` is a **metadata fragment**, not by itself a Portolan-conformant STAC document; it must be inserted into a real Portolan collection and checked on the actual files. For production, publish a Colouring STAC extension JSON Schema and list its resolvable versioned URI in `stac_extensions`; no schema URI is invented here.

**Required Colouring collection metadata:**

| Key | Meaning |
|---|---|
| `colouring:contract_version` | `0.1.0` semantic contract (Portolan pin separate) |
| `colouring:role` | `buildings`, `planning_zones`, `energy_observations`, `parcels`, etc. |
| `colouring:object_granularity` | `building`, `building_part`, `mixed` |
| `colouring:geometry_reference` | `ground_footprint` or `roofprint` for the collection; when mixed, row-level references mandatory |
| `colouring:attributes` | Map keyed by actual physical column name; exact type, semantic URI, unit, source/method, coverage, comparability profile |
| `colouring:themes` | Array of declared themes with requires, style asset, availability, coverage, zoom and filters |
| `colouring:links` | Typed join relations to any supplementary collections (no silent geometrical one-to-one assumption) |
| `colouring:quality` | Validation date, quality flags, reject/warn counts; only generated by the validator |

**Every declared property:** `tier`, `type`, `semantic_reference`, `source_id`, `method`, `coverage` (nonnull count and denominator), and (when applicable) `unit`, `codelist_uri`, `height_reference`, `area_reference`, `period`, `scenario`, `model_id`, `crosswalk_id`, `crosswalk_lossy`, `licence`, `comparable_group`.

- `source_id` connects to STAC providers/assets/links; **do not** duplicate the entire Portolan provenance or licence mechanism.
- `method` enum: `measured`, `administrative_record`, `inferred`, `modelled`, `crowdsourced`, `derived_geometry`.
- `coverage` is computed: `{non_null_count, total_count, fraction}` on the unfiltered canonical GeoParquet records. The validator recomputes it. A source's missing spatial coverage is separately represented; do not infer false simply because no intersecting feature was found.
- Comparability requires a declared `comparable_group` with compatible measurement standards/scopes. Same column name and unit **do not** imply scientifically defensible comparison (especially Energy, hazard, planning law).

## 5. Energy ADE projection rules (eighth category)

**This is a building-summary view of Energy ADE concepts, not an Energy ADE schema implementation.** The detailed Energy ADE 3.0 model remains nested with building-physics, occupancy, devices, resources, schedules/time-series modules and evolving version status. Use a separate `energy_observations` GeoParquet collection when there are multiple periods, energy carriers, end uses or scenarios for one building. Recommended keys: `building_id`, `scenario_id`, `reference_year`, `end_use`, `carrier`, `energy_basis`, `method_id`, `value_kwh_a`, `model_run_id`; foreign key to buildings and exact definitions required. This table is not automatically a MapLibre tile layer.

| Colouring field(s) | Energy ADE conceptual correspondence | Comparability caveat |
|---|---|---|
| `space_heating_useful_demand_kwh_a`, `cooling_useful_demand_kwh_a`, `dhw_useful_demand_kwh_a` | Energy demand/end-use and resource quantities represented via ADE resource/time-series concepts | Thermal vs electrical and useful vs final energy must stay distinct |
| `final_energy_demand_kwh_a`, `final_energy_consumption_kwh_a` | Resource flows/energy amounts and time series | Measured consumption cannot substitute simulated demand |
| `primary_energy_demand_kwh_a` | Resource energy and conversion factors/assumptions | Primary-energy conversion factors and renewable treatment vary nationally and temporally |
| `main_heating_system`, `main_heating_carrier`, `pv_installed_capacity_kwp` | Devices and energy resources | Multiple devices and carriers are inherently 1:n; primary-only flat field is a lossy summary |
| `conditioned_floor_area_m2` | Building physics/thermal-zone-derived energy reference area | Heated/conditioned area must be clearly defined, not assumed to be gross floor area |
| `energy_certificate_class`, `energy_certificate_scheme`, `energy_certificate_date` | EnergyPerformanceCertificate class in Energy ADE 3.0 development and INSPIRE energyPerformance | A–G classes **local scheme**; do not color all countries with identical meaning |

For each energy attribute require `reference_year` or defined period, building aggregation scope, `energy_basis` (`useful_demand`/`final_demand`/`metered_final_consumption`/`primary_demand`), end uses included, method and model/version, weather normalization/scenario where relevant, floor area reference, carrier and conversion factor set where relevant. A producer that cannot supply these must withhold the cross-country thematic comparison; it may still publish local Tier 2 values with explicit disclaimers.

## 6. Theme contract & frontend behavior

1. Frontend input = a hosted `catalog.json` URL, not bare PMTiles. Follow STAC catalog → relevant `colouring:role=buildings` collection → collection's Portolan PMTiles link/style assets. Each country hosts their own assets; CORS, HTTP Range and relative asset resolution must be tested.
2. Contract version gate: reject unsupported major/incompatible versions with a meaningful error. Never try interpreting unknown keys by guessing.
3. Core *category* navigation stays visible internationally. A core theme with no supplied non-null data is disabled with reason/coverage. Optional Street/Resilience themes are hidden unless declared.
4. Theme available if its `requires` are physically present, semantically compatible with its style/filters, and at least one in-scope non-null feature exists. Partial coverage is displayed as a percentage. `restricted`, `not_applicable`, and `no_data` are separate states. Network load errors are never represented as missing data.
5. Rendering must be **meaning-aware**: categorical fields use discrete colors and exactly declared codelist; ordinal fields can use an ordered palette; numeric fields use explicit thresholds/continuous scales, units, min/max; energy local certificate classes must use local-only legends by default.
6. Required MVT tile properties = `building_id` plus **every** property referenced by a published style, filter, legend or extrusion rule at zooms where that theme displays those features; validator samples/decodes real tiles across min/max zoom. Null properties may be omitted in MVT. No row-count parity requirement against GeoParquet.
7. Missing thematic values use neutral fill/outline (and optional pattern only if available in style sprite), **never** 0, a fake class or missing geometry; unsupported 3D extrusions fall back to 2D footprint, not a flat 0 m extrusion presented as a real height.
8. When the user switches regions, preserve theme selection where possible; otherwise show a disabled explanation while retaining the base map. Keep filters country-neutral; country-specific styles appear under `Local details`.
9. GeoParquet is the canonical record for full detail and analyses. PMTiles is a visualization derivative, not an authoritative source for measurements.
10. i18n: Portolan multilingual alternate metadata trees may provide catalog/collection descriptions. Plugin UI chrome is translated by plugin; each local code list/theme supplies localized labels through declared metadata, not hard-coded country switches.

### 6.1 Proposed theme IDs

| Theme | Field(s) | UI | Comparable globally? |
|---|---|---|---|
| `actual_use` | `current_use_group` | discrete category | Yes, only with approved crosswalk |
| `building_height` | `height_m` | numeric stepped map; optional extrusion | Yes, only exact height reference |
| `building_age` | `construction_year` | chronological steps | Yes, same construction event semantics |
| `storeys` | `storeys_above_ground` | ordinal classes | Partially (different local storey-count conventions) |
| `roof_shape` | `roof_shape` | discrete class | Yes, with matched broad codes |
| `structural_material` | `structural_material` | discrete class | Conditionally; class aggregation is lossy |
| `heritage_designation` | `heritage_designated` | tri-state | No as legal protection levels differ; UI indicates local coverage |
| `energy_final_intensity` | `final_energy_demand_kwh_m2a` | numerical map | Only if same energy basis, area definition and method group |
| `energy_certificate` | `energy_certificate_class` | local ordinal | **No** across schemes |
| `planning_zones` | planning_zones collection | overlay | No, local legal context |
| `flood_exposure` | `flood_exposed` | optional binary map | Only same model/scenario basis |
| `street_tree_canopy` | `tree_canopy_share_50m` | optional numeric map | Only comparable method/source window |

Every available theme has a Portolan v8 MapLibre style under collection `styles/`, with exactly one marked default per collection, even if UI theme count differs. The theme object refers to its matching style asset name; categorical legend labels and coverage are declared in Colouring theme metadata, avoiding reimplementing Portolan styles.

## 7. Planning interpretation & relation model

**What CCRP currently calls Planning & Conservation is primarily site/asset protection and heritage listing (e.g. conservation areas, Grade I/II listings, World Heritage status).** This contract purposefully extends that into the broader *planned land use and applicable building regulation* domain; it is a **new profile proposal**, not a factual description of every CCRP platform.

- Buildings are not the authority for legally binding plan geometry. Keep zoning and regulations in a `planning_zones` collection grounded in INSPIRE LU `SpatialPlan`, `ZoningElement`, `SupplementaryRegulation`, `OfficialDocumentation`, and optionally XPlanung-country source references.
- Attribute enrichment of buildings by spatial intersection is a **derived view**. Declare effective date, legal force, intersection method and thresholds, plan precedence, ambiguity handling and official plan URI. Do not turn `inside planning zone` into `building permitted for use X`.
- `heritage_designated` and `in_heritage_area` are separate legal claims; cadastral zoning, heritage regulation and active planning applications are separate domains. `false` is a claim of negative status, so requires a complete and current legal source.
- FAR/coverage limits are legal *maximums* and often depend on plot boundaries; use a separate `parcels` collection when plot-to-building joins are many-to-many. `planning_max_far` must **not** inherit the old ambiguous `size_far_ratio` definition.

## 8. Validation and acceptance

**A deliverable passes only when both actual-file gates pass**, at pinned versions: (1) `portolan check --strict` / rashid; (2) Colouring check. These gates are *specified here but have NOT been implemented or run*.

Colouring check SHALL:

1. Validate declared contract version, required building collection, field definitions and actual Arrow physical schema. Check `building_id` uniqueness, nulls, building/part keys, geometry validity/CRS/declared geometry reference.
2. Check every value against type/range/codelist and semantic rules. Failure for unqualified height references, ambiguous start vs completion year, energy basis mismatch, and incorrect ownership of planning claims.
3. Recalculate non-null coverage and check negative evidence for confirmed `false` values in official-list or hazard intersections; reject ambiguous/no-data forced into false.
4. Validate `colouring:attributes` per field (source, method, measurement reference, time validity, codelist version, comparability claims), Tier 2 namespace uniqueness and mapping provenance.
5. Validate `colouring:themes` requires/availability/reasons, legend types, style asset links, default style, MVT property presence at tested zoom levels, tile IDs, style referenced source layer and expression fields.
6. Validate energy `kWh/a` vs `kWh/(m2*a)` arithmetic within tolerance when total, intensity and conditioned area are all present; gate on model-year/scenario/certificate scheme declarations.
7. Validate planning legal provenance, effective date and spatial matches; warn when a building spans several zones; prohibit assigning a single regulatory limit from ambiguous intersects.
8. Check representative release fixtures: full Hamburg-type LoD2, OSM-only 2D with optional levels, energy-certified with no numeric demand, country-B planned-land-use zone, mixed building parts and unknown/zero/false cases.
9. Produce human+machine-readable error report with individual building IDs and fields; delivery must have **zero errors** (warnings may persist with explicit published counts and explanation).
10. Validate licence at Portolan stage. Missing or restricted material-typology licences block publishing those fields (the Hamburg ISBE issue is an existing known blocker).

## 9. Deployment and versioning

- `contract_version=0.1.0` **proposed**, not published or tested. Portolan pin v0.2.0 separate. Energy ADE 3.0 beta version must be *explicitly pinned in producer crosswalk definitions*, since upstream may break while in development.
- The registry YAML is a proposed single normative source from which generate (in future) Arrow schema checks, TypeScript types, UI config, examples, docs, metadata JSON Schema and validator rules. At this moment these generated contracts/validators have **not been implemented**.
- Portolan publishing/upload/register is out of scope; user must explicitly authorize it. Reference repo vs country forks follow the existing two-zone model; country adapters may not edit canonical field definitions.
- To promote a Tier 2 attribute upstream: require same tested semantic definition in at least two independent source contexts, codelist + units/measurement reference, mapping examples, fixtures, failing-then-passing contract tests, and version-bumped review.

## 10. References and provenance

**Primary public standards/documents (used for conceptual alignment):**

- [INSPIRE Buildings Data Specification — Technical Guidelines](https://inspire-mif.github.io/technical-guidelines/data/bu/dataspecification_bu.html)
- [INSPIRE Land Use and Planned Land Use data models](https://knowledge-base.inspire.ec.europa.eu/land-use_en); [INSPIRE Implementing Regulation](https://eur-lex.europa.eu/eli/reg/2010/1089/2023-11-19/eng)
- [CityGML 3.0 Conceptual Model](https://docs.ogc.org/is/20-010/20-010.html)
- [Energy ADE 3.0 development repository](https://github.com/tudelft3d/Energy_ADE) and its current specification PDF (Energy ADE still CityGML 2.0-based)
- [Portolan specification](https://github.com/portolan-sdi/portolan-spec), pinned as in user-provided Portolan decisions
- [Colouring Cities Research Programme](https://colouringcities.org/) and [Colouring Britain Planning & Conservation](https://colouringbritain.org/view/planning-conservation)
- Schlosser et al., *Deriving and Benchmarking Building Renovation Passport Data Requirements Against CityGML and the Energy ADE* (user-supplied PDF). Reports approx. 95% coverage of their derived 275-field requirements by CityGML 2.0 + Energy ADE 3.0 beta 8; does **not** mean a 95% complete public global building dataset.

**User-provided local research inputs:** `Pasted text(20261018-075850).txt` (Tier 1 research), `Pasted text (2).txt` (frontend contract draft), and the Portolan decision document in the conversation. The present design **departs deliberately** from the research note's proposal to reuse historic UK colouring-core column names verbatim.

**Not verified / decision points:** Exact ADE beta tag/commit SHA (to pin before implementation); exact code list values and version URIs for every INSPIRE extension; height definition when a jurisdiction reports top of roof vs highest point; harmonised crosswalk threshold for mixed-use; internationally comparable energy intensity conditions; planning regulations and legal status across countries; Portolan STAC extension registration. These require empirical source adapters and approval before calling v1.0 stable.

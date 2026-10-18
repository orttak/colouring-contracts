# TABULA / EPISCOPE as a semantic reference

Status: **research note**, recorded 2026-10. It contains **no normative decision**. The [building contract](building-contract.md) and the [Tier 1 decisions](tier1-decisions.md) are unchanged. Every classification below is a *candidate* for the user to decide. This note is input for **O2** (code lists for construction attributes) and, for energy, **O3**.

## Summary

- TABULA is a **typology and calculation method** for the heating and hot-water demand of **residential** buildings. Its construction data describe **typical thermal envelope elements** per country and national construction-year class, with U-values. They do not describe individual buildings.
- TABULA has **no material code list**. Wall, roof and floor constructions are free text (English plus national language), plus two binary indicators ("massive", "wooden"). It has **no facade covering material** and **no roof covering material** at all.
- TABULA is therefore **not a source for Colouring material code lists** (O2). It is useful as:
  1. a reference for how inferred construction and energy values must be declared;
  2. a construction library that the Energy ADE explicitly anticipates;
  3. a reference for energy-method metadata, such as reference area, energy basis and calibration.
- Any value derived from a TABULA type is **inferred from a typology** and is never an observed facade or structural material (see §5).

## 1. Sources checked (2026-10)

| Source | Version / date | Licence or terms | Used for |
| --- | --- | --- | --- |
| IWU `tabuladata` R package, <https://github.com/IWUGERMANY/tabuladata> | Package 0.1.2; last push 2026-04 | **CC BY 4.0** (`DESCRIPTION`, `README.md`). GitHub shows no licence file | Table list; `data-raw/tabula-values.xlsx` read directly (71 sheets) |
| EPISCOPE downloads, <https://episcope.eu/communication/download/> | `TABULA_CommonCalculationMethod.pdf` (2013-01); `TABULA.xlsm` (2017-06); `tabula-calculator.xlsx` (2016-07) | Usage rules on the page. Use in research, theses and software is intended; only non-exclusive use; the visible source credit "IEE Projects TABULA + EPISCOPE (www.episcope.eu)" is required; © IWU 2012–2016. **No Creative Commons licence. Commercial use and redistribution are not addressed** | Method chapters 1, 2, 5, 7 |
| INSPIRE Buildings TG D2.8.III.2, <https://inspire-mif.github.io/technical-guidelines/data/bu/dataspecification_bu.html> | Current HTML | INSPIRE / EU | Extended-schema material code lists (Annex C) |
| INSPIRE Registry | Checked 2026-10 | — | `MaterialOfFacadeValue`, `MaterialOfRoofValue`, `MaterialOfStructureValue` all return **404**, like `RoofTypeValue` (see tier1-decisions evidence) |
| CityGML Energy ADE 3.0, <https://github.com/tudelft3d/Energy_ADE> | `Energy_ADE_3.0_beta7.xsd`; last push 2026-10 | **Apache-2.0** | XSD, code lists, `documentation/Energy_ADE_3.0_Specifications.pdf` |

The `tabuladata` package states that it is consistent with `tabula-values.xlsx` from the IWU MOBASY "EnergyProfile-XL" package (<https://www.iwu.de/forschung/energie/mobasy/>). It is **not** identical to the 2017 `TABULA.xlsm`. For example, the German U-value defaults were updated with MOBASY and REWOTY data (2023–2025). A crosswalk must pin which source it uses.

## 2. What TABULA actually provides

### 2.1 Typology

- **Building type.** A type is defined by:
  - country;
  - typology region (`Tab.TypologyRegion`, for example `DE.N` national, `DE.East`);
  - building size class (`Tab.Const.BuildingSizeClass`): `SFH` single-family house, `TH` terraced house, `MFH` multi-family house, `AB` apartment block;
  - national construction-year class (`Tab.ConstrYearClass`);
  - an additional national parameter (`Tab.AdditionalPar`, for example `Gen` generic, `HR` high-rise, `LightFrame`, `Panel`).
- **Construction-year classes are national.** Their bounds are "defined according to typical construction or building properties (materials, construction principles, building shape)". For example, `DE.01` ends in 1859 and `DE.02` covers 1860–1918.
- **Data types** (`Tab.Const.DataType.Building`): `ReEx` real example building, `ReAv` real average building, `SyAv` synthetic average building, `TySi` typical building with simplified, assumption-based data.
- **Scope.** The method "is focused on the energy use for space heating and domestic hot water of residential buildings". `Tab.Const.Utilisation` lists non-residential uses, but they are noted as "for a start restricted to single_family and apartment".
- **Neighbour situation** (`Tab.Const.AttNeighb`): `B_Alone` detached, `B_N1` one neighbour (semi-detached), `B_N2` two neighbours (terraced).
- **The example buildings themselves are not in `tabuladata`.** They are in `TABULA.xlsm`, the WebTool and the national typology brochures.

### 2.2 Construction elements (`Tab.Building.Constr`)

There are 2,343 non-template rows from 20 countries, plus test rows (`XX`). The element types (`Tab.Const.ElementType`) are Wall (725), Floor (484), Window (420), Roof (406), Ceiling (187) and Door (121). By data type: `ReEx` 1,637, `SyAv` 622, `ReAv` 84.

Each row holds:

- the element type and construction-year class;
- `Type_Construction` / `Description_Construction` as free text in English and the national language;
- insulation thickness, U-value, and g-value for glazing;
- `Indicator_Constr_Massive` and `Indicator_Constr_Wood` (0/1);
- for windows: frame material, panes, low-e coating and gas filling.

| What is there | What it looks like |
| --- | --- |
| Wall construction | Free text, for example "Double Brickwork 10cm – Plastered on both sides", "adobe wall, plastered both sides", "timber frame, 150mm min.wool, 50mm thermal bridge break", "concrete wall, insulating plaster". Many rows have no type text |
| Material indicators | Of the 725 walls: `Massive = 1` in 463, `Wood = 1` in 78, neither set in 178. "Massive" names no material |
| Roof element | A **thermal** element (`Tab.Const.RoofType`): `TR` tilted roof ≥ 30°, `FR` flat roof < 30°, `UC` upper floor ceiling below an unheated attic. This is neither a roof covering nor a roof shape |
| Window frame | Uncontrolled strings: `wood`, `plastic`, `metal`, `wood/metal`, `pvc`, … |
| Not present | Facade cladding or finish, roof covering, load-bearing system as a coded value |

### 2.3 Thermal parameters

- `Tab.U.Class.Constr`: default U-values per country × construction-year class × element (roof, upper ceiling, wall, floor) × {default, massive, wooden}.
- `Tab.Insulation.Default`, `Tab.Measure.f.Default` and `Tab.Building.Measure`: default insulation thickness and conductivity, insulated fractions, and refurbishment measures (layers, R, U, costs).
- `Tab.U.WindowType.Periods`: default window U-values.
- `Tab.Const.ConstrBorder`: boundary situations (`Ext`, `Unh`, `Cellar`, `Soil`) with reduction factors.
- Further classifications: thermal bridging (`Tab.Const.ThermalBridging`), infiltration (`Tab.Const.Infiltration`), attic and cellar conditioning (`Tab.Const.AtticCond`, `Tab.Const.CellarCond`).
- `Tab.Uncertainty.Levels`: five input-uncertainty categories per variable.

### 2.4 Energy method (TABULA_CommonCalculationMethod)

- Seasonal method of EN ISO 13790 with a one-zone model. It covers heating and domestic hot water only, "cooling, air conditioning, lighting, electric appliances are until now not considered".
- Results:
  - energy need for heating and hot water (kWh/(m²·a));
  - delivered energy per carrier, "always based on the gross calorific value";
  - primary energy, CO₂ and costs (`Tab.System.EC`).
- **Adaptation.** Calculated values may be scaled to the "typical level of measured consumption" with empirical calibration factors (`Tab.CalcAdapt`).
- **Reference area.** `A_C,ref` is the conditioned floor area based on internal dimensions. When it is missing, it is estimated: 0.85 × A_C,extdim, 1.1 × A_C,living, 1.4 × A_C,use, or 0.283 × V_C. Envelope areas use external dimensions.

## 3. Relation to the INSPIRE material code lists

INSPIRE extended Buildings has `materialOfFacade`, `materialOfRoof` and `materialOfStructure` (multiplicity 0..*, voidable). Their code lists are **open**. The TG Annex C gives *recommended* values only, and the Registry does not publish them:

| INSPIRE list | Recommended values (TG Annex C) |
| --- | --- |
| `MaterialOfFacadeValue` (12) | adobe, asbestos, ceramicTiles, composite, concrete, glass, limestone, masonry, metal, naturalStone, vegetated, wood |
| `MaterialOfRoofValue` (14) | asbestos, ceramicTile, clayTile, composition, concreteTile, corrugatedSheet, glass, hotMoppedAsphalt, metal, reinforcedConcrete, slate, thatch, vegetatedGreenRoof, woodShinglesOrShakes |
| `MaterialOfStructureValue` (15) | reinforcedConcrete, reinforcedMasonry, rubleStoneMasonry (sic), steel, stoneMasonryBlock, wood, adobeBlockWalls, concreteBlockMasonry, earth, firedBrickMasonry, informalConstructions, massiveStoneMasonry, mobileHomes, mudWalls, precastConcrete |

How TABULA concepts relate:

| TABULA concept | Closest INSPIRE concept | Limitation |
| --- | --- | --- |
| Wall construction text | `materialOfStructure`, partly. For example "brickwork" → `firedBrickMasonry`, "adobe" → `adobeBlockWalls`, "timber frame" → `wood` | Needs per-country text parsing. Often ambiguous: "concrete" does not say reinforced, block or precast. Lossy |
| `Indicator_Constr_Wood = 1` | `materialOfStructure = wood` | Only for wall rows of the type, not the building |
| `Indicator_Constr_Massive = 1` | None | INSPIRE has no "massive, unspecified" value |
| Wall finish ("plastered", "insulating plaster") | `materialOfFacade`, partly | **INSPIRE has no render or plaster value.** Render on masonry or on insulation is very common in Europe |
| Roof element (`TR` / `FR` / `UC`) | None for material. Inclination is roof geometry, not `roof_shape` | Roof covering is not described |
| Window frame material | None | Out of scope for the three INSPIRE lists |

## 4. Relation to the CityGML Energy ADE

The Energy ADE 3.0 (beta7) is still "based on and extends CityGML 2.0", with a later port to CityGML 3.0 planned. The contract's anchor statement (T3) still holds.

| Energy ADE 3.0 concept | Relation to TABULA |
| --- | --- |
| `bdgType` (`BuildingTypeValue`: single-family house, terraced house, multi-family house, apartment block, plus commercial, industrial, office, religious, hospital and leisure types) | The four residential values match the TABULA size classes |
| `bdgAtticThermalStatus`, `bdgBasementThermalStatus` (heated / cooled / both / neither / unknown) | Similar to TABULA attic and cellar conditioning, but with different semantics: TABULA has partly conditioned and insulated variants |
| `bdgConstructionWeight` (veryLight … heavy) | Coarser than, and not equivalent to, TABULA's massive and wooden indicators |
| `LayeredConstruction` (`uValue`, `gValue`, ordered `Layer`s with thickness and material) in a `LayeredConstructionLibrary`, with `libraryCode` | The specification names TABULA as an example of an external construction library. A TABULA construction code can be stored as `libraryCode` with a codespace |
| `SolidMaterial` (thermal conductivity, density, specific heat, embodied energy and carbon) | TABULA gives conductivity only for insulation defaults |
| `RefurbishmentMeasure` (for example `insulatedExteriorWalls`, `changedWindows`) | Similar to TABULA measure types and refurbishment variants |
| `ConstructionMaterial` resource (`wood`, `tiles`, `concrete`, `sand`, `soil`, `glass`, `bricks`, …) | Material **quantities**, closer to a material cadastre than to a facade or structure class |

## 5. Why a TABULA typology is not an observed material

1. **A type is not a building.** TABULA values describe a real example, real average, synthetic average or simplified typical building of a size class and construction-year class. They do not describe the building on the map.
2. **The assignment chain never observes the material.** The usual path is: building → year + size (+ region) → type → construction text. The TABULA method itself says that "the construction materials of an existing building are usually not known in detail and may also be inhomogeneous" (chapter 5).
3. **A wall element is not a facade.** A TABULA wall is the full thermal layer stack, plaster and insulation included. The visible facade covering is not modelled. A TABULA roof is the thermal roof or top ceiling, not the roof covering.
4. **No controlled vocabulary.** The text is multilingual, often empty, and "massive" names no material.
5. **National classes.** Construction-year classes, example buildings and texts are national. Comparison across countries needs a per-country crosswalk.
6. **State over time.** A type describes the original or a variant state. A real building may have been refurbished, for example with external insulation and new render, which changes the visible facade.

The existing contract already covers the consequences (§2, §5.6, T22):

- A TABULA-derived value is `method = inferred`, with `crosswalk_id` and `crosswalk_lossy = true`.
- It MUST NOT share a column with observed values unless a per-row method field exists (§2, "Method").
- Until the code list exists, it can only be a Tier 2 column (T22).

## 6. Candidate placement (not decided)

| Concept | Candidate | Reason |
| --- | --- | --- |
| TABULA building type code, construction code, construction-year class | **Tier 2** (for example `de_tabula_type`) or provenance via `crosswalk_id` | National codes by definition (T4) |
| Size class (SFH / TH / MFH / AB) | No new column | It overlaps `current_use_inspire_code` (`individualResidence`, `collectiveResidence`), `building_attachment_type` and storeys |
| Neighbour situation (detached / semi / terraced) | Input to the `building_attachment_type` code list (O2) | TABULA has three values. The planned contract list has four (end- and mid-terrace), so mapping from TABULA "terraced" is lossy |
| Wall construction text and massive/wood indicators | Input only; inferred values in Tier 2 until O2 is decided | See §3 and §5 |
| Element U-values, attic and cellar conditioning, construction weight | **Optional extension** ("building physics"), aligned with the Energy ADE; not Tier 1 core | Per-element and model-oriented. Values are typical, not measured |
| Heating and hot-water demand results | Existing **Energy (E)** draft columns (§5.8), for example `space_heating_useful_demand_kwh_a`, with `energy_basis`, `method = modelled`, model and version, climate, and reference area `A_C,ref` | Already in the contract's model. TABULA's reference area differs from other "conditioned floor area" definitions |
| Refurbishment variants and measures | `energy_observations` scenarios (§5.8), not building columns | A variant is a scenario, not a state |
| Window frame and glazing | Not Tier 1; optional extension at most | No international code list |

## 7. Mapping limitations

- No facade covering and no roof covering material in TABULA.
- Wall texts are free and multilingual; many rows are empty; parsing is per country and lossy.
- The INSPIRE recommended lists lack render or plaster for facades and an unspecified "massive" value for structures. Both are frequent in TABULA texts.
- Residential only. Non-residential buildings are discussed only in a thematic report.
- The size class mixes size and attachment (`SFH` versus `TH`).
- U-values are typical values for a period, mostly for the unrefurbished state.
- Delivered energy uses gross calorific values. Values adapted to "typical measured consumption" are neither pure modelled demand nor metered consumption.
- The reference-area conversions are approximations from DATAMINE.
- Versions drift between `TABULA.xlsm` (2017), the WebTool and `tabuladata` / MOBASY. A crosswalk must pin one.
- Licences differ: `tabuladata` is CC BY 4.0, while EPISCOPE files fall under usage rules that do not address commercial use or redistribution. National brochures belong to the national partners.

## 8. Open questions

| # | Question | Relates to |
| --- | --- | --- |
| Q1 | Should the Colouring material code lists start from the INSPIRE Annex C values, extended where needed (for example render/plaster, unspecified masonry)? | O2 |
| Q2 | Should `facade_material` describe the visible finish (for example render) or the wall material behind it (for example brick)? TABULA describes neither separately | O2, T22 |
| Q3 | Is a typology-inferred material ever allowed in a Tier 1 column? If yes, a per-row `method` is needed whenever inferred and observed values are combined (§2) | O2 |
| Q4 | Should element U-values, attic/cellar conditioning and construction weight form an optional "building physics" extension aligned with the Energy ADE, or stay Tier 2? | O3 |
| Q5 | How are TABULA results "adapted to the typical level of measured consumption" declared? None of the four `energy_basis` values (§5.8) fits exactly | O3 |
| Q6 | Which TABULA source does a crosswalk pin (`tabuladata` version or `TABULA.xlsm` date)? Is IWU's confirmation needed before EPISCOPE-derived values appear in a published delivery? | Licence, O2/O3 |
| Q7 | The Energy ADE 3.0 is still beta. Which version does an energy crosswalk pin (T3)? | O3 |

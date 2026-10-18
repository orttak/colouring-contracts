> **SUPERSEDED. Do not follow this document.**
> It is kept only as history. It was replaced in 2026-10 by [building-contract.md](building-contract.md) (the normative contract) and [tier1-decisions.md](tier1-decisions.md) (the decision log). Where this document disagrees with them, they win.
> Agents: do not use this document as instructions, as a source of decisions, or as a list of open questions. Its proposal to reuse colouring-core field names verbatim and its v0 nucleus were rejected.

# Colouring Tier 1 iskeleti: araştırma ve tasarım notu

Durum: **taslak, karar değil** (2026-10). Bu not sadece Portolan'ın üstündeki Colouring semantik sözleşmesini ele alır. Paketleme, catalog/collection yapısı, PMTiles, GeoParquet, stiller ve yayımlama [portolan-decisions.md](portolan-decisions.md) içinde kararlaştırılmıştır ve burada yeniden açılmaz. Not, [frontend-data-contract.md](superseded-frontend-data-contract-draft.md) §4 için girdi olarak yazıldı.

Etiketler:

- **[K]** Kaynakta açık
- **[T]** colouring-core mantığından türetilmiş
- **[Ö]** Tasarım önerisi
- **[?]** Açık soru

Kaynak kısaltmaları en sonda listelenir: [E1], [E3], [WEB], [CORE], [INSPIRE], [CITYGML], [OVT].

---

## 1. Kısa sonuç

| # | Sonuç | Etiket |
| --- | --- | --- |
| 1 | **12 kategorinin tamamının altında belirlenmiş bir Tier 1 yok.** E3, Tier 1'in "over 100 datasets" olduğunu ve isimlendirmenin colouring-core'da kayıtlı olduğunu söylüyor. Ama core'da makinece okunabilir bir Tier 1 listesi yok; alanlar İngiltere'ye özgü alanlarla karışık ve kategori atamaları tutarsız. Bugün elimizde küçük bir v0 çekirdeği ve kategori bazında bir aday listesi var. | [K] [E3]; [T] |
| 2 | **Tier 1 alan adları colouring-core'dan alınır.** INSPIRE, CityGML ve Overture sadece `mappings`/referans olarak kullanılır. Core alanı fazla yerel ya da belirsizse (NLUD, EPC, dönem adları, `size_far_ratio`) ad Tier 1'e alınmaz; ya Tier 2 olur ya da açık soru olarak kalır. | [Ö] |
| 3 | **INSPIRE ve CityGML'in en büyük katkısı yeni alan değil, anlam iskeleti.** Yükseklikte alt/üst referans ve ölçüm durumu; tarihte olay türü ile başlangıç/bitiş/belirsiz nokta ayrımı; ve yaşam döngüsü durumu (`conditionOfConstruction`). Bunlar Tier 1 alanlarının zorunlu **metadata'sı** olarak alınmalı. | [K] [INSPIRE], [CITYGML]; [Ö] |
| 4 | **Yaş alanında kritik bir uyumsuzluk var.** Core'da `date_year` "Year construction started" [K]; CityGML'de `dateOfConstruction` "the date at which the construction was completed" [K]. Bu yüzden `date_year` ile `date_year_completed` v0'dan itibaren ayrı tutulmalı; biri diğerine kopyalanmamalı. | [K]; [Ö] |
| 5 | **Olgun kategoriler:** Location (kimlik), Land Use, Age & History (yapım yılı), Size (yükseklik, kat). **v1'de olgunlaşabilecekler:** Typology, Construction, Planning (genel bayraklar), Energy (sadece kavram rezervi). **Bilerek seyrek bırakılacaklar:** Street Context, Team, Resilience, Community. | [Ö] |
| 6 | **Erken rezerve edilmesi gerekenler:** `building_id` kararlılığı ve yaşam döngüsü kuralı; tarih olayı semantiği; yükseklik referansları; kaynak ve yöntem metadata'sı (ölçülmüş / kayıtlı / çıkarımsal / modellenmiş); enerji değerlerinde "şema" ve "yöntem" beyanı. Bunlar sonradan değişirse bütün teslimatlar kırılır. | [Ö] |

---

## 2. 12 CCRP kategorisi ve colouring-core karşılığı

### 2.1 Karşılaştırma

| # | E1 kategorisi [K] [E1] | E1 bölümü [K] | Web sitesindeki ad [K] [WEB] | colouring-core `Category` enum ve UI adı [K] [CORE] | Uyumsuzluk |
| --- | --- | --- | --- | --- | --- |
| 1 | Location | Composition | Building location (and ID) | `location` "Location" | — |
| 2 | Land Use & Ownership | Composition | Land use (and economic activity) | `land-use` "Land Use & Ownership" | Sahiplik alanları kodda `community_public_ownership` içinde, Community'de |
| 3 | Typology | Composition | Building type and form | `typology-size` "Form & Size" | Kod, Typology ile Size'ı tek kategoride birleştiriyor |
| 4 | Age and History | Composition + Dynamics | Age and history | `age-history` | — |
| 5 | Size | Composition | Size | `typology-size` (birleşik) | Alanlar kodda `ConstructionDesign` kategorisine atanmış (ör. `size_height_apex`, `size_storeys_core`) |
| 6 | Construction | Composition | Construction and materials | `construction-design` | `construction_core_material` ve `construction_roof_shape` kodda `PlanningConservation` kategorisinde |
| 7 | Street Context | Composition | Street context (including green context) | `urban-infrastructure` + `water-green-infrastructure` | Kod bu kategoriyi ikiye bölüyor. E1 parsel alanını ve FAR'ı da buraya koyuyor |
| 8 | Team | Performance | **adı yok** (site 12 kategoriden söz ediyor ama 11 ad sayıyor) | **enum yok**; `team` harita stili ConstructionDesign altında | Kategori kodda bağımsız değil |
| 9 | Planning Controls | Dynamics | Planning context and protection | `planning-conservation` | — |
| 10 | Energy Performance | Performance | Energy performance | `energy-performance` + `retrofit-condition` | Kodda ayrı bir "Retrofit & Condition" kategorisi var; E1'de retrofit tarihi Age'e bağlı ("link to 'Age' only") |
| 11 | Resilience | Performance | Resilience and live disaster management | `disaster-management` | E1'de etkinleştirilmiş alt kategori yok |
| 12 | Community | Performance | Community value | `community` | — |

### 2.2 Gözlemler

| Gözlem | Etiket |
| --- | --- |
| `categories-config.ts` içindeki `aboutUrl` bağlantıları yanlış wiki başlıklarını gösteriyor. Ör. PlanningConservation → `#5-construction`, EnergyPerformance → `#8-team`, TypologySize → `#3-typology`. Kod ile manual arasında kategori eşlemesi kaymış. | [K] [CORE] |
| Alanların kategori atamaları güvenilir değil. Ör. `context_street_width` → EnergyPerformance, `sust_dec` → WaterGreenInfrastructure, `is_domestic` → EnergyPerformance. | [K] [CORE] |
| İngiltere'ye özgü kalıntılar: `current_landuse_group` (NLUD Groups), `uprns`, `ref_toid`, `sust_aggregate_estimate_epc` (EPC), `sust_dec` (DEC), `sust_breeam_rating`, `typology_style_period` (Tudor, Georgian, Victorian, …), `planning_list_grade`, `planning_in_apa`, `planning_glher_url`. | [K] alan tanımları; [T] Tier 2 sayılmaları |
| E3'e göre Tier 1 arazi kullanımında "around 10 classes" var. Core'un harita lejantında ise 13 sınıf görünüyor (`current_landuse_order`). Tam liste hangisi, manual mı kod mu, belirsiz. | [K] [E3], [CORE]; [?] |
| **Öneri:** Kategori alan kimliğinin parçası değildir; registry'de UI gruplaması olarak tutulur. Referans liste **E1'in 12 kategorisidir**. Kod enum'u sadece mevcut colouring-core UI'ına eşleme için not edilir. | [Ö] |

---

## 3. Kategori bazında Tier 1 / Tier 2 değerlendirmesi

### 3.0 Bütün alanlar için ortak kurallar

| Kural | Etiket |
| --- | --- |
| **Null her zaman "bilinmiyor" demektir.** `0`, `""` ya da uydurma bir sınıf asla "bilinmiyor" yerine kullanılmaz. `0` sadece gerçek sıfır demektir (ör. `size_storeys_basement = 0` "bodrumu yok" anlamına gelir). Boolean alanlarda `false` gerçek bir değerdir. | [Ö]; AGENTS.md ile uyumlu |
| **Her Tier 1 alanı için koleksiyon düzeyinde `source_type` beyan edilir.** Değerler core'un `commonSourceTypes` listesinin kısa kodlarıdır. Kaynak satırdan satıra değişiyorsa `<alan>_source_type` sütunu eklenir. Dayanak: E1 "Data on type of source type, source link/s and number of verifications are also collected for every class." | [K] [E1], [CORE]; [Ö] teslimata yansıması |
| **Her Tier 1 alanı için `method` beyan edilir:** `measured` / `recorded` / `inferred` / `modelled` / `crowdsourced`. INSPIRE ve CityGML'de yükseklik için `HeightStatusValue` = `measured` / `estimated` var; bu öneri onu genelleştiriyor. Ölçülmüş ve modellenmiş değerler aynı alanda karıştırılmaz. | [K] [INSPIRE], [CITYGML]; [Ö] |
| **Değerler kısa, kararlı kodlarla saklanır.** colouring-core'daki İngilizce metinler kod listesinde etiket olarak durur. | [Ö] |
| Core'un "doğrulama sayısı" (verification) kitle katkısına özgü bir platform kavramıdır. Pipeline teslimatında Tier 1 sütunu olmaz. | [T]; [?] |

### 3.1 Location

| Alan | Core anlamı [K] | Tip / birim | Global mi | INSPIRE / CityGML | Karar | Gerekçe |
| --- | --- | --- | --- | --- | --- | --- |
| `building_id` | E1 "Building footprint ID" | string | Evet | INSPIRE `inspireId` "identifier of the spatial object, not … of the real-world phenomenon" [K] | **v0-core** | Sözleşmenin anahtarı. Sürümler arası kararlılık kuralı v0'da konmalı [Ö] |
| `geometry` | taban izi | (Multi)Polygon | Evet | INSPIRE `HorizontalGeometryReferenceValue` (taban izi mi, çatı izi mi) [K] | **v0-core** | Taban izi mi çatı izi mi olduğu metadata'da beyan edilmeli [Ö][?] |
| `location_street`, `location_number`, `location_town`, `location_postcode` | E1 Addresses | string | Biçim ülkeye göre değişir | INSPIRE Addresses ayrı bir tema | v1-candidate | E1'de var. Değerler serbest metin; karşılaştırma için değil, kartta gösterim için [T] |
| `ref_osm_id` | E1 "OpenStreeMap ID" | string | Evet | INSPIRE `externalReference` [K] | v1-candidate | Global bir dış referans [T] |
| `location_latitude/longitude` | E1 "Centroid coordinates" | number | Evet | — | Saklanmaz | Geometriden türetilir; ikinci bir doğruluk kaynağı olmamalı [Ö] |
| `uprns`, `ref_toid`, ALKIS `gml_id` | Ulusal kimlikler | string | Hayır | `externalReference` | **tier2** | Ulusal kayıt sistemlerine bağlı [T] |

### 3.2 Land Use & Ownership

| Alan | Core anlamı [K] | Tip | Kod listesi | INSPIRE / CityGML / Overture | Karar | Gerekçe |
| --- | --- | --- | --- | --- | --- | --- |
| `current_landuse_order` | "This land use is shown on the map as" (NLUD Order, gruplardan otomatik türetilir) | enum | 13 sınıf (core lejantı) | INSPIRE `currentUse` (`residential`, `agriculture`, `industrial`, `commerceAndServices`, `ancillary`; genişletilebilirlik "narrower") [K]; CityGML `usage` (fiili) ile `function` (amaçlanan) ayrımı [K]; Overture `subtype` [K] | **v0-core** | Core'un harita teması, E3'ün Tier 1 örneği [K]. INSPIRE ile eşleme kayıplı: `ancillary` (yardımcı yapı) core'da yok [?] |
| `is_domestic` | E1 "Residential/Non-residential or Mixed Use" (genel arazi kullanımı) | enum (Yes, No, Mixed) | 3 sınıf | INSPIRE `residential` ve alt dalları | v1-candidate | Kaba ama küresel olarak en kolay doldurulan sınıf. Core bunu türetiyor [K]. v0'a alınıp alınmayacağı açık [?] |
| `current_landuse_group` | NLUD Groups, çok değerli | enum[] | NLUD | — | **tier2** (GB) | İngiliz sınıflaması [K] |
| `typology_original_use` | Binanın ilk yapıldığı kullanım | enum | `current_landuse_order` listesi [T] | CityGML `function` kısmen | v1-candidate | Dinamikler için değerli, ama nadiren kayıtlı |
| `community_public_ownership` | Sahiplik türü | enum (9 sınıf) | core | — | open-question | E1'de var, ama sahiplik kaydı ülkeye göre çok farklı ve hassas olabilir [?] |
| Ulusal fonksiyon kodları (`de_gebaeudefunktion`, …) | — | code | ulusal | CityGML `function` | **tier2** | `current_landuse_order` için crosswalk kaynağı |

### 3.3 Typology

| Alan | Core anlamı [K] | Tip | Kod listesi | Referans modeller | Karar | Gerekçe |
| --- | --- | --- | --- | --- | --- | --- |
| `building_attachment_form` | E1 "Adjacency/position" | enum | Detached, Semi-Detached, End-Terrace, Mid-Terrace | INSPIRE/CityGML'de doğrudan karşılığı yok [T] | v1-candidate | Küresel bir kavram ve tipolojinin girdisi. Geometriden türetilebilir [T] |
| `typology_classification` | E1 "Base type"; E3 "Basic typology … approximate height and density" | enum | 9 sınıf (Space Matrix) | — | v1-candidate (türetilmiş) | E3 bunu ortak isimlendirmenin örneği olarak veriyor [K]. Kat sayısı ve bitişiklikten türetilir [T] |
| `construction_roof_shape` | Çatı biçimi (E1'de Typology altında "Roof type") | enum | 10 sınıf, GEM'e referanslı | INSPIRE `roofType` (14 önerilen değer) [K]; CityGML `roofType` (CodeList) [K]; Overture `roof_shape` [K] | v1-candidate | Üç referans modelde de var; en iyi desteklenen kavramlardan biri. Kategori: E1 Typology [K]; core Construction |
| `typology_style_period` | Tarihi dönem | enum | İngiliz dönemleri (Tudor, …, Victorian) | — | **tier2** | Dönem adları ülkeye özgü [K] |
| `typology_dynamic_classification` | E1 "Dynamic tissue classification" | enum | 3 sınıf | — | open-question | Ada ya da doku düzeyinde bir kavram; bina sözleşmesi için uygun mu belirsiz [?] |
| Ulusal konut tipolojileri (TABULA vb.) | E1 "Local typology" | code | ulusal | — | **tier2** | E1 bunu açıkça "local" olarak adlandırıyor [K] |

### 3.4 Age & History

| Alan | Core anlamı [K] | Tip | INSPIRE / CityGML | Karar | Gerekçe |
| --- | --- | --- | --- | --- | --- |
| `date_year` | "Year construction started (best estimate)" | integer (yıl) | INSPIRE `dateOfConstruction.beginning` [K]; CityGML'de doğrudan karşılığı yok [T] | **v0-core** | Core'un ana yaş alanı. E3: yaş verisi "allow[s] buildings from any architectural period from any country to be compared" [K] |
| `date_year_completed` | "Year construction completed if known" | integer | INSPIRE `dateOfConstruction.end` [K]; CityGML `dateOfConstruction` (completed) [K] | **v0-core** [Ö] | CityGML tabanlı ve kayıt tabanlı kaynakların doğal alanı. v0'da olmazsa üreticiler bitiş yılını `date_year`'a yazar ve anlam bozulur [Ö] |
| `date_lower`, `date_upper` | E1 "Earliest and latest construction dates". Core'da `date_lower` başlığı yanlışlıkla `date_year`'ınkiyle aynı | integer | INSPIRE `DateOfEvent` aralık örneği ("between 1800 and 1900") [K] | v1-candidate | Belirsizliği ifade eder. Rezerve edilmeli [Ö] |
| Olayı belirsiz yıl ("bilinen tek yıl, hangi aşama olduğu belirsiz") | — | — | INSPIRE `anyPoint` [K] | open-question | Core'da karşılığı yok. `date_year`'a mı yazılmalı, yoksa ayrı bir beyan mı gerekmeli? [?] |
| `date_year_inferred` (+ alt/üst) | Otomatik çıkarım | integer | — | **Ayrı alan yerine `method = inferred`** [Ö] | Core çıkarımı ayrı alanda tutuyor [K]. Teslimatta yöntem bilgisi metadata'da olduğu için ayrı alan gerekmez. Core'dan sapma olduğu için açık soru [?] |
| `age_extension_date` | "Date of significant extensions" | integer | CityGML `constructionEvent` [K] | v1-candidate | Dinamikler için gerekli |
| `age_retrofit_date` | "Date of last significant retrofit" | integer | INSPIRE `dateOfRenovation` "Date of last major renovation" [K]; CityGML `constructionEvent` [K] | v1-candidate, **erken rezerve** | E1 retrofit tarihini Age'e bağlıyor [K]. Core'da `sust_retrofit_date` adıyla bir tekrar var [K]; Tier 1'de tek ad kullanılmalı [Ö] |
| `facade_year`, `age_cladding_date` | Cephe ve kaplama tarihi | integer | — | v1+ / open | E1'de var [K]; pipeline kaynaklarında nadir |
| `survival_status` | Tarihi haritaya göre hayatta kalma (4 sınıf) | enum | — | v1+ | Tarihi harita karşılaştırmasına özgü bir yöntem [K] |
| Yaşam döngüsü durumu (yıkılmış, yapım aşamasında, …) | Core'da temiz bir karşılığı yok | enum | INSPIRE ve CityGML `conditionOfConstruction`: `declined`, `demolished`, `functional`, `projected`, `ruin`, `underConstruction` [K] | open-question, **kural olarak erken rezerve** | Core adı yok. Bir INSPIRE/CityGML adı alınmalı mı? [?] |

### 3.5 Size

| Alan | Core anlamı [K] | Tip / birim | INSPIRE / CityGML / Overture | Karar | Gerekçe |
| --- | --- | --- | --- | --- | --- |
| `size_height_apex` | "Height to apex (m)" | number, m | INSPIRE `HeightAboveGround` (`value` m; `lowReference`/`heightReference`; `status`) [K]; CityGML `Height` (aynısı) [K]; Overture `height` "lowest to highest point" [K] | **v0-core** | Üç modelde de var. **Referanslar zorunlu metadata olmalı** [Ö]. Apex'in `highestPoint` mı `highestRoofEdge` mi olduğu açık [?] |
| `size_height_eaves` | "Height to eaves (m)" | number, m | INSPIRE `generalEave` / `lowestEave` / `highestEave` referansları [K] | v1-candidate | Kavram net, veri nadir |
| `size_storeys_core` | "Core number of floors"; E1 "Storeys-Core number" | integer | INSPIRE `numberOfFloorsAboveGround` [K]; CityGML `storeysAboveGround` [K]; Overture `num_floors` [K] | **v0-core** | Core, çatı katını ayrı tutuyor (`size_storeys_attic`); "core" bu yüzden çatı katı ve bodrum hariç demek [T]. Referans modellerle eşleme bu nedenle kayıplı olabilir [?] |
| `size_storeys_basement` | "Number of floors beneath ground level" | integer | INSPIRE `numberOfFloorsBelowGround` [K]; CityGML `storeysBelowGround` [K]; Overture `num_floors_underground` [K] | v1-candidate | İyi tanımlı; `0` gerçek bir değerdir |
| `size_storeys_attic` | "Number of floors within roof space" | integer | — | v1-candidate | `size_storeys_core` tanımını tamamlar |
| `size_floor_area_ground` | "Ground floor area (m²)" | number, m² | INSPIRE `officialArea` (CLGE referansları: `externalArea`, `internalArea`, …) [K] | v1-candidate | Taban izinden hesaplanabilir; hesaplandığı belirtilmeli |
| `size_floor_area_total` | "Total floor area (m²)" | number, m² | INSPIRE CLGE alan referansı [K] | v1-candidate + **zorunlu alan referansı** | Brüt mü net mi tanımlı değil; ülkeler arası farklılık büyük [?] |
| `size_width_frontage` | "Frontage width (m)" | number, m | — | v1+ | Sokak ilişkisi gerektirir |
| Ulusal alan normları (BGF/NGF, DIN 277) | — | number | — | **tier2** | Ulusal tanımlar |

### 3.6 Construction

| Alan | Core anlamı [K] | Kod listesi | Referans modeller | Karar | Gerekçe |
| --- | --- | --- | --- | --- | --- |
| `construction_core_material` | "main structural material" | 8 sınıf (Wood, Stone, Brick, Steel, Reinforced Concrete, Other Metal, Other Natural, Other Man-Made) | INSPIRE `materialOfStructure` (EMS-98/GEM benzeri, yaklaşık 15 önerilen değer) [K]; E3 GEM'i örnek gösteriyor [K] | v1-candidate | Kavram küresel ve deprem/enerji için önemli; veri çoğu yerde kitle katkısı ya da modelden geliyor [T] |
| `construction_structural_system` | 3 sınıf (masonry, frame, other) | core | E3 "GEM … construction system taxonomy" [K] | v1+ | Sınıf listesi kaba |
| `construction_external_wall` | 13 sınıf | core | INSPIRE `materialOfFacade` (12 önerilen değer) [K]; Overture `facade_material` [K] | optional-profile (malzeme) | Enerji ve retrofit için değerli; kaynak lisansları sorunlu (ISBE) |
| `construction_roof_covering` | 8 sınıf | core | INSPIRE `materialOfRoof` [K]; Overture `roof_material` [K] | optional-profile (malzeme) | Aynı gerekçe |
| `construction_foundation`, `construction_secondary_materials`, pencere doğraması | — | core | — | v1+ / tier2 | Pipeline kaynaklarında nadir |
| Ulusal malzeme ve çatı kodları (AdV, ISBE) | — | ulusal | — | **tier2** | Crosswalk kaynağı |

### 3.7 Street Context

| Alan | Core anlamı [K] | Karar | Gerekçe |
| --- | --- | --- | --- |
| `size_plot_area_total` | "Total area of plot (m²)"; E1 bunu Street Context'e koyuyor | v1-candidate (parsel profili) | Kadastroya bağlı; parsel ayrı bir koleksiyon olabilir [?] |
| `size_far_ratio` | Başlığı "FAR ratio (percentage of plot covered by building)" | open-question | Başlık, FAR (kat alanı katsayısı) değil taban alanı oranı tanımlıyor [K]. İki farklı kavram karışmış; Tier 1'e alınmadan önce netleşmeli [?] |
| `context_street_width`, `context_walkability_index`, ağaç ve yeşil alan mesafeleri | Hesaplanmış göstergeler | optional-profile (bağlam) | Değerler yönteme bağlı; karşılaştırma için yöntem beyanı şart [T] |
| `energy_green_roof` | "green walls/green roof" (E1 Street Context altında) | v1-candidate | Boolean ve küresel; görüntüden tespit edilebilir [T] |

### 3.8 Team

| Alan | Karar | Gerekçe |
| --- | --- | --- |
| `designers`, `builder`, `developer_type`, `designer_awards`, … | **ertelenmiş** (Tier 1 iskeletinde yer yok) | Kişi adları; kişisel veri ve lisans riski. E3 kişisel veri standartlarının ülkeye göre değiştiğini söylüyor [K]. Pipeline teslimatına uygun değil [Ö] |

### 3.9 Planning Controls

| Alan | Core anlamı [K] | Karar | Gerekçe |
| --- | --- | --- | --- |
| `planning_world_heritage_site` | "part of a World Heritage Site?" | v1-candidate | UNESCO küresel bir liste [T] |
| `planning_listed` | "Is this a listed building?"; E1 bunu genel ifadeyle soruyor: "On a protected building list?" | v1-candidate (boolean, genel anlamda) | **Ad core'dan, anlam E1'in genel ifadesinden** [T]. Koruma derecesi ve liste kimliği Tier 2 kalır. Not: önceki cevapta bu alanı Tier 2 saymıştım; boolean kavram küresel olduğu için düzeltiyorum |
| `planning_in_conservation_area` | E1 "In a protected area?" | v1-candidate (boolean) | Aynı gerekçe [T] |
| `planning_demolition_proposed` | E1 "planned for demolition?" | v1+ | Dinamiklerle bağlantılı; kaynak genelde planlama portalları |
| `planning_list_grade`, `planning_in_apa`, `planning_local_list`, ulusal statüler | — | **tier2** | Ulusal hukuk [K] |

### 3.10 Energy Performance

| Alan | Core anlamı [K] | Referans modeller | Karar | Gerekçe |
| --- | --- | --- | --- | --- |
| `sust_aggregate_estimate_epc` | "Residential Building Energy Rating", A–G | INSPIRE `energyPerformance` (A–G, `dateOfAssessment`) [K] | **Ad tier2 (GB); kavram optional-profile** | Harfler aynı ama ölçekler ulusal ve karşılaştırılamaz (her ülkenin sınıf sınırları farklı) [T]. Tier 1 sadece kavramı rezerve eder: sınıf, **şema**, değerlendirme tarihi ve yöntem [Ö] |
| `sust_dec`, `sust_breeam_rating` | GB / ticari şemalar | — | **tier2** | Ulusal ya da ticari şemalar [K] |
| Enerji talebi veya tüketimi (kWh/m²a) | Core'da yok | INSPIRE'da yok [T] | optional-profile, **erken rezerve** | `method = measured` / `modelled`, referans alan yöntemi ve senaryo zorunlu [Ö] |
| `energy_solar` | "Does the building have solar panels?" | INSPIRE `HeatingSourceValue` listesinde `solarHeating` var ama bu farklı bir kavram [K] | v1-candidate | Boolean, küresel, görüntüden tespit edilebilir |
| `age_retrofit_date` | (§3.4) | INSPIRE `dateOfRenovation` [K] | v1-candidate | Tek ad; E1 "link to 'Age' only" [K] |
| Yalıtım / zarf iyileştirme göstergeleri | **Core'da alan yok** | INSPIRE'da yok [T] | open-question | Uydurulmamalı. Ya ileride CCRP'ye önerilir, ya da şimdilik Tier 2 / profil olarak kalır [?] |
| `sust_life_expectancy` | "Expected lifespan for typology" | — | v1+ | E1'de var; tipoloji düzeyinde bir değer |
| Isıtma kaynağı | Core'da yok | INSPIRE `heatingSource` [K] | open-question | Enerji profili adayı [?] |

### 3.11 Resilience

| Alan | Karar | Gerekçe |
| --- | --- | --- |
| `disaster_*` | **ertelenmiş** | E1'de etkinleştirilmiş alt kategori yok [K]. Core'daki alanlar canlı olay toplama aracı; bina teslimatının parçası değil [T] |

### 3.12 Community

| Alan | Karar | Gerekçe |
| --- | --- | --- |
| `community_*`, `likes_total` | **ertelenmiş** (sözleşme dışı) | Kullanıcı görüşleri; platformda toplanır, pipeline teslimatıyla gelmez [T] |
| `community_activities` (topluluk kullanımı) | open-question | E1'de var; kaynak çoğu yerde yerel |

### 3.13 Dinamik, retrofit ve enerji kavramları: erken rezerv değerlendirmesi

| Kavram | Core | INSPIRE | CityGML | Öneri | Erken rezerve? |
| --- | --- | --- | --- | --- | --- |
| Yapım başlangıcı ve bitişi | `date_year`, `date_year_completed` [K] | `DateOfEvent` beginning/end/anyPoint [K] | `dateOfConstruction` = bitiş [K] | İkisi de v0 | **Evet** [Ö] |
| Yaş belirsizliği | `date_lower`, `date_upper` [K] | aralık örnekleri [K] | — | v1 | **Evet**: adlar şimdiden ayrılmalı [Ö] |
| Retrofit tarihi | `age_retrofit_date` ve `sust_retrofit_date` (tekrar) [K] | `dateOfRenovation` [K] | `constructionEvent` [K] | v1, tek ad `age_retrofit_date` | **Evet** [Ö] |
| Eklenti tarihi | `age_extension_date`, `extension_year` (tekrar) [K] | — | `constructionEvent` [K] | v1, tek ad `age_extension_date` | Hayır |
| Hayatta kalma ve yıkım | `survival_status`, `planning_demolition_proposed` [K] | `conditionOfConstruction`, `dateOfDemolition` [K] | aynısı [K] | Kural v0'da: yıkılan bina silinmez, işaretlenir ve `building_id` korunur. Alan v1'de | **Evet**, kural olarak [Ö] |
| Yalıtım / zarf iyileştirme | yok | yok | yok | Uydurulmaz; open-question | Hayır [?] |
| Enerji sınıfı | EPC/DEC (GB) [K] | `energyPerformance` A–G [K] | — | optional-profile; şema beyanı zorunlu | **Evet**, kavram ve metadata olarak [Ö] |
| Enerji yöntemi (ölçülmüş / modellenmiş) | yok | `HeightStatusValue` benzeri sadece yükseklik için [K] | aynısı | Genel `method` metadata'sı | **Evet** [Ö] |
| Malzeme ve çatı biçimi | core sınıf listeleri [K] | `materialOf*`, `roofType` [K] | `roofType` [K] | v1 | Hayır |
| Topluluk ve planlama bayrakları | core [K] | — | — | Planlama: v1 boolean. Topluluk: sözleşme dışı | Hayır |

---

## 4. Önerilen Tier 1 iskeleti

**GeoParquet:** "required column" = sütun her teslimatta bulunur, değer bilinmiyorsa typed null olur. "optional column" = bulunursa registry'deki anlama uyar.
**PMTiles:** "required if theme available" = o alanı okuyan tema teslimatta `available` beyan edildiyse tile property'si zorunludur. Bu, Portolan P4'teki Colouring çapraz kontrolüdür; yeni bir tile kuralı değildir.

### 4.1 Alanlar

| id | Kategori (E1) | Status | Tip | Birim | Kısa anlam | Neden burada | Kaynak dayanağı | Frontend | GeoParquet | PMTiles |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `building_id` | Location | v0-core | string | — | Kararlı bina kimliği | Anahtar | E1 footprint ID; INSPIRE `inspireId` | card, seçim | required column | **always required** |
| `geometry` | Location | v0-core | (Multi)Polygon | CRS | Taban izi | Harita | Core, INSPIRE | harita | required column | always required (Portolan) |
| `current_landuse_order` | Land Use | v0-core | enum (13) | — | Baskın fiili kullanım | Core harita teması; E3 Tier 1 örneği | CORE, E3; map: INSPIRE `currentUse`, CityGML `usage`, OVT `subtype` | theme, filter, card | required column | required if theme available |
| `date_year` | Age & History | v0-core | integer | yıl | Yapım başlangıcı (en iyi tahmin) | Core'un ana yaş alanı | CORE; map: INSPIRE `beginning` | theme, filter, card | required column | required if theme available |
| `date_year_completed` | Age & History | v0-core | integer | yıl | Yapım bitişi | CityGML ve kayıt kaynaklarıyla uyum | CORE; map: CityGML `dateOfConstruction`, INSPIRE `end` | theme, card | required column | required if theme available |
| `size_height_apex` | Size | v0-core | number | m | Zeminden çatı tepesine yükseklik | 3D ve yükseklik teması | CORE; map: INSPIRE/CityGML `Height`, OVT `height` | theme, 3d, card | required column | required if theme or 3D available |
| `size_storeys_core` | Size | v0-core | integer | kat | Ana kat sayısı (çatı katı ve bodrum hariç) | Evrensel, tipolojinin girdisi | CORE; map: `numberOfFloorsAboveGround`, `storeysAboveGround`, `num_floors` | theme, filter, card | required column | required if theme available |
| `date_lower` / `date_upper` | Age & History | v1-candidate | integer | yıl | Başlangıç yılı aralığı | Belirsizlik | CORE, E1; INSPIRE aralık | card | optional column | never required |
| `age_retrofit_date` | Age & History | v1-candidate | integer | yıl | Son büyük retrofit | Dinamik ve enerji | CORE, E1; INSPIRE `dateOfRenovation` | theme, card | optional column | required if theme available |
| `age_extension_date` | Age & History | v1-candidate | integer | yıl | Önemli eklenti tarihi | Dinamik | CORE, E1; CityGML `constructionEvent` | card | optional column | never required |
| `survival_status` | Age & History | v1-candidate | enum (4) | — | Tarihi haritaya göre hayatta kalma | Dinamik | CORE, E1 | theme, card | optional column | required if theme available |
| *(yaşam döngüsü durumu, ad açık)* | Age & History | open-question | enum (6) | — | functional / demolished / … | Sürümler arası takip | INSPIRE/CityGML `conditionOfConstruction` | filter, card | — | — |
| `is_domestic` | Land Use | v1-candidate | enum (3) | — | Konut / değil / karma | E1 genel arazi kullanımı | CORE, E1 | filter, card | optional column | required if theme available |
| `typology_original_use` | Land Use | v1-candidate | enum | — | İlk kullanım | Dinamik | CORE, E1 | card | optional column | never required |
| `building_attachment_form` | Typology | v1-candidate | enum (4) | — | Bitişiklik biçimi | Tipoloji girdisi | CORE, E1 | theme, card | optional column | required if theme available |
| `typology_classification` | Typology | v1-candidate | enum (9) | — | Temel tipoloji (Space Matrix) | E3 ortak isimlendirme örneği | CORE, E3 | theme | optional column | required if theme available |
| `construction_roof_shape` | Typology / Construction | v1-candidate | enum (10) | — | Çatı biçimi | Üç modelde de destekli | CORE (GEM); map: INSPIRE/CityGML `roofType`, OVT `roof_shape` | theme, card | optional column | required if theme available |
| `size_height_eaves` | Size | v1-candidate | number | m | Saçak yüksekliği | 3D ayrıntısı | CORE; INSPIRE eave referansları | 3d, card | optional column | never required |
| `size_storeys_basement` | Size | v1-candidate | integer | kat | Zemin altı kat sayısı | Tamamlayıcı | CORE; INSPIRE, CityGML, OVT | card | optional column | never required |
| `size_storeys_attic` | Size | v1-candidate | integer | kat | Çatı katı sayısı | `size_storeys_core` tanımını tamamlar | CORE | card | optional column | never required |
| `size_floor_area_ground` | Size | v1-candidate | number | m² | Zemin kat alanı | Yoğunluk ve enerji | CORE; INSPIRE CLGE | card | optional column | never required |
| `size_floor_area_total` | Size | v1-candidate | number | m² | Toplam kat alanı (**referans zorunlu**) | Enerji yoğunluğu | CORE; INSPIRE CLGE | card, filter | optional column | never required |
| `construction_core_material` | Construction | v1-candidate | enum (8) | — | Ana taşıyıcı malzeme | Deprem ve enerji | CORE; E3 GEM; INSPIRE `materialOfStructure` | theme, card | optional column | required if theme available |
| `energy_solar` | Energy | v1-candidate | boolean | — | Güneş paneli var mı | Küresel, tespit edilebilir | CORE | theme, filter | optional column | required if theme available |
| `energy_green_roof` | Street Context | v1-candidate | boolean | — | Yeşil çatı veya duvar | Küresel | CORE, E1 | theme, filter | optional column | required if theme available |
| `planning_world_heritage_site` | Planning | v1-candidate | boolean | — | UNESCO alanında mı | Küresel | CORE, E1 | filter, card | optional column | never required |
| `planning_listed` | Planning | v1-candidate | boolean | — | Koruma listesinde mi (genel anlam) | E1 genel ifadesi | CORE ad, E1 anlam | theme, filter | optional column | required if theme available |
| `planning_in_conservation_area` | Planning | v1-candidate | boolean | — | Korunan alanda mı | E1 genel ifadesi | CORE ad, E1 anlam | filter, card | optional column | never required |
| `location_street`, `location_number`, `location_town`, `location_postcode` | Location | v1-candidate | string | — | Adres | Kartta gösterim | CORE, E1 | card | optional column | never required |
| `ref_osm_id` | Location | v1-candidate | string | — | OSM kimliği | Küresel dış referans | CORE, E1; INSPIRE `externalReference` | detail-only | optional column | never required |
| `size_plot_area_total` | Street Context | optional-profile (parsel) | number | m² | Parsel alanı | Kadastroya bağlı | CORE, E1 | card | optional column | never required |
| Enerji sınıfı ve şeması | Energy | optional-profile (enerji) | enum + şema | — | Ulusal sertifika sınıfı | Karşılaştırılamaz ölçekler | INSPIRE `energyPerformance`; CORE EPC (GB) | theme (yerel) | optional column | required if theme available |
| Enerji talebi veya tüketimi | Energy | optional-profile (enerji) | number | kWh/m²a | Ölçülmüş ya da modellenmiş | Yöntem zorunlu | — | theme, card | optional column | required if theme available |
| `construction_external_wall`, `construction_roof_covering` | Construction | optional-profile (malzeme) | enum | — | Cephe ve çatı malzemesi | Enerji ve retrofit | CORE; INSPIRE `materialOf*` | theme, card | optional column | required if theme available |
| `size_far_ratio` | Street Context | open-question | number | — | FAR mı, taban alanı oranı mı? | Tanım çelişkili | CORE | — | — | — |

### 4.2 Tier 1 alanı başına zorunlu koleksiyon metadata'sı

Bu metadata'nın yeri Portolan P1'deki `colouring:` alanlarıdır. Yeri değişmez; sadece içeriği öneridir.

| Metadata | Hangi alanlar | Değerler | Etiket |
| --- | --- | --- | --- |
| `source_type` | Hepsi | Core `commonSourceTypes` listesinin kısa kodları | [K] kaynak; [Ö] kodlar |
| `method` | Hepsi | `measured`, `recorded`, `inferred`, `modelled`, `crowdsourced` | [Ö]; [K] INSPIRE `HeightStatusValue` |
| `low_reference`, `high_reference` | `size_height_*` | INSPIRE `ElevationReferenceValue` kodları (ör. `lowestGroundPoint`, `highestRoofEdge`, `highestPoint`, `generalEave`) | [K] [INSPIRE]; [Ö] zorunluluk |
| `area_reference` | `size_floor_area_*` | INSPIRE CLGE referansları (`externalArea`, `internalArea`, …) ya da ulusal bir norm | [K]; [Ö] |
| `geometry_reference` | `geometry` | INSPIRE `HorizontalGeometryReferenceValue` (taban izi ya da çatı izi) | [K]; [?] |
| `scheme`, `assessment_date` | Enerji sınıfı | Şema kimliği; değerlendirme yılı | [K] INSPIRE `dateOfAssessment`; [Ö] |
| `coverage` | Hepsi | Araçla hesaplanır | Taslak §2 ile aynı |

---

## 5. Tier 2 politikası

| Konu | Kural | Etiket |
| --- | --- | --- |
| **Ad** | Ulusal alanlar `<iso2>_<ad>` biçiminde (`de_gebaeudefunktion`, `gb_planning_list_grade`). Küresel kaynaklar `<kaynak>_<ad>` biçiminde (`osm_building`, `overture_subtype`). İki harfli ülke önekleri ve kayıtlı kaynak önekleri Tier 1 için yasaktır. Tier 1 adı asla farklı bir anlamla kullanılamaz. | [Ö]; E3 "Tier 2 … specific to individual national platforms" [K] |
| **Zorunlu beyan** | Teslimatta bulunan her Tier 2 alanı `colouring:attributes` içinde `tier: 2`, etiket, tip, birim ve (kategorikse) kod listesiyle beyan edilir. Kod listesi olmayan ham kod teslimata girmez. | [Ö] |
| **Tier 1'e crosswalk ne zaman** | Aynı kavram için bir Tier 1 alanı varsa ve her kaynak kodu için yazılı bir kural bulunuyorsa. `crosswalk_from` ve `lossy` beyan edilir. Bire çok ve belirsiz kodlar tahmin edilmez; `Unclassified` ya da null bırakılır. Crosswalk'u ülke reposu yapar. | [Ö]; colouring-tier-kararlari K4 |
| **Ne zaman sadece yerel kalır** | (a) Tier 1'de karşılığı yoksa. (b) Kavram tanım gereği ulusalsa: hukuki statü, kadastro kimliği, ulusal alan normu, ulusal dönem adları. (c) Eşleme belirsizse; eşleme kararı verilene kadar yerel kalır. | [T] |
| **Ne zaman kartta gösterilir** | Beyan edildiyse, "yerel ayrıntı" olarak genel bir satırda. Tier 1 değeri bir Tier 2 alanından türetildiyse ikisi yan yana gösterilir (crosswalk şeffaflığı). | [Ö] |
| **Ne zaman yerel tema olur** | Teslimat Portolan stilini (P5) ve lejant metadata'sını kendisi getirirse. Tema "yerel, karşılaştırılamaz" diye işaretlenir; paylaşılan Tier 1 paletlerini kullanmaz; hiçbir Tier 1 temasının yerini almaz. | [Ö] |
| **Asla generic contract'ın parçası değildir** | Kişisel veri; lisans kısıtlı alanlar; anlamı teslimattan teslimata değişen alanlar; plugin'de özel kod gerektiren her şey. Ayrıca hiçbir Tier 1 teması bir Tier 2 alanını `requires` listesine alamaz. | [Ö]; AGENTS.md |
| **Tier 1'e terfi** | Şu koşulların hepsi gerekir: (1) en az iki bağımsız ülke ya da kaynak aynı kavramı eşlenebilir sınıflarla teslim ediyor; (2) colouring-core'da bir adı var ya da CCRP upstream'ine önerildi; (3) anlam, birim, null semantiği ve referanslar yazılı; (4) registry'ye PR ile ve contract sürümü artırılarak girer. | [Ö]; E3 Tier 1 isimlendirmesi core'da [K] |

**Ülkeye esnek bırakılacak Tier 2 aileleri** [T][Ö]:

- Ulusal fonksiyon ve kullanım kodları
- Kadastro ve ulusal bina kimlikleri
- Ulusal yaş sınıfları ve dönem adları
- Ulusal çatı, malzeme ve bitişiklik kodları
- Hukuki koruma statüleri ve dereceleri
- Ulusal enerji sertifikaları ve modelleri
- Ulusal alan normları
- Yerel konut tipolojileri
- Arazi kullanımı ve parsel ayrıntıları

---

## 6. v0 çekirdek, v1 genişleme, ertelenen alanlar

### 6.1 Stratejik soruların cevapları

| Soru | Cevap | Etiket |
| --- | --- | --- |
| 12 kategorinin tamamında Tier 1 var mı? | **Hayır.** Bir v0 çekirdeği ve kategori bazında bir aday listesi var. | [K] [E3], [CORE]; [T] |
| Tier 1 için şimdi olgun kategoriler | Location (kimlik), Land Use, Age & History (yapım yılları), Size (yükseklik, kat) | [Ö] |
| Bilerek seyrek ya da ertelenmiş kalacaklar | Street Context (profil), Team, Resilience, Community; Energy sadece kavram rezervi olarak | [Ö] |
| Erken rezerve edilmesi gereken kavramlar | `building_id` kararlılığı ve yıkılan binaların silinmeyip işaretlenmesi; tarih olayı semantiği (başlangıç / bitiş / aralık); yükseklik referansları; `source_type` + `method`; enerji şeması ve yöntemi; tek retrofit adı (`age_retrofit_date`) | [Ö] |

### 6.2 v0 minimum Tier 1

| Alan | Status |
| --- | --- |
| `building_id`, `geometry` | v0-core |
| `current_landuse_order` | v0-core |
| `date_year`, `date_year_completed` | v0-core (ikisi de sütun; üretici kaynağın olayına uyanı doldurur, kopyalama yapmaz) |
| `size_height_apex` | v0-core (referanslar zorunlu metadata) |
| `size_storeys_core` | v0-core |
| v0'da getirilen kurallar | `source_type` + `method` beyanı; `building_id` kararlılığı; yıkılan binanın silinmemesi |

### 6.3 v1 genişleme adayları

- **Age:** `date_lower`, `date_upper`, `age_retrofit_date`, `age_extension_date`, `survival_status`, yaşam döngüsü durumu (ad açık)
- **Land Use:** `is_domestic`, `typology_original_use`
- **Typology:** `building_attachment_form`, `typology_classification`, `construction_roof_shape`
- **Size:** `size_height_eaves`, `size_storeys_basement`, `size_storeys_attic`, `size_floor_area_ground`, `size_floor_area_total`
- **Construction:** `construction_core_material`
- **Energy / Street Context:** `energy_solar`, `energy_green_roof`
- **Planning:** `planning_world_heritage_site`, `planning_listed`, `planning_in_conservation_area`
- **Location:** adres alanları, `ref_osm_id`

### 6.4 Opsiyonel profiller

| Profil | İçerik |
| --- | --- |
| Enerji | Sertifika sınıfı + şema; ölçülmüş ya da modellenmiş talep |
| Malzeme | Cephe malzemesi, çatı kaplaması |
| Parsel ve bağlam | Parsel alanı, sokak ve yeşil alan göstergeleri |

### 6.5 Ertelenen ya da sözleşme dışında kalanlar

- Team
- Community görüşleri
- Resilience / disaster
- `typology_style_period` (Tier 2)
- `date_year_inferred` ayrı alan olarak (yöntem metadata'sıyla karşılanıyor)
- `size_far_ratio` (tanımı netleşene kadar)
- Yalıtım göstergeleri (kaynak yok)

---

## 7. Açık karar soruları

| # | Soru |
| --- | --- |
| Q1 | Olayı belirsiz yapım yılı (INSPIRE `anyPoint`) nereye yazılacak: `date_year`'a mı, ayrı bir beyana mı? Yaş teması `date_year` ile `date_year_completed`'i birleştirmeli mi? |
| Q2 | Tier 1 arazi kullanımı listesi: core lejantındaki 13 sınıf mı, E3'teki "around 10" mu? INSPIRE `ancillary`'nin karşılığı (yardımcı yapılar) eklenmeli mi? |
| Q3 | `size_height_apex` için üst referans `highestPoint` mı, `highestRoofEdge` mi? İkisi de "apex" sayılabilir mi? |
| Q4 | `size_storeys_core` "çatı katı ve bodrum hariç" olarak sabitlensin mi? Referans modellerdeki "above ground" sayımlarıyla eşleme kayıplı sayılsın mı? |
| Q5 | Yaşam döngüsü durumu için core'da ad yok. INSPIRE/CityGML `conditionOfConstruction` kod listesi yeni bir Tier 1 alanı olarak mı alınmalı, yoksa önce CCRP'ye mi önerilmeli? |
| Q6 | `planning_listed` ve `planning_in_conservation_area` E1'in genel anlamıyla Tier 1 boolean olarak kabul edilsin mi? |
| Q7 | Enerji sınıfı Tier 1'de kavram olarak mı rezerve edilsin (şema zorunlu), yoksa tamamen profil ve Tier 2'ye mi bırakılsın? |
| Q8 | `date_year_inferred` ayrı alan yerine `method = inferred` ile ifade edilsin mi? Bu, core'dan bilinçli bir sapma olur. |
| Q9 | `size_far_ratio`: core başlığı taban alanı oranı tarif ediyor. Tier 1'de FAR mı, taban alanı oranı mı, ikisi ayrı mı olacak? |
| Q10 | Referans kategori listesi E1'in 12 kategorisi mi olacak? Core UI'ına (Form & Size birleşik, Street Context ikiye bölünmüş, Team yok) nasıl eşlenecek? |
| Q11 | Yalıtım ve zarf iyileştirme göstergesi CCRP upstream'ine yeni bir Tier 1 adayı olarak önerilecek mi? |

---

## Kaynaklar

- **[E1]** CCRP Open Manual, *E1. Data*: <https://github.com/colouring-cities/manual/wiki/E1.--DATA> (2026-10'da okundu)
- **[E3]** CCRP Open Manual, *E3. Data Standards*: <https://github.com/colouring-cities/manual/wiki/E3.-DATA-STANDARDS> (2026-10'da okundu)
- **[WEB]** <https://colouringcities.org/> (2026-10'da okundu)
- **[CORE]** colouring-core, commit `c7305f83`, yerel kopya `geolibre/colouring-core`: `app/src/frontend/config/categories-config.ts`, `data-fields-config.ts`, `category-maps-config.ts`
- **[INSPIRE]** D2.8.III.2 *Data Specification on Buildings – Technical Guidelines* v3.0 (HTML: <https://inspire-mif.github.io/technical-guidelines/data/bu/dataspecification_bu.html>). Core kod listeleri INSPIRE Registry'den alındı (`ConditionOfConstructionValue`, `ElevationReferenceValue`, `CurrentUseValue`, `HeightStatusValue`). Extended şemanın kod listeleri Annex C.2'de "informative".
- **[CITYGML]** OGC 20-010, *CityGML 3.0 Conceptual Model*: <https://docs.ogc.org/is/20-010/20-010.html>. `AbstractConstruction`, `ConstructionEvent`, `Height`, `AbstractBuilding` tabloları. `RoofTypeValue`, `BuildingFunctionValue`, `BuildingUsageValue` ve `EventValue` «CodeList» stereotipinde.
- **[OVT]** Overture Maps building schema: <https://docs.overturemaps.org/schema/reference/buildings/building/> (ikincil referans; yapım yılı ya da enerji alanı yok)
- Önceki karar notu: `geolibre/docs/colouring-tier-kararlari.md`

# Assets beheren — Gebruikersgids

Volledige gids voor het bekijken, aanmaken, bewerken en opvolgen van IT-activa.

> Technische details (API-endpoints, entiteiten, schema) staan niet in deze gids. Zie [`docs/BACKEND-ARCHITECTURE.md`](../../BACKEND-ARCHITECTURE.md), [`docs/DATA-MODEL.md`](../../DATA-MODEL.md) en de live Swagger UI op `/swagger`.

---

## 1. Overzicht

Assets zijn de kern van Djoppie Inventory. Elk geregistreerd IT-apparaat of -accessoire is een asset met een unieke, automatisch gegenereerde code. Je kunt assets:

- bekijken en doorzoeken via de inventarislijst
- aanmaken (handmatig, via sjabloon, bulk of CSV-import)
- bewerken (eigenaar, locatie, status, technische info)
- opvolgen via de historiek (events en rollout-bewegingen)

---

## 2. Assets bekijken

### Inventarislijst

Navigeer via **Activa** in de zijbalk (route `/inventory/assets`). De lijst toont alle assets met statusbadge, eigenaar en gebouw.

Gebruik de **zoekbalk** om te filteren op asset-code, naam, merk, model, eigenaar of gebouw. Gebruik de **statusfilter** om te beperken tot één status. Via het **dienst-/sectorfilter** (uitklapbaar paneel) filter je op dienst of sector — diensten worden gegroepeerd per sector in een compacte kaartweergave.

### Asset-detailpagina

Klik op een asset-kaart om de detailpagina te openen (`/inventory/assets/:id`). Hier vind je alle informatie gegroepeerd in secties:

**Identificatie**

| Veld | Uitleg |
|------|--------|
| Asset-code | Unieke code, auto-gegenereerd (zie §3) |
| Asset-naam | Officiële apparaatnaam (vaak de Intune DeviceName) |
| Alias | Optionele leesbare naam |
| Categorie | Bijv. Computing, Peripherals, Displays |
| Asset type | Specifiek type binnen de categorie (bijv. Laptop, Monitor) |
| Status | Huidige operationele status |

**Toewijzingsgegevens**

| Veld | Uitleg |
|------|--------|
| Eigenaar | Naam van de hoofdgebruiker (free-text) |
| Medewerker | Gekoppelde medewerker uit het medewerkersregister (FK) |
| Dienst / Afdeling | Verantwoordelijke dienst of afdeling |
| Functietitel | Functie van de eigenaar |
| Kantoorlocatie | Kantoorlocatie van de eigenaar |

**Locatie-informatie**

De locatie van een asset is nu **gestructureerd** bepaald via twee velden:

| Veld | Uitleg |
|------|--------|
| Gebouw | Fysiek gebouw geselecteerd uit het gebouwenregister (FK naar `Building`) |
| Fysieke werkplek | Vaste werkplek binnen het gebouw — alleen voor locatie-gebonden assets (monitors, docking, desktops) (FK naar `PhysicalWorkplace`) |
| Installatielocatie | Vrij tekstveld voor extra locatiedetails zoals kamernummer of verdieping |

Voor **gebruiker-gebonden assets** (laptops) is het veld "Fysieke werkplek" leeg — het apparaat volgt de gebruiker, niet een vaste plek. Voor **locatie-vaste assets** (docking, monitors) is de fysieke werkplek wél ingevuld.

**Technische details**

| Veld | Uitleg |
|------|--------|
| Merk | Fabrikant (bijv. Dell, HP, Logitech) |
| Model | Modelnaam of -nummer |
| Serienummer | Fabrikantserienummer — uniek, sterk aanbevolen |

**Levenscyclus**

| Veld | Uitleg |
|------|--------|
| Aankoopdatum | Wanneer het asset is aangeschaft |
| Garantieverval | Einddatum garantie |
| Installatiedatum | Wanneer het asset in gebruik is genomen |

**QR-code**

De QR-code is zichtbaar op de detailpagina. Klik **QR Code Downloaden** om de SVG op te slaan (bestandsnaam `{AssetCode}-QR.svg`) — geschikt om af te drukken op een Dymo-label.

### Acties op de detailpagina

| Knop | Functie |
|------|---------|
| Bewerken | Ga naar het bewerkingsformulier |
| Verwijderen | Permanent verwijderen (met bevestigingsdialog) |
| Label Afdrukken | Open de print-dialog voor dit asset (zie [Labels afdrukken](03-Printing-Labels.md)) |

---

## 3. Nieuw asset toevoegen

Navigeer via **Activa → + Nieuw** of klik de plusknop op de inventarispagina. Je belandt op `/inventory/assets/new`.

### Stap 1: Sjabloon kiezen (optioneel)

Bovenaan het formulier kun je een sjabloon selecteren. Een sjabloon vult automatisch veelgebruikte velden in (naam, categorie, merk, model). Kies **Geen sjabloon — Handmatig invoeren** als je alles zelf wilt invullen.

### Stap 2: Asset-code

De asset-code wordt **automatisch gegenereerd** door de backend. Je hoeft nooit een code handmatig in te typen.

Het formaat is `TYPE-JJ-MERK-NNNNN`:

| Onderdeel | Voorbeeld | Uitleg |
|-----------|-----------|--------|
| TYPE | `LAP` | Bepaald door het geselecteerde **asset type** (dropdown) |
| JJ | `26` | Huidig jaar (2 cijfers) |
| MERK | `DELL` | Eerste 4 alfanumerieke tekens van het merk, hoofdletters |
| NNNNN | `00001` | Volgnummer (normaal: 00001–89999; dummy/test: 90001–99999) |

**Voorbeeld:** een Dell-laptop aangemaakt in 2026 krijgt de code `LAP-26-DELL-00001` (of het eerstvolgende vrije nummer).

Het systeem zoekt automatisch het eerstvolgende vrije nummer — er worden geen gaten overgeslagen.

### Stap 3: Verplichte velden invullen

| Veld | Verplicht? | Uitleg |
|------|-----------|--------|
| Asset-naam | Ja (of serienummer) | Officiële naam, bijv. de Intune DeviceName |
| Serienummer | Ja (of naam) | Moet uniek zijn in het systeem |
| Categorie | Ja | Bijv. Computing, Peripherals |
| Asset type | Ja | Bepaalt het TYPE-deel van de asset-code |
| Status | Ja | Standaard: Stock |

### Stap 4: Locatie instellen

Locatie is **gestructureerd**:

1. Selecteer een **Gebouw** uit de dropdown (lijst van geregistreerde gebouwen)
2. Optioneel: selecteer een **Fysieke werkplek** (gefilterd op het gekozen gebouw) — relevant voor vaste apparatuur
3. Optioneel: voer een **Installatielocatie** in voor extra detail (bijv. "Kamer 201, 2e verdieping")

Als je een medewerker selecteert, worden gebouw en fysieke werkplek automatisch ingevuld vanuit het medewerkersprofiel.

### Stap 5: Intune-koppeling (optioneel)

Klik **Intune-apparaat zoeken** om merk, model en serienummer automatisch in te vullen vanuit Intune op basis van apparaatnaam of serienummer. Dit bespaart typewerk en minimaliseert fouten.

### Stap 6: Opslaan

Klik **Activa aanmaken**. Bij validatiefouten worden de betreffende velden rood gemarkeerd. Bij succes word je doorgestuurd naar de detailpagina van het nieuwe asset.

---

## 4. Asset bewerken

1. Open de asset-detailpagina
2. Klik **Bewerken** — je belandt op `/inventory/assets/:id/edit`
3. Pas de gewenste velden aan
4. Klik **Activa bijwerken**

De asset-code zelf is niet bewerkbaar na aanmaak.

### Veelgebruikte bewerkingsscenario's

**Eigenaar wijzigen:**
- Zoek de nieuwe eigenaar via het **Medewerker**-veld (typeahead zoekbalk)
- Het gebouw en de fysieke werkplek worden automatisch meegenomen van het medewerkersprofiel

**Locatie aanpassen:**
- Selecteer een ander **Gebouw** — de Fysieke werkplek-dropdown wordt automatisch gereset
- Selecteer eventueel een nieuwe **Fysieke werkplek** (gefilterd op het nieuwe gebouw)
- Pas de **Installatielocatie** aan voor extra detail

**Status wijzigen:**
- Wijzig de **Status**-dropdown (zie §5 voor de betekenis van elke status)
- Klik Opslaan — de statuswijziging wordt gelogd in de historiek

---

## 5. Assetstatussen

| Status | Kleur | Wanneer gebruiken |
|--------|-------|-------------------|
| **Nieuw** | Paars | Aangemaakt in het systeem, nog niet in gebruik |
| **Stock** | Blauw | Beschikbaar in voorraad, klaar voor uitgifte |
| **In Gebruik** | Groen | Actief in gebruik bij een medewerker |
| **Herstelling** | Geel | Naar reparatie of onderhoud |
| **Defect** | Rood | Permanent kapot, niet meer herstelbaar |
| **Uit Dienst** | Grijs | Definitief buiten gebruik, einde levensduur |

**Typische doorstroom:**

```
Nieuw → In Gebruik   (uitgifte via rollout of handmatig)
In Gebruik → Stock   (inlevering, herbruikbaar)
In Gebruik → Herstelling   (naar reparatie)
In Gebruik → Defect  (kapot)
In Gebruik / Stock → Uit Dienst   (EOL, definitief)
```

Statuswijzigingen via de rollout-workflow verlopen atomisch (alles of niets) — zie de [Rollout-gids](05-Rollout-Workflow.md).

---

## 6. Bulk aanmaken

Voor het tegelijk aanmaken van meerdere identieke assets (bijv. een batch nieuwe laptops):

1. Ga naar **Activa** en klik **Bulk aanmaken** (of navigeer naar `/inventory/assets/bulk`)
2. Kies een sjabloon als startpunt (optioneel)
3. Stel het **aantal** in (max. 100 per batch)
4. Voer een **serienummer-prefix** in als je een systematische nummerreeks wilt (bijv. `SN` → `SN-0001`, `SN-0002`, …)
5. Klik **X assets aanmaken**

Elke asset krijgt een eigen automatisch gegenereerde asset-code. Na aanmaak verschijnen alle nieuwe assets in de inventarislijst.

---

## 7. Sjablonen gebruiken

Sjablonen slaan standaardwaarden op voor een bepaald assettype zodat je die niet telkens opnieuw hoeft in te voeren.

Navigeer via **Sjablonen** in de zijbalk (route `/inventory/templates`).

**Wat een sjabloon bevat:**
- Naam, categorie, asset type
- Merk en model
- Optioneel: standaardeigenaar, gebouw, installatielocatie

**Sjabloon gebruiken bij aanmaken:**
Selecteer het gewenste sjabloon bovenaan het aanmaakformulier. De velden worden vooringevuld maar blijven bewerkbaar — vul het serienummer en de specifieke locatie altijd nog handmatig in.

**Sjablonen beheren:**
Op de sjablonenpagina kun je sjablonen aanmaken, bewerken en verwijderen. Een goed bijgehouden sjabloonbibliotheek maakt bulk-import en rollout-planning aanzienlijk sneller.

---

## 8. CSV-import

Heb je een lijst assets in een spreadsheet? Importeer ze in bulk via CSV.

1. Ga naar **Activa** op de inventarispagina
2. Klik het **CSV importeren**-pictogram in de werkbalk
3. Download het **sjabloon** voor de correcte kolomvolgorde en -namen
4. Vul je spreadsheet in op basis van het sjabloon
5. Sla op als `.csv` (UTF-8 codering)
6. Sleep het bestand in de upload-zone of klik om te bladeren
7. Controleer de preview — fouten worden per rij getoond
8. Klik **X assets importeren** om te bevestigen

**Let op:** Asset-codes worden ook bij CSV-import automatisch gegenereerd door de backend op basis van het type en merk in het bestand — je hoeft geen codes in de CSV op te nemen.

---

## 9. Asset-historiek

Elke significante wijziging aan een asset wordt automatisch bijgehouden.

Open de detailpagina van een asset en scroll naar de **Historiek**-sectie. Je ziet een chronologische lijst van events, inclusief:

- Statuswijzigingen (bijv. `Nieuw → In Gebruik`)
- Eigenaarstoewijzingen en -wijzigingen
- Locatiewijzigingen
- Rollout-bewegingen (bij welke rollout-sessie het asset betrokken was)

Deze historiek is alleen-lezen en kan niet worden bewerkt. Ze dient als audittrail voor compliance en probleemoplossing.

---

## 10. Veelgestelde vragen

**Kan ik een asset-code handmatig invullen?**
Nee. De backend genereert de code automatisch op basis van het gekozen asset type, het jaar en het merk. Je kiest alleen het type via de dropdown.

**Kan ik een asset verwijderen?**
Ja, via de detailpagina. Verwijdering is permanent. Als een asset een rollout-historiek heeft, overweeg dan om de status op **Uit Dienst** te zetten in plaats van te verwijderen — zo blijft de audittrail intact.

**Mijn asset staat op de verkeerde locatie — hoe pas ik dat aan?**
Open het bewerkingsformulier, selecteer het juiste gebouw en eventueel de juiste fysieke werkplek, en sla op. De wijziging wordt gelogd in de historiek.

**Wat is het verschil tussen "Medewerker" en "Eigenaar"?**
"Medewerker" is een FK-koppeling naar het medewerkersregister (met autofill van locatiegegevens). "Eigenaar" is een vrij tekstveld voor legacy-data. Gebruik bij voorkeur het Medewerker-veld voor nieuwe assets.

**Kan ik meerdere assets tegelijk bewerken?**
Selecteer assets in de lijst (checkbox links van elke kaart) en gebruik de **Bulk bewerken**-optie die verschijnt in de werkbalk.

---

## Tips

- **Vul altijd het serienummer in.** Dit is de enige betrouwbare manier om een fysiek apparaat te koppelen aan een record in het systeem — en aan Intune.
- **Gebruik de Intune-zoekfunctie.** Merk, model en serienummer worden automatisch overgenomen, wat fouten voorkomt.
- **Houd de status actueel.** Een status die niet klopt is erger dan geen status — het verstoort rapporten en rollout-planning.
- **Gebruik sjablonen.** Investeer eenmalig in een goede sjabloonbibliotheek; elke batch-import en rollout daarna gaat dan sneller.

---

**Vorige:** [Aan de slag](01-Getting-Started.md)
**Volgende:** [Labels afdrukken](03-Printing-Labels.md)

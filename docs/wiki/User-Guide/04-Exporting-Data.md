# Gegevens exporteren — Gebruikersgids

Gids voor het exporteren van inventarisgegevens naar Excel of CSV.

> Technische details (ExcelJS-configuratie, API-endpoints) staan niet in deze gids. Zie [`docs/BACKEND-ARCHITECTURE.md`](../../BACKEND-ARCHITECTURE.md) en de live Swagger UI op `/swagger`.

---

## 1. Overzicht

De exportfunctie laat je de volledige inventaris of een gefilterde selectie downloaden voor gebruik buiten de applicatie.

Typische toepassingen:

- **Inventarisaudit** — volledig overzicht als momentopname
- **Statusrapportage** — overzicht van assets in herstelling, defect of uit dienst
- **Dienstlijst** — alle assets van een bepaalde dienst of sector
- **Garantiebeheer** — assets gesorteerd op garantieverval
- **Import naar extern systeem** — CSV in het juiste importformaat

---

## 2. Exportproces

### Stap 1: Open de exportdialog

Ga naar **Activa** (inventarispagina) en klik het **Export**-pictogram in de werkbalk. De dialog **Inventaris Exporteren** opent.

### Stap 2: Kies het formaat

| Formaat | Extensie | Geschikt voor |
|---------|----------|--------------|
| **Excel** | `.xlsx` | Analyse, draaitabellen, opmaak, delen met management |
| **CSV** | `.csv` | Import in andere systemen, universele compatibiliteit |

### Stap 3: Geef een bestandsnaam op

Typ een naam. Schakel de optie **Tijdstempel toevoegen** in als je meerdere exports wilt bijhouden (bijv. `inventaris_20260425_143000.xlsx`).

### Stap 4: Pas filters toe (optioneel)

Filters bepalen welke assets in de export worden opgenomen:

| Filter | Werking |
|--------|---------|
| **Zoeken** | Vrije tekst over alle velden |
| **Filter op status** | Één of meer statussen selecteren |
| **Filter op asset type** | Beperk tot een specifiek asset type |

Actieve filters zijn zichtbaar als chips bovenaan de dialog. Verwijder ze met het kruisje om meer assets op te nemen.

**Tip:** Als je de filters op de inventarispagina al had ingesteld vóór je de exportdialog opende, worden ze automatisch overgenomen.

### Stap 5: Kies de kolommen

Selecteer welke gegevensvelden je wilt exporteren:

**Standaard geselecteerd:**

| Kolom | Inhoud |
|-------|--------|
| Asset-code | Unieke identifier (bijv. `LAP-26-DELL-00001`) |
| Asset-naam | Officiële naam |
| Categorie | Bijv. Computing, Displays |
| Status | Huidige status |
| Eigenaar | Naam van de gebruiker |
| Gebouw | Gebouw uit het gebouwenregister |
| Merk | Fabrikant |
| Model | Modelnaam |
| Serienummer | Fabrikantserienummer |

**Optioneel toe te voegen:**

| Kolom | Inhoud |
|-------|--------|
| Aankoopdatum | Datum van aanschaf |
| Garantieverval | Einddatum garantie |
| Installatiedatum | Datum van ingebruikname |
| Aangemaakt op | Datum waarop het asset in het systeem werd ingevoerd |
| Bijgewerkt op | Datum van laatste wijziging |

Gebruik **Alles selecteren** of **Alles deselecteren** voor snelle keuze.

### Stap 6: Exporteer

Klik **Exporteren**. Het bestand wordt automatisch gedownload naar je standaard downloadmap.

---

## 3. Bulk-selectie exporteren

Wil je alleen een handpicking van assets exporteren?

1. Vink op de inventarispagina de gewenste assets aan (checkbox per kaart)
2. Een exportknop verschijnt in de werkbalk naast de printknop
3. Klik de knop — de exportdialog opent met de selectie al als filter actief
4. Kies formaat en kolommen en exporteer

---

## 4. Importcompatibele CSV

Wil je een CSV exporteren die je later opnieuw kunt importeren?

Schakel in de exportdialog de optie **Export voor Import** in. Dit exporteert het bestand in exact hetzelfde formaat als het CSV-importsjabloon (21 kolommen, vaste kolomvolgorde). Je kunt dit bestand bewerken en opnieuw importeren als bulkupdate.

---

## 5. Use-cases

### Inventarisaudit

1. Open de exportdialog; verwijder alle filters
2. Selecteer **Excel** formaat en **alle kolommen**
3. Voeg een tijdstempel toe aan de bestandsnaam
4. Exporteer en sla op als officieel auditdocument

### Statusrapport (herstelling / defect)

1. Stel de statusfilter in op **Herstelling** of **Defect**
2. Selecteer kolommen: Asset-code, Naam, Eigenaar, Gebouw, Status
3. Exporteer naar Excel en deel met management

### Dienstlijst

1. Gebruik de zoekbalk of de dienst-/sectorfilter op de inventarispagina om te filteren op de gewenste dienst
2. Open de exportdialog (de filter wordt meegenomen)
3. Selecteer basiskolommen: Asset-code, Naam, Categorie, Eigenaar, Gebouw
4. Exporteer naar Excel of CSV

### Garantiebeheer

1. Open de exportdialog zonder filter
2. Selecteer kolommen: Asset-code, Naam, Merk, Model, Aankoopdatum, Garantieverval
3. Exporteer naar Excel
4. Sorteer in Excel op **Garantieverval** (oplopend) om snel te zien welke garanties binnenkort verlopen

---

## 6. Werken met de export in Excel

- Gebruik **Filter** (Ctrl+Shift+L) om te sorteren en te filteren
- Maak een **Draaitabel** voor samenvattende rapportages per dienst of gebouw
- Gebruik **Voorwaardelijke opmaak** om statussen kleurcodering te geven
- De kolom **Gebouw** bevat de naam uit het gebouwenregister — geen vrije tekst meer

---

## 7. Veelvoorkomende problemen

| Probleem | Oplossing |
|----------|-----------|
| Download start niet | Controleer de downloadinstellingen van je browser |
| Bestand is leeg | Controleer of je filters assets uitsluiten |
| Geen kolommen geëxporteerd | Selecteer minimaal één kolom |
| CSV toont garbled tekst | Open het bestand in Excel met **UTF-8** codering |
| Datums zien er vreemd uit | Formatteer de datumkolommen in Excel als datum |
| Pop-up geblokkeerd | Sta pop-ups toe voor deze site |

---

**Vorige:** [Labels afdrukken](03-Printing-Labels.md)
**Terug naar:** [Gebruikersgids overzicht](../README.md)

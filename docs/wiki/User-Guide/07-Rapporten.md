# Rapporten — Gebruikersgids

Centrale rapportage-hub voor inventaris, rollouts, werkplekken, leasing en Intune. Alle rapport-tabbladen zijn bereikbaar via één pagina op `/reports`.

> Technische details (entiteiten, API-endpoints, DTO's) staan niet in deze gids. Zie [`docs/BACKEND-ARCHITECTURE.md`](../../BACKEND-ARCHITECTURE.md), [`docs/DATA-MODEL.md`](../../DATA-MODEL.md) en de live Swagger UI op `/swagger`.

---

## 1. Overzicht

De Rapportage-pagina is opgebouwd uit zes tabbladen. Elk tabblad heeft een eigen URL-parameter zodat je een directe link kunt delen.

| Tab | URL-parameter | Wat |
|-----|---------------|-----|
| **Overview** | `?tab=overview` | Cross-domein KPI's, activiteitsgrafiek en aandachtspunten |
| **Assets** | `?tab=assets` | Huidige inventaris (`Nu`) en historiek van wijzigingen |
| **Rollouts** | `?tab=rollouts` | Voortgang, werlijst en export per sessie |
| **Werkplekken** | `?tab=werkplekken` | Bezetting per werkplek of per medewerker |
| **Leasing** | `?tab=leasing` | Leasing-contracten, kosten en vervaldatums |
| **Intune** | `?tab=intune` | Samenvatting van Intune-compliance (in ontwikkeling) |

### Snel antwoord vinden

| Vraag | Ga naar |
|-------|---------|
| Hoeveel assets hebben we en wat is de bezettingsgraad? | Overview → KPI-tegels |
| Welke assets zijn defect of in herstelling? | Assets → Nu → filter op status |
| Wie heeft laptop `LAP-26-DELL-00001`? | Assets → Nu → zoek op code of serienummer |
| Wanneer is asset X van eigenaar gewisseld? | Assets → Nu → klik op rij → tijdlijn-lade |
| Wat is de voortgang van rollout "Q2 Refresh"? | Rollouts → kies sessie → KPI-balk |
| Welke werkplekken zijn onbezet? | Werkplekken → Per Werkplek → filter op Beschikbaar |
| Welke leasing-contracten lopen de komende 60 dagen af? | Leasing → KPI-tegel "Bijna Verlopen" |
| Intune compliance-overzicht? | Intune → KPI-tegels (uitgebreide analyse: `/devices/intune`) |

---

## 2. Tab: Overview

`/reports?tab=overview`

De Overview-tab geeft een cross-domein beeld van de gehele inventarisomgeving in één oogopslag.

### KPI-tegels

Bovenaan staan zes klikbare tegels:

| Tegel | Wat |
|-------|-----|
| **Assets** | Totaal aantal assets, % in gebruik, aantal defect |
| **Rollouts** | Aantal actieve sessies, gemiddeld voltooiingspercentage |
| **Werkplekken** | Totaal aantal werkplekken, bezettingsgraad in % |
| **Leasing** | Lopende contracten, aantal dat binnen 60 dagen afloopt |
| **Intune** | Aantal enrolled en stale apparaten |
| **Activiteit** | Aantal events in de afgelopen 7 dagen |

Klik op een tegel om rechtstreeks naar het bijhorende tabblad te gaan. De Activiteit-tegel opent Assets → Historiek gefilterd op de laatste 7 dagen.

### Activiteitsgrafiek

Onder de tegels staat een **gestapeld gebiedsgrafiek** (recharts, 30 dagen) met vier reeksen:

- **Onboarding** — assets uitgeleverd aan gebruikers (groen)
- **Offboarding** — assets ingeleverd of buiten dienst gesteld (rood)
- **Swap** — apparaatwisselingen (oranje)
- **Overig** — overige wijzigingen (grijs)

De grafiek geeft snel een beeld of de activiteit toeneemt of afneemt en welk type beweging domineert.

### Aandachtspunten

Onderaan staan twee secties naast elkaar:

- **Actie nodig** — items met een hoge of kritieke urgentie (rood) die actie vereisen; elk item heeft een directe link naar het betreffende asset, werkplek of rollout.
- **Binnenkort** — items die aandacht verdienen op korte termijn (blauw), zoals aflopende contracten of geplande rollout-dagen.

Klik op een item om direct naar de relevante detailpagina te springen.

---

## 3. Tab: Assets

`/reports?tab=assets`

De Assets-tab heeft twee sub-tabs, selecteerbaar via de knoppenbalk bovenaan.

### 3.1 Nu (`?tab=assets&view=nu`)

Huidige toestand van de volledige inventaris, inclusief Intune-kolommen.

**Statistiekkaarten** (horizontale rij, klikbaar als statusfilter):

| Kaart | Filtert op |
|-------|-----------|
| Totaal | — (niet klikbaar) |
| In Gebruik | Status = InGebruik |
| Stock | Status = Stock |
| Herstelling | Status = Herstelling |
| Defect | Status = Defect |
| Nieuw | Status = Nieuw |

**Filteren:**

1. Typ in het zoekveld om te filteren op asset-code, naam of serienummer.
2. Klik op de pijl-omlaag voor uitgebreide filters: Status, Asset Type, Dienst, Gebouw. Meerdere waarden per filter zijn selecteerbaar.
3. Actieve filters worden aangegeven met een oranje stip op de filter-knop.

**Tabelkolommen:** Asset Code, Naam (+ serienummer), Type, Status, Eigenaar, Werkplek, Dienst, Gebouw, Intune-compliance, Intune-sync.

**Tijdlijn-lade:** Klik op een rij om rechts een lade te openen met de volledige asset-tijdlijn (alle statuswijzigingen, eigenaarswisselingen, locatiewijzigingen). Via de knop **Open asset details** navigeer je naar de volledige asset-detailpagina.

**Exporteren:** Klik op de export-knop (rechtsboven in de tabel) voor een Excel-bestand met de gefilterde dataset.

### 3.2 Historiek (`?tab=assets&view=history`)

Chronologisch overzicht van alle wijzigingen aan assets (statuswijzigingen, eigenaarswisselingen, locatiewijzigingen).

**Statistiekkaarten:**

| Kaart | Inhoud |
|-------|--------|
| Totaal | Totaal aantal wijzigingen in de gekozen periode |
| Status | Aantal statuswijzigingen |
| Eigenaar | Aantal eigenaarswisselingen |
| Actief | Aantal actieve assets |

**Filteren:**

1. Zoekveld voor asset-code, naam of eigenaar.
2. Uitgebreide filters (pijl-omlaag): Van Datum, Tot Datum, Gebeurtenis Type.

**Tabelkolommen:** Datum, Asset Code, Type, Serienummer, Gebeurtenis, Oude Waarde, Nieuwe Waarde, Huidige Eigenaar, Dienst, Locatie.

**Exporteren:** Exporteer de gefilterde historiek als CSV-bestand.

---

## 4. Tab: Rollouts

`/reports?tab=rollouts`

Gedetailleerd rapport per rollout-sessie. Zie ook [`05-Rollout-Workflow.md`](05-Rollout-Workflow.md) voor de volledige workflow-gids.

### Sessie selecteren

Kies een sessie via de selector bovenaan. Alleen sessies met status **Bezig** of **Voltooid** verschijnen hier.

### KPI-balk

Vijf statistieken voor de geselecteerde sessie:

| KPI | Inhoud |
|-----|--------|
| Werkplekken | Totaal aantal werkplekken in de sessie |
| Voltooid | Aantal voltooide werkplekken |
| Geïnstalleerd | Aantal geïnstalleerde assets |
| Voortgang | Voltooiingspercentage |
| Ontbrekende QR-codes | Aantal assets zonder QR-code |

### Type-breakdown (klikbaar filter)

Vier knoppen tonen het aantal werkplekken per bewegingstype:

- **Onboarding** — nieuwe medewerker krijgt apparatuur
- **Offboarding** — medewerker levert in
- **Swap** — apparaatwisseling
- **Overig** — overige bewegingen

Klik op een knop om de checklist te filteren op dat type. Meerdere types combineerbaar.

### Groepering

Schakel via de knoppenbalk tussen drie groeperingswijzen:

- **Per Dag** — standaard; elke uitvoeringsdag is een uitklapbare groep
- **Per Dienst** — handig voor teamrapportages
- **Per Gebouw** — handig voor locatiegerichte planning

De gekozen groepering wordt meegenomen in de Excel-export.

### Filteren

- **Zoeken** — filter op werkpleknaam, medewerker, dienst of gebouw.
- **Dienst-filter** — selecteer een of meerdere diensten.
- **Gebouw-filter** — selecteer een of meerdere gebouwen.
- **Ingeplande assets tonen** — toont assets die nog niet aan een werkplek zijn toegewezen.
- **Alles uitklappen / inklappen** — vergroot of verbergt alle groepen tegelijk.

Ontbrekende serienummers worden geel gemarkeerd. Klik op een ontbrekend serienummer om het direct in te vullen via een dialoogvenster.

### Excel-export

1. Stel de gewenste sessie, groepering en filters in.
2. Klik op de **Export**-knop in de filterbalk.
3. Het bestand wordt gedownload als `{Sessienaam}-rapport-{datum}.xlsx`.

Het Excel-bestand bevat:

- Sheet **Overzicht** — KPI-samenvatting
- Sheet **Checklist** — alle werkplekken met assets, serienummers en status
- Sheet **Type Breakdown** — aantallen per bewegingstype (Onboarding / Offboarding / Swap / Overig)
- Optioneel: sheet **Ingeplande assets** als die optie aanstond

---

## 5. Tab: Werkplekken

`/reports?tab=werkplekken`

Overzicht van fysieke werkplekken en de medewerkers die daaraan gekoppeld zijn. Zie ook de Werkplekken-gids voor beheer van werkplekken zelf.

### Twee weergaven

Kies via de knoppenbalk bovenaan:

**Per Werkplek** (`?tab=werkplekken&view=workplace`)

Toont elke fysieke werkplek met bezettingsinformatie en gekoppelde apparatuur.

Statistiekkaarten (klikbaar als filter):

| Kaart | Inhoud |
|-------|--------|
| Totaal | Totaal werkplekken |
| Bezet | Werkplekken met eigenaar of gebruiker |
| Beschikbaar | Werkplekken zonder toegewezen persoon |

Filter op gebouw of bezettingsstatus via de filterbalk. Klik op een rij om naar de werkplek-detailpagina te navigeren. Exporteer de gefilterde lijst via de export-knop.

**Per Medewerker** (`?tab=werkplekken&view=employee`)

Toont elke medewerker met hun werkplek, primaire laptop en andere gekoppelde apparatuur.

Tabelkolommen: Naam, Functie, Dienst, Werkplek-code, Laptop, Overige apparatuur.

Klik op een rij om een lade te openen met de asset-tijdlijn van de geselecteerde medewerker.

---

## 6. Tab: Leasing

`/reports?tab=leasing`

Beheer en bewaking van leasing-contracten met afloopdatum-tijdlijn.

### KPI-kaarten (klikbaar als statusfilter)

| Kaart | Kleur | Wanneer opletten |
|-------|-------|-----------------|
| Totaal Contracten | Oranje | — |
| Actief | Groen | — |
| Bijna Verlopen | Geel | Contract loopt binnen afzienbare tijd af |
| Maandelijks bedrag | Blauw | Totale maandelijkse leasingkost |

Een waarschuwingsbalk verschijnt automatisch als er contracten zijn die binnenkort aflopen.

### Afloopdatum-tijdlijn

Staafdiagram met de **komende 12 maanden**. Elke staaf toont hoeveel assets aflopen in die maand. Gebruik dit om tijdig te anticiperen op verlenging of vervanging.

### Filteren en zoeken

Zoek op contractnummer of leveranciersnaam. Filter op status (Alle / Actief / Bijna Verlopen / Verlopen) via het statusveld. Het aantal resultaten wordt rechts getoond.

**Tabelkolommen:** Contract Nr., Leverancier, Start, Einde (+ resterende dagen), Maandelijks bedrag, Aantal assets, Status.

**Exporteren:** Klik op de export-knop voor een Excel-bestand met de gefilterde contracten.

---

## 7. Tab: Intune

`/reports?tab=intune`

Samenvatting van de Intune-compliance-status van apparaten in de organisatie.

### KPI-kaarten

| Kaart | Kleur | Betekenis |
|-------|-------|-----------|
| Compliant | Groen | Apparaten die voldoen aan het Intune-beleid |
| Non-compliant | Rood | Apparaten die niet voldoen |
| Stale (>30d) | Geel | Apparaten zonder Intune-contact in meer dan 30 dagen |
| Unenrolled | Grijs | Apparaten die nog niet bij Intune zijn ingeschreven |

> **In ontwikkeling.** De Intune-tab toont voorlopig alleen de vier KPI-kaarten. Uitgebreide analyses (OS-versieverdeling, hardware-leeftijdsanalyse, compliance-trend en reconciliatie met de inventaris) worden in een volgende fase toegevoegd. Voor het volledige Intune-dashboard klik je op **Open bestaand Intune Dashboard** of ga je naar `/devices/intune`.

---

## 8. URL deep-links

Alle tabbladen en sub-tabs zijn URL-gedreven. Kopieer de URL uit de adresbalk om een specifieke weergave te delen met collega's.

| Weergave | URL |
|---------|-----|
| Overview | `/reports?tab=overview` |
| Assets Nu | `/reports?tab=assets&view=nu` |
| Assets Historiek | `/reports?tab=assets&view=history` |
| Rollouts, per dienst | `/reports?tab=rollouts&groupBy=service` |
| Rollouts, alleen Onboarding | `/reports?tab=rollouts&types=Onboarding` |
| Werkplekken per werkplek | `/reports?tab=werkplekken&view=workplace` |
| Werkplekken per medewerker | `/reports?tab=werkplekken&view=employee` |
| Leasing | `/reports?tab=leasing` |
| Intune | `/reports?tab=intune` |

**Verouderde URL's worden automatisch omgeleid:**

| Oude URL | Nieuwe URL |
|----------|-----------|
| `/reports?tab=hardware` | `/reports?tab=assets&view=nu` |
| `/reports?tab=swaps` | `/reports?tab=assets&view=history` |
| `/reports?tab=workplaces` | `/reports?tab=werkplekken` |
| `/reports?tab=rollout` | `/reports?tab=rollouts` |

---

## 9. Vernieuwen

Klik op het ververs-icoontje rechtsboven in de rapportage-header om de data voor het actieve tabblad opnieuw te laden. Dit is handig na een rollout-voltooiing of na het wijzigen van een asset wanneer je de meest recente stand wilt zien.

---

## 10. Veelgestelde vragen

**Kan ik meerdere tabbladen tegelijk zien?**
Nee — de pagina toont één tabblad tegelijk. Open een tweede browsertabblad met een andere `?tab=`-URL als je twee rapporten naast elkaar wilt raadplegen.

**Waarom zie ik geen sessies in de Rollouts-tab?**
Alleen sessies met status "Bezig" of "Voltooid" verschijnen. Sessies in de planningsfase zijn nog niet beschikbaar voor rapportage.

**Het export-Excel-bestand is leeg of bevat alleen headers.**
Controleer of er actieve filters zijn die alle resultaten uitsluiten. Verwijder de filters en probeer opnieuw.

**Een asset staat op "Intune: non-compliant" in de Assets-tab — wat nu?**
Ga naar de asset-detailpagina voor meer context, of open het volledige Intune Dashboard (`/devices/intune`) voor compliance-details.

**Ik zie "Bijna Verlopen" bij leasing maar de einddatum is nog ver weg.**
De drempelwaarde voor "Bijna Verlopen" is ingesteld op het systeem. Neem contact op met de beheerder als je de grenswaarde wilt aanpassen.

**Waar vind ik het serienummeroverzicht van een rollout-sessie?**
Dat staat op een aparte pagina: `/operations/rollouts/serienummers`. Een link naar `/reports?tab=serialnumbers` leidt daar automatisch naartoe.

---

## 11. Tips

- **Deel deep-links.** Kopieer de URL inclusief `?tab=` en filterparameters om een collega rechtstreeks naar de juiste weergave te sturen.
- **Gebruik de tijdlijn-lade.** In Assets → Nu geeft een klik op een rij de volledige geschiedenis van dat asset zonder de pagina te verlaten.
- **Groepeer rollout-export op dienst.** Exporteer de rollout-checklist gegroepeerd per Dienst als leveranciersdocument voor teamcoördinatoren.
- **Leasing-tijdlijn maandelijks bekijken.** Controleer de afloopdatum-grafiek elke maand om verrassingsvervaldatums te vermijden.
- **Aandachtspunten dagelijks scannen.** De Overview-tab signaleert kritieke situaties proactief; controleer de sectie "Actie nodig" aan het begin van de dag.

---

## Support

- IT-ServiceDesk: <https://diepenbeek.sharepoint.com/sites/IN-Servicedesk>
- Bugs / feature-verzoeken: <https://github.com/Djoppie/Djoppie-Inventory/issues>
- Maintainer: <jo.wijnen@diepenbeek.be>

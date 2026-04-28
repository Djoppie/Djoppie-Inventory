# Rollout Workflow — Gebruikersgids

Gestructureerd proces voor het plannen, uitvoeren en rapporteren van IT-asset rollouts (on/offboarding, refresh, swap).

> Technische details (entiteiten, schema, endpoints) staan niet in deze gids. Zie [`docs/BACKEND-ARCHITECTURE.md`](../../BACKEND-ARCHITECTURE.md), [`docs/DATA-MODEL.md`](../../DATA-MODEL.md) en de live Swagger UI op `/swagger`.

---

## 1. Overzicht

Een rollout is opgebouwd uit drie niveaus:

```
RolloutSession   ─ project (bv. "Q2 2026 Laptop Refresh Dienst ICT")
  └── RolloutDay ─ uitvoeringsdag (datum + diensten)
       └── Workplace ─ één werkplek per gebruiker
```

De workflow doorloopt vier fasen:

| Fase | Pagina | Wat |
|------|--------|-----|
| 1. Planning | Rollouts → Planner | Sessies, dagen en werkplekken aanmaken |
| 2. Configuratie | Werkplek-dialog | Per werkplek: welke assets, nieuw of bestaand, welke worden ingeleverd |
| 3. Uitvoering | Rollouts → Execution | Serienummers scannen, items afvinken, werkplek voltooien |
| 4. Rapportage | Reports (`/reports`) | Voortgang, asset-bewegingen, exports |

---

## 2. Fase 1 — Planning

### 2.1 Sessie aanmaken

`Rollouts → + Nieuwe Rollout`

Verplicht: sessienaam, geplande start- en einddatum. Optioneel: omschrijving, sector/dienst-context.

Status na aanmaken: **Planning**.

### 2.2 Dagen toevoegen

In de geopende sessie, kies tussen twee weergaven via de **Planning View Toggle**:

- **Kalenderweergave** — visueel slepen/plannen op datum
- **Lijstweergave** — sortable tabel, handig bij grote sessies

Per dag vul je in: datum, naam, en welke **diensten** op deze dag worden uitgerold (filtert later de werkplek-suggesties).

### 2.3 Werkplekken toevoegen

Drie manieren:

**Handmatig** — één werkplek per keer. Naam, e-mail, locatie, dienst, type setup (laptop/desktop/flex).

**Bulk Import vanuit Entra mail-groep** — kies een `MG-*` (dienst), `MG-SECTOR-*` (sector) of een afdelingsgroep. Selecteer leden, en per geselecteerde gebruiker wordt automatisch een werkplek aangemaakt met de standaard asset-template.

**Bulk Aanmaak (lege werkplekken)** — n keer een lege werkplek met dezelfde standaard-template, in te vullen tijdens uitvoering. Handig voor flex-werkplekken zonder vaste eigenaar.

---

## 3. Fase 2 — Werkplek configureren

Open een werkplek; je ziet drie groepen items:

### 3.1 User-assigned assets (gebruiker-gebonden)

Apparatuur die aan de **persoon** wordt gekoppeld — typisch laptop. Bij voltooiing krijgt het asset deze gebruiker als eigenaar en gaat van `Nieuw → InGebruik`.

Per item kies je:

- **Bestaand asset** — zoek op serienummer of asset-code
- **Nieuw uit template** — asset wordt bij voltooiing aangemaakt met auto-gegenereerde code (`TYPE-YY-BRAND-NNNNN`) en QR-code
- **On-site aanmaken** — manueel invullen tijdens uitvoering

### 3.2 Workplace-fixed assets (locatie-gebonden)

Apparatuur die aan de **fysieke werkplek** wordt gekoppeld — typisch docking, monitors, keyboard, muis. Eigenaar = werkplek-locatie, niet de persoon. Statustransitie identiek: `Nieuw → InGebruik`.

### 3.3 Oude apparatuur (return)

Hier registreer je apparatuur die de gebruiker **inlevert**. Per item kies je de retourstatus:

| Retour-keuze | Statustransitie | Wanneer |
|--------------|-----------------|---------|
| **Stock** | `InGebruik → Stock` | Goed werkend, klaar voor herinzet |
| **UitDienst** | `InGebruik → UitDienst` | EOL, definitief uit circulatie |
| **Defect** | `InGebruik → Defect` | Stuk, gaat naar herstelling of recycling |

---

## 4. Fase 3 — Uitvoering

`Rollouts → open dag → Start Uitvoering`

Per werkplek:

1. Klik **Start** — werkplek gaat van `Pending → InProgress`.
2. Voor elk item: scan/typ serienummer; bij niet-gevonden krijg je de optie om alsnog aan te maken.
3. Klik **Geïnstalleerd** of **Overgeslagen** per item.
4. Klik **Werkplek Voltooien** zodra alles afgevinkt is.

Realtime: dag-progress (`5/12 werkplekken`), werkplek-progress (`3/5 items`), kleur-coded badges.

### Atomic completion

Alle volgende stappen gebeuren in één database-transactie — slaagt er één niet, dan rolt het hele geheel terug:

1. Nieuwe assets: `Nieuw → InGebruik`, eigenaar gezet, `InstallationDate = nu`
2. Oude assets: `InGebruik → UitDienst | Defect | Stock` (per gekozen retour-keuze)
3. Werkplek: `InProgress → Completed`
4. Dag: `CompletedWorkplaces += 1`
5. Audit-trail (`RolloutAssetMovement`) krijgt één rij per asset-transitie

### Heropenen

Een `Completed` werkplek kan heropend worden, met twee opties:

- **Status-only** — werkplek terug naar `InProgress`, asset-statussen blijven `InGebruik`
- **Met asset-reversal** — alle transities van die werkplek worden teruggedraaid (nieuw terug naar `Nieuw`, oude terug naar `InGebruik`)

Gebruik dit als je per ongeluk de verkeerde werkplek voltooid hebt.

---

## 5. Fase 4 — Rapportage

Rollout-rapportage staat op de unified Reports-pagina, niet langer per sessie.

`/reports?tab=rollouts` of via de Rapportage-knop in een sessie:

- **KPI's** — totaal werkplekken, voltooid, in uitvoering, gepland
- **Asset-bewegingen** — alle `RolloutAssetMovement` records, filterbaar per movement-type, sessie, dienst, sector, dag
- **Type-breakdown** — laptops/monitors/docking apart geteld
- **Excel-export** — per dag, per dienst, of voor de hele sessie, inclusief tweede sheet "Type Breakdown"

Werkplek-gerichte rapporten (per werkplek, per medewerker) op `/reports?tab=werkplekken`. Serienummer-overzicht op `/operations/rollouts/serienummers`.

---

## 6. Statussen-overzicht

### Werkplek-status (`RolloutWorkplaceStatus`)

| Status | Wanneer | Volgende mogelijke status |
|--------|---------|---------------------------|
| **Pending** | Net aangemaakt, niet gestart | InProgress, Skipped |
| **InProgress** | Uitvoering bezig | Completed, Failed |
| **Completed** | Alle items afgevinkt en getransacteerd | InProgress (heropenen) |
| **Skipped** | Bewust overgeslagen (gebruiker afwezig, etc.) | InProgress (alsnog uitvoeren) |
| **Failed** | Voltooien faalde (rollback) | InProgress (opnieuw proberen) |
| **Ready** | Goedgekeurd, klaar voor uitvoering (optionele tussenstap) | InProgress |

### Asset-status in rollout-context

| Status | Rollout-betekenis |
|--------|-------------------|
| `Nieuw` | Aangemaakt tijdens planning, nog niet uitgereikt |
| `InGebruik` | Bij gebruiker / werkplek geïnstalleerd |
| `Stock` | Ingeleverd, herbruikbaar |
| `UitDienst` | Ingeleverd, einde levensduur |
| `Defect` | Ingeleverd, kapot |
| `Herstelling` | Niet rechtstreeks via rollout — buiten dit proces |

---

## 7. Veelgestelde vragen

**Kan ik een dag verwijderen die al werkplekken bevat?**
Alleen als de dag status `Planning` heeft en geen enkele werkplek `InProgress` of `Completed` is. Cascade delete neemt de werkplekken mee.

**Kan ik een voltooide werkplek verwijderen?**
Nee — voltooide werkplekken kunnen alleen worden heropend (zie §4). Verwijderen zou de audit-trail (`RolloutAssetMovement`) breken.

**Kan ik een werkplek naar een andere dag verplaatsen?**
Ja. De werkplek wordt naar de doeldag verplaatst en houdt een `MovedFromWorkplaceId`-link voor traceability. Dit werkt ook voor werkplekken die al `InProgress` zijn.

**Kan ik volgorde van dagen aanpassen?**
Dagen worden gesorteerd op datum (oplopend) en daarna `DayNumber`. Geef dagen duidelijke namen en data; handmatig herordenen is niet nodig.

**Wat is het verschil tussen "Overgeslagen" en "Niet geïnstalleerd"?**
*Overgeslagen* is een bewuste keuze (item niet nodig of gebruiker heeft eigen exemplaar) — telt mee als afgehandeld. *Niet geïnstalleerd* (status blijft `Pending`) — werkplek kan nog niet worden voltooid.

**Wat als de gebruiker een eigen keyboard heeft?**
Klik *Overslaan* op het keyboard-item. Het asset blijft in stock (geen aanmaak), de werkplek kan gewoon voltooid worden.

**Hoe werkt de serienummer-scan?**
Focus op het serienummer-veld, scan met barcode-scanner of typ. Na 500 ms (debounce) zoekt het systeem; niet-gevonden serienummers krijgen de optie *Nieuw aanmaken* met dat serienummer al ingevuld.

**Waar zie ik QR-codes voor nieuwe assets?**
Per asset: detail-pagina → *QR Code Downloaden* (SVG, bestandsnaam `{AssetCode}-QR.svg`).
Bulk per dag: planner → *QR Codes Afdrukken* — bundelt alle nieuwe-asset-QR's in één print-batch.

---

## 8. Tips

- **Plan met diensten, niet met namen.** Diensten op een dag (`MG-*` mail-groepen) genereren automatisch werkplek-suggesties bij bulk import.
- **Gebruik templates.** Een goed onderhouden `AssetTemplate`-bibliotheek maakt bulk import en planning triviaal.
- **Print QR's vroeg.** Print de hele dag-batch QR's zodra de planning vaststaat — dan hoef je tijdens uitvoering niets meer te doen.
- **Rapporteer per dienst.** Excel-export gegroepeerd op dienst is de natuurlijke leverancier-rapport voor teamcoördinatoren.
- **Heropen liever dan corrigeren.** Bij twijfel — heropen met asset-reversal en doe de werkplek opnieuw. Veel veiliger dan handmatig assets terug-editen.

---

## Support

- IT-ServiceDesk: <https://diepenbeek.sharepoint.com/sites/IN-Servicedesk>
- Bugs / feature-verzoeken: <https://github.com/Djoppie/Djoppie-Inventory/issues>
- Maintainer: <jo.wijnen@diepenbeek.be>

# Werkplekken — Gebruikersgids

Beheer van fysieke werkpleklocaties: waar staat welke apparatuur, wie zit er, en hoe koppel je assets aan een vaste plek.

> Technische details (entiteiten, schema, endpoints) staan niet in deze gids. Zie [`docs/BACKEND-ARCHITECTURE.md`](../../BACKEND-ARCHITECTURE.md), [`docs/DATA-MODEL.md`](../../DATA-MODEL.md) en de live Swagger UI op `/swagger`.

---

## 1. Wat is een werkplek?

Een **fysieke werkplek** is een vaste locatie binnen een gebouw — een bureau, loket, of werkstation — waar IT-apparatuur permanent staat opgesteld. Voorbeelden: "Loket 1 Burgerzaken", "IT Werkplek 3", "Vergaderzaal A".

**Vaste apparatuur** (docking station, monitors, keyboard, muis) is aan de werkplek gekoppeld en blijft daar, ongeacht wie de plek bezet. De laptop van de bewoner is aan de **persoon** gekoppeld, niet aan de werkplek.

### Niet te verwarren met rollout-werkplekken

De term "werkplek" komt ook voor in het Rollout Workflow-proces. Dat is een tijdelijke uitvoeringsstap voor on/offboarding. De fysieke werkplek in deze gids is de **permanente locatie-entiteit** die blijft bestaan nadat een rollout is afgerond. Zie [`05-Rollout-Workflow.md`](05-Rollout-Workflow.md) voor het rollout-proces.

### Werkplek-types

| Type | Label | Beschrijving |
|------|-------|--------------|
| **Laptop** | Laptop werkplek | Docking station aanwezig; gebruiker brengt eigen laptop |
| **Desktop** | Desktop | Vaste desktop-pc; geen docking |
| **HotDesk** | Flexwerkplek | Gedeelde plek zonder vaste bewoner |
| **MeetingRoom** | Vergaderzaal | Conferentieruimte met eigen apparatuur |

---

## 2. Werkplek-overzicht

Navigeer via de zijbalk naar **Werkplekken** (`/workplaces`).

### Wat je ziet in de lijst

| Kolom | Inhoud |
|-------|--------|
| **Code** | Unieke code binnen het gebouw (bv. `BZ-L01`) — klikbaar naar detail |
| **Naam** | Weergavenaam van de werkplek, met dienst eronder |
| **Locatie** | Gebouw, verdieping en ruimte |
| **Bezetter** | Naam + e-mail van de huidige bewoner, of "Vrij" |
| **Equipment** | Samenvatting van gekoppelde apparatuur (docking, monitors, keyboard, muis) |

Bovenaan zie je samenvattende tellers: totaal werkplekken, aantal bezet, aantal vrij, actief/inactief. Klik op een teller om de lijst te filteren.

### Zoeken en filteren

- **Zoekbalk** — vrij zoeken op code, naam, bewoner of locatie
- **Dienst-filter** — klik het dienst-icoon in de werkbalk; er klapt een paneel open met diensten gegroepeerd per sector. Selecteer één of meerdere diensten; een selectievakje op sectorniveau selecteert alle diensten in die sector tegelijk.
- **Gebouw-filter** — klik het gebouw-icoon in de werkbalk voor een raster met alle gebouwen
- **Tellers bovenaan** — klik "Bezet", "Vrij", "Actief" of "Inactief" om direct te filteren
- **Wis filters** — rode X-knop in de werkbalk verwijdert alle actieve filters tegelijk

---

## 3. Werkplek aanmaken

`Werkplekken → + (floating knop rechts onderaan)`

of klik **Werkplek toevoegen** als er nog geen werkplekken zijn.

### Verplichte velden

| Veld | Toelichting |
|------|-------------|
| **Code** | Korte unieke code binnen het gebouw (bv. `BZ-L04`). Codes zijn hoofdlettergevoelig en moeten uniek zijn per gebouw. |
| **Naam** | Weergavenaam (bv. "Loket 4 Burgerzaken") |
| **Gebouw** | Selecteer het gebouw uit de dropdown |

### Optionele velden

| Veld | Toelichting |
|------|-------------|
| **Dienst** | Koppel de werkplek aan een dienst/afdeling |
| **Verdieping** | Bv. "Gelijkvloers", "1e verdieping" |
| **Ruimte** | Bv. "Lokettenhal", "Lokaal 201" |
| **Type** | Laptop werkplek (standaard), Desktop, Flexwerkplek of Vergaderzaal |
| **Aantal monitors** | Standaard 2; pas aan voor triple-monitor of vergaderzaalscherm |
| **Docking station** | Aan/uit; standaard aan voor laptop-werkplekken |
| **Omschrijving** | Vrije tekst voor extra context |

Klik **Opslaan** — de werkplek verschijnt meteen in de lijst.

### Bulk aanmaken via CSV

Voor het aanmaken van meerdere werkplekken tegelijk gebruik je de CSV-import:

1. Klik het upload-icoon rechts in de filterwerkbalk.
2. Klik **Template downloaden** voor een CSV-sjabloon met een toelichting van de geldige gebouw- en dienstcodes.
3. Vul de kolommen in: `Code`, `Name`, `Description`, `BuildingCode`, `ServiceCode`, `Floor`, `Room`, `Type`, `MonitorCount`, `HasDockingStation`.
4. Upload het ingevulde bestand; het systeem toont per rij of de import geslaagd of mislukt is.

---

## 4. Werkplek bewerken

In de lijst: klik het **potlood-icoon** naast een werkplek.  
Op de detailpagina: klik de **Bewerken**-knop.

Je kunt alle velden uit §3 aanpassen. De code moet uniek blijven binnen het gebouw. Als je van gebouw wisselt, wordt de code opnieuw gevalideerd.

---

## 5. Bezetter toewijzen en wisselen

Een werkplek kan één bewoner hebben — de medewerker die de plek dagelijks gebruikt.

### Bezetter instellen (vanuit de detailpagina)

1. Open de werkplek via de **Code**-link in de lijst.
2. In het **Bezetter**-paneel klik je op **Bezetter toewijzen**.
3. Typ de naam of het e-mailadres; de autocomplete zoekt in Entra ID.
4. Kies de juiste persoon en sla op.

Het systeem slaat naam, e-mail, Entra ID en het tijdstip van ingebruikname (`Bezet sinds`) op.

### Bezetter wisselen

Wijs een nieuwe bezetter toe via dezelfde stappen. De vorige bewoner wordt automatisch overschreven. Het systeem houdt geen volledige historiek bij van opeenvolgende bewoners — gebruik het Rollout-rapport voor een volledige asset-bewegingshistoriek.

### Bezetter verwijderen

- In de lijst: klik het **persoon-X-icoon** naast de werkplek (zichtbaar als er een bezetter is).
- Op de detailpagina: klik **Bezetter verwijderen** in het bezetter-paneel.

Na bevestiging is de werkplek weer vrij. De gekoppelde vaste apparatuur blijft aan de werkplek.

---

## 6. Apparatuur koppelen aan een werkplek

Vaste apparatuur zit in **toegewezen slots** per werkplek:

| Slot | Apparaattype |
|------|-------------|
| Docking station | Docking station (1 slot) |
| Monitor 1 / 2 / 3 | Monitors (tot 3 slots, afhankelijk van `MonitorCount`) |
| Keyboard | Keyboard (1 slot) |
| Muis | Muis (1 slot) |

### Apparatuur toewijzen

**Via de lijst** — klik het **inventaris-icoon** naast een werkplek; er opent een dialoog met alle slots.  
**Via de detailpagina** — scroll naar het **Equipment**-paneel en klik **Beheer Apparatuur**.

In de dialog zoek je per slot op asset-code of serienummer. Alleen assets met status `Stock` of `Nieuw` zijn beschikbaar voor toewijzing. Na opslaan wordt het `PhysicalWorkplaceId` op het asset gezet en de locatie (gebouw) automatisch gesynchroniseerd.

### Apparatuur loskoppelen

Open dezelfde dialog, klik de X naast het ingevulde slot en sla op. Het asset is daarna niet langer aan een werkplek gekoppeld.

### Verschil met rollout-toewijzing

Apparatuur die via een rollout wordt geïnstalleerd, doorloopt een statustransitie (`Nieuw → InGebruik`) en wordt via de rollout-configuratie aan de werkplek gekoppeld. Handmatige equipment-toewijzing (zoals hierboven) wijzigt de asset-status **niet** — dat doe je zelf via de asset-detailpagina indien nodig.

---

## 7. Werkplek-detailpagina

Klik op de **Code** van een werkplek in de lijst om de detailpagina te openen.

Hier zie je:

- **Locatiegegevens** — gebouw, verdieping, ruimte, dienst, type
- **Bezetter** — naam, e-mail, device van de bewoner (laptop: merk, model, serienummer, asset-code — automatisch opgezocht via inventaris en Intune)
- **Equipment-slots** — overzicht van alle gekoppelde vaste apparatuur met asset-code en serienummer
- **Rollout-geschiedenis** — alle rollout-werkplekken die naar deze fysieke locatie verwijzen

---

## 8. Werkplek deactiveren of verwijderen

### Deactiveren (aanbevolen)

Een werkplek deactiveren verwijdert hem niet uit de database maar markeert hem als inactief. Inactieve werkplekken zijn zichtbaar via het filter "Inactief".

Bewerk de werkplek en zet de toggle **Actief** op uit.

### Verwijderen

Klik het **prullenbak-icoon** naast de werkplek in de lijst.

> **Let op:** Als er nog apparatuur in de equipment-slots zit, toont het systeem een waarschuwing met het aantal gekoppelde assets. Ontkoppel de apparatuur eerst (zie §6) als je de assets wilt bewaren. Het verwijderen is een soft-delete — de werkplek verdwijnt uit de actieve lijst maar blijft beschikbaar voor historische rollout-rapportages.

Verwijderen is geblokkeerd als de werkplek deel uitmaakt van een rollout in uitvoering (`InProgress`). Voltooi of skip de betreffende rollout-werkplek eerst.

---

## 9. Rapportage

Werkplek-rapportage staat op de gecentraliseerde Reports-pagina:

`/reports?tab=werkplekken`

of via de zijbalk **Rapporten → Werkplekken**.

Beschikbare overzichten:

- **Bezettingsgraad** — totaal / bezet / vrij, per gebouw, per dienst
- **Equipment-dekkingsgraad** — percentage gevulde slots per apparaattype (docking, monitors, keyboard, muis)
- **Werkplek-gap analyse** — laptop-eigenaren zonder overeenkomende fysieke werkplek

---

## 10. Veelgestelde vragen

**Kan ik een code achteraf wijzigen?**  
Ja, via Bewerken. De nieuwe code moet uniek blijven binnen het geselecteerde gebouw. Rollout-koppelingen naar deze werkplek blijven intact.

**Wat als twee medewerkers dezelfde plek delen (jobsharing)?**  
Wijs de primaire bezetter toe. Een werkplek heeft één bezetterveld. Leg de tweede gebruiker vast in de omschrijving of gebruik twee aparte werkplekken.

**De bezetter is zichtbaar in de lijst maar heeft geen laptop-info.**  
De laptop-info (`OccupantDeviceSerial`, `OccupantDeviceBrand`) wordt opgezocht via het inventaris op basis van het e-mailadres van de bezetter. Als de laptop niet in inventaris staat of een afwijkend e-mailadres heeft, blijft dit leeg. Stel de bewoner handmatig in via de detailpagina of synchroniseer de laptop in inventaris.

**Kan ik werkplekken bulk importeren vanuit een Entra-groep?**  
Ja — maar dat is de rollout-functie (zie [`05-Rollout-Workflow.md`](05-Rollout-Workflow.md), §2.3). Werkplekken die via een rollout zijn aangemaakt, worden automatisch als fysieke werkplek geregistreerd. Voor directe import zonder rollout gebruik je de CSV-import (zie §3).

**Hoe verwijder ik alle werkplekken tegelijk?**  
Dat is een beheerdersfunctie die bevestiging vereist en alleen beschikbaar is via de API (`DELETE /api/workplaces/all?confirm=true`). Dit is onomkeerbaar voor de actieve data. Neem contact op met de systeembeheerder.

**De filter op dienst toont geen diensten.**  
Diensten worden gesynchroniseerd vanuit Entra mail-groepen (`MG-*`). Als een dienst ontbreekt, vraag dan de beheerder om een synchronisatie via Beheer → Organisatie.

---

## 11. Tips

- **Gebruik consistente codes.** Een stramien zoals `GEBOUW-DIENST-VOLGNUMMER` (bv. `GH-BZ-L04`) maakt sorteren en zoeken een stuk eenvoudiger.
- **Vul dienst en locatiedetails altijd in.** De filter op dienst en gebouw werkt alleen als deze velden ingevuld zijn.
- **Deactiveer liever dan verwijder.** Inactieve werkplekken bewaren de rollout-historiek en zijn eenvoudig te reactiveren.
- **Koppel apparatuur na de rollout.** Tijdens een rollout worden equipment-slots automatisch gevuld. Controleer achteraf of alle slots kloppen en voeg ontbrekende items handmatig toe.
- **Gebruik de gap-analyse.** Het rapport "Werkplek-gap" toont welke laptop-eigenaren nog geen fysieke werkplek hebben — handig voor grote on/offboarding-rondes.

---

## Support

- IT-ServiceDesk: <https://diepenbeek.sharepoint.com/sites/IN-Servicedesk>
- Bugs / feature-verzoeken: <https://github.com/Djoppie/Djoppie-Inventory/issues>
- Maintainer: <jo.wijnen@diepenbeek.be>

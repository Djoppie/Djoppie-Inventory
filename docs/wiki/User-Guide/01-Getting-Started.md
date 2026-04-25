# Aan de slag — Gebruikersgids

Snelle introductie voor IT-supportmedewerkers en inventarisbeheerders die voor het eerst met Djoppie Inventory werken.

> Technische details (configuratie, endpoints, infrastructuur) staan niet in deze gids. Zie [`docs/BACKEND-ARCHITECTURE.md`](../../BACKEND-ARCHITECTURE.md) en de live Swagger UI op `/swagger`.

---

## 1. Overzicht

Djoppie Inventory is een webapplicatie voor het beheer van IT-activa. Je kunt er assets registreren, opvolgen, exporteren en koppelen aan medewerkers, gebouwen en diensten. De applicatie draait volledig in de browser — geen installatie vereist.

| Omgeving | URL |
|----------|-----|
| **DEV** | <https://blue-cliff-031d65b03.1.azurestaticapps.net> |
| **Productie** | Vraag bij je IT-beheerder |

**Wat je nodig hebt:**
- Een moderne browser (Chrome, Edge of Firefox)
- Je Diepenbeek Microsoft-account (`naam@diepenbeek.onmicrosoft.com`)
- Cameratoestemming (optioneel, alleen voor QR-scannen)

---

## 2. Inloggen

De applicatie gebruikt **Microsoft Entra ID** (voorheen Azure AD) voor authenticatie. Er is geen apart wachtwoord nodig — je meldt je aan met je bestaande Microsoft-account.

### Stap 1: Open de applicatie

Navigeer naar de applicatie-URL. Je wordt automatisch doorgestuurd naar de Microsoft-aanmeldingspagina.

### Stap 2: Meld je aan

Voer je Diepenbeek-e-mailadres in en doorloop de Microsoft-aanmeldstroom (inclusief MFA als geconfigureerd voor jouw account).

### Stap 3: Machtigingen verlenen (eenmalig)

Bij de eerste aanmelding vraagt de applicatie toestemming om:
- Je basisprofiel te lezen
- De Djoppie Inventory API namens jou aan te roepen

Klik **Accepteren** om verder te gaan. Je wordt niet opnieuw gevraagd.

### Stap 4: Dashboard

Na succesvolle aanmelding land je op het **Activa Dashboard**. Je naam verschijnt rechtsboven in de navigatiebalk.

### Afmelden

Klik op je profielfoto of naam rechtsboven en kies **Afmelden**.

---

## 3. Navigatie

De zijbalk links bevat alle secties van de applicatie:

| Sectie | Wat je er doet |
|--------|---------------|
| **Dashboard** | Activa-overzicht met statusfilter en zoekbalk |
| **Activa** | Volledige inventarislijst, assets toevoegen en beheren |
| **Sjablonen** | Sjabloonbibliotheek voor snelle asset-aanmaak |
| **Scannen** | QR-code scannen of asset-code handmatig invoeren |
| **Werkplekken** | Fysieke werkplekken en hun vaste uitrusting |
| **Uitrol** | Rollout-planning en -uitvoering (on/offboarding) |
| **Rapporten** | Inventaris-, werkplek- en rollout-rapportage |
| **Beheer** | Gebouwen, diensten, sectoren, medewerkers, categorieën |

Bovenaan de balk vind je de taalwissel (**NL / EN**) en de licht-/donkermodus-toggle.

---

## 4. Dashboard

Het dashboard geeft je een direct overzicht van alle assets in de inventaris.

### KPI-tegels

Bovenaan staan telkaarten per status:

| Tegel | Betekenis |
|-------|-----------|
| Totaal | Alle geregistreerde assets |
| In Gebruik | Assets actief bij een gebruiker |
| Stock | Beschikbaar, nog niet toegewezen |
| Nieuw | Aangemaakt, nog niet in gebruik |
| Herstelling | Naar reparatie |
| Defect | Kapot, niet repareerbaar |
| Uit Dienst | Definitief buiten gebruik |

### Zoeken en filteren

- **Zoekbalk** — zoek op asset-code, naam, eigenaar, merk, model of gebouw
- **Filter op status** — klik een statusknop om de lijst te beperken tot die status; klik opnieuw om de filter op te heffen
- **Dienst-/sectorfilter** — een uitklapbaar paneel groepeert diensten per sector zodat je snel op afdeling kunt filteren

De lijst toont asset-kaarten met code, naam, status, eigenaar en gebouw. Klik op een kaart om de volledige detailpagina te openen.

---

## 5. QR-code scannen

Met de scanpagina zoek je razendsnel een asset op via zijn QR-code.

### Via QR Scanner

1. Klik **Scannen** in de zijbalk (route `/inventory/scan`)
2. Kies het tabblad **QR Scanner**
3. Verleen cameratoestemming als de browser daarom vraagt
4. Richt de camera op de QR-code (10–20 cm afstand, goede belichting)
5. De code wordt automatisch herkend en je wordt doorgestuurd naar de asset-detailpagina

### Via handmatige invoer

Als je geen camera beschikbaar hebt:

1. Kies het tabblad **Handmatige invoer**
2. Typ de asset-code exact in (bijv. `LAP-26-DELL-00001`)
3. Druk op **Zoeken** of Enter

### Veelvoorkomende scannerproblemen

| Probleem | Oplossing |
|----------|-----------|
| Camera start niet | Controleer browsermachtigingen; sluit andere apps die de camera gebruiken |
| QR wordt niet herkend | Zorg voor goede belichting en houd de camera stil |
| Toegang geweigerd | QR-scannen vereist HTTPS — gebruik de productie-URL, niet `http://` |

---

## 6. Taal en thema

- **Taal** — klik op **NL / EN** in de navigatiebalk om te wisselen; de voorkeur wordt lokaal opgeslagen
- **Thema** — klik op het zon-/maanpictogram om te schakelen tussen licht en donker

---

## 7. Veelgestelde vragen

**Ik zie de zijbalk niet volledig — wat mis ik?**
Sommige secties (Uitrol, Beheer) zijn mogelijk alleen zichtbaar voor bepaalde rollen. Neem contact op met je IT-beheerder als je verwacht toegang te hebben.

**Kan ik Djoppie Inventory op mijn smartphone gebruiken?**
Ja. De applicatie werkt in de mobiele browser. Voor QR-scannen is dat zelfs de handigste manier.

**Mijn sessie is verlopen — wat nu?**
Klik op **Aanmelden** in de navigatiebalk. Je wordt opnieuw doorgestuurd naar Microsoft voor aanmelding; dit duurt gewoonlijk maar een paar seconden.

---

## Support

- IT-ServiceDesk: <https://diepenbeek.sharepoint.com/sites/IN-Servicedesk>
- Bugs / feature-verzoeken: <https://github.com/Djoppie/Djoppie-Inventory/issues>
- Maintainer: <jo.wijnen@diepenbeek.be>

---

**Volgende:** [Assets beheren](02-Managing-Assets.md)

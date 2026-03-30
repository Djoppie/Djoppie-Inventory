# Djoppie Inventory - Feature Documentatie

Dit document beschrijft alle features en functionaliteiten van Djoppie Inventory.

## Inhoudsopgave

1. [Medewerkers & Entra ID Synchronisatie](#1-medewerkers--entra-id-synchronisatie)
2. [Fysieke Werkplekken](#2-fysieke-werkplekken)
3. [Rollout Workflow](#3-rollout-workflow)
4. [Asset Management](#4-asset-management)
5. [Intune Integratie](#5-intune-integratie)
6. [Organisatie Hiërarchie](#6-organisatie-hiërarchie)
7. [Dashboard](#7-dashboard)
8. [Admin Interface](#8-admin-interface)
9. [Laptop Swap](#9-laptop-swap)

---

## 1. Medewerkers & Entra ID Synchronisatie

### Overzicht
Het systeem ondersteunt nu volledige synchronisatie van medewerkers vanuit Microsoft Entra ID (Azure AD).

### Functionaliteiten

#### Medewerker Entity
- **Entra ID**: Unieke identifier uit Azure AD
- **Naam & Email**: Automatisch gesynchroniseerd
- **Functietitel**: Job title uit Entra ID
- **Afdeling**: Department informatie
- **Manager**: Hiërarchische relatie
- **Kantoorlocatie**: Office location
- **Status**: Actief/Inactief

#### Synchronisatie
- **Automatische sync**: Medewerkers worden gesynchroniseerd vanuit Entra ID
- **Incremental updates**: Alleen gewijzigde medewerkers worden bijgewerkt
- **Soft delete**: Inactieve medewerkers worden gemarkeerd, niet verwijderd

#### Asset Toewijzing
- Medewerkers kunnen gekoppeld worden aan assets
- Overzicht van alle assets per medewerker
- Historiek van asset toewijzingen

### Gebruik
1. Ga naar **Admin** → **Medewerkers**
2. Klik op **Synchroniseren** om medewerkers uit Entra ID te importeren
3. Bekijk en beheer medewerker-asset koppelingen

---

## 2. Fysieke Werkplekken

### Overzicht
Beheer fysieke werkplekken met apparatuur slots en bezettingsinformatie.

### Functionaliteiten

#### Werkplek Configuratie
- **Code**: Unieke werkplek code (bijv. "WP-ICT-001")
- **Naam**: Beschrijvende naam
- **Gebouw**: Locatie in gebouw
- **Verdieping**: Verdiepingsnummer
- **Ruimte**: Kamer of ruimte nummer

#### Equipment Slots
Elke werkplek heeft vaste slots voor apparatuur:
- **Laptop/Desktop**: Primair werkstation
- **Docking Station**: Docking voor laptop
- **Monitor 1 & 2**: Schermen
- **Toetsenbord**: Keyboard
- **Muis**: Mouse
- **Headset**: Audio apparatuur

#### Bezetting
- **Huidige bezetter**: Medewerker die werkplek gebruikt
- **Bezet sinds**: Datum van ingebruikname
- **Apparaten bezetter**: Intune devices van de bezetter

#### Werkplek Detail Pagina
- Volledige weergave van werkplek configuratie
- Equipment status met asset codes
- Bezettingsgeschiedenis
- Quick actions voor apparatuur beheer

### Gebruik
1. Ga naar **Fysieke Werkplekken** in het menu
2. Klik op een werkplek voor details
3. Gebruik de equipment chips om assets te beheren
4. Koppel medewerkers via de bezetter sectie

---

## 3. Rollout Workflow

### Overzicht
Complete workflow voor IT device deployments bij on/offboarding van medewerkers.

### Workflow Fasen

#### 1. Planning
- **Sessies aanmaken**: Groepeer rollouts in sessies
- **Dagen toevoegen**: Plan specifieke rollout dagen
- **Werkplekken configureren**: Wijs assets toe aan werkplekken

#### 2. Werkplek Toevoegen

##### Handmatig Toevoegen (NIEUW)
- Klik op de **oranje "Werkplek toevoegen"** knop op een dag card
- Of gebruik de knop in de lege staat wanneer een dag nog geen werkplekken heeft
- Vul handmatig gebruikersinformatie in
- Niet afhankelijk van Azure AD import

##### Importeren uit Azure AD
- Klik op de **blauwe "Importeren uit Azure AD"** knop
- Selecteer sector en dienst
- Kies medewerkers om te importeren
- Standaard asset configuratie wordt toegepast

#### 3. Werkplek Configuratie
Voor elke werkplek kun je configureren:
- **Nieuwe apparaten**: Assets die geïnstalleerd worden
- **Oude apparaten**: Assets die ingeleverd worden
- **Fysieke werkplek**: Koppeling aan vaste werkplek
- **Planning datum**: Specifieke datum indien afwijkend

#### 4. Uitvoering
- Scan QR codes om assets te registreren
- Markeer werkplekken als voltooid
- Automatische status updates van assets

#### 5. Rapportage
- Voortgangsoverzicht per sessie
- Asset bewegingen rapport
- Export mogelijkheden

### Asset Status Transities
```
Nieuwe Assets:  Nieuw → InGebruik (+ Eigenaar, Installatiedatum)
Oude Assets:    InGebruik → UitDienst/Defect
Werkplek:       InProgress → Completed
```

### Gebruik
1. Ga naar **Rollouts** in het menu
2. Maak een nieuwe sessie of open een bestaande
3. Voeg dagen toe aan de sessie
4. Voeg werkplekken toe (handmatig of via import)
5. Configureer assets per werkplek
6. Start de uitvoering wanneer klaar

---

## 4. Asset Management

### Overzicht
Centraal beheer van alle IT assets met uitgebreide tracking mogelijkheden.

### Asset Eigenschappen

#### Basis Informatie
- **Asset Code**: Unieke identifier
- **Serienummer**: Hardware serienummer
- **Merk & Model**: Fabrikant informatie
- **Asset Type**: Laptop, Monitor, Docking, etc.
- **Categorie**: Hardware categorie

#### Status Waarden
| Status | Beschrijving |
|--------|-------------|
| Nieuw | Asset toegevoegd, nog niet in gebruik |
| InGebruik | Asset is actief in gebruik |
| Stock | Asset op voorraad |
| Herstelling | Asset in reparatie |
| Defect | Asset is defect |
| UitDienst | Asset uit dienst genomen |

#### Locatie & Eigenaar
- **Eigenaar**: Toegewezen medewerker
- **Fysieke Werkplek**: Vaste locatie
- **Gebouw**: Locatie gebouw
- **Dienst**: Organisatie eenheid

#### Intune Velden (NIEUW)
- **Intune Device ID**: Koppeling met Intune
- **Laatste Sync**: Tijdstip van laatste Intune sync
- **Compliance Status**: Intune compliance status
- **Enrollment Date**: Datum van Intune enrollment

### QR Code Functionaliteit
- **Genereren**: Automatische QR code per asset
- **Downloaden**: SVG formaat voor printen
- **Scannen**: Instant asset lookup via camera

### Asset Templates
Snel assets aanmaken met voorgedefinieerde templates:
- Template per asset type
- Standaard waarden voor merk, model, etc.
- Bulk creatie ondersteuning

### Gebruik
1. Ga naar **Assets** in het menu
2. Gebruik filters om assets te zoeken
3. Klik op een asset voor details
4. Bewerk via de edit knop
5. Scan QR codes voor snelle lookup

---

## 5. Intune Integratie

### Overzicht
Integratie met Microsoft Intune voor device management en synchronisatie.

### Functionaliteiten

#### Device Synchronisatie
- **Automatische sync**: Devices worden gesynchroniseerd vanuit Intune
- **Device details**: Hardware specs, OS versie, compliance status
- **Laatste check-in**: Wanneer device laatst contact had

#### Asset Koppeling
- Koppel Intune devices aan inventory assets
- Automatische serienummer matching
- Sync device eigenschappen naar asset

#### Intune Sync Tab (Admin)
- Overzicht van alle Intune devices
- Sync status en laatste sync tijd
- Handmatige sync trigger
- Koppeling beheer

### Device Informatie
- **Device Name**: Naam in Intune
- **Serial Number**: Hardware serienummer
- **OS Version**: Besturingssysteem versie
- **Compliance**: Compliance status
- **Last Sync**: Laatste synchronisatie
- **Enrolled Date**: Enrollment datum
- **Management Certificate**: Certificaat vervaldatum

### Gebruik
1. Ga naar **Admin** → **Intune Sync**
2. Klik op **Synchroniseren** voor handmatige sync
3. Bekijk device status en koppelingen
4. Koppel devices aan assets indien nodig

---

## 6. Organisatie Hiërarchie

### Overzicht
Volledige ondersteuning voor organisatie structuur met sectoren en diensten.

### Structuur
```
Sector (MG-SECTOR-*)
  └── Dienst (MG-*)
        └── Medewerkers
```

### Functionaliteiten

#### Sector Beheer
- Automatische sync vanuit Entra mail groups
- Sector code en naam
- Gekoppelde diensten

#### Dienst Beheer
- Dienst code en naam
- Gekoppelde sector
- Teamcoördinator informatie
- Medewerkers overzicht

#### Organisatie Tree View
- Visuele hiërarchie weergave
- Expandable tree structuur
- Filter op sector/dienst niveau
- Multi-select ondersteuning

#### Service Select Component
- Dropdown met gegroepeerde diensten
- Zoek functionaliteit
- Sector groupering
- Multi-select optie

### Gebruik
1. Ga naar **Admin** → **Organisatie**
2. Bekijk de organisatie structuur
3. Synchroniseer vanuit Azure AD
4. Gebruik filters in andere pagina's

---

## 7. Dashboard

### Overzicht
Centraal overzicht van alle belangrijke metrics en activiteiten.

### Widgets

#### Asset Statistieken
- Totaal aantal assets
- Assets per status
- Assets per categorie
- Trend grafieken

#### Rollout Status
- Actieve rollout sessies
- Vandaag geplande werkplekken
- Voortgang huidige sessies

#### Vervallende Leases
- Leases die binnenkort verlopen
- Waarschuwingen voor actie
- Quick links naar lease details

#### Recente Wijzigingen
- Laatste asset wijzigingen
- Werkplek updates
- Audit trail

### Filters (NIEUW)

#### Multi-Select Filters
- **Dienst Filter**: Filter op één of meerdere diensten
- **Gebouw Filter**: Filter op locatie
- **Status Filter**: Filter op asset status

#### Filter UI
- Expandable filter chips
- Iconen voor visuele herkenning
- Tooltips met filter informatie
- Clear all filters optie

### Gebruik
1. Dashboard is de startpagina na inloggen
2. Gebruik filters om data te verfijnen
3. Klik op widgets voor meer details
4. Exporteer data indien nodig

---

## 8. Admin Interface

### Overzicht
Volledig herontworpen admin interface met sidebar navigatie.

### Navigatie Structuur

#### Sidebar Menu
- **Overzicht**: Admin dashboard
- **Asset Types**: Beheer asset types
- **Categorieën**: Beheer categorieën
- **Gebouwen**: Locatie beheer
- **Diensten**: Organisatie diensten
- **Sectoren**: Organisatie sectoren
- **Fysieke Werkplekken**: Werkplek beheer
- **Medewerkers**: Medewerker beheer
- **Intune Sync**: Intune synchronisatie
- **Organisatie**: Organisatie structuur

### Admin Data Table
Herbruikbare tabel component met:
- Sorteerbare kolommen
- Pagination
- Zoek functionaliteit
- Inline editing
- Bulk acties

### Features per Tab

#### Asset Types
- CRUD operaties
- Icon toewijzing
- Categorie koppeling

#### Categorieën
- Hiërarchische categorieën
- Parent-child relaties

#### Gebouwen
- Locatie codes
- Adres informatie
- Verdiepingen

#### Diensten
- CSV import/export
- Sector koppeling
- Medewerker telling

#### Fysieke Werkplekken
- Gap analyse (NIEUW)
- Bulk import
- Equipment configuratie

### Gebruik
1. Ga naar **Admin** in het menu
2. Navigeer via de sidebar
3. Gebruik de data tables voor CRUD operaties
4. Importeer/exporteer via CSV waar beschikbaar

---

## 9. Laptop Swap

### Overzicht
Gestroomlijnde workflow voor het vervangen van laptops.

### Functionaliteiten

#### Swap Modes
- **Onboarding**: Nieuwe laptop voor nieuwe medewerker
- **Offboarding**: Laptop inname bij vertrek (NIEUW)
- **Replacement**: Vervangen van bestaande laptop

#### Workflow Stappen
1. **Selecteer Medewerker**: Zoek en selecteer medewerker
2. **Huidige Laptop**: Toon huidige laptop (indien van toepassing)
3. **Nieuwe Laptop**: Selecteer vervangende laptop
4. **Bevestig**: Review en bevestig de swap

#### Tracking
- Deployment historie
- Swap redenen
- Timestamp logging
- Gebruiker tracking

### Deployment Historie
- Overzicht van alle swaps
- Filter op datum, medewerker, asset
- Export mogelijkheden
- Detail weergave per swap

### Gebruik
1. Ga naar **Laptop Swap** in het menu
2. Selecteer swap mode
3. Volg de wizard stappen
4. Bevestig de swap
5. Bekijk historie voor overzicht

---

## UI/UX Verbeteringen

### Consistente Styling
- **Filter Kleuren**: Gecentraliseerde kleuren voor filters
  - Oranje: Assets
  - Teal: Diensten
  - Blauw: Sectoren/Gebouwen
  - Paars: Medewerkers

### Icon Buttons
- Outlined style voor betere zichtbaarheid
- Hover effecten
- Tooltips

### Mobile Ondersteuning
- Card views voor tabellen op mobile
- Responsive layouts
- Touch-friendly controls

### Neumorphic Design
- Soft shadows
- Subtle depth effecten
- Modern look and feel

---

## Keyboard Shortcuts

| Shortcut | Actie |
|----------|-------|
| `Ctrl + K` | Zoeken |
| `Esc` | Sluit dialoog |
| `Enter` | Bevestig actie |

---

## API Endpoints

Zie de Swagger documentatie op `/swagger` voor volledige API documentatie.

### Belangrijke Endpoints
- `GET /api/assets` - Assets ophalen
- `GET /api/employees` - Medewerkers ophalen
- `GET /api/rollout/sessions` - Rollout sessies
- `GET /api/physical-workplaces` - Fysieke werkplekken
- `POST /api/intune/sync` - Intune synchronisatie

---

## Configuratie

Zie `CLAUDE.md` voor gedetailleerde configuratie instructies.

### Omgevingsvariabelen
- Frontend: `.env.development` / `.env.production`
- Backend: `appsettings.json` / User Secrets

### Azure Configuratie
- Entra ID app registraties
- Key Vault secrets
- App Service instellingen

---

*Laatste update: Maart 2026*

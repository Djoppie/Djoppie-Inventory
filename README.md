# Djoppie Inventory - Gebruikershandleiding

> **For Developers:** See [INSTALLATION-GUIDE.md](INSTALLATION-GUIDE.md) for complete installation, deployment, and development setup instructions.

## 🚀 Direct aan de slag

**DEV Omgeving - Nu beschikbaar!**

- **Applicatie:** https://blue-cliff-031d65b03.1.azurestaticapps.net
- **Inloggen:** Gebruik uw Diepenbeek Microsoft-account
- **Eerste keer?** Zie [Aan de slag](#aan-de-slag) hieronder voor instructies

---

## 📜 Inhoudsopgave

1. [Projectoverzicht](#projectoverzicht)
2. [Aan de slag](#aan-de-slag)
3. [Kernfuncties - Stap voor stap](#kernfuncties---stap-voor-stap)
4. [Microsoft Intune Integratie](#microsoft-intune-integratie)
5. [Veelvoorkomende Werkstromen](#veelvoorkomende-werkstromen)
6. [Probleemoplossing](#probleemoplossing)
7. [Veelgestelde Vragen (FAQ)](#veelgestelde-vragen-faq)
8. [Contact & Ondersteuning](#contact--ondersteuning)

---

## 👓 Projectoverzicht

### Wat is Djoppie Inventory?

**Djoppie Inventory** is een modern activa- en voorraadbeheerssysteem, speciaal ontworpen voor IT-ondersteuningsmedewerkers en voorraadbeheerders. Het systeem biedt een eenvoudige en efficiënte manier om IT-activa te volgen, beheren en onderhouden binnen uw organisatie.

### Voor wie is dit?

- **IT-ondersteuningsmedewerkers**: Beheer en volg IT-apparatuur zoals laptops, monitoren, printers en netwerkcomponenten
- **Voorraadbeheerders**: Houd overzicht over alle activa, hun locaties, eigenaren en onderhoudsstatus
- **Facilitair medewerkers**: Beheer de toewijzing van apparatuur aan medewerkers en locaties

### Belangrijkste voordelen

- **Snelle opzoekfunctie**: Scan QR-codes of voer activacodes handmatig in voor directe toegang tot informatie
- **Intune-integratie**: Automatische synchronisatie met Microsoft Intune voor uitgebreide hardware-inventarisatie
- **Real-time overzicht**: Actueel dashboard met alle activa en hun status
- **Volledige levenscyclus**: Volg activa van aankoop tot buiten gebruik stellen
- **Professionele interface**: Moderne, gebruiksvriendelijke interface in "Djoppie-stijl"

### Belangrijkste functies

1. **QR-code scannen**: Instant opzoeken van activa door QR-codes te scannen met uw camera
2. **Activa dashboard**: Overzichtelijk dashboard met filters voor status (Actief/Onderhoud)
3. **Activa beheer**: Toevoegen, bewerken en verwijderen van activa met sjabloonondersteuning
4. **Gedetailleerde informatie**: Volledige specificaties, eigenaar, locatie, garantie en geschiedenis
5. **QR-code generatie**: Automatisch gegenereerde QR-codes voor elk activa om af te drukken
6. **Sjabloonbibliotheek**: Vooraf gedefinieerde sjablonen voor veelvoorkomende IT-apparatuur

### Ondersteunde activacategorieën

Het systeem ondersteunt verschillende categorieën IT-activa:

- **Computers**: Laptops, desktops, tablets
- **Randapparatuur**: Printers, scanners, muizen, toetsenborden
- **Netwerken**: Switches, routers, access points
- **Beeldschermen**: Monitoren, projectoren, displays
- **Mobiel**: Smartphones, tablets
- **Audio**: Headsets, speakers, microfoons
- **Meubilair**: Bureaus, stoelen, kasten
- **Overig**: Andere bedrijfsmiddelen

---

## 🤖 Aan de slag

### Toegang tot de applicatie

**DEV Omgeving:**

1. **Open uw webbrowser** (Chrome, Firefox, Edge of Safari)
2. **Navigeer naar:** https://blue-cliff-031d65b03.1.azurestaticapps.net
3. **U wordt automatisch doorgestuurd naar de Microsoft-aanmeldingspagina**

> **Let op:** Gebruik uw Diepenbeek Microsoft-account (@diepenbeek.onmicrosoft.com) om in te loggen.

### Inloggen met Microsoft Entra ID

Djoppie Inventory maakt gebruik van Single Sign-On (SSO) via Microsoft Entra ID voor veilige authenticatie.

**Stap 1: Aanmeldscherm**

- Klik op de knop **"Aanmelden met Microsoft"**
- U wordt doorgestuurd naar de bekende Microsoft-aanmeldingspagina

**Stap 2: Accountselectie**

- Selecteer uw **werk- of schoolaccount** (uw Diepenbeek-account)
- Als u al bent ingelogd in andere Microsoft-diensten, wordt uw account mogelijk automatisch geselecteerd

**Stap 3: Toestemming verlenen**

- Bij uw eerste aanmelding wordt mogelijk gevraagd om toestemming te geven voor Djoppie Inventory
- Lees de gevraagde machtigingen door en klik op **"Accepteren"**
- Deze stap hoeft u slechts eenmaal uit te voeren

**Stap 4: Welkom bij Djoppie Inventory**

- Na succesvolle aanmelding wordt u doorgestuurd naar het dashboard
- Uw naam en profielfoto worden rechtsboven weergegeven

### Eerste gebruik

Bij uw eerste gebruik van Djoppie Inventory:

1. **Verken het dashboard**: Bekijk het overzicht van alle geregistreerde activa
2. **Bekijk de navigatie**: Onderaan het scherm vindt u drie knoppen:
   - **Dashboard**: Overzicht van alle activa
   - **Scannen**: QR-code scanner en handmatige zoekopdracht
   - **Activa**: Nieuw activa toevoegen
3. **Taalinstellingen**: Klik rechtsboven op het taalicoon om te wisselen tussen Nederlands en Engels
4. **Thema**: Klik op het maan/zon-icoon om te schakelen tussen donkere en lichte modus

### Gebruikersinterface overzicht

**Bovenbalk (Header)**:

- **Djoppie-logo**: Links in de balk
- **Taalwissel**: Schakel tussen Nederlands (NL) en Engels (EN)
- **Themawissel**: Donkere of lichte modus
- **Gebruikersprofiel**: Uw naam, profielfoto en uitlog-knop

**Hoofdgedeelte (Main Area)**:

- Dynamische inhoud afhankelijk van de geselecteerde pagina
- Dashboard, Scanner, of Activaformulier

**Navigatiebalk (Bottom Navigation)**:

- **Dashboard**: Toon alle activa met filtermogelijkheden
- **Scannen**: Open de QR-scanner of handmatige invoer
- **Activa**: Voeg een nieuw activa toe

---

## 💎 Kernfuncties - Stap voor stap

### 1. QR-code scannen

De QR-scanner is de snelste manier om informatie over een activa op te zoeken.

**Stap 1: Open de Scanner**

- Klik op de **"Scannen"**-knop in de navigatiebalk onderaan het scherm
- U ziet twee tabbladen: **QR Scanner** en **Handmatige invoer**

**Stap 2: Camera toestemming**

- Bij het eerste gebruik vraagt uw browser om toestemming voor cameratoegang
- Klik op **"Toestaan"** in het pop-upvenster
- De camera wordt geactiveerd en u ziet een live beeld

**Stap 3: QR-code scannen**

- Richt uw camera op de QR-code van het activa
- Houd de camera stabiel op ongeveer 10-20 cm afstand
- De code wordt automatisch herkend (dit duurt meestal minder dan 1 seconde)

**Stap 4: Resultaat bekijken**

- Na succesvolle scan wordt u automatisch doorgestuurd naar de detailpagina van het activa
- Als de code niet wordt herkend, verschijnt een foutmelding

**Tips voor succesvol scannen**:

- Zorg voor goede belichting
- Houd de camera stabiel
- Zorg dat de volledige QR-code zichtbaar is
- Vermijd reflecties of schaduwen op de code

### 2. Handmatig zoeken naar activa

Als QR-scannen niet mogelijk is, kunt u handmatig naar een activa zoeken.

**Stap 1: Handmatige invoer openen**

- Ga naar de Scanner-pagina
- Klik op het tabblad **"Handmatige invoer"**

**Stap 2: Activacode invoeren**

- Typ de activacode in het invoerveld (bijv. "AST-001")
- De code is hoofdlettergevoelig
- Zorg dat u de code exact invoert zoals deze op het activa staat

**Stap 3: Zoeken**

- Klik op de knop **"Zoeken"** of druk op **Enter**
- Het systeem zoekt naar het activa

**Stap 4: Resultaat**

- Bij een gevonden activa wordt u doorgestuurd naar de detailpagina
- Bij een niet-gevonden code verschijnt de melding: "Activa niet gevonden: [code]"

### 3. Activa bekijken (Detailpagina)

De detailpagina toont alle informatie over een specifiek activa.

**Informatie op de detailpagina**:

**Identificatie**:

- Activacode (unieke identifier)
- Activanaam (beschrijving)
- Categorie (Computers, Randapparatuur, etc.)
- Status badge (Actief of Onderhoud)

**Toewijzingsgegevens**:

- Eigenaar (medewerker aan wie het activa is toegewezen)
- Gebouw (locatie van het activa)
- Ruimte/Verdieping (specifieke locatie)

**Technische specificaties**:

- Merk (bijv. Dell, HP)
- Model (bijv. Latitude 5420)
- Serienummer (uniek fabrikantsnummer)

**Levenscyclus informatie**:

- Aankoopdatum
- Garantieverloopdatum
- Installatiedatum
- Aanmaakdatum (wanneer toegevoegd aan systeem)
- Laatst bijgewerkt

**QR-code**:

- Rechts op de pagina ziet u een grote, scanbare QR-code
- Klik op **"Download QR Code"** om deze als SVG-bestand te downloaden en af te drukken

**Acties**:

- **Bewerken**: Wijzig de gegevens van het activa
- **Verwijderen**: Verwijder het activa permanent uit het systeem

### 4. Nieuw activa toevoegen

**Stap 1: Navigeer naar het formulier**

- Klik op **"Activa"** in de navigatiebalk onderaan
- U komt op de pagina "Activa toevoegen"

**Stap 2: Kies een sjabloon (optioneel)**

- Bovenaan ziet u een dropdown **"Selecteer Sjabloon (Optioneel)"**
- Kies een voorgedefinieerd sjabloon om velden automatisch in te vullen:
  - Dell Latitude Laptop (Computers)
  - HP LaserJet Printer (Randapparatuur)
  - Cisco Network Switch (Netwerken)
  - Samsung Monitor 27" (Beeldschermen)
  - Logitech Wireless Mouse (Randapparatuur)
- Of kies **"Geen sjabloon - Handmatig invoeren"** om alle velden zelf in te vullen

**Stap 3: Vul de identificatiegegevens in** (verplicht)

- **Activacode**: Unieke code (bijv. "AST-2024-001")
  - Gebruik een consistent nummerschema
  - Deze code wordt gebruikt voor QR-codes en zoekopdrachten
- **Activanaam**: Beschrijvende naam (bijv. "Dell Latitude 5420 Laptop")
- **Categorie**: Kies of typ de categorie (bijv. "Computers")
- **Status**: Selecteer "Actief" of "Onderhoud"

**Stap 4: Vul de toewijzingsgegevens in** (verplicht)

- **Eigenaar**: Naam van de medewerker (bijv. "Jan Janssen")
- **Gebouw**: Locatie (bijv. "Hoofdgebouw Diepenbeek")
- **Ruimte/Verdieping**: Specifieke locatie (bijv. "Verdieping 2, Kamer 205")

**Stap 5: Vul technische details in** (optioneel)

- **Merk**: Fabrikant (bijv. "Dell")
- **Model**: Modelnummer (bijv. "Latitude 5420")
- **Serienummer**: Uniek serienummer van de fabrikant

**Stap 6: Vul levenscyclus informatie in** (optioneel)

- **Aankoopdatum**: Wanneer het activa is aangeschaft
- **Garantieverloopdatum**: Einddatum van de fabrieksgarantie
- **Installatiedatum**: Wanneer het activa in gebruik is genomen

**Stap 7: Opslaan**

- Klik op **"Opslaan"** onderaan het formulier
- Bij ontbrekende verplichte velden krijgt u een foutmelding
- Na succesvol opslaan verschijnt de melding "Activa succesvol opgeslagen"
- U wordt automatisch doorgestuurd naar het dashboard

**Stap 8: Annuleren**

- Klik op **"Annuleren"** om terug te gaan zonder op te slaan
- Niet-opgeslagen wijzigingen gaan verloren

### 5. Activa bewerken

**Stap 1: Open het activa**

- Zoek het activa via het dashboard of de scanner
- Open de detailpagina

**Stap 2: Bewerkmodus openen**

- Klik op de knop **"Bewerken"** rechtsboven

**Stap 3: Wijzig de gegevens**

- Het bewerkingsformulier toont alle huidige gegevens
- **Let op**: De activacode kan niet worden gewijzigd (dit is de unieke identifier)
- Wijzig de gewenste velden

**Stap 4: Opslaan of annuleren**

- Klik op **"Opslaan"** om de wijzigingen te bevestigen
- Of klik op **"Annuleren"** om terug te gaan zonder wijzigingen

### 6. Activa verwijderen

**Waarschuwing**: Verwijderen is permanent en kan niet ongedaan worden gemaakt.

**Stap 1: Open het activa**

- Ga naar de detailpagina van het activa

**Stap 2: Verwijderen starten**

- Klik op de rode knop **"Verwijderen"** rechtsboven

**Stap 3: Bevestiging**

- Een dialoogvenster verschijnt met de vraag:
  "Weet u zeker dat u [Activanaam] ([Activacode]) wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt."
- Klik op **"Verwijderen"** om te bevestigen
- Of klik op **"Annuleren"** om terug te gaan

**Stap 4: Resultaat**

- Het activa wordt permanent verwijderd
- U wordt automatisch teruggestuurd naar het dashboard

### 7. Dashboard gebruiken

Het dashboard is uw centrale overzicht van alle activa.

**Overzichtsstatistieken**:

- **Total Assets**: Totaal aantal geregistreerde activa
- **Active**: Aantal activa met status "Actief"
- **Maintenance**: Aantal activa met status "Onderhoud"

**Filteren op status**:

- Klik op de dropdown **"Filter op status"** rechtsboven
- Selecteer:
  - **"Alle activa"**: Toon alle activa ongeacht status
  - **"Actief"**: Toon alleen actieve activa
  - **"Onderhoud"**: Toon alleen activa in onderhoud
- Het dashboard wordt direct bijgewerkt

**Activalijst**:

- Alle activa worden weergegeven als kaarten
- Elke kaart toont:
  - Activanaam
  - Activacode
  - Categorie
  - Status badge (groen voor Actief, oranje voor Onderhoud)
  - Eigenaar
  - Locatie (gebouw + ruimte)
- Klik op een kaart om de volledige details te bekijken

**Zoeken in de lijst**:

- Gebruik de filterfunctie bovenaan
- Of scroll door de lijst om handmatig te zoeken

### 8. QR-codes genereren en downloaden

Elk activa heeft automatisch een unieke QR-code.

**Stap 1: Open de detailpagina**

- Zoek het activa waarvoor u een QR-code wilt downloaden

**Stap 2: Bekijk de QR-code**

- Rechts op de detailpagina ziet u een grote QR-code
- Deze code bevat de activacode

**Stap 3: Download de QR-code**

- Klik op de knop **"Download QR Code"**
- Het bestand wordt gedownload als SVG-formaat
- Bestandsnaam: `[ACTIVACODE]-QR.svg`

**Stap 4: Afdrukken en aanbrengen**

- Open het SVG-bestand in een afbeeldingsviewer of browser
- Druk de QR-code af op een etiket of sticker
- Plak deze op het fysieke activa
- De code kan nu worden gescand voor snelle toegang tot informatie

**Tips voor afdrukken**:

- Gebruik een minimale grootte van 3x3 cm voor goede scanbaarheid
- Druk af op mat papier om reflecties te voorkomen
- Test de QR-code na het afdrukken met de scanner

---

## 👨‍💻 Microsoft Intune Integratie

### Wat is Microsoft Intune-integratie?

Microsoft Intune is een cloudgebaseerde service voor het beheer van mobiele apparaten en applicaties. Djoppie Inventory integreert met Intune om uitgebreide hardware-inventarisgegevens op te halen voor apparaten die worden beheerd door uw organisatie.

### Hoe verrijkt Intune de hardware-inventaris?

Voor apparaten die zijn geregistreerd in Microsoft Intune, haalt Djoppie Inventory automatisch aanvullende informatie op:

- **Apparaatspecificaties**: Processor, RAM, schijfruimte
- **Besturingssysteemversie**: Windows-versie, buildnummer
- **Laatst gesynchroniseerd**: Wanneer het apparaat voor het laatst contact had met Intune
- **Compliance-status**: Of het apparaat voldoet aan organisatiebeleid
- **Geïnstalleerde applicaties**: Overzicht van software op het apparaat
- **Beveiligingsstatus**: BitLocker-status, antivirus-status

### Ondersteunde apparaattypen

De Intune-integratie werkt met:

- **Intune Managed Devices**: Volledig beheerde apparaten
- **Microsoft Entra Joined**: Apparaten die zijn toegevoegd aan Azure AD
- **Entra Hybrid Joined**: Apparaten die zowel on-premises als cloud-joined zijn

### Intune-gegevens bekijken

**Let op**: Deze functie is momenteel in ontwikkeling. In toekomstige versies zal Intune-informatie zichtbaar zijn op de activadetailpagina.

**Geplande functionaliteit**:

- Tabblad "Intune-informatie" op de detailpagina
- Automatische synchronisatie van hardware-specs bij opslaan
- Koppeling naar Intune-apparaatbeheerportal
- Compliance-status indicator

### Intune-apparaatbeheerportal

Als IT-beheerder kunt u de Microsoft Intune-portal bezoeken:

1. Ga naar: [https://intune.microsoft.com](https://intune.microsoft.com)
2. Log in met uw beheerdersaccount
3. Navigeer naar **Apparaten** → **Overzicht**
4. Bekijk alle beheerde apparaten en hun status

---

## 🧭 Veelvoorkomende Werkstromen

### Scenario 1: Nieuwe laptop registreren

**Situatie**: Een nieuwe Dell Latitude laptop is aangekocht en moet worden geregistreerd.

**Stappen**:

1. **Navigeer naar Activa toevoegen**
   - Klik op "Activa" in de navigatiebalk

2. **Gebruik het Dell Latitude sjabloon**
   - Selecteer in de dropdown: "Dell Latitude Laptop (Computers)"
   - Merk, model en categorie worden automatisch ingevuld

3. **Vul de unieke gegevens in**
   - **Activacode**: Bijvoorbeeld "LAP-2024-015" (volg uw organisatie-nummerschema)
   - **Activanaam**: Bijvoorbeeld "Dell Latitude 5420 - Medewerker ABC"
   - **Status**: "Actief"

4. **Vul toewijzingsgegevens in**
   - **Eigenaar**: Naam van de medewerker
   - **Gebouw**: "Hoofdgebouw Diepenbeek"
   - **Ruimte/Verdieping**: "Verdieping 2, Kamer 205"

5. **Vul technische details in**
   - **Serienummer**: Vind dit op het label aan de onderkant van de laptop
   - Merk en model zijn al ingevuld via het sjabloon

6. **Vul levenscyclus in**
   - **Aankoopdatum**: Factuurdatum
   - **Garantieverloopdatum**: Meestal aankoopdatum + 3 jaar
   - **Installatiedatum**: Vandaag of de datum waarop de laptop is uitgegeven

7. **Opslaan**
   - Klik op "Opslaan"
   - U ziet de bevestiging en wordt doorgestuurd

8. **Download en druk QR-code af**
   - Open de detailpagina van de nieuwe laptop
   - Download de QR-code
   - Druk af en plak op de laptop

**Resultaat**: De laptop is nu geregistreerd, traceerbaar en kan worden gescand.

### Scenario 2: Apparaat uitleveren aan een gebruiker

**Situatie**: Een monitor moet worden uitgegeven aan een nieuwe medewerker.

**Stappen**:

1. **Zoek de monitor**
   - Ga naar het Dashboard
   - Filter op categorie "Beeldschermen" (indien beschikbaar)
   - Of scan de QR-code op de monitor

2. **Open de detailpagina**
   - Klik op de monitor in de lijst

3. **Bewerk de toewijzing**
   - Klik op "Bewerken"
   - Wijzig de velden:
     - **Eigenaar**: Nieuwe medewerker naam
     - **Gebouw**: Werklocatie van de medewerker
     - **Ruimte/Verdieping**: Bureau of kantoor nummer
   - Wijzig indien nodig:
     - **Installatiedatum**: Datum van uitgifte

4. **Opslaan**
   - Klik op "Opslaan"
   - De wijzigingen worden opgeslagen

**Resultaat**: De monitor is nu toegewezen aan de nieuwe medewerker en de locatie is bijgewerkt.

### Scenario 3: Apparaat naar onderhoud sturen

**Situatie**: Een printer functioneert niet goed en moet naar onderhoud.

**Stappen**:

1. **Zoek de printer**
   - Scan de QR-code op de printer
   - Of zoek handmatig via de Scanner-pagina

2. **Open de detailpagina**
   - Bekijk de huidige status (waarschijnlijk "Actief")

3. **Wijzig de status**
   - Klik op "Bewerken"
   - Wijzig het veld **Status** naar "Onderhoud"

4. **Optioneel: Wijzig toewijzing**
   - Als de printer wordt opgehaald:
     - **Eigenaar**: "IT Onderhoud" of laat leeg
     - **Locatie**: "Onderhoudsruimte" of locatie van reparatie

5. **Opslaan**
   - Klik op "Opslaan"

6. **Volgen via Dashboard**
   - Ga naar het Dashboard
   - Filter op "Onderhoud" om alle apparaten in reparatie te zien

**Resultaat**: De printer is gemarkeerd als in onderhoud en verschijnt in de onderhoudslijst.

### Scenario 4: Garantie-informatie opzoeken

**Situatie**: U wilt controleren of een laptop nog onder garantie valt.

**Stappen**:

1. **Zoek de laptop**
   - Scan de QR-code of zoek handmatig

2. **Open de detailpagina**
   - Scroll naar de sectie **"Levenscyclus informatie"**

3. **Bekijk de garantiedatum**
   - **Garantieverloopdatum**: Dit is de einddatum van de garantie
   - Vergelijk deze datum met vandaag:
     - Als de datum in de toekomst ligt: Garantie is geldig
     - Als de datum in het verleden ligt: Garantie is verlopen

4. **Aanvullende informatie**
   - **Aankoopdatum**: Kan worden gebruikt om garantieduur te berekenen
   - **Serienummer**: Nodig bij contact met de fabrikant voor garantieclaim

**Resultaat**: U weet of het apparaat nog onder garantie valt en heeft alle informatie bij de hand voor een eventuele claim.

### Scenario 5: Inventarisatie uitvoeren

**Situatie**: U moet een volledige inventarisatie uitvoeren van alle activa op een bepaalde verdieping.

**Stappen**:

1. **Ga naar het Dashboard**
   - Klik op "Dashboard" in de navigatiebalk

2. **Bekijk het totaaloverzicht**
   - Noteer het totaal aantal activa

3. **Scan alle activa**
   - Ga fysiek naar de verdieping
   - Scan elke QR-code met de Scanner
   - Controleer op de detailpagina of:
     - De locatie klopt
     - De eigenaar klopt
     - De status klopt
   - Ga terug met de "Terug"-knop en scan het volgende activa

4. **Ontbrekende activa**
   - Maak een lijst van activa die wel in het systeem staan maar niet fysiek aanwezig zijn
   - Deze activa kunnen mogelijk verloren zijn of verplaatst naar een andere locatie

5. **Ongeregistreerde activa**
   - Als u een activa vindt zonder QR-code:
     - Registreer deze als nieuw activa
     - Download en druk de QR-code af
     - Bevestig op het activa

**Resultaat**: U heeft een actuele inventarisatie van alle activa en kunt discrepanties rapporteren.

---

## 🚑 Probleemoplossing

### QR-scanner werkt niet

**Probleem**: De camera start niet of de QR-code wordt niet herkend.

**Oorzaken en oplossingen**:

#### 1. Toestemming geweigerd

**Symptoom**: Melding "Camera opstarten mislukt" of "Toestemming geweigerd"

**Oplossing**:

- Klik op het **camerapictogram** in de adresbalk van uw browser (naast de URL)
- Selecteer **"Toestaan"** voor cameratoegang
- Vernieuw de pagina (F5 of Ctrl+R)
- Probeer de scanner opnieuw te openen

**Browser-specifieke instellingen**:

- **Chrome**: Instellingen → Privacy en beveiliging → Site-instellingen → Camera
- **Firefox**: Instellingen → Privacy & Beveiliging → Machtigingen → Camera
- **Edge**: Instellingen → Cookies en site-machtigingen → Camera

#### 2. Geen HTTPS-verbinding

**Symptoom**: Camera werkt niet in productieomgeving

**Oplossing**:

- Moderne browsers vereisen HTTPS voor cameratoegang (behalve voor localhost)
- Controleer of de URL begint met **"https://"** of **"<http://localhost>"**
- Neem contact op met uw IT-beheerder als de site niet via HTTPS beschikbaar is

#### 3. Geen camera gedetecteerd

**Symptoom**: Melding "Geen camera gevonden"

**Oplossing**:

- Controleer of uw apparaat een camera heeft
- Voor externe camera's: controleer de USB-verbinding
- Test de camera in een andere applicatie (bijv. Windows Camera-app)
- Probeer de camera opnieuw aan te sluiten

#### 4. Camera al in gebruik

**Symptoom**: Melding dat de camera wordt gebruikt door een andere applicatie

**Oplossing**:

- Sluit andere applicaties die de camera gebruiken:
  - Microsoft Teams
  - Zoom
  - Skype
  - OBS Studio
  - Andere browsertabbladen met camera-apps
- Herstart de browser indien nodig

#### 5. QR-code wordt niet herkend

**Symptoom**: Camera werkt maar scant de QR-code niet

**Oplossing**:

- Zorg voor **goede belichting** (geen fel tegenlicht)
- Houd de camera **stabiel** op 10-20 cm afstand
- Zorg dat de **volledige QR-code zichtbaar** is
- Vermijd **reflecties** of **schaduwen** op de code
- Veeg het cameralensobject schoon indien nodig

#### Alternatieve oplossing: Handmatige invoer

Als de QR-scanner niet werkt:

- Klik op het tabblad **"Handmatige invoer"**
- Typ de activacode die op het label staat
- Klik op "Zoeken"

### Kan een activa niet vinden

**Probleem**: Zoeken naar een activa levert geen resultaten op.

**Mogelijke oorzaken en oplossingen**:

#### 1. Typefout in activacode

**Oplossing**:

- Controleer of u de code **exact** heeft ingevoerd
- Let op **hoofdletters en kleine letters** (AST-001 ≠ ast-001)
- Controleer op **spaties** aan het begin of einde
- Controleer op **vergelijkbare tekens** (O vs 0, I vs 1)

#### 2. Activa bestaat niet in systeem

**Oplossing**:

- Ga naar het Dashboard en blader door alle activa
- Als het activa er niet tussen staat, is het niet geregistreerd
- Registreer het activa via "Activa toevoegen"

#### 3. Verkeerde activacode

**Oplossing**:

- Controleer het fysieke label op het activa
- De QR-code bevat de juiste code - probeer te scannen
- Neem contact op met de IT-afdeling als de code onduidelijk is

### Inlogproblemen

**Probleem**: Kan niet inloggen of krijg foutmelding bij aanmelden.

**Mogelijke oorzaken en oplossingen**:

#### 1. Niet gemachtigd

**Symptoom**: "U bent niet gemachtigd" of "Toegang geweigerd"

**Oplossing**:

- Controleer of u een geldig **werk- of schoolaccount** van Diepenbeek heeft
- Neem contact op met uw IT-beheerder om toegang aan te vragen
- Mogelijk moet u worden toegevoegd aan een beveiligingsgroep

#### 2. Verkeerd account

**Symptoom**: Ingelogd met persoonlijk Microsoft-account

**Oplossing**:

- Log uit en log opnieuw in
- Selecteer bij aanmelding uw **werk- of schoolaccount**
- Klik indien nodig op "Een ander account gebruiken"

#### 3. Browser-cache problemen

**Symptoom**: Herhaalde doorverwijzingen of lus bij inloggen

**Oplossing**:

- Wis de **browsercache en cookies**:
  - Chrome: Ctrl+Shift+Delete
  - Firefox: Ctrl+Shift+Delete
  - Edge: Ctrl+Shift+Delete
- Selecteer "Cookies en andere sitegegevens" en "Afbeeldingen en bestanden in cache"
- Vernieuw de pagina en probeer opnieuw in te loggen

#### 4. Pop-up geblokkeerd

**Symptoom**: Niets gebeurt bij klikken op "Aanmelden met Microsoft"

**Oplossing**:

- Controleer of **pop-ups zijn toegestaan** voor deze site
- Kijk naar de adresbalk voor een pop-up blokkade-melding
- Klik op "Altijd toestaan" voor deze site

### Backend-API reageert niet

**Probleem**: Melding "Backend-API reageert niet" of netwerkfout.

**Symptoom**:

- Laadschermen die niet verdwijnen
- Foutmelding "Netwerkfout"
- Geen activa zichtbaar op het dashboard

**Oplossing**:

**Voor gebruikers**:

- **Wacht enkele minuten** en probeer opnieuw
- **Vernieuw de pagina** (F5 of Ctrl+R)
- Controleer uw **internetverbinding**
- Neem contact op met de **IT-helpdesk** als het probleem aanhoudt

**Voor IT-beheerders/ontwikkelaars**:

- Controleer of de **backend-server actief** is
- Controleer de **Azure App Service** status
- Bekijk de **Application Insights logs** voor foutmeldingen
- Controleer de **database-connectie**

### Problemen met QR-code download

**Probleem**: QR-code wordt niet gedownload of is onleesbaar.

**Oplossing**:

#### 1. Download werkt niet

- Controleer of **downloads zijn toegestaan** in uw browser
- Probeer een andere browser
- Rechtermuisklik op de QR-code en kies "Opslaan als..."

#### 2. QR-code onleesbaar na afdrukken

- Download opnieuw als **SVG-formaat** (vectorafbeelding)
- Gebruik minimaal **3x3 cm** afdrukformaat
- Druk af op **wit papier** zonder textuur
- Test de afgedrukte code met de scanner

### Pagina laadt niet correct

**Probleem**: Lege pagina, ontbrekende elementen of rare layout.

**Oplossing**:

1. **Hard refresh** (negeer cache):
   - Windows: Ctrl + F5
   - Mac: Cmd + Shift + R

2. **Wis browser cache**:
   - Zie instructies bij "Inlogproblemen"

3. **Probeer een andere browser**:
   - Aanbevolen: Chrome, Firefox, Edge (recente versies)

4. **Update uw browser**:
   - Controleer of u de nieuwste versie gebruikt

5. **Schakel browser extensies uit**:
   - Sommige ad-blockers of privacy-extensies kunnen problemen veroorzaken

---

## ⁉️ Veelgestelde Vragen (FAQ)

### Algemene vragen

**V: Wat is een activacode?**
A: Een activacode is een unieke identifier voor elk activa in het systeem (bijv. "AST-001", "LAP-2024-015"). Deze code wordt gebruikt voor het genereren van QR-codes en het opzoeken van activa. Elke organisatie kan zijn eigen nummerschema hanteren.

**V: Kan ik de activacode achteraf wijzigen?**
A: Nee, de activacode kan niet worden gewijzigd na het aanmaken van een activa. Dit voorkomt verwarring en houdt QR-codes geldig. Als u de code moet wijzigen, moet u een nieuw activa aanmaken en het oude verwijderen.

**V: Hoeveel activa kan ik registreren?**
A: Er is geen harde limiet aan het aantal activa. Het systeem is ontworpen om duizenden activa efficiënt te beheren.

**V: Kan ik bulk-uploads doen?**
A: Deze functie is momenteel niet beschikbaar maar staat op de roadmap voor toekomstige releases. Neem contact op met uw IT-beheerder voor bulk-import bij grote aantallen activa.

**V: Ondersteunt het systeem andere talen dan Nederlands en Engels?**
A: Momenteel worden Nederlands en Engels ondersteund. Aanvullende talen kunnen in de toekomst worden toegevoegd op basis van vraag.

### Vragen over QR-codes

**V: Welk formaat heeft de QR-code?**
A: QR-codes worden gedownload als SVG (Scalable Vector Graphics). Dit is een vectorformaat dat zonder kwaliteitsverlies kan worden geschaald naar elke grootte.

**V: Kan ik de QR-code als PNG of JPG downloaden?**
A: Niet rechtstreeks vanuit de applicatie. U kunt het SVG-bestand openen in een afbeeldingseditor (zoals Inkscape, Adobe Illustrator, of online converters) en exporteren naar PNG of JPG.

**V: Hoe groot moet ik de QR-code afdrukken?**
A: Een minimale grootte van 3x3 cm wordt aanbevolen voor betrouwbare scanbaarheid. Voor apparaten die op grotere afstand worden gescand, gebruikt u 5x5 cm of groter.

**V: Kan ik de QR-code in kleur afdrukken?**
A: Ja, maar zwart-wit werkt het beste. Als u kleur gebruikt, zorg dan voor voldoende contrast tussen de QR-code (donker) en de achtergrond (licht).

**V: Wat staat er in de QR-code?**
A: De QR-code bevat alleen de activacode (bijv. "AST-001"). Bij scannen zoekt het systeem dit activa op en toont de volledige informatie.

### Vragen over activa beheer

**V: Kan ik foto's toevoegen aan een activa?**
A: Deze functie is momenteel niet beschikbaar maar staat gepland voor een toekomstige release.

**V: Kan ik de geschiedenis van een activa bekijken?**
A: Momenteel worden alleen de "Aanmaakdatum" en "Laatst bijgewerkt" bijgehouden. Volledige wijzigingshistorie (wie, wanneer, wat) is gepland voor een toekomstige versie.

**V: Wat betekent de status "Onderhoud"?**
A: Deze status geeft aan dat het activa tijdelijk buiten gebruik is voor reparatie of onderhoud. Het blijft in het systeem maar kan worden gefilterd om het overzicht te behouden.

**V: Zijn er meer statussen gepland?**
A: Ja, toekomstige versies zullen aanvullende statussen ondersteunen zoals "Buiten gebruik", "Verloren", "Beschadigd", etc.

**V: Kan ik activa overdragen aan andere medewerkers?**
A: Ja, bewerk het activa en wijzig het veld "Eigenaar" naar de nieuwe medewerker. Wijzig indien nodig ook de locatiegegevens.

**V: Wat gebeurt er met verwijderde activa?**
A: Verwijderde activa worden permanent uit het systeem verwijderd. Er is geen prullenbak of hersteloptie. Wees voorzichtig bij het verwijderen.

### Vragen over sjablonen

**V: Kan ik mijn eigen sjablonen aanmaken?**
A: Deze functie is momenteel niet beschikbaar voor eindgebruikers.

**V: Welke sjablonen zijn standaard beschikbaar?**
A: Standaard sjablonen zijn:

- Dell Latitude Laptop (Computers)
- HP LaserJet Printer (Randapparatuur)
- Cisco Network Switch (Netwerken)
- Samsung Monitor 27" (Beeldschermen)
- Logitech Wireless Mouse (Randapparatuur)

**V: Wat gebeurt er als ik een sjabloon selecteer?**
A: De velden Activanaam, Categorie, Merk en Model worden automatisch ingevuld. U kunt deze waarden aanpassen indien nodig. Alle andere velden (zoals eigenaar, locatie, serienummer) moet u handmatig invullen.

### Vragen over beveiliging en privacy

**V: Wie kan mijn activa zien?**
A: Alle gebruikers met toegang tot Djoppie Inventory kunnen alle activa bekijken. Er is momenteel geen gebruikersgerichte filtering.

**V: Wordt mijn activiteit gelogd?**
A: Basis audit-informatie (wie, wanneer) wordt bijgehouden voor compliance. Uw IT-beheerder heeft toegang tot deze logs.

**V: Hoe veilig is mijn data?**
A: Djoppie Inventory gebruikt Microsoft Entra ID voor authenticatie en draait op Azure met enterprise-grade beveiliging. Alle communicatie verloopt via versleutelde HTTPS-verbindingen.

**V: Kan ik inloggen vanaf thuis?**
A: Ja, mits u toegang heeft tot uw werk- of schoolaccount. Volg het normale inlogproces via Microsoft Entra ID.

### Vragen over mobiel gebruik

**V: Werkt Djoppie Inventory op mobiele apparaten?**
A: Ja, de interface is responsive en werkt op smartphones en tablets via de webbrowser.

**V: Is er een mobiele app?**
A: Momenteel niet. De webapplicatie is geoptimaliseerd voor mobiel gebruik en biedt volledige functionaliteit in de browser.

**V: Kan ik QR-codes scannen met mijn smartphone?**
A: Ja, open Djoppie Inventory in uw mobiele browser en gebruik de QR-scanner. Zorg ervoor dat u cameratoegang toestaat.

---

## Contact & Ondersteuning

### Hulp nodig?

Als u problemen ondervindt die niet worden opgelost door deze handleiding, kan u een melding maken bij de IT ServiceDesk.

### IT Helpdesk

**Ga naar**: [IT ServiceDesk](https://diepenbeek.sharepoint.com/sites/IN-Servicedesk)

#### 🙋‍♂️ Voor gebruikersvragen

> Onderwerp: "Djoppie Inventory - Gebruikersvragen"

- Inlogproblemen
- Toegangsproblemen
- Technische problemen met de applicatie
- Vragen over gebruik van specifieke functies

**Response tijd**: Binnen 1 werkdag

#### 🙋‍♂️ Bugs of fouten melden

> Onderwerp: "Djoppie Inventory - Bug Report"

**Noteer de volgende informatie**:

- Wat u probeerde te doen
- Wat er gebeurde (inclusief foutmeldingen)
- Wanneer het gebeurde (datum en tijd)
- Welke browser u gebruikt
- Screenshots indien mogelijk

**Verwachting**: Bevestiging binnen 1 werkdag

- Bugs worden geprioriteerd en opgelost in volgende releases

#### 🙋‍♂️ Feature requests (nieuwe functies aanvragen)

Heeft u ideeën voor nieuwe functies of verbeteringen?

Onderwerp: "Djoppie Inventory - Feature Request"

- Beschrijf duidelijk welke functie u wilt en waarom dit nuttig zou zijn

**Populaire geplande features**:

- Volledige wijzigingshistorie
- Bulk-import via Excel/CSV
- Export naar Excel
- Aangepaste velden per categorie
- Meldingen voor garantieverlopen
- Uitgebreide rapportages
- stock

### GitHub Repository

Voor ontwikkelaars en IT-professionals:

**Repository**: [https://github.com/Djoppie/Djoppie-Inventory](https://github.com/Djoppie/Djoppie-Inventory)

Hier vindt u:

- Broncode
- Technische documentatie
- Issue tracker
- Contributierichtlijnen

### Updates en nieuwigheden

Blijf op de hoogte van nieuwe functies en updates:

- Belangrijke updates worden gecommuniceerd via uw IT-afdeling

---

## Bijlage: Best Practices

### Activacodes

Nog te bepalen
**Aanbevolen nummerschema's**:

- **Categoriegebaseerd**: `LAP-001`, `MON-001`, `PRI-001`
- **Jaargebaseerd**: `AST-2024-001`, `AST-2024-002`
- **Locatiegebaseerd**: `HQ-LAP-001`, `SITE2-MON-001`
- **Gecombineerd**: `2024-HQ-LAP-001`

**Tips**:

- Gebruik leading zeros voor sortering (`001` i.p.v. `1`)
- Houd het schema consistent
- Documenteer uw schema voor toekomstige gebruikers
- Reserveer voldoende cijfers voor groei (bijv. 001-999)

### QR-code plaatsing

**Beste locaties**:

- **Laptops**: Onderkant, naast fabrikantslabel
- **Monitoren**: Achterkant, centraal
- **Printers**: Voorkant of bovenkant, goed zichtbaar
- **Netwerkapparatuur**: Voorkant of bovenkant

### Inventarisatie planning

**Aanbevolen frequentie**:

- **Volledige inventarisatie**: 1x per jaar
- **Spot checks**: 1x per kwartaal
- **Bij wijzigingen**: Onmiddellijk bijwerken

**Proces**:

1. Plan vooraf welke gebouwen/verdiepingen
2. Gebruik de QR-scanner voor snelheid
3. Noteer discrepanties
4. Update locaties en eigenaren direct
5. Rapporteer ontbrekende of ongeregistreerde activa

---

**Versie**: 1.0
**Laatst bijgewerkt**: Januari 2026
**Auteur**: Jo Wijnen <mailto:jo.wijnen@Diepenbeek.be>
**Toepasselijk op**: Djoppie Inventory v1.0

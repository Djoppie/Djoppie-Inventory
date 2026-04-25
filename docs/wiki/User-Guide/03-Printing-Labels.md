# Labels afdrukken — Gebruikersgids

Gids voor het afdrukken van QR-codelabels op een Dymo LabelWriter thermische printer.

---

## 1. Overzicht

Elk asset heeft een QR-code die zijn unieke asset-code bevat. Je kunt deze QR-code:

- **Downloaden** als SVG-bestand (voor archivering of eigen printworkflow)
- **Afdrukken als enkel label** vanaf de asset-detailpagina
- **Bulk afdrukken** voor meerdere geselecteerde assets tegelijk

---

## 2. Vereisten

| Wat | Specificatie |
|-----|-------------|
| **Printer** | Dymo LabelWriter 400 of 450 (of compatibel model) |
| **Labels** | 25 mm x 25 mm vierkante labels (Dymo #30334 of compatibel) |
| **Verbinding** | USB, aangesloten op je computer |
| **Driver** | Dymo LabelWriter-driver geïnstalleerd (download via [dymo.com/support](https://www.dymo.com/support)) |
| **Browser** | Chrome of Edge aanbevolen |

---

## 3. Enkel label afdrukken

### Stap 1: Open de asset-detailpagina

Navigeer naar het asset (via de inventarislijst of QR-scan).

### Stap 2: Klik "Label Afdrukken"

Onder de QR-code op de detailpagina klik je **Label Afdrukken**. Een dialog opent met een labelvoorbeeld.

### Stap 3: Kies de indeling

| Indeling | Inhoud | QR-grootte |
|----------|--------|------------|
| QR + Code | QR-code + asset-code eronder | 18 mm |
| QR + Naam | QR-code + assetnaam eronder | 18 mm |
| Code + QR + Naam | Asset-code boven, QR midden, naam onder | 14 mm |

### Stap 4: Druk af

1. Klik **Label Afdrukken** in de dialog
2. Het browser-afdrukvenster opent
3. Selecteer **Dymo LabelWriter** als printer
4. Stel in:
   - Schaal: **100%** (niet "Aanpassen aan pagina")
   - Paginaformaat: **25 mm x 25 mm**
   - Marges: **Geen**
5. Klik **Afdrukken**

### Stap 5: Controleer het label

Scan de afgedrukte QR-code met je telefoon of barcodescanner om te verifiëren dat hij correct werkt.

---

## 4. QR-code downloaden (SVG)

Wil je de QR-code opslaan of in een ander systeem gebruiken?

1. Open de asset-detailpagina
2. Klik **QR Code Downloaden**
3. Het SVG-bestand wordt opgeslagen als `{AssetCode}-QR.svg` (bijv. `LAP-26-DELL-00001-QR.svg`)

SVG is schaalbaar — de kwaliteit blijft behouden bij elk afdrukformaat.

---

## 5. Bulk labels afdrukken

Print labels voor meerdere assets tegelijk vanuit de inventarislijst.

### Stap 1: Selecteer assets

Vink op de inventarispagina de gewenste assets aan via de checkbox links van elke kaart. Je kunt ook de header-checkbox gebruiken om de hele huidige pagina te selecteren.

### Stap 2: Open de bulk-print-dialog

Een printknop verschijnt in de werkbalk zodra je één of meer assets hebt geselecteerd. De badge toont het aantal. Klik de knop.

### Stap 3: Kies indeling en druk af

Kies de indeling (zelfde opties als bij enkel label). De dialog toont een voorbeeld van het eerste label en een lijst van alle geselecteerde assets.

- Maximum: **20 labels per batch**
- Klik **X Labels Afdrukken** en doorloop het browser-afdrukvenster zoals bij enkel label

---

## 6. Labelplaatsing op het apparaat

| Assettype | Aanbevolen plek |
|-----------|----------------|
| Laptop | Onderkant behuizing, naast het serienummersticker van de fabrikant |
| Desktop | Voor- of bovenpaneel, zichtbaar bij opstelling |
| Monitor | Achterkant, nabij de voet |
| Docking / Randapparatuur | Plat vlak aan de onderkant |

**Vermijd:** warme oppervlakken (bij ventilatieopeningen), sterk gebogen oppervlakken en frequent aangeraakte plekken waar het label snel slijt.

---

## 7. Veelvoorkomende problemen

| Probleem | Oplossing |
|----------|-----------|
| Label te klein of te groot | Controleer of schaal op **100%** staat, niet op "Aanpassen aan pagina" |
| Inhoud afgekapt | Stel marges in op **Geen** |
| QR-code scant niet | Reinig de printerkop met een alcoholdoekje; stel afdrukkwaliteit in op Hoog |
| Printer niet gevonden | Controleer USB-verbinding en voeding; herinstalleer driver |
| Labels jammen | Herlaad de labelrol en controleer de invoerrichting |
| Afdrukvenster opent niet | Schakel de pop-upblokkering uit voor deze site |

---

**Vorige:** [Assets beheren](02-Managing-Assets.md)
**Volgende:** [Gegevens exporteren](04-Exporting-Data.md)

# Djoppie Inventory - Systeem Overzicht

**Versie:** 1.0
**Datum:** Januari 2026
**Contact:** jo.wijnen@diepenbeek.be

## Inhoudsopgave

1. [Projectomschrijving](#projectomschrijving)
2. [Architectuur Overzicht](#architectuur-overzicht)
3. [Technologie Stack](#technologie-stack)
4. [Kernfunctionaliteiten](#kernfunctionaliteiten)
5. [Systeemcomponenten](#systeemcomponenten)
6. [Integraties](#integraties)
7. [Handleidingen Overzicht](#handleidingen-overzicht)

---

## Projectomschrijving

**Djoppie Inventory** is een modern asset- en inventarisbeheersysteem ontwikkeld voor IT-support en inventaris managers binnen de gemeente Diepenbeek. Het systeem biedt een professionele oplossing voor het beheren en tracken van IT-assets met naadloze integratie met Microsoft Intune voor uitgebreid hardware inventaris management.

### Doelgroep

- **IT-Support Medewerkers**: Voor dagelijkse asset lookup en serviceverzoeken
- **Inventaris Managers**: Voor volledig overzicht en beheer van IT-middelen
- **Facility Managers**: Voor locatiebeheer en asset tracking

### Belangrijkste Voordelen

- **Snelle Asset Lookup**: Via QR-code scanning of manuele invoer
- **Intune Integratie**: Automatische synchronisatie met Microsoft Intune voor hardware inventaris
- **Real-time Overzicht**: Actuele status van alle IT-assets
- **Mobiel Vriendelijk**: Responsive design voor gebruik op smartphones en tablets
- **Veilig**: Microsoft Entra ID authenticatie met rolgebaseerde toegang

---

## Architectuur Overzicht

Het systeem volgt een moderne **three-tier architectuur** met gescheiden frontend, backend en database lagen, gehost op Azure Cloud Platform.

```
┌─────────────────────────────────────────────────────────────────┐
│                      GEBRUIKER / BROWSER                         │
│                   (Desktop, Tablet, Mobiel)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    FRONTEND LAAG                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   Azure Static Web Apps (Free/Standard Tier)            │   │
│  │   - React 19 + TypeScript                               │   │
│  │   - Material-UI Components                              │   │
│  │   - MSAL voor Entra ID authenticatie                    │   │
│  │   - QR Code Scanner (html5-qrcode)                      │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API (HTTPS)
                             │ JWT Bearer Token
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     BACKEND LAAG                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   Azure App Service (B1/P1V3)                           │   │
│  │   - ASP.NET Core 8.0 Web API                            │   │
│  │   - Entity Framework Core                               │   │
│  │   - Microsoft.Identity.Web                              │   │
│  │   - Microsoft Graph SDK                                 │   │
│  │   - AutoMapper, Serilog                                 │   │
│  └─────────────────┬────────────────────┬──────────────────┘   │
└────────────────────┼────────────────────┼─────────────────────┘
                     │                    │
         ┌───────────▼──────────┐    ┌───▼──────────────────┐
         │  DATA LAAG           │    │  EXTERNE SERVICES    │
         │                      │    │                      │
         │ Azure SQL Database*  │    │ Microsoft Graph API  │
         │ (Basic/S1)           │    │ - Intune Devices     │
         │                      │    │ - Entra ID Users     │
         │ *Dev: SQLite         │    │                      │
         └──────────────────────┘    └──────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              ONDERSTEUNENDE SERVICES                             │
├─────────────────────────────────────────────────────────────────┤
│  Azure Key Vault          │  Opslag van secrets en certificaten │
│  Application Insights     │  Monitoring en telemetrie            │
│  Log Analytics            │  Centralized logging                 │
│  Azure Entra ID           │  Authenticatie en autorisatie        │
└─────────────────────────────────────────────────────────────────┘
```

### Architectuur Principes

1. **Security First**: Alle communicatie via HTTPS, JWT tokens, managed identities
2. **Schaalbaarheid**: Horizontale scaling via Azure App Service
3. **Kostenefficiëntie**: Gebruik van budget-vriendelijke tiers voor dev omgeving
4. **DevOps Ready**: Volledig geautomatiseerde CI/CD via Azure DevOps
5. **Monitoring**: Application Insights voor performance en error tracking

---

## Technologie Stack

### Frontend Stack

| Technologie | Versie | Doel |
|------------|--------|------|
| **React** | 19.x | Modern UI framework |
| **TypeScript** | 5.9.x | Type-safe JavaScript |
| **Vite** | 7.x | Snelle build tool en dev server |
| **Material-UI (MUI)** | 7.x | Professional UI component library |
| **React Router** | 7.x | Client-side routing |
| **TanStack Query** | 5.x | Server state management |
| **Axios** | 1.x | HTTP client voor API calls |
| **MSAL React** | 5.x | Microsoft Authentication Library |
| **html5-qrcode** | 2.x | QR code scanning functionaliteit |
| **i18next** | 25.x | Internationalisatie (NL/EN) |

### Backend Stack

| Technologie | Versie | Doel |
|------------|--------|------|
| **ASP.NET Core** | 8.0 | Modern web API framework |
| **C#** | 12 | Programmeertaal |
| **Entity Framework Core** | 8.0 | ORM voor database access |
| **Microsoft.Identity.Web** | - | Entra ID authenticatie |
| **Microsoft.Graph** | - | Intune/Graph API integratie |
| **AutoMapper** | - | Object-to-object mapping |
| **Serilog** | - | Structured logging |
| **Swashbuckle** | - | OpenAPI/Swagger documentatie |

### Database

| Omgeving | Database | Doel |
|----------|----------|------|
| **Development** | SQLite | Lokale ontwikkeling, geen kosten |
| **Production** | Azure SQL Database (Basic/S1) | Managed database service |

### Azure Services

| Service | Tier | Doel |
|---------|------|------|
| **Azure Static Web Apps** | Free/Standard | Frontend hosting |
| **Azure App Service** | B1/P1V3 | Backend API hosting |
| **Azure App Service Plan** | B1/P1V3 | Compute resources |
| **Azure Key Vault** | Standard | Secrets management |
| **Application Insights** | Pay-as-you-go | Monitoring en diagnostics |
| **Log Analytics Workspace** | Pay-as-you-go | Centralized logging |
| **Azure SQL Database*** | Basic/S1 | Database (optioneel) |

*Optioneel: dev omgeving gebruikt SQLite

### DevOps & Tooling

| Tool | Doel |
|------|------|
| **Azure DevOps Pipelines** | CI/CD automation |
| **Bicep** | Infrastructure as Code |
| **Git** | Source control |
| **Azure CLI** | Azure resource management |
| **PowerShell** | Automation scripts |

---

## Kernfunctionaliteiten

### 1. Asset Scanning & Lookup

**QR Code Scanning**
- Directe scanning via smartphone/tablet camera
- Instant asset lookup en detail weergave
- Offline capability voor vaak bezochte assets

**Manuele Asset Code Invoer**
- Fallback optie voor assets zonder QR code
- Autocomplete en suggesties
- Validatie en error handling

### 2. Inventaris Dashboard

**Asset Overzicht**
- Volledige lijst van alle assets
- Filtering op status: All / Active / Maintenance / Retired
- Zoekfunctionaliteit op naam, code, locatie, eigenaar
- Sorteren op verschillende kolommen
- Paginering voor grote datasets

**Real-time Status**
- Live updates bij wijzigingen
- Status indicators (Active, In Maintenance, Retired)
- Warranty expiry warnings

### 3. Asset Management (CRUD Operations)

**Asset Aanmaken**
- Formulier met validatie
- Template library voor standaard assets
- Automatische QR code generatie
- Foto upload mogelijkheid

**Asset Bewerken**
- Volledig formulier voor alle eigenschappen
- Geschiedenis tracking
- Eigenaar wijzigingen logging
- Installatie datum updates

**Asset Verwijderen**
- Soft delete (status: Retired)
- Archivering van historische data
- Restore mogelijkheid

### 4. Asset Details Weergave

**Identificatie**
- Asset Code (uniek)
- Asset Name
- Category (Computing, Peripherals, Networking, etc.)
- QR Code visualisatie

**Toewijzing**
- Huidige eigenaar (Entra ID user)
- Locatie (Building, Space/Floor)
- Status (Active/Maintenance/Retired)

**Technische Specificaties**
- Brand en Model
- Serial Number
- Intune Device Info (indien beschikbaar)
- Purchase Date
- Warranty Expiry Date
- Installation Date

**Geschiedenis**
- Eigenaar geschiedenis
- Installatie geschiedenis
- Status wijzigingen
- Onderhoud logs

### 5. Template Library

Voorgedefinieerde templates voor snelle asset creatie:

| Template | Category | Voorbeelden |
|----------|----------|-------------|
| **Dell Latitude Laptop** | Computing | Dell Latitude 5430 |
| **HP LaserJet Printer** | Peripherals | HP LaserJet Pro M404dn |
| **Cisco Network Switch** | Networking | Cisco Catalyst 2960 |
| **Samsung Monitor 27"** | Displays | Samsung S27A600 |
| **Logitech Wireless Mouse** | Peripherals | Logitech MX Master 3 |

### 6. Microsoft Intune Integratie

**Enhanced Hardware Inventory**
- Automatische device discovery via Intune
- Device compliance status
- OS versie en updates
- Installed applications
- Hardware specificaties (CPU, RAM, Disk)
- Last sync timestamp

**Device Types Support**
- Intune Managed Devices
- Microsoft Entra Joined Devices
- Entra Hybrid Joined Devices

**Synchronisatie**
- On-demand sync via API calls
- Cached data voor performance
- Conflict resolution

### 7. Service Request Management (Toekomstig)

Geplande functionaliteit:
- Service ticket creatie gekoppeld aan asset
- Status tracking
- Assignment aan technici
- SLA monitoring

---

## Systeemcomponenten

### Frontend Componenten

```
src/frontend/src/
├── components/
│   ├── layout/          # Layout components (Header, Sidebar, Layout)
│   ├── auth/            # Authentication components (LoginButton, ProtectedRoute)
│   ├── assets/          # Asset-gerelateerde components
│   ├── common/          # Herbruikbare UI components (Buttons, Cards, Modals)
│   └── scanner/         # QR code scanner component
├── pages/
│   ├── Dashboard.tsx    # Hoofdpagina met asset overview
│   ├── AssetDetails.tsx # Detail weergave van asset
│   ├── AssetForm.tsx    # Create/Edit formulier
│   └── Scanner.tsx      # QR scanner pagina
├── services/
│   ├── api.ts           # Axios API client configuratie
│   ├── authService.ts   # MSAL authenticatie service
│   └── assetService.ts  # Asset API calls
├── hooks/
│   ├── useAuth.ts       # Custom hook voor authenticatie
│   ├── useAssets.ts     # Custom hook voor asset data (React Query)
│   └── useQRScanner.ts  # Custom hook voor QR scanning
├── types/
│   ├── asset.types.ts   # TypeScript type definitions
│   └── user.types.ts    # User type definitions
├── utils/
│   ├── constants.ts     # Applicatie constanten
│   └── helpers.ts       # Helper functies
├── i18n/
│   └── locales/         # Vertalingen (NL, EN)
└── config/
    └── msalConfig.ts    # MSAL configuratie
```

### Backend Componenten

```
src/backend/
├── DjoppieInventory.API/
│   ├── Controllers/
│   │   ├── AssetsController.cs      # CRUD endpoints voor assets
│   │   ├── IntuneController.cs      # Intune integratie endpoints
│   │   └── HealthController.cs      # Health check endpoint
│   ├── Program.cs                    # Application startup
│   └── appsettings.json              # Configuratie
├── DjoppieInventory.Core/
│   ├── Entities/
│   │   ├── Asset.cs                  # Asset domain model
│   │   ├── AssetHistory.cs           # Asset geschiedenis
│   │   └── ServiceRequest.cs         # Service request (toekomstig)
│   ├── Interfaces/
│   │   ├── IAssetRepository.cs       # Repository interface
│   │   ├── IIntuneService.cs         # Intune service interface
│   │   └── IUnitOfWork.cs            # Unit of Work pattern
│   └── DTOs/
│       ├── AssetDto.cs               # Data transfer objects
│       └── IntuneDeviceDto.cs        # Intune device DTO
├── DjoppieInventory.Infrastructure/
│   ├── Data/
│   │   ├── ApplicationDbContext.cs   # EF Core DbContext
│   │   └── Migrations/               # Database migrations
│   ├── Repositories/
│   │   ├── AssetRepository.cs        # Asset data access
│   │   └── UnitOfWork.cs             # Unit of Work implementatie
│   └── Services/
│       ├── IntuneService.cs          # Microsoft Graph API integratie
│       └── QRCodeService.cs          # QR code generatie
└── DjoppieInventory.Tests/
    ├── Unit/                          # Unit tests
    └── Integration/                   # Integratie tests
```

### Database Schema

**Assets Table**
- Id (PK, GUID)
- AssetCode (Unique, String)
- AssetName (String)
- Category (String)
- Brand (String)
- Model (String)
- SerialNumber (String)
- OwnerId (String - Entra ID User)
- Building (String)
- SpaceFloor (String)
- Status (Enum: Active, Maintenance, Retired)
- PurchaseDate (DateTime?)
- WarrantyExpiryDate (DateTime?)
- InstallationDate (DateTime?)
- IntuneDeviceId (String?)
- CreatedAt (DateTime)
- UpdatedAt (DateTime)

**AssetHistory Table**
- Id (PK, GUID)
- AssetId (FK)
- ChangeType (Enum: OwnerChange, StatusChange, LocationChange)
- OldValue (String)
- NewValue (String)
- ChangedBy (String)
- ChangedAt (DateTime)

---

## Integraties

### Microsoft Entra ID (Azure AD)

**Authenticatie Flow**
1. Gebruiker navigeert naar web applicatie
2. React app redirect naar Microsoft Entra ID login (Diepenbeek tenant)
3. Na succesvolle authenticatie: JWT access token
4. Token wordt meegestuurd in elke API request (Authorization header)
5. Backend valideert token via Microsoft.Identity.Web
6. Autorisatie op basis van claims en rollen

**Required App Registrations**
- **Frontend SPA**: Single Page Application met redirect URIs
- **Backend API**: Web API met exposed scopes

### Microsoft Graph / Intune API

**API Permissions** (Backend App Registration)
- `DeviceManagementManagedDevices.Read.All` - Lezen van Intune managed devices
- `Device.Read.All` - Lezen van device informatie
- `Directory.Read.All` - Lezen van directory data (users, groups)

**Gebruik**
- GraphServiceClient voor API calls
- Service Principal authenticatie (Client Credentials flow)
- Caching voor performance optimalisatie

**Endpoints**
- `/v1.0/deviceManagement/managedDevices` - Alle managed devices
- `/v1.0/deviceManagement/managedDevices/{id}` - Specifiek device
- `/v1.0/users` - User informatie voor eigenaar lookup

---

## Handleidingen Overzicht

Deze Wiki bevat de volgende deployment handleidingen:

### Handleiding 1: Omgevingen, Repository & Branching Strategie
**Bestand:** `01-Omgevingen-en-Branching.md`

Onderwerpen:
- Lokale ontwikkelomgeving setup
- Develop omgeving configuratie
- Productie omgeving configuratie
- Git repository structuur
- Branching strategie en workflow
- Pull request proces

### Handleiding 2: Azure Infrastructuur Setup
**Bestand:** `02-Azure-Infrastructuur-Setup.md`

Onderwerpen:
- Resource Group aanmaken
- Azure SQL Database provisioning (optioneel)
- App Service Plan en App Service
- Static Web Apps voor frontend
- Key Vault configuratie
- Application Insights en Log Analytics
- Networking en security instellingen
- Stap-voor-stap deployment met Bicep

### Handleiding 3: Microsoft Entra ID Configuratie
**Bestand:** `03-Entra-ID-Setup.md`

Onderwerpen:
- App Registrations aanmaken (Frontend + Backend)
- API permissions configureren
- Redirect URIs instellen
- Client secrets beheren
- Admin consent verlenen
- Service Principal voor Microsoft Graph
- PowerShell automation script

### Handleiding 4: Azure DevOps Deployment
**Bestand:** `04-Azure-DevOps-Deployment.md`

Onderwerpen:
- Azure DevOps project setup
- Service Connections configureren
- Pipeline YAML configuratie
- Variable Groups en secrets management
- Build en deployment stages
- Environment approvals
- Deployment naar DEV en PROD
- Troubleshooting

### Handleiding 5: Database & Entity Framework
**Bestand:** `05-Database-Setup.md`

Onderwerpen:
- Entity Framework Core migrations
- Database initialisatie
- Connection strings beheren
- Seed data voor testing
- Backup en restore procedures
- Performance tuning

### Handleiding 6: Monitoring & Troubleshooting
**Bestand:** `06-Monitoring-en-Troubleshooting.md`

Onderwerpen:
- Application Insights configuratie
- Log Analytics queries
- Performance monitoring
- Error tracking en alerting
- Health checks
- Common issues en oplossingen

---

## Kostenoverzicht

### Development Omgeving (Maandelijks)

| Service | Tier | Geschatte Kosten |
|---------|------|------------------|
| App Service Plan (B1) | Basic | €12 |
| Static Web App | Free | €0 |
| Key Vault | Standard | €0.50 |
| Application Insights | Pay-as-you-go | €2-5 |
| Log Analytics | Pay-as-you-go (5GB free) | €0-3 |
| **Totaal DEV** | | **€15-20/maand** |

### Production Omgeving (Maandelijks)

| Service | Tier | Geschatte Kosten |
|---------|------|------------------|
| App Service Plan (P1V3) | Premium | €80-120 |
| Static Web App | Standard | €9 |
| Azure SQL Database (S1) | Standard | €20 |
| Key Vault | Standard | €0.50 |
| Application Insights | Pay-as-you-go | €10-20 |
| Log Analytics | Pay-as-you-go | €5-15 |
| **Totaal PROD** | | **€125-185/maand** |

*Prijzen zijn schattingen op basis van West Europe regio, januari 2026*

---

## Support & Contact

### Team
- **Ontwikkelaar**: Jo Wijnen
- **Email**: jo.wijnen@diepenbeek.be
- **Organisatie**: Gemeente Diepenbeek

### Resources
- **Repository**: https://github.com/Djoppie/Djoppie-Inventory.git
- **Azure Portal**: https://portal.azure.com
- **Intune Portal**: https://intune.microsoft.com
- **Entra ID**: https://entra.microsoft.com

### Documentatie Links
- ASP.NET Core: https://learn.microsoft.com/aspnet/core
- React: https://react.dev
- Azure Documentation: https://learn.microsoft.com/azure
- Microsoft Graph API: https://learn.microsoft.com/graph

---

## Changelog

| Versie | Datum | Wijzigingen |
|--------|-------|-------------|
| 1.0 | 2026-01-18 | Initiële versie - volledige systeem documentatie |

---

**Volgende Stap:** [Handleiding 1: Omgevingen en Branching Strategie →](01-Omgevingen-en-Branching.md)

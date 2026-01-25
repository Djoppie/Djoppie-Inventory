# Handleiding 2: Azure Infrastructuur Setup

**Versie:** 1.0
**Datum:** Januari 2026
**Onderdeel van:** Djoppie Inventory Deployment Handleidingen

---

## Inhoudsopgave

1. [Overzicht](#overzicht)
2. [Vereisten](#vereisten)
3. [Azure Subscription Setup](#azure-subscription-setup)
4. [Resource Naming Conventies](#resource-naming-conventies)
5. [Deployment met Bicep](#deployment-met-bicep)
6. [Manuele Setup Stappen](#manuele-setup-stappen)
7. [Resource Configuratie](#resource-configuratie)
8. [Netwerk en Beveiliging](#netwerk-en-beveiliging)
9. [Verificatie](#verificatie)
10. [Troubleshooting](#troubleshooting)

---

## Overzicht

Deze handleiding beschrijft hoe je de volledige Azure infrastructuur opzet voor het Djoppie Inventory systeem. We gebruiken **Infrastructure as Code (IaC)** met **Bicep templates** voor geautomatiseerde, reproduceerbare deployments.

### Wat wordt er aangemaakt?

#### DEV Omgeving (~€15-20/maand)

```
Resource Group: rg-djoppie-dev
├── App Service Plan (asp-djoppie-dev) - B1 Linux
├── App Service (app-djoppie-dev-api-xxxxx) - Backend API
├── Static Web App (swa-djoppie-dev-web-xxxxx) - Frontend
├── Key Vault (kv-djoppiedev) - Secrets storage
├── Application Insights (appi-djoppie-dev) - Monitoring
└── Log Analytics Workspace (log-djoppie-dev) - Logging
```

#### PROD Omgeving (~€125-185/maand)

```
Resource Group: rg-djoppie-prod
├── App Service Plan (asp-djoppie-prod) - P1V3 Linux, 2 instances
├── App Service (app-djoppie-prod-api-xxxxx) - Backend API
├── Static Web App (swa-djoppie-prod-web-xxxxx) - Frontend (Standard)
├── Azure SQL Server (sql-djoppie-prod-xxxxx)
├── Azure SQL Database (sqldb-djoppie-inventory) - S1 tier
├── Key Vault (kv-djoppieprod) - Secrets storage
├── Application Insights (appi-djoppie-prod) - Monitoring
└── Log Analytics Workspace (log-djoppie-prod) - Logging
```

### Deployment Methodes

We bieden twee Bicep templates:

1. **Infrastructure-Simple** (Aanbevolen voor learning/dev)
   - Budget-friendly
   - SQLite voor DEV (geen Azure SQL kosten)
   - Eenvoudiger configuratie
   - Gebruikt in deze handleiding

2. **Infrastructure** (Enterprise versie)
   - Azure SQL voor alle omgevingen
   - Advanced security (RBAC, Private Endpoints)
   - Zone redundancy voor PROD
   - Gedetailleerde monitoring

---

## Vereisten

### 1. Azure Subscription

**Minimale Vereisten:**
- Actieve Azure subscription
- Subscription Owner of Contributor rol
- Budget: ~€200/maand voor DEV + PROD

**Verificatie:**
```bash
az account show
```

### 2. Software Installaties

#### Azure CLI (Vereist)

**Installatie:**
```bash
# Windows (via MSI installer)
# Download: https://aka.ms/InstallAzureCLIDirect

# macOS (via Homebrew)
brew install azure-cli

# Linux (Ubuntu/Debian)
curl -sL https://aka.ms/InstallAzureCLIDirect | sudo bash
```

**Verificatie:**
```bash
az --version
# Expected: azure-cli 2.50.0 of hoger
```

**Login:**
```bash
az login

# Selecteer juiste subscription
az account list --output table
az account set --subscription "YOUR_SUBSCRIPTION_NAME_OR_ID"
```

#### PowerShell 7+ (Vereist voor Entra ID setup)

```bash
# Windows: Download van https://github.com/PowerShell/PowerShell
# macOS: brew install --cask powershell
# Linux: zie https://learn.microsoft.com/powershell/scripting/install/installing-powershell-on-linux

# Verificatie
pwsh --version
```

#### Bicep CLI (Optioneel - Azure CLI bevat Bicep)

```bash
# Bicep zit al in Azure CLI
az bicep version

# Update naar laatste versie
az bicep upgrade
```

### 3. Permissions

Je hebt de volgende permissies nodig:

| Scope | Rol | Reden |
|-------|-----|-------|
| **Subscription** | Contributor | Resource aanmaken en beheren |
| **Entra ID** | Application Administrator | App Registrations aanmaken |
| **Entra ID** | Global Administrator | API permissions consent geven |

**Check permissies:**
```bash
# Check subscription rol
az role assignment list --assignee YOUR_EMAIL@diepenbeek.be --output table

# Check Entra ID rol (via portal)
# https://entra.microsoft.com -> Users -> [Your user] -> Assigned roles
```

---

## Azure Subscription Setup

### 1. Subscription Verificatie

```bash
# Lijst alle subscriptions
az account list --output table

# Output voorbeeld:
# Name                      SubscriptionId                        TenantId
# ------------------------  ------------------------------------  ------------------------------------
# Visual Studio Enterprise  12345678-1234-1234-1234-123456789012  7db28d6f-d542-40c1-b529-5e5ed2aad545

# Set actieve subscription
az account set --subscription "Visual Studio Enterprise"

# Verifieer
az account show --query "{Name:name, SubscriptionId:id, TenantId:tenantId}" --output table
```

### 2. Resource Providers Registreren

Zorg dat de volgende resource providers geregistreerd zijn:

```bash
# Controleer registratie status
az provider list --query "[?namespace=='Microsoft.Web'].{Namespace:namespace, State:registrationState}" -o table
az provider list --query "[?namespace=='Microsoft.Sql'].{Namespace:namespace, State:registrationState}" -o table
az provider list --query "[?namespace=='Microsoft.KeyVault'].{Namespace:namespace, State:registrationState}" -o table
az provider list --query "[?namespace=='Microsoft.OperationalInsights'].{Namespace:namespace, State:registrationState}" -o table
az provider list --query "[?namespace=='Microsoft.Insights'].{Namespace:namespace, State:registrationState}" -o table

# Registreer indien nodig (kan 5-10 minuten duren)
az provider register --namespace Microsoft.Web
az provider register --namespace Microsoft.Sql
az provider register --namespace Microsoft.KeyVault
az provider register --namespace Microsoft.OperationalInsights
az provider register --namespace Microsoft.Insights

# Wacht tot registratie compleet
az provider show --namespace Microsoft.Web --query "registrationState" -o tsv
```

### 3. Kies Azure Regio

Aanbevolen regio's voor Diepenbeek:

| Regio | Code | Voordeel | Nadeel |
|-------|------|----------|--------|
| **West Europe** | `westeurope` | GDPR compliant, dichtbij | Iets duurder |
| **North Europe** | `northeurope` | GDPR compliant, goedkoper | Verder weg |
| **West Europe 2** | `westeurope2` | Nieuwste datacenters | Niet alle services |

**Aanbeveling:** Gebruik `westeurope` voor productie.

```bash
# Check beschikbare regio's
az account list-locations --output table

# Verificeer service availability in regio
az provider show --namespace Microsoft.Web --query "resourceTypes[?resourceType=='sites'].locations" -o table
```

---

## Resource Naming Conventies

We volgen Azure best practices voor resource naming:

### Naming Pattern

```
<resource-type>-<project>-<environment>-<instance>-<suffix>
```

### Resource Type Prefixes

| Resource | Prefix | Voorbeeld |
|----------|--------|-----------|
| Resource Group | `rg-` | `rg-djoppie-dev` |
| App Service Plan | `asp-` | `asp-djoppie-dev` |
| App Service | `app-` | `app-djoppie-dev-api-abc123` |
| Static Web App | `swa-` | `swa-djoppie-dev-web-abc123` |
| SQL Server | `sql-` | `sql-djoppie-prod-abc123` |
| SQL Database | `sqldb-` | `sqldb-djoppie-inventory` |
| Key Vault | `kv-` | `kv-djoppiedev` |
| App Insights | `appi-` | `appi-djoppie-dev` |
| Log Analytics | `log-` | `log-djoppie-dev` |

### Naming Rules

**Key Vault Specifiek:**
- Max 24 karakters
- Alleen alphanumeriek (geen hyphens)
- Globally unique
- Format: `kv-<project><env>` (bijv. `kv-djoppiedev`)

**Global Unique Resources:**
- App Service: moet globally unique zijn
- Static Web App: moet globally unique zijn
- SQL Server: moet globally unique zijn
- Key Vault: moet globally unique zijn

**Oplossing:** Bicep voegt automatisch een unique suffix toe:
```bicep
var uniqueSuffix = uniqueString(subscription().subscriptionId, environment)
var backendAppName = 'app-djoppie-${environment}-api-${uniqueSuffix}'
```

---

## Deployment met Bicep

### Overzicht Bicep Templates

We gebruiken de **infrastructure-simple** templates:

```
infrastructure-simple/
├── main.bicep                    # Main template
├── parameters/
│   ├── dev.bicepparam            # DEV parameters
│   └── prod.bicepparam           # PROD parameters
├── setup-entra-id.ps1            # PowerShell script voor Entra ID
├── ARCHITECTURE.md               # Architectuur documentatie
├── COST-BREAKDOWN.md             # Kosten breakdown
└── README.md                     # Quick start guide
```

### STAP 1: Microsoft Entra ID Setup

**Eerst** moeten we Entra ID App Registrations aanmaken (zie **Handleiding 3** voor details).

Quick setup:

```powershell
# Open PowerShell 7
pwsh

# Navigeer naar infrastructure directory
cd infrastructure-simple

# Run setup script voor DEV
.\setup-entra-id.ps1 -Environment dev

# Volg instructies in script
# Script outputs:
# - Backend Client ID
# - Backend Client Secret (BEWAAR DIT VEILIG!)
# - Frontend Client ID
# - Tenant ID

# Bewaar output in veilige locatie (bijv. password manager)
```

**Output voorbeeld:**
```
TENANT ID: 7db28d6f-d542-40c1-b529-5e5ed2aad545

BACKEND API APP:
  Client ID: fc0be7bf-0e71-4c39-8a02-614dfa16322c
  Client Secret: abc123~xyz789~secret

FRONTEND WEB APP:
  Client ID: bec7a94f-d35d-4f0e-af77-60f6a9342f2d
```

### STAP 2: Update Bicep Parameters

Edit `infrastructure-simple/parameters/dev.bicepparam`:

```bicep
using '../main.bicep'

// Environment settings
param environment = 'dev'
param location = 'westeurope'
param projectName = 'djoppie'

// Microsoft Entra ID settings (van setup script output)
param entraIdTenantId = '7db28d6f-d542-40c1-b529-5e5ed2aad545'
param entraBackendClientId = 'fc0be7bf-0e71-4c39-8a02-614dfa16322c'
param entraBackendClientSecret = 'placeholder-will-be-overridden-by-pipeline'
param entraFrontendClientId = 'bec7a94f-d35d-4f0e-af77-60f6a9342f2d'

// Admin settings
param adminEmail = 'jo.wijnen@diepenbeek.be'

// Resource tags
param tags = {
  Environment: 'Development'
  Project: 'Djoppie-Inventory'
  ManagedBy: 'Bicep'
  CostCenter: 'Learning'
  Owner: 'Jo Wijnen'
}
```

**BELANGRIJK:**
- De `entraBackendClientSecret` parameter zal tijdens deployment overschreven worden
- COMMIT NOOIT echte secrets naar Git!

### STAP 3: Resource Group Aanmaken

```bash
# DEV Resource Group
az group create \
  --name rg-djoppie-dev \
  --location westeurope \
  --tags Environment=Development Project=Djoppie-Inventory ManagedBy=Bicep

# Output:
# {
#   "id": "/subscriptions/.../resourceGroups/rg-djoppie-dev",
#   "location": "westeurope",
#   "name": "rg-djoppie-dev",
#   "properties": {
#     "provisioningState": "Succeeded"
#   }
# }

# Verificatie
az group show --name rg-djoppie-dev --output table
```

### STAP 4: Bicep Deployment (DEV)

#### What-If Analysis (Dry Run)

Voordat we deployen, controleren we wat er gemaakt wordt:

```bash
cd infrastructure-simple

az deployment group what-if \
  --name djoppie-dev-whatif \
  --resource-group rg-djoppie-dev \
  --template-file main.bicep \
  --parameters parameters/dev.bicepparam \
  --parameters entraBackendClientSecret='YOUR_SECRET_FROM_SETUP_SCRIPT'
```

**Output toont:**
- Resources die gemaakt worden (groen +)
- Resources die gewijzigd worden (geel ~)
- Resources die verwijderd worden (rood -)

#### Volledige Deployment

```bash
# DEV Deployment
az deployment group create \
  --name djoppie-dev-$(date +%Y%m%d-%H%M%S) \
  --resource-group rg-djoppie-dev \
  --template-file main.bicep \
  --parameters parameters/dev.bicepparam \
  --parameters entraBackendClientSecret='YOUR_SECRET_FROM_SETUP_SCRIPT' \
  --output json > deployment-output-dev.json

# Dit kan 5-10 minuten duren
# Voortgang volgen in Azure Portal:
# Resource Groups > rg-djoppie-dev > Deployments
```

#### Deployment Output Bekijken

```bash
# Bekijk deployment outputs
cat deployment-output-dev.json | jq '.properties.outputs'

# Specifieke output values
az deployment group show \
  --name djoppie-dev-TIMESTAMP \
  --resource-group rg-djoppie-dev \
  --query properties.outputs.backendAppUrl.value -o tsv

az deployment group show \
  --name djoppie-dev-TIMESTAMP \
  --resource-group rg-djoppie-dev \
  --query properties.outputs.frontendStaticWebAppUrl.value -o tsv
```

**Output voorbeeld:**
```json
{
  "backendAppUrl": {
    "type": "String",
    "value": "https://app-djoppie-dev-api-abc123.azurewebsites.net"
  },
  "frontendStaticWebAppUrl": {
    "type": "String",
    "value": "https://swa-djoppie-dev-web-xyz789.azurestaticapps.net"
  },
  "keyVaultName": {
    "type": "String",
    "value": "kv-djoppiedev"
  }
}
```

### STAP 5: Bicep Deployment (PROD)

**Herhaal stappen voor PROD omgeving:**

```bash
# 1. Entra ID setup
pwsh
.\setup-entra-id.ps1 -Environment prod

# 2. Update parameters/prod.bicepparam met nieuwe client IDs

# 3. Create Resource Group
az group create \
  --name rg-djoppie-prod \
  --location westeurope \
  --tags Environment=Production Project=Djoppie-Inventory ManagedBy=Bicep

# 4. What-If
az deployment group what-if \
  --resource-group rg-djoppie-prod \
  --template-file main.bicep \
  --parameters parameters/prod.bicepparam \
  --parameters entraBackendClientSecret='PROD_SECRET'

# 5. Deploy
az deployment group create \
  --name djoppie-prod-$(date +%Y%m%d-%H%M%S) \
  --resource-group rg-djoppie-prod \
  --template-file main.bicep \
  --parameters parameters/prod.bicepparam \
  --parameters entraBackendClientSecret='PROD_SECRET' \
  --output json > deployment-output-prod.json
```

**PROD deployment kan 10-15 minuten duren** door SQL Database provisioning.

---

## Manuele Setup Stappen

Na Bicep deployment zijn enkele manuele configuraties vereist:

### 1. Key Vault Access Policies (Indien RBAC niet gebruikt)

De Bicep template configureert dit automatisch, maar verificatie:

```bash
# Check Key Vault access
az keyvault show --name kv-djoppiedev --query properties.accessPolicies

# Als leeg: voeg jezelf toe voor management
az keyvault set-policy \
  --name kv-djoppiedev \
  --upn jo.wijnen@diepenbeek.be \
  --secret-permissions get list set delete
```

### 2. Static Web App Configuration

Static Web App environment variables moeten worden ingesteld:

```bash
# Get Static Web App name
FRONTEND_APP_NAME=$(az deployment group show \
  --name djoppie-dev-TIMESTAMP \
  --resource-group rg-djoppie-dev \
  --query properties.outputs.frontendStaticWebAppName.value -o tsv)

# Get Backend URL
BACKEND_URL=$(az deployment group show \
  --name djoppie-dev-TIMESTAMP \
  --resource-group rg-djoppie-dev \
  --query properties.outputs.backendAppUrl.value -o tsv)

# Set environment variables
az staticwebapp appsettings set \
  --name $FRONTEND_APP_NAME \
  --resource-group rg-djoppie-dev \
  --setting-names \
    VITE_API_URL="${BACKEND_URL}/api" \
    VITE_ENTRA_CLIENT_ID="bec7a94f-d35d-4f0e-af77-60f6a9342f2d" \
    VITE_ENTRA_TENANT_ID="7db28d6f-d542-40c1-b529-5e5ed2aad545" \
    VITE_ENVIRONMENT="dev"
```

**Of via Azure Portal:**
1. Navigate naar Static Web App
2. Settings > Configuration
3. Add application settings:
   - `VITE_API_URL` = `https://app-djoppie-dev-api-xxx.azurewebsites.net/api`
   - `VITE_ENTRA_CLIENT_ID` = `[Frontend Client ID]`
   - `VITE_ENTRA_TENANT_ID` = `7db28d6f-d542-40c1-b529-5e5ed2aad545`
   - `VITE_ENVIRONMENT` = `dev`

### 3. App Service CORS Configuratie

Configureer CORS voor backend API:

```bash
BACKEND_APP_NAME=$(az deployment group show \
  --name djoppie-dev-TIMESTAMP \
  --resource-group rg-djoppie-dev \
  --query properties.outputs.backendAppServiceName.value -o tsv)

FRONTEND_URL=$(az deployment group show \
  --name djoppie-dev-TIMESTAMP \
  --resource-group rg-djoppie-dev \
  --query properties.outputs.frontendStaticWebAppUrl.value -o tsv)

# Configure CORS
az webapp cors add \
  --name $BACKEND_APP_NAME \
  --resource-group rg-djoppie-dev \
  --allowed-origins $FRONTEND_URL "http://localhost:5173"

# Verify
az webapp cors show \
  --name $BACKEND_APP_NAME \
  --resource-group rg-djoppie-dev
```

### 4. App Service Authentication (Optioneel)

Voor extra beveiliging, enable App Service Authentication:

```bash
# Enable Entra ID authentication op App Service
az webapp auth update \
  --name $BACKEND_APP_NAME \
  --resource-group rg-djoppie-dev \
  --enabled true \
  --action LoginWithAzureActiveDirectory \
  --aad-allowed-token-audiences "api://fc0be7bf-0e71-4c39-8a02-614dfa16322c" \
  --aad-client-id "fc0be7bf-0e71-4c39-8a02-614dfa16322c" \
  --aad-client-secret "YOUR_SECRET" \
  --aad-tenant-id "7db28d6f-d542-40c1-b529-5e5ed2aad545"
```

**Let op:** Dit wordt meestal in de applicatie code zelf afgehandeld via Microsoft.Identity.Web.

---

## Resource Configuratie

### App Service (Backend) Configuratie

#### Application Settings

Ingesteld via Bicep, maar verificatie/aanpassingen:

```bash
# Bekijk alle app settings
az webapp config appsettings list \
  --name $BACKEND_APP_NAME \
  --resource-group rg-djoppie-dev \
  --output table

# Update specifieke setting
az webapp config appsettings set \
  --name $BACKEND_APP_NAME \
  --resource-group rg-djoppie-dev \
  --settings ASPNETCORE_ENVIRONMENT=Development
```

**Key Settings:**
```
ASPNETCORE_ENVIRONMENT = Development
APPLICATIONINSIGHTS_CONNECTION_STRING = [Auto-filled]
AzureAd__Instance = https://login.microsoftonline.com/
AzureAd__TenantId = @Microsoft.KeyVault(VaultName=kv-djoppiedev;SecretName=EntraTenantId)
AzureAd__ClientId = @Microsoft.KeyVault(VaultName=kv-djoppiedev;SecretName=EntraBackendClientId)
AzureAd__ClientSecret = @Microsoft.KeyVault(VaultName=kv-djoppiedev;SecretName=EntraBackendClientSecret)
```

#### Deployment Slots (PROD only)

Voor zero-downtime deployments:

```bash
# Create staging slot
az webapp deployment slot create \
  --name app-djoppie-prod-api-xxx \
  --resource-group rg-djoppie-prod \
  --slot staging

# Configure staging slot
az webapp config appsettings set \
  --name app-djoppie-prod-api-xxx \
  --resource-group rg-djoppie-prod \
  --slot staging \
  --settings ASPNETCORE_ENVIRONMENT=Staging
```

#### Always On (PROD only)

```bash
# Enable Always On voor PROD (prevents cold starts)
az webapp config set \
  --name app-djoppie-prod-api-xxx \
  --resource-group rg-djoppie-prod \
  --always-on true
```

### Static Web App (Frontend) Configuratie

#### Custom Domain (Optioneel)

```bash
# Add custom domain
az staticwebapp hostname set \
  --name swa-djoppie-prod-web-xxx \
  --resource-group rg-djoppie-prod \
  --hostname inventory.diepenbeek.be

# Verify domain met DNS TXT record
# Azure geeft instructies in portal
```

#### Branch Environments

Static Web Apps ondersteunt preview environments per branch:

```bash
# Configureer staging environment policy
az staticwebapp update \
  --name swa-djoppie-dev-web-xxx \
  --resource-group rg-djoppie-dev \
  --branch develop \
  --repository-url https://github.com/Djoppie/Djoppie-Inventory
```

### Key Vault Configuratie

#### Secrets Beheren

```bash
# List alle secrets
az keyvault secret list --vault-name kv-djoppiedev --output table

# Set nieuwe secret
az keyvault secret set \
  --vault-name kv-djoppiedev \
  --name "DatabasePassword" \
  --value "SecurePassword123!"

# Get secret value
az keyvault secret show \
  --vault-name kv-djoppiedev \
  --name "EntraBackendClientSecret" \
  --query value -o tsv

# Delete secret
az keyvault secret delete \
  --vault-name kv-djoppiedev \
  --name "OldSecret"
```

#### Access Policies

```bash
# Grant App Service managed identity toegang
BACKEND_PRINCIPAL_ID=$(az webapp identity show \
  --name $BACKEND_APP_NAME \
  --resource-group rg-djoppie-dev \
  --query principalId -o tsv)

az keyvault set-policy \
  --name kv-djoppiedev \
  --object-id $BACKEND_PRINCIPAL_ID \
  --secret-permissions get list
```

### Application Insights Configuratie

#### Continuous Export (Optioneel)

Voor long-term data retention:

```bash
# Create storage account for export
az storage account create \
  --name djoppielogsdev \
  --resource-group rg-djoppie-dev \
  --location westeurope \
  --sku Standard_LRS

# Configure continuous export (via portal)
# Application Insights > Configure > Continuous Export
```

#### Alerts Configureren

```bash
# Create alert voor high error rate
az monitor metrics alert create \
  --name "High-Error-Rate-DEV" \
  --resource-group rg-djoppie-dev \
  --scopes "/subscriptions/.../resourceGroups/rg-djoppie-dev/providers/Microsoft.Insights/components/appi-djoppie-dev" \
  --condition "avg exceptions/requests > 0.05" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action jo.wijnen@diepenbeek.be
```

---

## Netwerk en Beveiliging

### 1. Network Security

#### App Service Network Restrictions

Beperk toegang tot backend API (PROD):

```bash
# Allow only from Static Web App
az webapp config access-restriction add \
  --name app-djoppie-prod-api-xxx \
  --resource-group rg-djoppie-prod \
  --rule-name "Allow-StaticWebApp" \
  --action Allow \
  --priority 100 \
  --service-tag AzureCloud

# Deny all other traffic
az webapp config access-restriction add \
  --name app-djoppie-prod-api-xxx \
  --resource-group rg-djoppie-prod \
  --rule-name "Deny-All" \
  --action Deny \
  --priority 1000 \
  --ip-address "0.0.0.0/0"
```

#### SQL Database Firewall (PROD)

```bash
# Allow App Service toegang
az sql server firewall-rule create \
  --resource-group rg-djoppie-prod \
  --server sql-djoppie-prod-xxx \
  --name "AllowAppService" \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Allow Azure services
az sql server firewall-rule create \
  --resource-group rg-djoppie-prod \
  --server sql-djoppie-prod-xxx \
  --name "AllowAzureServices" \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Allow je eigen IP (voor management)
MY_IP=$(curl -s https://api.ipify.org)
az sql server firewall-rule create \
  --resource-group rg-djoppie-prod \
  --server sql-djoppie-prod-xxx \
  --name "AllowMyIP" \
  --start-ip-address $MY_IP \
  --end-ip-address $MY_IP
```

### 2. Managed Identities

Alle App Services hebben System-Assigned Managed Identity:

```bash
# Verificatie
az webapp identity show \
  --name $BACKEND_APP_NAME \
  --resource-group rg-djoppie-dev

# Gebruik managed identity voor Key Vault toegang (al geconfigureerd in Bicep)
```

### 3. HTTPS Enforcement

```bash
# Enforce HTTPS (al enabled in Bicep)
az webapp update \
  --name $BACKEND_APP_NAME \
  --resource-group rg-djoppie-dev \
  --https-only true

# Minimum TLS version
az webapp config set \
  --name $BACKEND_APP_NAME \
  --resource-group rg-djoppie-dev \
  --min-tls-version 1.2
```

### 4. Security Headers

Configureer in `web.config` of ASP.NET Core middleware:

```xml
<!-- web.config in wwwroot -->
<configuration>
  <system.webServer>
    <httpProtocol>
      <customHeaders>
        <add name="X-Frame-Options" value="SAMEORIGIN" />
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="Referrer-Policy" value="strict-origin-when-cross-origin" />
        <add name="Content-Security-Policy" value="default-src 'self'; script-src 'self' 'unsafe-inline';" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
```

---

## Verificatie

### 1. Resource Group Verificatie

```bash
# List alle resources in DEV
az resource list \
  --resource-group rg-djoppie-dev \
  --output table

# Expected output:
# Name                          ResourceGroup    Location    Type
# ----------------------------  ---------------  ----------  ------------------------------------
# asp-djoppie-dev              rg-djoppie-dev   westeurope  Microsoft.Web/serverfarms
# app-djoppie-dev-api-xxx      rg-djoppie-dev   westeurope  Microsoft.Web/sites
# swa-djoppie-dev-web-xxx      rg-djoppie-dev   westeurope  Microsoft.Web/staticSites
# kv-djoppiedev                rg-djoppie-dev   westeurope  Microsoft.KeyVault/vaults
# appi-djoppie-dev             rg-djoppie-dev   westeurope  Microsoft.Insights/components
# log-djoppie-dev              rg-djoppie-dev   westeurope  Microsoft.OperationalInsights/workspaces
```

### 2. App Service Health Check

```bash
# Get backend URL
BACKEND_URL=$(az webapp show \
  --name $BACKEND_APP_NAME \
  --resource-group rg-djoppie-dev \
  --query defaultHostName -o tsv)

# Test health endpoint
curl https://$BACKEND_URL/health

# Expected: {"status":"Healthy","timestamp":"2026-01-18T..."}
```

### 3. Static Web App Verificatie

```bash
# Get frontend URL
FRONTEND_URL=$(az staticwebapp show \
  --name swa-djoppie-dev-web-xxx \
  --resource-group rg-djoppie-dev \
  --query defaultHostname -o tsv)

# Test in browser
echo "Open: https://$FRONTEND_URL"

# Check HTTP status
curl -I https://$FRONTEND_URL
# Expected: HTTP/2 200
```

### 4. Key Vault Verificatie

```bash
# Test secret retrieval
az keyvault secret show \
  --vault-name kv-djoppiedev \
  --name EntraTenantId \
  --query value -o tsv

# Should return tenant ID
```

### 5. Application Insights Verificatie

```bash
# Check telemetry ingestion
az monitor app-insights component show \
  --app appi-djoppie-dev \
  --resource-group rg-djoppie-dev \
  --query "connectionString"

# View recent telemetry in portal:
# Application Insights > Logs > Run query:
# requests | top 10 by timestamp desc
```

### 6. Complete Health Check Script

```bash
#!/bin/bash
# health-check.sh

RESOURCE_GROUP="rg-djoppie-dev"

echo "=== Djoppie Inventory Infrastructure Health Check ==="
echo ""

# 1. Resource Group
echo "1. Resource Group Status:"
az group show --name $RESOURCE_GROUP --query "properties.provisioningState" -o tsv

# 2. App Service
echo "2. Backend API Status:"
BACKEND_APP=$(az webapp list -g $RESOURCE_GROUP --query "[?kind=='app,linux'].name | [0]" -o tsv)
az webapp show --name $BACKEND_APP -g $RESOURCE_GROUP --query "state" -o tsv

# 3. Static Web App
echo "3. Frontend Status:"
FRONTEND_APP=$(az staticwebapp list -g $RESOURCE_GROUP --query "[0].name" -o tsv)
az staticwebapp show --name $FRONTEND_APP -g $RESOURCE_GROUP --query "defaultHostname" -o tsv

# 4. Key Vault
echo "4. Key Vault Status:"
KV_NAME=$(az keyvault list -g $RESOURCE_GROUP --query "[0].name" -o tsv)
az keyvault show --name $KV_NAME --query "properties.provisioningState" -o tsv

# 5. Application Insights
echo "5. Application Insights Status:"
APPI_NAME=$(az monitor app-insights component list -g $RESOURCE_GROUP --query "[0].name" -o tsv)
az monitor app-insights component show --app $APPI_NAME -g $RESOURCE_GROUP --query "provisioningState" -o tsv

echo ""
echo "=== Health Check Complete ==="
```

---

## Troubleshooting

### Deployment Failures

#### Error: Resource provider not registered

```
Code: MissingSubscriptionRegistration
Message: The subscription is not registered to use namespace 'Microsoft.Web'
```

**Oplossing:**
```bash
az provider register --namespace Microsoft.Web
az provider show --namespace Microsoft.Web --query "registrationState"
```

#### Error: Name already exists

```
Code: WebsiteAlreadyExists
Message: Website with name 'app-djoppie-dev-api-xxx' already exists
```

**Oplossing:**
```bash
# Delete bestaande resource
az webapp delete --name app-djoppie-dev-api-xxx --resource-group rg-djoppie-dev

# Of gebruik andere naam in Bicep (wijzig uniqueSuffix)
```

#### Error: Bicep validation failed

```
InvalidTemplate: Deployment template validation failed
```

**Oplossing:**
```bash
# Validate Bicep template
az bicep build --file main.bicep

# Check for syntax errors
# Fix en opnieuw deployen
```

### App Service Issues

#### Error: App Service not starting

**Diagnose:**
```bash
# Check logs
az webapp log tail \
  --name $BACKEND_APP_NAME \
  --resource-group rg-djoppie-dev

# Check app settings
az webapp config appsettings list \
  --name $BACKEND_APP_NAME \
  --resource-group rg-djoppie-dev
```

**Oplossing:**
- Controleer ASPNETCORE_ENVIRONMENT setting
- Verificeer connection strings
- Check Application Insights logs

#### Error: 403 Forbidden

**Probleem:** Key Vault access denied

**Oplossing:**
```bash
# Grant managed identity toegang
PRINCIPAL_ID=$(az webapp identity show \
  --name $BACKEND_APP_NAME \
  --resource-group rg-djoppie-dev \
  --query principalId -o tsv)

az keyvault set-policy \
  --name kv-djoppiedev \
  --object-id $PRINCIPAL_ID \
  --secret-permissions get list
```

### Static Web App Issues

#### Error: 404 Not Found na deployment

**Probleem:** Build configuratie incorrect

**Oplossing:**
```bash
# Check build configuration in staticwebapp.config.json
# Of update in portal: Configuration > Application settings
```

#### Error: API calls failing (CORS)

**Oplossing:**
```bash
# Update CORS in backend
az webapp cors add \
  --name $BACKEND_APP_NAME \
  --resource-group rg-djoppie-dev \
  --allowed-origins "https://swa-djoppie-dev-web-xxx.azurestaticapps.net"
```

### Key Vault Issues

#### Error: Secret not found

```bash
# List alle secrets
az keyvault secret list --vault-name kv-djoppiedev

# Restore soft-deleted secret
az keyvault secret recover \
  --vault-name kv-djoppiedev \
  --name SecretName
```

### Cost Management

#### Onverwacht hoge kosten

**Diagnose:**
```bash
# Check current month costs
az consumption usage list \
  --start-date 2026-01-01 \
  --end-date 2026-01-31 \
  --query "[].{Service:instanceName, Cost:pretaxCost}" \
  --output table
```

**Oplossing:**
- Schaal App Service Plan down naar B1 voor DEV
- Gebruik Free tier voor Static Web App in DEV
- Stop resources tijdens niet-werk uren (dev only)

```bash
# Stop App Service (DEV)
az webapp stop --name $BACKEND_APP_NAME --resource-group rg-djoppie-dev

# Start weer
az webapp start --name $BACKEND_APP_NAME --resource-group rg-djoppie-dev
```

---

## Cleanup (Indien Nodig)

### Delete DEV Omgeving

```bash
# WARNING: Dit verwijdert ALLE resources!
az group delete --name rg-djoppie-dev --yes --no-wait

# Verificatie
az group exists --name rg-djoppie-dev
# Should return: false
```

### Delete Specifieke Resources

```bash
# Delete alleen App Service
az webapp delete --name $BACKEND_APP_NAME --resource-group rg-djoppie-dev

# Delete alleen Static Web App
az staticwebapp delete --name swa-djoppie-dev-web-xxx --resource-group rg-djoppie-dev --yes
```

### Purge Key Vault (Na Delete)

Key Vaults hebben soft-delete protection:

```bash
# List soft-deleted vaults
az keyvault list-deleted

# Purge (permanent delete)
az keyvault purge --name kv-djoppiedev --location westeurope
```

---

## Volgende Stappen

Infrastructuur is nu opgezet! Ga verder naar:

**[Handleiding 3: Microsoft Entra ID Configuratie →](03-Entra-ID-Setup.md)**

Daar leer je:
- Gedetailleerde Entra ID app registration setup
- API permissions configureren
- Admin consent verlenen
- Service principals beheren

---

## Cheat Sheet

```bash
# === QUICK DEPLOYMENT ===
# 1. Setup Entra ID
pwsh ./infrastructure-simple/setup-entra-id.ps1 -Environment dev

# 2. Create Resource Group
az group create --name rg-djoppie-dev --location westeurope

# 3. Deploy Bicep
az deployment group create \
  --name djoppie-dev-$(date +%Y%m%d-%H%M%S) \
  --resource-group rg-djoppie-dev \
  --template-file infrastructure-simple/main.bicep \
  --parameters infrastructure-simple/parameters/dev.bicepparam \
  --parameters entraBackendClientSecret='YOUR_SECRET'

# 4. Verify
az resource list --resource-group rg-djoppie-dev --output table

# 5. Test
BACKEND_URL=$(az webapp show --name app-djoppie-dev-api-xxx -g rg-djoppie-dev --query defaultHostName -o tsv)
curl https://$BACKEND_URL/health

# === COMMON OPERATIONS ===
# View all resources
az resource list -g rg-djoppie-dev --output table

# Restart App Service
az webapp restart --name $BACKEND_APP_NAME -g rg-djoppie-dev

# View logs
az webapp log tail --name $BACKEND_APP_NAME -g rg-djoppie-dev

# Get Key Vault secret
az keyvault secret show --vault-name kv-djoppiedev --name SecretName --query value -o tsv
```

---

**Vragen of problemen?** Contact: jo.wijnen@diepenbeek.be

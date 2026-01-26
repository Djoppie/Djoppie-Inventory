# GitHub → Azure DevOps → Azure

**minimale kosten** en **één Azure‑omgeving** (vereenvoudigd). Het is opgezet voor kleine teams die met Azure DevOps willen oefenen, maar kosten (nagenoeg) nihil willen houden

## 🎯 Doelen & Scope

* **Bronbeheer:** GitHub met branches `main`, `develop`, `feature/*`
* **CI/CD:** Azure DevOps Pipelines (YAML) – vanuit GitHub
* **Cloudomgeving (één omgeving):**
  * **Frontend:** Azure Static Web Apps (Free tier)
  * **Backend:** .NET 8 Web API op Azure App Service (F1 Free Plan)
  * **Database:** Azure SQL **Serverless** (met auto‑pause)
  * **Authenticatie:** Microsoft Entra ID met MSAL (SPA + API)
  * **Secrets:** Azure Key Vault (Standard tier)
  * **Monitoring:** Application Insights (Pay‑as‑you‑go / gratis niveau)
* **IaC:** Bicep (`infrastructure-minimal.bicep`) voor **DEV** (één omgeving), explicit ontworpen voor **lage kosten**.

> ✅ Antwoord op je vragen:
>
> * **Single environment?** Ja. Je kunt naar **1 Azure‑omgeving** deployen (bijv. `djoppie-dev`), en deze **aanpassen/upgraden** wanneer nodig. Dit minimaliseert kosten en complexiteit.
> * **Branches?** Ja: `main`, `develop`, en `feature/*` voor feature‑ontwikkeling. `develop` kan naar de enige Azure‑omgeving deployen; `main` kan je reserveren voor “release builds”.

***

## 🧰 Prerequisites

1. **Accounts & Toegang**
    * GitHub account met toegang tot repo: `https://github.com/Djoppie/Djoppie-Inventory` (gebruik `develop` als werkbranch)
    * Azure subscription (Owner/Contributor)
    * Azure DevOps organisatie + project

2. **Tools Lokaal**
    * Node.js LTS (voor React)
    * .NET 8 SDK
    * Azure CLI (`az`) + Bicep (`az bicep upgrade`)
    * Git
    * (Optioneel) VS Code met Azure‑extensies

***

## 🗂️ Aanbevolen repo‑structuur

    Djoppie-Inventory/
    ├─ src/
    │  ├─ frontend/           # React app
    │  │  ├─ src/…
    │  │  ├─ public/…
    │  │  └─ staticwebapp.config.json
    │  └─ backend/            # .NET 8 Web API
    │     ├─ Djoppie.Api.csproj
    │     └─ Program.cs
    ├─ infra/
    │  ├─ infrastructure-minimal.bicep
    │  └─ parameters-dev.json
    ├─ .azuredevops/
    │  ├─ pipeline-iac.yml
    │  ├─ pipeline-backend.yml
    │  └─ pipeline-frontend.yml
    └─ README.md

> *Tip:* Als de huidige repo anders is opgebouwd, pas dan alleen de padnamen in de YAML aan.

***

## 🌱 Branchingstrategie

* `main`: productie‑waardige code (release‑kwaliteit)
* `develop`: integratiebranch → **deployt naar je enige Azure‑omgeving**
* `feature/*`: korte‑levensduur voor features → merge naar `develop` via PR

> Omdat je maar **één Azure‑omgeving** gebruikt, is het verstandig enkel **`develop`** automatisch te deployen. `main` kan ook naar dezelfde omgeving deployen, maar houd het liefst één bron van waarheid om conflicten te vermijden.

***

## ☁️ Minimale Azure Architectuur (kostenbewust)

* **Resource Group:** `rg-djoppie-dev`
* **Static Web App (Free):** `swa-djoppie-dev`
* **App Service Plan (F1 Free):** `asp-djoppie-dev`
* **App Service (API):** `app-djoppie-api-dev`
* **Azure SQL (Serverless, autopause):** `sqldb-djoppie-dev`
* **Key Vault (Standard):** `kv-djoppie-dev`
* **Application Insights:** `appi-djoppie-dev`
* **Managed Identity:** voor App Service → toegang tot Key Vault / SQL (indien gewenst)
* **Entra ID registraties:** 1 voor **SPA**, 1 voor **API**

***

## 🧱 IaC met Bicep

**`infra/infrastructure-minimal.bicep` (voorbeeld)**

```bicep
targetScope = 'resourceGroup'

param location string = resourceGroup().location
@description('Project prefix, e.g., djoppie')
param project string = 'djoppie'
@description('Environment name, e.g., dev')
param env string = 'dev'

var name = '${project}-${env}'
var appServicePlanName = 'asp-${name}'
var webApiName = 'app-${project}-api-${env}'
var staticWebAppName = 'swa-${name}'
var keyVaultName = 'kv-${name}'
var appiName = 'appi-${name}'
var sqlServerName = 'sql-${name}'
var sqlDbName = 'sqldb-${name}'

// Application Insights
resource appi 'Microsoft.Insights/components@2020-02-02' = {
  name: appiName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    Flow_Type: 'Bluefield'
  }
}

// Key Vault (Standard)
resource kv 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: tenant().tenantId
    enablePurgeProtection: false
    enableSoftDelete: true
    accessPolicies: [] // we voegen policies/role assignments later toe (RBAC aanbevolen)
    enabledForDeployment: false
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: false
    publicNetworkAccess: 'Enabled'
  }
}

// App Service Plan (F1)
resource asp 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'F1'
    tier: 'Free'
    size: 'F1'
    capacity: 1
  }
  properties: {
    reserved: false
  }
}

// Web API (.NET 8) op App Service
resource api 'Microsoft.Web/sites@2023-12-01' = {
  name: webApiName
  location: location
  properties: {
    httpsOnly: true
    serverFarmId: asp.id
    siteConfig: {
      netFrameworkVersion: 'v8.0'
      appSettings: [
        { name: 'ASPNETCORE_ENVIRONMENT', value: 'Development' }
        { name: 'WEBSITE_RUN_FROM_PACKAGE', value: '1' }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appi.properties.ConnectionString }
        // Connection string uit Key Vault via referentie (runtime: gebruik Key Vault SDK of App Setting referentie)
      ]
      alwaysOn: false
    }
  }
  identity: {
    type: 'SystemAssigned'
  }
}

// Azure Static Web Apps (Free)
resource swa 'Microsoft.Web/staticSites@2023-12-01' = {
  name: staticWebAppName
  location: 'West Europe' // SWA vereist specifieke regio’s; West Europe is meestal beschikbaar
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    repositoryToken: '' // niet nodig als je via Azure DevOps/Actions deployt met build artifact
  }
}

// Azure SQL server (serverless database)
resource sqlServer 'Microsoft.Sql/servers@2022-05-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: 'sqladminuser'   // Gebruik later Key Vault voor wachtwoord
    administratorLoginPassword: 'ChangeM3Now!' // Voor demo; in praktijk via secure param of post-deploy resetten
    publicNetworkAccess: 'Enabled'
  }
}

resource sqlDb 'Microsoft.Sql/servers/databases@2022-05-01-preview' = {
  name: '${sqlServer.name}/${sqlDbName}'
  location: location
  sku: {
    name: 'GP_S_Gen5_1' // Serverless General Purpose
    tier: 'GeneralPurpose'
    family: 'Gen5'
    capacity: 1
  }
  properties: {
    autoPauseDelay: 60 // minuten (1 uur) – minimale kosten
    minCapacity: 0.5
    maxSizeBytes: 268435456000 // 250 GB (kan lager)
    zoneRedundant: false
  }
  dependsOn: [
    sqlServer
  ]
}

output staticWebAppName string = swa.name
output webApiName string = api.name
output keyVaultName string = kv.name
output applicationInsightsName string = appi.name
output sqlServerName string = sqlServer.name
output sqlDbName string = sqlDb.name
```

**`infra/parameters-dev.json` (optioneel)**

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "project": {
      "value": "djoppie"
    },
    "env": {
      "value": "dev"
    },
    "location": {
      "value": "westeurope"
    }
  }
}
```

***

## 🏗️ Azure aanmaken & deployen (CLI)

1. **Login & context**

```bash
az login
az account set --subscription "<SUBSCRIPTION_NAME_OR_ID>"
```

1. **Resource Group**

```bash
az group create -n rg-djoppie-dev -l westeurope
```

1. **Bicep deployen**

```bash
az deployment group create \
  -g rg-djoppie-dev \
  -f infra/infrastructure-minimal.bicep \
  -p infra/parameters-dev.json
```

1. **(Aanbevolen) Key Vault geheimen instellen**

```bash
# Voorbeeld: Connection string of SQL wachtwoord resetten
az keyvault secret set --vault-name kv-djoppie-dev --name "SqlAdminPassword" --value "<SterkWachtwoord!>"
```

1. **(Optioneel) Toegang App Service → Key Vault via RBAC**

```bash
# Pak Managed Identity principalId van de API
API_ID=$(az webapp identity show -g rg-djoppie-dev -n app-djoppie-api-dev --query principalId -o tsv)
# Geef 'Key Vault Secrets User' rol
az role assignment create \
  --assignee-object-id $API_ID \
  --role "Key Vault Secrets User" \
  --scope $(az keyvault show -n kv-djoppie-dev --query id -o tsv)
```

1. **Firewall SQL open voor Azure services (of zet Private endpoints later)**

```bash
az sql server firewall-rule create \
  -g rg-djoppie-dev -s sql-djoppie-dev \
  -n AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

***

## 🔐 Microsoft Entra ID (Azure AD) – App Registrations

Je hebt er **twee** nodig:

1. **SPA (React)**
    * **Redirect URIs:**
        * `https://<SWA_DEFAULT_HOSTNAME>/`
        * `http://localhost:3000/` (lokaal)
    * **Public client:** toegestaan
    * **Scopes (exposed by API):** consumeren van jouw API scope(s)
    * **MSAL configuratie (frontend):** clientId + authority (`https://login.microsoftonline.com/<tenantId>`) + scopes

2. **API (.NET)**
    * **Expose an API:** `api://<api-client-id>/access_as_user`
    * **Scopes:** `access_as_user` (of aangepaste naam)
    * **App roles** (optioneel)
    * **Audience (ApiIdentifierUri):** gebruik in backend JWT‑validatie

**MSAL in React (voorbeeld):**  
`src/frontend/src/authConfig.ts`

```ts
export const msalConfig = {
  auth: {
    clientId: "<SPA_CLIENT_ID>",
    authority: "https://login.microsoftonline.com/<TENANT_ID>",
    redirectUri: "/"
  },
  cache: { cacheLocation: "sessionStorage" }
};

export const loginRequest = {
  scopes: ["api://<API_CLIENT_ID>/access_as_user"]
};
```

**.NET 8 API – JWT Validatie (Program.cs, schets):**

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthentication("Bearer")
  .AddJwtBearer(options =>
  {
    options.Authority = $"https://login.microsoftonline.com/<TENANT_ID>/v2.0";
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidAudiences = new[] { "api://<API_CLIENT_ID>" }
    };
  });

builder.Services.AddAuthorization();
var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok("OK")).RequireAuthorization();

app.Run();
```

***

## 🌐 Static Web Apps routering (frontend → API)

Plaats in `src/frontend/staticwebapp.config.json`:

```json
{
  "routes": [
    {
      "route": "/api/*",
      "rewrite": "https://app-djoppie-api-dev.azurewebsites.net/api/*"
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html"
  },
  "responseOverrides": {
    "401": {
      "redirect": "/",
      "statusCode": 302
    }
  }
}
```

> **Let op:** Dit is een **externe API**‑binding. SWA host **niet** je .NET API (dat is App Service). Voor prod‑hardening kun je IP‑restricties/headers gebruiken.

***

## 🔑 Secrets & Config

* **Key Vault**:
  * `SqlAdminPassword`, `SqlConnectionString`, `Entra__TenantId`, `Entra__ClientId` (API), etc.
* **App Service → App Settings**:
  * Gebruik referenties of laad secrets runtime (via Azure.Identity + KeyVault SDK)
  * Voor demo eenvoudig: zet `ConnectionStrings__Default` met Key Vault secret value.

***

## 🧪 Local development

**Frontend**

```bash
cd src/frontend
npm install
npm start
# draait op http://localhost:3000
```

**Backend**

```bash
cd src/backend
dotnet restore
dotnet ef database update # als je EF Migrations gebruikt
dotnet run
# draait op http://localhost:5000 of 5111; configureer CORS en JWT
```

***

## 🚀 CI/CD met Azure DevOps (YAML)

> We gebruiken **Azure DevOps Pipelines** met een **GitHub Service Connection** (Repo blijft in GitHub).  
> Maak in Azure DevOps:
>
> * Service connections: **Azure Resource Manager** (subscription) + **GitHub** (OAuth/Pat)
> * Variable Group (optioneel) gelinkt met Key Vault.

### 1) IaC Pipeline – `/.azuredevops/pipeline-iac.yml`

* Triggert op `infra/**` en `develop`.
* Deployt Bicep naar `rg-djoppie-dev`.

```yaml
trigger:
  branches:
    include:
      - develop
  paths:
    include:
      - infra/*

pool:
  vmImage: 'ubuntu-latest'

variables:
  azureSubscription: 'AzureServiceConnectionName'
  resourceGroup: 'rg-djoppie-dev'
  location: 'westeurope'
  bicepFile: 'infra/infrastructure-minimal.bicep'
  paramsFile: 'infra/parameters-dev.json'

stages:
- stage: Deploy_IaC
  jobs:
  - job: BicepDeploy
    steps:
    - task: AzureCLI@2
      inputs:
        azureSubscription: $(azureSubscription)
        scriptType: bash
        scriptLocation: inlineScript
        inlineScript: |
          az group create -n $(resourceGroup) -l $(location)
          az deployment group create \
            -g $(resourceGroup) \
            -f $(bicepFile) \
            -p $(paramsFile)
```

### 2) Backend Pipeline – `/.azuredevops/pipeline-backend.yml`

* Build & deploy .NET 8 API naar App Service (F1).

```yaml
trigger:
  branches:
    include:
      - develop
  paths:
    include:
      - src/backend/*

pool:
  vmImage: 'windows-latest' # of ubuntu-latest

variables:
  azureSubscription: 'AzureServiceConnectionName'
  appName: 'app-djoppie-api-dev'
  buildConfiguration: 'Release'
  project: 'src/backend/Djoppie.Api.csproj'

stages:
- stage: Build
  jobs:
  - job: BuildApi
    steps:
    - task: UseDotNet@2
      inputs:
        packageType: 'sdk'
        version: '8.x'
    - script: dotnet restore $(project)
      displayName: 'Restore'
    - script: dotnet build $(project) -c $(buildConfiguration) --no-restore
      displayName: 'Build'
    - script: dotnet publish $(project) -c $(buildConfiguration) -o $(Build.ArtifactStagingDirectory)/publish
      displayName: 'Publish'
    - task: PublishBuildArtifacts@1
      inputs:
        PathtoPublish: '$(Build.ArtifactStagingDirectory)/publish'
        ArtifactName: 'api-publish'

- stage: Deploy
  dependsOn: Build
  jobs:
  - job: DeployApi
    steps:
    - download: current
      artifact: api-publish
    - task: AzureWebApp@1
      inputs:
        azureSubscription: $(azureSubscription)
        appType: 'webApp'
        appName: $(appName)
        package: '$(Pipeline.Workspace)/api-publish/**'
```

### 3) Frontend Pipeline – `/.azuredevops/pipeline-frontend.yml`

* Build React en deploy naar **Static Web Apps**.

**Optie A – Azure DevOps `AzureStaticWebApp@0` task** (aanbevolen):

```yaml
trigger:
  branches:
    include:
      - develop
  paths:
    include:
      - src/frontend/*

pool:
  vmImage: 'ubuntu-latest'

variables:
  app_location: 'src/frontend'
  output_location: 'build'
  swa_name: 'swa-djoppie-dev'
  azureSubscription: 'AzureServiceConnectionName'

stages:
- stage: BuildAndDeploy
  jobs:
  - job: SWA
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '18.x'
    - script: |
        cd $(app_location)
        npm ci
        npm run build
      displayName: 'Build React'
    - task: AzureStaticWebApp@0
      inputs:
        azure_static_web_apps_api_token: '$(deployment_token)' # Maak secret in Pipeline variables
        app_location: '$(app_location)'
        output_location: '$(app_location)/$(output_location)'
      displayName: 'Deploy to Static Web Apps'
```

**Waar haal je `deployment_token` vandaan?**  
Ga naar je SWA resource → **Manage deployment tokens** → kopieer token → voeg toe als secret variable `deployment_token` in je pipeline.

> *Alternatief:* GitHub Actions voor SWA is ook prima, maar om één tool te gebruiken (Azure DevOps) houden we het bij bovenstaande task.

***

## 🧭 End‑to‑end flow

1. **Ontwikkel op feature branch** → PR naar `develop`
2. Merge naar `develop` triggert:
    * **IaC** (wijzigingen onder `infra/`) → Azure resources up‑to‑date
    * **Backend** → build & deploy naar App Service
    * **Frontend** → build & deploy naar Static Web Apps
3. Frontend praat via `/api/*` naar je App Service API
4. Authenticatie via Entra ID (MSAL in React), API beschermt endpoints met JWT bearer.

***

## 💸 Kostenminimalisatie tips

* **SWA Free**: €0
* **App Service Plan F1**: €0 (beperk CPU/Memory; geen slots)
* **Azure SQL Serverless**: kies kleinste vCore, **auto‑pause** (bijv. 60 min), betaal alleen bij gebruik
* **Application Insights**: beperkte data (sampling), Pay‑As‑You‑Go
* **Key Vault Standard**: paar cent per 10k operaties; houd secrets beperkt
* **Één omgeving**: geen duplicatie van resources

> **Let op:** F1 heeft limieten (geen slots, koude starts). Voor later kun je naar B1 upgraden.

***

## 🧩 Veelvoorkomende configuratiepunten

* **CORS** op de API: sta SWA url toe (`https://<swa>.azurestaticapps.net`)
* **HTTPS‑only** overal
* **App Settings**:
  * `ASPNETCORE_ENVIRONMENT=Development` (of `Production`)
  * `APPLICATIONINSIGHTS_CONNECTION_STRING`
  * `ConnectionStrings__Default` → Key Vault value
* **EF Migrations**: maak pipeline stap of init script voor schema

***

## ✅ Checklist – Klaar om te gaan

* [ ] Repo bevat `infra/` met Bicep en `parameters-dev.json`
* [ ] Azure DevOps pipelines (YAML) aangemaakt en gekoppeld aan GitHub repo
* [ ] Azure Service Connection + GitHub Service Connection gemaakt
* [ ] SWA deployment token in pipeline secret
* [ ] Bicep gedeployed → resources bestaan
* [ ] Entra ID: SPA + API app registrations aangemaakt
* [ ] MSAL config in React en JWT in .NET correct ingesteld
* [ ] Key Vault secrets aanwezig en API kan ze lezen
* [ ] CORS en routering (`staticwebapp.config.json`) correct

***

## ❓FAQ

**Kan ik echt naar één omgeving deployen en later aanpassen?**  
Ja. Gebruik een generieke `dev` omgeving. Je kunt later resources upgraden (SKU), of een **tweede omgeving** toevoegen (bijv. prod) door Bicep parameters te variëren (`env='prod'`), zonder je pipelines fundamenteel te wijzigen.

**Waarom App Service i.p.v. Functions onder SWA?**  
Jouw backend is .NET 8 Web API. Dat draait het eenvoudigst op App Service. SWA kan wel Functions hosten, maar dat vraagt aanpassingen van je projectstructuur.

**Waarom Azure DevOps in plaats van GitHub Actions?**  
Jij gaf aan dat Azure DevOps geleerd/gebruikt wordt. We ondersteunen CI/CD volledig met Azure DevOps. (SWA heeft ook eigen GitHub Action – desgewenst kan ik een Actions‑workflow toevoegen.)

***

## 🔧 Wil je dat ik dit direct **klaarzet in je repo**?

Ik kan:

* De **Bicep** en **YAML** bestanden genereren zoals hierboven
* MSAL boilerplate en **`staticwebapp.config.json`** toevoegen
* Een **README** met teamrichtlijnen en screenshots toevoegen

Laat me weten:

* Het exacte **pad** van je frontend en backend in de repo
* Of je **EF Core** gebruikt en wat je **connection string** structuur is
* Je gewenste **Entra ID tenantId** (ik kan placeholders laten staan)

Zal ik een PR maken tegen de `develop` branch met deze structuur?

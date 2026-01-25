# Azure Kosten Optimalisatie - Djoppie Inventory DEV Omgeving

## Samenvatting

Dit document beschrijft drie scenario's voor het optimaliseren van Azure infrastructuurkosten voor de DEV omgeving van Djoppie Inventory.

**Huidige kosten**: €56-60/maand
**Aanbevolen scenario**: Budget (€28-33/maand)
**Besparing**: €24-29/maand (43% kostenreductie)

---

## Scenario Vergelijking

| Aspect | Scenario 1: Minimaal | Scenario 2: Budget ⭐ | Scenario 3: Huidig |
|--------|---------------------|----------------------|-------------------|
| **Maandkosten** | €5-10 | €28-33 | €57-62 |
| **Jaarkosten** | €60-120 | €336-396 | €684-744 |
| **Besparing** | €47-52/m | €24-29/m | - |
| **App Service** | F1 Free | B1 Basic | B2 Basic |
| **SQL Database** | Serverless 0.5-1 vCore | Serverless 1-2 vCore | Basic 5 DTU |
| **Always-On** | ❌ Nee | ✅ Ja | ✅ Ja |
| **Cold Starts** | ⚠️ DB + App | ⚠️ Alleen DB | ✅ Nee |
| **Performance** | Basis | Goed | Excellent |

---

## Scenario 1: MINIMAAL (~€5-10/maand)

### Doelgroep
- Tight budget projecten
- Incidenteel gebruik (< 10 uur/week)
- Studenten/hobby projecten

### Kostenbreakdown

| Resource | Configuratie | Kosten/Maand |
|----------|--------------|--------------|
| App Service Plan | F1 (Free) | €0 |
| Azure SQL Database | Serverless (0.5-1 vCore) | €5-8 |
| Static Web App | Free | €0 |
| Key Vault | Standard | €0.50-1 |
| Application Insights | Basic (5GB gratis) | €0 |
| Log Analytics | 5GB gratis tier | €0 |
| **TOTAAL** | | **€5-10** |

### Trade-offs

**Beperkingen**:
- ❌ App Service F1: Geen Always-On (app slaapt na 20 min inactiviteit)
- ❌ CPU limiet: 60 minuten per dag
- ❌ RAM: 1GB (beperkt)
- ⚠️ SQL auto-pause: 2-5 seconden cold start na 1 uur inactiviteit
- ⚠️ Eerste request na inactiviteit is traag

**Voordelen**:
- ✅ Alle functionaliteit blijft werken
- ✅ Automatische kostenreductie bij niet-gebruik
- ✅ Maximale besparing

### Implementatie

Wijzig `infrastructure/modules/infrastructure.bicep` regel 172-186:

```bicep
// App Service Plan - F1 Free
resource appServicePlan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  sku: {
    name: 'F1'
    tier: 'Free'
    capacity: 1
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}
```

Wijzig SQL Database (regel 134-153):

```bicep
// SQL Database - Serverless met minimum configuratie
resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
  parent: sqlServer
  name: sqlDatabaseName
  location: location
  tags: tags
  sku: {
    name: 'GP_S_Gen5'
    tier: 'GeneralPurpose'
    family: 'Gen5'
    capacity: 1 // 1 vCore max
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: 2147483648 // 2GB
    autoPauseDelay: 60 // Pause na 1 uur
    minCapacity: 0.5 // 0.5 vCore minimum
  }
}
```

---

## Scenario 2: BUDGET (~€28-33/maand) ⭐ AANBEVOLEN

### Doelgroep
- Actieve development teams
- Dagelijks gebruik
- Balans tussen kosten en performance

### Kostenbreakdown

| Resource | Configuratie | Kosten/Maand |
|----------|--------------|--------------|
| App Service Plan | B1 (Basic) | €12 |
| Azure SQL Database | Serverless (1-2 vCore) | €15-20 |
| Static Web App | Free | €0 |
| Key Vault | Standard | €1 |
| Application Insights | Basic (5GB gratis) | €0 |
| Log Analytics | 5GB gratis tier | €0 |
| **TOTAAL** | | **€28-33** |

### Trade-offs

**Verbeteringen t.o.v. Scenario 1**:
- ✅ Always-On beschikbaar (geen app sleep)
- ✅ Geen CPU limieten
- ✅ Betere performance (1 core, 1.75GB RAM)
- ✅ SQL met 2 vCores (snellere queries)
- ✅ Langere auto-pause delay (2u i.p.v. 1u)

**Beperkingen**:
- ⚠️ SQL cold starts nog steeds mogelijk (maar minder frequent)
- ⚠️ Beperkte schaling (1 instance)

**Voordelen**:
- ✅ 43% kostenreductie t.o.v. huidig
- ✅ Production-like SQL Serverless tier
- ✅ Goede developer experience
- ✅ Auto-scaling SQL database

### Implementatie

**Optie A: Gebruik budget-optimized module**

Wijzig `infrastructure/main.bicep` regel 52:

```bicep
// Deploy budget-optimized infrastructure
module infrastructure 'modules/infrastructure-budget.bicep' = {
  name: 'infrastructure-deployment'
  scope: resourceGroup
  params: {
    environment: environment
    location: location
    uniqueSuffix: uniqueSuffix
    sqlAdminLogin: sqlAdminLogin
    sqlAdminPassword: sqlAdminPassword
    entraIdTenantId: entraIdTenantId
    deploymentPrincipalObjectId: deploymentPrincipalObjectId
    tags: tags
  }
}
```

**Optie B: Wijzig bestaande module**

Pas `infrastructure/modules/infrastructure.bicep` aan:

1. **App Service Plan** (regel 172-186):

```bicep
resource appServicePlan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  sku: {
    name: environment == 'prod' ? 'P1V3' : 'B1' // Was: 'B2'
    tier: environment == 'prod' ? 'PremiumV3' : 'Basic'
    capacity: environment == 'prod' ? 2 : 1
  }
  kind: 'linux'
  properties: {
    reserved: true
    zoneRedundant: environment == 'prod' ? true : false
  }
}
```

2. **SQL Database** (regel 134-153):

```bicep
resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
  parent: sqlServer
  name: sqlDatabaseName
  location: location
  tags: tags
  sku: environment == 'prod' ? {
    name: 'S1'
    tier: 'Standard'
    capacity: 20
  } : {
    name: 'GP_S_Gen5'
    tier: 'GeneralPurpose'
    family: 'Gen5'
    capacity: 2 // 2 vCores max
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: environment == 'prod' ? 268435456000 : 5368709120 // 250GB prod, 5GB dev
    catalogCollation: 'SQL_Latin1_General_CP1_CI_AS'

    // Serverless properties only for dev
    autoPauseDelay: environment == 'dev' ? 120 : null // 2 hours
    minCapacity: environment == 'dev' ? 1 : null

    // Production properties
    zoneRedundant: environment == 'prod' ? true : false
    readScale: environment == 'prod' ? 'Enabled' : 'Disabled'
    requestedBackupStorageRedundancy: environment == 'prod' ? 'Geo' : 'Local'
    isLedgerOn: false
  }
}
```

3. **Application Insights optimalisatie** (regel 218-246):

Voeg toe aan appSettings array:

```bicep
{
  name: 'ApplicationInsights__SamplingSettings__IsEnabled'
  value: 'true'
}
{
  name: 'ApplicationInsights__SamplingSettings__MaxTelemetryItemsPerSecond'
  value: environment == 'dev' ? '5' : '20' // Limit telemetry in DEV
}
```

---

## Scenario 3: HUIDIG (~€56-60/maand)

### Kostenbreakdown

| Resource | Configuratie | Kosten/Maand |
|----------|--------------|--------------|
| App Service Plan | B2 (Basic) | €36 |
| Azure SQL Database | Basic (5 DTU) | €5 |
| Static Web App | Free | €0 |
| Key Vault | Standard | €1 |
| Application Insights | Pay-as-you-go | €10-15 |
| Log Analytics | PerGB2018 (5-10GB) | €5 |
| **TOTAAL** | | **€57-62** |

### Analyse

**Waarom zo duur?**:
- ❌ App Service B2 (€36/m) is 3x duurder dan B1 (€12/m)
- ❌ Application Insights > 5GB gratis tier door uitgebreide logging
- ❌ Log Analytics data ingestion kosten

**Wanneer te gebruiken**:
- ✅ Staging omgeving die production moet nabootsen
- ✅ Load testing scenario's
- ❌ NIET voor normale DEV werk

---

## Deployment Instructies

### Voor Scenario 2 (Aanbevolen)

#### Stap 1: Backup huidige configuratie

```bash
cd C:/Users/jowij/VSCodeDiepenbeek/Djoppie/Djoppie-Inventory/Djoppie-Inventory/infrastructure

# Maak backup van huidige module
cp modules/infrastructure.bicep modules/infrastructure-original.bicep
```

#### Stap 2: Kies implementatiemethode

**Methode A: Gebruik nieuwe budget module** (Aanbevolen - geen impact op production)

Wijzig `main.bicep` om budget module te gebruiken voor DEV:

```bicep
// Deploy infrastructure based on environment
module infrastructure './modules/${environment == 'dev' ? 'infrastructure-budget' : 'infrastructure'}.bicep' = {
  name: 'infrastructure-deployment'
  scope: resourceGroup
  params: {
    environment: environment
    location: location
    uniqueSuffix: uniqueSuffix
    sqlAdminLogin: sqlAdminLogin
    sqlAdminPassword: sqlAdminPassword
    entraIdTenantId: entraIdTenantId
    deploymentPrincipalObjectId: deploymentPrincipalObjectId
    tags: tags
  }
}
```

**Methode B: Wijzig bestaande module** (Eenvoudiger maar impacteert alle omgevingen)

Pas `modules/infrastructure.bicep` aan zoals beschreven in Scenario 2.

#### Stap 3: Valideer Bicep template

```bash
# Test DEV deployment
az deployment sub what-if \
  --location westeurope \
  --template-file infrastructure/main.bicep \
  --parameters infrastructure/parameters/dev.bicepparam \
  --name djoppie-dev-whatif
```

#### Stap 4: Deploy naar Azure

```bash
# Deploy DEV environment
az deployment sub create \
  --location westeurope \
  --template-file infrastructure/main.bicep \
  --parameters infrastructure/parameters/dev.bicepparam \
  --name djoppie-dev-deployment
```

#### Stap 5: Verifieer deployment

```bash
# Check resource costs
az consumption usage list \
  --start-date 2026-01-01 \
  --end-date 2026-01-31 \
  --query "[?contains(instanceName, 'djoppie-dev')]" \
  --output table

# Verify SQL Serverless configuration
az sql db show \
  --resource-group rg-djoppie-dev \
  --server <sql-server-name> \
  --name sqldb-djoppie-inventory \
  --query '{name:name, sku:sku, autoPauseDelay:autoPauseDelay, minCapacity:minCapacity}'

# Verify App Service Plan
az appservice plan show \
  --resource-group rg-djoppie-dev \
  --name asp-djoppie-dev \
  --query '{name:name, sku:sku}'
```

#### Stap 6: Test cold start behavior

SQL Serverless heeft cold starts. Test dit:

```bash
# Stop database activity en wacht 2+ uren
# Eerste query na auto-pause duurt 2-5 seconden

# Monitor cold starts in Application Insights:
# Query: requests | where duration > 2000 | project timestamp, duration, name
```

---

## Verwachte Impact

### Scenario 2 implementatie

**Downtime**: 5-10 minuten tijdens deployment
**Data verlies**: Geen (database wordt niet geraakt)
**Breaking changes**: Geen

**Eerste week na deployment**:
1. Monitor cold starts in Application Insights
2. Check error rates na SQL auto-pause
3. Verifieer Always-On werkt (app blijft wakker)

**Cold start mitigatie**:
```csharp
// Voeg toe aan backend startup voor betere error handling
services.Configure<SqlConnectionOptions>(options => {
    options.CommandTimeout = 60; // Extend timeout for cold starts
    options.RetryCount = 3;
    options.RetryDelay = TimeSpan.FromSeconds(2);
});
```

---

## Monitoring & Alerting

### Azure Cost Management

Stel budget alerts in:

```bash
# Maak budget voor DEV omgeving
az consumption budget create \
  --budget-name djoppie-dev-monthly \
  --amount 35 \
  --time-grain Monthly \
  --start-date 2026-01-01 \
  --end-date 2027-12-31 \
  --resource-group rg-djoppie-dev \
  --notifications \
    Actual_GreaterThan_80_Percent=true,<email@diepenbeek.be> \
    Actual_GreaterThan_100_Percent=true,<email@diepenbeek.be>
```

### Application Insights Queries

**Cold start detectie**:
```kusto
requests
| where cloud_RoleName == "djoppie-dev-api"
| where duration > 2000
| summarize count(), avg(duration) by bin(timestamp, 1h)
| render timechart
```

**Database connection errors**:
```kusto
exceptions
| where cloud_RoleName == "djoppie-dev-api"
| where outerMessage contains "SQL" or outerMessage contains "timeout"
| summarize count() by bin(timestamp, 1h), outerMessage
```

---

## Volgende Stappen

### Onmiddellijk (voor Scenario 2)

1. ✅ Review dit document met stakeholders
2. ✅ Kies implementatiemethode (A of B)
3. ✅ Test deployment in what-if mode
4. ✅ Schedule maintenance window (5-10 min)
5. ✅ Deploy naar DEV
6. ✅ Monitor gedurende 1 week

### Lange termijn optimalisaties

**Nog meer besparen** (optioneel):
- Schakel niet-gebruikte resources uit buiten kantooruren (PowerShell script)
- Gebruik Azure Dev/Test pricing (vereist Visual Studio subscription)
- Overweeg Azure Container Apps (€5-10/maand voor kleine apps)

**Voor Production**:
- Blijf bij huidige configuratie OF upgrade naar Premium tiers
- Overweeg Reserved Instances (1-jaar commitment = 30% korting)
- Implement proper scaling rules

---

## Cost Governance

### Aanbevelingen

1. **Resource Tagging**: Alle resources hebben tags (zie Bicep)
   - Environment: dev/staging/prod
   - CostCenter: Diepenbeek
   - Project: Djoppie-Inventory

2. **Maandelijkse Review**: Check Azure Cost Management dashboard
   - Target: < €35/maand voor DEV
   - Alert bij > €40/maand

3. **Quarterly Cleanup**:
   - Delete oude snapshots/backups
   - Review Application Insights retention
   - Check voor orphaned resources

4. **Auto-shutdown** (optioneel voor maximale besparing):
```bash
# Stop resources buiten kantooruren (PowerShell script)
# Weekdays: 18:00 - 08:00
# Weekends: hele weekend

# Estimated extra saving: €10-15/month
```

---

## Veelgestelde Vragen

### Q: Hoe lang duurt een SQL cold start?
**A**: 2-5 seconden. Eerste request na auto-pause is trager. Daarna normale performance.

### Q: Kan ik auto-pause uitschakelen?
**A**: Ja, set `autoPauseDelay: -1`. Maar dan betaal je continu voor compute (€60-80/maand ipv €15-20).

### Q: Waarom niet Azure Container Apps?
**A**: Container Apps kan goedkoper zijn (€5-10/m) maar vereist containerization. App Service is eenvoudiger voor .NET apps.

### Q: Impact op CI/CD pipeline?
**A**: Geen. Deployment blijft identiek. Alleen infrastructure tier wijzigt.

### Q: Hoe snel kan ik terugdraaien?
**A**: 5-10 minuten. Deploy gewoon de oude Bicep configuratie opnieuw.

### Q: Verlies ik data bij downgrade?
**A**: Nee. Database data blijft intact. Alleen compute tier wijzigt.

---

## Conclusie

**Aanbeveling**: Implementeer Scenario 2 (Budget) voor DEV omgeving

**Voordelen**:
- 💰 Bespaar €24-29/maand (€288-348/jaar)
- ⚡ Behoud goede development experience
- 🔄 Modern Serverless SQL (production-ready)
- 📊 Eenvoudig terug te draaien indien nodig

**Tijdsinvestering**: 1-2 uur voor deployment + 1 week monitoring

**ROI**: Besparing van €300+/jaar tegen 2 uur werk = €150/uur value

---

**Contact**: jo.wijnen@diepenbeek.be
**Laatste update**: 2026-01-18

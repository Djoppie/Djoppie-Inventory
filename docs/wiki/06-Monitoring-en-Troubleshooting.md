# Handleiding 6: Monitoring & Troubleshooting

**Versie:** 1.0
**Datum:** Januari 2026
**Onderdeel van:** Djoppie Inventory Deployment Handleidingen

---

## Inhoudsopgave

1. [Overzicht](#overzicht)
2. [Application Insights Setup](#application-insights-setup)
3. [Log Analytics Queries](#log-analytics-queries)
4. [Performance Monitoring](#performance-monitoring)
5. [Error Tracking](#error-tracking)
6. [Alerting en Notifications](#alerting-en-notifications)
7. [Common Issues en Oplossingen](#common-issues-en-oplossingen)
8. [Best Practices](#best-practices)

---

## Overzicht

Effectieve monitoring is cruciaal voor het beheren van een productie applicatie. Deze handleiding beschrijft monitoring, diagnostics en troubleshooting voor Djoppie Inventory.

### Monitoring Stack

```
┌─────────────────────────────────────┐
│  Application Insights               │
│  - Request tracking                 │
│  - Exception logging                │
│  - Custom metrics                   │
│  - Dependency tracking              │
│  - Live metrics stream              │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Log Analytics Workspace            │
│  - Centralized logging              │
│  - KQL queries                      │
│  - Dashboards                       │
│  - Workbooks                        │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Alerts & Notifications             │
│  - Email alerts                     │
│  - SMS notifications (optioneel)    │
│  - Azure DevOps work items          │
└─────────────────────────────────────┘
```

---

## Application Insights Setup

### Verificatie Configuratie

Application Insights werd automatisch geconfigureerd via Bicep deployment.

**Check via Azure Portal:**
1. Navigate naar Resource Group (rg-djoppie-dev/prod)
2. Find: `appi-djoppie-{env}`
3. Verify: Connected applications shows backend App Service

**Check Connection String:**

```bash
# Get connection string
az monitor app-insights component show \
  --app appi-djoppie-dev \
  --resource-group rg-djoppie-dev \
  --query connectionString -o tsv

# Example output:
# InstrumentationKey=abc123;IngestionEndpoint=https://westeurope-1.in.applicationinsights.azure.com/;LiveEndpoint=https://westeurope.livediagnostics.monitor.azure.com/
```

### Backend Integration Verificatie

**Check App Service Configuration:**

```bash
# Verify App Insights setting
az webapp config appsettings list \
  --name app-djoppie-dev-api-xxx \
  --resource-group rg-djoppie-dev \
  --query "[?name=='APPLICATIONINSIGHTS_CONNECTION_STRING'].value" -o tsv
```

**ASP.NET Core Integration:**

```csharp
// Program.cs - Should already be configured
builder.Services.AddApplicationInsightsTelemetry();

// appsettings.json
{
  "ApplicationInsights": {
    "ConnectionString": "[From environment variable]"
  }
}
```

### Frontend Integration (Optioneel)

Voor React frontend monitoring:

```bash
npm install --save @microsoft/applicationinsights-web
```

```typescript
// src/config/appInsights.ts
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({
  config: {
    connectionString: import.meta.env.VITE_APP_INSIGHTS_CONNECTION_STRING,
    enableAutoRouteTracking: true
  }
});

appInsights.loadAppInsights();
appInsights.trackPageView();

export default appInsights;
```

### Live Metrics Stream

Voor real-time monitoring:

1. Navigate: Application Insights > Live metrics
2. View real-time:
   - Incoming requests
   - Request duration
   - Failed requests
   - Server CPU/Memory
   - Dependencies (SQL, HTTP calls)

---

## Log Analytics Queries

### Kusto Query Language (KQL) Basics

**Access Log Analytics:**
1. Application Insights > Logs
2. Time range: Last 24 hours (aanpasbaar)
3. New query

### Essential Queries

#### Request Telemetry

**All Requests (laatste 24u):**
```kql
requests
| where timestamp > ago(24h)
| summarize count() by bin(timestamp, 1h), resultCode
| render timechart
```

**Failed Requests:**
```kql
requests
| where timestamp > ago(24h)
| where success == false
| project timestamp, name, url, resultCode, duration, operation_Id
| order by timestamp desc
| take 50
```

**Slowest Requests:**
```kql
requests
| where timestamp > ago(24h)
| where duration > 1000  // > 1 second
| project timestamp, name, url, duration, resultCode
| order by duration desc
| take 20
```

**Request Rate by Endpoint:**
```kql
requests
| where timestamp > ago(1h)
| summarize RequestCount = count() by name
| order by RequestCount desc
```

#### Exception Tracking

**All Exceptions:**
```kql
exceptions
| where timestamp > ago(24h)
| project timestamp, type, outerMessage, innermostMessage, operation_Name
| order by timestamp desc
```

**Exception Trends:**
```kql
exceptions
| where timestamp > ago(7d)
| summarize count() by bin(timestamp, 1d), type
| render timechart
```

**Top Exception Types:**
```kql
exceptions
| where timestamp > ago(24h)
| summarize count() by type
| order by count_ desc
```

#### Dependency Tracking

**Database Queries:**
```kql
dependencies
| where timestamp > ago(24h)
| where type == "SQL"
| project timestamp, target, name, duration, success
| order by duration desc
| take 50
```

**External API Calls:**
```kql
dependencies
| where timestamp > ago(24h)
| where type == "Http"
| summarize count() by target, success
| order by count_ desc
```

#### Performance Metrics

**Average Response Time:**
```kql
requests
| where timestamp > ago(24h)
| summarize avg(duration) by bin(timestamp, 1h)
| render timechart
```

**95th Percentile Response Time:**
```kql
requests
| where timestamp > ago(24h)
| summarize percentile(duration, 95) by bin(timestamp, 1h)
| render timechart
```

#### Custom Events

**User Login Events:**
```kql
customEvents
| where name == "UserLogin"
| where timestamp > ago(7d)
| summarize LoginCount = count() by bin(timestamp, 1d)
| render columnchart
```

### Saved Queries

**Save vaak gebruikte queries:**

1. Create query
2. Click "Save"
3. Name: "Failed Requests - Last 24h"
4. Category: "Troubleshooting"
5. Use in dashboards

---

## Performance Monitoring

### Application Performance

**Application Map:**
1. Navigate: Application Insights > Application map
2. Visual representation van:
   - Frontend → Backend dependencies
   - Backend → Database dependencies
   - Backend → External API dependencies
   - Response times per component
   - Failure rates

**Performance Blade:**
1. Navigate: Application Insights > Performance
2. View:
   - Operation duration distribution
   - Top slowest operations
   - Dependency call duration

**Query voor Performance Dashboard:**
```kql
let threshold = 2000; // 2 seconds
requests
| where timestamp > ago(24h)
| extend IsSlow = iff(duration > threshold, "Slow", "Fast")
| summarize SlowRequests = countif(IsSlow == "Slow"),
            FastRequests = countif(IsSlow == "Fast"),
            AvgDuration = avg(duration)
            by bin(timestamp, 1h)
| project timestamp, SlowRequests, FastRequests, AvgDuration
| render timechart
```

### Infrastructure Monitoring

**App Service Metrics:**
```bash
# CPU percentage
az monitor metrics list \
  --resource /subscriptions/.../sites/app-djoppie-prod-api-xxx \
  --metric "CpuPercentage" \
  --start-time 2026-01-18T00:00:00Z \
  --end-time 2026-01-18T23:59:59Z \
  --interval PT1H

# Memory percentage
az monitor metrics list \
  --resource /subscriptions/.../sites/app-djoppie-prod-api-xxx \
  --metric "MemoryPercentage" \
  --interval PT1H
```

**Database Performance:**
```bash
# DTU usage (Azure SQL)
az monitor metrics list \
  --resource /subscriptions/.../databases/sqldb-djoppie-inventory \
  --metric "dtu_consumption_percent" \
  --interval PT5M
```

### Availability Monitoring

**Availability Tests:**

1. Navigate: Application Insights > Availability
2. Click: "+ Add Standard test"
3. Configure:
   ```
   Test name: Backend API Health Check
   URL: https://app-djoppie-prod-api-xxx.azurewebsites.net/health
   Test frequency: 5 minutes
   Test locations: West Europe, North Europe, UK South
   Success criteria: HTTP 200
   Alert: Enabled
   ```

**Availability Query:**
```kql
availabilityResults
| where timestamp > ago(7d)
| summarize AvailabilityPercentage = 100.0 * sum(success) / count() by bin(timestamp, 1h)
| render timechart
```

---

## Error Tracking

### Exception Dashboard

**Create custom workbook:**

1. Navigate: Application Insights > Workbooks
2. Click: "+ New"
3. Add query:

```kql
// Exception Summary
exceptions
| where timestamp > ago(24h)
| summarize Count = count(),
            AffectedUsers = dcount(user_Id),
            Locations = make_set(client_City)
            by type, outerMessage
| order by Count desc
```

### Error Rate Tracking

**4xx Errors:**
```kql
requests
| where timestamp > ago(24h)
| where resultCode startswith "4"
| summarize count() by resultCode, url
| order by count_ desc
```

**5xx Errors:**
```kql
requests
| where timestamp > ago(24h)
| where resultCode startswith "5"
| extend ErrorType = case(
    resultCode == "500", "Internal Server Error",
    resultCode == "502", "Bad Gateway",
    resultCode == "503", "Service Unavailable",
    resultCode == "504", "Gateway Timeout",
    "Other"
)
| summarize count() by ErrorType, url
| order by count_ desc
```

### Failure Analysis

**End-to-End Transaction:**
```kql
// Find operation by ID
let operationId = "abc123-operation-id";
union requests, dependencies, exceptions, traces
| where operation_Id == operationId
| project timestamp, itemType, name, message, resultCode, duration
| order by timestamp asc
```

---

## Alerting en Notifications

### Alert Rules Configureren

#### High Error Rate Alert

```bash
# Via Azure CLI
az monitor metrics alert create \
  --name "High-Error-Rate-PROD" \
  --resource-group rg-djoppie-prod \
  --scopes /subscriptions/.../components/appi-djoppie-prod \
  --condition "count requests/failed > 10" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --description "Alert when more than 10 failed requests in 5 minutes" \
  --severity 2
```

**Via Portal:**
1. Application Insights > Alerts
2. "+ New alert rule"
3. Condition:
   - Signal: Failed requests
   - Threshold: > 10
   - Evaluation: 5 minutes
4. Action group: Create new
   - Email: jo.wijnen@diepenbeek.be
   - SMS: (optioneel)
5. Alert rule name: "High Error Rate"
6. Severity: Warning (Sev 2)
7. Enable: Yes

#### Slow Response Time Alert

```kql
// Custom log search alert
requests
| where timestamp > ago(5m)
| where duration > 3000
| summarize SlowRequestCount = count()
| where SlowRequestCount > 5
```

Alert configuratie:
- Alert logic: SlowRequestCount > 5
- Period: 5 minutes
- Frequency: 5 minutes

#### Low Availability Alert

```bash
az monitor metrics alert create \
  --name "Low-Availability-PROD" \
  --resource-group rg-djoppie-prod \
  --scopes /subscriptions/.../components/appi-djoppie-prod \
  --condition "avg availabilityResults/availabilityPercentage < 99" \
  --window-size 15m \
  --evaluation-frequency 5m \
  --severity 1  # Critical
```

### Action Groups

**Email Action Group:**
```bash
az monitor action-group create \
  --name "Djoppie-IT-Team" \
  --resource-group rg-djoppie-prod \
  --short-name "DjoppieIT" \
  --email-receiver name=Jo email=jo.wijnen@diepenbeek.be \
  --email-receiver name=ITSupport email=itsupport@diepenbeek.be
```

**Webhook Action (voor integratie met Teams/Slack):**
```bash
az monitor action-group create \
  --name "Djoppie-Teams-Notifications" \
  --resource-group rg-djoppie-prod \
  --short-name "Teams" \
  --webhook-receiver name=TeamsWebhook uri=https://outlook.office.com/webhook/...
```

---

## Common Issues en Oplossingen

### Performance Issues

#### Symptoom: Slow API Response Times

**Diagnose:**
```kql
// Find slowest dependencies
dependencies
| where timestamp > ago(1h)
| where duration > 1000
| summarize count(), avg(duration), max(duration) by target, name
| order by avg_duration desc
```

**Mogelijke Oorzaken:**
1. Database query performance
2. External API latency
3. Large payload sizes
4. Missing indexes

**Oplossing:**
```bash
# Enable SQL query insights
# Azure Portal: SQL Database > Intelligent Performance > Query Performance Insight

# Add missing indexes
# Check recommendations in Azure SQL Database > Performance recommendations
```

#### Symptoom: High Memory Usage

**Diagnose:**
```bash
# Check App Service memory
az monitor metrics list \
  --resource /subscriptions/.../sites/app-djoppie-prod-api-xxx \
  --metric "MemoryWorkingSet" \
  --start-time 2026-01-18T00:00:00Z \
  --interval PT1H
```

**Oplossing:**
- Implement proper disposal patterns
- Check for memory leaks
- Scale up App Service tier
- Enable Application Insights Profiler

### Authentication Issues

#### Symptoom: 401 Unauthorized Errors

**Diagnose:**
```kql
requests
| where resultCode == "401"
| project timestamp, url, customDimensions
| order by timestamp desc
| take 20
```

**Check:**
1. Token expiry
2. Invalid audience
3. Missing authentication header

**Oplossing:**
```bash
# Verify Entra ID configuration
az ad app show --id [CLIENT_ID] --query "web.redirectUris"

# Check App Service authentication
az webapp auth show --name app-djoppie-prod-api-xxx -g rg-djoppie-prod
```

### Database Connection Issues

#### Symptoom: SQL Connection Failures

**Diagnose:**
```kql
dependencies
| where type == "SQL"
| where success == false
| project timestamp, target, resultCode, data
| order by timestamp desc
```

**Check:**
1. Firewall rules
2. Connection string
3. Managed Identity permissions

**Oplossing:**
```bash
# Verify firewall
az sql server firewall-rule list \
  --resource-group rg-djoppie-prod \
  --server sql-djoppie-prod-xxx

# Add App Service IP
az sql server firewall-rule create \
  --resource-group rg-djoppie-prod \
  --server sql-djoppie-prod-xxx \
  --name AllowAppService \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### CORS Errors

**Diagnose:**
```kql
traces
| where message contains "CORS"
| project timestamp, message, severityLevel
| order by timestamp desc
```

**Oplossing:**
```bash
# Update CORS settings
az webapp cors add \
  --name app-djoppie-prod-api-xxx \
  --resource-group rg-djoppie-prod \
  --allowed-origins "https://swa-djoppie-prod-web-xxx.azurestaticapps.net"

# Verify
az webapp cors show \
  --name app-djoppie-prod-api-xxx \
  --resource-group rg-djoppie-prod
```

---

## Best Practices

### 1. Structured Logging

**Implement Serilog:**

```csharp
// Program.cs
builder.Host.UseSerilog((context, configuration) =>
    configuration
        .ReadFrom.Configuration(context.Configuration)
        .Enrich.FromLogContext()
        .Enrich.WithProperty("ApplicationName", "Djoppie-Inventory")
        .Enrich.WithProperty("Environment", context.HostingEnvironment.EnvironmentName)
        .WriteTo.ApplicationInsights(TelemetryConfiguration.CreateDefault(), TelemetryConverter.Traces));

// In controller
_logger.LogInformation("Asset {AssetCode} retrieved by user {UserId}", assetCode, userId);
```

### 2. Custom Metrics

**Track Business Metrics:**

```csharp
// In service
_telemetryClient.TrackMetric(
    "ActiveAssets",
    await _context.Assets.CountAsync(a => a.Status == AssetStatus.Active));

_telemetryClient.TrackEvent("AssetCreated",
    new Dictionary<string, string>
    {
        { "Category", asset.Category },
        { "CreatedBy", userId }
    });
```

### 3. Correlation IDs

**Track end-to-end transactions:**

```csharp
// Middleware
app.Use(async (context, next) =>
{
    var correlationId = context.Request.Headers["X-Correlation-ID"].FirstOrDefault()
                        ?? Guid.NewGuid().ToString();

    context.Response.Headers.Add("X-Correlation-ID", correlationId);

    using (_logger.BeginScope(new Dictionary<string, object> { ["CorrelationId"] = correlationId }))
    {
        await next();
    }
});
```

### 4. Health Checks

**Implement comprehensive health checks:**

```csharp
// Program.cs
builder.Services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>()
    .AddAzureKeyVault(options => ...)
    .AddApplicationInsightsPublisher();

app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});
```

### 5. Retention Policies

**Configure data retention:**

```bash
# Set retention for Application Insights (90-730 days)
az monitor app-insights component update \
  --app appi-djoppie-prod \
  --resource-group rg-djoppie-prod \
  --retention-time 90

# Archive logs to Storage Account for long-term retention
az monitor diagnostic-settings create \
  --name "ArchiveToStorage" \
  --resource /subscriptions/.../components/appi-djoppie-prod \
  --storage-account djoppielogs \
  --logs '[{"category": "AppTraces", "enabled": true, "retentionPolicy": {"days": 365, "enabled": true}}]'
```

---

## Monitoring Dashboard

### Custom Workbook

**Create comprehensive monitoring dashboard:**

1. Navigate: Application Insights > Workbooks
2. Click: "+ New"
3. Add sections:

**Section 1: Overall Health**
```kql
requests
| where timestamp > ago(1h)
| summarize
    TotalRequests = count(),
    FailedRequests = countif(success == false),
    AvgDuration = avg(duration),
    P95Duration = percentile(duration, 95)
| extend FailureRate = round(100.0 * FailedRequests / TotalRequests, 2)
```

**Section 2: Error Trends**
```kql
exceptions
| where timestamp > ago(24h)
| summarize count() by bin(timestamp, 1h), type
| render timechart
```

**Section 3: Top Endpoints**
```kql
requests
| where timestamp > ago(1h)
| summarize RequestCount = count(), AvgDuration = avg(duration) by name
| order by RequestCount desc
| take 10
```

**Section 4: Active Users**
```kql
requests
| where timestamp > ago(1h)
| summarize UniqueUsers = dcount(user_Id)
```

---

## Conclusie

Je hebt nu complete handleidingen voor het deployen en beheren van Djoppie Inventory!

### Deployment Checklist

**Initiële Setup:**
- [ ] Azure subscription voorbereid
- [ ] Entra ID app registrations aangemaakt
- [ ] Azure infrastructuur gedeployed via Bicep
- [ ] Azure DevOps pipelines geconfigureerd
- [ ] Database migrations uitgevoerd
- [ ] Monitoring en alerting ingesteld

**Ongoing Operations:**
- [ ] Weekly: Check Application Insights dashboard
- [ ] Weekly: Review failed requests en exceptions
- [ ] Monthly: Review costs en optimize resources
- [ ] Quarterly: Rotate secrets en certificates
- [ ] Quarterly: Review en update dependencies

### Support Resources

- **Documentatie:** Deze Wiki handleidingen
- **Code Repository:** https://github.com/Djoppie/Djoppie-Inventory
- **Azure Portal:** https://portal.azure.com
- **Application Insights:** Direct link via resource group
- **Contact:** jo.wijnen@diepenbeek.be

---

## Quick Reference

```bash
# === MONITORING COMMANDS ===
# View Application Insights
az monitor app-insights component show --app appi-djoppie-prod -g rg-djoppie-prod

# Query logs
az monitor app-insights query --app appi-djoppie-prod --analytics-query "requests | take 10"

# List alerts
az monitor metrics alert list -g rg-djoppie-prod

# === HEALTH CHECKS ===
# Backend health
curl https://app-djoppie-prod-api-xxx.azurewebsites.net/health

# Frontend
curl https://swa-djoppie-prod-web-xxx.azurestaticapps.net

# === TROUBLESHOOTING ===
# View logs
az webapp log tail --name app-djoppie-prod-api-xxx -g rg-djoppie-prod

# Restart app
az webapp restart --name app-djoppie-prod-api-xxx -g rg-djoppie-prod

# Check metrics
az monitor metrics list --resource [RESOURCE_ID] --metric CpuPercentage
```

---

**Alle handleidingen compleet! Succes met je deployment!**

**Vragen of problemen?** Contact: jo.wijnen@diepenbeek.be

**Wiki Home:** [00-Overzicht.md](00-Overzicht.md)

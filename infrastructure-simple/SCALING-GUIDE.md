# Djoppie Inventory - Scaling & Growth Guide

This guide shows you how to grow your infrastructure as your needs evolve. Think of it as your roadmap from learning to production-grade enterprise deployment.

## The Scaling Journey

```
Phase 1: Learning        Phase 2: Production      Phase 3: Enterprise
(You are here)          (Growing)                (Advanced)

B1 App Service          S1 App Service           P2v3 App Service
SQLite Database         Azure SQL Basic          Azure SQL Standard
Free Static Web App     Free Static Web App      Standard Static Web App
Basic monitoring        Enhanced monitoring      Full observability
€30/month              €100/month               €300+/month
1-10 users             10-100 users             100-1000+ users
```

## When to Scale: The Decision Matrix

### Stay on Current Setup When:

- Users: < 50 concurrent users
- Database: < 2 GB data
- Traffic: < 10,000 requests/day
- Response time: < 2 seconds average
- Downtime tolerance: A few minutes is okay
- Budget: Tight, learning phase

**Action**: Keep the simplified setup, you're good!

### Scale to Phase 2 When:

- Users: 50-100 concurrent users
- Database: 2-10 GB data
- Traffic: 10,000-100,000 requests/day
- Response time: Must be < 1 second
- Downtime tolerance: < 1 hour/month
- Budget: €100-200/month available

**Action**: Follow "Phase 2: Production Scaling" below

### Scale to Phase 3 When:

- Users: 100-1,000+ concurrent users
- Database: > 10 GB data
- Traffic: > 100,000 requests/day
- Response time: Must be < 500ms
- Downtime tolerance: Must have 99.9% SLA
- Budget: €300+/month available

**Action**: Follow "Phase 3: Enterprise Scaling" below

## Phase 2: Production Scaling (€100-200/month)

This is for when you're ready to support your whole department with better performance and reliability.

### Step 1: Upgrade App Service to S1

**Benefits**:
- 2x CPU and memory
- Auto-scaling up to 10 instances
- Deployment slots (blue-green deployments)
- Daily backups
- Traffic Manager support

**Cost**: €43/month per plan

**How to upgrade**:

```bash
# Upgrade existing plan
az appservice plan update \
  --name asp-djoppie-prod \
  --resource-group rg-djoppie-prod \
  --sku S1
```

Or update Bicep:

```bicep
sku: {
  name: 'S1'  // Changed from B1
  tier: 'Standard'  // Changed from Basic
  capacity: 1  // Can auto-scale to 10
}
```

### Step 2: Migrate to Azure SQL Database

**Benefits**:
- Unlimited concurrent connections
- Better performance
- Automated backups
- Point-in-time restore
- Geo-replication options

**Cost**: €4.33/month (Basic) to €43/month (S1)

**Migration steps**:

1. **Create Azure SQL Database**:

```bicep
// Add to main.bicep
resource sqlServer 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: 'sql-${resourceNamePrefix}'
  location: location
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }

  resource database 'databases@2023-08-01-preview' = {
    name: 'djoppie-inventory-db'
    location: location
    sku: {
      name: 'Basic'  // Start here, upgrade to S1 if needed
      tier: 'Basic'
    }
    properties: {
      collation: 'SQL_Latin1_General_CP1_CI_AS'
      maxSizeBytes: 2147483648  // 2 GB
      catalogCollation: 'SQL_Latin1_General_CP1_CI_AS'
    }
  }
}

// Allow Azure services to connect
resource firewallRule 'Microsoft.Sql/servers/firewallRules@2023-08-01-preview' = {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}
```

2. **Update connection string in App Service**:

```bash
# Add connection string
az webapp config connection-string set \
  --name app-djoppie-prod-api \
  --resource-group rg-djoppie-prod \
  --connection-string-type SQLAzure \
  --settings DefaultConnection="Server=tcp:sql-djoppie-prod.database.windows.net,1433;Database=djoppie-inventory-db;Authentication=Active Directory Managed Identity;"
```

3. **Migrate SQLite data to Azure SQL**:

```bash
# Export SQLite to SQL script
sqlite3 djoppie.db .dump > export.sql

# Import to Azure SQL
sqlcmd -S sql-djoppie-prod.database.windows.net \
  -d djoppie-inventory-db \
  -G \
  -i export.sql
```

4. **Update backend to use SQL Server**:

Update `DjoppieInventory.Infrastructure/Data/AppDbContext.cs`:

```csharp
// Add NuGet package: Microsoft.EntityFrameworkCore.SqlServer

protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
{
    if (!optionsBuilder.IsConfigured)
    {
        var connectionString = Configuration.GetConnectionString("DefaultConnection");

        if (connectionString.Contains("Data Source="))
        {
            // SQLite for development
            optionsBuilder.UseSqlite(connectionString);
        }
        else
        {
            // Azure SQL for production
            optionsBuilder.UseSqlServer(connectionString);
        }
    }
}
```

### Step 3: Enable Auto-Scaling

**How to configure**:

```bicep
resource autoscaleSettings 'Microsoft.Insights/autoscalesettings@2022-10-01' = {
  name: 'autoscale-${resourceNamePrefix}'
  location: location
  properties: {
    enabled: true
    targetResourceUri: appServicePlan.id
    profiles: [
      {
        name: 'Auto scale based on CPU'
        capacity: {
          minimum: '1'
          maximum: '5'
          default: '1'
        }
        rules: [
          {
            metricTrigger: {
              metricName: 'CpuPercentage'
              metricResourceUri: appServicePlan.id
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT5M'
              timeAggregation: 'Average'
              operator: 'GreaterThan'
              threshold: 70
            }
            scaleAction: {
              direction: 'Increase'
              type: 'ChangeCount'
              value: '1'
              cooldown: 'PT5M'
            }
          }
          {
            metricTrigger: {
              metricName: 'CpuPercentage'
              metricResourceUri: appServicePlan.id
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT10M'
              timeAggregation: 'Average'
              operator: 'LessThan'
              threshold: 30
            }
            scaleAction: {
              direction: 'Decrease'
              type: 'ChangeCount'
              value: '1'
              cooldown: 'PT10M'
            }
          }
        ]
      }
    ]
  }
}
```

### Step 4: Add Deployment Slots

**Benefits**:
- Zero-downtime deployments
- Test in production environment
- Easy rollback

**How to configure**:

```bicep
resource stagingSlot 'Microsoft.Web/sites/slots@2023-12-01' = {
  parent: backendApp
  name: 'staging'
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
  }
}
```

Update pipeline to use slot swaps:

```yaml
- task: AzureAppServiceManage@0
  displayName: 'Swap staging slot to production'
  inputs:
    azureSubscription: $(azureServiceConnection)
    action: 'Swap Slots'
    webAppName: $(backendAppName)
    resourceGroupName: $(resourceGroupName)
    sourceSlot: 'staging'
    targetSlot: 'production'
```

### Step 5: Enhanced Monitoring

Add Application Insights alerts:

```bicep
resource responseTimeAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'alert-${resourceNamePrefix}-responsetime'
  location: 'global'
  properties: {
    description: 'Alert when response time exceeds 2 seconds'
    severity: 2
    enabled: true
    scopes: [
      backendApp.id
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'ResponseTime'
          metricName: 'HttpResponseTime'
          operator: 'GreaterThan'
          threshold: 2
          timeAggregation: 'Average'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}
```

### Phase 2 Cost Breakdown

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| App Service Plan | S1 | €43 |
| Azure SQL Database | Basic | €4.33 |
| Static Web App | Free | €0 |
| Key Vault | Standard | €0.04 |
| Application Insights | 5-10 GB | €0-12 |
| **Total** | | **€47-60/month** |

## Phase 3: Enterprise Scaling (€300+/month)

For organization-wide deployment with high availability and disaster recovery.

### Step 1: Premium App Service Plan

```bicep
sku: {
  name: 'P2v3'  // 2 cores, 8 GB RAM
  tier: 'PremiumV3'
  capacity: 2  // Minimum for HA
}
```

**Cost**: €126/month per instance (€252 for 2 instances)

### Step 2: Azure SQL Standard with Geo-Replication

```bicep
sku: {
  name: 'S3'  // 100 DTUs
  tier: 'Standard'
}

// Add geo-replica
resource secondaryServer 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: 'sql-${resourceNamePrefix}-secondary'
  location: 'northeurope'  // Different region
  // ... properties
}
```

**Cost**: €172/month (primary) + €172/month (replica) = €344/month

### Step 3: Azure Front Door (CDN + WAF)

```bicep
resource frontDoor 'Microsoft.Cdn/profiles@2023-07-01-preview' = {
  name: 'fd-${resourceNamePrefix}'
  location: 'global'
  sku: {
    name: 'Standard_AzureFrontDoor'
  }
}
```

**Cost**: €26/month base + usage

### Step 4: Advanced Features

- **Azure Monitor**: Full observability (€50-100/month)
- **Azure Key Vault Premium**: HSM-backed keys (€85/month)
- **Azure AD Premium P1**: Advanced identity features (€5/user/month)
- **Azure Backup**: SQL backups (€10-30/month)
- **Azure DevOps Parallelism**: Faster builds (€34/month)

### Phase 3 Cost Breakdown

| Service | Monthly Cost |
|---------|--------------|
| App Service P2v3 (x2) | €252 |
| Azure SQL S3 + Replica | €344 |
| Azure Front Door | €30-50 |
| Key Vault Premium | €85 |
| Advanced Monitoring | €50-100 |
| Backups & Storage | €20-40 |
| **Total** | **€781-871/month** |

## Gradual Scaling Path

Don't jump straight to Phase 3! Here's a sensible progression:

### Month 1-6: Learning Phase
- **Setup**: Current simplified infrastructure
- **Cost**: €26-30/month
- **Users**: 5-10
- **Focus**: Learning, feature development

### Month 7-12: Department Rollout
- **Upgrade**: Move to S1 App Service
- **Cost**: €50-70/month
- **Users**: 10-50
- **Focus**: User adoption, feedback

### Year 2: Organization-Wide
- **Upgrade**: Add Azure SQL Basic
- **Cost**: €60-80/month
- **Users**: 50-200
- **Focus**: Reliability, performance

### Year 3: Enterprise Features
- **Upgrade**: S1 SQL, enhanced monitoring
- **Cost**: €120-150/month
- **Users**: 200-500
- **Focus**: Compliance, security

### Year 4+: Scale as Needed
- **Upgrade**: Premium tiers if necessary
- **Cost**: €300+/month
- **Users**: 500-5,000+
- **Focus**: High availability, global reach

## Performance Benchmarks

Know when to scale by monitoring these metrics:

### Current Setup (B1 + SQLite) Can Handle:

- **Users**: 50 concurrent
- **Requests**: 10,000/day
- **Database size**: 2 GB
- **Response time**: 1-3 seconds
- **Uptime**: 99% (8.76 hours downtime/year)

### S1 + Azure SQL Basic Can Handle:

- **Users**: 200 concurrent
- **Requests**: 100,000/day
- **Database size**: 10 GB
- **Response time**: 500ms-1s
- **Uptime**: 99.5% (43.8 hours downtime/year)

### P2v3 + SQL S3 Can Handle:

- **Users**: 1,000+ concurrent
- **Requests**: 1,000,000+/day
- **Database size**: 250 GB
- **Response time**: <500ms
- **Uptime**: 99.95% (4.38 hours downtime/year)

## Feature Flags for Gradual Rollout

Use feature flags to enable new features gradually:

```csharp
// Install: Microsoft.FeatureManagement.AspNetCore

// appsettings.json
{
  "FeatureManagement": {
    "IntuneIntegration": false,  // Enable when ready
    "AdvancedReporting": false,
    "BulkOperations": false
  }
}

// Controller
[FeatureGate("IntuneIntegration")]
public IActionResult GetIntuneDevices()
{
    // Only accessible when feature is enabled
}
```

## Monitoring Your Growth

Set up dashboards to track when to scale:

### Azure Portal Dashboard

Create a custom dashboard showing:
1. **App Service CPU %** - Scale at 70%+
2. **App Service Memory %** - Scale at 80%+
3. **Response Time** - Scale if >2s consistently
4. **Database Size** - Migrate to SQL at 2 GB
5. **Daily Active Users** - Track growth
6. **Costs** - Monitor budget

### Application Insights Queries

```kusto
// Average response time per hour
requests
| where timestamp > ago(24h)
| summarize avg(duration) by bin(timestamp, 1h)
| render timechart

// Database size (for SQLite)
traces
| where message contains "Database size"
| project timestamp, size = extract("([0-9.]+) MB", 1, message)
| render timechart

// Active users
requests
| where timestamp > ago(7d)
| summarize dcount(user_Id) by bin(timestamp, 1d)
| render timechart
```

## Migration Scripts

### SQLite to Azure SQL Migration

```powershell
# Export SQLite
sqlite3 djoppie.db <<EOF
.output djoppie-export.sql
.dump
EOF

# Convert SQLite SQL to SQL Server SQL
# (SQLite uses different syntax, so you'll need to adjust)

# Import to Azure SQL
sqlcmd -S sql-djoppie-prod.database.windows.net \
  -d djoppie-inventory-db \
  -U sqladmin \
  -P <password> \
  -i djoppie-export.sql
```

### Zero-Downtime Migration

```yaml
# Azure DevOps pipeline stage
- stage: Migrate
  jobs:
  - job: MigrateDatabase
    steps:
    # 1. Deploy new version that works with BOTH SQLite and SQL Server
    - task: AzureWebApp@1
      inputs:
        appName: $(backendAppName)
        slotName: staging

    # 2. Migrate data from SQLite to SQL Server
    - task: AzureCLI@2
      inputs:
        inlineScript: |
          # Run migration script
          az webapp run --name $(backendAppName) \
            --resource-group $(resourceGroupName) \
            --slot staging \
            --command "dotnet DjoppieInventory.MigrationTool.dll"

    # 3. Switch connection string to SQL Server
    - task: AzureCLI@2
      inputs:
        inlineScript: |
          az webapp config connection-string set \
            --name $(backendAppName) \
            --resource-group $(resourceGroupName) \
            --slot staging \
            --settings DefaultConnection="<SQL-connection-string>"

    # 4. Swap staging to production
    - task: AzureAppServiceManage@0
      inputs:
        action: 'Swap Slots'
        sourceSlot: staging
```

## Questions & Decisions

### Should I migrate to Azure SQL now?

**Migrate if**:
- Database > 2 GB
- > 5 concurrent users regularly
- Need backups/restore
- Need better querying performance

**Stay with SQLite if**:
- Database < 2 GB
- < 5 concurrent users
- Simple queries
- Budget is tight

### Should I use auto-scaling?

**Use auto-scaling if**:
- Traffic is unpredictable
- Peak times are known (e.g., 9am-5pm)
- Need to handle traffic spikes
- Want to save money during off-hours

**Manual scaling is fine if**:
- Traffic is consistent
- Small user base
- Learning phase
- Predictable usage patterns

### Should I use deployment slots?

**Use slots if**:
- Need zero-downtime deployments
- Want to test in production
- Need easy rollbacks
- Can afford S1+ tier

**Don't use slots if**:
- On B1 tier (not supported)
- Deployments are infrequent
- Testing in dev/staging is sufficient

## Summary

Your scaling journey:

1. **Start Simple** (€30/month)
   - B1 App Service
   - SQLite
   - Free Static Web App
   - Perfect for learning!

2. **Scale When Needed** (€100/month)
   - S1 App Service
   - Azure SQL Basic
   - Auto-scaling
   - Support 50-200 users

3. **Enterprise Grade** (€300+/month)
   - Premium App Service
   - SQL Standard + replica
   - Front Door + CDN
   - Support 500-5,000+ users

**Key Principle**: Don't over-engineer early. Scale when metrics show you need it, not before!

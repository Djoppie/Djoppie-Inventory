# Djoppie Inventory - Cost Breakdown & Budget Guide

This document provides a detailed breakdown of Azure costs for your Djoppie Inventory deployment.

## Monthly Cost Estimate (Simplified Setup)

### Development Environment

| Service | Tier | Monthly Cost (EUR) | Notes |
|---------|------|-------------------|-------|
| **App Service Plan (Linux B1)** | Basic B1 | €11.79 | Shared for all apps on the plan |
| **Static Web App** | Free | €0.00 | 100 GB bandwidth included |
| **Key Vault** | Standard | €0.04 | First 10,000 operations free |
| **Application Insights** | Pay-as-you-go | €0.00 - €2.00 | First 5 GB/month free |
| **Log Analytics** | Pay-as-you-go | €0.00 - €2.00 | First 5 GB/month free |
| **Data Transfer** | Outbound | €0.00 - €1.00 | First 5 GB/month free |
| **TOTAL** | | **€11.83 - €16.83** | Typical: €13-14/month |

### Production Environment

| Service | Tier | Monthly Cost (EUR) | Notes |
|---------|------|-------------------|-------|
| **App Service Plan (Linux B1)** | Basic B1 | €11.79 | Can share with dev or separate |
| **Static Web App** | Free | €0.00 | 100 GB bandwidth included |
| **Key Vault** | Standard | €0.04 | Separate vault for prod |
| **Application Insights** | Pay-as-you-go | €0.00 - €3.00 | Depends on traffic |
| **Log Analytics** | Pay-as-you-go | €0.00 - €3.00 | Depends on logs |
| **Data Transfer** | Outbound | €0.00 - €2.00 | Depends on usage |
| **TOTAL** | | **€11.83 - €19.83** | Typical: €13-15/month |

### Combined (Dev + Prod)

**Total Monthly Cost**: €23.66 - €36.66 EUR

**Typical Monthly Cost**: €26-29 EUR

**Annual Cost**: €284 - €440 EUR (~€312-348 typical)

## Cost Comparison: What We're Saving

Here's what the enterprise setup (from your original pipeline) would cost:

| Service | Enterprise Setup | Simplified Setup | Savings |
|---------|-----------------|-----------------|---------|
| **Database** | Azure SQL (S1): €43/month | SQLite: €0 | €43/month |
| **App Service** | P1v2: €63/month | B1: €12/month | €51/month |
| **Static Web App** | Standard: €7.60/month | Free: €0 | €7.60/month |
| **Zone Redundancy** | ~€20/month | None: €0 | €20/month |
| **TOTAL SAVINGS** | | | **€121.60/month** |

**Annual Savings**: ~€1,459 EUR

## Understanding the Costs

### What's Actually Costing Money

1. **App Service Plan B1** (€11.79/month)
   - This is the main cost
   - Runs 24/7
   - 1 core, 1.75 GB RAM
   - Can host multiple apps on the same plan

2. **Data Ingestion** (Variable, usually free)
   - Application Insights logs
   - Stays free if under 5 GB/month
   - You'd need ~100,000+ requests/month to exceed this

3. **Data Transfer** (Variable, usually free)
   - Outbound internet traffic
   - First 5 GB/month free
   - €0.087/GB after that

### What's Free

1. **Static Web Apps** (Free tier)
   - Perfect for React apps
   - 100 GB bandwidth/month
   - Custom domains
   - SSL certificates

2. **Key Vault Operations** (First 10,000/month)
   - You'll use ~100-500/month
   - Way under the limit

3. **Application Insights** (First 5 GB/month)
   - Basic monitoring
   - Enough for most small apps

4. **Entra ID** (Included with Microsoft 365)
   - Authentication
   - App registrations
   - Single sign-on

## Monthly Cost by Usage

Here's what you'd pay at different usage levels:

### Very Light Usage (Testing/Demo)
- 100 users/month
- 1,000 page views/month
- Minimal API calls
- **Cost**: €12-13/month (barely above the base App Service cost)

### Light Usage (Small Department)
- 50 active users/month
- 10,000 page views/month
- 50,000 API calls/month
- **Cost**: €13-15/month

### Moderate Usage (Full Department)
- 200 active users/month
- 50,000 page views/month
- 250,000 API calls/month
- **Cost**: €14-17/month

### Heavy Usage (Organization-Wide)
- 1,000 active users/month
- 200,000 page views/month
- 1,000,000 API calls/month
- **Cost**: €18-22/month
- **Recommendation**: Consider upgrading to S1 tier

## Cost Optimization Strategies

### Strategy 1: Turn Off Dev When Not Using It

Save ~€12/month by stopping dev resources when not in use:

```bash
# Stop dev environment (Friday evening)
az webapp stop --name app-djoppie-dev-api --resource-group rg-djoppie-dev

# Start dev environment (Monday morning)
az webapp start --name app-djoppie-dev-api --resource-group rg-djoppie-dev
```

**Savings**: If you only run dev 40 hours/week (instead of 168), you save ~€8/month.

### Strategy 2: Share App Service Plan

Run multiple Djoppie apps on the same App Service Plan:

- Djoppie Inventory (this app)
- Djoppie [Future App 1]
- Djoppie [Future App 2]

**All on the same B1 plan = Still €11.79/month!**

To add another app to the same plan:
```bash
az webapp create \
  --name app-djoppie-dev-otherapp \
  --resource-group rg-djoppie-dev \
  --plan asp-djoppie-dev
```

### Strategy 3: Use Only One Environment Initially

Start with just DEV, add PROD later:

- **Initial**: €12-17/month (just dev)
- **Later**: Add prod when ready to launch

**Savings**: €12-15/month during initial development

### Strategy 4: Clean Up Unused Resources

Delete old deployments and test resources:

```bash
# List all resource groups
az group list --output table

# Delete unused test environments
az group delete --name rg-djoppie-test --yes
```

### Strategy 5: Set Up Budget Alerts

Get notified before costs get too high:

```bash
# Create a budget (via Azure Portal is easier)
# Set alert at: €15, €25, €35
```

## Scaling Cost: When to Upgrade

### When to Upgrade from B1 to S1 (€43/month)

Upgrade when you experience:

- Response times > 2 seconds consistently
- CPU usage > 80% regularly
- Memory usage > 80% regularly
- More than 1,000 concurrent users

**S1 Benefits**:
- 2x CPU power
- 2x memory (3.5 GB)
- Auto-scaling
- Deployment slots
- Daily backups

### When to Add Azure SQL Database (€43/month for S1)

Migrate from SQLite when:

- Database size > 2 GB
- Need > 5 concurrent connections
- Need advanced querying
- Need backup/restore
- Need replication

**Note**: SQLite works great for small teams! Don't rush this.

### When to Upgrade Static Web App to Standard (€7.60/month)

Upgrade when you need:

- More than 100 GB bandwidth/month
- Custom authentication providers
- Advanced networking
- SLA guarantees

**Note**: Free tier is usually enough!

## Total Cost of Ownership (TCO) - 3 Year Projection

### Scenario: Learning Phase (Year 1)

- **Months 1-6**: Dev only (€15/month) = €90
- **Months 7-12**: Dev + Prod (€28/month) = €168
- **Year 1 Total**: €258

### Scenario: Growth Phase (Year 2)

- Same setup as Year 1, steady state
- **Year 2 Total**: €336 (€28/month x 12)

### Scenario: Expansion Phase (Year 3)

- Upgrade to S1 tier
- Add Azure SQL
- **Year 3 Total**: €1,080 (€90/month x 12)

**3-Year Total**: €1,674 (~€558/year average)

## Comparison with Alternatives

### On-Premises Server

- **Initial**: €3,000-5,000 (server hardware)
- **Annual**: €500-1,000 (power, cooling, maintenance)
- **3-Year Total**: €4,500-8,000
- **Our savings**: €2,826-6,326 over 3 years

### Expensive Cloud Setup

- **Monthly**: €150-300 (over-provisioned resources)
- **3-Year Total**: €5,400-10,800
- **Our savings**: €3,726-9,126 over 3 years

### Free Tier Only (Not Sustainable)

- **Monthly**: €0-5 (free tiers only)
- **Limitation**: Can't run production workloads
- **Reliability**: Poor (services stop, limits hit)
- **Our setup is the sweet spot**: Low cost, production-ready

## Billing & Payment Tips

### How Azure Billing Works

1. **Pay-as-you-go**: Charged for actual usage
2. **Monthly invoice**: Sent on the 1st of each month
3. **Resource-level**: See costs per service
4. **Tag-based**: Can track by project/environment

### Setting Up Cost Alerts

1. Go to **Cost Management + Billing** in Azure Portal
2. Click **Budgets**
3. Create budget:
   - **Scope**: Your subscription
   - **Budget amount**: €40/month
   - **Alert at**: 50%, 75%, 90%, 100%
4. **Email alerts** to: jo.wijnen@diepenbeek.be

### Viewing Your Costs

```bash
# See costs by resource group
az consumption usage list \
  --start-date 2026-01-01 \
  --end-date 2026-01-31 \
  --query "[?resourceGroup=='rg-djoppie-dev']" \
  --output table

# Or use Azure Portal:
# Cost Management + Billing > Cost Analysis
```

## Cost Breakdown by Feature

Want to know what each feature costs? Here's a breakdown:

| Feature | Resources Used | Monthly Cost |
|---------|---------------|--------------|
| **QR Code Scanning** | Frontend (Static Web App) | €0 |
| **Asset Database** | SQLite on App Service | €0 (included) |
| **API Endpoints** | App Service B1 | €11.79 |
| **User Authentication** | Entra ID | €0 |
| **Secure Storage** | Key Vault | €0.04 |
| **Monitoring/Logs** | App Insights + Log Analytics | €0-2 |
| **QR Code Generation** | Backend processing | €0 (included) |

## Questions & Answers

### Q: Can I run this for free?

**A**: Almost, but not quite. The App Service B1 (€12/month) is the minimum for production workloads. Free tiers exist but have severe limitations (sleep after 20 min, no custom domains, etc.).

### Q: What if I exceed the free tiers?

**A**: You'll get charged:
- Application Insights: €2.30/GB after 5 GB
- Bandwidth: €0.087/GB after 5 GB
- Key Vault: €0.029 per 10,000 operations after first 10,000

### Q: Can I reduce costs further?

**A**: Yes:
1. Turn off dev when not using (save €8/month)
2. Share App Service Plan across apps
3. Use only one environment
4. Delete test/unused resources

### Q: Is this cheaper than Azure SQL?

**A**: Yes! Azure SQL S1 costs €43/month. SQLite is free and works great for small datasets (<2 GB, <5 concurrent users).

### Q: What about backups?

**A**:
- SQLite: Manual backups via deployment slots (free)
- App Service: Built-in deployment slots (free on B1)
- For critical data: Consider upgrading to S1 for automated backups

## Summary

Your simplified Djoppie Inventory infrastructure costs approximately:

- **Dev Environment**: €13-15/month
- **Prod Environment**: €13-15/month
- **Total**: €26-30/month
- **Annual**: €312-360/year

This is **extremely cost-effective** for a production cloud application with:
- Enterprise authentication
- Secure secrets management
- Monitoring and logging
- High availability
- SSL/HTTPS
- Custom domains (when you add them)

You're getting enterprise features at learning prices!

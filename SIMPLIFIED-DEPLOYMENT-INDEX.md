# Djoppie Inventory - Simplified Azure Deployment

Welcome to the simplified, budget-friendly Azure deployment for Djoppie Inventory!

## What Is This?

This is a **learning-focused, cost-optimized** Azure infrastructure setup designed specifically for deploying your Djoppie Inventory application without breaking the bank. Perfect for students, small teams, and organizations learning Azure DevOps.

**Total Cost**: €26-30/month for BOTH dev and prod environments

## What You Get

A complete cloud infrastructure with:
- React frontend (Azure Static Web Apps - FREE)
- ASP.NET Core backend (App Service B1 - €12/month)
- SQLite database (bundled, no extra cost)
- Microsoft Entra ID authentication (FREE with your tenant)
- Secure secrets management (Key Vault - €0.04/month)
- Basic monitoring (Application Insights - FREE tier)
- CI/CD pipeline (Azure DevOps)

## Quick Start

1. **Read this first**: [README.md](infrastructure-simple/README.md)
2. **Setup Entra ID**: Run `infrastructure-simple/setup-entra-id.ps1`
3. **Configure parameters**: Update `infrastructure-simple/parameters/dev.bicepparam`
4. **Setup Azure DevOps**: Follow steps in README
5. **Deploy**: Push to `develop` branch

## Documentation Structure

```
infrastructure-simple/
│
├── README.md                    # 👈 START HERE - Complete deployment guide
│   ├── Prerequisites
│   ├── Step-by-step deployment
│   ├── Troubleshooting
│   └── Common issues
│
├── COST-BREAKDOWN.md            # Detailed cost analysis
│   ├── Monthly cost estimates
│   ├── Comparison with alternatives
│   ├── Cost optimization strategies
│   └── Budget alerts setup
│
├── SCALING-GUIDE.md             # Growth & scaling roadmap
│   ├── When to scale
│   ├── Migration to Azure SQL
│   ├── Auto-scaling setup
│   └── Enterprise features
│
├── QUICK-REFERENCE.md           # 📋 Cheat sheet for daily use
│   ├── Essential CLI commands
│   ├── Troubleshooting commands
│   ├── Useful URLs
│   └── Common scenarios
│
├── main.bicep                   # Infrastructure as Code
│   └── Simplified, well-commented Bicep template
│
├── parameters/
│   ├── dev.bicepparam          # Dev environment parameters
│   └── prod.bicepparam         # Prod environment parameters
│
└── setup-entra-id.ps1          # Automated Entra ID setup script
```

## File Overview

### Core Files

| File | Purpose | When to Use |
|------|---------|-------------|
| `infrastructure-simple/main.bicep` | Infrastructure definition | Review to understand what gets created |
| `infrastructure-simple/parameters/dev.bicepparam` | Dev config | Update before first deployment |
| `infrastructure-simple/setup-entra-id.ps1` | Entra ID setup | Run once for each environment |
| `azure-pipelines-simple.yml` | CI/CD pipeline | Reference for pipeline setup |

### Documentation Files

| File | Purpose | Best For |
|------|---------|----------|
| `infrastructure-simple/README.md` | Complete guide | First-time deployment |
| `infrastructure-simple/QUICK-REFERENCE.md` | Command cheat sheet | Daily operations |
| `infrastructure-simple/COST-BREAKDOWN.md` | Cost analysis | Budget planning |
| `infrastructure-simple/SCALING-GUIDE.md` | Growth planning | Future expansion |

## Your Journey

### Phase 1: Initial Setup (You are here)

**Goal**: Deploy your first Azure infrastructure

**Steps**:
1. Read [README.md](infrastructure-simple/README.md)
2. Run Entra ID setup
3. Configure Bicep parameters
4. Setup Azure DevOps
5. Deploy to dev environment

**Time**: 2-4 hours
**Cost**: €13-15/month (dev only)

### Phase 2: Production Launch

**Goal**: Deploy to production environment

**Steps**:
1. Test thoroughly in dev
2. Run Entra ID setup for prod
3. Configure prod parameters
4. Deploy to prod
5. Monitor and optimize

**Time**: 1-2 hours (after dev is stable)
**Cost**: €26-30/month (dev + prod)

### Phase 3: Optimization & Growth

**Goal**: Improve performance and features

**Steps**:
1. Review [SCALING-GUIDE.md](infrastructure-simple/SCALING-GUIDE.md)
2. Implement cost optimizations
3. Add monitoring alerts
4. Plan for growth
5. Scale when metrics indicate need

**Ongoing**: Monitor costs and performance
**Cost**: Grows with usage (€30-100/month)

## Common Tasks

### Deploy to Development
```bash
git checkout develop
git add .
git commit -m "Your changes"
git push origin develop
```

### Deploy to Production
```bash
git checkout main
git merge develop
git push origin main
```

### Check Application Health
```bash
curl https://app-djoppie-dev-api.azurewebsites.net/health
```

### View Logs
```bash
az webapp log tail --name app-djoppie-dev-api --resource-group rg-djoppie-dev
```

### Check Costs
Visit: [Azure Cost Management](https://portal.azure.com/#view/Microsoft_Azure_CostManagement/Menu/~/overview)

## Key Differences from Enterprise Setup

| Feature | Enterprise (`infrastructure/`) | Simplified (`infrastructure-simple/`) |
|---------|-------------------------------|----------------------------------------|
| **Database** | Azure SQL Database | SQLite (bundled) |
| **App Service** | P1v2 (€63/month) | B1 (€12/month) |
| **Static Web App** | Standard | Free |
| **Complexity** | High | Low (learning-focused) |
| **Monthly Cost** | €150-300 | €26-30 |
| **Best For** | Production enterprise | Learning & small teams |

## When to Use Which Setup

### Use Simplified Setup (`infrastructure-simple/`) When:

- Learning Azure DevOps
- Budget under €50/month
- Small team (< 50 users)
- Simple requirements
- First Djoppie app
- Database < 2 GB

### Use Enterprise Setup (`infrastructure/`) When:

- Large organization (> 100 users)
- Budget > €150/month
- Need high availability
- Need geo-replication
- Database > 10 GB
- Strict SLAs required

## Migration Path

```
Simplified → Production → Enterprise

Start with simplified setup
↓
Grow user base & features
↓
Migrate to Azure SQL when needed
↓
Upgrade to S1 App Service
↓
Add enterprise features as required
```

See [SCALING-GUIDE.md](infrastructure-simple/SCALING-GUIDE.md) for detailed migration steps.

## Support & Resources

### Documentation

- [Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/)
- [Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/)
- [Bicep Language](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/)
- [Azure DevOps Pipelines](https://learn.microsoft.com/en-us/azure/devops/pipelines/)

### Quick Links

- **Azure Portal**: https://portal.azure.com
- **Azure DevOps**: https://dev.azure.com
- **Entra ID**: https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade
- **Cost Management**: https://portal.azure.com/#view/Microsoft_Azure_CostManagement/Menu/~/overview

### Troubleshooting

1. Check [README.md - Common Issues](infrastructure-simple/README.md#common-issues--solutions)
2. Review [QUICK-REFERENCE.md - Troubleshooting](infrastructure-simple/QUICK-REFERENCE.md#troubleshooting-commands)
3. Check Application Insights logs in Azure Portal
4. Review Azure DevOps pipeline logs

## Next Steps

### Immediate (First Deployment)

1. [ ] Read [README.md](infrastructure-simple/README.md) completely
2. [ ] Install prerequisites (Azure CLI, PowerShell)
3. [ ] Run `setup-entra-id.ps1` for dev environment
4. [ ] Update Bicep parameter files
5. [ ] Setup Azure DevOps pipeline
6. [ ] Deploy to dev environment
7. [ ] Test the application
8. [ ] Review costs in Azure Portal

### Short Term (First Month)

1. [ ] Set up budget alerts
2. [ ] Configure monitoring dashboards
3. [ ] Test all features in dev
4. [ ] Deploy to production
5. [ ] Document any custom configurations
6. [ ] Share with team

### Long Term (Ongoing)

1. [ ] Monitor costs weekly
2. [ ] Review [SCALING-GUIDE.md](infrastructure-simple/SCALING-GUIDE.md) monthly
3. [ ] Optimize based on usage patterns
4. [ ] Plan for scaling when needed
5. [ ] Keep documentation updated

## FAQ

### Q: Is this production-ready?

**A**: Yes! This setup is production-ready for small to medium workloads (< 100 concurrent users). It includes proper authentication, secure secrets management, and monitoring.

### Q: Can I migrate to the enterprise setup later?

**A**: Absolutely! See [SCALING-GUIDE.md](infrastructure-simple/SCALING-GUIDE.md) for step-by-step migration instructions.

### Q: What if I exceed the free tiers?

**A**: See [COST-BREAKDOWN.md](infrastructure-simple/COST-BREAKDOWN.md) for detailed cost analysis. Typical overage: €2-5/month.

### Q: Can I use this for multiple Djoppie apps?

**A**: Yes! You can run multiple apps on the same App Service Plan. See [COST-BREAKDOWN.md - Strategy 2](infrastructure-simple/COST-BREAKDOWN.md#strategy-2-share-app-service-plan).

### Q: Do I need Azure SQL Database?

**A**: Not initially! SQLite works great for learning and small teams. Migrate to Azure SQL when you exceed 2 GB or need > 5 concurrent connections. See [SCALING-GUIDE.md](infrastructure-simple/SCALING-GUIDE.md#when-to-add-azure-sql-database).

### Q: Can I turn off resources to save money?

**A**: Yes! See [COST-BREAKDOWN.md - Strategy 1](infrastructure-simple/COST-BREAKDOWN.md#strategy-1-turn-off-dev-when-not-using-it).

## Success Checklist

Before you start, make sure you have:

- [ ] Azure subscription with Contributor access
- [ ] Azure CLI installed and configured
- [ ] PowerShell 7+ installed
- [ ] Azure DevOps account and project created
- [ ] Global Administrator role in Entra ID (for app registrations)
- [ ] 2-4 hours set aside for initial setup
- [ ] Budget alert configured for €40/month

## Comparison Table

| Aspect | Simplified Setup | Enterprise Setup |
|--------|-----------------|------------------|
| **Cost** | €26-30/month | €150-300/month |
| **Setup Time** | 2-4 hours | 8-16 hours |
| **Complexity** | Low (beginner-friendly) | High (expert-level) |
| **Documentation** | Tutorial-style | Reference-style |
| **Best For** | Learning, small teams | Production, large orgs |
| **Database** | SQLite | Azure SQL |
| **Scaling** | Manual | Auto-scaling |
| **HA/DR** | None | Full HA + geo-redundancy |
| **Users** | 1-50 | 100-5,000+ |

## Repository Structure

```
Djoppie-Inventory/
│
├── SIMPLIFIED-DEPLOYMENT-INDEX.md        # 👈 YOU ARE HERE
│
├── infrastructure-simple/                # 💰 Budget-friendly setup
│   ├── README.md                        # Complete deployment guide
│   ├── COST-BREAKDOWN.md                # Cost analysis
│   ├── SCALING-GUIDE.md                 # Growth roadmap
│   ├── QUICK-REFERENCE.md               # Command cheat sheet
│   ├── main.bicep                       # Infrastructure definition
│   ├── parameters/
│   │   ├── dev.bicepparam
│   │   └── prod.bicepparam
│   └── setup-entra-id.ps1
│
├── infrastructure/                       # 🏢 Enterprise setup (original)
│   └── (full enterprise Bicep templates)
│
├── azure-pipelines-simple.yml           # Simple CI/CD pipeline
├── azure-pipelines.yml                  # Enterprise CI/CD pipeline
│
└── src/
    ├── frontend/                        # React application
    └── backend/                         # ASP.NET Core API
```

## Getting Help

If you're stuck:

1. **Check the docs** in this order:
   - [README.md](infrastructure-simple/README.md) - Setup guide
   - [QUICK-REFERENCE.md](infrastructure-simple/QUICK-REFERENCE.md) - Commands
   - [COST-BREAKDOWN.md](infrastructure-simple/COST-BREAKDOWN.md) - Cost questions
   - [SCALING-GUIDE.md](infrastructure-simple/SCALING-GUIDE.md) - Scaling questions

2. **Check Azure Portal**:
   - Application Insights for errors
   - Cost Management for budget
   - App Service logs for runtime issues

3. **Check Azure DevOps**:
   - Pipeline logs for deployment issues
   - Variable groups for configuration

4. **Common Solutions**:
   - Most issues are related to Entra ID setup or secrets
   - Check that you granted admin consent
   - Verify Key Vault access for managed identity
   - Ensure parameter files are updated with correct client IDs

## Ready to Deploy?

Great! Head over to [infrastructure-simple/README.md](infrastructure-simple/README.md) and follow the step-by-step guide.

Good luck, and happy deploying! 🚀

---

**Questions?** Contact: jo.wijnen@diepenbeek.be

**Project**: Djoppie Inventory - Asset Management System
**Version**: 1.0.0 (Simplified)
**Last Updated**: 2026-01-17

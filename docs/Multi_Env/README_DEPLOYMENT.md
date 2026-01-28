# Djoppie Inventory - Azure Deployment Documentation

**Complete Azure deployment documentation for the Djoppie Inventory system.**

---

## Quick Start

If you're ready to deploy to Azure, start here:

1. Read **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)** (10 minutes) - Get an overview
2. Follow **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** (3-4 hours) - Step-by-step instructions
3. Review **[AZURE_ARCHITECTURE_DESIGN.md](./AZURE_ARCHITECTURE_DESIGN.md)** - Understand the architecture

---

## Documentation Index

### 1. Backend Analysis

**File:** [BACKEND_ARCHITECTURE_ANALYSIS.md](./BACKEND_ARCHITECTURE_ANALYSIS.md)

**Purpose:** Comprehensive analysis of the existing backend codebase

**Key Sections:**
- Project structure and layer responsibilities
- Data model and entity analysis
- API architecture and authentication
- Database migration strategy
- Monitoring and observability
- Production readiness assessment (7/10)
- Technical debt and recommendations

**Who should read this:** Backend developers, architects, technical leads

**Time to read:** 20-30 minutes

---

### 2. Azure Architecture Design

**File:** [AZURE_ARCHITECTURE_DESIGN.md](./AZURE_ARCHITECTURE_DESIGN.md)

**Purpose:** Complete Azure architecture design for DEV and PROD environments

**Key Sections:**
- High-level architecture diagrams
- Development environment (€6-8.50/month) - ultra-low cost
- Production environment (€140-250/month) - scalable
- Network architecture and security
- Disaster recovery and business continuity
- Monitoring and observability
- Detailed cost analysis and optimization

**Who should read this:** Architects, DevOps engineers, finance/budget planners

**Time to read:** 30-45 minutes

---

### 3. Deployment Guide (CRITICAL)

**File:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

**Purpose:** Step-by-step instructions to deploy the system to Azure

**Key Sections:**
1. Prerequisites (tools, accounts, permissions)
2. Phase 1: Azure Environment Setup (30-45 min)
3. Phase 2: Microsoft Entra ID Configuration (45-60 min)
4. Phase 3: Azure DevOps Setup (30-45 min)
5. Phase 4: Infrastructure Deployment (20-30 min)
6. Phase 5: Database Setup (15-20 min)
7. Phase 6: Application Deployment (15-20 min)
8. Phase 7: Post-Deployment Configuration (15-20 min)
9. Troubleshooting guide
10. Rollback procedures

**Who should read this:** EVERYONE deploying the system (mandatory)

**Time to complete:** 3-4 hours (DEV), 4-5 hours (DEV + PROD)

**Critical for:** First deployment, disaster recovery

---

### 4. Deployment Summary

**File:** [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)

**Purpose:** Executive summary with architecture diagrams and cost breakdowns

**Key Sections:**
- Project overview and technology stack
- ASCII architecture diagrams (DEV, PROD, DR)
- Authentication flow diagram
- CI/CD pipeline flow diagram
- Monthly cost comparison tables
- Detailed cost breakdowns (DEV and PROD)
- Resource inventory
- Security summary
- Monitoring and operations
- Next steps and roadmap

**Who should read this:** Managers, executives, project stakeholders

**Time to read:** 15-20 minutes

---

### 5. Infrastructure as Code (Bicep)

**Location:** `/infrastructure/bicep/`

**Purpose:** Azure infrastructure templates for automated deployment

**Files:**

#### DEV Environment
- `main.dev.bicep` - Main DEV template (subscription scope)
- `main.dev.parameters.json` - Parameter file for DEV deployment

#### PROD Environment
- `main.prod.bicep` - Main PROD template (subscription scope)
- `main.prod.parameters.json` - Parameter file for PROD deployment (to be created)

#### Modules (shared between DEV and PROD)
- `modules/keyvault.bicep` - Azure Key Vault deployment
- `modules/keyvault-accesspolicy.bicep` - Key Vault access policies
- `modules/keyvault-secrets.bicep` - Store secrets in Key Vault
- `modules/loganalytics.bicep` - Log Analytics workspace
- `modules/appinsights.bicep` - Application Insights
- `modules/sqlserver.dev.bicep` - SQL Server for DEV (F1 Free)
- `modules/sqlserver.prod.bicep` - SQL Server for PROD (S1 Standard)
- `modules/appserviceplan.dev.bicep` - App Service Plan for DEV
- `modules/appserviceplan.prod.bicep` - App Service Plan for PROD
- `modules/appservice.dev.bicep` - App Service for DEV
- `modules/appservice.prod.bicep` - App Service for PROD (with slots)
- `modules/redis.bicep` - Redis Cache (optional)
- `modules/autoscale.bicep` - Auto-scaling rules
- `modules/sqlfailovergroup.bicep` - SQL Failover Group for DR

**How to use:**
```bash
# Validate DEV template
az bicep build --file infrastructure/bicep/main.dev.bicep

# Deploy DEV environment
az deployment sub create \
  --location westeurope \
  --template-file infrastructure/bicep/main.dev.bicep \
  --parameters infrastructure/bicep/main.dev.parameters.json

# Deploy PROD environment
az deployment sub create \
  --location westeurope \
  --template-file infrastructure/bicep/main.prod.bicep \
  --parameters infrastructure/bicep/main.prod.parameters.json
```

---

### 6. CI/CD Pipeline

**File:** `azure-pipelines-recommended.yml` (in `/docs`)

**Purpose:** Production-ready Azure DevOps pipeline configuration

**Features:**
- Multi-stage pipeline (Build → Deploy Infra → Deploy DB → Deploy Backend → Deploy Frontend)
- Environment-specific deployments (DEV auto-deploy, PROD manual approval)
- Blue-green deployment with staging slots (PROD only)
- Database migration management
- Comprehensive health checks
- Automatic rollback on failure
- Post-deployment validation

**Current pipeline:** The existing `/azure-pipelines.yml` is a simplified version. The recommended version adds:
- Manual approval gates for production
- Staging slot deployment with swap
- Enhanced health checks and rollback
- Better error handling

**How to use:**
1. Import repository to Azure DevOps
2. Create pipeline from YAML file
3. Configure service connections and variable groups
4. Run pipeline (automatic for develop branch, manual approval for main)

---

## Deployment Paths

### Option 1: Quick Start (Automated)

**Best for:** Experienced Azure users who want fast deployment

1. Ensure prerequisites are met (Azure subscription, Azure CLI, etc.)
2. Create Entra ID app registrations manually
3. Run Bicep deployment: `az deployment sub create ...`
4. Configure Azure DevOps pipeline
5. Push code to trigger deployment

**Time:** 2-3 hours

---

### Option 2: Guided Deployment (Recommended)

**Best for:** First-time deployers or those who want detailed guidance

1. Read [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) completely (30 min)
2. Gather prerequisites and verify access (30 min)
3. Follow Phase 1-7 step-by-step (3-4 hours)
4. Validate deployment with checklists
5. Review post-deployment configuration

**Time:** 4-5 hours (includes validation and testing)

---

### Option 3: Manual Review First

**Best for:** Architects reviewing before implementation

1. Read [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) (15 min)
2. Review [AZURE_ARCHITECTURE_DESIGN.md](./AZURE_ARCHITECTURE_DESIGN.md) (30 min)
3. Analyze [BACKEND_ARCHITECTURE_ANALYSIS.md](./BACKEND_ARCHITECTURE_ANALYSIS.md) (20 min)
4. Review Bicep templates in `/infrastructure/bicep/` (30 min)
5. Make architecture decisions (cost vs features, DR requirements, etc.)
6. Proceed with Option 2 (Guided Deployment)

**Time:** 1-2 hours (review only)

---

## Cost Summary

### Development Environment
- **Target Cost:** €6-8.50/month
- **Resources:** F1 Free App Service, Serverless SQL (auto-pause), Free Static Web App
- **Best for:** Development, testing, CI/CD validation
- **Deployment time:** 30-45 minutes

### Production Environment
| Configuration | Monthly Cost | Best For |
|---------------|-------------|----------|
| Base | €140-160 | 100-500 users, 10-50k requests/day |
| Recommended | €155-175 | Base + Redis caching |
| High Availability | €190-210 | Recommended + SQL geo-replication |
| Full Featured | €210-250 | HA + Redis Standard + Entra P1 MFA |

**Deployment time:** 45-60 minutes (after DEV is validated)

---

## Support and Resources

### Getting Help

**Deployment Issues:**
- Check [Troubleshooting section](./DEPLOYMENT_GUIDE.md#9-troubleshooting) in Deployment Guide
- Review Azure Portal for deployment errors
- Check Application Insights for runtime errors

**Architecture Questions:**
- Review [Architecture Design](./AZURE_ARCHITECTURE_DESIGN.md)
- Check [Backend Analysis](./BACKEND_ARCHITECTURE_ANALYSIS.md) for code details

**Contact:**
- Technical Contact: jo.wijnen@diepenbeek.be
- Project Repository: https://github.com/Djoppie/Djoppie-Inventory

### External Documentation

**Azure Services:**
- [Azure App Service](https://docs.microsoft.com/azure/app-service/)
- [Azure SQL Database](https://docs.microsoft.com/azure/azure-sql/)
- [Azure Static Web Apps](https://docs.microsoft.com/azure/static-web-apps/)
- [Azure Bicep](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)

**Microsoft Entra ID:**
- [App Registrations](https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app)
- [OAuth 2.0 in Entra ID](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow)

**Azure DevOps:**
- [Pipelines Documentation](https://docs.microsoft.com/azure/devops/pipelines/)
- [YAML Pipeline Reference](https://docs.microsoft.com/azure/devops/pipelines/yaml-schema/)

---

## Checklist: Before You Start

- [ ] Azure subscription with Contributor/Owner access
- [ ] Microsoft Entra ID Application Administrator role
- [ ] Azure DevOps organization and project created
- [ ] Azure CLI installed and authenticated
- [ ] .NET SDK 8.0 installed
- [ ] Node.js 18.x installed
- [ ] Git installed and repository cloned
- [ ] Budget approved (€6-10/month for DEV, €140-250/month for PROD)
- [ ] Read DEPLOYMENT_SUMMARY.md
- [ ] Read DEPLOYMENT_GUIDE.md (at least Prerequisites and Phase 1)

---

## Quick Reference Commands

### Deploy DEV Environment
```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "{subscription-id}"

# Deploy infrastructure
az deployment sub create \
  --location westeurope \
  --template-file infrastructure/bicep/main.dev.bicep \
  --parameters @infrastructure/bicep/main.dev.parameters.json
```

### Deploy PROD Environment
```bash
# Deploy infrastructure
az deployment sub create \
  --location westeurope \
  --template-file infrastructure/bicep/main.prod.bicep \
  --parameters @infrastructure/bicep/main.prod.parameters.json
```

### Check Deployment Status
```bash
# List deployments
az deployment sub list --query "[?name contains(@, 'djoppie')].{Name:name, State:properties.provisioningState, Timestamp:properties.timestamp}" -o table

# Get deployment outputs
az deployment sub show --name {deployment-name} --query properties.outputs
```

### Validate Resources
```bash
# List all resources in DEV
az resource list --resource-group rg-djoppie-dev-westeu -o table

# Check App Service status
az webapp show --name {app-service-name} --resource-group {resource-group} --query "{Name:name, State:state, URL:defaultHostName}" -o table

# Test API health
curl https://{app-service-name}.azurewebsites.net/health
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-27 | Initial documentation release | Claude Code |
| | | - Backend architecture analysis | |
| | | - Azure architecture design (DEV + PROD) | |
| | | - Complete Bicep templates | |
| | | - Step-by-step deployment guide | |
| | | - CI/CD pipeline configuration | |

---

## License and Attribution

This documentation is part of the Djoppie Inventory project.

**Created with:** Claude Code (Anthropic)
**Target Platform:** Microsoft Azure
**Technology Stack:** ASP.NET Core 8.0, React 19, Azure SQL Database

---

**Ready to deploy? Start with [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**

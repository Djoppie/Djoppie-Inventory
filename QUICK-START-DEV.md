# Djoppie Inventory - DEV Environment Quick Start

Get up and running with Djoppie Inventory DEV environment in minutes!

## Choose Your Deployment Method

### Option 1: One-Command PowerShell Deploy (5 minutes)

**Best for:** Quick local deployment, testing, one-time setup

```powershell
# Clone and deploy
git clone https://github.com/Djoppie/Djoppie-Inventory.git
cd Djoppie-Inventory
.\deploy-dev.ps1
```

That's it! The script will:
- ✓ Check prerequisites
- ✓ Create Entra ID apps
- ✓ Deploy infrastructure
- ✓ Configure secrets
- ✓ Display all URLs and credentials

**[Full Documentation →](DEPLOYMENT-GUIDE-DEV.md#option-1-automated-powershell-script-recommended)**

---

### Option 2: Azure DevOps CI/CD Pipeline (30 minutes setup)

**Best for:** Continuous deployment, team collaboration, production-ready

```bash
# 1. Create Azure DevOps project and import repository
# 2. Create service connection
# 3. Create variable group with secrets
# 4. Create and run pipeline
```

**[Full Documentation →](AZURE-DEVOPS-SETUP.md)**

---

## What You'll Get

After deployment, you'll have:

| Component | URL Format | Example |
|-----------|------------|---------|
| **Backend API** | `https://app-djoppie-dev-api-*.azurewebsites.net` | Swagger + REST API |
| **Frontend App** | `https://swa-djoppie-dev-ui-*.azurestaticapps.net` | React SPA |
| **SQL Database** | `sql-djoppie-dev-*.database.windows.net` | Serverless DB |
| **Key Vault** | `kv-djoppie-dev-*` | Secrets storage |

**Monthly Cost:** €6-10 (most services use free tiers!)

---

## After Deployment

### 1. Update Frontend Environment

The deployment script outputs everything you need. Create `src/frontend/.env.local`:

```bash
VITE_API_URL=https://app-djoppie-dev-api-xxxxxx.azurewebsites.net
VITE_ENTRA_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_ENTRA_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_ENVIRONMENT=dev
```

### 2. Test the Deployment

```bash
# Test backend
curl https://app-djoppie-dev-api-xxxxxx.azurewebsites.net/health

# Test frontend (open in browser)
open https://swa-djoppie-dev-ui-xxxxxx.azurestaticapps.net
```

### 3. Deploy Application Code

#### Backend:
```bash
cd src/backend
dotnet publish -c Release -o ./publish
cd publish && zip -r ../backend.zip . && cd ..
az webapp deploy --resource-group rg-djoppie-inv-dev --name <app-name> --src-path backend.zip
```

#### Frontend:
```bash
cd src/frontend
npm ci
npm run build
# Use Azure Static Web Apps CLI or pipeline
```

---

## Common Commands

### View Resources
```bash
az resource list --resource-group rg-djoppie-inv-dev --output table
```

### View Logs
```bash
az webapp log tail --resource-group rg-djoppie-inv-dev --name <app-name>
```

### Delete Environment (Save Costs)
```bash
az group delete --name rg-djoppie-inv-dev --yes --no-wait
```

### Redeploy Infrastructure
```powershell
.\deploy-dev.ps1
```

---

## Troubleshooting

### Backend Not Starting?
```bash
# Check logs
az webapp log tail --resource-group rg-djoppie-inv-dev --name <app-name>

# Restart app
az webapp restart --resource-group rg-djoppie-inv-dev --name <app-name>
```

### Database Connection Issues?
```bash
# Check firewall rules
az sql server firewall-rule list --resource-group rg-djoppie-inv-dev --server <server-name>

# Add your IP
az sql server firewall-rule create --resource-group rg-djoppie-inv-dev --server <server-name> --name MyIP --start-ip-address <your-ip> --end-ip-address <your-ip>
```

### Frontend Not Loading?
- Check browser console (F12) for errors
- Verify API URL in environment variables
- Check CORS settings on backend

**[Full Troubleshooting Guide →](DEPLOYMENT-GUIDE-DEV.md#troubleshooting)**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       Azure DEV Environment                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Internet                                                         │
│      │                                                            │
│      ├──────────► Static Web App (React SPA) ◄──┐               │
│      │            └─ Free Tier                   │               │
│      │                                            │               │
│      └──────────► App Service (ASP.NET API)      │               │
│                   ├─ F1 Free Tier                │               │
│                   ├─ Managed Identity            │               │
│                   └─────┬─────────────────┬──────┘               │
│                         │                 │                       │
│                         ▼                 ▼                       │
│                   SQL Database      Key Vault                    │
│                   ├─ Serverless     └─ Secrets                   │
│                   └─ Auto-pause                                   │
│                                                                   │
│  Monitoring                                                       │
│      │                                                            │
│      └──────────► Application Insights + Log Analytics          │
│                   └─ Pay-as-you-go                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cost Breakdown

| Service | Cost |
|---------|------|
| App Service Plan (F1) | €0 (Free) |
| Static Web App | €0 (Free) |
| SQL Database (Serverless) | €5-8/month |
| Key Vault | €0.50/month |
| Monitoring | €1/month |
| **Total** | **€6-10/month** |

---

## Next Steps

1. ✓ Deploy infrastructure (done!)
2. Deploy application code
3. Configure Entra ID authentication
4. Set up monitoring alerts
5. Review security settings
6. Test end-to-end functionality

**[Complete Deployment Guide →](DEPLOYMENT-GUIDE-DEV.md)**

---

## Support & Documentation

- **Deployment Guide:** [DEPLOYMENT-GUIDE-DEV.md](DEPLOYMENT-GUIDE-DEV.md)
- **Azure DevOps Setup:** [AZURE-DEVOPS-SETUP.md](AZURE-DEVOPS-SETUP.md)
- **Project README:** [README.md](README.md)
- **Email Support:** jo.wijnen@diepenbeek.be
- **GitHub Issues:** https://github.com/Djoppie/Djoppie-Inventory/issues

---

**Ready to deploy? Choose your method above and get started!** 🚀

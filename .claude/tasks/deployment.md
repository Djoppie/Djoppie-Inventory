# Deployment Task

Template for deploying to Azure.

## Prerequisites

- Azure CLI installed and logged in: `az login`
- Access to Azure resources

## Frontend Deployment

```bash
cd src/frontend

# Build
npm run build

# Deploy to Static Web App
npx @azure/static-web-apps-cli deploy ./dist \
  --deployment-token "$(az staticwebapp secrets list --name swa-djoppie-inventory-dev --query 'properties.apiKey' -o tsv)" \
  --env production
```

## Backend Deployment

```bash
cd src/backend/DjoppieInventory.API

# Build
dotnet publish -c Release -o ./publish

# Create zip
powershell -Command "Compress-Archive -Path './publish/*' -DestinationPath './deploy.zip' -Force"

# Deploy
az webapp deployment source config-zip \
  --resource-group rg-djoppie-inventory-dev \
  --name app-djoppie-inventory-dev-api-k5xdqp \
  --src deploy.zip
```

## Database Migration

```bash
# Generate SQL script
dotnet ef migrations script \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API \
  --output migration.sql

# Apply via Azure CLI or SSMS
```

## Verification

- [ ] Frontend loads: https://blue-cliff-031d65b03.1.azurestaticapps.net
- [ ] Backend responds: https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net/api/assets
- [ ] Authentication works
- [ ] Key features functional

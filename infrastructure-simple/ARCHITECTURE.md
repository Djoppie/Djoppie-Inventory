# Djoppie Inventory - Simplified Architecture

This document explains the architecture of your simplified Azure deployment in visual and easy-to-understand terms.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AZURE SUBSCRIPTION                           │
│                                                                       │
│  ┌──────────────────┐                  ┌──────────────────┐         │
│  │  DEVELOPMENT     │                  │   PRODUCTION     │         │
│  │  ENVIRONMENT     │                  │   ENVIRONMENT    │         │
│  │  (€13-15/month)  │                  │  (€13-15/month)  │         │
│  │                  │                  │                  │         │
│  │  rg-djoppie-dev  │                  │  rg-djoppie-prod │         │
│  └──────────────────┘                  └──────────────────┘         │
│                                                                       │
│  Each environment contains the same resources (see below)            │
└───────────────────────────────────────────────────────────────────────┘
```

## Single Environment Architecture

```
┌───────────────────────────────────────────────────────────────────────────┐
│                     RESOURCE GROUP (e.g., rg-djoppie-dev)                 │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                          FRONTEND (React)                           │  │
│  │  ┌───────────────────────────────────────────────────────────────┐  │  │
│  │  │  Static Web App (FREE)                                        │  │  │
│  │  │  swa-djoppie-{env}-web                                        │  │  │
│  │  │                                                               │  │  │
│  │  │  • Hosts React application                                    │  │  │
│  │  │  • 100 GB bandwidth/month                                     │  │  │
│  │  │  • Custom domains + SSL                                       │  │  │
│  │  │  • No cost!                                                   │  │  │
│  │  └───────────────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                       │
│                                    │ HTTPS                                 │
│                                    ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                       BACKEND API (.NET 8)                          │  │
│  │  ┌───────────────────────────────────────────────────────────────┐  │  │
│  │  │  App Service (B1 - €11.79/month)                              │  │  │
│  │  │  app-djoppie-{env}-api                                        │  │  │
│  │  │                                                               │  │  │
│  │  │  • ASP.NET Core 8.0 API                                       │  │  │
│  │  │  • 1 vCPU, 1.75 GB RAM                                        │  │  │
│  │  │  • SQLite database (bundled)                                  │  │  │
│  │  │  • System-assigned managed identity                           │  │  │
│  │  │  • Always-on: false (to save resources)                       │  │  │
│  │  └───────────────────────────────────────────────────────────────┘  │  │
│  │                             │                                       │  │
│  │                             │ Managed Identity                      │  │
│  │                             ▼                                       │  │
│  │  ┌───────────────────────────────────────────────────────────────┐  │  │
│  │  │  App Service Plan (B1 - shared)                               │  │  │
│  │  │  asp-djoppie-{env}                                            │  │  │
│  │  │                                                               │  │  │
│  │  │  • Linux-based                                                │  │  │
│  │  │  • Can host multiple apps                                     │  │  │
│  │  └───────────────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                       │
│                                    │ RBAC: Key Vault Secrets User          │
│                                    ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      SECRETS & CONFIGURATION                        │  │
│  │  ┌───────────────────────────────────────────────────────────────┐  │  │
│  │  │  Key Vault (Standard - €0.04/month)                           │  │  │
│  │  │  kv-djoppie{env}                                              │  │  │
│  │  │                                                               │  │  │
│  │  │  Secrets stored:                                              │  │  │
│  │  │  • EntraBackendClientId                                       │  │  │
│  │  │  • EntraBackendClientSecret                                   │  │  │
│  │  │  • EntraFrontendClientId                                      │  │  │
│  │  │  • EntraTenantId                                              │  │  │
│  │  └───────────────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    MONITORING & LOGGING                             │  │
│  │  ┌───────────────────────────────────────────────────────────────┐  │  │
│  │  │  Application Insights (Free - 5GB/month)                      │  │  │
│  │  │  appi-djoppie-{env}                                           │  │  │
│  │  │                                                               │  │  │
│  │  │  • Request tracking                                           │  │  │
│  │  │  • Exception logging                                          │  │  │
│  │  │  • Performance metrics                                        │  │  │
│  │  │  • Custom events                                              │  │  │
│  │  └───────────────────────────────────────────────────────────────┘  │  │
│  │                             │                                       │  │
│  │                             ▼                                       │  │
│  │  ┌───────────────────────────────────────────────────────────────┐  │  │
│  │  │  Log Analytics Workspace (Free - 5GB/month)                   │  │  │
│  │  │  log-djoppie-{env}                                            │  │  │
│  │  │                                                               │  │  │
│  │  │  • Centralized logging                                        │  │  │
│  │  │  • 30-day retention                                           │  │  │
│  │  │  • Query interface                                            │  │  │
│  │  └───────────────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│                    MICROSOFT ENTRA ID (Azure AD)                          │
│                              (FREE)                                       │
│  ┌─────────────────────────────────────┐  ┌──────────────────────────┐   │
│  │  Backend API App Registration       │  │  Frontend SPA App Reg    │   │
│  │  Djoppie-Inventory-API-{env}        │  │  Djoppie-Inventory-Web   │   │
│  │                                     │  │                          │   │
│  │  • Exposes API scope                │  │  • Calls backend API     │   │
│  │  • Client ID + Secret               │  │  • Client ID only        │   │
│  │  • Audience: api://{client-id}      │  │  • Redirect URIs         │   │
│  └─────────────────────────────────────┘  └──────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────┘
```

## User Authentication Flow

```
┌──────────┐
│  User    │
│  Browser │
└────┬─────┘
     │
     │ 1. Visit app
     ▼
┌─────────────────────┐
│  Static Web App     │
│  (React Frontend)   │
└────┬────────────────┘
     │
     │ 2. Redirect to login
     ▼
┌─────────────────────────┐
│  Microsoft Entra ID     │
│  (Login Page)           │
└────┬────────────────────┘
     │
     │ 3. User authenticates
     │    with Diepenbeek credentials
     ▼
┌─────────────────────────┐
│  Entra ID               │
│  (Issues tokens)        │
└────┬────────────────────┘
     │
     │ 4. Returns access token
     │    + ID token
     ▼
┌─────────────────────┐
│  React Frontend     │
│  (Stores tokens)    │
└────┬────────────────┘
     │
     │ 5. API calls with
     │    Bearer token
     ▼
┌─────────────────────┐
│  ASP.NET Core API   │
│  (Validates token)  │
└────┬────────────────┘
     │
     │ 6. Returns data
     ▼
┌──────────┐
│  User    │
│  Sees    │
│  Assets  │
└──────────┘
```

## Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        USER REQUEST                               │
└───────────────────────────────┬──────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Static Web App       │
                    │  (React)              │
                    └───────────┬───────────┘
                                │
                                │ HTTPS Request
                                │ Authorization: Bearer {token}
                                ▼
                    ┌───────────────────────┐
                    │  App Service          │
                    │  (ASP.NET Core)       │
                    └───────────┬───────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Validate     │  │ Query        │  │ Log to       │
    │ JWT Token    │  │ SQLite DB    │  │ App Insights │
    │              │  │              │  │              │
    │ (Entra ID)   │  │ (Local file) │  │ (Monitoring) │
    └──────────────┘  └──────────────┘  └──────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Return JSON          │
                    │  Response             │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  React renders        │
                    │  data to user         │
                    └───────────────────────┘
```

## CI/CD Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DEVELOPER WORKFLOW                           │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                │ git push origin develop (or main)
                                ▼
                    ┌───────────────────────┐
                    │  Azure DevOps         │
                    │  (Triggered)          │
                    └───────────┬───────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ▼                               ▼
    ┌───────────────────────┐       ┌───────────────────────┐
    │  BUILD STAGE          │       │  DEPLOY INFRA STAGE   │
    │                       │       │                       │
    │  • Install Node.js    │       │  • Validate Bicep     │
    │  • npm ci             │       │  • Create RG          │
    │  • npm run build      │       │  • Deploy Bicep       │
    │  • Install .NET       │       │  • Save outputs       │
    │  • dotnet restore     │       │                       │
    │  • dotnet build       │       │  Resources created:   │
    │  • dotnet publish     │       │  • App Service Plan   │
    │  • Save artifacts     │       │  • App Service        │
    └───────────┬───────────┘       │  • Static Web App     │
                │                   │  • Key Vault          │
                │                   │  • App Insights       │
                │                   │  • Log Analytics      │
                │                   └───────────┬───────────┘
                │                               │
                └───────────────┬───────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  DEPLOY APPS STAGE    │
                    │                       │
                    │  Backend Deployment:  │
                    │  • Download artifacts │
                    │  • Deploy to App      │
                    │    Service            │
                    │  • Health check       │
                    │                       │
                    │  Frontend Deployment: │
                    │  • Download artifacts │
                    │  • Get SWA token      │
                    │  • Deploy to Static   │
                    │    Web App            │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  SMOKE TESTS STAGE    │
                    │                       │
                    │  • Test /health       │
                    │  • Test /swagger      │
                    │  • Test frontend URL  │
                    │  • Report results     │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  DEPLOYMENT COMPLETE  │
                    │  ✅ All tests passed  │
                    └───────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SECURITY LAYERS                              │
│                                                                       │
│  1. TRANSPORT SECURITY                                               │
│     • All traffic over HTTPS (TLS 1.2+)                              │
│     • SSL certificates (managed by Azure)                            │
│     • No plain HTTP allowed                                          │
│                                                                       │
│  2. AUTHENTICATION                                                   │
│     • Microsoft Entra ID (Azure AD)                                  │
│     • OAuth 2.0 / OpenID Connect                                     │
│     • JWT tokens                                                     │
│     • Single sign-on with Diepenbeek tenant                          │
│                                                                       │
│  3. AUTHORIZATION                                                    │
│     • Token validation on every request                              │
│     • Scopes: api://djoppie-inventory/user_impersonation             │
│     • Role-based access (can be added)                               │
│                                                                       │
│  4. SECRETS MANAGEMENT                                               │
│     • No secrets in code or config files                             │
│     • All secrets in Key Vault                                       │
│     • Managed identity for Key Vault access                          │
│     • RBAC: "Key Vault Secrets User" role                            │
│                                                                       │
│  5. NETWORK SECURITY                                                 │
│     • App Service: Public endpoint (HTTPS only)                      │
│     • Key Vault: Public endpoint (RBAC protected)                    │
│     • CORS: Limited to frontend domain                               │
│                                                                       │
│  6. DATA SECURITY                                                    │
│     • SQLite database file permissions                               │
│     • Data at rest: App Service storage encrypted                    │
│     • Data in transit: HTTPS                                         │
│                                                                       │
│  7. MONITORING & AUDITING                                            │
│     • Application Insights logs all requests                         │
│     • Exception tracking                                             │
│     • Performance monitoring                                         │
│     • Azure Activity Log for resource changes                        │
└───────────────────────────────────────────────────────────────────────┘
```

## Resource Dependencies

```
┌──────────────────────────┐
│  Log Analytics           │
│  (Created first)         │
└────────────┬─────────────┘
             │
             │ Required by
             ▼
┌──────────────────────────┐
│  Application Insights    │
│  (Depends on Log         │
│   Analytics)             │
└────────────┬─────────────┘
             │
             ├─────────────────────────┐
             │                         │
             ▼                         ▼
┌──────────────────────────┐  ┌──────────────────────┐
│  App Service Plan        │  │  Key Vault           │
│  (Independent)           │  │  (Independent)       │
└────────────┬─────────────┘  └──────────┬───────────┘
             │                           │
             │                           │ Grants access to
             ▼                           │
┌──────────────────────────┐            │
│  App Service             │◄───────────┘
│  (Depends on plan)       │
│  (Has managed identity)  │
└──────────────────────────┘

┌──────────────────────────┐
│  Static Web App          │
│  (Independent)           │
└──────────────────────────┘
```

## Deployment Sequence

When you deploy, resources are created in this order:

1. **Resource Group** - Container for everything
2. **Log Analytics Workspace** - Needed by App Insights
3. **Application Insights** - Monitoring service
4. **Key Vault** - Secrets storage
5. **Key Vault Secrets** - Store Entra ID values
6. **App Service Plan** - Compute capacity
7. **App Service** - Backend API (creates managed identity)
8. **Role Assignment** - Grant App Service access to Key Vault
9. **Static Web App** - Frontend application
10. **Static Web App Config** - Environment variables

## Scaling Architecture

### Current (Simplified)

```
┌─────────────────────────────────┐
│  Single Instance                │
│  B1 App Service                 │
│  • 1 vCPU                       │
│  • 1.75 GB RAM                  │
│  • Handles ~50 concurrent users │
└─────────────────────────────────┘
```

### Phase 2 (Production - €100/month)

```
┌─────────────────────────────────┐
│  S1 App Service                 │
│  • Auto-scale 1-5 instances     │
│  • 2 vCPU per instance          │
│  • 3.5 GB RAM per instance      │
│  • Handles ~200 concurrent      │
└─────────────────────────────────┘
        │
        ├─────────────────┐
        ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Azure SQL    │  │ Deployment   │
│ Basic        │  │ Slots        │
│ 5 DTUs       │  │ (Blue-Green) │
└──────────────┘  └──────────────┘
```

### Phase 3 (Enterprise - €300/month)

```
         ┌─────────────────────────┐
         │  Azure Front Door       │
         │  (CDN + WAF)            │
         └──────────┬──────────────┘
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
┌─────────────────┐   ┌─────────────────┐
│ West Europe     │   │ North Europe    │
│ P2v3 App Service│   │ P2v3 App Service│
│ (2-10 instances)│   │ (2-10 instances)│
└────────┬────────┘   └────────┬────────┘
         │                     │
         └──────────┬──────────┘
                    ▼
         ┌─────────────────────┐
         │  Azure SQL S3       │
         │  + Geo-Replica      │
         │  100 DTUs           │
         └─────────────────────┘
```

## Cost Architecture

```
Total: €26-30/month (both environments)
│
├─ Development Environment (€13-15/month)
│  ├─ App Service Plan B1: €11.79/month ─────────────────── 90%
│  ├─ Static Web App: €0/month ──────────────────────────── 0%
│  ├─ Key Vault: €0.04/month ────────────────────────────── <1%
│  ├─ App Insights: €0-2/month ──────────────────────────── 0-15%
│  └─ Log Analytics: €0-2/month ─────────────────────────── 0-15%
│
└─ Production Environment (€13-15/month)
   ├─ App Service Plan B1: €11.79/month ────────────────── 90%
   ├─ Static Web App: €0/month ─────────────────────────── 0%
   ├─ Key Vault: €0.04/month ───────────────────────────── <1%
   ├─ App Insights: €0-2/month ─────────────────────────── 0-15%
   └─ Log Analytics: €0-2/month ────────────────────────── 0-15%

Main cost driver: App Service Plan (€11.79/month per environment)
Savings opportunity: Share plan across multiple apps
```

## Network Architecture

```
Internet
   │
   │ HTTPS (443)
   │
   ├──────────────────┬────────────────────┐
   │                  │                    │
   ▼                  ▼                    ▼
┌─────────┐    ┌───────────┐    ┌──────────────────┐
│  Users  │    │ Entra ID  │    │  Developers      │
│ (Browse)│    │ (Login)   │    │  (Azure Portal)  │
└─────────┘    └───────────┘    └──────────────────┘
   │                  │                    │
   │                  │                    │
   ▼                  ▼                    ▼
┌────────────────────────────────────────────────┐
│         Azure Public Endpoints                 │
│  • Static Web App (frontend)                   │
│  • App Service (backend)                       │
│  • Key Vault (secrets)                         │
│  • Application Insights (monitoring)           │
└────────────────────────────────────────────────┘

Note: All traffic encrypted with HTTPS
      No private networks (to save cost)
      RBAC provides access control
```

## Summary

This architecture provides:

- ✅ **Simplicity**: Easy to understand and maintain
- ✅ **Security**: Entra ID auth + Key Vault + HTTPS
- ✅ **Cost-Effective**: €26-30/month for both environments
- ✅ **Scalable**: Clear path to upgrade when needed
- ✅ **Production-Ready**: Monitoring, logging, CI/CD
- ✅ **Learning-Friendly**: Well-documented, beginner-friendly

Perfect for learning Azure DevOps while running a real production application!

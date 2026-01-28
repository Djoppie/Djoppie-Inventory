# Djoppie Inventory - Deployment Summary

**Date:** January 27, 2026
**Version:** 1.0
**Project:** Djoppie Inventory System
**Contact:** jo.wijnen@diepenbeek.be

---

## Executive Summary

This document provides a comprehensive summary of the Djoppie Inventory Azure deployment architecture, including infrastructure diagrams, cost breakdowns, and deployment strategy. This system is designed for ultra-low cost development (€6-8.50/month) and scalable production deployment (€140-250/month).

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Diagrams](#2-architecture-diagrams)
3. [Cost Analysis](#3-cost-analysis)
4. [Deployment Strategy](#4-deployment-strategy)
5. [Resource Inventory](#5-resource-inventory)
6. [Security Summary](#6-security-summary)
7. [Monitoring and Operations](#7-monitoring-and-operations)
8. [Next Steps](#8-next-steps)

---

## 1. Project Overview

### 1.1 System Description

**Djoppie Inventory** is an asset and inventory management system designed for IT support and inventory managers. The system provides:

- QR code scanning for instant asset lookup
- Intune-enhanced hardware inventory management
- Real-time inventory checks and updates
- Asset data management (owner, location, status, installation dates)
- Digital QR code generation
- Service request creation and tracking

### 1.2 Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Frontend** | React + TypeScript | 19.x |
| **Build Tool** | Vite | 7.x |
| **Backend** | ASP.NET Core Web API | 8.0 |
| **Language** | C# | 12 |
| **Database** | Azure SQL Database (Serverless) | SQL Server 2022 |
| **ORM** | Entity Framework Core | 8.0 |
| **Authentication** | Microsoft Entra ID | OAuth 2.0 / OIDC |
| **Integration** | Microsoft Graph API | Latest |
| **Hosting - Frontend** | Azure Static Web Apps | Standard/Free |
| **Hosting - Backend** | Azure App Service | F1 Free / S1 Standard |
| **Monitoring** | Azure Application Insights | Latest |
| **IaC** | Azure Bicep | Latest |
| **CI/CD** | Azure DevOps Pipelines | Latest |

### 1.3 Key Features

- **Cloud-Native Architecture**: Built for Azure with auto-scaling and high availability
- **Ultra-Low Cost DEV**: Development environment costs only €6-8.50/month
- **Production-Ready**: Scalable architecture supporting 100-2000 users
- **Security-First**: Entra ID integration, Key Vault secrets, HTTPS enforcement
- **DevOps-Ready**: Automated CI/CD with Azure DevOps
- **Monitoring**: Comprehensive telemetry with Application Insights

---

## 2. Architecture Diagrams

### 2.1 High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USERS (Internet)                                │
│              IT Support Staff, Inventory Managers (Diepenbeek)          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                    HTTPS (Port 443) - Encrypted
                                 │
            ┌────────────────────┴───────────────────┐
            │                                        │
            ▼                                        ▼
┌─────────────────────────────┐        ┌────────────────────────────────┐
│   Azure Static Web Apps     │        │   Azure App Service (API)     │
│   (Frontend Hosting)        │◄──────►│   (Backend API)                │
│                             │  API   │                                │
│   - React 19 SPA            │  Calls │   - ASP.NET Core 8.0           │
│   - Vite Build              │        │   - REST API                   │
│   - Global CDN              │        │   - Swagger/OpenAPI            │
│   - Free SSL                │        │   - Managed Identity           │
│   Cost: €0-8.50/mo          │        │   Cost: €0-70/mo               │
└──────────────┬──────────────┘        └──────────┬─────────────────────┘
               │                                   │
               │  OAuth 2.0                        │
               │  Login Flow                       │
               │                                   │
               ▼                      ┌────────────┼──────────────────┐
    ┌──────────────────────┐          │            │                  │
    │ Microsoft Entra ID   │          │            ▼                  ▼
    │ (Azure AD)           │          │   ┌─────────────────┐  ┌──────────────┐
    │                      │          │   │ Azure Key Vault │  │ App Insights │
    │ - SSO Authentication │          │   │                 │  │              │
    │ - User Management    │          │   │ - Secrets       │  │ - Telemetry  │
    │ - App Registrations  │          │   │ - Certificates  │  │ - Logs       │
    │ - Conditional Access │          │   │ Cost: €0.50-2/mo│  │ - Metrics    │
    │ Cost: €0-28/mo       │          │   └─────────────────┘  └──────────────┘
    └──────────────────────┘          │
                                      │
               ┌──────────────────────┼────────────────────────┐
               │                      │                        │
               ▼                      ▼                        ▼
    ┌─────────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │ Azure SQL Database  │  │ Microsoft Graph  │  │ Redis Cache      │
    │ (Serverless)        │  │ API              │  │ (Optional)       │
    │                     │  │                  │  │                  │
    │ - GP_S_Gen5_1/2     │  │ - Intune Devices │  │ - Basic/Standard │
    │ - Auto-pause 1hr    │  │ - Device Mgmt    │  │ - Caching Layer  │
    │ - Point-in-time     │  │ Cost: Included   │  │ Cost: €15-60/mo  │
    │   restore           │  └──────────────────┘  └──────────────────┘
    │ Cost: €5-45/mo      │
    └─────────────────────┘
```

### 2.2 DEV Environment Architecture (€6-8.50/month)

```
┌────────────────────────────────────────────────────────────────────┐
│                        DEV ENVIRONMENT                              │
│                   Ultra-Low Cost: €6-8.50/mo                        │
│                   Region: West Europe (Amsterdam)                   │
└────────────────────────────────────────────────────────────────────┘

                     ┌────────────────────┐
                     │  Developers &      │
                     │  Test Users        │
                     └─────────┬──────────┘
                               │
              ┌────────────────┴───────────────────┐
              │                                    │
              ▼                                    ▼
┌──────────────────────────┐         ┌──────────────────────────┐
│ Static Web App (Free)    │         │ App Service (F1 Free)    │
│ - 100 GB bandwidth       │◄───────►│ - 60 min/day compute     │
│ - Custom domain          │   API   │ - 1 GB RAM               │
│ - Auto-deploy from Git   │         │ - Always On: OFF         │
│ €0/month                 │         │ €0/month                 │
└──────────────────────────┘         └────────┬─────────────────┘
                                              │
                                              │
                     ┌────────────────────────┼──────────────────┐
                     │                        │                  │
                     ▼                        ▼                  ▼
          ┌───────────────────┐    ┌──────────────────┐  ┌──────────────┐
          │ SQL Serverless    │    │ Key Vault        │  │ App Insights │
          │ GP_S_Gen5_1       │    │ Standard         │  │ Pay-as-you-go│
          │ - 0.5 vCore       │    │ - Soft delete    │  │ - 5GB free   │
          │ - Auto-pause 1hr  │    │ - Operations-    │  │ - Sampling   │
          │ - 7-day backup    │    │   based pricing  │  │   enabled    │
          │ €5.50-8/month     │    │ €0.50/month      │  │ €0/month     │
          └───────────────────┘    └──────────────────┘  └──────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ Cost Breakdown (Monthly):                                          │
│ - Static Web App (Free):           €0.00                           │
│ - App Service Plan (F1 Free):      €0.00                           │
│ - SQL Database (Serverless):       €5.50 - €8.00                   │
│ - Key Vault (Standard):            €0.50                           │
│ - Application Insights (Free):     €0.00                           │
│ - Entra ID (Free):                 €0.00                           │
│ ──────────────────────────────────────────────────────────────     │
│ TOTAL:                             €6.00 - €8.50                   │
└────────────────────────────────────────────────────────────────────┘
```

### 2.3 PROD Environment Architecture (€140-250/month)

```
┌────────────────────────────────────────────────────────────────────┐
│                       PROD ENVIRONMENT                              │
│                  Production-Grade: €140-250/mo                      │
│                  Region: West Europe (Primary)                      │
│                  DR Region: North Europe (Optional)                 │
└────────────────────────────────────────────────────────────────────┘

                     ┌────────────────────┐
                     │  End Users         │
                     │  (Diepenbeek)      │
                     └─────────┬──────────┘
                               │
              ┌────────────────┴───────────────────┐
              │                                    │
              ▼                                    ▼
┌──────────────────────────┐         ┌──────────────────────────┐
│ Static Web App (Std)     │         │ App Service (S1 Std)     │
│ - Custom domain          │◄───────►│ - 1 vCPU (dedicated)     │
│ - Advanced features      │   API   │ - 1.75 GB RAM            │
│ - SLA: 99.95%            │         │ - Always On: YES         │
│ €8.50/month              │         │ - Deployment Slots       │
└──────────────────────────┘         │ - Auto-scale: 1-3        │
                                     │ €70-210/month            │
                                     └────────┬─────────────────┘
                                              │
                     ┌────────────────────────┼──────────────────────┐
                     │                        │                      │
                     ▼                        ▼                      ▼
          ┌───────────────────┐    ┌──────────────────┐  ┌──────────────┐
          │ SQL Serverless    │    │ Key Vault        │  │ App Insights │
          │ GP_S_Gen5_2       │    │ Standard         │  │ 10-20 GB     │
          │ - 1-2 vCore       │    │ - Purge protect  │  │ - 50% sample │
          │ - Auto-pause 1hr  │    │ - Production     │  │ - 90-day     │
          │ - 35-day backup   │    │   access policy  │  │   retention  │
          │ - Geo-backup      │    │ €2-3/month       │  │ €15-35/month │
          │ €30-45/month      │    └──────────────────┘  └──────────────┘
          └───────┬───────────┘
                  │
                  ▼ (Optional)
          ┌───────────────────┐              ┌──────────────────┐
          │ SQL Geo-Replica   │              │ Redis Cache      │
          │ North Europe (DR) │              │ Basic C0/Std C1  │
          │ - Read-only       │              │ - 250 MB - 1 GB  │
          │ - Auto-failover   │              │ - Template cache │
          │ +€30-45/month     │              │ €15-60/month     │
          └───────────────────┘              └──────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ Cost Breakdown (Monthly):                                          │
│ - Static Web App (Standard):       €8.50                           │
│ - App Service Plan (S1 × 1):       €70.00                          │
│ - SQL Database (Serverless):       €35.00                          │
│ - Key Vault (Standard):            €2.50                           │
│ - Application Insights (15 GB):    €25.00                          │
│ - Redis Cache (Basic C0):          €15.00 (optional)               │
│ - SQL Geo-Replica (DR):            €35.00 (optional)               │
│ - Entra ID Premium P1 (5 users):   €28.00 (optional)               │
│ ──────────────────────────────────────────────────────────────     │
│ BASE CONFIGURATION:                €141.00                          │
│ WITH REDIS:                        €156.00                          │
│ WITH REDIS + DR:                   €191.00                          │
│ FULL FEATURED:                     €219.00                          │
└────────────────────────────────────────────────────────────────────┘
```

### 2.4 Authentication Flow Diagram

```
┌──────────────┐                                    ┌─────────────────┐
│   User       │                                    │ Microsoft       │
│   Browser    │                                    │ Entra ID        │
└──────┬───────┘                                    └────────┬────────┘
       │                                                     │
       │ 1. Navigate to https://inventory.diepenbeek.be     │
       ├─────────────────────────────────────────────────►  │
       │                                                     │
       │ 2. Redirect to Entra ID login                      │
       │ ◄───────────────────────────────────────────────── │
       │    https://login.microsoftonline.com/{tenant}/     │
       │                                                     │
       │ 3. User enters credentials                         │
       ├─────────────────────────────────────────────────►  │
       │    (username + password + MFA)                     │
       │                                                     │
       │ 4. Entra ID validates credentials                  │
       │ ◄───────────────────────────────────────────────── │
       │    Returns ID Token + Access Token                 │
       │    (JWT with user claims)                          │
       │                                                     │
       │ 5. Store tokens in sessionStorage                  │
       │                                                     │
       │ 6. API call with Bearer token                      │
       ├─────────────────────────────────────────────────►  │
       │    Authorization: Bearer {access-token}            │
       │                                            ┌───────┴────────┐
       │                                            │ ASP.NET Core   │
       │                                            │ API            │
       │                                            └───────┬────────┘
       │                                                    │
       │                              7. Validate JWT token │
       │                                 - Signature check  │
       │                                 - Expiration check │
       │                                 - Audience check   │
       │                                                    │
       │ 8. Return data                                     │
       │ ◄──────────────────────────────────────────────────┤
       │    { assets: [...] }                               │
       │                                                     │
```

### 2.5 CI/CD Pipeline Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                        AZURE DEVOPS PIPELINE                        │
└────────────────────────────────────────────────────────────────────┘

    Git Commit (main/develop branch)
              │
              ▼
    ┌─────────────────────┐
    │   TRIGGER PIPELINE  │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────────────────────────────────────┐
    │                  STAGE 1: BUILD                     │
    │  ┌─────────────────────────────────────────────┐   │
    │  │ Frontend Build                              │   │
    │  │ - npm ci                                    │   │
    │  │ - npm run lint                              │   │
    │  │ - Publish artifact: frontend-source         │   │
    │  └─────────────────────────────────────────────┘   │
    │                                                     │
    │  ┌─────────────────────────────────────────────┐   │
    │  │ Backend Build                               │   │
    │  │ - dotnet restore                            │   │
    │  │ - dotnet build                              │   │
    │  │ - dotnet test (with code coverage)          │   │
    │  │ - dotnet publish                            │   │
    │  │ - Publish artifact: backend.zip             │   │
    │  └─────────────────────────────────────────────┘   │
    │                                                     │
    │  ┌─────────────────────────────────────────────┐   │
    │  │ Infrastructure Validation                   │   │
    │  │ - az bicep build (validate templates)       │   │
    │  │ - az deployment sub validate                │   │
    │  │ - Publish artifact: bicep templates         │   │
    │  └─────────────────────────────────────────────┘   │
    └──────────┬──────────────────────────────────────────┘
               │
               ▼
    ┌──────────────────────────────────────────────────────┐
    │         STAGE 2: DEPLOY INFRASTRUCTURE               │
    │  ┌─────────────────────────────────────────────┐     │
    │  │ Deploy Bicep Templates                      │     │
    │  │ - az deployment sub create                  │     │
    │  │ - Create: App Service, SQL, Key Vault, etc. │     │
    │  │ - Extract outputs (resource names)          │     │
    │  └─────────────────────────────────────────────┘     │
    └──────────┬───────────────────────────────────────────┘
               │
               ▼
    ┌──────────────────────────────────────────────────────┐
    │            STAGE 3: DEPLOY DATABASE                  │
    │  ┌─────────────────────────────────────────────┐     │
    │  │ EF Core Migrations                          │     │
    │  │ - dotnet tool install dotnet-ef             │     │
    │  │ - Get connection string from Key Vault      │     │
    │  │ - dotnet ef database update                 │     │
    │  └─────────────────────────────────────────────┘     │
    └──────────┬───────────────────────────────────────────┘
               │
               ▼
    ┌──────────────────────────────────────────────────────┐
    │            STAGE 4: DEPLOY BACKEND                   │
    │  ┌─────────────────────────────────────────────┐     │
    │  │ Deploy to App Service                       │     │
    │  │ - az webapp deployment (to staging slot)    │     │
    │  │ - Health check: /health endpoint            │     │
    │  └─────────────────────────────────────────────┘     │
    └──────────┬───────────────────────────────────────────┘
               │
               ▼ (PROD ONLY)
    ┌──────────────────────────────────────────────────────┐
    │       STAGE 5: SWAP TO PRODUCTION (PROD)             │
    │  ┌─────────────────────────────────────────────┐     │
    │  │ Manual Approval Gate                        │     │
    │  │ - Email notification to approver            │     │
    │  │ - Timeout: 24 hours                         │     │
    │  └─────────┬───────────────────────────────────┘     │
    │            ▼                                          │
    │  ┌─────────────────────────────────────────────┐     │
    │  │ Slot Swap (staging → production)            │     │
    │  │ - az webapp deployment slot swap            │     │
    │  │ - Post-swap health check                    │     │
    │  │ - Auto-rollback on failure                  │     │
    │  └─────────────────────────────────────────────┘     │
    └──────────┬───────────────────────────────────────────┘
               │
               ▼
    ┌──────────────────────────────────────────────────────┐
    │            STAGE 6: DEPLOY FRONTEND                  │
    │  ┌─────────────────────────────────────────────┐     │
    │  │ Deploy to Static Web App                    │     │
    │  │ - Get deployment token                      │     │
    │  │ - swa deploy (build + deploy)               │     │
    │  └─────────────────────────────────────────────┘     │
    └──────────┬───────────────────────────────────────────┘
               │
               ▼
    ┌──────────────────────────────────────────────────────┐
    │         STAGE 7: POST-DEPLOYMENT TESTS               │
    │  ┌─────────────────────────────────────────────┐     │
    │  │ Integration Tests & Health Checks           │     │
    │  │ - API health check                          │     │
    │  │ - Frontend accessibility check              │     │
    │  │ - Database connectivity test                │     │
    │  │ - Send deployment notification              │     │
    │  └─────────────────────────────────────────────┘     │
    └──────────┬───────────────────────────────────────────┘
               │
               ▼
       ┌───────────────┐
       │  DEPLOYMENT   │
       │  SUCCESSFUL   │
       └───────────────┘
```

---

## 3. Cost Analysis

### 3.1 Monthly Cost Comparison Table

| Environment | Configuration | Resources | Monthly Cost (EUR) | Annual Cost (EUR) |
|-------------|---------------|-----------|-------------------|------------------|
| **DEV (Minimal)** | Ultra-low cost, auto-pause | F1 App Service, GP_S_Gen5_1 SQL, Free SWA | €6 - €8.50 | €72 - €102 |
| **DEV (Enhanced)** | Better for testing | B1 App Service, GP_S_Gen5_1 SQL | €18 - €21 | €216 - €252 |
| **PROD (Base)** | Entry production | S1 App Service (1×), GP_S_Gen5_2 SQL, Std SWA | €140 - €160 | €1,680 - €1,920 |
| **PROD (Recommended)** | Production + cache | Base + Redis Basic C0 | €155 - €175 | €1,860 - €2,100 |
| **PROD (High Availability)** | With DR replica | Recommended + SQL Geo-replication | €190 - €210 | €2,280 - €2,520 |
| **PROD (Full Featured)** | All features | HA + Redis Std + Entra P1 (5 users) | €210 - €250 | €2,520 - €3,000 |

### 3.2 Detailed DEV Cost Breakdown

| Resource | SKU/Tier | Specifications | Cost (EUR/month) |
|----------|----------|----------------|-----------------|
| Static Web App | Free | 100 GB bandwidth, custom domain | €0.00 |
| App Service Plan | F1 Free | 1 GB RAM, 60 min/day compute | €0.00 |
| SQL Database | GP_S_Gen5_1 Serverless | 0.5 vCore, auto-pause 1hr, 7-day backup | €5.50 - €8.00 |
| Key Vault | Standard | Operations-based pricing, ~1000 ops/mo | €0.50 |
| Application Insights | Pay-as-you-go | <5 GB/month (free tier) | €0.00 |
| Log Analytics | Pay-as-you-go | 1 GB daily cap | €0.00 |
| Entra ID | Free | SSO, app registrations | €0.00 |
| **Total DEV** | | | **€6.00 - €8.50** |

### 3.3 Detailed PROD Cost Breakdown (Recommended Configuration)

| Resource | SKU/Tier | Specifications | Cost (EUR/month) |
|----------|----------|----------------|-----------------|
| Static Web App | Standard | Custom domain, SLA 99.95% | €8.50 |
| App Service Plan | S1 Standard (1 instance) | 1 vCPU, 1.75 GB RAM, Always On | €70.00 |
| SQL Database | GP_S_Gen5_2 Serverless | 1-2 vCore, auto-pause 1hr, 35-day backup | €35.00 |
| Key Vault | Standard | ~10,000 operations/month | €2.50 |
| Application Insights | Pay-as-you-go | 15 GB/month (50% sampling) | €25.00 |
| Redis Cache | Basic C0 | 250 MB, shared infrastructure | €15.00 |
| **Total PROD (Recommended)** | | | **€156.00** |

**Optional Add-ons:**
- SQL Geo-Replica (North Europe): +€35/month (DR capability)
- Entra ID Premium P1 (5 users): +€28/month (MFA, Conditional Access)
- App Service auto-scale to 2 instances: +€70/month
- App Service auto-scale to 3 instances: +€140/month

### 3.4 Cost Optimization Strategies

#### Development Environment
1. **Use F1 Free App Service** (€0/month vs €13/month B1)
2. **Enable SQL auto-pause** (save 60-70% on compute costs)
3. **Use free tier for Static Web Apps** (€0 vs €8.50/month)
4. **Leverage Application Insights free tier** (5 GB/month)
5. **Delete non-essential resources when not in use**

**Potential Savings:** €100+ per month compared to paid tiers

#### Production Environment
1. **Start with Serverless SQL instead of provisioned** (€35/month vs €180/month)
2. **Enable Application Insights sampling** (50-80% reduction in data ingestion)
3. **Use Basic Redis C0 initially** (€15/month vs €60/month Standard C1)
4. **Purchase 1-year reserved capacity for App Service** (save 30%)
5. **Implement auto-pause for SQL during off-hours** (if 24/7 not required)

**Potential Annual Savings:** €500-800 with reserved capacity and optimization

### 3.5 Scaling Cost Impact

**Scenario 1: Low Traffic (100 users, 10k requests/day)**
- App Service: S1 × 1 instance = €70/month
- SQL Database: GP_S_Gen5_1 (low activity) = €20/month
- Application Insights: <5 GB = €0/month (free tier)
- **Total: ~€100/month**

**Scenario 2: Medium Traffic (500 users, 50k requests/day)**
- App Service: S1 × 2 instances (auto-scale) = €140/month
- SQL Database: GP_S_Gen5_2 = €40/month
- Application Insights: ~10 GB = €12/month
- Redis Cache: C0 = €15/month
- **Total: ~€207/month**

**Scenario 3: High Traffic (2000 users, 200k requests/day)**
- App Service: S2 × 3 instances = €630/month
- SQL Database: GP_Gen5_2 (provisioned, no auto-pause) = €180/month
- Application Insights: ~30 GB = €60/month
- Redis Cache: C1 Standard = €60/month
- **Total: ~€930/month**

### 3.6 Cost Alerts and Budgets

**Recommended Budget Alerts:**

| Environment | Monthly Budget | Alert Threshold 1 | Alert Threshold 2 | Action Threshold |
|-------------|----------------|-------------------|-------------------|-----------------|
| DEV | €10 | €8 (80%) | €9 (90%) | €10 (100%) - Auto-shutdown non-critical resources |
| PROD (Base) | €200 | €150 (75%) | €180 (90%) | €200 (100%) - Review scaling rules |
| PROD (Full) | €300 | €225 (75%) | €270 (90%) | €300 (100%) - Escalate to management |

**Set up cost alerts:**
```bash
# Create budget for DEV environment
az consumption budget create \
  --budget-name "Djoppie-DEV-Monthly" \
  --amount 10 \
  --time-grain Monthly \
  --time-period "startDate=$(date +%Y-%m-01T00:00:00Z)" \
  --notifications "actual_GreaterThan_80_Percent"

# Create budget for PROD environment
az consumption budget create \
  --budget-name "Djoppie-PROD-Monthly" \
  --amount 200 \
  --time-grain Monthly \
  --time-period "startDate=$(date +%Y-%m-01T00:00:00Z)" \
  --notifications "actual_GreaterThan_75_Percent"
```

---

## 4. Deployment Strategy

### 4.1 Deployment Phases

| Phase | Duration | Deliverables | Dependencies |
|-------|----------|--------------|--------------|
| **Phase 1:** Azure Setup | 30-45 min | Subscription validated, resource providers registered | Azure subscription, Azure CLI |
| **Phase 2:** Entra ID Configuration | 45-60 min | App registrations created, API permissions granted | Entra ID access, Application Administrator role |
| **Phase 3:** Azure DevOps Setup | 30-45 min | Pipelines configured, service connections created | Azure DevOps organization, Git repository |
| **Phase 4:** Infrastructure Deployment (DEV) | 20-30 min | DEV environment live, all resources created | Bicep templates, secrets in Key Vault |
| **Phase 5:** Database Setup | 15-20 min | EF migrations applied, seed data loaded | SQL Database deployed, connection string |
| **Phase 6:** Application Deployment | 15-20 min | Frontend and backend deployed, accessible | Infrastructure ready, app artifacts built |
| **Phase 7:** Post-Deployment Configuration | 15-20 min | Custom domains, monitoring alerts, documentation | All previous phases complete |
| **TOTAL (DEV)** | **3-4 hours** | Fully functional DEV environment | |
| **Phase 8:** PROD Deployment | 30-45 min | PROD environment live with blue-green deployment | DEV validated, approvals obtained |
| **TOTAL (DEV + PROD)** | **4-5 hours** | Both environments operational | |

### 4.2 Branching Strategy

```
main (PROD)
  │
  ├─ Release commits (tagged)
  │  v1.0.0, v1.1.0, etc.
  │
  └─ Merge from develop (via PR)
      ▲
      │
develop (DEV)
  │
  ├─ Feature branches merged here
  │
  └─ Continuous deployment to DEV environment
      ▲
      │
      ├─ feature/asset-management
      ├─ feature/qr-code-scanner
      ├─ bugfix/cors-issue
      └─ feature/intune-integration
```

**Deployment Triggers:**
- `develop` branch → Auto-deploy to DEV environment
- `main` branch → Manual approval required → Deploy to PROD environment

### 4.3 Blue-Green Deployment (PROD Only)

```
┌────────────────────────────────────────────────────────────────┐
│              BLUE-GREEN DEPLOYMENT PROCESS                     │
└────────────────────────────────────────────────────────────────┘

STEP 1: Deploy to Staging Slot (GREEN)
┌─────────────────────────┐         ┌─────────────────────────┐
│  Production Slot        │         │  Staging Slot           │
│  (BLUE - Live)          │         │  (GREEN - New version)  │
│                         │         │                         │
│  Users → App v1.0       │         │  New code → App v1.1    │
│  100% traffic           │         │  0% traffic             │
└─────────────────────────┘         └──────────┬──────────────┘
                                               │
                                               │ Health checks
                                               │ Smoke tests
                                               ▼
                                          ┌────────────┐
                                          │ All tests  │
                                          │ passed?    │
                                          └─────┬──────┘
                                                │ Yes
STEP 2: Swap Slots                              ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│  Production Slot        │         │  Staging Slot           │
│  (Now v1.1 - Live)      │◄────────┤  (Now v1.0 - Old)       │
│                         │  SWAP   │                         │
│  Users → App v1.1       │         │  Rollback ready         │
│  100% traffic           │         │  0% traffic             │
└─────────────────────────┘         └─────────────────────────┘

If issues detected: SWAP BACK instantly (rollback in seconds)
```

---

## 5. Resource Inventory

### 5.1 DEV Environment Resources

| Resource Type | Resource Name | Purpose | Cost/Month |
|---------------|---------------|---------|------------|
| Resource Group | `rg-djoppie-dev-westeu` | Container for all DEV resources | €0 |
| Static Web App | `swa-djoppie-dev-{unique}` | Frontend hosting (React) | €0 |
| App Service Plan | `plan-djoppie-dev-westeu` | Compute for backend API | €0 |
| App Service | `app-djoppie-api-dev-{unique}` | Backend API hosting | €0 |
| SQL Server | `sql-djoppie-dev-{unique}` | Database server | €0 |
| SQL Database | `sqldb-djoppie-dev` | Asset inventory data | €5.50-8.00 |
| Key Vault | `kv-djoppie-dev-{unique}` | Secrets management | €0.50 |
| Application Insights | `appi-djoppie-dev-westeu` | Monitoring and telemetry | €0 |
| Log Analytics Workspace | `log-djoppie-dev-westeu` | Centralized logging | €0 |

**Total DEV Resources:** 9 resources
**Total DEV Cost:** €6.00 - €8.50/month

### 5.2 PROD Environment Resources (Base Configuration)

| Resource Type | Resource Name | Purpose | Cost/Month |
|---------------|---------------|---------|------------|
| Resource Group | `rg-djoppie-prod-westeu` | Container for all PROD resources | €0 |
| Static Web App | `swa-djoppie-prod-{unique}` | Frontend hosting (React) | €8.50 |
| App Service Plan | `plan-djoppie-prod-westeu` | Compute for backend API (S1) | €70.00 |
| App Service | `app-djoppie-api-prod-{unique}` | Backend API hosting | €0 |
| App Service Slot | `app-djoppie-api-prod-{unique}/staging` | Blue-green deployment | €0 |
| SQL Server | `sql-djoppie-prod-{unique}` | Database server | €0 |
| SQL Database | `sqldb-djoppie-prod` | Asset inventory data | €35.00 |
| Key Vault | `kv-djoppie-prod-{unique}` | Secrets management | €2.50 |
| Application Insights | `appi-djoppie-prod-westeu` | Monitoring and telemetry | €25.00 |
| Log Analytics Workspace | `log-djoppie-prod-westeu` | Centralized logging | €0 |
| Redis Cache | `redis-djoppie-prod-{unique}` | Caching layer (optional) | €15.00 |
| Auto-scale Settings | `autoscale-djoppie-prod` | Auto-scaling rules | €0 |

**Total PROD Resources:** 12 resources (base), 13 with Redis
**Total PROD Cost (Base):** €141.00/month
**Total PROD Cost (with Redis):** €156.00/month

### 5.3 Disaster Recovery Resources (Optional)

| Resource Type | Resource Name | Purpose | Cost/Month |
|---------------|---------------|---------|------------|
| Resource Group (DR) | `rg-djoppie-dr-northeu` | Container for DR resources | €0 |
| SQL Server (DR) | `sql-djoppie-dr-{unique}` | DR database server | €0 |
| SQL Database (DR) | `sqldb-djoppie-prod` (replica) | Read-only replica | €35.00 |
| SQL Failover Group | `djoppie-prod-fog` | Auto-failover configuration | €0 |

**Total DR Cost:** +€35.00/month (if enabled)

---

## 6. Security Summary

### 6.1 Authentication & Authorization

| Component | Implementation | Security Level |
|-----------|----------------|---------------|
| **User Authentication** | Microsoft Entra ID (OAuth 2.0 / OIDC) | Enterprise-grade |
| **Token Type** | JWT (JSON Web Token) | Industry standard |
| **Token Storage** | sessionStorage (browser) | Client-side |
| **API Authorization** | Bearer token validation | Secure |
| **Service-to-Service Auth** | Managed Identity | Passwordless |
| **MFA Support** | Entra ID Conditional Access (with Premium P1) | Available |

### 6.2 Data Protection

| Layer | Protection Method | Implementation |
|-------|------------------|----------------|
| **In Transit** | TLS 1.2+ (HTTPS only) | Enforced at App Service level |
| **At Rest** | Transparent Data Encryption (TDE) | Enabled on SQL Database |
| **Secrets** | Azure Key Vault | All credentials stored securely |
| **Database Backups** | Geo-redundant backup storage | 7-day (DEV) / 35-day (PROD) retention |
| **API Keys** | Managed Identity + Key Vault | No credentials in code |

### 6.3 Network Security

| Control | Implementation | Purpose |
|---------|----------------|---------|
| **Firewall Rules** | SQL Server firewall | Allow Azure services only |
| **CORS Policy** | Configured in App Service | Restrict to known origins |
| **HTTPS Enforcement** | App Service configuration | Reject HTTP traffic |
| **Managed Identity** | System-assigned identity | Passwordless authentication to Key Vault |
| **Private Endpoints** | Optional (not implemented in base config) | Enhanced network isolation |

### 6.4 Security Best Practices Implemented

- [x] All secrets stored in Azure Key Vault
- [x] Managed Identity used for Azure resource access
- [x] HTTPS enforced on all endpoints
- [x] Database encryption at rest (TDE enabled)
- [x] SQL authentication with strong passwords
- [x] CORS restrictions configured
- [x] JWT token validation on all API requests
- [x] Application Insights for security monitoring
- [x] Audit logging enabled on SQL Database (PROD)
- [x] Soft delete enabled on Key Vault

### 6.5 Compliance Considerations

**GDPR Compliance:**
- User data stored in EU region (West Europe)
- Point-in-time restore for data recovery
- Audit logs for access tracking
- Right to erasure can be implemented via soft deletes

**Microsoft Entra ID Roles:**
- Application Administrator: Required for app registrations
- Cloud Application Administrator: Alternative role
- Conditional Access Administrator: For MFA policies (with Premium P1)

---

## 7. Monitoring and Operations

### 7.1 Health Monitoring

| Endpoint | Purpose | Expected Response | Alert Threshold |
|----------|---------|-------------------|----------------|
| `/health` | Overall API health | HTTP 200 OK | >5% failures in 5 min |
| `/health/ready` | Readiness probe | HTTP 200 OK | Any failure |
| `/health/database` | Database connectivity | HTTP 200 OK | >10% failures in 5 min |

### 7.2 Key Metrics to Monitor

| Metric | Description | Warning Threshold | Critical Threshold |
|--------|-------------|------------------|-------------------|
| **Response Time** | API avg response time | >1 second | >2 seconds |
| **Error Rate** | HTTP 4xx/5xx errors | >2% | >5% |
| **CPU Usage** | App Service CPU % | >70% | >85% |
| **Memory Usage** | App Service memory % | >80% | >90% |
| **DTU Usage** | SQL Database DTU % | >70% | >85% |
| **Active Users** | Current active users | N/A | Monitor trends |
| **Request Rate** | Requests per minute | N/A | >1000 req/min (scale trigger) |

### 7.3 Application Insights Dashboards

**Recommended Dashboards:**

1. **Performance Dashboard**
   - Average response time (by endpoint)
   - 95th percentile response time
   - Failed request rate
   - Top 10 slowest requests

2. **Availability Dashboard**
   - Health check success rate
   - Uptime percentage
   - Failed requests by status code
   - Dependency availability (SQL, Key Vault, Graph API)

3. **User Activity Dashboard**
   - Active users (last 24 hours)
   - Page views
   - User sessions
   - Geographic distribution

4. **Error Tracking Dashboard**
   - Exception count (last 24 hours)
   - Top exceptions by type
   - Failed SQL queries
   - API call failures

### 7.4 Alert Rules

| Alert Name | Condition | Severity | Action |
|------------|-----------|----------|--------|
| High Response Time | Avg response time >2s for 5 min | Warning | Email operations team |
| High Error Rate | Error rate >5% for 5 min | Critical | Email + SMS |
| App Service Down | Health check fails for 2 min | Critical | Email + SMS + Auto-restart |
| Database DTU High | DTU usage >80% for 15 min | Warning | Email, review scaling |
| SQL Connection Failures | >10 failed connections in 5 min | Critical | Email + SMS |

### 7.5 Operational Runbooks

**Common Operations:**

1. **Scale App Service**
   ```bash
   # Scale to 2 instances
   az appservice plan update --name plan-djoppie-prod-westeu --resource-group rg-djoppie-prod-westeu --number-of-workers 2
   ```

2. **Restart App Service**
   ```bash
   az webapp restart --name app-djoppie-api-prod-{unique} --resource-group rg-djoppie-prod-westeu
   ```

3. **View Application Logs**
   ```bash
   az webapp log tail --name app-djoppie-api-prod-{unique} --resource-group rg-djoppie-prod-westeu
   ```

4. **Check SQL Database Status**
   ```bash
   az sql db show --name sqldb-djoppie-prod --server sql-djoppie-prod-{unique} --resource-group rg-djoppie-prod-westeu
   ```

5. **Rotate Secrets**
   ```bash
   # Generate new client secret in Entra ID
   # Update Key Vault
   az keyvault secret set --vault-name kv-djoppie-prod-{unique} --name EntraBackendClientSecret --value "{new-secret}"
   # Restart App Service
   az webapp restart --name app-djoppie-api-prod-{unique} --resource-group rg-djoppie-prod-westeu
   ```

---

## 8. Next Steps

### 8.1 Immediate Actions (Week 1)

- [ ] **Review and approve architecture** with stakeholders
- [ ] **Provision Azure subscription** (or verify existing subscription)
- [ ] **Create Entra ID app registrations** (frontend + backend)
- [ ] **Set up Azure DevOps project** and import repository
- [ ] **Deploy DEV environment** using Bicep templates
- [ ] **Test end-to-end functionality** in DEV
- [ ] **Create deployment documentation** specific to your organization

### 8.2 Short-Term Actions (Month 1)

- [ ] **Complete Intune integration** (Microsoft Graph service implementation)
- [ ] **Add health check endpoints** to backend API
- [ ] **Implement Serilog** for structured logging
- [ ] **Set up monitoring alerts** in Application Insights
- [ ] **Create user documentation** and training materials
- [ ] **Deploy to PROD environment** (after DEV validation)
- [ ] **Configure custom domains** (inventory.diepenbeek.be)
- [ ] **Conduct user acceptance testing** (UAT)

### 8.3 Mid-Term Enhancements (Months 2-3)

- [ ] **Implement Redis caching** for performance optimization
- [ ] **Enable SQL geo-replication** for disaster recovery
- [ ] **Add comprehensive unit tests** (target: >80% code coverage)
- [ ] **Implement rate limiting** on API endpoints
- [ ] **Add API versioning** strategy
- [ ] **Create operational dashboards** in Azure Monitor
- [ ] **Document disaster recovery procedures**
- [ ] **Conduct security review** and penetration testing

### 8.4 Long-Term Roadmap (Months 4-6)

- [ ] **Consider Azure Front Door** for global distribution
- [ ] **Implement background jobs** (Hangfire for scheduled Intune sync)
- [ ] **Add audit logging** for all asset modifications
- [ ] **Implement soft deletes** for data recovery
- [ ] **Create mobile app** or PWA for QR code scanning
- [ ] **Integration with service desk system** (ServiceNow, Jira, etc.)
- [ ] **Advanced reporting and analytics** (Power BI integration)
- [ ] **Multi-language support** (i18n)

### 8.5 Continuous Improvement

**Monthly Reviews:**
- Cost optimization analysis (identify savings opportunities)
- Performance metrics review (response times, error rates)
- Security updates and patching
- User feedback incorporation

**Quarterly Reviews:**
- Architecture review (evaluate new Azure services)
- Capacity planning (based on actual usage trends)
- Disaster recovery testing (simulated failover)
- Budget review and forecast

---

## Conclusion

The Djoppie Inventory system is designed for **cost-effective development** (€6-8.50/month) and **scalable production deployment** (€140-250/month) on Microsoft Azure. The architecture leverages Azure PaaS services, Microsoft Entra ID, and infrastructure as code (Bicep) for a modern, secure, and maintainable solution.

### Key Highlights

- **Ultra-Low Cost DEV**: Develop and test for less than €10/month
- **Production-Ready**: Scalable architecture supporting 100-2000 users
- **Security-First**: Enterprise-grade authentication with Entra ID
- **DevOps-Enabled**: Automated CI/CD with blue-green deployment
- **Monitoring**: Comprehensive telemetry with Application Insights
- **Disaster Recovery**: Optional geo-replication for business continuity

### Success Metrics

**Technical Metrics:**
- API response time: <1 second (95th percentile)
- Uptime: >99.5% (DEV), >99.9% (PROD target)
- Error rate: <1%
- Code coverage: >80%

**Business Metrics:**
- User adoption: Track active users monthly
- Asset scanning time: <5 seconds per asset
- Cost per user: Monitor and optimize monthly
- User satisfaction: >4/5 rating

### Support

For questions or assistance with deployment:
- **Technical Contact:** jo.wijnen@diepenbeek.be
- **Documentation:** See `/docs` folder in repository
- **Issues:** Use Azure DevOps work items or GitHub issues

---

**Document Version:** 1.0
**Last Updated:** January 27, 2026
**Next Review:** After first production deployment

---

**All documentation files created:**

1. `BACKEND_ARCHITECTURE_ANALYSIS.md` - Comprehensive backend code analysis
2. `AZURE_ARCHITECTURE_DESIGN.md` - Detailed Azure architecture with costs
3. `DEPLOYMENT_GUIDE.md` - Step-by-step installation manual
4. `DEPLOYMENT_SUMMARY.md` - Executive summary and quick reference
5. `/infrastructure/bicep/` - Complete Bicep templates (DEV + PROD)
6. `azure-pipelines-recommended.yml` - Production-ready CI/CD pipeline

**Ready for deployment!**

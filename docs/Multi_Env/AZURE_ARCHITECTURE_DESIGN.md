# Djoppie Inventory - Azure Architecture Design

**Date:** January 27, 2026
**Version:** 1.0
**Target:** Azure Cloud Platform

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Development Environment (Ultra-Low Cost)](#2-development-environment-ultra-low-cost)
3. [Production Environment (Scalable)](#3-production-environment-scalable)
4. [Network Architecture](#4-network-architecture)
5. [Security Architecture](#5-security-architecture)
6. [Disaster Recovery & Business Continuity](#6-disaster-recovery--business-continuity)
7. [Monitoring & Observability](#7-monitoring--observability)
8. [Cost Analysis](#8-cost-analysis)

---

## 1. Architecture Overview

### 1.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            Internet Users                                │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Azure Front Door (Optional)                       │
│                    Global CDN + WAF + SSL Termination                    │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
┌───────────────────────────────┐   ┌───────────────────────────────────┐
│   Azure Static Web Apps       │   │   Azure App Service (API)         │
│   - React Frontend (Vite)     │   │   - ASP.NET Core 8.0 Web API      │
│   - CDN Distribution          │   │   - Managed Identity              │
│   - Custom Domain Support     │   │   - Auto-scaling Enabled          │
│   - SSL Certificate           │   │   - Deployment Slots (Prod only)  │
└───────────────┬───────────────┘   └─────────────┬─────────────────────┘
                │                                 │
                │                                 │
                │    ┌────────────────────────────┼──────────────────┐
                │    │                            │                  │
                │    ▼                            ▼                  ▼
                │  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────┐
                │  │  Azure SQL DB   │  │  Azure Key Vault │  │ App Insights │
                │  │  - Serverless   │  │  - Secrets       │  │ - Telemetry  │
                │  │  - Auto-pause   │  │  - Certificates  │  │ - Logs       │
                │  │  - Geo-replica  │  │  - Access Policy │  │ - Metrics    │
                │  └─────────────────┘  └──────────────────┘  └──────────────┘
                │                                 │
                │                                 ▼
                │                       ┌──────────────────────┐
                │                       │  Microsoft Graph API │
                │                       │  - Intune Devices    │
                │                       │  - Entra ID Auth     │
                │                       └──────────────────────┘
                │
                └────────────► Microsoft Entra ID
                              - SSO Authentication
                              - User Management
                              - App Registrations (2x)
```

### 1.2 Component Overview

| Component | Purpose | Technology |
|-----------|---------|------------|
| **Frontend** | User interface for asset management | React 19 + TypeScript + Vite |
| **API Gateway** | RESTful API backend | ASP.NET Core 8.0 Web API |
| **Database** | Persistent data storage | Azure SQL Database (Serverless) |
| **Authentication** | Identity and access management | Microsoft Entra ID (Azure AD) |
| **Secrets Management** | Secure credential storage | Azure Key Vault |
| **Monitoring** | Application performance monitoring | Azure Application Insights |
| **External Integration** | Device management data | Microsoft Graph API (Intune) |
| **Hosting - Frontend** | Static website hosting | Azure Static Web Apps |
| **Hosting - Backend** | API hosting with scaling | Azure App Service (Linux/Windows) |

### 1.3 Azure Regions

**Primary Region:** West Europe (Amsterdam)
- Closest to Diepenbeek, Belgium
- Low latency for users
- Full service availability

**Secondary Region (Production only):** North Europe (Dublin)
- Geo-replication for SQL Database
- Disaster recovery readiness

---

## 2. Development Environment (Ultra-Low Cost)

**Target Cost:** €5-10 per month

### 2.1 DEV Environment Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         DEV Environment                             │
│                    Target: €5-10/month                              │
└────────────────────────────────────────────────────────────────────┘

Frontend:                    Backend API:                 Database:
┌─────────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│ Static Web Apps     │     │ App Service         │     │ Azure SQL DB     │
│ - Free Tier         │────▶│ - F1 Free Plan      │────▶│ - Serverless     │
│ - 100 GB bandwidth  │     │ - 60 min/day CPU    │     │ - GP_S_Gen5_1    │
│ - Custom domain     │     │ - 1 GB RAM          │     │ - 0.5 vCore      │
│ Cost: €0/month      │     │ - Always On: OFF    │     │ - Auto-pause 1hr │
└─────────────────────┘     │ Cost: €0/month      │     │ Cost: ~€5-8/mo   │
                            └─────────────────────┘     └──────────────────┘
                                     │                           ▲
                                     ▼                           │
                            ┌─────────────────────┐              │
                            │ Key Vault           │              │
                            │ - Standard Tier     │              │
                            │ - Pay per operation │              │
                            │ Cost: ~€0.50/month  │              │
                            └─────────────────────┘              │
                                     │                           │
                                     ▼                           │
                            ┌─────────────────────┐              │
                            │ App Insights        │              │
                            │ - Pay-as-you-go     │              │
                            │ - 5GB free tier     │              │
                            │ Cost: €0-1/month    │              │
                            └─────────────────────┘              │
                                                                 │
                            ┌─────────────────────┐              │
                            │ Microsoft Entra ID  │              │
                            │ - Free Tier         │              │
                            │ - SSO + App Reg     │              │
                            │ Cost: €0/month      │              │
                            └─────────────────────┘              │
                                                                 │
                            Auto-pause after 1 hour ─────────────┘
                            (Database only active during development)
```

### 2.2 DEV Resource Specifications

#### 2.2.1 Azure Static Web Apps (Frontend)

**SKU:** Free Tier

**Features:**
- 100 GB bandwidth/month
- Custom domain and free SSL
- Automatic deployment from GitHub
- Global CDN distribution
- Staging environments

**Limitations:**
- No custom authentication
- Limited to 2 environments (production + staging)
- No SLA

**Cost:** €0/month

#### 2.2.2 Azure App Service (Backend API)

**SKU:** F1 (Free Tier)

**Specifications:**
- 1 vCPU (shared)
- 1 GB RAM
- 1 GB storage
- 60 minutes/day compute time
- No Always On (cold start delays)
- No deployment slots
- No auto-scaling
- Windows or Linux

**Limitations:**
- 60-minute daily execution limit
- Slower cold starts (first request delay)
- No custom domains without manual DNS
- No SLA

**Cost:** €0/month

**Alternative for heavier testing:** B1 Basic (~€13/month)
- 1 vCPU (dedicated)
- 1.75 GB RAM
- 10 GB storage
- No execution time limits
- Always On available

#### 2.2.3 Azure SQL Database

**SKU:** GP_S_Gen5_1 (General Purpose Serverless)

**Specifications:**
- 0.5 vCore minimum, 1 vCore maximum
- Up to 32 GB storage
- Auto-pause delay: 1 hour
- Auto-resume on connection
- Zone-redundant: Disabled

**Pricing Model:**
- Compute: €0.0001237/vCore/second (when active)
- Storage: €0.1133/GB/month
- Backup: €0.1133/GB/month (7-day retention)

**Estimated Usage:**
- Active: ~2 hours/day (development sessions)
- Storage: ~1 GB
- Backups: ~1 GB

**Monthly Cost Estimate:**
```
Compute: 2 hrs/day × 30 days × 0.5 vCore × €0.4453/hr = ~€13.36
BUT: Auto-pause reduces to actual usage
Realistic: 60 hours/month × 0.5 vCore × €0.4453 = €13.36
With auto-pause savings: ~€5-8/month

Storage: 1 GB × €0.1133 = €0.11
Backups: 1 GB × €0.1133 = €0.11

Total: ~€5.50-8.50/month
```

**Cost Optimization:**
- Auto-pause after 1 hour of inactivity
- Minimum compute (0.5 vCore)
- Small storage allocation

#### 2.2.4 Azure Key Vault

**SKU:** Standard Tier

**Specifications:**
- Software-protected keys
- Unlimited secrets/keys/certificates
- Pay-per-operation pricing

**Operations:**
- ~1000 operations/month (dev environment)

**Cost:**
- Operations: 1000 × €0.0003 = €0.30/month
- Secret storage: Included

**Monthly Cost:** ~€0.50/month

#### 2.2.5 Azure Application Insights

**SKU:** Pay-as-you-go (Consumption-based)

**Free Tier:**
- 5 GB data ingestion/month
- 90-day retention

**Estimated DEV Usage:**
- ~500 MB - 1 GB/month (low traffic)

**Cost:** €0/month (within free tier)

**If exceeding free tier:**
- €2.30/GB for additional data
- Unlikely in DEV environment

#### 2.2.6 Microsoft Entra ID (Azure AD)

**SKU:** Free Tier

**Features:**
- Up to 50,000 objects
- SSO for cloud applications
- App registrations (unlimited)
- User and group management
- OAuth 2.0 / OpenID Connect

**Required App Registrations:**
1. Frontend SPA (React app)
2. Backend API (ASP.NET Core)

**Cost:** €0/month

### 2.3 DEV Environment Resource Naming

```
Resource Group:      rg-djoppie-dev-westeu
Static Web App:      swa-djoppie-dev-{unique}
App Service Plan:    plan-djoppie-dev-westeu
App Service:         app-djoppie-api-dev-{unique}
SQL Server:          sql-djoppie-dev-{unique}
SQL Database:        sqldb-djoppie-dev
Key Vault:           kv-djoppie-dev-{unique}
App Insights:        appi-djoppie-dev-westeu
Log Analytics:       log-djoppie-dev-westeu

{unique} = 6-character random suffix (e.g., uld7i4)
```

### 2.4 DEV Total Monthly Cost Breakdown

| Resource | SKU | Monthly Cost (EUR) |
|----------|-----|-------------------|
| Static Web Apps | Free | €0.00 |
| App Service Plan | F1 Free | €0.00 |
| SQL Database (Serverless) | GP_S_Gen5_1 | €5.50 - €8.00 |
| Key Vault | Standard | €0.50 |
| Application Insights | Pay-as-you-go | €0.00 (free tier) |
| Entra ID | Free | €0.00 |
| **Total** | | **€6.00 - €8.50** |

**Note:** First-month costs may include one-time setup fees. Prices based on West Europe region as of January 2026.

---

## 3. Production Environment (Scalable)

**Target Cost:** €70-150 per month (initial), scales with usage

### 3.1 PROD Environment Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         PROD Environment                            │
│                    Target: €70-150/month                            │
└────────────────────────────────────────────────────────────────────┘

Frontend:                      Backend API:                  Database:
┌─────────────────────┐       ┌─────────────────────┐       ┌──────────────────┐
│ Static Web Apps     │       │ App Service         │       │ Azure SQL DB     │
│ - Standard Tier     │──────▶│ - S1 Standard Plan  │──────▶│ - Serverless     │
│ - Custom domain     │       │ - 1 vCPU dedicated  │       │ - GP_S_Gen5_2    │
│ - Advanced features │       │ - 1.75 GB RAM       │       │ - 1-2 vCore      │
│ Cost: €8.50/month   │       │ - Always On: YES    │       │ - Max 32 GB      │
└─────────────────────┘       │ - Deployment Slots  │       │ - Auto-pause 1hr │
                              │ - Auto-scale (1-3)  │       │ Cost: ~€30-45/mo │
                              │ Cost: ~€70/month    │       └──────────────────┘
                              └─────────────────────┘                │
                                       │                             │
                    ┌──────────────────┼─────────────────┐           │
                    ▼                  ▼                 ▼           │
          ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐   │
          │ Key Vault       │  │ App Insights │  │ Redis Cache  │   │
          │ - Standard      │  │ - 10-20 GB   │  │ - Basic C0   │   │
          │ Cost: €2/month  │  │ Cost: €15/mo │  │ (Optional)   │   │
          └─────────────────┘  └──────────────┘  │ Cost: €15/mo │   │
                                                 └──────────────┘   │
                                                                    │
          ┌────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────┐       ┌────────────────────────────┐
│ SQL Database Replica │       │ Azure Backup               │
│ - Geo-replication    │       │ - Automated backups        │
│ - Read-only replica  │       │ - 35-day retention         │
│ - North Europe       │       │ - Point-in-time restore    │
│ Cost: +€30/month     │       │ Cost: Included in SQL tier │
└──────────────────────┘       └────────────────────────────┘

                    ┌─────────────────────┐
                    │ Microsoft Entra ID  │
                    │ - Premium P1        │
                    │ - Conditional Access│
                    │ Cost: €5.60/user/mo │
                    └─────────────────────┘
```

### 3.2 PROD Resource Specifications

#### 3.2.1 Azure Static Web Apps

**SKU:** Standard Tier

**Features:**
- Custom domains with SSL
- 100 GB bandwidth/month (then pay-as-you-go)
- Custom authentication providers
- Unlimited environments
- SLA: 99.95%

**Cost:** €8.50/month

#### 3.2.2 Azure App Service

**SKU:** S1 Standard Plan

**Specifications:**
- 1 vCPU (dedicated)
- 1.75 GB RAM
- 50 GB storage
- Always On: Enabled (no cold starts)
- Deployment slots: 5 (for blue-green deployments)
- Auto-scaling: Manual or automatic (1-3 instances)
- Custom domains and SSL
- SLA: 99.95%

**Auto-Scaling Rules:**
- Scale out: CPU > 70% for 5 minutes
- Scale in: CPU < 30% for 10 minutes
- Min instances: 1
- Max instances: 3

**Cost:**
- Base: €70/month (1 instance)
- Auto-scale: +€70/month per additional instance
- Estimated: €70-210/month (1-3 instances)

**Deployment Strategy:**
- Deployment slots for staging
- Blue-green deployment pattern
- Zero-downtime deployments

#### 3.2.3 Azure SQL Database

**SKU:** GP_S_Gen5_2 (General Purpose Serverless)

**Specifications:**
- 1 vCore minimum, 2 vCore maximum
- 32 GB max storage (auto-grow enabled)
- Auto-pause delay: 1 hour (configurable)
- Zone-redundant: Optional (+30% cost)
- Automated backups: 35-day retention
- Point-in-time restore: Any second within 35 days

**Pricing:**
- Compute: 1-2 vCore variable based on load
- Storage: Up to 32 GB
- Backups: Included for 35 days

**Estimated Cost:**
```
Compute: ~100 hours/month active × 1.5 vCore avg × €0.4453/hr = ~€67
Storage: 10 GB × €0.1133 = €1.13
Backups: Included

Total: ~€30-45/month (with auto-pause optimization)
Without auto-pause: ~€150/month
```

**Geo-Replication (Optional):**
- Read-only replica in North Europe
- Disaster recovery failover capability
- Additional cost: +€30-45/month (same as primary)

#### 3.2.4 Azure Key Vault

**SKU:** Standard Tier

**Operations:**
- ~10,000 operations/month (production load)

**Cost:**
- Operations: 10,000 × €0.0003 = €3.00/month
- Secrets: Included

**Monthly Cost:** ~€2-3/month

#### 3.2.5 Azure Application Insights

**Data Ingestion:**
- Estimated: 10-20 GB/month
- 5 GB free tier
- Overage: 5-15 GB × €2.30/GB = €11.50 - €34.50

**Retention:**
- Default: 90 days (free)
- Extended: 730 days (+€0.115/GB/month)

**Cost:** ~€15-35/month

**Cost Optimization:**
- Sampling enabled (50-80%)
- Filter out verbose logs
- Archive old data to Storage

#### 3.2.6 Azure Cache for Redis (Optional)

**SKU:** Basic C0

**Specifications:**
- 250 MB cache
- Shared infrastructure
- No SLA (Basic tier)

**Use Cases:**
- Asset template caching
- Session state (if needed)
- API response caching

**Cost:** ~€15/month

**Recommended Upgrade:** Standard C1 (~€60/month)
- 1 GB cache
- Replication and SLA
- Better performance

#### 3.2.7 Microsoft Entra ID

**SKU:** Premium P1 (Optional)

**Features:**
- Conditional Access policies
- Multi-factor authentication
- Self-service password reset
- Advanced security reporting

**Required for:**
- MFA enforcement
- Conditional Access based on location/device
- Advanced threat protection

**Cost:** €5.60/user/month

**For small teams (5 users):** €28/month

**Alternative:** Free tier sufficient for basic SSO

### 3.3 PROD Environment Resource Naming

```
Resource Group:      rg-djoppie-prod-westeu
Static Web App:      swa-djoppie-prod-{unique}
App Service Plan:    plan-djoppie-prod-westeu
App Service:         app-djoppie-api-prod-{unique}
App Service Slot:    app-djoppie-api-prod-{unique}/staging
SQL Server:          sql-djoppie-prod-{unique}
SQL Database:        sqldb-djoppie-prod
Key Vault:           kv-djoppie-prod-{unique}
App Insights:        appi-djoppie-prod-westeu
Log Analytics:       log-djoppie-prod-westeu
Redis Cache:         redis-djoppie-prod-{unique}

Geo-Replica (DR):
Resource Group:      rg-djoppie-dr-northeu
SQL Server (DR):     sql-djoppie-dr-{unique}
SQL Database (DR):   sqldb-djoppie-prod (read replica)
```

### 3.4 PROD Total Monthly Cost Breakdown

| Resource | SKU | Monthly Cost (EUR) | Notes |
|----------|-----|-------------------|-------|
| Static Web Apps | Standard | €8.50 | Custom domains + SLA |
| App Service (1 instance) | S1 Standard | €70.00 | Dedicated compute |
| SQL Database | GP_S_Gen5_2 | €35.00 | With auto-pause |
| Key Vault | Standard | €2.50 | Production load |
| Application Insights | 15 GB | €25.00 | After free tier |
| Redis Cache (Optional) | Basic C0 | €15.00 | Caching layer |
| SQL Geo-Replica (Optional) | GP_S_Gen5_2 | €35.00 | DR only |
| Entra ID Premium (Optional) | P1 × 5 users | €28.00 | MFA + Conditional Access |
| **Base Total** | | **€141.00** | Without optional components |
| **With Redis** | | **€156.00** | |
| **With Redis + DR** | | **€191.00** | |
| **Full Featured** | | **€219.00** | Redis + DR + Entra P1 |

**Auto-Scale Impact:**
- +1 App Service instance: +€70/month
- +2 App Service instances: +€140/month

**Recommended Starting Point:** €140-160/month
- Includes: Static Web App, App Service (1 instance), SQL Serverless, Key Vault, App Insights, Redis
- Excludes: Geo-replication (add after proven stability), Entra P1 (if MFA required)

---

## 4. Network Architecture

### 4.1 Network Flow

```
┌──────────────┐
│   Internet   │
│    Users     │
└──────┬───────┘
       │
       │ HTTPS (443)
       ▼
┌──────────────────────────────────┐
│  Azure Static Web Apps (Frontend)│
│  - React SPA                     │
│  - Entra ID OAuth redirect       │
└──────────────┬───────────────────┘
               │
               │ HTTPS API Calls
               │ Authorization: Bearer {token}
               ▼
┌──────────────────────────────────┐
│  Azure App Service (Backend API) │
│  - JWT Token Validation          │
│  - CORS: Configured Origins      │
└──────┬───────────────────────────┘
       │
       ├─────────────────────┬──────────────────┬────────────────────┐
       │                     │                  │                    │
       ▼                     ▼                  ▼                    ▼
┌─────────────┐    ┌─────────────────┐  ┌──────────────┐  ┌─────────────────┐
│  Azure SQL  │    │  Key Vault      │  │ App Insights │  │ Microsoft Graph │
│  Database   │    │  - Managed ID   │  │ - Telemetry  │  │ - Intune API    │
└─────────────┘    └─────────────────┘  └──────────────┘  └─────────────────┘
```

### 4.2 Security Zones

**Public Zone:**
- Azure Static Web Apps (Frontend)
- Public internet access
- CDN distributed

**Application Zone:**
- Azure App Service (Backend API)
- Restricted to HTTPS only
- CORS-protected

**Data Zone:**
- Azure SQL Database
- Firewall: Allow Azure services only
- Private endpoint (optional for PROD)

**Management Zone:**
- Azure Key Vault
- Access via Managed Identity only
- No public network access (optional)

### 4.3 DNS Configuration

**Frontend:**
```
Custom Domain: inventory.diepenbeek.be
CNAME: inventory.diepenbeek.be → swa-djoppie-prod-{unique}.azurestaticapps.net
SSL: Automatic via Static Web Apps
```

**Backend API:**
```
Custom Domain: api.inventory.diepenbeek.be
CNAME: api.inventory.diepenbeek.be → app-djoppie-api-prod-{unique}.azurewebsites.net
SSL: Automatic via App Service Managed Certificate
```

### 4.4 Firewall Rules

**Azure SQL Database:**
```
Allow Azure services: YES
Specific IP ranges: DEV team IPs (for management)
Virtual Network rule: Optional (if using VNet integration)
```

**Key Vault:**
```
Network Access: Selected networks (production)
Allowed IPs: None (Managed Identity access only)
Virtual Network: Optional
```

---

## 5. Security Architecture

### 5.1 Identity & Access Management

```
┌────────────────────────────────────────────────────────────────┐
│              Microsoft Entra ID (Azure AD)                     │
│                  Diepenbeek Tenant                             │
└────────────────────────────────────────────────────────────────┘
         │                                    │
         │ User Authentication                │ App Authentication
         ▼                                    ▼
┌──────────────────────┐            ┌──────────────────────┐
│ Frontend App         │            │ Backend API App      │
│ Registration (SPA)   │            │ Registration (Web)   │
│                      │            │                      │
│ - Redirect URIs:     │            │ - Exposed API:       │
│   http://localhost   │            │   api://{clientId}   │
│   https://inventory  │            │                      │
│                      │            │ - App Roles:         │
│ - Implicit Grant:    │            │   * Asset.Read       │
│   ID Token           │            │   * Asset.Write      │
│   Access Token       │            │   * Admin            │
└──────────────────────┘            └──────────────────────┘
```

### 5.2 Authentication Flow

```
1. User → Frontend (inventory.diepenbeek.be)
   ↓
2. Frontend redirects to Entra ID login
   ↓
3. User authenticates (username/password + MFA)
   ↓
4. Entra ID issues ID token and Access token
   ↓
5. Frontend stores tokens (sessionStorage/localStorage)
   ↓
6. API call to Backend with Authorization header
   Authorization: Bearer {access_token}
   ↓
7. Backend validates token with Entra ID
   - Signature verification
   - Expiration check
   - Audience validation (api://{clientId})
   - Issuer validation (Diepenbeek tenant)
   ↓
8. Backend processes request
   ↓
9. Response returned to Frontend
```

### 5.3 API Permissions (Backend App Registration)

**Microsoft Graph API:**
```yaml
API Permissions:
  - DeviceManagementManagedDevices.Read.All (Application)
  - Device.Read.All (Application)
  - Directory.Read.All (Application)

Admin Consent Required: YES
Grant Type: Client Credentials (Service Principal)
```

**Backend API Scopes:**
```yaml
Exposed API:
  Scope: api://fc0be7bf-0e71-4c39-8a02-614dfa16322c/Asset.Access
  Admin Consent: Not Required
  Enabled: YES

App Roles:
  - Asset.Read: Read access to assets
  - Asset.Write: Create and update assets
  - Asset.Delete: Delete assets
  - Admin: Full administrative access
```

### 5.4 Managed Identity Configuration

**App Service Managed Identity:**
```yaml
Type: System-assigned
Principal ID: Auto-generated
Uses:
  - Azure Key Vault access (Get/List secrets)
  - Azure SQL Database access (optional)
  - Microsoft Graph API calls
```

**Key Vault Access Policy:**
```yaml
Object ID: {App Service Managed Identity Principal ID}
Permissions:
  Secrets: Get, List
  Keys: None
  Certificates: None
```

### 5.5 Secrets in Key Vault

```yaml
Secrets:
  - Name: SqlConnectionString
    Value: Server=tcp:sql-djoppie-prod-{unique}.database.windows.net,1433;...

  - Name: EntraTenantId
    Value: {diepenbeek-tenant-id}

  - Name: EntraBackendClientId
    Value: {backend-app-registration-client-id}

  - Name: EntraBackendClientSecret
    Value: {backend-app-client-secret}

  - Name: EntraFrontendClientId
    Value: {frontend-app-registration-client-id}

  - Name: ApplicationInsightsConnectionString
    Value: InstrumentationKey={instrumentation-key};...

  - Name: MicrosoftGraphClientId
    Value: {backend-app-registration-client-id}

  - Name: MicrosoftGraphClientSecret
    Value: {backend-app-client-secret}
```

### 5.6 CORS Configuration

**Development:**
```json
{
  "AllowedOrigins": [
    "http://localhost:5173",
    "https://localhost:5173"
  ],
  "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  "AllowedHeaders": ["*"],
  "AllowCredentials": true
}
```

**Production:**
```json
{
  "AllowedOrigins": [
    "https://inventory.diepenbeek.be",
    "https://swa-djoppie-prod-{unique}.azurestaticapps.net"
  ],
  "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  "AllowedHeaders": ["Authorization", "Content-Type"],
  "AllowCredentials": true
}
```

### 5.7 Security Best Practices

**Implemented:**
- HTTPS enforcement (TLS 1.2 minimum)
- JWT token validation
- CORS restrictions
- Key Vault for secrets
- Managed Identity (no credentials in code)
- SQL connection encryption

**Recommended Additions:**
- Rate limiting (AspNetCoreRateLimit)
- Request validation and sanitization
- Content Security Policy (CSP) headers
- X-Frame-Options, X-Content-Type-Options headers
- API versioning with deprecation strategy
- Audit logging for sensitive operations

---

## 6. Disaster Recovery & Business Continuity

### 6.1 Backup Strategy

**Azure SQL Database:**
```yaml
Automated Backups:
  Full Backup: Weekly
  Differential Backup: Every 12 hours
  Transaction Log Backup: Every 5-10 minutes
  Retention: 35 days (production), 7 days (dev)

Point-in-Time Restore:
  Granularity: Any second within retention period
  RTO (Recovery Time Objective): 1-2 hours
  RPO (Recovery Point Objective): < 10 minutes

Long-Term Retention (Optional):
  Weekly Backup: Keep for 10 weeks
  Monthly Backup: Keep for 12 months
  Yearly Backup: Keep for 5 years
  Cost: +€0.0678/GB/month
```

**Application Code:**
```yaml
Source Control: GitHub
Branches: main (production), develop (staging)
Protection: Branch policies on main
Backup: Git inherent redundancy
```

**Configuration:**
```yaml
App Settings: Azure App Service configuration
Secrets: Azure Key Vault (geo-redundant by default)
Infrastructure: Bicep templates in Git repository
```

### 6.2 High Availability

**App Service:**
```yaml
Availability Zones: Not available in S1 tier
SLA: 99.95% (Standard tier)
Multi-instance: Auto-scale 1-3 instances
Health Checks: /health endpoint (recommended)
Deployment Slots: Blue-green deployment (zero downtime)
```

**Azure SQL Database:**
```yaml
Zone Redundancy: Optional (+30% cost, GP tier)
SLA: 99.99% (without zone redundancy), 99.995% (with)
Automatic Failover: Built-in for zone redundancy
Connection Retry: Implemented in app (5 retries, 30s max delay)
```

**Static Web Apps:**
```yaml
CDN Distribution: Global edge locations
SLA: 99.95% (Standard tier)
Redundancy: Built-in via Azure CDN
```

### 6.3 Disaster Recovery Plan

**Geo-Replication (Production):**
```yaml
Primary Region: West Europe (Amsterdam)
Secondary Region: North Europe (Dublin)

SQL Geo-Replication:
  Type: Active geo-replication
  Secondary: Read-only replica
  Failover: Manual or automatic (auto-failover group)
  Data Lag: < 5 seconds typically

App Service:
  DR Strategy: Redeploy via CI/CD to secondary region
  DNS Failover: Azure Traffic Manager (optional)
  RTO: 30-60 minutes (manual failover)
```

**Failover Procedure:**
```
1. Incident Detection (monitoring alerts)
   ↓
2. Assess primary region status
   ↓
3. Initiate SQL failover to North Europe
   - Automatic: Auto-failover group triggers
   - Manual: Execute failover command
   ↓
4. Update DNS records (if needed)
   - Point API to secondary App Service
   - Or use Traffic Manager automatic failover
   ↓
5. Verify application functionality
   ↓
6. Monitor secondary region
   ↓
7. Failback to primary when restored
```

**RTO/RPO Targets:**
```yaml
Development:
  RTO: 4-8 hours (acceptable downtime)
  RPO: 1 hour (auto-pause may lose recent data)

Production:
  RTO: 1 hour (manual failover)
  RPO: < 5 minutes (geo-replication lag)

Production with Auto-Failover:
  RTO: 5-10 minutes (automatic)
  RPO: < 5 minutes
```

---

## 7. Monitoring & Observability

### 7.1 Application Insights Telemetry

**Automatic Collection:**
```yaml
Request Telemetry:
  - HTTP method, URL, response time
  - Status code, success/failure
  - User agent, client IP

Dependency Telemetry:
  - SQL queries (duration, success)
  - HTTP calls to Graph API
  - Redis cache operations (if used)

Exception Telemetry:
  - Exception type and message
  - Stack trace
  - Request context

Performance Counters:
  - CPU usage
  - Memory usage
  - Available memory
  - Request rate
```

**Custom Telemetry:**
```csharp
// Example: Track custom events
telemetryClient.TrackEvent("AssetScanned",
    new Dictionary<string, string> {
        { "AssetCode", assetCode },
        { "User", userId }
    });

// Track custom metrics
telemetryClient.TrackMetric("QRCodeGenerationTime", duration);
```

### 7.2 Alerts & Notifications

**Critical Alerts:**
```yaml
High Response Time:
  Metric: Response time > 2 seconds
  Window: 5 minutes
  Action: Email operations team

High Error Rate:
  Metric: HTTP 500 errors > 5% of requests
  Window: 5 minutes
  Action: Email + SMS

Database DTU Usage:
  Metric: DTU usage > 80%
  Window: 15 minutes
  Action: Email, consider scaling

App Service Down:
  Metric: Health check failure
  Window: 2 minutes
  Action: Email + SMS + auto-restart
```

**Warning Alerts:**
```yaml
Elevated Response Time:
  Metric: Response time > 1 second
  Window: 15 minutes

Increased Error Rate:
  Metric: HTTP 4xx/5xx > 2%
  Window: 10 minutes

High Memory Usage:
  Metric: Memory > 80%
  Window: 10 minutes
```

### 7.3 Dashboards

**Operations Dashboard:**
```yaml
Widgets:
  - Request rate (requests/minute)
  - Average response time (ms)
  - Error rate (%)
  - Active users (last 24 hours)
  - Database DTU usage (%)
  - App Service CPU/Memory (%)
  - Failed requests (last hour)
  - Top 10 slowest requests
```

**Business Dashboard:**
```yaml
Metrics:
  - Total assets in system
  - Assets scanned (last 24 hours)
  - Active users (daily/weekly/monthly)
  - QR codes generated
  - Most accessed assets
  - Asset creation trend
```

### 7.4 Log Analytics Queries

**Query Examples:**

```kusto
// Failed API requests in last hour
requests
| where timestamp > ago(1h)
| where success == false
| summarize count() by resultCode, name
| order by count_ desc

// Slow database queries
dependencies
| where type == "SQL"
| where duration > 1000 // > 1 second
| order by duration desc
| take 50

// User activity by hour
requests
| where timestamp > ago(24h)
| summarize requests = count() by bin(timestamp, 1h)
| render timechart

// Exception tracking
exceptions
| where timestamp > ago(24h)
| summarize count() by type, outerMessage
| order by count_ desc
```

### 7.5 Health Checks

**Implementation:**
```csharp
builder.Services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>("database")
    .AddAzureKeyVault(new Uri(keyVaultUrl), new DefaultAzureCredential(), "keyvault")
    .AddApplicationInsightsPublisher();

app.MapHealthChecks("/health");
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});
```

**Endpoints:**
- `/health` - Overall health status
- `/health/ready` - Readiness probe (Kubernetes-ready)

---

## 8. Cost Analysis

### 8.1 Monthly Cost Comparison

| Environment | Configuration | Monthly Cost (EUR) | Annual Cost (EUR) |
|-------------|--------------|-------------------|-------------------|
| **DEV (Minimal)** | F1 App Service, Serverless SQL | €6 - €8.50 | €72 - €102 |
| **DEV (Enhanced)** | B1 App Service, Serverless SQL | €18 - €21 | €216 - €252 |
| **PROD (Base)** | S1 App Service, Serverless SQL, Standard SWA | €140 - €160 | €1,680 - €1,920 |
| **PROD (Recommended)** | Base + Redis Cache | €155 - €175 | €1,860 - €2,100 |
| **PROD (Full)** | Recommended + DR + Entra P1 | €210 - €250 | €2,520 - €3,000 |

### 8.2 Cost Optimization Strategies

**Development:**
1. Use F1 Free App Service (€0 vs €13)
2. Enable SQL auto-pause (saves 60-70%)
3. Use free tier for Static Web Apps
4. Minimize Application Insights data ingestion

**Savings:** €100+ per month vs. paid tiers

**Production:**
1. Start with 1 App Service instance, scale as needed
2. Use Serverless SQL with auto-pause instead of provisioned
3. Enable Application Insights sampling (50-80%)
4. Reserve capacity for App Service (save 30-40%)

**Potential Savings:** €500+ per year with reserved capacity

### 8.3 Scaling Cost Impact

**Horizontal Scaling (App Service):**
```
1 instance (S1): €70/month
2 instances: €140/month (+100%)
3 instances: €210/month (+200%)
```

**Database Scaling:**
```
GP_S_Gen5_1 (0.5-1 vCore): €15-25/month
GP_S_Gen5_2 (1-2 vCore): €30-45/month (+80%)
GP_Gen5_2 (2 vCore provisioned): €180/month (+600%)
```

**Recommendation:** Use serverless SQL until consistent high load justifies provisioned tier.

### 8.4 Reserved Capacity Savings

**App Service Plan (1-year reservation):**
```
S1 Standard:
  Pay-as-you-go: €70/month = €840/year
  Reserved (1-year): €588/year
  Savings: €252/year (30%)

  Reserved (3-year): €420/year
  Savings: €420/year (50%)
```

**Recommendation:** Purchase reserved capacity after 3 months of stable production usage.

### 8.5 Traffic-Based Cost Projection

**Low Traffic (100 users, 10k requests/day):**
```
App Service: S1 × 1 instance = €70/month
SQL Database: GP_S_Gen5_1 = €20/month (low activity)
Application Insights: < 5 GB = €0 (free tier)
Total: ~€100/month
```

**Medium Traffic (500 users, 50k requests/day):**
```
App Service: S1 × 2 instances = €140/month
SQL Database: GP_S_Gen5_2 = €40/month
Application Insights: ~10 GB = €12/month
Redis Cache: C0 = €15/month
Total: ~€207/month
```

**High Traffic (2000 users, 200k requests/day):**
```
App Service: S2 × 3 instances = €630/month
SQL Database: GP_Gen5_2 (provisioned) = €180/month
Application Insights: ~30 GB = €60/month
Redis Cache: C1 = €60/month
Total: ~€930/month
```

---

## 9. Deployment Strategy

### 9.1 Environment Progression

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│     DEV     │ ───▶ │   STAGING   │ ───▶ │    PROD     │
│             │      │             │      │             │
│ - SQLite    │      │ - Azure SQL │      │ - Azure SQL │
│ - F1 Free   │      │ - Slot      │      │ - S1 Std    │
│ - Auto-     │      │ - Same as   │      │ - Auto-     │
│   deploy    │      │   PROD      │      │   scale     │
└─────────────┘      └─────────────┘      └─────────────┘
      ▲                    ▲                      ▲
      │                    │                      │
   Feature              Release                Manual
   Branches              Branch               Approval
```

### 9.2 CI/CD Pipeline Flow

```
Code Commit (GitHub)
      ↓
Azure DevOps Trigger
      ↓
Build Stage
  ├─ Frontend Build (npm run build)
  ├─ Backend Build (dotnet build)
  └─ Run Tests (dotnet test)
      ↓
Artifact Publishing
  ├─ Frontend Artifact (dist/)
  └─ Backend Artifact (published/)
      ↓
Deploy to DEV (automatic)
      ↓
Integration Tests (DEV)
      ↓
Deploy to STAGING (automatic on develop branch)
      ↓
Smoke Tests (STAGING)
      ↓
Manual Approval Gate
      ↓
Deploy to PROD (blue-green via deployment slot)
      ↓
Health Check Verification
      ↓
Slot Swap (staging → production)
      ↓
Post-deployment Validation
```

---

## Summary & Recommendations

### Development Environment
- **Target Cost:** €6-8.50/month
- **Best for:** Development, testing, CI/CD validation
- **Key Features:** F1 Free App Service, Serverless SQL with auto-pause, Free Static Web App

### Production Environment (Initial)
- **Target Cost:** €140-160/month
- **Best for:** 100-500 users, 10-50k requests/day
- **Configuration:** S1 App Service (1 instance), GP_S_Gen5_2 SQL, Standard Static Web App, Redis Basic

### Production Environment (Scaled)
- **Target Cost:** €210-250/month
- **Best for:** 500-2000 users, 50-200k requests/day
- **Configuration:** S1 App Service (2-3 instances), GP_S_Gen5_2 SQL with geo-replication, Redis Standard, Entra P1

### Next Steps
1. Deploy DEV environment using Bicep templates
2. Validate functionality and costs
3. Deploy PROD environment (start with base configuration)
4. Monitor usage for 1-3 months
5. Scale resources based on actual traffic patterns
6. Consider reserved capacity after stable usage

---

**Document Version:** 1.0
**Last Updated:** January 27, 2026
**Next Review:** After DEV deployment completion

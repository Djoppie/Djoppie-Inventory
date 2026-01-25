# Djoppie Inventory - Azure DevOps Wiki Handleidingen

**Versie:** 1.0
**Datum:** Januari 2026
**Auteur:** Claude Code (onder supervisie van Jo Wijnen)
**Taal:** Nederlands

---

## Overzicht

Deze Wiki bevat complete, stap-voor-stap handleidingen voor het deployen en beheren van het Djoppie Inventory systeem op Microsoft Azure met Azure DevOps CI/CD pipelines.

### Doelgroep

- **DevOps Engineers** - Voor infrastructuur setup en pipeline configuratie
- **Developers** - Voor lokale ontwikkeling en deployment workflows
- **IT Managers** - Voor overzicht van architectuur en kosten
- **Operations** - Voor monitoring en troubleshooting
- **Eindgebruikers** - Voor dagelijks gebruik van de applicatie (IT-ondersteuning, voorraadbeheer)

---

## Handleidingen Index

### [00 - Overzicht](00-Overzicht.md)
**Start hier voor complete systeemoverzicht**

Inhoud:
- Projectomschrijving en doelstellingen
- High-level architectuur diagram
- Technologie stack overzicht (Frontend, Backend, Database, Azure Services)
- Kernfunctionaliteiten (QR scanning, Intune integratie, Asset management)
- Systeemcomponenten en hun interacties
- Kostenoverzicht (DEV: ~€15-20/maand, PROD: ~€125-185/maand)
- Integraties (Entra ID, Microsoft Graph/Intune)

**Geschatte leestijd:** 20 minuten

---

### [01 - Omgevingen en Branching Strategie](01-Omgevingen-en-Branching.md)
**Essentieel voor development workflow**

Inhoud:
- Drie omgevingen: Local, DEV, PROD
- Lokale ontwikkelomgeving setup (prerequisites, frontend/backend configuratie)
- DEV omgeving configuratie en deployment
- PROD omgeving configuratie en deployment
- Git repository structuur
- Branching strategie (feature, bugfix, hotfix branches)
- Pull Request proces en code review workflows
- Commit message conventies (Conventional Commits)

**Geschatte tijd:** 1-2 uur voor lokale setup, 30 minuten voor begrip van strategie

---

### [02 - Azure Infrastructuur Setup](02-Azure-Infrastructuur-Setup.md)
**Critical path voor cloud deployment**

Inhoud:
- Azure subscription vereisten en permissions
- Resource naming conventies
- Bicep Infrastructure as Code templates
- Stap-voor-stap deployment met Azure CLI
- Resource configuratie (App Service, Static Web Apps, Key Vault)
- Netwerk en beveiliging (firewall rules, managed identities, HTTPS enforcement)
- Verificatie procedures
- Troubleshooting (deployment failures, permission issues)

**Geschatte tijd:** 2-3 uur voor volledige setup (DEV + PROD)

---

### [03 - Microsoft Entra ID Configuratie](03-Entra-ID-Setup.md)
**Vereist voor authenticatie en autorisatie**

Inhoud:
- Entra ID (Azure AD) architectuur en authentication flow
- Backend API App Registration setup (exposed API, scopes, client secrets)
- Frontend SPA App Registration setup (redirect URIs, permissions)
- Microsoft Graph API permissions voor Intune integratie
- Admin consent verlenen
- Service Principal configuratie
- App Roles en user assignments (optioneel)
- Testing en verificatie (token validation, Graph API calls)
- Security best practices (secret rotation, permission scoping)

**Geschatte tijd:** 1-2 uur (kan geautomatiseerd worden met PowerShell script)

---

### [04 - Azure DevOps Deployment](04-Azure-DevOps-Deployment.md)
**CI/CD pipeline automation**

Inhoud:
- Azure DevOps project setup en permissions
- Service Connections configureren (naar Azure subscription)
- Variable Groups aanmaken (secrets, configuration)
- Pipeline YAML configuratie (4 stages: Build, Infrastructure, Deploy, Test)
- Environment setup met approval gates (DEV automatisch, PROD met approval)
- DEV deployment workflow (develop branch)
- PROD deployment workflow (main branch met approvals)
- Advanced configuratie (deployment slots, rollback, scheduled deployments)
- Troubleshooting (build failures, deployment errors, permission issues)

**Geschatte tijd:** 2-3 uur voor volledige pipeline setup

---

### [05 - Database & Entity Framework](05-Database-Setup.md)
**Data layer configuratie**

Inhoud:
- Database opties (SQLite voor DEV, Azure SQL voor PROD)
- Entity Framework Core setup en DbContext configuratie
- Database migrations (create, apply, rollback)
- Seed data strategieën
- Connection string management (User Secrets, Key Vault integration)
- Backup en restore procedures (SQLite manual, Azure SQL automatic)
- Performance optimalisatie (indexing, query optimization, connection pooling)
- Troubleshooting (migration errors, connection issues, performance problems)

**Geschatte tijd:** 1-2 uur voor setup, 30 minuten voor begrip

---

### [06 - Monitoring & Troubleshooting](06-Monitoring-en-Troubleshooting.md)
**Operational excellence en diagnostics**

Inhoud:
- Application Insights setup en verificatie
- Log Analytics en Kusto Query Language (KQL)
- Essential queries (requests, exceptions, dependencies, performance)
- Performance monitoring (Application Map, slow queries, infrastructure metrics)
- Error tracking (exception dashboard, failure analysis)
- Availability monitoring (health checks, uptime percentage)
- Alerting en notifications (email, webhook integrations)
- Common issues en oplossingen (performance, authentication, database, CORS)
- Best practices (structured logging, custom metrics, correlation IDs, health checks)
- Custom workbooks en dashboards

**Geschatte tijd:** 1 uur voor setup, ongoing voor operaties

---

### [07 - Gebruikershandleiding](07-Gebruikershandleiding.md)
**Complete handleiding voor eindgebruikers**

Inhoud:
- Projectoverzicht en belangrijkste functies
- Inloggen met Microsoft Entra ID (stap voor stap)
- QR-code scannen en activa opzoeken
- Activa beheren (toevoegen, bewerken, verwijderen)
- Dashboard gebruiken met filters en statistieken
- Microsoft Intune integratie uitleg
- Veelvoorkomende werkstromen (5 praktische scenario's)
- Uitgebreide probleemoplossing
- 25+ veelgestelde vragen (FAQ)
- Contact en ondersteuning
- Best practices voor dagelijks gebruik

**Doelgroep:** IT-ondersteuningsmedewerkers, voorraadbeheerders, facilitair medewerkers
**Geschatte leestijd:** 30-45 minuten

---

## Quick Start Guide

### Voor Nieuwe Developers

1. **Start met overzicht** - Lees [00-Overzicht.md](00-Overzicht.md) voor begrip van systeem
2. **Setup lokale omgeving** - Volg [01-Omgevingen-en-Branching.md](01-Omgevingen-en-Branching.md) sectie "Lokale Ontwikkelomgeving"
3. **Clone repository** en configureer frontend/backend
4. **Start developing!**

### Voor DevOps/Infrastructure Engineers

1. **Azure subscription voorbereiden** - Zorg voor Contributor access
2. **Entra ID configuratie** - Volg [03-Entra-ID-Setup.md](03-Entra-ID-Setup.md) met PowerShell script
3. **Deploy infrastructuur** - Gebruik [02-Azure-Infrastructuur-Setup.md](02-Azure-Infrastructuur-Setup.md) met Bicep
4. **Configure pipeline** - Setup via [04-Azure-DevOps-Deployment.md](04-Azure-DevOps-Deployment.md)
5. **Database migrations** - Volg [05-Database-Setup.md](05-Database-Setup.md)
6. **Enable monitoring** - Configure via [06-Monitoring-en-Troubleshooting.md](06-Monitoring-en-Troubleshooting.md)

**Totale setup tijd:** ~6-8 uur voor complete environment (DEV + PROD)

### Voor Eindgebruikers

1. **Start met overzicht** - Lees [07-Gebruikershandleiding.md](07-Gebruikershandleiding.md) voor inleiding
2. **Eerste login** - Volg de instructies voor inloggen met Microsoft Entra ID
3. **Verken de interface** - Dashboard, Scannen, en Activa toevoegen
4. **Probeer QR scannen** - Test de QR-code scanner functionaliteit
5. **Bekijk FAQ** - Veelgestelde vragen voor veel voorkomende situaties

**Leestijd:** ~30-45 minuten

---

## Deployment Volgorde

**Aanbevolen volgorde voor first-time deployment:**

```
1. Entra ID Setup (Handleiding 3)
   ↓
2. Azure Infrastructuur - DEV (Handleiding 2)
   ↓
3. Database Setup - DEV (Handleiding 5)
   ↓
4. Azure DevOps Pipeline (Handleiding 4)
   ↓
5. Test deployment naar DEV
   ↓
6. Monitoring Setup - DEV (Handleiding 6)
   ↓
7. Azure Infrastructuur - PROD (Handleiding 2)
   ↓
8. Database Setup - PROD (Handleiding 5)
   ↓
9. Test deployment naar PROD
   ↓
10. Monitoring Setup - PROD (Handleiding 6)
```

---

## Technologie Stack Reference

### Frontend
- React 19 + TypeScript
- Vite 7 (build tool)
- Material-UI 7 (components)
- MSAL React 5 (authentication)
- TanStack Query 5 (data fetching)
- html5-qrcode 2 (QR scanning)
- i18next 25 (internationalization)

### Backend
- ASP.NET Core 8.0 (Web API)
- C# 12
- Entity Framework Core 8
- Microsoft.Identity.Web (Entra ID)
- Microsoft.Graph (Intune API)
- Serilog (logging)
- Swashbuckle (OpenAPI/Swagger)

### Infrastructure
- Azure App Service (B1/P1V3 Linux)
- Azure Static Web Apps (Free/Standard)
- Azure SQL Database (Basic/S1) of SQLite
- Azure Key Vault (Standard)
- Application Insights (Pay-as-you-go)
- Log Analytics Workspace
- Microsoft Entra ID (authentication)

### DevOps
- Azure DevOps Pipelines (YAML)
- Bicep (Infrastructure as Code)
- Git (version control)
- Azure CLI (automation)
- PowerShell 7 (scripting)

---

## Kostenoverzicht

### Development Omgeving
| Service | Tier | Maandelijkse Kosten |
|---------|------|---------------------|
| App Service Plan | B1 | €12 |
| Static Web App | Free | €0 |
| Key Vault | Standard | €0.50 |
| Application Insights | Pay-as-you-go | €2-5 |
| Log Analytics | Pay-as-you-go | €0-3 |
| **Totaal** | | **€15-20** |

### Production Omgeving
| Service | Tier | Maandelijkse Kosten |
|---------|------|---------------------|
| App Service Plan | P1V3 (2 instances) | €80-120 |
| Static Web App | Standard | €9 |
| Azure SQL Database | S1 | €20 |
| Key Vault | Standard | €0.50 |
| Application Insights | Pay-as-you-go | €10-20 |
| Log Analytics | Pay-as-you-go | €5-15 |
| **Totaal** | | **€125-185** |

*Prijzen zijn schattingen gebaseerd op West Europe regio, januari 2026*

**Bespaartips:**
- Gebruik SQLite in DEV (bespaart €20/maand Azure SQL kosten)
- Stop DEV resources buiten werkuren (60% kostenbesparing)
- Gebruik Free tier Static Web Apps voor DEV
- Implement Application Insights sampling voor grote volumes

---

## Veelgestelde Vragen (FAQ)

### Deployment

**Q: Kan ik dit deployen naar een andere cloud provider?**
A: De handleidingen zijn specifiek voor Azure. Voor AWS/GCP is substantiële aanpassing nodig (andere services, andere IaC tooling).

**Q: Moet ik PROD dezelfde dag als DEV deployen?**
A: Nee, start met DEV, test grondig, en deploy PROD pas als DEV stabiel is (1-2 weken later).

**Q: Kan ik een Staging omgeving toevoegen?**
A: Ja! Kopieer de DEV Bicep parameters, maak `staging.bicepparam`, en voeg staging environment toe aan pipeline.

### Kosten

**Q: Hoe kan ik kosten verlagen voor development?**
A: Gebruik SQLite ipv Azure SQL (bespaart €20/maand), stop resources na werkuren, gebruik Free tier Static Web Apps.

**Q: Wat als ik budget overschrijd?**
A: Setup cost alerts in Azure (via Budget blade), ontvang notifications bij 80% en 100% van budget.

### Technisch

**Q: Waarom SQLite voor DEV en Azure SQL voor PROD?**
A: SQLite is gratis, eenvoudig, en voldoende voor development. Azure SQL biedt enterprise features (backups, scaling, HA) voor productie.

**Q: Kan ik PostgreSQL gebruiken ipv Azure SQL?**
A: Ja, Azure Database for PostgreSQL is mogelijk. Pas EF Core provider aan (`UseSqlServer` → `UseNpgsql`).

**Q: Moet ik twee Entra ID app registrations hebben (DEV/PROD)?**
A: Ja (best practice voor security en isolation), maar je kunt ook één registration gebruiken met verschillende redirect URIs.

### Workflow

**Q: Hoe maak ik een hotfix voor PROD?**
A: Branch van `main`, fix het issue, test lokaal, create PR naar `main` EN `develop`, deploy via pipeline.

**Q: Kan ik direct naar PROD deployen zonder DEV?**
A: Technisch wel (push naar main branch), maar **sterk afgeraden** - always test in DEV first.

**Q: Hoe rollback ik een slechte deployment?**
A: Redeploy vorige succesvolle pipeline run, of gebruik deployment slot swap (PROD met staging slots).

---

## Troubleshooting Index

### Deployment Failures
- **Bicep validation errors** → Handleiding 2, sectie Troubleshooting
- **Pipeline authentication fails** → Handleiding 4, sectie Service Connections
- **Resource already exists** → Handleiding 2, delete resource of wijzig naam

### Authentication Issues
- **401 Unauthorized** → Handleiding 3, sectie Testing & Troubleshooting
- **CORS errors** → Handleiding 6, Common Issues sectie
- **Token validation fails** → Handleiding 3, sectie Token Validation Errors

### Database Issues
- **Migration fails** → Handleiding 5, sectie Troubleshooting
- **Connection string errors** → Handleiding 5, sectie Connection String Management
- **Slow queries** → Handleiding 5, sectie Performance Optimalisatie

### Performance
- **Slow API responses** → Handleiding 6, sectie Performance Monitoring
- **High memory usage** → Handleiding 6, sectie Common Issues
- **Database timeouts** → Handleiding 5, sectie Performance Optimalisatie

---

## Maintenance Checklist

### Weekly
- [ ] Review Application Insights dashboard voor errors
- [ ] Check failed requests en address issues
- [ ] Monitor resource utilization (CPU, memory)
- [ ] Review deployment pipeline success rate

### Monthly
- [ ] Review Azure costs en optimize waar mogelijk
- [ ] Check for dependency updates (NuGet, npm)
- [ ] Review security advisories
- [ ] Test backup restore procedures

### Quarterly
- [ ] Rotate Entra ID client secrets
- [ ] Update certificates (indien gebruikt)
- [ ] Review en update dependencies
- [ ] Conduct disaster recovery drill
- [ ] Review access control (remove ex-employees)

### Annually
- [ ] Review architecture voor improvements
- [ ] Conduct security audit
- [ ] Update documentatie
- [ ] Evaluate new Azure services/features

---

## Resources en Links

### Officiële Documentatie
- **ASP.NET Core**: https://learn.microsoft.com/aspnet/core
- **React**: https://react.dev
- **Azure Documentation**: https://learn.microsoft.com/azure
- **Microsoft Graph API**: https://learn.microsoft.com/graph
- **Entity Framework Core**: https://learn.microsoft.com/ef/core
- **Azure DevOps**: https://learn.microsoft.com/azure/devops

### Project Specifiek
- **Repository**: https://github.com/Djoppie/Djoppie-Inventory.git
- **Azure Portal**: https://portal.azure.com
- **Entra ID Portal**: https://entra.microsoft.com
- **Intune Portal**: https://intune.microsoft.com
- **Azure DevOps**: https://dev.azure.com/Diepenbeek

### Tools
- **.NET SDK**: https://dotnet.microsoft.com/download
- **Node.js**: https://nodejs.org
- **Azure CLI**: https://aka.ms/InstallAzureCLIDirect
- **PowerShell 7**: https://github.com/PowerShell/PowerShell
- **Visual Studio Code**: https://code.visualstudio.com
- **Git**: https://git-scm.com

---

## Contact en Support

### Primary Contact
- **Naam**: Jo Wijnen
- **Email**: jo.wijnen@diepenbeek.be
- **Rol**: Lead Developer / DevOps Engineer
- **Organisatie**: Gemeente Diepenbeek

### Support Kanalen
1. **Technical Issues**: Create issue in GitHub repository
2. **Urgent Production Issues**: Email jo.wijnen@diepenbeek.be
3. **Questions**: Teams channel (indien beschikbaar)
4. **Documentation Feedback**: Pull request in repo

---

## Changelog

### Versie 1.0 (2026-01-18)
- Initiële release van alle zes handleidingen
- Complete deployment documentatie van scratch tot productie
- Nederlandstalige versie voor Diepenbeek team
- Gebaseerd op infrastructure-simple Bicep templates

### Geplande Updates
- Versie 1.1: Handleiding voor Azure Monitor Workbooks
- Versie 1.2: Advanced security hardening guide
- Versie 1.3: Multi-region deployment guide (indien vereist)
- Versie 1.4: Disaster Recovery en Business Continuity

---

## Licentie en Gebruik

Deze handleidingen zijn eigendom van **Gemeente Diepenbeek** en bedoeld voor intern gebruik bij het Djoppie Inventory project.

**Gebruik:**
- Intern delen binnen Diepenbeek organisatie: Toegestaan
- Aanpassen voor organisatie specifieke behoeften: Toegestaan
- Extern delen zonder toestemming: Niet toegestaan
- Commercieel gebruik: Niet toegestaan

Voor vragen over licentie: contact jo.wijnen@diepenbeek.be

---

**Wiki Versie:** 1.0
**Laatste Update:** 2026-01-18
**Auteur:** Claude Code (AI Assistant) onder supervisie van Jo Wijnen

**Alle handleidingen zijn klaar voor publicatie in Azure DevOps Wiki!**

---

## Publiceren naar Azure DevOps Wiki

Deze handleidingen kunnen gepubliceerd worden naar Azure DevOps Wiki:

1. **Navigate**: Azure DevOps > Djoppie-Inventory project > Overview > Wiki
2. **Option 1 - Publish Code as Wiki**:
   - Click "Publish code as wiki"
   - Select repository: Djoppie-Inventory
   - Branch: main
   - Folder: /docs/wiki
   - Wiki name: Djoppie Inventory Deployment Handleidingen

3. **Option 2 - Manual Copy**:
   - Create new Wiki
   - Copy/paste content van elke .md file
   - Maintain structure en links

**Let op:** Interne links tussen handleidingen werken automatisch in Azure DevOps Wiki!

---

**Happy Deploying! 🚀**

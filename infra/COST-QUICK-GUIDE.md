# Azure Kosten Optimalisatie - Quick Guide

> **TL;DR**: DEV omgeving kan van €56-60/maand naar €28-33/maand (43% besparing) zonder significante functionaliteitsverlies.

---

## Drie Scenario's in Vogelvlucht

| | Minimaal | **Budget** ⭐ | Huidig |
|---|---|---|---|
| **Kosten** | €5-10/m | **€28-33/m** | €56-60/m |
| **Besparing** | €47-52/m | **€24-29/m** | - |
| **Performance** | Basis | Goed | Excellent |
| **Cold Starts** | DB + App | Alleen DB (2h) | Geen |
| **Geschikt voor** | Hobby/test | **DEV teams** | Staging/Prod |

---

## Aanbevolen: Scenario 2 (Budget)

### Wat wijzigt er?

| Resource | Van → Naar | Impact |
|----------|-----------|--------|
| **App Service** | B2 → B1 | 2 cores → 1 core (voldoende voor DEV) |
| **SQL Database** | Basic → Serverless | Auto-pause na 2u inactiviteit |
| **Monitoring** | Onbeperkt → Optimized | Beperkte telemetry sampling |

### Wat betekent dit voor developers?

**Positief**:
- ✅ Alle functionaliteit werkt normaal
- ✅ Always-On blijft beschikbaar (app slaapt niet)
- ✅ Moderne Serverless SQL (production-ready)
- ✅ €336/jaar besparing

**Let op**:
- ⚠️ Eerste database query na 2u inactiviteit duurt 2-5 seconden
- ⚠️ Iets minder CPU beschikbaar (1 core vs 2, maar voldoende)

### Implementatie in 3 Stappen

```powershell
# 1. Preview changes (geen wijzigingen)
cd infrastructure/scripts
.\deploy-budget-dev.ps1 -WhatIf

# 2. Deploy (5-10 minuten downtime)
.\deploy-budget-dev.ps1

# 3. Verifieer na 1 week
# Check: Azure Portal → Cost Management
# Verwacht: €6-8 eerste week
```

---

## Kosten Breakdown Budget Scenario

| Resource | Maand | Jaar |
|----------|-------|------|
| App Service B1 | €12 | €144 |
| SQL Serverless | €15-20 | €180-240 |
| Static Web App | €0 | €0 |
| Key Vault | €1 | €12 |
| App Insights | €0 | €0 |
| Log Analytics | €0 | €0 |
| **TOTAAL** | **€28-33** | **€336-396** |

**Huidige kosten**: €57-62/maand (€684-744/jaar)
**Besparing**: €24-29/maand (€288-348/jaar)

---

## SQL Serverless - Wat moet je weten?

### Hoe werkt het?

- Database actief tijdens gebruik (betaal per seconde)
- Auto-pause na **2 uur** inactiviteit (betaal niets tijdens pauze)
- Cold start bij eerste query na pause: **2-5 seconden**
- Daarna normale performance

### Wanneer pauzeer je?

- 's Nachts tussen 23:00 - 08:00 (bespaar ~9u/dag)
- Weekenden (bespaar ~48u/weekend)
- **Geschat**: 60-70% van de tijd gepauzeerd = grote kostenbesparing

### Wat als cold starts vervelend zijn?

Zet auto-pause uit (in Bicep: `autoPauseDelay: -1`):
- Kosten: €60-80/maand (vs €15-20 met auto-pause)
- Geen cold starts meer
- Nog steeds auto-scaling voordelen

---

## App Service B1 vs B2

| Specificatie | B1 | B2 (Huidig) |
|--------------|----|----|
| Kosten | €12/m | €36/m |
| CPU Cores | 1 | 2 |
| RAM | 1.75 GB | 3.5 GB |
| Always-On | ✅ Ja | ✅ Ja |
| Geschikt voor | DEV | Staging/Prod |

**Is B1 genoeg?**
- ✅ Ja voor development (< 10 concurrent users)
- ✅ Ja voor testing
- ❌ Niet voor load testing
- ❌ Niet voor staging met production load

---

## Veelgestelde Vragen

### Q: Is er data verlies bij migratie?
**A**: Nee. Database data blijft intact. Alleen compute tier wijzigt.

### Q: Hoeveel downtime?
**A**: 5-10 minuten tijdens deployment.

### Q: Kan ik terugdraaien?
**A**: Ja, binnen 10 minuten. Deploy gewoon oude configuratie opnieuw.

### Q: Impact op CI/CD pipeline?
**A**: Geen. Deployment targets blijven hetzelfde.

### Q: Wanneer kies ik Scenario 1 (Minimaal €5-10/m)?
**A**: Als je:
- Zeer beperkt budget hebt
- < 10 uur/week development doet
- Cold starts van 5+ seconden acceptabel vindt

---

## Beslisboom

```
Wil je kosten verlagen voor DEV omgeving?
│
├─ Nee → Blijf bij huidige configuratie
│
└─ Ja → Hoeveel gebruik je DEV omgeving?
    │
    ├─ Weinig (< 10u/week)
    │   └─ Kies: Scenario 1 (Minimaal €5-10/m)
    │       • Maximale besparing
    │       • App + DB kunnen slapen
    │
    └─ Dagelijks gebruik
        └─ Kies: Scenario 2 (Budget €28-33/m) ⭐
            • Beste balans
            • Goede developer experience
            • Significante besparing
```

---

## Direct Starten

### Optie A: Gebruik deployment script (Aanbevolen)

```powershell
cd C:/Users/jowij/VSCodeDiepenbeek/Djoppie/Djoppie-Inventory/Djoppie-Inventory/infrastructure/scripts

# Preview
.\deploy-budget-dev.ps1 -WhatIf

# Deploy
.\deploy-budget-dev.ps1
```

### Optie B: Handmatige deployment

```bash
cd infrastructure

# What-if
az deployment sub what-if \
  --location westeurope \
  --template-file main.bicep \
  --parameters parameters/dev.bicepparam

# Deploy
az deployment sub create \
  --location westeurope \
  --template-file main.bicep \
  --parameters parameters/dev.bicepparam \
  --name djoppie-dev-budget
```

---

## Na Deployment: Monitoring Checklist

### Week 1
- [ ] Check cost in Azure Portal (verwacht: €6-8)
- [ ] Monitor cold starts in Application Insights
- [ ] Verifieer health endpoint werkt
- [ ] Test typical development workflows

### Week 2-4
- [ ] Review maandelijkse kosten (verwacht: €28-33)
- [ ] Besluit: blijven of terugdraaien?

### Maandelijks
- [ ] Check Azure Cost Management dashboard
- [ ] Alert bij > €40/maand

---

## Support

- **Volledige documentatie**: `infrastructure/COST-OPTIMIZATION.md`
- **Bicep templates**: `infrastructure/modules/infrastructure-budget.bicep`
- **Contact**: jo.wijnen@diepenbeek.be

---

**Laatste update**: 2026-01-18

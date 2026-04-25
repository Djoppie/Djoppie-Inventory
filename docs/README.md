# Documentation Tree

Single index for every doc in the repo. Start here.

> Canonical entry points live at the repo root: [README](../README.md) (overview), [DEVELOPMENT](../DEVELOPMENT.md) (setup), [ARCHITECTURE](../ARCHITECTURE.md) (system design), [CLAUDE](../CLAUDE.md) (verbose agent guide).

---

## Top-level

| File | What it covers |
|------|----------------|
| [README.md](../README.md) | Project pitch, live URLs, quick links |
| [DEVELOPMENT.md](../DEVELOPMENT.md) | Local install, Azure DEV deploy, common workflows, troubleshooting |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Compact system overview (≈10 sections) |
| [CLAUDE.md](../CLAUDE.md) | Detailed instructions for AI agents working on this repo |

---

## Reference Docs (`docs/`)

### Architecture & Data

| File | What it covers |
|------|----------------|
| [BACKEND-ARCHITECTURE.md](BACKEND-ARCHITECTURE.md) | Deep dive on backend layout, ER diagrams per feature |
| [DATA-MODEL.md](DATA-MODEL.md) | Full entity / enum reference, mermaid ERD |
| [API-REFERENCE.md](API-REFERENCE.md) | REST endpoint reference (request/response shapes) |
| [GRAPH-API.md](GRAPH-API.md) | Microsoft Graph / Intune integration, required permissions |

### Features

| File | What it covers |
|------|----------------|
| [FEATURES.md](FEATURES.md) | Functional feature catalogue |
| [RELEASE-FEATURES.md](RELEASE-FEATURES.md) | Per-release feature notes |
| [ROLLOUT-WORKFLOW-GUIDE.md](ROLLOUT-WORKFLOW-GUIDE.md) | Rollout planner / execution / reporting walkthrough (NL) |
| [USER-GUIDE.md](USER-GUIDE.md) | End-user usage guide |

### UI & Design

| File | What it covers |
|------|----------------|
| [COMPACT-DESIGN-PATTERNS.md](COMPACT-DESIGN-PATTERNS.md) | Reusable compact-UI patterns (filters, dense tables) |
| [DJOPPIE-NEOMORPH-STYLE-GUIDE.md](DJOPPIE-NEOMORPH-STYLE-GUIDE.md) | Neumorphic admin styling rules |
| [IN-APP-DOCUMENTATION-GUIDE.md](IN-APP-DOCUMENTATION-GUIDE.md) | How to add tooltips / guided tours / help drawers |
| [PERFORMANCE-OPTIMIZATIONS.md](PERFORMANCE-OPTIMIZATIONS.md) | Render & query optimization patterns applied |

### Wiki (Azure DevOps-publishable)

Structured documentation suitable for publishing as a code wiki.

| Section | Files |
|---------|-------|
| [User Guide](wiki/User-Guide/) | Getting Started · Managing Assets · Printing Labels · Exporting Data |
| [Administrator Guide](wiki/Administrator-Guide/) | Installation · Entra Configuration · Deployment · Key Vault · Troubleshooting |
| [Technical Reference](wiki/Technical-Reference/) | Architecture |
| [wiki/README.md](wiki/README.md) | Wiki index + Azure DevOps publish instructions |

### Testing

| File | What it covers |
|------|----------------|
| [testing/QUICK-TEST-GUIDE.md](testing/QUICK-TEST-GUIDE.md) | Smoke-test recipes |
| [testing/ROLLOUT-TEST-PLAN.md](testing/ROLLOUT-TEST-PLAN.md) | Rollout-specific test plan |
| [testing/TEST-CHECKLIST.md](testing/TEST-CHECKLIST.md) | Pre-release manual QA checklist |

### Plans & Specs (`docs/superpowers/`)

Historical planning artefacts kept for context. Newest first.

| File | What it covers |
|------|----------------|
| [plans/2026-04-23-reports-consolidation.md](superpowers/plans/2026-04-23-reports-consolidation.md) | Reports consolidation execution plan (PR1–PR4) |
| [specs/2026-04-23-reports-consolidation-design.md](superpowers/specs/2026-04-23-reports-consolidation-design.md) | Reports consolidation design |
| [plans/2026-04-12-codebase-cleanup-reorganization.md](superpowers/plans/2026-04-12-codebase-cleanup-reorganization.md) | Codebase reorg plan |
| [specs/2026-04-12-codebase-cleanup-reorganization-design.md](superpowers/specs/2026-04-12-codebase-cleanup-reorganization-design.md) | Codebase reorg design |
| [plans/2026-04-10-intune-device-dashboard.md](superpowers/plans/2026-04-10-intune-device-dashboard.md) | Intune dashboard plan |
| [specs/2026-04-10-intune-device-dashboard-design.md](superpowers/specs/2026-04-10-intune-device-dashboard-design.md) | Intune dashboard design |

---

## Operational Docs (outside `docs/`)

| File | What it covers |
|------|----------------|
| [.azuredevops/README.md](../.azuredevops/README.md) | Azure DevOps pipeline setup |
| [scripts/README.md](../scripts/README.md) | Per-script usage for `add-azure-redirect-uri`, `verify-entra-permissions`, deploy helpers, DB reset, etc. |
| [scripts/db/README-RESET-SEED.md](../scripts/db/README-RESET-SEED.md) | Reset-and-seed reference data |
| [scripts/db/AZURE-SQL-COMMANDS.md](../scripts/db/AZURE-SQL-COMMANDS.md) | Useful Azure SQL queries |
| [scripts/db/QUICK-REFERENCE-RESET.md](../scripts/db/QUICK-REFERENCE-RESET.md) | One-page DB reset cheat-sheet |

---

## Quick "I want to…" Lookup

| Goal | Open |
|------|------|
| Run the app locally | [DEVELOPMENT §3–5](../DEVELOPMENT.md#3-backend-local) |
| Deploy to Azure DEV | [DEVELOPMENT §6](../DEVELOPMENT.md#6-azure-dev-deployment) or [Administrator-Guide/03-Deployment](wiki/Administrator-Guide/03-Deployment.md) |
| Fix a 401 / auth issue | [DEVELOPMENT §9](../DEVELOPMENT.md#9-troubleshooting) and [wiki/Administrator-Guide/05-Troubleshooting](wiki/Administrator-Guide/05-Troubleshooting.md) |
| Rotate a Key Vault secret | [wiki/Administrator-Guide/04-Key-Vault](wiki/Administrator-Guide/04-Key-Vault.md) |
| Add a new entity / endpoint / page | [DEVELOPMENT §8](../DEVELOPMENT.md#8-common-workflows) |
| Understand the rollout flow | [ROLLOUT-WORKFLOW-GUIDE](ROLLOUT-WORKFLOW-GUIDE.md) |
| Pick the right MUI styling | [COMPACT-DESIGN-PATTERNS](COMPACT-DESIGN-PATTERNS.md), [DJOPPIE-NEOMORPH-STYLE-GUIDE](DJOPPIE-NEOMORPH-STYLE-GUIDE.md) |

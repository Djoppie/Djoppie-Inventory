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

Active developer reference. End-user / admin docs live under [`docs/wiki/`](#wiki-azure-devops-publishable).

| File | What it covers |
|------|----------------|
| [BACKEND-ARCHITECTURE.md](BACKEND-ARCHITECTURE.md) | Deep-dive on backend layout, ER diagrams per feature |
| [DATA-MODEL.md](DATA-MODEL.md) | Full entity / enum reference, mermaid ERD |
| [GRAPH-API.md](GRAPH-API.md) | Microsoft Graph / Intune integration, required permissions |
| [COMPACT-DESIGN-PATTERNS.md](COMPACT-DESIGN-PATTERNS.md) | Reusable compact-UI patterns (filters, dense tables) |
| [DJOPPIE-NEOMORPH-STYLE-GUIDE.md](DJOPPIE-NEOMORPH-STYLE-GUIDE.md) | Neumorphic admin styling rules |

> REST endpoint reference: live Swagger UI at `/swagger` (e.g. <http://localhost:5052/swagger>).

---

## Wiki (Azure DevOps-publishable)

Structured end-user / admin / architecture documentation under [`docs/wiki/`](wiki/). Suitable for publishing as an Azure DevOps code wiki — see [wiki/README.md](wiki/README.md) for the publish flow.

| Section | Files |
|---------|-------|
| [User Guide](wiki/User-Guide/) | Getting Started · Assets beheren · Labels · Export · Rollout · Werkplekken · Rapporten (NL) |
| [Administrator Guide](wiki/Administrator-Guide/) | Installation · Entra Configuration · Deployment · Key Vault · Troubleshooting |
| [Technical Reference](wiki/Technical-Reference/) | Architecture |

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
| Understand the rollout flow | [wiki/User-Guide/05-Rollout-Workflow](wiki/User-Guide/05-Rollout-Workflow.md) |
| Pick the right MUI styling | [COMPACT-DESIGN-PATTERNS](COMPACT-DESIGN-PATTERNS.md), [DJOPPIE-NEOMORPH-STYLE-GUIDE](DJOPPIE-NEOMORPH-STYLE-GUIDE.md) |

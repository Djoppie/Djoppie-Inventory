# Djoppie Inventory - Wiki Documentation

> Official documentation for the Djoppie Inventory asset management system.
> These documents are structured for use in the Azure DevOps Wiki.

---

## Wiki Documents

| # | Document | Description |
|---|----------|-------------|
| 1 | [Installation Guide](01-INSTALLATION-GUIDE.md) | Step-by-step setup for local development and Azure DEV environments |
| 2 | [Entra ID Configuration Guide](02-ENTRA-CONFIGURATION-GUIDE.md) | Microsoft Entra ID app registration setup, permissions, and maintenance |
| 3 | [Deployment Manual](03-DEPLOYMENT-MANUAL.md) | Azure DevOps pipeline, Infrastructure as Code (Bicep), and deployment procedures |
| 4 | [Architecture Design](04-ARCHITECTURE-DESIGN.md) | Top-level architecture, component design, technology stack, and integration points |

## Other Documentation

These documents are available in the main repository:

| Document | Location | Description |
|----------|----------|-------------|
| [User Manual](../USER-MANUAL.md) | docs/ | End-user guide for IT support staff |
| [Administrator Guide](../ADMINISTRATOR-GUIDE.md) | docs/ | IT administrator setup and configuration |
| [Project Description](../../PROJECT-DESCRIPTION.md) | Root | Project overview for Azure DevOps |
| [Developer Guide](../../CLAUDE.md) | Root | Development reference and coding standards |
| [Print Label Feature](../PRINT-LABEL-FEATURE.md) | docs/ | Thermal label printing technical docs |
| [Export Feature](../EXPORT-FEATURE.md) | docs/ | Excel/CSV export technical docs |

## Importing to Azure DevOps Wiki

### Option 1: Publish as Code Wiki

1. Go to **Azure DevOps** > **Overview** > **Wiki**
2. Click **Publish code as wiki**
3. Select the repository and branch (`main`)
4. Set folder: `/docs/wiki`
5. Set wiki name: `Djoppie Inventory Docs`
6. Click **Publish**

The wiki pages update automatically when files change on the branch.

### Option 2: Copy to Project Wiki

1. Go to **Azure DevOps** > **Overview** > **Wiki**
2. Create a new **Project Wiki**
3. Create pages matching the document names
4. Copy the markdown content into each page

---

## Quick Reference

| Topic | Go To |
|-------|-------|
| First time setup? | [Installation Guide - Local Setup](01-INSTALLATION-GUIDE.md#2-local-development-setup) |
| Deploy to Azure? | [Deployment Manual - Pipeline Setup](03-DEPLOYMENT-MANUAL.md#3-azure-devops-pipeline-setup) |
| Auth not working? | [Entra Guide - Troubleshooting](02-ENTRA-CONFIGURATION-GUIDE.md#8-maintenance-and-rotation) |
| How does it work? | [Architecture Design](04-ARCHITECTURE-DESIGN.md#2-high-level-architecture) |
| Add a redirect URI? | [Entra Guide - Maintenance](02-ENTRA-CONFIGURATION-GUIDE.md#8-maintenance-and-rotation) |
| Rotate a secret? | [Entra Guide - Secret Rotation](02-ENTRA-CONFIGURATION-GUIDE.md#8-maintenance-and-rotation) |
| Pipeline variables? | [Deployment Manual - Variable Group](03-DEPLOYMENT-MANUAL.md#step-2-create-variable-group) |
| Bicep modules? | [Deployment Manual - IaC](03-DEPLOYMENT-MANUAL.md#2-infrastructure-as-code-bicep) |

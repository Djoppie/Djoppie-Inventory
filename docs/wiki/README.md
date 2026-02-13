# Djoppie Inventory - Documentation

> Official documentation for the Djoppie Inventory asset management system.

---

## User Guide

Documentation for IT Support Staff and Inventory Managers.

| Document | Description |
|----------|-------------|
| [Getting Started](User-Guide/01-Getting-Started.md) | Login, dashboard overview, searching, QR scanning |
| [Managing Assets](User-Guide/02-Managing-Assets.md) | Add, edit, view assets, status management, templates |
| [Printing Labels](User-Guide/03-Printing-Labels.md) | Single and bulk QR label printing with Dymo |
| [Exporting Data](User-Guide/04-Exporting-Data.md) | Export to Excel and CSV formats |

---

## Administrator Guide

Documentation for IT Administrators and System Administrators.

| Document | Description |
|----------|-------------|
| [Installation](Administrator-Guide/01-Installation.md) | Local development and Azure setup |
| [Entra Configuration](Administrator-Guide/02-Entra-Configuration.md) | Microsoft Entra ID app registrations |
| [Deployment](Administrator-Guide/03-Deployment.md) | Azure DevOps pipelines and deployment |
| [Key Vault](Administrator-Guide/04-Key-Vault.md) | Secret management and rotation |
| [Troubleshooting](Administrator-Guide/05-Troubleshooting.md) | Common issues and solutions |

---

## Technical Reference

Architecture and technical specifications.

| Document | Description |
|----------|-------------|
| [Architecture](Technical-Reference/01-Architecture.md) | System design, components, integrations |

---

## Quick Links

| Task | Go To |
|------|-------|
| First time setup? | [Installation - Local Setup](Administrator-Guide/01-Installation.md) |
| Deploy to Azure? | [Deployment](Administrator-Guide/03-Deployment.md) |
| Auth not working? | [Troubleshooting - Authentication](Administrator-Guide/05-Troubleshooting.md#authentication-issues) |
| Print labels? | [Printing Labels](User-Guide/03-Printing-Labels.md) |
| Export data? | [Exporting Data](User-Guide/04-Exporting-Data.md) |
| Rotate secrets? | [Key Vault - Secret Rotation](Administrator-Guide/04-Key-Vault.md#secret-rotation) |

---

## Application URLs

| Environment | Frontend | Backend API |
|-------------|----------|-------------|
| **DEV** | https://blue-cliff-031d65b03.1.azurestaticapps.net | https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net |
| **Production** | Contact IT Administrator | Contact IT Administrator |

---

## Importing to Azure DevOps Wiki

### Option 1: Publish as Code Wiki (Recommended)

1. Go to **Azure DevOps** > **Overview** > **Wiki**
2. Click **Publish code as wiki**
3. Select repository and branch (`main`)
4. Set folder: `/docs/wiki`
5. Set wiki name: `Djoppie Inventory`
6. Click **Publish**

The wiki automatically updates when files change.

### Option 2: Copy to Project Wiki

1. Create a new **Project Wiki** in Azure DevOps
2. Create pages matching the document structure
3. Copy markdown content into each page

---

## Support

- **IT ServiceDesk**: https://diepenbeek.sharepoint.com/sites/IN-Servicedesk
- **GitHub Issues**: https://github.com/Djoppie/Djoppie-Inventory/issues

---

**Version:** 2.0
**Last Updated:** February 2026

# SECURITY REMEDIATION CHECKLIST

## Djoppie Inventory - Critical Security Issues Resolution

**SEVERITY:** CRITICAL - Must complete before production deployment
**Time Required:** 2-3 hours
**Date:** 2026-02-01

---

## OVERVIEW

This checklist addresses critical security vulnerabilities discovered in the Djoppie Inventory codebase. **DO NOT deploy to production until all items are marked complete.**

### Exposed Secrets Summary

| Secret Type | Location | Status | Impact |
|-------------|----------|--------|--------|
| SQL Password | `appsettings.Production.json` | EXPOSED | Full database access |
| Entra Client Secret | `appsettings.Production.json` | EXPOSED | API authentication bypass |
| SQL Password | `docs/BACKEND-CONFIGURATION-GUIDE.md` | EXPOSED | Full database access |
| Development Client Secret | `docs/BACKEND-CONFIGURATION-GUIDE.md` | EXPOSED | Dev environment compromise |

---

## IMMEDIATE ACTIONS (Complete within 24 hours)

### [ ] Step 1: Rotate SQL Server Password

**Time:** 5 minutes

```powershell
# Login to Azure
az login --tenant 7db28d6f-d542-40c1-b529-5e5ed2aad545
az account set --subscription "<YOUR-SUBSCRIPTION-ID>"

# Generate new secure password (24 characters minimum)
$newSqlPassword = -join ((48..57) + (65..90) + (97..122) + (33,35,36,37,38,42,64) | Get-Random -Count 24 | ForEach-Object {[char]$_})

# Display password (SAVE THIS IMMEDIATELY)
Write-Host "NEW SQL PASSWORD (save to password manager):" -ForegroundColor Green
Write-Host $newSqlPassword -ForegroundColor Yellow

# Update SQL Server
az sql server update \
  --resource-group "rg-djoppie-dev-westeurope" \
  --name "sql-djoppie-dev-7xzs5n" \
  --admin-password "$newSqlPassword"

Write-Host "SQL password rotated successfully" -ForegroundColor Green
```

**Verification:**

- [ ] Password saved in secure password manager
- [ ] Old password no longer works
- [ ] Test connection with new password succeeds

---

### [ ] Step 2: Rotate Entra ID Client Secrets

**Time:** 10 minutes

#### 2.1 Backend API Client Secret (Production)

```powershell
# Reset backend API client secret
$backendAppId = "eb5bcf06-8032-494f-a363-92b6802c44bf"

# Delete old credential and create new one
$newSecret = az ad app credential reset --id $backendAppId --append --query password -o tsv

Write-Host "NEW BACKEND CLIENT SECRET (save to password manager):" -ForegroundColor Green
Write-Host $newSecret -ForegroundColor Yellow
```

#### 2.2 Backend API Client Secret (Development)

```powershell
# Reset development backend API client secret
$devBackendAppId = "d6825376-e397-41cb-a646-8a58acf7eee4"

$newDevSecret = az ad app credential reset --id $devBackendAppId --append --query password -o tsv

Write-Host "NEW DEV BACKEND CLIENT SECRET (save to password manager):" -ForegroundColor Green
Write-Host $newDevSecret -ForegroundColor Yellow
```

**Verification:**

- [ ] Production client secret saved
- [ ] Development client secret saved
- [ ] Old secrets no longer work (test after updating Key Vault)

---

### [ ] Step 3: Update Azure Key Vault with New Secrets

**Time:** 10 minutes

```powershell
# Set variables (use NEW values from Steps 1 and 2)
$keyVaultName = "kv-djoppie-dev-7xzs5n"  # Update with your Key Vault name
$resourceGroup = "rg-djoppie-dev-westeurope"

$sqlServer = "sql-djoppie-dev-7xzs5n.database.windows.net"
$sqlDatabase = "sqldb-djoppie-dev"
$sqlUsername = "djoppieadmin"
$sqlPassword = "<NEW-PASSWORD-FROM-STEP-1>"

$entraBackendClientSecret = "<NEW-SECRET-FROM-STEP-2.1>"

# Build SQL connection string with NEW password
$sqlConnectionString = "Server=tcp:$sqlServer,1433;Initial Catalog=$sqlDatabase;Persist Security Info=False;User ID=$sqlUsername;Password=$sqlPassword;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

# Update Key Vault secrets
az keyvault secret set --vault-name $keyVaultName --name "SqlConnectionString" --value "$sqlConnectionString"
az keyvault secret set --vault-name $keyVaultName --name "EntraBackendClientSecret" --value "$entraBackendClientSecret"

Write-Host "Key Vault secrets updated successfully" -ForegroundColor Green
```

**Verification:**

- [ ] Key Vault shows updated secret versions
- [ ] App Service can access secrets (check Application Insights logs)
- [ ] Backend API authenticates successfully with new secrets

---

### [ ] Step 4: Remove Secrets from Source Files

**Time:** 15 minutes

#### 4.1 Update appsettings.Production.json

**Action:** Replace hardcoded values with Key Vault references

```powershell
cd C:\Users\jowij\VSCodeDiepenbeek\Djoppie\Djoppie-inventory-v2\Djoppie-Inventory\src\backend\DjoppieInventory.API
```

Edit `appsettings.Production.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "@Microsoft.KeyVault(SecretUri=https://kv-djoppie-dev-7xzs5n.vault.azure.net/secrets/SqlConnectionString/)"
  },
  "Database": {
    "AutoMigrate": true
  },
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "7db28d6f-d542-40c1-b529-5e5ed2aad545",
    "ClientId": "eb5bcf06-8032-494f-a363-92b6802c44bf",
    "ClientSecret": "@Microsoft.KeyVault(SecretUri=https://kv-djoppie-dev-7xzs5n.vault.azure.net/secrets/EntraBackendClientSecret/)",
    "Domain": "diepenbeek.onmicrosoft.com",
    "Audience": "api://eb5bcf06-8032-494f-a363-92b6802c44bf",
    "Scopes": "access_as_user"
  },
  "MicrosoftGraph": {
    "BaseUrl": "https://graph.microsoft.com/v1.0",
    "Scopes": ["https://graph.microsoft.com/.default"]
  },
  "ApplicationInsights": {
    "ConnectionString": "InstrumentationKey=00000000-0000-0000-0000-000000000000"
  },
  "Frontend": {
    "AllowedOrigins": [
      "https://lemon-glacier-041730903.1.azurestaticapps.net"
    ]
  }
}
```

**Changes Made:**

- [ ] ConnectionString uses Key Vault reference
- [ ] ClientSecret uses Key Vault reference
- [ ] Removed localhost from AllowedOrigins (production only)

---

#### 4.2 Update Documentation

Edit `docs/BACKEND-CONFIGURATION-GUIDE.md`:

**Find and replace:**

- `ClientSecret: "vu-8Q~Z_KOrU5jQGlmGYXLDBDpmDd83hRg2AscA_"` → `ClientSecret: "<stored-in-azure-key-vault>"`
- `ClientSecret: "~_F8Q~QoPr9w32OVCh55IKDXKrnwRYEj5v~8jaLs"` → `ClientSecret: "<stored-in-azure-key-vault>"`
- `Password=DjoppieDB2026!Secure@Pass;` → `Password=<secure-password>;`

**Verification:**

- [ ] No plaintext passwords in documentation
- [ ] No plaintext client secrets in documentation
- [ ] Documentation clearly states secrets are in Key Vault

---

### [ ] Step 5: Update .gitignore

**Time:** 2 minutes

```bash
cd C:\Users\jowij\VSCodeDiepenbeek\Djoppie\Djoppie-inventory-v2\Djoppie-Inventory

# Add to .gitignore
cat >> .gitignore << EOF

# Production configuration files (contain Key Vault references only)
**/appsettings.Production.json
**/appsettings.Staging.json
**/.env.production.local
**/.env.staging.local

# Ensure development configs are still tracked
!**/appsettings.Development.json
!**/.env.development

# Deployment output files
deployment-output.json
infrastructure-outputs-*.json
entra-apps-config-*.json
EOF
```

**Verification:**

- [ ] `appsettings.Production.json` listed in .gitignore
- [ ] Git status shows file as "ignored"
- [ ] Existing tracked version still in repository (will be overwritten on next commit)

---

### [ ] Step 6: Commit Security Fixes

**Time:** 5 minutes

```bash
cd C:\Users\jowij\VSCodeDiepenbeek\Djoppie\Djoppie-inventory-v2\Djoppie-Inventory

# Stage changes
git add .gitignore
git add src/backend/DjoppieInventory.API/appsettings.Production.json
git add docs/BACKEND-CONFIGURATION-GUIDE.md

# Commit with clear message
git commit -m "SECURITY: Remove hardcoded secrets, implement Key Vault references

- Replaced hardcoded SQL password with Key Vault reference
- Replaced hardcoded Entra client secrets with Key Vault references
- Updated documentation to remove exposed credentials
- Added production config files to .gitignore
- All secrets now stored securely in Azure Key Vault

Addresses: Critical security vulnerability in production configuration
Related: SQL Server password rotation, Entra client secret rotation"

# Push to repository
git push origin develop
```

**Verification:**

- [ ] Commit pushed successfully
- [ ] GitHub shows updated files
- [ ] No secrets visible in diff

---

## SECONDARY ACTIONS (Complete within 1 week)

### [ ] Step 7: Git History Cleanup (Optional but Recommended)

**Risk:** Old commits still contain exposed secrets in Git history

**Option A: BFG Repo-Cleaner (Recommended)**

```powershell
# Download BFG from: https://rtyley.github.io/bfg-repo-cleaner/

# Create passwords file
@"
DjoppieDB2026!Secure@Pass
vu-8Q~Z_KOrU5jQGlmGYXLDBDpmDd83hRg2AscA_
~_F8Q~QoPr9w32OVCh55IKDXKrnwRYEj5v~8jaLs
"@ | Out-File passwords.txt

# Run BFG
java -jar bfg.jar --replace-text passwords.txt

# Force push (coordinate with team first!)
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

**Option B: Create Fresh Repository**

If repository is private and team is small:

1. Create new repository
2. Copy latest code (excluding .git folder)
3. Initialize new Git history
4. Migrate issues/PRs manually

**Verification:**

- [ ] Git history searched for exposed secrets (none found)
- [ ] Team notified of history rewrite
- [ ] All contributors re-clone repository

---

### [ ] Step 8: Enable Managed Identity for App Service

**Time:** 10 minutes

**Current State:** App Service uses client secret to authenticate
**Target State:** App Service uses Managed Identity (no secrets needed)

```powershell
$resourceGroup = "rg-djoppie-dev-westeurope"
$appServiceName = "app-djoppie-dev-api-7xzs5n"
$keyVaultName = "kv-djoppie-dev-7xzs5n"

# Enable system-assigned managed identity
az webapp identity assign \
  --resource-group $resourceGroup \
  --name $appServiceName

# Get managed identity principal ID
$principalId = az webapp identity show \
  --resource-group $resourceGroup \
  --name $appServiceName \
  --query principalId \
  --output tsv

# Grant Key Vault access to managed identity
az keyvault set-policy \
  --name $keyVaultName \
  --object-id $principalId \
  --secret-permissions get list

Write-Host "Managed Identity configured successfully" -ForegroundColor Green
Write-Host "App Service can now access Key Vault without client secrets" -ForegroundColor Green
```

**Verification:**

- [ ] App Service shows "System assigned" identity enabled
- [ ] Key Vault access policies include App Service identity
- [ ] App Service successfully loads configuration from Key Vault
- [ ] Application Insights shows no authentication errors

---

### [ ] Step 9: Implement Secret Rotation Schedule

**Time:** 30 minutes

Create a secret rotation policy:

```markdown
# Secret Rotation Schedule

## SQL Server Passwords
- **Frequency:** Every 90 days
- **Owner:** Database Administrator
- **Process:** Use Azure CLI script (Step 1)
- **Notification:** 7 days before expiration

## Entra ID Client Secrets
- **Frequency:** Every 180 days
- **Owner:** Identity Administrator
- **Process:** Use Azure CLI script (Step 2)
- **Notification:** 14 days before expiration

## API Keys (if any)
- **Frequency:** Every 90 days
- **Owner:** API Owner
- **Process:** Contact provider for rotation
- **Notification:** 7 days before expiration

## Calendar Reminders
- [ ] Set calendar reminder for SQL password rotation (2026-05-01)
- [ ] Set calendar reminder for Entra secrets rotation (2026-08-01)
```

**Create Azure Logic App for automatic reminders (optional):**

- Trigger: 7 days before secret expiration
- Action: Send email to administrators
- Content: Include rotation scripts

**Verification:**

- [ ] Calendar reminders set
- [ ] Rotation runbook documented
- [ ] Team trained on rotation process

---

### [ ] Step 10: Enable Azure Security Center Recommendations

**Time:** 15 minutes

```powershell
# Enable Security Center standard tier (free trial available)
az security pricing create \
  --name VirtualMachines \
  --tier standard

az security pricing create \
  --name SqlServers \
  --tier standard

az security pricing create \
  --name AppServices \
  --tier standard

az security pricing create \
  --name KeyVaults \
  --tier standard
```

**Review recommendations:**

1. Navigate to: Azure Portal > Security Center > Recommendations
2. Review "High" and "Critical" severity items
3. Implement recommended actions
4. Configure automated remediation for common issues

**Verification:**

- [ ] Security Center shows no "Critical" recommendations
- [ ] SQL Threat Detection enabled
- [ ] Key Vault diagnostic logging enabled
- [ ] App Service authentication enforced

---

### [ ] Step 11: Configure Secrets Scanning in GitHub

**Time:** 10 minutes

1. Navigate to: GitHub > Repository > Settings > Security > Code security and analysis
2. Enable:
   - [ ] Dependency graph
   - [ ] Dependabot alerts
   - [ ] Dependabot security updates
   - [ ] Secret scanning (if available)
   - [ ] Code scanning (optional)

3. Configure `.github/dependabot.yml`:

```yaml
version: 2
updates:
  # Backend (.NET)
  - package-ecosystem: "nuget"
    directory: "/src/backend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5

  # Frontend (npm)
  - package-ecosystem: "npm"
    directory: "/src/frontend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

**Verification:**

- [ ] Dependabot is creating pull requests for updates
- [ ] Secret scanning alerts are enabled
- [ ] No secrets detected in repository

---

## VERIFICATION & TESTING

### [ ] Step 12: End-to-End Security Test

**Time:** 30 minutes

#### 12.1 Test Key Vault Integration

```powershell
# Restart App Service to reload configuration
az webapp restart \
  --resource-group "rg-djoppie-dev-westeurope" \
  --name "app-djoppie-dev-api-7xzs5n"

# Check Application Insights for startup logs
az monitor app-insights query \
  --app "app-djoppie-dev-api-7xzs5n" \
  --analytics-query "traces | where message contains 'Key Vault' | order by timestamp desc | take 10"
```

**Expected Results:**

- [ ] App Service starts successfully
- [ ] No "Key Vault access denied" errors
- [ ] Configuration loaded from Key Vault
- [ ] Database connection established

---

#### 12.2 Test Authentication Flow

1. Navigate to: `https://app-djoppie-dev-api-7xzs5n.azurewebsites.net/swagger`
2. Click "Authorize"
3. Login with Diepenbeek Entra ID credentials
4. Test API endpoint (e.g., GET /api/assets)

**Expected Results:**

- [ ] OAuth flow completes successfully
- [ ] Token issued with correct audience
- [ ] API returns 200 OK (not 401 Unauthorized)
- [ ] Data retrieved successfully

---

#### 12.3 Test Frontend-Backend Integration

1. Navigate to: `https://lemon-glacier-041730903.1.azurestaticapps.net`
2. Login with Diepenbeek credentials
3. Navigate to Dashboard
4. Attempt to create/view/edit asset

**Expected Results:**

- [ ] Login succeeds
- [ ] Token acquired with correct scope
- [ ] API calls succeed (check browser Network tab)
- [ ] No CORS errors
- [ ] Application functions normally

---

### [ ] Step 13: Conduct Security Audit

**Time:** 1 hour

Run comprehensive security checks:

#### 13.1 Code Scan

```bash
# Scan for hardcoded secrets
cd C:\Users\jowij\VSCodeDiepenbeek\Djoppie\Djoppie-inventory-v2\Djoppie-Inventory

# Search for patterns (should return no results)
grep -r "Password=" src/ --exclude-dir=node_modules --exclude-dir=bin --exclude-dir=obj
grep -r "Client
Secret=" src/ --exclude-dir=node_modules --exclude-dir=bin --exclude-dir=obj
grep -r "ConnectionString=" src/ --exclude-dir=node_modules --exclude-dir=bin --exclude-dir=obj
```

**Expected:** No matches found

---

#### 13.2 Dependency Vulnerability Scan

```bash
# Backend dependencies
cd src/backend
dotnet list package --vulnerable --include-transitive

# Frontend dependencies
cd ../frontend
npm audit
```

**Action:** Update any packages with known vulnerabilities

---

#### 13.3 Azure Security Checklist

- [ ] Key Vault purge protection enabled (for production)
- [ ] SQL Server firewall restricted to Azure services only
- [ ] App Service only accepts HTTPS traffic
- [ ] Managed Identity used for all Azure service authentication
- [ ] Application Insights tracks no PII data
- [ ] Diagnostic logs enabled for all resources
- [ ] Network Security Groups configured (if applicable)
- [ ] Private endpoints enabled for SQL Server (optional for production)

---

## FINAL VERIFICATION CHECKLIST

### Configuration Security

- [ ] No hardcoded passwords in source code
- [ ] No hardcoded client secrets in source code
- [ ] No connection strings with passwords in source code
- [ ] All secrets stored in Azure Key Vault
- [ ] Key Vault references used in configuration files
- [ ] .gitignore prevents future secret commits

### Credential Rotation

- [ ] SQL Server password rotated
- [ ] Entra ID client secrets rotated (all environments)
- [ ] Old credentials confirmed non-functional
- [ ] New credentials stored in password manager
- [ ] Key Vault updated with new credentials

### Azure Security

- [ ] Managed Identity enabled on App Service
- [ ] Key Vault access policies configured correctly
- [ ] SQL Server firewall rules appropriate
- [ ] Application Insights monitoring active
- [ ] Security Center recommendations reviewed
- [ ] Backup policies configured

### Documentation & Process

- [ ] Documentation updated (no exposed secrets)
- [ ] Secret rotation schedule established
- [ ] Team trained on secure practices
- [ ] Incident response plan documented
- [ ] Git history cleaned (if applicable)

### Testing

- [ ] App Service loads configuration from Key Vault
- [ ] Backend API authenticates successfully
- [ ] Frontend-backend integration works
- [ ] Database connection established
- [ ] No authentication errors in logs

### Ongoing Monitoring

- [ ] GitHub secret scanning enabled
- [ ] Dependabot alerts enabled
- [ ] Azure Security Center monitoring active
- [ ] Key Vault access auditing enabled
- [ ] Calendar reminders set for rotation

---

## COMPLETION CERTIFICATE

**I certify that all critical security remediation steps have been completed:**

- [ ] All hardcoded secrets have been removed from source control
- [ ] All credentials have been rotated
- [ ] All secrets are now stored in Azure Key Vault
- [ ] Managed Identity is configured and functional
- [ ] End-to-end testing confirms security measures work correctly
- [ ] Ongoing monitoring and rotation schedules are in place

**Completed by:** ____________________________
**Date:** ____________________________
**Verified by:** ____________________________
**Date:** ____________________________

---

## INCIDENT RESPONSE (If Secrets Were Exposed)

If this repository was public or secrets were exposed for more than 24 hours:

### Immediate Actions

1. **Assume breach:** Treat all exposed credentials as compromised
2. **Rotate everything:** SQL passwords, Entra secrets, API keys
3. **Audit access logs:**
   - Azure SQL audit logs (check for unauthorized queries)
   - Entra ID sign-in logs (check for suspicious authentication)
   - Key Vault access logs (check for unauthorized secret retrieval)

4. **Check for damage:**
   - Database: SELECT TOP 100 * FROM sys.audit_log ORDER BY event_time DESC
   - Look for data exfiltration, modifications, deletions
   - Check Application Insights for unusual API traffic patterns

5. **Notify stakeholders:**
   - IT Security team
   - Database administrators
   - Application owners
   - Compliance officer (if applicable)

6. **Document incident:**
   - Timeline of exposure
   - Actions taken
   - Impact assessment
   - Lessons learned

### Post-Incident Actions

- [ ] Conduct full security audit
- [ ] Review and update incident response plan
- [ ] Implement additional controls (e.g., MFA for database access)
- [ ] Consider GDPR/data breach notification requirements
- [ ] Schedule security awareness training for team

---

## SUPPORT CONTACTS

**Azure Security Issues:**

- Azure Security Center: <https://portal.azure.com> > Security Center
- Azure Support: <https://portal.azure.com> > Help + support

**Entra ID Issues:**

- Entra ID Admin Center: <https://entra.microsoft.com>
- Microsoft Identity Platform: <https://docs.microsoft.com/azure/active-directory>

**Djoppie Inventory Team:**

- Primary Contact: <jo.wijnen@diepenbeek.be>
- Repository Issues: <https://github.com/Djoppie/Djoppie-Inventory/issues>

---

**Document Version:** 1.0
**Last Updated:** 2026-02-01
**Next Review:** 2026-03-01 (or after completion of remediation)

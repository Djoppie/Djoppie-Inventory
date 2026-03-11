# Installation Guide

This guide walks you through setting up Djoppie Inventory on your local development machine.

## Prerequisites

Verify you have the following installed before proceeding:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **.NET 8 SDK** ([Download](https://dotnet.microsoft.com/download/dotnet/8.0))
- **Git** ([Download](https://git-scm.com/downloads))
- **Visual Studio Code** (recommended) or any code editor
- **Azure CLI** (optional, for Azure deployments)

### Verify Installation

Run these commands to confirm prerequisites:

```bash
node --version    # Should show v18.x or higher
npm --version     # Should show 9.x or higher
dotnet --version  # Should show 8.0.x
git --version     # Should show 2.x or higher
```

## 1. Clone Repository

```bash
git clone https://github.com/Djoppie/Djoppie-Inventory.git
cd Djoppie-Inventory
```

**Expected result:** Repository cloned to local machine with all source files.

## 2. Backend Setup

### 2.1 Navigate to Backend Directory

```bash
cd src/backend/DjoppieInventory.API
```

### 2.2 Restore Dependencies

```bash
dotnet restore
```

**Expected result:** NuGet packages downloaded successfully.

### 2.3 Configure User Secrets

The application uses .NET User Secrets for local development credentials. These secrets are stored outside your repository in `%APPDATA%\Microsoft\UserSecrets` (Windows) or `~/.microsoft/usersecrets` (Linux/Mac).

Initialize user secrets:

```bash
dotnet user-secrets init
```

Set the Azure AD client secret (obtain from your team lead or Azure Portal):

```bash
dotnet user-secrets set "AzureAd:ClientSecret" "your-client-secret-value"
```

**Note:** Replace `your-client-secret-value` with the actual secret from Azure Portal:
1. Navigate to Azure Portal > App Registrations
2. Select the API app registration (Client ID: `eb5bcf06-8032-494f-a363-92b6802c44bf`)
3. Go to Certificates & secrets > Client secrets
4. Copy the secret value

### 2.4 Initialize Database

The SQLite database will be created automatically on first run. Verify the configuration:

```bash
# View current appsettings (optional)
cat appsettings.Development.json
```

Run database migrations:

```bash
dotnet ef database update
```

**Expected result:** SQLite database file `djoppie.db` created in the API project directory.

**Troubleshooting:** If `dotnet ef` command is not found, install EF Core tools:

```bash
dotnet tool install --global dotnet-ef
```

### 2.5 Run Backend API

```bash
dotnet run
```

**Expected result:** API starts listening on `http://localhost:5052`

You should see output similar to:

```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5052
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
```

### 2.6 Verify Backend

Open your browser and navigate to:

```
http://localhost:5052/swagger
```

**Expected result:** Swagger UI loads showing all available API endpoints.

Keep this terminal open with the backend running.

## 3. Frontend Setup

Open a **new terminal window** (keep backend running in the first terminal).

### 3.1 Navigate to Frontend Directory

```bash
cd src/frontend
```

### 3.2 Install Dependencies

```bash
npm install
```

**Expected result:** All npm packages installed in `node_modules` directory.

**Troubleshooting:** If you encounter permission errors on Windows, run terminal as Administrator.

### 3.3 Configure Environment Variables

The frontend requires environment variables to connect to the backend API and Azure AD.

Verify `.env.development` exists and contains:

```bash
cat .env.development
```

**Expected content:**

```env
VITE_API_URL=http://localhost:5052/api
VITE_ENTRA_CLIENT_ID=b0b10b6c-8638-4bdd-9684-de4a55afd521
VITE_ENTRA_TENANT_ID=7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_AUTHORITY=https://login.microsoftonline.com/7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_REDIRECT_URI=http://localhost:5173
VITE_ENTRA_API_SCOPE=api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user
```

**Note:** This file should already exist in the repository. If missing, create it with the content above.

### 3.4 Run Frontend Development Server

```bash
npm run dev
```

**Expected result:** Vite dev server starts on `http://localhost:5173`

You should see output similar to:

```
VITE v7.2.4  ready in 423 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

## 4. Access the Application

### 4.1 Open Application

Navigate to the application in your browser:

```
http://localhost:5173
```

### 4.2 Sign In

1. Click **Sign In** button
2. You will be redirected to Microsoft login page
3. Enter your credentials for the Diepenbeek tenant
4. Grant permissions if prompted (first-time login only)
5. You will be redirected back to the application

**Expected result:** You are signed in and see the Dashboard with asset inventory.

### 4.3 Verify Intune Integration (Optional)

To verify Intune integration works:

1. Navigate to any asset in the inventory
2. If the asset has a serial number matching an Intune device, you'll see an Intune status badge
3. Click the badge to view live device information from Intune

**Note:** Intune integration requires that your Azure AD account has been granted the necessary Microsoft Graph API permissions. Contact your administrator if you see authorization errors.

## 5. Development Workflow

### Hot Reload

Both frontend and backend support hot reload:

- **Frontend:** Changes to `.tsx`, `.ts`, `.css` files automatically refresh the browser
- **Backend:** Run with `dotnet watch run` instead of `dotnet run` for automatic restart on code changes

### Stopping Services

To stop the application:

1. Press `Ctrl+C` in the frontend terminal
2. Press `Ctrl+C` in the backend terminal

### Restarting Services

To restart after stopping:

```bash
# Terminal 1: Backend
cd src/backend/DjoppieInventory.API
dotnet run

# Terminal 2: Frontend
cd src/frontend
npm run dev
```

## Common Issues

### Backend won't start

**Issue:** `Unable to configure HTTPS endpoint`

**Solution:** The app only uses HTTP in development. Ensure `appsettings.Development.json` doesn't have HTTPS configuration.

---

**Issue:** `A connection was successfully established with the server, but then an error occurred during the login process`

**Solution:** Check that the client secret in user secrets matches the one in Azure Portal and hasn't expired.

---

**Issue:** `Cannot find module 'Microsoft.EntityFrameworkCore'`

**Solution:** Run `dotnet restore` in the API project directory.

### Frontend won't start

**Issue:** `Error: Cannot find module '@vitejs/plugin-react'`

**Solution:** Delete `node_modules` folder and `package-lock.json`, then run `npm install` again.

---

**Issue:** `Port 5173 is already in use`

**Solution:** Kill the process using port 5173 or configure Vite to use a different port in `vite.config.ts`.

---

**Issue:** Frontend loads but API calls fail with 401 Unauthorized

**Solution:**
1. Clear browser cache and MSAL token cache (F12 > Application > Clear storage)
2. Sign out and sign in again
3. Verify `VITE_ENTRA_API_SCOPE` in `.env.development` matches backend `Audience` in `appsettings.Development.json`

### Database Issues

**Issue:** `Microsoft.Data.Sqlite.SqliteException: SQLite Error 1: 'no such table: Assets'`

**Solution:** Run migrations: `dotnet ef database update`

---

**Issue:** `There is already an open DataReader associated with this Connection`

**Solution:** This is an Entity Framework tracking issue. Restart the backend API.

### Authentication Issues

**Issue:** `AADSTS65001: The user or administrator has not consented`

**Solution:** Admin consent is required for Microsoft Graph API permissions. Contact your Azure AD administrator to grant consent for the application.

---

**Issue:** Infinite redirect loop on login

**Solution:**
1. Verify `VITE_ENTRA_REDIRECT_URI` matches the registered redirect URI in Azure Portal
2. Ensure the redirect URI is set to `http://localhost:5173` (no trailing slash)
3. Clear browser cookies and try again

## Next Steps

- Review [FEATURES.md](FEATURES.md) for complete feature overview
- Review [GRAPH-API.md](GRAPH-API.md) for Microsoft Graph API integration details
- Review [CLAUDE.md](CLAUDE.md) for architecture and development guidelines
- Review [README-DEPLOYMENT.md](README-DEPLOYMENT.md) for Azure deployment instructions

## Need Help?

Contact: jo.wijnen@diepenbeek.be

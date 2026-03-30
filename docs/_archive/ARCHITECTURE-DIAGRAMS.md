# Djoppie-Inventory System Diagrams

This document contains Mermaid diagrams illustrating the Djoppie-Inventory system architecture and key workflows.

---

## 1. System Architecture Diagram

Shows the complete layered architecture including frontend, backend, database, and external integrations.

```mermaid
graph TB
    subgraph "Client Layer"
        Browser["🌐 Web Browser"]
        MSAL["MSAL React<br/>Authentication"]
        React["React 19 SPA<br/>TypeScript + MUI"]
    end

    subgraph "Microsoft Services"
        EntraID["Microsoft Entra ID<br/>Authentication"]
        MsGraph["Microsoft Graph API"]
        Intune["Intune Device<br/>Management"]
    end

    subgraph "API Layer - ASP.NET Core 8"
        Router["API Router"]
        AssetsCtrl["AssetsController<br/>CRUD Operations"]
        IntuneCtrl["IntuneController<br/>Device Sync"]
        QRCtrl["QRCodeController<br/>QR Generation"]
        UserCtrl["UserController<br/>Profile"]
        Auth["JWT Bearer Auth<br/>Microsoft.Identity.Web"]
    end

    subgraph "Domain Layer - Clean Architecture"
        Entities["Entities<br/>Asset, AssetTemplate"]
        DTOs["Data Transfer<br/>Objects"]
        Interfaces["Repository &<br/>Service Contracts"]
    end

    subgraph "Infrastructure Layer"
        Repos["Repository<br/>Implementations"]
        IntuneService["IntuneService<br/>Graph Integration"]
        EFCore["Entity Framework<br/>Core"]
    end

    subgraph "Data Layer"
        DbContext["ApplicationDbContext<br/>EF Core DbSet"]
        SQLite["SQLite<br/>Development"]
        AzureSQL["Azure SQL<br/>Production"]
    end

    Browser -->|User Interaction| React
    React -->|Login Request| MSAL
    MSAL -->|Authenticate| EntraID
    EntraID -->|JWT Token| React
    React -->|Bearer Token| Router
    Router -->|Route| AssetsCtrl
    Router -->|Route| IntuneCtrl
    Router -->|Route| QRCtrl
    Router -->|Route| UserCtrl
    Router -->|Validate| Auth
    Auth -->|Entra ID Config| EntraID
    AssetsCtrl -->|Use| Entities
    IntuneCtrl -->|Use| Entities
    AssetsCtrl -->|Implement| Repos
    IntuneCtrl -->|Call| IntuneService
    Repos -->|Access| EFCore
    IntuneService -->|Query| MsGraph
    MsGraph -->|Device Data| Intune
    EFCore -->|Context| DbContext
    DbContext -->|SQLite| SQLite
    DbContext -->|Azure SQL| AzureSQL
    React -->|Axios HTTP| AssetsCtrl
    React -->|Axios HTTP| QRCtrl
    React -->|Service Principal Token| IntuneService

    style React fill:#61dafb,color:#000
    style EntraID fill:#0078d4,color:#fff
    style MsGraph fill:#00a4ef,color:#fff
    style Intune fill:#00a4ef,color:#fff
    style AssetsCtrl fill:#512bd4,color:#fff
    style IntuneCtrl fill:#512bd4,color:#fff
    style QRCtrl fill:#512bd4,color:#fff
    style UserCtrl fill:#512bd4,color:#fff
    style EFCore fill:#512bd4,color:#fff
    style AzureSQL fill:#0078d4,color:#fff
    style SQLite fill:#4ea8de,color:#fff
```

**Key Components:**

- **Client Layer**: React SPA with MSAL for Microsoft authentication
- **Microsoft Services**: Entra ID for user authentication, Microsoft Graph for Intune device data
- **API Layer**: ASP.NET Core 8 with multiple controllers handling different domains
- **Domain Layer**: Clean Architecture with entities, DTOs, and repository interfaces
- **Infrastructure Layer**: EF Core, repository implementations, and Intune service
- **Data Layer**: Context-aware database selection (SQLite for dev, Azure SQL for prod)

---

## 2. Authentication Flow Diagram

Illustrates the complete authentication and token acquisition process.

```mermaid
sequenceDiagram
    participant User
    participant Browser as Browser/React
    participant MSAL as MSAL React
    participant EntraID as Entra ID
    participant API as ASP.NET Core API
    participant MGraph as Microsoft Graph

    User->>Browser: 1. Open Application
    Browser->>MSAL: 2. Check Authentication
    alt User Not Authenticated
        MSAL->>EntraID: 3. Redirect to Login
        User->>EntraID: 4. Enter Credentials
        EntraID->>EntraID: 5. Validate Identity
        EntraID->>MSAL: 6. Return Authorization Code
        MSAL->>EntraID: 7. Exchange Code for Token<br/>(ClientID: b0b10b6c...)
        EntraID->>MSAL: 8. JWT Access Token + Refresh Token
        MSAL->>Browser: 9. Cache Token (Session Storage)
    end

    Browser->>Browser: 10. Extract Token from Cache
    Browser->>API: 11. HTTP Request + Bearer Token<br/>(Authorization: Bearer JWT)
    API->>API: 12. Receive Request
    API->>API: 13. Validate JWT Signature<br/>with Entra ID Public Key
    API->>API: 14. Check Token Audience<br/>(api://eb5bcf06...)
    API->>API: 15. Extract User Claims<br/>(OID, UPN, Roles)

    alt Token Valid
        API->>API: 16. Check Authorization Policy<br/>(RequireAdminRole, etc)
        alt User Has Permission
            API->>MGraph: 17. Acquire Service Principal Token<br/>(ClientID: eb5bcf06...)
            MGraph->>API: 18. Service Principal Token
            API->>MGraph: 19. Query Device Data<br/>(IntuneService)
            MGraph->>API: 20. Device Information
            API->>Browser: 21. HTTP 200 + Response Data
            Browser->>User: 22. Display Assets & Devices
        else User Lacks Permission
            API->>Browser: 23. HTTP 403 Forbidden
            Browser->>User: 24. Show Access Denied
        end
    else Token Invalid
        API->>Browser: 25. HTTP 401 Unauthorized
        MSAL->>EntraID: 26. Request New Token<br/>(using Refresh Token)
        EntraID->>MSAL: 27. New Access Token
        MSAL->>API: 28. Retry with New Token
    end

    note over Browser,EntraID: Development & Azure DEV use same<br/>API Client: eb5bcf06-8032-494f-a363-92b6802c44bf
    note over MSAL,Browser: Token Scope:<br/>api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user
    note over API: Microsoft.Identity.Web<br/>Validates & Caches Token
```

**Key Steps:**

1. **User Login**: MSAL redirects to Entra ID for credential validation
2. **Token Acquisition**: Receive JWT access token with required scope
3. **API Request**: Include token in Authorization header
4. **Token Validation**: Backend validates signature, audience, and claims
5. **Authorization Check**: Verify user has required permissions
6. **Service Principal Token**: For downstream Microsoft Graph calls
7. **Data Retrieval**: Query Intune/Microsoft Graph with service principal
8. **Error Handling**: 401 triggers token refresh, 403 denies access

---

## 3. Asset Management Flow Diagram

Shows the complete workflow from QR code scanning to asset status updates.

```mermaid
graph TD
    A["Start: User Opens<br/>Asset Management"]
    B{"Choose Action?"}

    subgraph "QR Code Scan Flow"
        C["1. Activate QR Scanner<br/>html5-qrcode"]
        D["2. Scan QR Code<br/>Contains Asset Code"]
        E["3. Extract Asset Code<br/>from QR Pattern"]
        F["4. Call GET /api/assets/{code}<br/>via Axios"]
        G["5. API Queries Database<br/>Asset Entity"]
        H{"Asset<br/>Found?"}
        I["6a. Return Asset DTO<br/>with All Fields"]
        J["6b. Return 404 Error"]
        K["7. Display Asset Details<br/>in Modal/Page"]
    end

    subgraph "Asset View & Filter Flow"
        L["8. View Asset List"]
        M["9. Apply Filters<br/>Status: InGebruik, Stock,<br/>Herstelling, Defect,<br/>UitDienst, Nieuw"]
        N["10. Call GET /api/assets?status=X<br/>TanStack Query"]
        O["11. API Filters & Returns<br/>Matching Assets"]
        P["12. Render Asset Table<br/>with TanStack Table"]
    end

    subgraph "Asset Update Flow"
        Q["13. Select Asset to Update"]
        R["14. Edit Fields<br/>Owner, Location, Status,<br/>Install Date, Notes"]
        S["15. Call PUT /api/assets/{id}<br/>with Updated DTO"]
        T["16. API Validates Data<br/>in Domain Layer"]
        U{"Valid<br/>Data?"}
        V["17a. Save to Database<br/>via Repository"]
        W["17b. Return Validation Error<br/>400 Bad Request"]
        X["18. Invalidate Cache<br/>TanStack Query"]
        Y["19. Refetch Asset List"]
        Z["20. Display Updated Asset<br/>Show Toast Notification"]
    end

    subgraph "QR Code Generation Flow"
        AA["21. Select Asset for QR"]
        AB["22. Call GET /api/qrcodes/{code}"]
        AC["23. API Generates SVG QR Code<br/>using QRCode Library"]
        AD["24. Return SVG Data"]
        AE["25. Render with qrcode.react"]
        AF["26. Download SVG<br/>Format: {AssetCode}-QR.svg"]
    end

    subgraph "Status Management"
        AG["Status Transitions:<br/>Nieuw → InGebruik → Herstelling<br/>InGebruik → UitDienst<br/>Any → Defect"]
        AH["Validate Business Rules<br/>in Asset Entity"]
        AI["Update Asset Status"]
        AJ["Trigger Audit Log"]
    end

    A --> B
    B -->|Scan QR| C
    B -->|View List| L
    B -->|Update Asset| Q
    B -->|Generate QR| AA

    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H -->|Yes| I
    H -->|No| J
    I --> K
    J --> K
    K --> B

    L --> M
    M --> N
    N --> O
    O --> P
    P --> B

    Q --> R
    R --> S
    S --> T
    T --> U
    U -->|Valid| V
    U -->|Invalid| W
    V --> X
    W --> Z
    X --> Y
    Y --> Z
    Z --> B

    AA --> AB
    AB --> AC
    AC --> AD
    AD --> AE
    AE --> AF
    AF --> B

    Q -.->|Includes Status Change| AG
    AG --> AH
    AH --> AI
    AI --> AJ
    AJ -.-> V

    style C fill:#4CAF50,color:#fff
    style E fill:#4CAF50,color:#fff
    style K fill:#2196F3,color:#fff
    style L fill:#2196F3,color:#fff
    style P fill:#2196F3,color:#fff
    style Q fill:#FF9800,color:#fff
    style S fill:#FF9800,color:#fff
    style Z fill:#FF9800,color:#fff
    style AA fill:#9C27B0,color:#fff
    style AF fill:#9C27B0,color:#fff
    style AG fill:#F44336,color:#fff
```

**Key Workflows:**

1. **QR Scan**: Activate camera → Scan code → Look up asset → Display details
2. **List & Filter**: View all assets → Apply status filters → Display filtered results
3. **Update Asset**: Edit fields → Validate data → Save to DB → Refresh cache
4. **Generate QR**: Create SVG QR code → Render in UI → Allow download
5. **Status Management**: Validate transitions → Update status → Log changes

**Asset Status Values:**

- Nieuw (5) - New, not yet in use
- InGebruik (0) - In use
- Stock (1) - In inventory
- Herstelling (2) - Under repair
- Defect (3) - Broken/defective
- UitDienst (4) - Decommissioned

---

## 4. Rollout Planner Flow Diagram

Illustrates the workflow for planning and executing asset rollout campaigns.

```mermaid
graph TD
    A["Start: Open<br/>Rollout Planner"]
    B["1. Create New Session<br/>POST /api/rollout-sessions"]
    C["2. Configure Session<br/>Name, Department,<br/>Target Date, Budget"]
    D["3. Session Created<br/>Store in DB"]

    E["4. Add Days to Session<br/>Organize by Timeline"]
    F["5. For Each Day:<br/>Create Day Entity<br/>Link to Session"]

    G["6. Add Workplaces to Day<br/>Specify Locations<br/>e.g., Office A, Lab B"]
    H["7. For Each Workplace:<br/>Create Workplace Entity<br/>Link to Day"]

    I["8. Create Asset Plans<br/>for Each Workplace"]
    J["9. Define Required Assets<br/>Hardware, Software,<br/>Installation Instructions"]
    K["10. Link Asset Templates<br/>Quantity, Configuration"]

    L["11. View Rollout Timeline<br/>Gantt-style Visualization"]
    M["12. Check Resource<br/>Allocation & Conflicts"]

    N{"Ready to<br/>Execute?"}
    O["13. Mark Session<br/>as In Progress"]

    P["14. Execute Day:<br/>Check In Technicians"]
    Q["15. For Each Workplace:<br/>Scan Assets"]
    R["16. Update Asset Status<br/>InGebruik, Defect,<br/>Stock, Herstelling"]
    S["17. Record Installation<br/>Add Owner, Location,<br/>Installation Date"]

    T["18. Complete Workplace<br/>POST /api/workplaces/{id}/complete"]
    U["19. Mark Workplace<br/>as Completed"]
    V["20. Generate Report<br/>Assets Deployed<br/>Issues Encountered"]

    W["21. Complete Day:<br/>All Workplaces Done?"]
    X{"All Days<br/>Complete?"}
    Y["22. Close Session<br/>Mark as Completed"]
    Z["23. Generate Final Report<br/>Timeline, Cost, Issues"]

    AA["24. Reopen Completed<br/>Workplace if Needed<br/>POST /api/workplaces/{id}/reopen"]
    AB["Resume Execution<br/>at Step 14"]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    J --> K
    K --> L
    L --> M
    M --> N
    N -->|No| L
    N -->|Yes| O
    O --> P
    P --> Q
    Q --> R
    R --> S
    S --> T
    T --> U
    U --> V
    V --> W
    W -->|No| P
    W -->|Yes| X
    X -->|No| P
    X -->|Yes| Y
    Y --> Z
    Z --> AA
    AA --> AB
    AB --> T

    subgraph "Session Entity"
        SES["ID, Name, Department<br/>TargetDate, Status<br/>CreatedAt, CompletedAt"]
    end

    subgraph "Day Entity"
        DAY["ID, SessionID, SequenceNumber<br/>PlannedDate, Status<br/>Technicians Assigned"]
    end

    subgraph "Workplace Entity"
        WP["ID, DayID, Name, Location<br/>Status (Pending, InProgress,<br/>Completed), Issues"]
    end

    subgraph "Asset Plan Entity"
        AP["ID, WorkplaceID, AssetCode<br/>Quantity, ConfigNotes<br/>Deployed, Issues"]
    end

    B -.-> SES
    F -.-> DAY
    H -.-> WP
    J -.-> AP

    style B fill:#4CAF50,color:#fff
    style D fill:#4CAF50,color:#fff
    style O fill:#FF9800,color:#fff
    style P fill:#FF9800,color:#fff
    style T fill:#2196F3,color:#fff
    style U fill:#2196F3,color:#fff
    style Y fill:#9C27B0,color:#fff
    style AA fill:#F44336,color:#fff
    style AB fill:#F44336,color:#fff
```

**Rollout Process Stages:**

1. **Planning Phase** (Steps 1-12):
   - Create rollout session with metadata
   - Organize timeline by days
   - Assign workplaces to each day
   - Plan required assets and configurations
   - Review timeline and resources

2. **Execution Phase** (Steps 13-21):
   - Mark session as in progress
   - For each day/workplace:
     - Scan and deploy assets
     - Update asset status and ownership
     - Record installation metadata
     - Mark workplace complete
   - Generate daily reports

3. **Completion Phase** (Steps 22-23):
   - Close session when all workplaces done
   - Generate final rollout report

4. **Adjustment Phase** (Steps 24-26):
   - Reopen completed workplaces if issues found
   - Resume execution from appropriate step
   - Update asset status/configuration as needed

**Data Model Relationships:**

```text
Session (1) ──→ (N) Days
Day     (1) ──→ (N) Workplaces
Workplace (1) ──→ (N) Asset Plans
Asset Plan ──→ Asset (via AssetCode)
```

---

## Diagram Export & Integration

### Using These Diagrams

1. **In Markdown Files**: Copy the Mermaid code block directly into `.md` files
2. **In GitHub**: Diagrams render automatically in README and documentation
3. **In GitHub Pages**: Use Mermaid CDN for static site rendering
4. **In Azure DevOps Wiki**: Support may vary; test before using

### Styling & Customization

To customize colors or fonts, modify the `style` statements:

```mermaid
style NodeName fill:#hexColor,color:#textColor,stroke:#borderColor,stroke-width:2px
```

Common colors used:

- React: `#61dafb` (cyan)
- Microsoft: `#0078d4` (blue), `#00a4ef` (light blue)
- ASP.NET: `#512bd4` (purple)
- Status/Success: `#4CAF50` (green)
- Info: `#2196F3` (blue)
- Warning: `#FF9800` (orange)
- Error: `#F44336` (red)

### Accessibility

- All diagrams include labels and descriptions
- Use contrasting colors for readability
- Font sizes automatically scale
- Text alternatives provided in narrative descriptions

---

## Related Documentation

- **CLAUDE.md** - Project overview and development guide
- **README.md** - User guide (Dutch)
- **docs/BACKEND-CONFIGURATION-GUIDE.md** - API configuration details
- **PRODUCTION-DEPLOYMENT-GUIDE.md** - Deployment procedures
- **KEYVAULT-QUICK-REFERENCE.md** - Secret management reference

Last updated: 2026-03-11

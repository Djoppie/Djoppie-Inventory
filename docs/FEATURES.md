# Features Overview

Djoppie Inventory is a comprehensive IT asset management system with Microsoft Intune integration.

## Asset Management

### Core Operations

- Create, read, update, and delete IT assets
- Auto-generated asset codes (PREFIX-0001 to PREFIX-8999)
- Template library for quick asset creation
- QR code generation and download (SVG format)
- QR scanner for instant asset lookup
- Bulk edit capabilities for multiple assets
- Import/export functionality

### Asset Tracking

- Six operational states: InGebruik, Stock, Herstelling, Defect, UitDienst, Nieuw
- Owner assignment with job title and office location
- Building and service (department) assignment
- Category-based organization (Computing, Peripherals, Networking, Displays)
- Brand, model, and serial number tracking
- Installation date tracking
- Purchase date and warranty information
- Additional notes field

### Status Management

| Status | Dutch | Description |
| -------- | -------|-------------|
| InGebruik | In gebruik | Asset actively in use |
| Stock | Stock | In stock, available |
| Herstelling | Herstelling | Under repair |
| Defect | Defect | Broken/defective |
| UitDienst | Uit dienst | Decommissioned |
| Nieuw | Nieuw | New asset, not yet deployed |

## Intune Integration

### Device Synchronization

- Fetch managed devices from Microsoft Intune
- Real-time device health monitoring
- Compliance status tracking
- Automatic hardware inventory updates

### Device Information

- Device name, manufacturer, model
- Operating system and version
- Serial number matching
- Enrollment and last sync timestamps
- User principal name (UPN)
- Azure AD registration status
- Management agent details

### Live Status Features

- Current compliance state
- Storage usage percentage
- Encryption status
- Physical memory information
- Detected applications list
- Health score calculation (0-100)
- Health status: Healthy, Warning, Critical

### Provisioning Timeline

- Autopilot registration tracking
- Device enrollment (OOBE) progress
- ESP (Enrollment Status Page) phases:
  - Device setup phase
  - Account setup phase
- User sign-in completion
- Total provisioning duration
- Progress percentage calculation

## Rollout Planner

### Session Management

- Create rollout sessions (e.g., "Q1 2026 Laptop Refresh")
- Session status tracking: Planning, Ready, InProgress, Completed, Cancelled
- Planned start and end dates
- Creator tracking with email

### Day Planning

- Multiple rollout days per session
- Day-specific ordering
- Date assignment for each day
- Status tracking per day

### Workplace Execution

- Individual workplace entries
- Asset and user assignments
- Status: Pending, InProgress, Completed, Skipped, Failed
- Completion timestamps
- Reopen completed workplaces if needed
- Progress tracking per day and session

### Workflow

1. Create session in Planning mode
2. Add rollout days to session
3. Add workplaces to days with assets
4. Mark session as Ready
5. Start rollout (InProgress)
6. Complete workplaces one by one
7. Mark session as Completed when finished

## Dashboard

### Filtering System

- Category switcher (All Assets, Computing, Peripherals, Networking, Displays)
- Status filter (All, InGebruik, Stock, Herstelling, Defect, UitDienst, Nieuw)
- Owner filter (All, Assigned, Unassigned)
- Search across multiple fields (asset code, name, owner, serial number)
- URL-persisted filters for sharing and bookmarking

### Table Views

- Compact, professional design
- Sortable columns
- Real-time filtering
- Pagination support
- Bulk selection for multi-edit
- Quick actions (view, edit, delete)
- Export to Excel

### Asset Details

- Comprehensive asset information display
- Intune status badge (if Intune-managed)
- QR code preview and download
- Direct links to edit mode

## Multilingual Support

### Available Languages

- Dutch (Nederlands) - Default
- English

### Translation Scope

- Complete UI translation
- Status labels
- Form fields and validation messages
- Navigation menu
- Success and error messages
- Date formatting based on locale

### Implementation

- i18next integration
- Browser language detection
- Persistent language selection
- Runtime language switching

## Authentication and Authorization

### Microsoft Entra ID Integration

- Single sign-on (SSO) via Azure AD
- JWT token-based authentication
- Role-based access control (RBAC)
- Admin policy for privileged operations

### Security Features

- Rate limiting (100 req/min global, 20 req/min Intune APIs)
- CORS protection
- Secure API communication (HTTPS)
- Token validation on every request
- Admin consent required for Graph API permissions

## QR Code System

### Generation

- SVG format for print quality
- Asset code encoding
- Downloadable QR files (AssetCode-QR.svg)
- Bulk QR generation

### Scanning

- HTML5 QR scanner integration
- Camera-based scanning
- Instant asset lookup on scan
- Redirect to asset details page
- Support for mobile and desktop devices

## Data Export

### Excel Export

- Full asset inventory export
- Filtered data export
- Column customization
- Formatted spreadsheet with headers
- Date formatting

### Use Cases

- Reporting and analytics
- Backup and archival
- External system integration
- Auditing and compliance

## Performance Features

### Frontend Optimization

- TanStack Query for server state caching
- Optimistic updates
- Automatic background refetching
- Stale-while-revalidate pattern
- Request deduplication

### Backend Optimization

- EF Core query optimization
- Connection pooling
- Automatic database migration
- Rate limiting to prevent abuse
- Application Insights telemetry

## Database Support

### Development

- SQLite for lightweight local development
- File-based storage (djoppie.db)
- No external dependencies

### Production

- Azure SQL Database
- Connection retry logic (5 retries, 30s max delay)
- Automatic migration support
- Transaction support for complex operations

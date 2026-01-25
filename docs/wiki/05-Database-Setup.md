# Handleiding 5: Database & Entity Framework Setup

**Versie:** 1.0
**Datum:** Januari 2026
**Onderdeel van:** Djoppie Inventory Deployment Handleidingen

---

## Inhoudsopgave

1. [Overzicht](#overzicht)
2. [Database Opties](#database-opties)
3. [Entity Framework Core Setup](#entity-framework-core-setup)
4. [Database Migrations](#database-migrations)
5. [Seed Data](#seed-data)
6. [Connection String Management](#connection-string-management)
7. [Backup en Restore](#backup-en-restore)
8. [Performance Optimalisatie](#performance-optimalisatie)
9. [Troubleshooting](#troubleshooting)

---

## Overzicht

Het Djoppie Inventory systeem ondersteunt twee database opties:
- **SQLite** voor lokale ontwikkeling en DEV omgeving (budget-friendly)
- **Azure SQL Database** voor PROD omgeving (enterprise-grade)

### Database Schema

```
┌─────────────────────────────────────────────┐
│              Assets                         │
├─────────────────────────────────────────────┤
│ Id (PK, GUID)                               │
│ AssetCode (Unique, String)                  │
│ AssetName (String)                          │
│ Category (String)                           │
│ Brand (String)                              │
│ Model (String)                              │
│ SerialNumber (String)                       │
│ OwnerId (String)                            │
│ Building (String)                           │
│ SpaceFloor (String)                         │
│ Status (Enum: Active/Maintenance/Retired)   │
│ PurchaseDate (DateTime?)                    │
│ WarrantyExpiryDate (DateTime?)              │
│ InstallationDate (DateTime?)                │
│ IntuneDeviceId (String?)                    │
│ CreatedAt (DateTime)                        │
│ UpdatedAt (DateTime)                        │
└─────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────┐
│           AssetHistory                      │
├─────────────────────────────────────────────┤
│ Id (PK, GUID)                               │
│ AssetId (FK)                                │
│ ChangeType (Enum)                           │
│ OldValue (String)                           │
│ NewValue (String)                           │
│ ChangedBy (String)                          │
│ ChangedAt (DateTime)                        │
└─────────────────────────────────────────────┘
```

---

## Database Opties

### Optie 1: SQLite (DEV/Learning)

**Voordelen:**
- Geen kosten
- Eenvoudige setup
- Ideaal voor development
- File-based, geen server nodig
- Ondersteunt EF Core migrations

**Nadelen:**
- Niet geschikt voor productie
- Beperkte concurrency
- Geen built-in backup features
- Max database size ~281 TB (praktisch: 10-100 GB)

**Gebruik voor:**
- Lokale ontwikkeling
- DEV omgeving
- Unit/Integration tests
- Quick prototyping

### Optie 2: Azure SQL Database (PROD)

**Voordelen:**
- Enterprise-grade reliability
- Automatic backups
- High availability
- Scalability
- Built-in security features
- Geo-replication opties

**Nadelen:**
- Kosten (~€5-20/maand voor Basic/S1)
- Vereist Azure subscription
- Network latency (vanuit lokale machine)

**Gebruik voor:**
- Productie omgeving
- Staging omgeving (optioneel)
- Performance testing met realistische data volumes

---

## Entity Framework Core Setup

### EF Core Tools Installeren

```bash
# Global tool installeren
dotnet tool install --global dotnet-ef

# Verificatie
dotnet ef --version
# Expected: 8.0.x of hoger

# Update naar laatste versie
dotnet tool update --global dotnet-ef
```

### DbContext Configuratie

**Bestand:** `src/backend/DjoppieInventory.Infrastructure/Data/ApplicationDbContext.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Asset> Assets { get; set; }
        public DbSet<AssetHistory> AssetHistory { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Asset configuratie
            modelBuilder.Entity<Asset>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.AssetCode).IsUnique();
                entity.Property(e => e.AssetCode).IsRequired().HasMaxLength(50);
                entity.Property(e => e.AssetName).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Category).HasMaxLength(100);
                entity.Property(e => e.Status).HasConversion<string>();
            });

            // AssetHistory configuratie
            modelBuilder.Entity<AssetHistory>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne<Asset>()
                    .WithMany()
                    .HasForeignKey(e => e.AssetId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.Property(e => e.ChangeType).HasConversion<string>();
            });
        }
    }
}
```

### Connection String Configuratie

**Lokaal (SQLite):**

`appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=djoppie-inventory.db"
  }
}
```

**Azure SQL Database:**

`appsettings.Production.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=tcp:sql-djoppie-prod-xxx.database.windows.net,1433;Initial Catalog=sqldb-djoppie-inventory;Authentication=Active Directory Managed Identity;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
  }
}
```

**Programmatic Configuration:**

`Program.cs`:
```csharp
// Add DbContext
if (builder.Environment.IsDevelopment())
{
    // SQLite voor development
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));
}
else
{
    // Azure SQL voor productie
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
}
```

---

## Database Migrations

### Eerste Migration Aanmaken

```bash
cd src/backend

# Create initial migration
dotnet ef migrations add InitialCreate \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API \
  --output-dir Data/Migrations

# Bekijk gegenereerde code
# DjoppieInventory.Infrastructure/Data/Migrations/[timestamp]_InitialCreate.cs
```

### Migration Toepassen

**Lokaal:**
```bash
# Apply migration
dotnet ef database update \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API

# Verify
sqlite3 src/backend/DjoppieInventory.API/djoppie-inventory.db
sqlite> .tables
# Expected: Assets, AssetHistory, __EFMigrationsHistory

sqlite> .schema Assets
```

**Azure SQL Database:**
```bash
# Verbind met Azure
az login

# Set environment voor PROD
export ASPNETCORE_ENVIRONMENT=Production

# Update database
dotnet ef database update \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API \
  --connection "Server=tcp:sql-djoppie-prod-xxx.database.windows.net,1433;Initial Catalog=sqldb-djoppie-inventory;User ID=sqladmin;Password=YourPassword123!;Encrypt=True;"
```

### Schema Wijzigingen

**Voorbeeld: Nieuwe kolom toevoegen**

1. Update entity model:
```csharp
public class Asset
{
    // Existing properties...

    // Nieuwe property
    public string? Notes { get; set; }
}
```

2. Create migration:
```bash
dotnet ef migrations add AddNotesToAsset \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API
```

3. Review migration:
```csharp
// Migrations/[timestamp]_AddNotesToAsset.cs
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.AddColumn<string>(
        name: "Notes",
        table: "Assets",
        type: "TEXT",
        nullable: true);
}
```

4. Apply:
```bash
dotnet ef database update
```

### Migration Rollback

```bash
# List alle migrations
dotnet ef migrations list

# Rollback naar specifieke migration
dotnet ef database update [MigrationName]

# Rollback naar initiële staat
dotnet ef database update 0

# Remove laatste migration (niet toegepast!)
dotnet ef migrations remove
```

---

## Seed Data

### Database Seeding Strategie

**Via DbContext OnModelCreating:**

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    // Seed categories
    var categories = new[] { "Computing", "Peripherals", "Networking", "Displays" };

    // Seed sample assets
    modelBuilder.Entity<Asset>().HasData(
        new Asset
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            AssetCode = "LAP-001",
            AssetName = "Dell Latitude 5430",
            Category = "Computing",
            Brand = "Dell",
            Model = "Latitude 5430",
            SerialNumber = "SN123456",
            Status = AssetStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        },
        new Asset
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            AssetCode = "MON-001",
            AssetName = "Samsung Monitor 27\"",
            Category = "Displays",
            Brand = "Samsung",
            Model = "S27A600",
            SerialNumber = "MON654321",
            Status = AssetStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        }
    );
}
```

**Via Dedicated Seeder Class:**

```csharp
// Infrastructure/Data/DbInitializer.cs
public static class DbInitializer
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        // Check if database al data bevat
        if (await context.Assets.AnyAsync())
        {
            return; // Database already seeded
        }

        // Seed assets
        var assets = new List<Asset>
        {
            new Asset
            {
                Id = Guid.NewGuid(),
                AssetCode = "LAP-001",
                AssetName = "Dell Latitude 5430",
                Category = "Computing",
                Brand = "Dell",
                Model = "Latitude 5430",
                SerialNumber = "SN123456",
                Status = AssetStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            // ... more assets
        };

        await context.Assets.AddRangeAsync(assets);
        await context.SaveChangesAsync();
    }
}
```

**Aanroepen bij startup:**

```csharp
// Program.cs
var app = builder.Build();

// Seed database
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

    // Apply migrations
    await context.Database.MigrateAsync();

    // Seed data (alleen in Development)
    if (app.Environment.IsDevelopment())
    {
        await DbInitializer.SeedAsync(context);
    }
}

app.Run();
```

### Seed Data via CLI

```bash
# Run met seed flag
dotnet run --project DjoppieInventory.API -- --seed

# Of via appsettings.json flag
{
  "SeedData": true
}
```

---

## Connection String Management

### Lokale Ontwikkeling

**User Secrets (aanbevolen):**

```bash
# Initialize user secrets
dotnet user-secrets init --project DjoppieInventory.API

# Set connection string
dotnet user-secrets set "ConnectionStrings:DefaultConnection" \
  "Data Source=djoppie-inventory.db" \
  --project DjoppieInventory.API

# List secrets
dotnet user-secrets list --project DjoppieInventory.API
```

### Azure Key Vault Integration

**Programmatic:**

```csharp
// Program.cs
if (!builder.Environment.IsDevelopment())
{
    var keyVaultEndpoint = new Uri($"https://{builder.Configuration["KeyVaultName"]}.vault.azure.net/");
    builder.Configuration.AddAzureKeyVault(
        keyVaultEndpoint,
        new DefaultAzureCredential());
}

// Connection string reference
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseSqlServer(connectionString);
});
```

**Via App Service Configuration:**

```bash
# Set connection string met Key Vault reference
az webapp config connection-string set \
  --name app-djoppie-prod-api-xxx \
  --resource-group rg-djoppie-prod \
  --connection-string-type SQLAzure \
  --settings DefaultConnection="@Microsoft.KeyVault(VaultName=kv-djoppieprod;SecretName=SqlConnectionString)"
```

---

## Backup en Restore

### SQLite Backup

**Manual Backup:**

```bash
# Copy database file
cp djoppie-inventory.db djoppie-inventory-backup-$(date +%Y%m%d).db

# Or gebruik SQLite backup command
sqlite3 djoppie-inventory.db ".backup djoppie-inventory-backup.db"
```

**Automated Backup Script:**

```bash
#!/bin/bash
# backup-sqlite.sh

DB_PATH="./djoppie-inventory.db"
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p $BACKUP_DIR
sqlite3 $DB_PATH ".backup $BACKUP_DIR/djoppie-inventory-$DATE.db"

# Keep only last 30 backups
ls -t $BACKUP_DIR/djoppie-inventory-*.db | tail -n +31 | xargs rm -f

echo "Backup created: $BACKUP_DIR/djoppie-inventory-$DATE.db"
```

**Restore:**

```bash
# Stop application
# Replace database file
cp backups/djoppie-inventory-20260118.db djoppie-inventory.db
# Restart application
```

### Azure SQL Database Backup

**Automatic Backups:**
- Azure SQL heeft automatic backups (PITR - Point-in-Time Restore)
- Retention: 7 dagen (Basic), 35 dagen (Standard/Premium)
- Geen configuratie nodig

**Manual Backup:**

```bash
# Export to BACPAC
az sql db export \
  --resource-group rg-djoppie-prod \
  --server sql-djoppie-prod-xxx \
  --name sqldb-djoppie-inventory \
  --admin-user sqladmin \
  --admin-password 'YourPassword123!' \
  --storage-key-type StorageAccessKey \
  --storage-key 'your-storage-key' \
  --storage-uri 'https://djoppiebackups.blob.core.windows.net/backups/djoppie-20260118.bacpac'
```

**Point-in-Time Restore:**

```bash
# Restore naar specifiek tijdstip
az sql db restore \
  --resource-group rg-djoppie-prod \
  --server sql-djoppie-prod-xxx \
  --name sqldb-djoppie-inventory-restored \
  --dest-name sqldb-djoppie-inventory \
  --time "2026-01-18T10:00:00Z"
```

**Copy Database (voor testing):**

```bash
# Copy PROD database naar DEV voor testing
az sql db copy \
  --resource-group rg-djoppie-prod \
  --server sql-djoppie-prod-xxx \
  --name sqldb-djoppie-inventory \
  --dest-resource-group rg-djoppie-dev \
  --dest-server sql-djoppie-dev-xxx \
  --dest-name sqldb-djoppie-inventory-test
```

---

## Performance Optimalisatie

### Indexing Strategy

```csharp
// In OnModelCreating
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // Unique index op AssetCode (voor lookup)
    modelBuilder.Entity<Asset>()
        .HasIndex(a => a.AssetCode)
        .IsUnique();

    // Index op SerialNumber (vaak gezocht)
    modelBuilder.Entity<Asset>()
        .HasIndex(a => a.SerialNumber);

    // Composite index voor filtering
    modelBuilder.Entity<Asset>()
        .HasIndex(a => new { a.Status, a.Category });

    // Index op OwnerId (voor user-specific queries)
    modelBuilder.Entity<Asset>()
        .HasIndex(a => a.OwnerId);
}
```

### Query Optimalisatie

**Gebruik AsNoTracking voor read-only queries:**

```csharp
// Repository
public async Task<List<Asset>> GetAllAssetsAsync()
{
    return await _context.Assets
        .AsNoTracking()  // Geen change tracking overhead
        .ToListAsync();
}
```

**Projection voor specifieke data:**

```csharp
// Alleen benodigde kolommen ophalen
public async Task<List<AssetListDto>> GetAssetListAsync()
{
    return await _context.Assets
        .Select(a => new AssetListDto
        {
            Id = a.Id,
            AssetCode = a.AssetCode,
            AssetName = a.AssetName,
            Status = a.Status
        })
        .ToListAsync();
}
```

**Eager Loading vs Lazy Loading:**

```csharp
// Eager loading (aanbevolen)
var assets = await _context.Assets
    .Include(a => a.History)
    .ToListAsync();

// Lazy loading (vermijd N+1 queries)
// Niet aanbevolen zonder zorgvuldige configuratie
```

### Connection Pooling

**Azure SQL configuratie:**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=...;Database=...;Min Pool Size=5;Max Pool Size=100;"
  }
}
```

### Database Monitoring

```bash
# Query performance statistics
az sql db show \
  --resource-group rg-djoppie-prod \
  --server sql-djoppie-prod-xxx \
  --name sqldb-djoppie-inventory \
  --query "status"

# DTU usage
az monitor metrics list \
  --resource /subscriptions/.../databases/sqldb-djoppie-inventory \
  --metric dtu_consumption_percent \
  --interval PT1H
```

---

## Troubleshooting

### Migration Errors

#### Error: Database already exists

```bash
# Drop en recreate
dotnet ef database drop --force
dotnet ef database update
```

#### Error: Pending model changes

```bash
# Create nieuwe migration
dotnet ef migrations add [MigrationName]
```

#### Error: Migration niet toegepast

```bash
# Check migration status
dotnet ef migrations list

# Apply pending migrations
dotnet ef database update
```

### Connection Errors

#### SQLite: Database is locked

**Oorzaak:** Andere proces heeft write lock

**Oplossing:**
```bash
# Close alle connecties
# Stop application
# Delete .db-shm en .db-wal files
rm djoppie-inventory.db-shm djoppie-inventory.db-wal
```

#### Azure SQL: Login failed

**Diagnose:**
```bash
# Test connectie
az sql db show-connection-string \
  --server sql-djoppie-prod-xxx \
  --name sqldb-djoppie-inventory \
  --client ado.net

# Verify firewall
az sql server firewall-rule list \
  --resource-group rg-djoppie-prod \
  --server sql-djoppie-prod-xxx
```

**Oplossing:**
```bash
# Add firewall rule
az sql server firewall-rule create \
  --resource-group rg-djoppie-prod \
  --server sql-djoppie-prod-xxx \
  --name AllowMyIP \
  --start-ip-address [YOUR_IP] \
  --end-ip-address [YOUR_IP]
```

### Performance Issues

#### Slow queries

**Diagnose:**
```csharp
// Enable query logging
protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
{
    optionsBuilder
        .LogTo(Console.WriteLine, LogLevel.Information)
        .EnableSensitiveDataLogging()
        .EnableDetailedErrors();
}
```

**Analyze:**
```sql
-- In Azure SQL
SELECT TOP 10
    qt.text AS QueryText,
    qs.execution_count,
    qs.total_elapsed_time / qs.execution_count AS AvgTime,
    qs.last_execution_time
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
ORDER BY qs.total_elapsed_time DESC;
```

---

## Volgende Stappen

Database is nu geconfigureerd! Laatste handleiding:

**[Handleiding 6: Monitoring & Troubleshooting →](06-Monitoring-en-Troubleshooting.md)**

Leer over:
- Application Insights setup
- Log Analytics queries
- Performance monitoring
- Error tracking

---

## Quick Reference

```bash
# === EF CORE COMMANDS ===
# Create migration
dotnet ef migrations add [Name] --project Infrastructure --startup-project API

# Apply migrations
dotnet ef database update

# Rollback
dotnet ef database update [PreviousMigration]

# Remove last migration
dotnet ef migrations remove

# Generate SQL script
dotnet ef migrations script --output migrations.sql

# === SQLITE ===
# Backup
sqlite3 djoppie-inventory.db ".backup backup.db"

# Query
sqlite3 djoppie-inventory.db "SELECT * FROM Assets;"

# === AZURE SQL ===
# Export database
az sql db export --resource-group [RG] --server [SERVER] --name [DB] ...

# Restore point-in-time
az sql db restore --dest-name [NEW_DB] --time "2026-01-18T10:00:00Z" ...

# Copy database
az sql db copy --dest-name [DEST] --dest-server [SERVER] ...
```

---

**Vragen of problemen?** Contact: jo.wijnen@diepenbeek.be

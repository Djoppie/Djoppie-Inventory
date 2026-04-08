using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Asset> Assets { get; set; }
    public DbSet<AssetTemplate> AssetTemplates { get; set; }
    public DbSet<AssetType> AssetTypes { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Building> Buildings { get; set; }
    public DbSet<Sector> Sectors { get; set; }
    public DbSet<Service> Services { get; set; }
    public DbSet<Employee> Employees { get; set; }
    public DbSet<AssetEvent> AssetEvents { get; set; }
    public DbSet<LeaseContract> LeaseContracts { get; set; }

    // Rollout workflow (simplified architecture)
    public DbSet<RolloutSession> RolloutSessions { get; set; }
    public DbSet<RolloutDay> RolloutDays { get; set; }
    public DbSet<RolloutWorkplace> RolloutWorkplaces { get; set; }

    // Rollout feature redesign - new entities
    public DbSet<WorkplaceAssetAssignment> WorkplaceAssetAssignments { get; set; }
    public DbSet<RolloutAssetMovement> RolloutAssetMovements { get; set; }
    public DbSet<RolloutDayService> RolloutDayServices { get; set; }

    // Physical workplace management
    public DbSet<PhysicalWorkplace> PhysicalWorkplaces { get; set; }

    // Asset request planning
    public DbSet<AssetRequest> AssetRequests { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Asset configuration
        modelBuilder.Entity<Asset>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.AssetCode).IsUnique();
            entity.HasIndex(e => e.SerialNumber).IsUnique().HasFilter("[SerialNumber] IS NOT NULL"); // SerialNumber unique when provided
            entity.Property(e => e.AssetCode).IsRequired().HasMaxLength(50);
            entity.Property(e => e.AssetName).HasMaxLength(200); // DeviceName from Intune (auto-fetched)
            entity.Property(e => e.Alias).HasMaxLength(200); // Optional user-defined name
            entity.Property(e => e.Category).IsRequired().HasMaxLength(100);
            entity.Property(e => e.SerialNumber).HasMaxLength(100); // Optional - can be filled in later
            entity.Property(e => e.Owner).HasMaxLength(200); // Optional - primary user
            entity.Property(e => e.LegacyBuilding).HasMaxLength(100); // Legacy - will be migrated to BuildingId
            entity.Property(e => e.LegacyDepartment).HasMaxLength(100); // Legacy - will be migrated to ServiceId
            entity.Property(e => e.OfficeLocation).HasMaxLength(100);
            entity.Property(e => e.Brand).HasMaxLength(100);
            entity.Property(e => e.Model).HasMaxLength(200);
            entity.Property(e => e.Status).HasConversion<int>();
            entity.Property(e => e.InstallationLocation).HasMaxLength(200); // Specific location within building

            // Foreign key relationships (all optional for gradual migration)
            entity.HasOne(e => e.AssetType)
                .WithMany(at => at.Assets)
                .HasForeignKey(e => e.AssetTypeId)
                .OnDelete(DeleteBehavior.Restrict); // Don't allow deleting asset type if assets exist

            entity.HasOne(e => e.Service)
                .WithMany(s => s.Assets)
                .HasForeignKey(e => e.ServiceId)
                .OnDelete(DeleteBehavior.SetNull); // If service deleted, set FK to null

            // Employee FK - for user-assigned assets
            entity.HasOne(e => e.Employee)
                .WithMany(emp => emp.Assets)
                .HasForeignKey(e => e.EmployeeId)
                .OnDelete(DeleteBehavior.SetNull); // If employee deleted, set FK to null

            // Rollout integration - Building FK
            entity.HasOne(e => e.Building)
                .WithMany()
                .HasForeignKey(e => e.BuildingId)
                .OnDelete(DeleteBehavior.SetNull);

            // Rollout integration - Current workplace assignment FK
            entity.HasOne(e => e.CurrentWorkplaceAssignment)
                .WithMany()
                .HasForeignKey(e => e.CurrentWorkplaceAssignmentId)
                .OnDelete(DeleteBehavior.SetNull);

            // Rollout integration - Last rollout session FK
            entity.HasOne(e => e.LastRolloutSession)
                .WithMany()
                .HasForeignKey(e => e.LastRolloutSessionId)
                .OnDelete(DeleteBehavior.SetNull);

            // Physical workplace FK - for workplace-fixed assets
            entity.HasOne(e => e.PhysicalWorkplace)
                .WithMany(pw => pw.FixedAssets)
                .HasForeignKey(e => e.PhysicalWorkplaceId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // AssetTemplate configuration
        modelBuilder.Entity<AssetTemplate>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TemplateName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.AssetName).HasMaxLength(200);  // Optional alias
            entity.Property(e => e.Category).HasMaxLength(100);  // Optional - derived from AssetType
            entity.Property(e => e.Brand).HasMaxLength(100);  // Optional
            entity.Property(e => e.Model).HasMaxLength(200);  // Optional
            entity.Property(e => e.Owner).HasMaxLength(200);  // Optional - default primary user
            entity.Property(e => e.InstallationLocation).HasMaxLength(200);  // Optional - specific location
            entity.Property(e => e.Status).HasMaxLength(50);  // Optional - default status
            entity.Property(e => e.LegacyBuilding).HasMaxLength(100);  // Legacy (kept for historical data)
            entity.Property(e => e.LegacyDepartment).HasMaxLength(100);  // Legacy (kept for historical data)

            // Foreign key to AssetType (optional)
            entity.HasOne(e => e.AssetType)
                .WithMany(at => at.Templates)
                .HasForeignKey(e => e.AssetTypeId)
                .OnDelete(DeleteBehavior.SetNull);

            // Foreign key to Service (optional)
            entity.HasOne(e => e.Service)
                .WithMany()
                .HasForeignKey(e => e.ServiceId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Category configuration
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Code).IsRequired().HasMaxLength(10);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
        });

        // AssetType configuration
        modelBuilder.Entity<AssetType>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Code).IsRequired().HasMaxLength(10);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);

            // Relationship with Category
            entity.HasOne(e => e.Category)
                .WithMany(c => c.AssetTypes)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.SetNull); // If category deleted, set FK to null
        });

        // Building configuration
        modelBuilder.Entity<Building>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Code).IsRequired().HasMaxLength(10);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Address).HasMaxLength(500);
        });

        // Sector configuration
        modelBuilder.Entity<Sector>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);

            // Entra ID integration
            entity.Property(e => e.EntraGroupId).HasMaxLength(50);
            entity.Property(e => e.EntraMailNickname).HasMaxLength(100);
            entity.Property(e => e.EntraSyncError).HasMaxLength(2000);
            entity.Property(e => e.EntraSyncStatus).HasConversion<int>();
            entity.Property(e => e.ManagerEntraId).HasMaxLength(50);
            entity.Property(e => e.ManagerDisplayName).HasMaxLength(200);
            entity.Property(e => e.ManagerEmail).HasMaxLength(200);
        });

        // Service configuration
        // Code uses Entra MG- group names (e.g., "bestuurssecretariaat", "facilitaire-ondersteuning")
        modelBuilder.Entity<Service>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);

            // Entra ID integration
            entity.Property(e => e.EntraGroupId).HasMaxLength(50);
            entity.Property(e => e.EntraMailNickname).HasMaxLength(100);
            entity.Property(e => e.EntraSyncError).HasMaxLength(2000);
            entity.Property(e => e.EntraSyncStatus).HasConversion<int>();
            entity.Property(e => e.ManagerEntraId).HasMaxLength(50);
            entity.Property(e => e.ManagerDisplayName).HasMaxLength(200);
            entity.Property(e => e.ManagerEmail).HasMaxLength(200);

            // Foreign key to Sector (optional)
            entity.HasOne(e => e.Sector)
                .WithMany(s => s.Services)
                .HasForeignKey(e => e.SectorId)
                .OnDelete(DeleteBehavior.SetNull); // If sector deleted, set FK to null

            // Foreign key to Building (optional)
            entity.HasOne(e => e.Building)
                .WithMany()
                .HasForeignKey(e => e.BuildingId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Employee configuration
        modelBuilder.Entity<Employee>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.EntraId).IsUnique();
            entity.HasIndex(e => e.UserPrincipalName);
            entity.HasIndex(e => e.DisplayName);
            entity.HasIndex(e => e.ServiceId);

            entity.Property(e => e.EntraId).IsRequired().HasMaxLength(50);
            entity.Property(e => e.UserPrincipalName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.DisplayName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Email).HasMaxLength(200);
            entity.Property(e => e.Department).HasMaxLength(200);
            entity.Property(e => e.JobTitle).HasMaxLength(200);
            entity.Property(e => e.OfficeLocation).HasMaxLength(200);
            entity.Property(e => e.MobilePhone).HasMaxLength(50);
            entity.Property(e => e.CompanyName).HasMaxLength(200);
            entity.Property(e => e.EntraSyncError).HasMaxLength(2000);
            entity.Property(e => e.EntraSyncStatus).HasConversion<int>();

            // Foreign key to Service (optional)
            entity.HasOne(e => e.Service)
                .WithMany()
                .HasForeignKey(e => e.ServiceId)
                .OnDelete(DeleteBehavior.SetNull);

            // Relationship to PhysicalWorkplace where employee is current occupant
            // Uses EntraId as the principal key to join with CurrentOccupantEntraId
            entity.HasOne(e => e.CurrentWorkplace)
                .WithOne()
                .HasPrincipalKey<Employee>(e => e.EntraId)
                .HasForeignKey<PhysicalWorkplace>(pw => pw.CurrentOccupantEntraId)
                .IsRequired(false);
        });

        // AssetEvent configuration
        modelBuilder.Entity<AssetEvent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.AssetId);
            entity.HasIndex(e => e.EventDate);
            entity.Property(e => e.Description).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Notes).HasMaxLength(2000);
            entity.Property(e => e.OldValue).HasMaxLength(1000);
            entity.Property(e => e.NewValue).HasMaxLength(1000);
            entity.Property(e => e.PerformedBy).HasMaxLength(200);
            entity.Property(e => e.PerformedByEmail).HasMaxLength(200);
            entity.Property(e => e.EventType).HasConversion<int>();

            // Foreign key to Asset (required, cascade delete)
            entity.HasOne(e => e.Asset)
                .WithMany(a => a.Events)
                .HasForeignKey(e => e.AssetId)
                .OnDelete(DeleteBehavior.Cascade); // Delete events when asset deleted
        });

        // LeaseContract configuration
        modelBuilder.Entity<LeaseContract>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.AssetId);
            entity.HasIndex(e => e.EndDate);
            entity.Property(e => e.ContractNumber).HasMaxLength(100);
            entity.Property(e => e.Vendor).HasMaxLength(200);
            entity.Property(e => e.MonthlyRate).HasPrecision(18, 2);
            entity.Property(e => e.TotalValue).HasPrecision(18, 2);
            entity.Property(e => e.Notes).HasMaxLength(2000);
            entity.Property(e => e.Status).HasConversion<int>();

            // Foreign key to Asset (required, cascade delete)
            entity.HasOne(e => e.Asset)
                .WithMany(a => a.LeaseContracts)
                .HasForeignKey(e => e.AssetId)
                .OnDelete(DeleteBehavior.Cascade); // Delete lease contracts when asset deleted
        });

        // RolloutSession configuration
        modelBuilder.Entity<RolloutSession>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.PlannedStartDate);
            entity.Property(e => e.SessionName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.CreatedBy).IsRequired().HasMaxLength(200);
            entity.Property(e => e.CreatedByEmail).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Status).HasConversion<int>();
        });

        // RolloutDay configuration
        modelBuilder.Entity<RolloutDay>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.RolloutSessionId);
            entity.HasIndex(e => e.Date);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.ScheduledServiceIds).HasMaxLength(500);
            entity.Property(e => e.Notes).HasMaxLength(2000);

            // Foreign key to RolloutSession (cascade delete - if session deleted, delete days)
            entity.HasOne(e => e.RolloutSession)
                .WithMany(s => s.Days)
                .HasForeignKey(e => e.RolloutSessionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // RolloutWorkplace configuration
        modelBuilder.Entity<RolloutWorkplace>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.RolloutDayId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.ServiceId);
            entity.HasIndex(e => e.BuildingId);
            entity.Property(e => e.UserName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.UserEmail).HasMaxLength(200);
            entity.Property(e => e.UserEntraId).HasMaxLength(50);
            entity.Property(e => e.Location).HasMaxLength(200);
            entity.Property(e => e.AssetPlansJson).IsRequired();
            entity.Property(e => e.CompletedBy).HasMaxLength(200);
            entity.Property(e => e.CompletedByEmail).HasMaxLength(200);
            entity.Property(e => e.Notes).HasMaxLength(2000);
            entity.Property(e => e.Status).HasConversion<int>();

            // Foreign key to RolloutDay (cascade delete - if day deleted, delete workplaces)
            entity.HasOne(e => e.RolloutDay)
                .WithMany(d => d.Workplaces)
                .HasForeignKey(e => e.RolloutDayId)
                .OnDelete(DeleteBehavior.Cascade);

            // Foreign key to Service (set null - if service deleted, set FK to null)
            entity.HasOne(e => e.Service)
                .WithMany()
                .HasForeignKey(e => e.ServiceId)
                .OnDelete(DeleteBehavior.SetNull);

            // Foreign key to Building (set null - if building deleted, set FK to null)
            entity.HasOne(e => e.Building)
                .WithMany()
                .HasForeignKey(e => e.BuildingId)
                .OnDelete(DeleteBehavior.SetNull);

            // Foreign key to PhysicalWorkplace (set null - if physical workplace deleted, set FK to null)
            entity.HasOne(e => e.PhysicalWorkplace)
                .WithMany(pw => pw.RolloutWorkplaces)
                .HasForeignKey(e => e.PhysicalWorkplaceId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // WorkplaceAssetAssignment configuration
        modelBuilder.Entity<WorkplaceAssetAssignment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.RolloutWorkplaceId);
            entity.HasIndex(e => e.AssetTypeId);
            entity.HasIndex(e => e.NewAssetId);
            entity.HasIndex(e => e.OldAssetId);
            entity.HasIndex(e => e.Status);

            entity.Property(e => e.AssignmentCategory).HasConversion<int>();
            entity.Property(e => e.SourceType).HasConversion<int>();
            entity.Property(e => e.Status).HasConversion<int>();
            entity.Property(e => e.SerialNumberCaptured).HasMaxLength(100);
            entity.Property(e => e.InstalledBy).HasMaxLength(200);
            entity.Property(e => e.InstalledByEmail).HasMaxLength(200);
            entity.Property(e => e.Notes).HasMaxLength(2000);

            // Foreign key to RolloutWorkplace (cascade delete)
            entity.HasOne(e => e.RolloutWorkplace)
                .WithMany(w => w.AssetAssignments)
                .HasForeignKey(e => e.RolloutWorkplaceId)
                .OnDelete(DeleteBehavior.Cascade);

            // Foreign key to AssetType (restrict delete)
            entity.HasOne(e => e.AssetType)
                .WithMany()
                .HasForeignKey(e => e.AssetTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            // Foreign key to NewAsset (no action - SQL Server doesn't allow multiple cascade paths)
            entity.HasOne(e => e.NewAsset)
                .WithMany()
                .HasForeignKey(e => e.NewAssetId)
                .OnDelete(DeleteBehavior.NoAction);

            // Foreign key to OldAsset (no action - SQL Server doesn't allow multiple cascade paths)
            entity.HasOne(e => e.OldAsset)
                .WithMany()
                .HasForeignKey(e => e.OldAssetId)
                .OnDelete(DeleteBehavior.NoAction);

            // Foreign key to AssetTemplate (set null)
            entity.HasOne(e => e.AssetTemplate)
                .WithMany()
                .HasForeignKey(e => e.AssetTemplateId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // RolloutAssetMovement configuration
        modelBuilder.Entity<RolloutAssetMovement>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.RolloutSessionId);
            entity.HasIndex(e => e.RolloutWorkplaceId);
            entity.HasIndex(e => e.AssetId);
            entity.HasIndex(e => e.MovementType);
            entity.HasIndex(e => e.PerformedAt);

            entity.Property(e => e.MovementType).HasConversion<int>();
            entity.Property(e => e.PreviousStatus).HasConversion<int?>();
            entity.Property(e => e.NewStatus).HasConversion<int>();
            entity.Property(e => e.PreviousOwner).HasMaxLength(200);
            entity.Property(e => e.NewOwner).HasMaxLength(200);
            entity.Property(e => e.PreviousLocation).HasMaxLength(200);
            entity.Property(e => e.NewLocation).HasMaxLength(200);
            entity.Property(e => e.SerialNumber).HasMaxLength(100);
            entity.Property(e => e.PerformedBy).IsRequired().HasMaxLength(200);
            entity.Property(e => e.PerformedByEmail).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Notes).HasMaxLength(2000);

            // Foreign key to RolloutSession (cascade delete)
            entity.HasOne(e => e.RolloutSession)
                .WithMany(s => s.AssetMovements)
                .HasForeignKey(e => e.RolloutSessionId)
                .OnDelete(DeleteBehavior.Cascade);

            // Foreign key to RolloutWorkplace (no action - SQL Server cascade path limitation)
            entity.HasOne(e => e.RolloutWorkplace)
                .WithMany(w => w.AssetMovements)
                .HasForeignKey(e => e.RolloutWorkplaceId)
                .OnDelete(DeleteBehavior.NoAction);

            // Foreign key to WorkplaceAssetAssignment (no action - SQL Server cascade path limitation)
            entity.HasOne(e => e.WorkplaceAssetAssignment)
                .WithMany()
                .HasForeignKey(e => e.WorkplaceAssetAssignmentId)
                .OnDelete(DeleteBehavior.NoAction);

            // Foreign key to Asset (restrict - don't allow deleting asset with movement history)
            entity.HasOne(e => e.Asset)
                .WithMany(a => a.AssetMovements)
                .HasForeignKey(e => e.AssetId)
                .OnDelete(DeleteBehavior.Restrict);

            // Foreign key to PreviousService (no action - SQL Server cascade path limitation)
            entity.HasOne(e => e.PreviousService)
                .WithMany()
                .HasForeignKey(e => e.PreviousServiceId)
                .OnDelete(DeleteBehavior.NoAction);

            // Foreign key to NewService (no action - SQL Server cascade path limitation)
            entity.HasOne(e => e.NewService)
                .WithMany()
                .HasForeignKey(e => e.NewServiceId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // RolloutDayService configuration (junction table)
        modelBuilder.Entity<RolloutDayService>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.RolloutDayId, e.ServiceId }).IsUnique(); // Prevent duplicate entries
            entity.HasIndex(e => e.RolloutDayId);
            entity.HasIndex(e => e.ServiceId);

            // Foreign key to RolloutDay (cascade delete)
            entity.HasOne(e => e.RolloutDay)
                .WithMany(d => d.ScheduledServices)
                .HasForeignKey(e => e.RolloutDayId)
                .OnDelete(DeleteBehavior.Cascade);

            // Foreign key to Service (no action - SQL Server cascade path limitation)
            entity.HasOne(e => e.Service)
                .WithMany(s => s.ScheduledRolloutDays)
                .HasForeignKey(e => e.ServiceId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // PhysicalWorkplace configuration
        modelBuilder.Entity<PhysicalWorkplace>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code);
            entity.HasIndex(e => e.BuildingId);
            entity.HasIndex(e => e.ServiceId);
            entity.HasIndex(e => e.CurrentOccupantEntraId);

            entity.Property(e => e.Code).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Floor).HasMaxLength(50);
            entity.Property(e => e.Room).HasMaxLength(100);
            entity.Property(e => e.Type).HasConversion<int>();
            entity.Property(e => e.CurrentOccupantEntraId).HasMaxLength(50);
            entity.Property(e => e.CurrentOccupantName).HasMaxLength(200);
            entity.Property(e => e.CurrentOccupantEmail).HasMaxLength(200);

            // Foreign key to Building (required)
            entity.HasOne(e => e.Building)
                .WithMany()
                .HasForeignKey(e => e.BuildingId)
                .OnDelete(DeleteBehavior.Restrict); // Don't allow deleting building if workplaces exist

            // Foreign key to Service (optional, set null)
            entity.HasOne(e => e.Service)
                .WithMany()
                .HasForeignKey(e => e.ServiceId)
                .OnDelete(DeleteBehavior.SetNull);

            // Equipment slot FKs (all optional, SetNull on delete)
            entity.HasOne(e => e.DockingStationAsset)
                .WithMany()
                .HasForeignKey(e => e.DockingStationAssetId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Monitor1Asset)
                .WithMany()
                .HasForeignKey(e => e.Monitor1AssetId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Monitor2Asset)
                .WithMany()
                .HasForeignKey(e => e.Monitor2AssetId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Monitor3Asset)
                .WithMany()
                .HasForeignKey(e => e.Monitor3AssetId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.KeyboardAsset)
                .WithMany()
                .HasForeignKey(e => e.KeyboardAssetId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.MouseAsset)
                .WithMany()
                .HasForeignKey(e => e.MouseAssetId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // AssetRequest configuration
        modelBuilder.Entity<AssetRequest>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.RequestedDate);
            entity.HasIndex(e => e.RequestType);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);

            entity.Property(e => e.EmployeeName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.AssetType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Notes).HasMaxLength(2000);
            entity.Property(e => e.CreatedBy).IsRequired().HasMaxLength(200);
            entity.Property(e => e.ModifiedBy).HasMaxLength(200);
            entity.Property(e => e.RequestType).HasConversion<int>();
            entity.Property(e => e.Status).HasConversion<int>();

            // Foreign key to Asset (optional, set null if asset deleted)
            entity.HasOne(e => e.AssignedAsset)
                .WithMany()
                .HasForeignKey(e => e.AssignedAssetId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ===== SEED DATA =====

        // Seed data - Categories (groups for AssetTypes)
        modelBuilder.Entity<Category>().HasData(
            new Category { Id = 1, Code = "COMP", Name = "Computing", Description = "Computers en rekenkracht", SortOrder = 1, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Category { Id = 2, Code = "WORK", Name = "Werkplek", Description = "Werkplekaccessoires en randapparatuur", SortOrder = 2, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Category { Id = 3, Code = "PERIPH", Name = "Peripherals", Description = "Printers, scanners en andere randapparatuur", SortOrder = 3, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Category { Id = 4, Code = "NET", Name = "Networking", Description = "Netwerkapparatuur", SortOrder = 4, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Category { Id = 5, Code = "MOBILE", Name = "Mobile", Description = "Mobiele apparaten", SortOrder = 5, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Category { Id = 6, Code = "AV", Name = "Audio/Video", Description = "Audio- en videoapparatuur", SortOrder = 6, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );

        // Seed data - AssetTypes (with CategoryId)
        modelBuilder.Entity<AssetType>().HasData(
            // Computing (CategoryId = 1)
            new AssetType { Id = 1, Code = "LAP", Name = "Laptop", CategoryId = 1, SortOrder = 1, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new AssetType { Id = 2, Code = "DESK", Name = "Desktop", CategoryId = 1, SortOrder = 2, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            // Werkplek (CategoryId = 2)
            new AssetType { Id = 3, Code = "MON", Name = "Monitor", CategoryId = 2, SortOrder = 3, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new AssetType { Id = 8, Code = "DOCK", Name = "Docking Station", CategoryId = 2, SortOrder = 4, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new AssetType { Id = 9, Code = "KEYB", Name = "Keyboard", CategoryId = 2, SortOrder = 5, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new AssetType { Id = 10, Code = "MOUSE", Name = "Mouse", CategoryId = 2, SortOrder = 6, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            // Peripherals (CategoryId = 3)
            new AssetType { Id = 5, Code = "PRN", Name = "Printer", CategoryId = 3, SortOrder = 7, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            // Networking (CategoryId = 4)
            new AssetType { Id = 7, Code = "NET", Name = "Netwerk", CategoryId = 4, SortOrder = 8, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            // Mobile (CategoryId = 5)
            new AssetType { Id = 4, Code = "TAB", Name = "Tablet", CategoryId = 5, SortOrder = 9, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new AssetType { Id = 6, Code = "TEL", Name = "Telefoon", CategoryId = 5, SortOrder = 10, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );

        // Seed data - Buildings (Locaties)
        // 4 Hoofdlocaties (Main locations)
        modelBuilder.Entity<Building>().HasData(
            new Building { Id = 1, Code = "POORT", Name = "Het Poortgebouw", Address = "Dienst IT, Aankoopdienst, Grondgebiedzaken", SortOrder = 1, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Building { Id = 2, Code = "GHUIS", Name = "Het Gemeentehuis", Address = "Algemeen directeur, Financiën, Burgerzaken", SortOrder = 2, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Building { Id = 3, Code = "PLAK", Name = "De Plak", Address = "Sector Mens", SortOrder = 3, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Building { Id = 4, Code = "WZC", Name = "Het Woonzorgcentrum", SortOrder = 4, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            // 12 Sateliet locaties (Satellite locations)
            new Building { Id = 5, Code = "BKOC", Name = "Buitenschoolse kinderopvang centrum", SortOrder = 10, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Building { Id = 6, Code = "BKOR", Name = "Buitenschoolse kinderopvang Rooierheide", SortOrder = 11, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Building { Id = 7, Code = "BKOL", Name = "Buitenschoolse kinderopvang Lutselus", SortOrder = 12, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Building { Id = 8, Code = "BKOG", Name = "Buitenschoolse kinderopvang gemeenteschool", SortOrder = 13, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Building { Id = 9, Code = "OCL", Name = "Ontmoetingscentrum Lutselus", SortOrder = 14, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Building { Id = 10, Code = "OCR", Name = "Ontmoetingscentrum Rooierheide", SortOrder = 15, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Building { Id = 11, Code = "GILDE", Name = "Gildezaal", SortOrder = 16, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Building { Id = 12, Code = "KEI", Name = "Zaal de Kei", SortOrder = 17, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Building { Id = 13, Code = "TERL", Name = "Zaal Terloght", SortOrder = 18, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Building { Id = 14, Code = "HEIZ", Name = "Jeugdhuis Heizoe", SortOrder = 19, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Building { Id = 15, Code = "SENH", Name = "Seniorenhuis", SortOrder = 20, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Building { Id = 16, Code = "ROZEN", Name = "School Rozendaal", SortOrder = 21, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );

        // Seed data - Sectors
        modelBuilder.Entity<Sector>().HasData(
            new Sector { Id = 1, Code = "ORG", Name = "Organisatie", SortOrder = 1, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Sector { Id = 2, Code = "FIN", Name = "Financiën", SortOrder = 2, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Sector { Id = 3, Code = "RUI", Name = "Ruimte", SortOrder = 3, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Sector { Id = 4, Code = "MENS", Name = "Mens", SortOrder = 4, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Sector { Id = 5, Code = "ZORG", Name = "Zorg", SortOrder = 5, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );

        // Seed data - Services (linked to Sectors)
        modelBuilder.Entity<Service>().HasData(
            // Sector Organisatie (Id = 1)
            new Service { Id = 1, Code = "BSEC", Name = "Bestuurssecretariaat", SectorId = 1, SortOrder = 1, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Service { Id = 2, Code = "COM", Name = "Dienst Communicatie", SectorId = 1, SortOrder = 2, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Service { Id = 3, Code = "IT", Name = "Dienst IT", SectorId = 1, SortOrder = 3, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Service { Id = 4, Code = "ORGB", Name = "Dienst Organisatiebeheersing", SectorId = 1, SortOrder = 4, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Service { Id = 5, Code = "HR", Name = "Dienst HR", SectorId = 1, SortOrder = 5, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Service { Id = 6, Code = "PREV", Name = "Dienst Preventie - GIS & Noodplanning", SectorId = 1, SortOrder = 6, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            // Sector Financiën (Id = 2)
            new Service { Id = 7, Code = "AANK", Name = "Dienst Aankopen", SectorId = 2, SortOrder = 7, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Service { Id = 8, Code = "FINZ", Name = "Dienst Financiën", SectorId = 2, SortOrder = 8, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            // Sector Ruimte (Id = 3)
            new Service { Id = 9, Code = "RO", Name = "Ruimtelijke Ontwikkeling", SectorId = 3, SortOrder = 9, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Service { Id = 10, Code = "INFRA", Name = "Infrastructuurprojecten", SectorId = 3, SortOrder = 10, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Service { Id = 11, Code = "FAC", Name = "Facilitaire Ondersteuning", SectorId = 3, SortOrder = 11, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Service { Id = 12, Code = "OD", Name = "Openbaar Domein", SectorId = 3, SortOrder = 12, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            // Sector Mens (Id = 4)
            new Service { Id = 13, Code = "BB", Name = "Beleven & Bewegen", SectorId = 4, SortOrder = 13, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Service { Id = 14, Code = "BURG", Name = "Burgerzaken", SectorId = 4, SortOrder = 14, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Service { Id = 15, Code = "GO", Name = "Gezin & Onderwijs", SectorId = 4, SortOrder = 15, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Service { Id = 16, Code = "GBS", Name = "Gemeentelijke Basisschool", SectorId = 4, SortOrder = 16, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Service { Id = 17, Code = "SOC", Name = "Sociale Dienst", SectorId = 4, SortOrder = 17, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            // Sector Zorg (Id = 5)
            new Service { Id = 18, Code = "THUIS", Name = "Thuiszorg", SectorId = 5, SortOrder = 18, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Service { Id = 19, Code = "ASWO", Name = "Assistentiewoningen", SectorId = 5, SortOrder = 19, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Service { Id = 20, Code = "CDV", Name = "Centrum Dagverzorging", SectorId = 5, SortOrder = 20, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Service { Id = 21, Code = "WZC", Name = "Woonzorgcentrum", SectorId = 5, SortOrder = 21, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );

        // Seed data - 5 pre-defined templates (with AssetTypeId references)
        modelBuilder.Entity<AssetTemplate>().HasData(
            new AssetTemplate
            {
                Id = 1,
                TemplateName = "Dell Latitude Laptop",
                AssetName = "Dell Latitude Laptop",
                Category = "Computing",
                AssetTypeId = 1, // LAP
                Brand = "Dell",
                Model = "Latitude 5420",
                IsActive = true
            },
            new AssetTemplate
            {
                Id = 2,
                TemplateName = "HP LaserJet Printer",
                AssetName = "HP LaserJet Printer",
                Category = "Peripherals",
                AssetTypeId = 5, // PRN
                Brand = "HP",
                Model = "LaserJet Pro M404dn",
                IsActive = true
            },
            new AssetTemplate
            {
                Id = 3,
                TemplateName = "Cisco Network Switch",
                AssetName = "Cisco Network Switch",
                Category = "Networking",
                AssetTypeId = 7, // NET
                Brand = "Cisco",
                Model = "Catalyst 2960",
                IsActive = true
            },
            new AssetTemplate
            {
                Id = 4,
                TemplateName = "Samsung Monitor 27\"",
                AssetName = "Samsung Monitor 27\"",
                Category = "Displays",
                AssetTypeId = 3, // MON
                Brand = "Samsung",
                Model = "27\" LED Monitor",
                IsActive = true
            },
            new AssetTemplate
            {
                Id = 5,
                TemplateName = "Logitech Wireless Mouse",
                AssetName = "Logitech Wireless Mouse",
                Category = "Peripherals",
                AssetTypeId = 10, // MOUSE
                Brand = "Logitech",
                Model = "MX Master 3",
                IsActive = true
            }
        );

        // Seed data - Physical Workplaces (test data)
        modelBuilder.Entity<PhysicalWorkplace>().HasData(
            // Gemeentehuis - Burgerzaken loketten
            new PhysicalWorkplace
            {
                Id = 1,
                Code = "GH-BZ-L01",
                Name = "Loket 1 Burgerzaken",
                Description = "Eerste loket Burgerzaken - Identiteitskaarten",
                BuildingId = 2, // Gemeentehuis
                ServiceId = 9, // Burgerzaken
                Floor = "Gelijkvloers",
                Room = "Lokettenhal",
                Type = WorkplaceType.Laptop,
                MonitorCount = 2,
                HasDockingStation = true,
                IsActive = true,
                CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new PhysicalWorkplace
            {
                Id = 2,
                Code = "GH-BZ-L02",
                Name = "Loket 2 Burgerzaken",
                Description = "Tweede loket Burgerzaken - Rijbewijzen",
                BuildingId = 2, // Gemeentehuis
                ServiceId = 9, // Burgerzaken
                Floor = "Gelijkvloers",
                Room = "Lokettenhal",
                Type = WorkplaceType.Laptop,
                MonitorCount = 2,
                HasDockingStation = true,
                IsActive = true,
                CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new PhysicalWorkplace
            {
                Id = 3,
                Code = "GH-BZ-L03",
                Name = "Loket 3 Burgerzaken",
                Description = "Derde loket Burgerzaken - Paspoorten",
                BuildingId = 2, // Gemeentehuis
                ServiceId = 9, // Burgerzaken
                Floor = "Gelijkvloers",
                Room = "Lokettenhal",
                Type = WorkplaceType.Laptop,
                MonitorCount = 2,
                HasDockingStation = true,
                IsActive = true,
                CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            // Poortgebouw - Dienst IT
            new PhysicalWorkplace
            {
                Id = 4,
                Code = "PG-IT-01",
                Name = "Werkplek IT 1",
                Description = "Helpdesk werkplek",
                BuildingId = 1, // Poortgebouw
                ServiceId = 3, // Dienst IT
                Floor = "1e verdieping",
                Room = "Lokaal IT",
                Type = WorkplaceType.Desktop,
                MonitorCount = 3,
                HasDockingStation = false,
                IsActive = true,
                CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new PhysicalWorkplace
            {
                Id = 5,
                Code = "PG-IT-02",
                Name = "Werkplek IT 2",
                Description = "Systeembeheer werkplek",
                BuildingId = 1, // Poortgebouw
                ServiceId = 3, // Dienst IT
                Floor = "1e verdieping",
                Room = "Lokaal IT",
                Type = WorkplaceType.Desktop,
                MonitorCount = 3,
                HasDockingStation = false,
                IsActive = true,
                CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            // De Plak - Flexplekken
            new PhysicalWorkplace
            {
                Id = 6,
                Code = "PL-FLEX-01",
                Name = "Flexplek 1",
                Description = "Gedeelde werkplek voor medewerkers Sector Mens",
                BuildingId = 3, // De Plak
                ServiceId = 13, // Sociale Dienst (Sector Mens)
                Floor = "Gelijkvloers",
                Room = "Open kantoor",
                Type = WorkplaceType.HotDesk,
                MonitorCount = 1,
                HasDockingStation = true,
                IsActive = true,
                CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            // Gemeentehuis - Vergaderzaal
            new PhysicalWorkplace
            {
                Id = 7,
                Code = "GH-VERG-01",
                Name = "Vergaderzaal Raadzaal",
                Description = "Grote vergaderzaal met presentatiescherm",
                BuildingId = 2, // Gemeentehuis
                ServiceId = null,
                Floor = "1e verdieping",
                Room = "Raadzaal",
                Type = WorkplaceType.MeetingRoom,
                MonitorCount = 1,
                HasDockingStation = true,
                IsActive = true,
                CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );
    }
}

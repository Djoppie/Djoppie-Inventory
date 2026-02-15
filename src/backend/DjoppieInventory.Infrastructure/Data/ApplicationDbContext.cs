using DjoppieInventory.Core.Entities;
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
    public DbSet<Building> Buildings { get; set; }
    public DbSet<Sector> Sectors { get; set; }
    public DbSet<Service> Services { get; set; }
    public DbSet<AssetEvent> AssetEvents { get; set; }
    public DbSet<LeaseContract> LeaseContracts { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Asset configuration
        modelBuilder.Entity<Asset>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.AssetCode).IsUnique();
            entity.HasIndex(e => e.SerialNumber).IsUnique(); // SerialNumber must be unique
            entity.Property(e => e.AssetCode).IsRequired().HasMaxLength(50);
            entity.Property(e => e.AssetName).HasMaxLength(200); // DeviceName from Intune (auto-fetched)
            entity.Property(e => e.Alias).HasMaxLength(200); // Optional user-defined name
            entity.Property(e => e.Category).IsRequired().HasMaxLength(100);
            entity.Property(e => e.SerialNumber).IsRequired().HasMaxLength(100); // Required unique identifier
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

            entity.HasOne(e => e.Building)
                .WithMany(b => b.Assets)
                .HasForeignKey(e => e.BuildingId)
                .OnDelete(DeleteBehavior.SetNull); // If building deleted, set FK to null

            entity.HasOne(e => e.Service)
                .WithMany(s => s.Assets)
                .HasForeignKey(e => e.ServiceId)
                .OnDelete(DeleteBehavior.SetNull); // If service deleted, set FK to null
        });

        // AssetTemplate configuration
        modelBuilder.Entity<AssetTemplate>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TemplateName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.AssetName).HasMaxLength(200);  // Optional alias
            entity.Property(e => e.Category).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Brand).HasMaxLength(100);  // Optional
            entity.Property(e => e.Model).HasMaxLength(200);  // Optional
            entity.Property(e => e.Owner).HasMaxLength(200);  // Optional - default primary user
            entity.Property(e => e.LegacyBuilding).HasMaxLength(100);  // Optional - default location (legacy)
            entity.Property(e => e.LegacyDepartment).HasMaxLength(100);  // Optional (legacy)
        });

        // AssetType configuration
        modelBuilder.Entity<AssetType>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Code).IsRequired().HasMaxLength(10);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
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
            entity.Property(e => e.Code).IsRequired().HasMaxLength(10);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
        });

        // Service configuration
        modelBuilder.Entity<Service>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Code).IsRequired().HasMaxLength(10);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);

            // Foreign key to Sector (optional)
            entity.HasOne(e => e.Sector)
                .WithMany(s => s.Services)
                .HasForeignKey(e => e.SectorId)
                .OnDelete(DeleteBehavior.SetNull); // If sector deleted, set FK to null
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

        // ===== SEED DATA =====

        // Seed data - AssetTypes
        modelBuilder.Entity<AssetType>().HasData(
            new AssetType { Id = 1, Code = "LAP", Name = "Laptop", SortOrder = 1, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new AssetType { Id = 2, Code = "DESK", Name = "Desktop", SortOrder = 2, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new AssetType { Id = 3, Code = "MON", Name = "Monitor", SortOrder = 3, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new AssetType { Id = 4, Code = "TAB", Name = "Tablet", SortOrder = 4, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new AssetType { Id = 5, Code = "PRN", Name = "Printer", SortOrder = 5, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new AssetType { Id = 6, Code = "TEL", Name = "Telefoon", SortOrder = 6, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new AssetType { Id = 7, Code = "NET", Name = "Netwerk", SortOrder = 7, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );

        // Seed data - Buildings
        modelBuilder.Entity<Building>().HasData(
            new Building { Id = 1, Code = "DBK", Name = "Gemeentehuis Diepenbeek", SortOrder = 1, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Building { Id = 2, Code = "WZC", Name = "WZC De Visserij", SortOrder = 2, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Building { Id = 3, Code = "GBS", Name = "Gemeentelijke Basisschool", SortOrder = 3, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Building { Id = 4, Code = "PLAG", Name = "Plaatselijk Comité", SortOrder = 4, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Building { Id = 5, Code = "BIB", Name = "Bibliotheek", SortOrder = 5, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );

        // Seed data - Sectors
        modelBuilder.Entity<Sector>().HasData(
            new Sector { Id = 1, Code = "ORG", Name = "Organisatie", SortOrder = 1, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Sector { Id = 2, Code = "RUI", Name = "Ruimte", SortOrder = 2, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Sector { Id = 3, Code = "ZOR", Name = "Zorg", SortOrder = 3, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );

        // Seed data - 5 pre-defined templates
        modelBuilder.Entity<AssetTemplate>().HasData(
            new AssetTemplate
            {
                Id = 1,
                TemplateName = "Dell Latitude Laptop",
                AssetName = "Dell Latitude Laptop",
                Category = "Computing",
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
                Brand = "Logitech",
                Model = "MX Master 3",
                IsActive = true
            }
        );
    }
}

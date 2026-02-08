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
            entity.Property(e => e.Building).HasMaxLength(100); // Optional - installation location
            entity.Property(e => e.Department).HasMaxLength(100); // Optional
            entity.Property(e => e.OfficeLocation).HasMaxLength(100);
            entity.Property(e => e.Brand).HasMaxLength(100);
            entity.Property(e => e.Model).HasMaxLength(200);
            entity.Property(e => e.Status).HasConversion<int>();
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
            entity.Property(e => e.Building).HasMaxLength(100);  // Optional - default location
            entity.Property(e => e.Department).HasMaxLength(100);  // Optional
        });

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

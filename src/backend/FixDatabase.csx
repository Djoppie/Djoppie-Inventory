#!/usr/bin/env dotnet-script
#r "nuget: Microsoft.Data.Sqlite, 8.0.0"

using Microsoft.Data.Sqlite;
using System;

var connectionString = "Data Source=DjoppieInventory.API/djoppie.db";

using (var connection = new SqliteConnection(connectionString))
{
    connection.Open();

    var createTableSql = @"
CREATE TABLE IF NOT EXISTS AssetTemplates (
    Id INTEGER NOT NULL CONSTRAINT PK_AssetTemplates PRIMARY KEY AUTOINCREMENT,
    TemplateName TEXT NOT NULL,
    AssetName TEXT NOT NULL,
    Category TEXT NOT NULL,
    Brand TEXT NOT NULL,
    Model TEXT NOT NULL,
    IsActive INTEGER NOT NULL DEFAULT 1
);";

    using (var command = connection.CreateCommand())
    {
        command.CommandText = createTableSql;
        command.ExecuteNonQuery();
        Console.WriteLine("AssetTemplates table created or already exists.");
    }

    // Insert seed data
    var insertSql = @"
INSERT OR IGNORE INTO AssetTemplates (Id, TemplateName, AssetName, Category, Brand, Model, IsActive)
VALUES
    (1, 'Dell Latitude Laptop', 'Dell Latitude Laptop', 'Computing', 'Dell', 'Latitude 5420', 1),
    (2, 'HP LaserJet Printer', 'HP LaserJet Printer', 'Peripherals', 'HP', 'LaserJet Pro M404dn', 1),
    (3, 'Cisco Network Switch', 'Cisco Network Switch', 'Networking', 'Cisco', 'Catalyst 2960', 1),
    (4, 'Samsung Monitor 27""', 'Samsung Monitor 27""', 'Displays', 'Samsung', '27"" LED Monitor', 1),
    (5, 'Logitech Wireless Mouse', 'Logitech Wireless Mouse', 'Peripherals', 'Logitech', 'MX Master 3', 1);";

    using (var command = connection.CreateCommand())
    {
        command.CommandText = insertSql;
        var rowsAffected = command.ExecuteNonQuery();
        Console.WriteLine($"Inserted {rowsAffected} template records.");
    }

    // Verify
    using (var command = connection.CreateCommand())
    {
        command.CommandText = "SELECT COUNT(*) FROM AssetTemplates;";
        var count = command.ExecuteScalar();
        Console.WriteLine($"Total templates in database: {count}");
    }

    // Update migration history to mark InitialCreate as applied
    var updateMigrationHistory = @"
INSERT OR IGNORE INTO __EFMigrationsHistory (MigrationId, ProductVersion)
VALUES ('20260115005601_InitialCreate', '8.0.0');";

    using (var command = connection.CreateCommand())
    {
        command.CommandText = updateMigrationHistory;
        command.ExecuteNonQuery();
        Console.WriteLine("Migration history updated.");
    }
}

Console.WriteLine("Database fix completed successfully!");

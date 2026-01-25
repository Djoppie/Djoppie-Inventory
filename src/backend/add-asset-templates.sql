-- SQL Script to add AssetTemplates table and seed data if it doesn't exist
-- This fixes the template visibility issue in the bulk asset creation feature

-- Create AssetTemplates table if it doesn't exist
CREATE TABLE IF NOT EXISTS AssetTemplates (
    Id INTEGER NOT NULL CONSTRAINT PK_AssetTemplates PRIMARY KEY AUTOINCREMENT,
    TemplateName TEXT NOT NULL,
    AssetName TEXT NOT NULL,
    Category TEXT NOT NULL,
    Brand TEXT NOT NULL,
    Model TEXT NOT NULL,
    IsActive INTEGER NOT NULL DEFAULT 1
);

-- Insert seed data only if the table is empty
INSERT OR IGNORE INTO AssetTemplates (Id, TemplateName, AssetName, Category, Brand, Model, IsActive)
VALUES
    (1, 'Dell Latitude Laptop', 'Dell Latitude Laptop', 'Computing', 'Dell', 'Latitude 5420', 1),
    (2, 'HP LaserJet Printer', 'HP LaserJet Printer', 'Peripherals', 'HP', 'LaserJet Pro M404dn', 1),
    (3, 'Cisco Network Switch', 'Cisco Network Switch', 'Networking', 'Cisco', 'Catalyst 2960', 1),
    (4, 'Samsung Monitor 27"', 'Samsung Monitor 27"', 'Displays', 'Samsung', '27" LED Monitor', 1),
    (5, 'Logitech Wireless Mouse', 'Logitech Wireless Mouse', 'Peripherals', 'Logitech', 'MX Master 3', 1);

-- Verify the data was inserted
SELECT 'AssetTemplates count: ' || COUNT(*) as Status FROM AssetTemplates;
SELECT * FROM AssetTemplates;

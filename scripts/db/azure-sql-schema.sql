-- Azure SQL Server Schema Script for Djoppie Inventory
-- This script creates missing tables and updates the schema for Azure SQL
-- Run this against your Azure SQL database

-- First, check what exists
-- SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE';

-- =====================================================
-- STEP 1: Create __EFMigrationsHistory if not exists
-- =====================================================
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '__EFMigrationsHistory')
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] NVARCHAR(150) NOT NULL,
        [ProductVersion] NVARCHAR(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END
GO

-- =====================================================
-- STEP 2: Create Categories table
-- =====================================================
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Categories')
BEGIN
    CREATE TABLE [Categories] (
        [Id] INT NOT NULL IDENTITY(1,1),
        [Code] NVARCHAR(10) NOT NULL,
        [Name] NVARCHAR(100) NOT NULL,
        [Description] NVARCHAR(500) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [SortOrder] INT NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        CONSTRAINT [PK_Categories] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_Categories_Code] ON [Categories] ([Code]);

    -- Seed Categories
    SET IDENTITY_INSERT [Categories] ON;
    INSERT INTO [Categories] ([Id], [Code], [Name], [Description], [SortOrder], [IsActive], [CreatedAt])
    VALUES
        (1, 'COMP', 'Computing', 'Computers en rekenkracht', 1, 1, '2025-01-01'),
        (2, 'WORK', 'Werkplek', 'Werkplekaccessoires en randapparatuur', 2, 1, '2025-01-01'),
        (3, 'PERIPH', 'Peripherals', 'Printers, scanners en andere randapparatuur', 3, 1, '2025-01-01'),
        (4, 'NET', 'Networking', 'Netwerkapparatuur', 4, 1, '2025-01-01'),
        (5, 'MOBILE', 'Mobile', 'Mobiele apparaten', 5, 1, '2025-01-01'),
        (6, 'AV', 'Audio/Video', 'Audio- en videoapparatuur', 6, 1, '2025-01-01');
    SET IDENTITY_INSERT [Categories] OFF;
END
GO

-- =====================================================
-- STEP 3: Create Sectors table
-- =====================================================
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Sectors')
BEGIN
    CREATE TABLE [Sectors] (
        [Id] INT NOT NULL IDENTITY(1,1),
        [Code] NVARCHAR(10) NOT NULL,
        [Name] NVARCHAR(100) NOT NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [SortOrder] INT NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        CONSTRAINT [PK_Sectors] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_Sectors_Code] ON [Sectors] ([Code]);

    -- Seed Sectors
    SET IDENTITY_INSERT [Sectors] ON;
    INSERT INTO [Sectors] ([Id], [Code], [Name], [SortOrder], [IsActive], [CreatedAt])
    VALUES
        (1, 'ORG', 'Organisatie', 1, 1, '2025-01-01'),
        (2, 'FIN', 'Financien', 2, 1, '2025-01-01'),
        (3, 'RUI', 'Ruimte', 3, 1, '2025-01-01'),
        (4, 'MENS', 'Mens', 4, 1, '2025-01-01'),
        (5, 'ZORG', 'Zorg', 5, 1, '2025-01-01');
    SET IDENTITY_INSERT [Sectors] OFF;
END
GO

-- =====================================================
-- STEP 4: Create AssetTypes table
-- =====================================================
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AssetTypes')
BEGIN
    CREATE TABLE [AssetTypes] (
        [Id] INT NOT NULL IDENTITY(1,1),
        [Code] NVARCHAR(10) NOT NULL,
        [Name] NVARCHAR(100) NOT NULL,
        [Description] NVARCHAR(500) NULL,
        [CategoryId] INT NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [SortOrder] INT NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        CONSTRAINT [PK_AssetTypes] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AssetTypes_Categories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [Categories] ([Id]) ON DELETE SET NULL
    );
    CREATE UNIQUE INDEX [IX_AssetTypes_Code] ON [AssetTypes] ([Code]);
    CREATE INDEX [IX_AssetTypes_CategoryId] ON [AssetTypes] ([CategoryId]);

    -- Seed AssetTypes
    SET IDENTITY_INSERT [AssetTypes] ON;
    INSERT INTO [AssetTypes] ([Id], [Code], [Name], [CategoryId], [SortOrder], [IsActive], [CreatedAt])
    VALUES
        (1, 'LAP', 'Laptop', 1, 1, 1, '2025-01-01'),
        (2, 'DESK', 'Desktop', 1, 2, 1, '2025-01-01'),
        (3, 'MON', 'Monitor', 2, 3, 1, '2025-01-01'),
        (4, 'TAB', 'Tablet', 5, 9, 1, '2025-01-01'),
        (5, 'PRN', 'Printer', 3, 7, 1, '2025-01-01'),
        (6, 'TEL', 'Telefoon', 5, 10, 1, '2025-01-01'),
        (7, 'NET', 'Netwerk', 4, 8, 1, '2025-01-01'),
        (8, 'DOCK', 'Docking Station', 2, 4, 1, '2025-01-01'),
        (9, 'KEYB', 'Keyboard', 2, 5, 1, '2025-01-01'),
        (10, 'MOUSE', 'Mouse', 2, 6, 1, '2025-01-01');
    SET IDENTITY_INSERT [AssetTypes] OFF;
END
GO

-- =====================================================
-- STEP 5: Create Buildings table
-- =====================================================
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Buildings')
BEGIN
    CREATE TABLE [Buildings] (
        [Id] INT NOT NULL IDENTITY(1,1),
        [Code] NVARCHAR(10) NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [Address] NVARCHAR(500) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [SortOrder] INT NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        CONSTRAINT [PK_Buildings] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_Buildings_Code] ON [Buildings] ([Code]);

    -- Seed Buildings
    SET IDENTITY_INSERT [Buildings] ON;
    INSERT INTO [Buildings] ([Id], [Code], [Name], [Address], [SortOrder], [IsActive], [CreatedAt])
    VALUES
        (1, 'POORT', 'Het Poortgebouw', 'Dienst IT, Aankoopdienst, Grondgebiedzaken', 1, 1, '2025-01-01'),
        (2, 'GHUIS', 'Het Gemeentehuis', 'Algemeen directeur, Financien, Burgerzaken', 2, 1, '2025-01-01'),
        (3, 'PLAK', 'De Plak', 'Sector Mens', 3, 1, '2025-01-01'),
        (4, 'WZC', 'Het Woonzorgcentrum', NULL, 4, 1, '2025-01-01'),
        (5, 'BKOC', 'Buitenschoolse kinderopvang centrum', NULL, 10, 1, '2025-01-01'),
        (6, 'BKOR', 'Buitenschoolse kinderopvang Rooierheide', NULL, 11, 1, '2025-01-01'),
        (7, 'BKOL', 'Buitenschoolse kinderopvang Lutselus', NULL, 12, 1, '2025-01-01'),
        (8, 'BKOG', 'Buitenschoolse kinderopvang gemeenteschool', NULL, 13, 1, '2025-01-01'),
        (9, 'OCL', 'Ontmoetingscentrum Lutselus', NULL, 14, 1, '2025-01-01'),
        (10, 'OCR', 'Ontmoetingscentrum Rooierheide', NULL, 15, 1, '2025-01-01'),
        (11, 'GILDE', 'Gildezaal', NULL, 16, 1, '2025-01-01'),
        (12, 'KEI', 'Zaal de Kei', NULL, 17, 1, '2025-01-01'),
        (13, 'TERL', 'Zaal Terloght', NULL, 18, 1, '2025-01-01'),
        (14, 'HEIZ', 'Jeugdhuis Heizoe', NULL, 19, 1, '2025-01-01'),
        (15, 'SENH', 'Seniorenhuis', NULL, 20, 1, '2025-01-01'),
        (16, 'ROZEN', 'School Rozendaal', NULL, 21, 1, '2025-01-01');
    SET IDENTITY_INSERT [Buildings] OFF;
END
GO

-- =====================================================
-- STEP 6: Create Services table
-- =====================================================
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Services')
BEGIN
    CREATE TABLE [Services] (
        [Id] INT NOT NULL IDENTITY(1,1),
        [SectorId] INT NULL,
        [Code] NVARCHAR(10) NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [SortOrder] INT NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        CONSTRAINT [PK_Services] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Services_Sectors_SectorId] FOREIGN KEY ([SectorId]) REFERENCES [Sectors] ([Id]) ON DELETE SET NULL
    );
    CREATE UNIQUE INDEX [IX_Services_Code] ON [Services] ([Code]);
    CREATE INDEX [IX_Services_SectorId] ON [Services] ([SectorId]);

    -- Seed Services
    SET IDENTITY_INSERT [Services] ON;
    INSERT INTO [Services] ([Id], [Code], [Name], [SectorId], [SortOrder], [IsActive], [CreatedAt])
    VALUES
        (1, 'BSEC', 'Bestuurssecretariaat', 1, 1, 1, '2025-01-01'),
        (2, 'COM', 'Dienst Communicatie', 1, 2, 1, '2025-01-01'),
        (3, 'IT', 'Dienst IT', 1, 3, 1, '2025-01-01'),
        (4, 'ORGB', 'Dienst Organisatiebeheersing', 1, 4, 1, '2025-01-01'),
        (5, 'HR', 'Dienst HR', 1, 5, 1, '2025-01-01'),
        (6, 'PREV', 'Dienst Preventie - GIS & Noodplanning', 1, 6, 1, '2025-01-01'),
        (7, 'AANK', 'Dienst Aankopen', 2, 7, 1, '2025-01-01'),
        (8, 'FINZ', 'Dienst Financien', 2, 8, 1, '2025-01-01'),
        (9, 'RO', 'Ruimtelijke Ontwikkeling', 3, 9, 1, '2025-01-01'),
        (10, 'INFRA', 'Infrastructuurprojecten', 3, 10, 1, '2025-01-01'),
        (11, 'FAC', 'Facilitaire Ondersteuning', 3, 11, 1, '2025-01-01'),
        (12, 'OD', 'Openbaar Domein', 3, 12, 1, '2025-01-01'),
        (13, 'BB', 'Beleven & Bewegen', 4, 13, 1, '2025-01-01'),
        (14, 'BURG', 'Burgerzaken', 4, 14, 1, '2025-01-01'),
        (15, 'GO', 'Gezin & Onderwijs', 4, 15, 1, '2025-01-01'),
        (16, 'GBS', 'Gemeentelijke Basisschool', 4, 16, 1, '2025-01-01'),
        (17, 'SOC', 'Sociale Dienst', 4, 17, 1, '2025-01-01'),
        (18, 'THUIS', 'Thuiszorg', 5, 18, 1, '2025-01-01'),
        (19, 'ASWO', 'Assistentiewoningen', 5, 19, 1, '2025-01-01'),
        (20, 'CDV', 'Centrum Dagverzorging', 5, 20, 1, '2025-01-01'),
        (21, 'WZC', 'Woonzorgcentrum', 5, 21, 1, '2025-01-01');
    SET IDENTITY_INSERT [Services] OFF;
END
GO

-- =====================================================
-- STEP 7: Create or Update Assets table
-- =====================================================
-- Add missing columns to Assets if they don't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Assets' AND COLUMN_NAME = 'AssetTypeId')
BEGIN
    ALTER TABLE [Assets] ADD [AssetTypeId] INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Assets' AND COLUMN_NAME = 'ServiceId')
BEGIN
    ALTER TABLE [Assets] ADD [ServiceId] INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Assets' AND COLUMN_NAME = 'InstallationLocation')
BEGIN
    ALTER TABLE [Assets] ADD [InstallationLocation] NVARCHAR(200) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Assets' AND COLUMN_NAME = 'IsDummy')
BEGIN
    ALTER TABLE [Assets] ADD [IsDummy] BIT NOT NULL DEFAULT 0;
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Assets' AND COLUMN_NAME = 'Alias')
BEGIN
    ALTER TABLE [Assets] ADD [Alias] NVARCHAR(200) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Assets' AND COLUMN_NAME = 'JobTitle')
BEGIN
    ALTER TABLE [Assets] ADD [JobTitle] NVARCHAR(200) NULL;
END
GO

-- Rename Building to LegacyBuilding if needed
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Assets' AND COLUMN_NAME = 'Building')
   AND NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Assets' AND COLUMN_NAME = 'LegacyBuilding')
BEGIN
    EXEC sp_rename 'Assets.Building', 'LegacyBuilding', 'COLUMN';
END
GO

-- Rename Department to LegacyDepartment if needed
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Assets' AND COLUMN_NAME = 'Department')
   AND NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Assets' AND COLUMN_NAME = 'LegacyDepartment')
BEGIN
    EXEC sp_rename 'Assets.Department', 'LegacyDepartment', 'COLUMN';
END
GO

-- =====================================================
-- STEP 8: Create AssetEvents table
-- =====================================================
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AssetEvents')
BEGIN
    CREATE TABLE [AssetEvents] (
        [Id] INT NOT NULL IDENTITY(1,1),
        [AssetId] INT NOT NULL,
        [EventType] INT NOT NULL,
        [Description] NVARCHAR(500) NOT NULL,
        [Notes] NVARCHAR(2000) NULL,
        [OldValue] NVARCHAR(1000) NULL,
        [NewValue] NVARCHAR(1000) NULL,
        [PerformedBy] NVARCHAR(200) NULL,
        [PerformedByEmail] NVARCHAR(200) NULL,
        [EventDate] DATETIME2 NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [PK_AssetEvents] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AssetEvents_Assets_AssetId] FOREIGN KEY ([AssetId]) REFERENCES [Assets] ([Id]) ON DELETE CASCADE
    );
    CREATE INDEX [IX_AssetEvents_AssetId] ON [AssetEvents] ([AssetId]);
    CREATE INDEX [IX_AssetEvents_EventDate] ON [AssetEvents] ([EventDate]);
END
GO

-- =====================================================
-- STEP 9: Create LeaseContracts table
-- =====================================================
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'LeaseContracts')
BEGIN
    CREATE TABLE [LeaseContracts] (
        [Id] INT NOT NULL IDENTITY(1,1),
        [AssetId] INT NOT NULL,
        [ContractNumber] NVARCHAR(100) NULL,
        [Vendor] NVARCHAR(200) NULL,
        [StartDate] DATETIME2 NOT NULL,
        [EndDate] DATETIME2 NOT NULL,
        [MonthlyRate] DECIMAL(18,2) NULL,
        [TotalValue] DECIMAL(18,2) NULL,
        [Status] INT NOT NULL DEFAULT 0,
        [Notes] NVARCHAR(2000) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        CONSTRAINT [PK_LeaseContracts] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_LeaseContracts_Assets_AssetId] FOREIGN KEY ([AssetId]) REFERENCES [Assets] ([Id]) ON DELETE CASCADE
    );
    CREATE INDEX [IX_LeaseContracts_AssetId] ON [LeaseContracts] ([AssetId]);
    CREATE INDEX [IX_LeaseContracts_EndDate] ON [LeaseContracts] ([EndDate]);
END
GO

-- =====================================================
-- STEP 10: Add foreign key constraints to Assets
-- =====================================================
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_NAME = 'FK_Assets_AssetTypes_AssetTypeId')
BEGIN
    ALTER TABLE [Assets] ADD CONSTRAINT [FK_Assets_AssetTypes_AssetTypeId]
        FOREIGN KEY ([AssetTypeId]) REFERENCES [AssetTypes] ([Id]) ON DELETE NO ACTION;
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_NAME = 'FK_Assets_Services_ServiceId')
BEGIN
    ALTER TABLE [Assets] ADD CONSTRAINT [FK_Assets_Services_ServiceId]
        FOREIGN KEY ([ServiceId]) REFERENCES [Services] ([Id]) ON DELETE SET NULL;
END
GO

-- Create indexes on Assets if they don't exist
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Assets_AssetTypeId' AND object_id = OBJECT_ID('Assets'))
BEGIN
    CREATE INDEX [IX_Assets_AssetTypeId] ON [Assets] ([AssetTypeId]);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Assets_ServiceId' AND object_id = OBJECT_ID('Assets'))
BEGIN
    CREATE INDEX [IX_Assets_ServiceId] ON [Assets] ([ServiceId]);
END
GO

-- =====================================================
-- STEP 11: Update AssetTemplates table
-- =====================================================
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AssetTemplates' AND COLUMN_NAME = 'AssetTypeId')
BEGIN
    ALTER TABLE [AssetTemplates] ADD [AssetTypeId] INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AssetTemplates' AND COLUMN_NAME = 'ServiceId')
BEGIN
    ALTER TABLE [AssetTemplates] ADD [ServiceId] INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AssetTemplates' AND COLUMN_NAME = 'InstallationLocation')
BEGIN
    ALTER TABLE [AssetTemplates] ADD [InstallationLocation] NVARCHAR(200) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AssetTemplates' AND COLUMN_NAME = 'Status')
BEGIN
    ALTER TABLE [AssetTemplates] ADD [Status] NVARCHAR(50) NULL;
END
GO

-- Rename columns in AssetTemplates if needed
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AssetTemplates' AND COLUMN_NAME = 'Building')
   AND NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AssetTemplates' AND COLUMN_NAME = 'LegacyBuilding')
BEGIN
    EXEC sp_rename 'AssetTemplates.Building', 'LegacyBuilding', 'COLUMN';
END
GO

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AssetTemplates' AND COLUMN_NAME = 'Department')
   AND NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AssetTemplates' AND COLUMN_NAME = 'LegacyDepartment')
BEGIN
    EXEC sp_rename 'AssetTemplates.Department', 'LegacyDepartment', 'COLUMN';
END
GO

-- =====================================================
-- STEP 12: Record all migrations as applied
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260115005601_InitialCreate')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ('20260115005601_InitialCreate', '8.0.11');

IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260204204003_AddOwnerBuildingSpaceToAssetTemplate')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ('20260204204003_AddOwnerBuildingSpaceToAssetTemplate', '8.0.11');

IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260204213922_AddLifecycleDatesToAssetTemplate')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ('20260204213922_AddLifecycleDatesToAssetTemplate', '8.0.11');

IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260206180625_RenameSpaceOrFloorToDepartmentAndAddOfficeLocation')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ('20260206180625_RenameSpaceOrFloorToDepartmentAndAddOfficeLocation', '8.0.11');

IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260207082708_AddJobTitleToAsset')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ('20260207082708_AddJobTitleToAsset', '8.0.11');

IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260207104746_AddIsDummyToAsset')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ('20260207104746_AddIsDummyToAsset', '8.0.11');

IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260207172900_AddAliasToAsset')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ('20260207172900_AddAliasToAsset', '8.0.11');

IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260208120048_MakeSerialNumberRequiredUnique')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ('20260208120048_MakeSerialNumberRequiredUnique', '8.0.11');

IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260208135402_MakeAssetTemplateFieldsOptional')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ('20260208135402_MakeAssetTemplateFieldsOptional', '8.0.11');

IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260214141143_AddDataModelFoundation')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ('20260214141143_AddDataModelFoundation', '8.0.11');

IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260215111618_SeedServices')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ('20260215111618_SeedServices', '8.0.11');

IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260215143306_ResetSectorsAndServices')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ('20260215143306_ResetSectorsAndServices', '8.0.11');

IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260215152419_RemoveBuildingFromAsset')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ('20260215152419_RemoveBuildingFromAsset', '8.0.11');

IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260215154044_AddCategoryForAssetTypes')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ('20260215154044_AddCategoryForAssetTypes', '8.0.11');

IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260215160723_SeedLocations')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ('20260215160723_SeedLocations', '8.0.11');

IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260215185002_AlignTemplatesWithAssetForm')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ('20260215185002_AlignTemplatesWithAssetForm', '8.0.11');
GO

PRINT 'Schema update completed successfully!';
GO

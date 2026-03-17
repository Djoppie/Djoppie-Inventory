-- SQL Server Migration Script for RolloutFeatureRedesign
-- Applies missing schema changes to Azure SQL Database
-- Run this script in Azure SQL Query Editor

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET CONCAT_NULL_YIELDS_NULL ON;

BEGIN TRANSACTION;

-- Add columns to Services table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Services') AND name = 'BuildingId')
    ALTER TABLE [Services] ADD [BuildingId] int NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Services') AND name = 'EntraGroupId')
    ALTER TABLE [Services] ADD [EntraGroupId] nvarchar(50) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Services') AND name = 'EntraLastSyncAt')
    ALTER TABLE [Services] ADD [EntraLastSyncAt] datetime2 NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Services') AND name = 'EntraMailNickname')
    ALTER TABLE [Services] ADD [EntraMailNickname] nvarchar(100) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Services') AND name = 'EntraSyncEnabled')
    ALTER TABLE [Services] ADD [EntraSyncEnabled] bit NOT NULL DEFAULT 0;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Services') AND name = 'EntraSyncError')
    ALTER TABLE [Services] ADD [EntraSyncError] nvarchar(2000) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Services') AND name = 'EntraSyncStatus')
    ALTER TABLE [Services] ADD [EntraSyncStatus] int NOT NULL DEFAULT 0;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Services') AND name = 'ManagerDisplayName')
    ALTER TABLE [Services] ADD [ManagerDisplayName] nvarchar(200) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Services') AND name = 'ManagerEmail')
    ALTER TABLE [Services] ADD [ManagerEmail] nvarchar(200) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Services') AND name = 'ManagerEntraId')
    ALTER TABLE [Services] ADD [ManagerEntraId] nvarchar(50) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Services') AND name = 'MemberCount')
    ALTER TABLE [Services] ADD [MemberCount] int NOT NULL DEFAULT 0;

-- Add columns to Sectors table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Sectors') AND name = 'EntraGroupId')
    ALTER TABLE [Sectors] ADD [EntraGroupId] nvarchar(50) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Sectors') AND name = 'EntraLastSyncAt')
    ALTER TABLE [Sectors] ADD [EntraLastSyncAt] datetime2 NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Sectors') AND name = 'EntraMailNickname')
    ALTER TABLE [Sectors] ADD [EntraMailNickname] nvarchar(100) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Sectors') AND name = 'EntraSyncEnabled')
    ALTER TABLE [Sectors] ADD [EntraSyncEnabled] bit NOT NULL DEFAULT 0;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Sectors') AND name = 'EntraSyncError')
    ALTER TABLE [Sectors] ADD [EntraSyncError] nvarchar(2000) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Sectors') AND name = 'EntraSyncStatus')
    ALTER TABLE [Sectors] ADD [EntraSyncStatus] int NOT NULL DEFAULT 0;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Sectors') AND name = 'ManagerDisplayName')
    ALTER TABLE [Sectors] ADD [ManagerDisplayName] nvarchar(200) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Sectors') AND name = 'ManagerEmail')
    ALTER TABLE [Sectors] ADD [ManagerEmail] nvarchar(200) NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Sectors') AND name = 'ManagerEntraId')
    ALTER TABLE [Sectors] ADD [ManagerEntraId] nvarchar(50) NULL;

-- Add columns to RolloutWorkplaces table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('RolloutWorkplaces') AND name = 'BuildingId')
    ALTER TABLE [RolloutWorkplaces] ADD [BuildingId] int NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('RolloutWorkplaces') AND name = 'UserEntraId')
    ALTER TABLE [RolloutWorkplaces] ADD [UserEntraId] nvarchar(50) NULL;

-- Add columns to Assets table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Assets') AND name = 'BuildingId')
    ALTER TABLE [Assets] ADD [BuildingId] int NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Assets') AND name = 'CurrentWorkplaceAssignmentId')
    ALTER TABLE [Assets] ADD [CurrentWorkplaceAssignmentId] int NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Assets') AND name = 'LastRolloutSessionId')
    ALTER TABLE [Assets] ADD [LastRolloutSessionId] int NULL;

-- Create RolloutDayServices table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('RolloutDayServices') AND type = 'U')
BEGIN
    CREATE TABLE [RolloutDayServices] (
        [Id] int NOT NULL IDENTITY(1,1),
        [RolloutDayId] int NOT NULL,
        [ServiceId] int NOT NULL,
        [SortOrder] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_RolloutDayServices] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RolloutDayServices_RolloutDays_RolloutDayId] FOREIGN KEY ([RolloutDayId]) REFERENCES [RolloutDays] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_RolloutDayServices_Services_ServiceId] FOREIGN KEY ([ServiceId]) REFERENCES [Services] ([Id]) ON DELETE NO ACTION
    );
END

-- Create WorkplaceAssetAssignments table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('WorkplaceAssetAssignments') AND type = 'U')
BEGIN
    CREATE TABLE [WorkplaceAssetAssignments] (
        [Id] int NOT NULL IDENTITY(1,1),
        [RolloutWorkplaceId] int NOT NULL,
        [AssetTypeId] int NOT NULL,
        [AssignmentCategory] int NOT NULL,
        [SourceType] int NOT NULL,
        [NewAssetId] int NULL,
        [OldAssetId] int NULL,
        [AssetTemplateId] int NULL,
        [Position] int NOT NULL,
        [SerialNumberRequired] bit NOT NULL,
        [QRCodeRequired] bit NOT NULL,
        [SerialNumberCaptured] nvarchar(100) NULL,
        [Status] int NOT NULL,
        [InstalledAt] datetime2 NULL,
        [InstalledBy] nvarchar(200) NULL,
        [InstalledByEmail] nvarchar(200) NULL,
        [Notes] nvarchar(2000) NULL,
        [MetadataJson] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_WorkplaceAssetAssignments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_WorkplaceAssetAssignments_AssetTemplates_AssetTemplateId] FOREIGN KEY ([AssetTemplateId]) REFERENCES [AssetTemplates] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_WorkplaceAssetAssignments_AssetTypes_AssetTypeId] FOREIGN KEY ([AssetTypeId]) REFERENCES [AssetTypes] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_WorkplaceAssetAssignments_Assets_NewAssetId] FOREIGN KEY ([NewAssetId]) REFERENCES [Assets] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_WorkplaceAssetAssignments_Assets_OldAssetId] FOREIGN KEY ([OldAssetId]) REFERENCES [Assets] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_WorkplaceAssetAssignments_RolloutWorkplaces_RolloutWorkplaceId] FOREIGN KEY ([RolloutWorkplaceId]) REFERENCES [RolloutWorkplaces] ([Id]) ON DELETE CASCADE
    );
END

-- Create RolloutAssetMovements table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('RolloutAssetMovements') AND type = 'U')
BEGIN
    CREATE TABLE [RolloutAssetMovements] (
        [Id] int NOT NULL IDENTITY(1,1),
        [RolloutSessionId] int NOT NULL,
        [RolloutWorkplaceId] int NULL,
        [WorkplaceAssetAssignmentId] int NULL,
        [AssetId] int NOT NULL,
        [MovementType] int NOT NULL,
        [PreviousStatus] int NULL,
        [NewStatus] int NOT NULL,
        [PreviousOwner] nvarchar(200) NULL,
        [NewOwner] nvarchar(200) NULL,
        [PreviousServiceId] int NULL,
        [NewServiceId] int NULL,
        [PreviousLocation] nvarchar(200) NULL,
        [NewLocation] nvarchar(200) NULL,
        [SerialNumber] nvarchar(100) NULL,
        [PerformedBy] nvarchar(200) NOT NULL,
        [PerformedByEmail] nvarchar(200) NOT NULL,
        [PerformedAt] datetime2 NOT NULL,
        [Notes] nvarchar(2000) NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_RolloutAssetMovements] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RolloutAssetMovements_Assets_AssetId] FOREIGN KEY ([AssetId]) REFERENCES [Assets] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_RolloutAssetMovements_RolloutSessions_RolloutSessionId] FOREIGN KEY ([RolloutSessionId]) REFERENCES [RolloutSessions] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_RolloutAssetMovements_RolloutWorkplaces_RolloutWorkplaceId] FOREIGN KEY ([RolloutWorkplaceId]) REFERENCES [RolloutWorkplaces] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_RolloutAssetMovements_Services_NewServiceId] FOREIGN KEY ([NewServiceId]) REFERENCES [Services] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_RolloutAssetMovements_Services_PreviousServiceId] FOREIGN KEY ([PreviousServiceId]) REFERENCES [Services] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_RolloutAssetMovements_WorkplaceAssetAssignments_WorkplaceAssetAssignmentId] FOREIGN KEY ([WorkplaceAssetAssignmentId]) REFERENCES [WorkplaceAssetAssignments] ([Id]) ON DELETE NO ACTION
    );
END

-- Create indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Services_BuildingId')
    CREATE INDEX [IX_Services_BuildingId] ON [Services] ([BuildingId]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RolloutWorkplaces_BuildingId')
    CREATE INDEX [IX_RolloutWorkplaces_BuildingId] ON [RolloutWorkplaces] ([BuildingId]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Assets_BuildingId')
    CREATE INDEX [IX_Assets_BuildingId] ON [Assets] ([BuildingId]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Assets_CurrentWorkplaceAssignmentId')
    CREATE INDEX [IX_Assets_CurrentWorkplaceAssignmentId] ON [Assets] ([CurrentWorkplaceAssignmentId]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Assets_LastRolloutSessionId')
    CREATE INDEX [IX_Assets_LastRolloutSessionId] ON [Assets] ([LastRolloutSessionId]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RolloutAssetMovements_AssetId')
    CREATE INDEX [IX_RolloutAssetMovements_AssetId] ON [RolloutAssetMovements] ([AssetId]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RolloutAssetMovements_MovementType')
    CREATE INDEX [IX_RolloutAssetMovements_MovementType] ON [RolloutAssetMovements] ([MovementType]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RolloutAssetMovements_NewServiceId')
    CREATE INDEX [IX_RolloutAssetMovements_NewServiceId] ON [RolloutAssetMovements] ([NewServiceId]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RolloutAssetMovements_PerformedAt')
    CREATE INDEX [IX_RolloutAssetMovements_PerformedAt] ON [RolloutAssetMovements] ([PerformedAt]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RolloutAssetMovements_PreviousServiceId')
    CREATE INDEX [IX_RolloutAssetMovements_PreviousServiceId] ON [RolloutAssetMovements] ([PreviousServiceId]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RolloutAssetMovements_RolloutSessionId')
    CREATE INDEX [IX_RolloutAssetMovements_RolloutSessionId] ON [RolloutAssetMovements] ([RolloutSessionId]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RolloutAssetMovements_RolloutWorkplaceId')
    CREATE INDEX [IX_RolloutAssetMovements_RolloutWorkplaceId] ON [RolloutAssetMovements] ([RolloutWorkplaceId]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RolloutAssetMovements_WorkplaceAssetAssignmentId')
    CREATE INDEX [IX_RolloutAssetMovements_WorkplaceAssetAssignmentId] ON [RolloutAssetMovements] ([WorkplaceAssetAssignmentId]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RolloutDayServices_RolloutDayId')
    CREATE INDEX [IX_RolloutDayServices_RolloutDayId] ON [RolloutDayServices] ([RolloutDayId]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RolloutDayServices_RolloutDayId_ServiceId')
    CREATE UNIQUE INDEX [IX_RolloutDayServices_RolloutDayId_ServiceId] ON [RolloutDayServices] ([RolloutDayId], [ServiceId]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RolloutDayServices_ServiceId')
    CREATE INDEX [IX_RolloutDayServices_ServiceId] ON [RolloutDayServices] ([ServiceId]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_WorkplaceAssetAssignments_AssetTemplateId')
    CREATE INDEX [IX_WorkplaceAssetAssignments_AssetTemplateId] ON [WorkplaceAssetAssignments] ([AssetTemplateId]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_WorkplaceAssetAssignments_AssetTypeId')
    CREATE INDEX [IX_WorkplaceAssetAssignments_AssetTypeId] ON [WorkplaceAssetAssignments] ([AssetTypeId]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_WorkplaceAssetAssignments_NewAssetId')
    CREATE INDEX [IX_WorkplaceAssetAssignments_NewAssetId] ON [WorkplaceAssetAssignments] ([NewAssetId]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_WorkplaceAssetAssignments_OldAssetId')
    CREATE INDEX [IX_WorkplaceAssetAssignments_OldAssetId] ON [WorkplaceAssetAssignments] ([OldAssetId]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_WorkplaceAssetAssignments_RolloutWorkplaceId')
    CREATE INDEX [IX_WorkplaceAssetAssignments_RolloutWorkplaceId] ON [WorkplaceAssetAssignments] ([RolloutWorkplaceId]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_WorkplaceAssetAssignments_Status')
    CREATE INDEX [IX_WorkplaceAssetAssignments_Status] ON [WorkplaceAssetAssignments] ([Status]);

-- Add foreign key constraints for new columns
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Assets_Buildings_BuildingId')
    ALTER TABLE [Assets] ADD CONSTRAINT [FK_Assets_Buildings_BuildingId] FOREIGN KEY ([BuildingId]) REFERENCES [Buildings] ([Id]) ON DELETE SET NULL;
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Assets_RolloutSessions_LastRolloutSessionId')
    ALTER TABLE [Assets] ADD CONSTRAINT [FK_Assets_RolloutSessions_LastRolloutSessionId] FOREIGN KEY ([LastRolloutSessionId]) REFERENCES [RolloutSessions] ([Id]) ON DELETE SET NULL;
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Assets_WorkplaceAssetAssignments_CurrentWorkplaceAssignmentId')
    ALTER TABLE [Assets] ADD CONSTRAINT [FK_Assets_WorkplaceAssetAssignments_CurrentWorkplaceAssignmentId] FOREIGN KEY ([CurrentWorkplaceAssignmentId]) REFERENCES [WorkplaceAssetAssignments] ([Id]) ON DELETE NO ACTION;
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_RolloutWorkplaces_Buildings_BuildingId')
    ALTER TABLE [RolloutWorkplaces] ADD CONSTRAINT [FK_RolloutWorkplaces_Buildings_BuildingId] FOREIGN KEY ([BuildingId]) REFERENCES [Buildings] ([Id]) ON DELETE SET NULL;
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Services_Buildings_BuildingId')
    ALTER TABLE [Services] ADD CONSTRAINT [FK_Services_Buildings_BuildingId] FOREIGN KEY ([BuildingId]) REFERENCES [Buildings] ([Id]) ON DELETE SET NULL;

-- Record migration as applied
IF NOT EXISTS (SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260316181853_RolloutFeatureRedesign')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES (N'20260316181853_RolloutFeatureRedesign', N'8.0.11');

COMMIT;

PRINT 'Migration applied successfully!';

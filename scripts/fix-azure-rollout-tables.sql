-- Fix Azure SQL: Create rollout tables and sync migration history
-- Run this against the Azure SQL database to fix the 500 error on /api/rollouts

-- Step 1: Create __EFMigrationsHistory if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '__EFMigrationsHistory')
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
    PRINT 'Created __EFMigrationsHistory table';
END
GO

-- Step 2: Mark all existing migrations as applied (so Migrate() won't try to re-run them)
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
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260217174941_ExpandServiceCodeLength')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ('20260217174941_ExpandServiceCodeLength', '8.0.11');
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260219004500_MakeAssetTemplateCategoryNullable')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ('20260219004500_MakeAssetTemplateCategoryNullable', '8.0.11');
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260302224016_MakeSerialNumberOptional')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ('20260302224016_MakeSerialNumberOptional', '8.0.11');
GO

PRINT 'Migration history synced';

-- Step 3: Create rollout tables if they don't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RolloutSessions')
BEGIN
    CREATE TABLE [RolloutSessions] (
        [Id] int NOT NULL IDENTITY(1,1),
        [SessionName] nvarchar(200) NOT NULL,
        [Description] nvarchar(2000) NULL,
        [Status] int NOT NULL,
        [PlannedStartDate] datetime2 NOT NULL,
        [PlannedEndDate] datetime2 NULL,
        [StartedAt] datetime2 NULL,
        [CompletedAt] datetime2 NULL,
        [CreatedBy] nvarchar(200) NOT NULL,
        [CreatedByEmail] nvarchar(200) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_RolloutSessions] PRIMARY KEY ([Id])
    );
    PRINT 'Created RolloutSessions table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RolloutDays')
BEGIN
    CREATE TABLE [RolloutDays] (
        [Id] int NOT NULL IDENTITY(1,1),
        [RolloutSessionId] int NOT NULL,
        [Date] datetime2 NOT NULL,
        [Name] nvarchar(200) NULL,
        [DayNumber] int NOT NULL,
        [ScheduledServiceIds] nvarchar(500) NULL,
        [TotalWorkplaces] int NOT NULL,
        [CompletedWorkplaces] int NOT NULL,
        [Notes] nvarchar(2000) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_RolloutDays] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RolloutDays_RolloutSessions_RolloutSessionId] FOREIGN KEY ([RolloutSessionId])
            REFERENCES [RolloutSessions] ([Id]) ON DELETE CASCADE
    );
    PRINT 'Created RolloutDays table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RolloutWorkplaces')
BEGIN
    CREATE TABLE [RolloutWorkplaces] (
        [Id] int NOT NULL IDENTITY(1,1),
        [RolloutDayId] int NOT NULL,
        [UserName] nvarchar(200) NOT NULL,
        [UserEmail] nvarchar(200) NULL,
        [Location] nvarchar(200) NULL,
        [ServiceId] int NULL,
        [IsLaptopSetup] bit NOT NULL,
        [AssetPlansJson] nvarchar(max) NOT NULL,
        [Status] int NOT NULL,
        [TotalItems] int NOT NULL,
        [CompletedItems] int NOT NULL,
        [CompletedAt] datetime2 NULL,
        [CompletedBy] nvarchar(200) NULL,
        [CompletedByEmail] nvarchar(200) NULL,
        [Notes] nvarchar(2000) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_RolloutWorkplaces] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RolloutWorkplaces_RolloutDays_RolloutDayId] FOREIGN KEY ([RolloutDayId])
            REFERENCES [RolloutDays] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_RolloutWorkplaces_Services_ServiceId] FOREIGN KEY ([ServiceId])
            REFERENCES [Services] ([Id]) ON DELETE SET NULL
    );
    PRINT 'Created RolloutWorkplaces table';
END
GO

-- Step 4: Create indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RolloutDays_Date')
    CREATE INDEX [IX_RolloutDays_Date] ON [RolloutDays] ([Date]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RolloutDays_RolloutSessionId')
    CREATE INDEX [IX_RolloutDays_RolloutSessionId] ON [RolloutDays] ([RolloutSessionId]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RolloutSessions_PlannedStartDate')
    CREATE INDEX [IX_RolloutSessions_PlannedStartDate] ON [RolloutSessions] ([PlannedStartDate]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RolloutSessions_Status')
    CREATE INDEX [IX_RolloutSessions_Status] ON [RolloutSessions] ([Status]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RolloutWorkplaces_RolloutDayId')
    CREATE INDEX [IX_RolloutWorkplaces_RolloutDayId] ON [RolloutWorkplaces] ([RolloutDayId]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RolloutWorkplaces_ServiceId')
    CREATE INDEX [IX_RolloutWorkplaces_ServiceId] ON [RolloutWorkplaces] ([ServiceId]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RolloutWorkplaces_Status')
    CREATE INDEX [IX_RolloutWorkplaces_Status] ON [RolloutWorkplaces] ([Status]);
GO

PRINT 'Indexes created';

-- Step 5: Mark rollout migration as applied
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260306193256_AddRolloutWorkflowV2')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ('20260306193256_AddRolloutWorkflowV2', '8.0.11');
GO

PRINT 'Done! Rollout tables created and migration history synced.';
PRINT 'Restart the App Service to verify.';

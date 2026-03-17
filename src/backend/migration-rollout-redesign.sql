BEGIN TRANSACTION;
GO

ALTER TABLE [Services] ADD [BuildingId] INTEGER NULL;
GO

ALTER TABLE [Services] ADD [EntraGroupId] TEXT NULL;
GO

ALTER TABLE [Services] ADD [EntraLastSyncAt] TEXT NULL;
GO

ALTER TABLE [Services] ADD [EntraMailNickname] TEXT NULL;
GO

ALTER TABLE [Services] ADD [EntraSyncEnabled] INTEGER NOT NULL DEFAULT CAST(0 AS INTEGER);
GO

ALTER TABLE [Services] ADD [EntraSyncError] TEXT NULL;
GO

ALTER TABLE [Services] ADD [EntraSyncStatus] INTEGER NOT NULL DEFAULT 0;
GO

ALTER TABLE [Services] ADD [ManagerDisplayName] TEXT NULL;
GO

ALTER TABLE [Services] ADD [ManagerEmail] TEXT NULL;
GO

ALTER TABLE [Services] ADD [ManagerEntraId] TEXT NULL;
GO

ALTER TABLE [Services] ADD [MemberCount] INTEGER NOT NULL DEFAULT 0;
GO

ALTER TABLE [Sectors] ADD [EntraGroupId] TEXT NULL;
GO

ALTER TABLE [Sectors] ADD [EntraLastSyncAt] TEXT NULL;
GO

ALTER TABLE [Sectors] ADD [EntraMailNickname] TEXT NULL;
GO

ALTER TABLE [Sectors] ADD [EntraSyncEnabled] INTEGER NOT NULL DEFAULT CAST(0 AS INTEGER);
GO

ALTER TABLE [Sectors] ADD [EntraSyncError] TEXT NULL;
GO

ALTER TABLE [Sectors] ADD [EntraSyncStatus] INTEGER NOT NULL DEFAULT 0;
GO

ALTER TABLE [Sectors] ADD [ManagerDisplayName] TEXT NULL;
GO

ALTER TABLE [Sectors] ADD [ManagerEmail] TEXT NULL;
GO

ALTER TABLE [Sectors] ADD [ManagerEntraId] TEXT NULL;
GO

ALTER TABLE [RolloutWorkplaces] ADD [BuildingId] INTEGER NULL;
GO

ALTER TABLE [RolloutWorkplaces] ADD [UserEntraId] TEXT NULL;
GO

ALTER TABLE [Assets] ADD [BuildingId] INTEGER NULL;
GO

ALTER TABLE [Assets] ADD [CurrentWorkplaceAssignmentId] INTEGER NULL;
GO

ALTER TABLE [Assets] ADD [LastRolloutSessionId] INTEGER NULL;
GO

CREATE TABLE [RolloutDayServices] (
    [Id] INTEGER NOT NULL,
    [RolloutDayId] INTEGER NOT NULL,
    [ServiceId] INTEGER NOT NULL,
    [SortOrder] INTEGER NOT NULL,
    [CreatedAt] TEXT NOT NULL,
    CONSTRAINT [PK_RolloutDayServices] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_RolloutDayServices_RolloutDays_RolloutDayId] FOREIGN KEY ([RolloutDayId]) REFERENCES [RolloutDays] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_RolloutDayServices_Services_ServiceId] FOREIGN KEY ([ServiceId]) REFERENCES [Services] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [WorkplaceAssetAssignments] (
    [Id] INTEGER NOT NULL,
    [RolloutWorkplaceId] INTEGER NOT NULL,
    [AssetTypeId] INTEGER NOT NULL,
    [AssignmentCategory] INTEGER NOT NULL,
    [SourceType] INTEGER NOT NULL,
    [NewAssetId] INTEGER NULL,
    [OldAssetId] INTEGER NULL,
    [AssetTemplateId] INTEGER NULL,
    [Position] INTEGER NOT NULL,
    [SerialNumberRequired] INTEGER NOT NULL,
    [QRCodeRequired] INTEGER NOT NULL,
    [SerialNumberCaptured] TEXT NULL,
    [Status] INTEGER NOT NULL,
    [InstalledAt] TEXT NULL,
    [InstalledBy] TEXT NULL,
    [InstalledByEmail] TEXT NULL,
    [Notes] TEXT NULL,
    [MetadataJson] TEXT NULL,
    [CreatedAt] TEXT NOT NULL,
    [UpdatedAt] TEXT NOT NULL,
    CONSTRAINT [PK_WorkplaceAssetAssignments] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_WorkplaceAssetAssignments_AssetTemplates_AssetTemplateId] FOREIGN KEY ([AssetTemplateId]) REFERENCES [AssetTemplates] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_WorkplaceAssetAssignments_AssetTypes_AssetTypeId] FOREIGN KEY ([AssetTypeId]) REFERENCES [AssetTypes] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_WorkplaceAssetAssignments_Assets_NewAssetId] FOREIGN KEY ([NewAssetId]) REFERENCES [Assets] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_WorkplaceAssetAssignments_Assets_OldAssetId] FOREIGN KEY ([OldAssetId]) REFERENCES [Assets] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_WorkplaceAssetAssignments_RolloutWorkplaces_RolloutWorkplaceId] FOREIGN KEY ([RolloutWorkplaceId]) REFERENCES [RolloutWorkplaces] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [RolloutAssetMovements] (
    [Id] INTEGER NOT NULL,
    [RolloutSessionId] INTEGER NOT NULL,
    [RolloutWorkplaceId] INTEGER NULL,
    [WorkplaceAssetAssignmentId] INTEGER NULL,
    [AssetId] INTEGER NOT NULL,
    [MovementType] INTEGER NOT NULL,
    [PreviousStatus] INTEGER NULL,
    [NewStatus] INTEGER NOT NULL,
    [PreviousOwner] TEXT NULL,
    [NewOwner] TEXT NULL,
    [PreviousServiceId] INTEGER NULL,
    [NewServiceId] INTEGER NULL,
    [PreviousLocation] TEXT NULL,
    [NewLocation] TEXT NULL,
    [SerialNumber] TEXT NULL,
    [PerformedBy] TEXT NOT NULL,
    [PerformedByEmail] TEXT NOT NULL,
    [PerformedAt] TEXT NOT NULL,
    [Notes] TEXT NULL,
    [CreatedAt] TEXT NOT NULL,
    CONSTRAINT [PK_RolloutAssetMovements] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_RolloutAssetMovements_Assets_AssetId] FOREIGN KEY ([AssetId]) REFERENCES [Assets] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_RolloutAssetMovements_RolloutSessions_RolloutSessionId] FOREIGN KEY ([RolloutSessionId]) REFERENCES [RolloutSessions] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_RolloutAssetMovements_RolloutWorkplaces_RolloutWorkplaceId] FOREIGN KEY ([RolloutWorkplaceId]) REFERENCES [RolloutWorkplaces] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_RolloutAssetMovements_Services_NewServiceId] FOREIGN KEY ([NewServiceId]) REFERENCES [Services] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_RolloutAssetMovements_Services_PreviousServiceId] FOREIGN KEY ([PreviousServiceId]) REFERENCES [Services] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_RolloutAssetMovements_WorkplaceAssetAssignments_WorkplaceAssetAssignmentId] FOREIGN KEY ([WorkplaceAssetAssignmentId]) REFERENCES [WorkplaceAssetAssignments] ([Id]) ON DELETE SET NULL
);
GO

UPDATE [Sectors] SET [EntraGroupId] = NULL, [EntraLastSyncAt] = NULL, [EntraMailNickname] = NULL, [EntraSyncEnabled] = CAST(0 AS INTEGER), [EntraSyncError] = NULL, [EntraSyncStatus] = 0, [ManagerDisplayName] = NULL, [ManagerEmail] = NULL, [ManagerEntraId] = NULL
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Sectors] SET [EntraGroupId] = NULL, [EntraLastSyncAt] = NULL, [EntraMailNickname] = NULL, [EntraSyncEnabled] = CAST(0 AS INTEGER), [EntraSyncError] = NULL, [EntraSyncStatus] = 0, [ManagerDisplayName] = NULL, [ManagerEmail] = NULL, [ManagerEntraId] = NULL
WHERE [Id] = 2;
SELECT @@ROWCOUNT;

GO

UPDATE [Sectors] SET [EntraGroupId] = NULL, [EntraLastSyncAt] = NULL, [EntraMailNickname] = NULL, [EntraSyncEnabled] = CAST(0 AS INTEGER), [EntraSyncError] = NULL, [EntraSyncStatus] = 0, [ManagerDisplayName] = NULL, [ManagerEmail] = NULL, [ManagerEntraId] = NULL
WHERE [Id] = 3;
SELECT @@ROWCOUNT;

GO

UPDATE [Sectors] SET [EntraGroupId] = NULL, [EntraLastSyncAt] = NULL, [EntraMailNickname] = NULL, [EntraSyncEnabled] = CAST(0 AS INTEGER), [EntraSyncError] = NULL, [EntraSyncStatus] = 0, [ManagerDisplayName] = NULL, [ManagerEmail] = NULL, [ManagerEntraId] = NULL
WHERE [Id] = 4;
SELECT @@ROWCOUNT;

GO

UPDATE [Sectors] SET [EntraGroupId] = NULL, [EntraLastSyncAt] = NULL, [EntraMailNickname] = NULL, [EntraSyncEnabled] = CAST(0 AS INTEGER), [EntraSyncError] = NULL, [EntraSyncStatus] = 0, [ManagerDisplayName] = NULL, [ManagerEmail] = NULL, [ManagerEntraId] = NULL
WHERE [Id] = 5;
SELECT @@ROWCOUNT;

GO

UPDATE [Services] SET [BuildingId] = NULL, [EntraGroupId] = NULL, [EntraLastSyncAt] = NULL, [EntraMailNickname] = NULL, [EntraSyncEnabled] = CAST(0 AS INTEGER), [EntraSyncError] = NULL, [EntraSyncStatus] = 0, [ManagerDisplayName] = NULL, [ManagerEmail] = NULL, [ManagerEntraId] = NULL, [MemberCount] = 0
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Services] SET [BuildingId] = NULL, [EntraGroupId] = NULL, [EntraLastSyncAt] = NULL, [EntraMailNickname] = NULL, [EntraSyncEnabled] = CAST(0 AS INTEGER), [EntraSyncError] = NULL, [EntraSyncStatus] = 0, [ManagerDisplayName] = NULL, [ManagerEmail] = NULL, [ManagerEntraId] = NULL, [MemberCount] = 0
WHERE [Id] = 2;
SELECT @@ROWCOUNT;

GO

UPDATE [Services] SET [BuildingId] = NULL, [EntraGroupId] = NULL, [EntraLastSyncAt] = NULL, [EntraMailNickname] = NULL, [EntraSyncEnabled] = CAST(0 AS INTEGER), [EntraSyncError] = NULL, [EntraSyncStatus] = 0, [ManagerDisplayName] = NULL, [ManagerEmail] = NULL, [ManagerEntraId] = NULL, [MemberCount] = 0
WHERE [Id] = 3;
SELECT @@ROWCOUNT;

GO

UPDATE [Services] SET [BuildingId] = NULL, [EntraGroupId] = NULL, [EntraLastSyncAt] = NULL, [EntraMailNickname] = NULL, [EntraSyncEnabled] = CAST(0 AS INTEGER), [EntraSyncError] = NULL, [EntraSyncStatus] = 0, [ManagerDisplayName] = NULL, [ManagerEmail] = NULL, [ManagerEntraId] = NULL, [MemberCount] = 0
WHERE [Id] = 4;
SELECT @@ROWCOUNT;

GO

UPDATE [Services] SET [BuildingId] = NULL, [EntraGroupId] = NULL, [EntraLastSyncAt] = NULL, [EntraMailNickname] = NULL, [EntraSyncEnabled] = CAST(0 AS INTEGER), [EntraSyncError] = NULL, [EntraSyncStatus] = 0, [ManagerDisplayName] = NULL, [ManagerEmail] = NULL, [ManagerEntraId] = NULL, [MemberCount] = 0
WHERE [Id] = 5;
SELECT @@ROWCOUNT;

GO

UPDATE [Services] SET [BuildingId] = NULL, [EntraGroupId] = NULL, [EntraLastSyncAt] = NULL, [EntraMailNickname] = NULL, [EntraSyncEnabled] = CAST(0 AS INTEGER), [EntraSyncError] = NULL, [EntraSyncStatus] = 0, [ManagerDisplayName] = NULL, [ManagerEmail] = NULL, [ManagerEntraId] = NULL, [MemberCount] = 0
WHERE [Id] = 6;
SELECT @@ROWCOUNT;

GO

UPDATE [Services] SET [BuildingId] = NULL, [EntraGroupId] = NULL, [EntraLastSyncAt] = NULL, [EntraMailNickname] = NULL, [EntraSyncEnabled] = CAST(0 AS INTEGER), [EntraSyncError] = NULL, [EntraSyncStatus] = 0, [ManagerDisplayName] = NULL, [ManagerEmail] = NULL, [ManagerEntraId] = NULL, [MemberCount] = 0
WHERE [Id] = 7;
SELECT @@ROWCOUNT;

GO

UPDATE [Services] SET [BuildingId] = NULL, [EntraGroupId] = NULL, [EntraLastSyncAt] = NULL, [EntraMailNickname] = NULL, [EntraSyncEnabled] = CAST(0 AS INTEGER), [EntraSyncError] = NULL, [EntraSyncStatus] = 0, [ManagerDisplayName] = NULL, [ManagerEmail] = NULL, [ManagerEntraId] = NULL, [MemberCount] = 0
WHERE [Id] = 8;
SELECT @@ROWCOUNT;

GO

UPDATE [Services] SET [BuildingId] = NULL, [EntraGroupId] = NULL, [EntraLastSyncAt] = NULL, [EntraMailNickname] = NULL, [EntraSyncEnabled] = CAST(0 AS INTEGER), [EntraSyncError] = NULL, [EntraSyncStatus] = 0, [ManagerDisplayName] = NULL, [ManagerEmail] = NULL, [ManagerEntraId] = NULL, [MemberCount] = 0
WHERE [Id] = 9;
SELECT @@ROWCOUNT;

GO

UPDATE [Services] SET [BuildingId] = NULL, [EntraGroupId] = NULL, [EntraLastSyncAt] = NULL, [EntraMailNickname] = NULL, [EntraSyncEnabled] = CAST(0 AS INTEGER), [EntraSyncError] = NULL, [EntraSyncStatus] = 0, [ManagerDisplayName] = NULL, [ManagerEmail] = NULL, [ManagerEntraId] = NULL, [MemberCount] = 0
WHERE [Id] = 10;
SELECT @@ROWCOUNT;

GO

UPDATE [Services] SET [BuildingId] = NULL, [EntraGroupId] = NULL, [EntraLastSyncAt] = NULL, [EntraMailNickname] = NULL, [EntraSyncEnabled] = CAST(0 AS INTEGER), [EntraSyncError] = NULL, [EntraSyncStatus] = 0, [ManagerDisplayName] = NULL, [ManagerEmail] = NULL, [ManagerEntraId] = NULL, [MemberCount] = 0
WHERE [Id] = 11;
SELECT @@ROWCOUNT;

GO

UPDATE [Services] SET [BuildingId] = NULL, [EntraGroupId] = NULL, [EntraLastSyncAt] = NULL, [EntraMailNickname] = NULL, [EntraSyncEnabled] = CAST(0 AS INTEGER), [EntraSyncError] = NULL, [EntraSyncStatus] = 0, [ManagerDisplayName] = NULL, [ManagerEmail] = NULL, [ManagerEntraId] = NULL, [MemberCount] = 0
WHERE [Id] = 12;
SELECT @@ROWCOUNT;

GO

UPDATE [Services] SET [BuildingId] = NULL, [EntraGroupId] = NULL, [EntraLastSyncAt] = NULL, [EntraMailNickname] = NULL, [EntraSyncEnabled] = CAST(0 AS INTEGER), [EntraSyncError] = NULL, [EntraSyncStatus] = 0, [ManagerDisplayName] = NULL, [ManagerEmail] = NULL, [ManagerEntraId] = NULL, [MemberCount] = 0
WHERE [Id] = 13;
SELECT @@ROWCOUNT;

GO

UPDATE [Services] SET [BuildingId] = NULL, [EntraGroupId] = NULL, [EntraLastSyncAt] = NULL, [EntraMailNickname] = NULL, [EntraSyncEnabled] = CAST(0 AS INTEGER), [EntraSyncError] = NULL, [EntraSyncStatus] = 0, [ManagerDisplayName] = NULL, [ManagerEmail] = NULL, [ManagerEntraId] = NULL, [MemberCount] = 0
WHERE [Id] = 14;
SELECT @@ROWCOUNT;

GO

UPDATE [Services] SET [BuildingId] = NULL, [EntraGroupId] = NULL, [EntraLastSyncAt] = NULL, [EntraMailNickname] = NULL, [EntraSyncEnabled] = CAST(0 AS INTEGER), [EntraSyncError] = NULL, [EntraSyncStatus] = 0, [ManagerDisplayName] = NULL, [ManagerEmail] = NULL, [ManagerEntraId] = NULL, [MemberCount] = 0
WHERE [Id] = 15;
SELECT @@ROWCOUNT;

GO

UPDATE [Services] SET [BuildingId] = NULL, [EntraGroupId] = NULL, [EntraLastSyncAt] = NULL, [EntraMailNickname] = NULL, [EntraSyncEnabled] = CAST(0 AS INTEGER), [EntraSyncError] = NULL, [EntraSyncStatus] = 0, [ManagerDisplayName] = NULL, [ManagerEmail] = NULL, [ManagerEntraId] = NULL, [MemberCount] = 0
WHERE [Id] = 16;
SELECT @@ROWCOUNT;

GO

UPDATE [Services] SET [BuildingId] = NULL, [EntraGroupId] = NULL, [EntraLastSyncAt] = NULL, [EntraMailNickname] = NULL, [EntraSyncEnabled] = CAST(0 AS INTEGER), [EntraSyncError] = NULL, [EntraSyncStatus] = 0, [ManagerDisplayName] = NULL, [ManagerEmail] = NULL, [ManagerEntraId] = NULL, [MemberCount] = 0
WHERE [Id] = 17;
SELECT @@ROWCOUNT;

GO

UPDATE [Services] SET [BuildingId] = NULL, [EntraGroupId] = NULL, [EntraLastSyncAt] = NULL, [EntraMailNickname] = NULL, [EntraSyncEnabled] = CAST(0 AS INTEGER), [EntraSyncError] = NULL, [EntraSyncStatus] = 0, [ManagerDisplayName] = NULL, [ManagerEmail] = NULL, [ManagerEntraId] = NULL, [MemberCount] = 0
WHERE [Id] = 18;
SELECT @@ROWCOUNT;

GO

UPDATE [Services] SET [BuildingId] = NULL, [EntraGroupId] = NULL, [EntraLastSyncAt] = NULL, [EntraMailNickname] = NULL, [EntraSyncEnabled] = CAST(0 AS INTEGER), [EntraSyncError] = NULL, [EntraSyncStatus] = 0, [ManagerDisplayName] = NULL, [ManagerEmail] = NULL, [ManagerEntraId] = NULL, [MemberCount] = 0
WHERE [Id] = 19;
SELECT @@ROWCOUNT;

GO

UPDATE [Services] SET [BuildingId] = NULL, [EntraGroupId] = NULL, [EntraLastSyncAt] = NULL, [EntraMailNickname] = NULL, [EntraSyncEnabled] = CAST(0 AS INTEGER), [EntraSyncError] = NULL, [EntraSyncStatus] = 0, [ManagerDisplayName] = NULL, [ManagerEmail] = NULL, [ManagerEntraId] = NULL, [MemberCount] = 0
WHERE [Id] = 20;
SELECT @@ROWCOUNT;

GO

UPDATE [Services] SET [BuildingId] = NULL, [EntraGroupId] = NULL, [EntraLastSyncAt] = NULL, [EntraMailNickname] = NULL, [EntraSyncEnabled] = CAST(0 AS INTEGER), [EntraSyncError] = NULL, [EntraSyncStatus] = 0, [ManagerDisplayName] = NULL, [ManagerEmail] = NULL, [ManagerEntraId] = NULL, [MemberCount] = 0
WHERE [Id] = 21;
SELECT @@ROWCOUNT;

GO

CREATE INDEX [IX_Services_BuildingId] ON [Services] ([BuildingId]);
GO

CREATE INDEX [IX_RolloutWorkplaces_BuildingId] ON [RolloutWorkplaces] ([BuildingId]);
GO

CREATE INDEX [IX_Assets_BuildingId] ON [Assets] ([BuildingId]);
GO

CREATE INDEX [IX_Assets_CurrentWorkplaceAssignmentId] ON [Assets] ([CurrentWorkplaceAssignmentId]);
GO

CREATE INDEX [IX_Assets_LastRolloutSessionId] ON [Assets] ([LastRolloutSessionId]);
GO

CREATE INDEX [IX_RolloutAssetMovements_AssetId] ON [RolloutAssetMovements] ([AssetId]);
GO

CREATE INDEX [IX_RolloutAssetMovements_MovementType] ON [RolloutAssetMovements] ([MovementType]);
GO

CREATE INDEX [IX_RolloutAssetMovements_NewServiceId] ON [RolloutAssetMovements] ([NewServiceId]);
GO

CREATE INDEX [IX_RolloutAssetMovements_PerformedAt] ON [RolloutAssetMovements] ([PerformedAt]);
GO

CREATE INDEX [IX_RolloutAssetMovements_PreviousServiceId] ON [RolloutAssetMovements] ([PreviousServiceId]);
GO

CREATE INDEX [IX_RolloutAssetMovements_RolloutSessionId] ON [RolloutAssetMovements] ([RolloutSessionId]);
GO

CREATE INDEX [IX_RolloutAssetMovements_RolloutWorkplaceId] ON [RolloutAssetMovements] ([RolloutWorkplaceId]);
GO

CREATE INDEX [IX_RolloutAssetMovements_WorkplaceAssetAssignmentId] ON [RolloutAssetMovements] ([WorkplaceAssetAssignmentId]);
GO

CREATE INDEX [IX_RolloutDayServices_RolloutDayId] ON [RolloutDayServices] ([RolloutDayId]);
GO

CREATE UNIQUE INDEX [IX_RolloutDayServices_RolloutDayId_ServiceId] ON [RolloutDayServices] ([RolloutDayId], [ServiceId]);
GO

CREATE INDEX [IX_RolloutDayServices_ServiceId] ON [RolloutDayServices] ([ServiceId]);
GO

CREATE INDEX [IX_WorkplaceAssetAssignments_AssetTemplateId] ON [WorkplaceAssetAssignments] ([AssetTemplateId]);
GO

CREATE INDEX [IX_WorkplaceAssetAssignments_AssetTypeId] ON [WorkplaceAssetAssignments] ([AssetTypeId]);
GO

CREATE INDEX [IX_WorkplaceAssetAssignments_NewAssetId] ON [WorkplaceAssetAssignments] ([NewAssetId]);
GO

CREATE INDEX [IX_WorkplaceAssetAssignments_OldAssetId] ON [WorkplaceAssetAssignments] ([OldAssetId]);
GO

CREATE INDEX [IX_WorkplaceAssetAssignments_RolloutWorkplaceId] ON [WorkplaceAssetAssignments] ([RolloutWorkplaceId]);
GO

CREATE INDEX [IX_WorkplaceAssetAssignments_Status] ON [WorkplaceAssetAssignments] ([Status]);
GO

ALTER TABLE [Assets] ADD CONSTRAINT [FK_Assets_Buildings_BuildingId] FOREIGN KEY ([BuildingId]) REFERENCES [Buildings] ([Id]) ON DELETE SET NULL;
GO

ALTER TABLE [Assets] ADD CONSTRAINT [FK_Assets_RolloutSessions_LastRolloutSessionId] FOREIGN KEY ([LastRolloutSessionId]) REFERENCES [RolloutSessions] ([Id]) ON DELETE SET NULL;
GO

ALTER TABLE [Assets] ADD CONSTRAINT [FK_Assets_WorkplaceAssetAssignments_CurrentWorkplaceAssignmentId] FOREIGN KEY ([CurrentWorkplaceAssignmentId]) REFERENCES [WorkplaceAssetAssignments] ([Id]) ON DELETE SET NULL;
GO

ALTER TABLE [RolloutWorkplaces] ADD CONSTRAINT [FK_RolloutWorkplaces_Buildings_BuildingId] FOREIGN KEY ([BuildingId]) REFERENCES [Buildings] ([Id]) ON DELETE SET NULL;
GO

ALTER TABLE [Services] ADD CONSTRAINT [FK_Services_Buildings_BuildingId] FOREIGN KEY ([BuildingId]) REFERENCES [Buildings] ([Id]) ON DELETE SET NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260316181853_RolloutFeatureRedesign', N'8.0.11');
GO

COMMIT;
GO


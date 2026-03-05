CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" TEXT NOT NULL CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY,
    "ProductVersion" TEXT NOT NULL
);

BEGIN TRANSACTION;

CREATE TABLE "Assets" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Assets" PRIMARY KEY AUTOINCREMENT,
    "AssetCode" TEXT NOT NULL,
    "AssetName" TEXT NOT NULL,
    "Category" TEXT NOT NULL,
    "Owner" TEXT NOT NULL,
    "Building" TEXT NOT NULL,
    "SpaceOrFloor" TEXT NOT NULL,
    "Status" INTEGER NOT NULL,
    "Brand" TEXT NULL,
    "Model" TEXT NULL,
    "SerialNumber" TEXT NULL,
    "PurchaseDate" TEXT NULL,
    "WarrantyExpiry" TEXT NULL,
    "InstallationDate" TEXT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL
);

CREATE TABLE "AssetTemplates" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_AssetTemplates" PRIMARY KEY AUTOINCREMENT,
    "TemplateName" TEXT NOT NULL,
    "AssetName" TEXT NOT NULL,
    "Category" TEXT NOT NULL,
    "Brand" TEXT NOT NULL,
    "Model" TEXT NOT NULL,
    "IsActive" INTEGER NOT NULL
);

INSERT INTO "AssetTemplates" ("Id", "AssetName", "Brand", "Category", "IsActive", "Model", "TemplateName")
VALUES (1, 'Dell Latitude Laptop', 'Dell', 'Computing', 1, 'Latitude 5420', 'Dell Latitude Laptop');
SELECT changes();

INSERT INTO "AssetTemplates" ("Id", "AssetName", "Brand", "Category", "IsActive", "Model", "TemplateName")
VALUES (2, 'HP LaserJet Printer', 'HP', 'Peripherals', 1, 'LaserJet Pro M404dn', 'HP LaserJet Printer');
SELECT changes();

INSERT INTO "AssetTemplates" ("Id", "AssetName", "Brand", "Category", "IsActive", "Model", "TemplateName")
VALUES (3, 'Cisco Network Switch', 'Cisco', 'Networking', 1, 'Catalyst 2960', 'Cisco Network Switch');
SELECT changes();

INSERT INTO "AssetTemplates" ("Id", "AssetName", "Brand", "Category", "IsActive", "Model", "TemplateName")
VALUES (4, 'Samsung Monitor 27"', 'Samsung', 'Displays', 1, '27" LED Monitor', 'Samsung Monitor 27"');
SELECT changes();

INSERT INTO "AssetTemplates" ("Id", "AssetName", "Brand", "Category", "IsActive", "Model", "TemplateName")
VALUES (5, 'Logitech Wireless Mouse', 'Logitech', 'Peripherals', 1, 'MX Master 3', 'Logitech Wireless Mouse');
SELECT changes();


CREATE UNIQUE INDEX "IX_Assets_AssetCode" ON "Assets" ("AssetCode");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260115005601_InitialCreate', '8.0.11');

COMMIT;

BEGIN TRANSACTION;

ALTER TABLE "AssetTemplates" ADD "Building" TEXT NOT NULL DEFAULT '';

ALTER TABLE "AssetTemplates" ADD "Owner" TEXT NOT NULL DEFAULT '';

ALTER TABLE "AssetTemplates" ADD "SpaceOrFloor" TEXT NOT NULL DEFAULT '';

UPDATE "AssetTemplates" SET "Building" = '', "Owner" = '', "SpaceOrFloor" = ''
WHERE "Id" = 1;
SELECT changes();


UPDATE "AssetTemplates" SET "Building" = '', "Owner" = '', "SpaceOrFloor" = ''
WHERE "Id" = 2;
SELECT changes();


UPDATE "AssetTemplates" SET "Building" = '', "Owner" = '', "SpaceOrFloor" = ''
WHERE "Id" = 3;
SELECT changes();


UPDATE "AssetTemplates" SET "Building" = '', "Owner" = '', "SpaceOrFloor" = ''
WHERE "Id" = 4;
SELECT changes();


UPDATE "AssetTemplates" SET "Building" = '', "Owner" = '', "SpaceOrFloor" = ''
WHERE "Id" = 5;
SELECT changes();


INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260204204003_AddOwnerBuildingSpaceToAssetTemplate', '8.0.11');

COMMIT;

BEGIN TRANSACTION;

ALTER TABLE "AssetTemplates" ADD "InstallationDate" TEXT NULL;

ALTER TABLE "AssetTemplates" ADD "PurchaseDate" TEXT NULL;

ALTER TABLE "AssetTemplates" ADD "WarrantyExpiry" TEXT NULL;

UPDATE "AssetTemplates" SET "InstallationDate" = NULL, "PurchaseDate" = NULL, "WarrantyExpiry" = NULL
WHERE "Id" = 1;
SELECT changes();


UPDATE "AssetTemplates" SET "InstallationDate" = NULL, "PurchaseDate" = NULL, "WarrantyExpiry" = NULL
WHERE "Id" = 2;
SELECT changes();


UPDATE "AssetTemplates" SET "InstallationDate" = NULL, "PurchaseDate" = NULL, "WarrantyExpiry" = NULL
WHERE "Id" = 3;
SELECT changes();


UPDATE "AssetTemplates" SET "InstallationDate" = NULL, "PurchaseDate" = NULL, "WarrantyExpiry" = NULL
WHERE "Id" = 4;
SELECT changes();


UPDATE "AssetTemplates" SET "InstallationDate" = NULL, "PurchaseDate" = NULL, "WarrantyExpiry" = NULL
WHERE "Id" = 5;
SELECT changes();


INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260204213922_AddLifecycleDatesToAssetTemplate', '8.0.11');

COMMIT;

BEGIN TRANSACTION;

ALTER TABLE "Assets" RENAME COLUMN "SpaceOrFloor" TO "Department";

ALTER TABLE "Assets" ADD "OfficeLocation" TEXT NULL;

ALTER TABLE "AssetTemplates" RENAME COLUMN "SpaceOrFloor" TO "Department";

ALTER TABLE "AssetTemplates" ADD "OfficeLocation" TEXT NULL;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260206180625_RenameSpaceOrFloorToDepartmentAndAddOfficeLocation', '8.0.11');

COMMIT;

BEGIN TRANSACTION;

ALTER TABLE "Assets" ADD "JobTitle" TEXT NULL;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260207082708_AddJobTitleToAsset', '8.0.11');

COMMIT;

BEGIN TRANSACTION;

ALTER TABLE "Assets" ADD "IsDummy" INTEGER NOT NULL DEFAULT 0;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260207104746_AddIsDummyToAsset', '8.0.11');

COMMIT;

BEGIN TRANSACTION;

ALTER TABLE "Assets" ADD "Alias" TEXT NULL;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260207172900_AddAliasToAsset', '8.0.11');

COMMIT;

BEGIN TRANSACTION;


                UPDATE Assets
                SET SerialNumber = 'TEMP-' || AssetCode
                WHERE SerialNumber IS NULL OR SerialNumber = ''
            


                UPDATE Assets
                SET SerialNumber = SerialNumber || '-' || Id
                WHERE Id IN (
                    SELECT a2.Id FROM Assets a1
                    JOIN Assets a2 ON a1.SerialNumber = a2.SerialNumber AND a1.Id < a2.Id
                )
            

CREATE UNIQUE INDEX "IX_Assets_SerialNumber" ON "Assets" ("SerialNumber");

CREATE TABLE "ef_temp_Assets" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Assets" PRIMARY KEY AUTOINCREMENT,
    "Alias" TEXT NULL,
    "AssetCode" TEXT NOT NULL,
    "AssetName" TEXT NOT NULL,
    "Brand" TEXT NULL,
    "Building" TEXT NULL,
    "Category" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "Department" TEXT NULL,
    "InstallationDate" TEXT NULL,
    "IsDummy" INTEGER NOT NULL,
    "JobTitle" TEXT NULL,
    "Model" TEXT NULL,
    "OfficeLocation" TEXT NULL,
    "Owner" TEXT NULL,
    "PurchaseDate" TEXT NULL,
    "SerialNumber" TEXT NOT NULL,
    "Status" INTEGER NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    "WarrantyExpiry" TEXT NULL
);

INSERT INTO "ef_temp_Assets" ("Id", "Alias", "AssetCode", "AssetName", "Brand", "Building", "Category", "CreatedAt", "Department", "InstallationDate", "IsDummy", "JobTitle", "Model", "OfficeLocation", "Owner", "PurchaseDate", "SerialNumber", "Status", "UpdatedAt", "WarrantyExpiry")
SELECT "Id", "Alias", "AssetCode", "AssetName", "Brand", "Building", "Category", "CreatedAt", "Department", "InstallationDate", "IsDummy", "JobTitle", "Model", "OfficeLocation", "Owner", "PurchaseDate", IFNULL("SerialNumber", ''), "Status", "UpdatedAt", "WarrantyExpiry"
FROM "Assets";

COMMIT;

PRAGMA foreign_keys = 0;

BEGIN TRANSACTION;

DROP TABLE "Assets";

ALTER TABLE "ef_temp_Assets" RENAME TO "Assets";

COMMIT;

PRAGMA foreign_keys = 1;

BEGIN TRANSACTION;

CREATE UNIQUE INDEX "IX_Assets_AssetCode" ON "Assets" ("AssetCode");

CREATE UNIQUE INDEX "IX_Assets_SerialNumber" ON "Assets" ("SerialNumber");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260208120048_MakeSerialNumberRequiredUnique', '8.0.11');

COMMIT;

BEGIN TRANSACTION;

CREATE TABLE "ef_temp_AssetTemplates" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_AssetTemplates" PRIMARY KEY AUTOINCREMENT,
    "AssetName" TEXT NULL,
    "Brand" TEXT NULL,
    "Building" TEXT NULL,
    "Category" TEXT NOT NULL,
    "Department" TEXT NULL,
    "InstallationDate" TEXT NULL,
    "IsActive" INTEGER NOT NULL,
    "Model" TEXT NULL,
    "OfficeLocation" TEXT NULL,
    "Owner" TEXT NULL,
    "PurchaseDate" TEXT NULL,
    "TemplateName" TEXT NOT NULL,
    "WarrantyExpiry" TEXT NULL
);

INSERT INTO "ef_temp_AssetTemplates" ("Id", "AssetName", "Brand", "Building", "Category", "Department", "InstallationDate", "IsActive", "Model", "OfficeLocation", "Owner", "PurchaseDate", "TemplateName", "WarrantyExpiry")
SELECT "Id", "AssetName", "Brand", "Building", "Category", "Department", "InstallationDate", "IsActive", "Model", "OfficeLocation", "Owner", "PurchaseDate", "TemplateName", "WarrantyExpiry"
FROM "AssetTemplates";

COMMIT;

PRAGMA foreign_keys = 0;

BEGIN TRANSACTION;

DROP TABLE "AssetTemplates";

ALTER TABLE "ef_temp_AssetTemplates" RENAME TO "AssetTemplates";

COMMIT;

PRAGMA foreign_keys = 1;

BEGIN TRANSACTION;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260208135402_MakeAssetTemplateFieldsOptional', '8.0.11');

COMMIT;

BEGIN TRANSACTION;

ALTER TABLE "AssetTemplates" RENAME COLUMN "Department" TO "LegacyDepartment";

ALTER TABLE "AssetTemplates" RENAME COLUMN "Building" TO "LegacyBuilding";

ALTER TABLE "Assets" RENAME COLUMN "Department" TO "LegacyDepartment";

ALTER TABLE "Assets" RENAME COLUMN "Building" TO "LegacyBuilding";

ALTER TABLE "AssetTemplates" ADD "AssetTypeId" INTEGER NULL;

ALTER TABLE "Assets" ADD "AssetTypeId" INTEGER NULL;

ALTER TABLE "Assets" ADD "BuildingId" INTEGER NULL;

ALTER TABLE "Assets" ADD "InstallationLocation" TEXT NULL;

ALTER TABLE "Assets" ADD "ServiceId" INTEGER NULL;

CREATE TABLE "AssetEvents" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_AssetEvents" PRIMARY KEY AUTOINCREMENT,
    "AssetId" INTEGER NOT NULL,
    "EventType" INTEGER NOT NULL,
    "Description" TEXT NOT NULL,
    "Notes" TEXT NULL,
    "OldValue" TEXT NULL,
    "NewValue" TEXT NULL,
    "PerformedBy" TEXT NULL,
    "PerformedByEmail" TEXT NULL,
    "EventDate" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    CONSTRAINT "FK_AssetEvents_Assets_AssetId" FOREIGN KEY ("AssetId") REFERENCES "Assets" ("Id") ON DELETE CASCADE
);

CREATE TABLE "AssetTypes" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_AssetTypes" PRIMARY KEY AUTOINCREMENT,
    "Code" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Description" TEXT NULL,
    "IsActive" INTEGER NOT NULL,
    "SortOrder" INTEGER NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NULL
);

CREATE TABLE "Buildings" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Buildings" PRIMARY KEY AUTOINCREMENT,
    "Code" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Address" TEXT NULL,
    "IsActive" INTEGER NOT NULL,
    "SortOrder" INTEGER NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NULL
);

CREATE TABLE "LeaseContracts" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_LeaseContracts" PRIMARY KEY AUTOINCREMENT,
    "AssetId" INTEGER NOT NULL,
    "ContractNumber" TEXT NULL,
    "Vendor" TEXT NULL,
    "StartDate" TEXT NOT NULL,
    "EndDate" TEXT NOT NULL,
    "MonthlyRate" TEXT NULL,
    "TotalValue" TEXT NULL,
    "Status" INTEGER NOT NULL,
    "Notes" TEXT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NULL,
    CONSTRAINT "FK_LeaseContracts_Assets_AssetId" FOREIGN KEY ("AssetId") REFERENCES "Assets" ("Id") ON DELETE CASCADE
);

CREATE TABLE "Sectors" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Sectors" PRIMARY KEY AUTOINCREMENT,
    "Code" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "IsActive" INTEGER NOT NULL,
    "SortOrder" INTEGER NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NULL
);

CREATE TABLE "Services" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Services" PRIMARY KEY AUTOINCREMENT,
    "SectorId" INTEGER NULL,
    "Code" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "IsActive" INTEGER NOT NULL,
    "SortOrder" INTEGER NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NULL,
    CONSTRAINT "FK_Services_Sectors_SectorId" FOREIGN KEY ("SectorId") REFERENCES "Sectors" ("Id") ON DELETE SET NULL
);

UPDATE "AssetTemplates" SET "AssetTypeId" = NULL
WHERE "Id" = 1;
SELECT changes();


UPDATE "AssetTemplates" SET "AssetTypeId" = NULL
WHERE "Id" = 2;
SELECT changes();


UPDATE "AssetTemplates" SET "AssetTypeId" = NULL
WHERE "Id" = 3;
SELECT changes();


UPDATE "AssetTemplates" SET "AssetTypeId" = NULL
WHERE "Id" = 4;
SELECT changes();


UPDATE "AssetTemplates" SET "AssetTypeId" = NULL
WHERE "Id" = 5;
SELECT changes();


INSERT INTO "AssetTypes" ("Id", "Code", "CreatedAt", "Description", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (1, 'LAP', '2025-01-01 00:00:00', NULL, 1, 'Laptop', 1, NULL);
SELECT changes();

INSERT INTO "AssetTypes" ("Id", "Code", "CreatedAt", "Description", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (2, 'DESK', '2025-01-01 00:00:00', NULL, 1, 'Desktop', 2, NULL);
SELECT changes();

INSERT INTO "AssetTypes" ("Id", "Code", "CreatedAt", "Description", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (3, 'MON', '2025-01-01 00:00:00', NULL, 1, 'Monitor', 3, NULL);
SELECT changes();

INSERT INTO "AssetTypes" ("Id", "Code", "CreatedAt", "Description", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (4, 'TAB', '2025-01-01 00:00:00', NULL, 1, 'Tablet', 4, NULL);
SELECT changes();

INSERT INTO "AssetTypes" ("Id", "Code", "CreatedAt", "Description", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (5, 'PRN', '2025-01-01 00:00:00', NULL, 1, 'Printer', 5, NULL);
SELECT changes();

INSERT INTO "AssetTypes" ("Id", "Code", "CreatedAt", "Description", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (6, 'TEL', '2025-01-01 00:00:00', NULL, 1, 'Telefoon', 6, NULL);
SELECT changes();

INSERT INTO "AssetTypes" ("Id", "Code", "CreatedAt", "Description", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (7, 'NET', '2025-01-01 00:00:00', NULL, 1, 'Netwerk', 7, NULL);
SELECT changes();


INSERT INTO "Buildings" ("Id", "Address", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (1, NULL, 'DBK', '2025-01-01 00:00:00', 1, 'Gemeentehuis Diepenbeek', 1, NULL);
SELECT changes();

INSERT INTO "Buildings" ("Id", "Address", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (2, NULL, 'WZC', '2025-01-01 00:00:00', 1, 'WZC De Visserij', 2, NULL);
SELECT changes();

INSERT INTO "Buildings" ("Id", "Address", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (3, NULL, 'GBS', '2025-01-01 00:00:00', 1, 'Gemeentelijke Basisschool', 3, NULL);
SELECT changes();

INSERT INTO "Buildings" ("Id", "Address", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (4, NULL, 'PLAG', '2025-01-01 00:00:00', 1, 'Plaatselijk Comité', 4, NULL);
SELECT changes();

INSERT INTO "Buildings" ("Id", "Address", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (5, NULL, 'BIB', '2025-01-01 00:00:00', 1, 'Bibliotheek', 5, NULL);
SELECT changes();


INSERT INTO "Sectors" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (1, 'ORG', '2025-01-01 00:00:00', 1, 'Organisatie', 1, NULL);
SELECT changes();

INSERT INTO "Sectors" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (2, 'RUI', '2025-01-01 00:00:00', 1, 'Ruimte', 2, NULL);
SELECT changes();

INSERT INTO "Sectors" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (3, 'ZOR', '2025-01-01 00:00:00', 1, 'Zorg', 3, NULL);
SELECT changes();


CREATE INDEX "IX_AssetTemplates_AssetTypeId" ON "AssetTemplates" ("AssetTypeId");

CREATE INDEX "IX_Assets_AssetTypeId" ON "Assets" ("AssetTypeId");

CREATE INDEX "IX_Assets_BuildingId" ON "Assets" ("BuildingId");

CREATE INDEX "IX_Assets_ServiceId" ON "Assets" ("ServiceId");

CREATE INDEX "IX_AssetEvents_AssetId" ON "AssetEvents" ("AssetId");

CREATE INDEX "IX_AssetEvents_EventDate" ON "AssetEvents" ("EventDate");

CREATE UNIQUE INDEX "IX_AssetTypes_Code" ON "AssetTypes" ("Code");

CREATE UNIQUE INDEX "IX_Buildings_Code" ON "Buildings" ("Code");

CREATE INDEX "IX_LeaseContracts_AssetId" ON "LeaseContracts" ("AssetId");

CREATE INDEX "IX_LeaseContracts_EndDate" ON "LeaseContracts" ("EndDate");

CREATE UNIQUE INDEX "IX_Sectors_Code" ON "Sectors" ("Code");

CREATE UNIQUE INDEX "IX_Services_Code" ON "Services" ("Code");

CREATE INDEX "IX_Services_SectorId" ON "Services" ("SectorId");

CREATE TABLE "ef_temp_Assets" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Assets" PRIMARY KEY AUTOINCREMENT,
    "Alias" TEXT NULL,
    "AssetCode" TEXT NOT NULL,
    "AssetName" TEXT NOT NULL,
    "AssetTypeId" INTEGER NULL,
    "Brand" TEXT NULL,
    "BuildingId" INTEGER NULL,
    "Category" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "InstallationDate" TEXT NULL,
    "InstallationLocation" TEXT NULL,
    "IsDummy" INTEGER NOT NULL,
    "JobTitle" TEXT NULL,
    "LegacyBuilding" TEXT NULL,
    "LegacyDepartment" TEXT NULL,
    "Model" TEXT NULL,
    "OfficeLocation" TEXT NULL,
    "Owner" TEXT NULL,
    "PurchaseDate" TEXT NULL,
    "SerialNumber" TEXT NOT NULL,
    "ServiceId" INTEGER NULL,
    "Status" INTEGER NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    "WarrantyExpiry" TEXT NULL,
    CONSTRAINT "FK_Assets_AssetTypes_AssetTypeId" FOREIGN KEY ("AssetTypeId") REFERENCES "AssetTypes" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Assets_Buildings_BuildingId" FOREIGN KEY ("BuildingId") REFERENCES "Buildings" ("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_Assets_Services_ServiceId" FOREIGN KEY ("ServiceId") REFERENCES "Services" ("Id") ON DELETE SET NULL
);

INSERT INTO "ef_temp_Assets" ("Id", "Alias", "AssetCode", "AssetName", "AssetTypeId", "Brand", "BuildingId", "Category", "CreatedAt", "InstallationDate", "InstallationLocation", "IsDummy", "JobTitle", "LegacyBuilding", "LegacyDepartment", "Model", "OfficeLocation", "Owner", "PurchaseDate", "SerialNumber", "ServiceId", "Status", "UpdatedAt", "WarrantyExpiry")
SELECT "Id", "Alias", "AssetCode", "AssetName", "AssetTypeId", "Brand", "BuildingId", "Category", "CreatedAt", "InstallationDate", "InstallationLocation", "IsDummy", "JobTitle", "LegacyBuilding", "LegacyDepartment", "Model", "OfficeLocation", "Owner", "PurchaseDate", "SerialNumber", "ServiceId", "Status", "UpdatedAt", "WarrantyExpiry"
FROM "Assets";

CREATE TABLE "ef_temp_AssetTemplates" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_AssetTemplates" PRIMARY KEY AUTOINCREMENT,
    "AssetName" TEXT NULL,
    "AssetTypeId" INTEGER NULL,
    "Brand" TEXT NULL,
    "Category" TEXT NOT NULL,
    "InstallationDate" TEXT NULL,
    "IsActive" INTEGER NOT NULL,
    "LegacyBuilding" TEXT NULL,
    "LegacyDepartment" TEXT NULL,
    "Model" TEXT NULL,
    "OfficeLocation" TEXT NULL,
    "Owner" TEXT NULL,
    "PurchaseDate" TEXT NULL,
    "TemplateName" TEXT NOT NULL,
    "WarrantyExpiry" TEXT NULL,
    CONSTRAINT "FK_AssetTemplates_AssetTypes_AssetTypeId" FOREIGN KEY ("AssetTypeId") REFERENCES "AssetTypes" ("Id")
);

INSERT INTO "ef_temp_AssetTemplates" ("Id", "AssetName", "AssetTypeId", "Brand", "Category", "InstallationDate", "IsActive", "LegacyBuilding", "LegacyDepartment", "Model", "OfficeLocation", "Owner", "PurchaseDate", "TemplateName", "WarrantyExpiry")
SELECT "Id", "AssetName", "AssetTypeId", "Brand", "Category", "InstallationDate", "IsActive", "LegacyBuilding", "LegacyDepartment", "Model", "OfficeLocation", "Owner", "PurchaseDate", "TemplateName", "WarrantyExpiry"
FROM "AssetTemplates";

COMMIT;

PRAGMA foreign_keys = 0;

BEGIN TRANSACTION;

DROP TABLE "Assets";

ALTER TABLE "ef_temp_Assets" RENAME TO "Assets";

DROP TABLE "AssetTemplates";

ALTER TABLE "ef_temp_AssetTemplates" RENAME TO "AssetTemplates";

COMMIT;

PRAGMA foreign_keys = 1;

BEGIN TRANSACTION;

CREATE UNIQUE INDEX "IX_Assets_AssetCode" ON "Assets" ("AssetCode");

CREATE INDEX "IX_Assets_AssetTypeId" ON "Assets" ("AssetTypeId");

CREATE INDEX "IX_Assets_BuildingId" ON "Assets" ("BuildingId");

CREATE UNIQUE INDEX "IX_Assets_SerialNumber" ON "Assets" ("SerialNumber");

CREATE INDEX "IX_Assets_ServiceId" ON "Assets" ("ServiceId");

CREATE INDEX "IX_AssetTemplates_AssetTypeId" ON "AssetTemplates" ("AssetTypeId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260214141143_AddDataModelFoundation', '8.0.11');

COMMIT;

BEGIN TRANSACTION;

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (1, 'IT', '2025-01-01 00:00:00', 1, 'Informatica', 1, 1, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (2, 'FIN', '2025-01-01 00:00:00', 1, 'Financiën', 1, 2, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (3, 'HR', '2025-01-01 00:00:00', 1, 'Human Resources', 1, 3, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (4, 'COM', '2025-01-01 00:00:00', 1, 'Communicatie', 1, 4, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (5, 'SEC', '2025-01-01 00:00:00', 1, 'Secretariaat', 1, 5, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (6, 'TD', '2025-01-01 00:00:00', 1, 'Technische Dienst', 2, 6, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (7, 'RO', '2025-01-01 00:00:00', 1, 'Ruimtelijke Ordening', 2, 7, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (8, 'OCMW', '2025-01-01 00:00:00', 1, 'OCMW', 3, 8, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (9, 'WZC', '2025-01-01 00:00:00', 1, 'Woonzorgcentrum', 3, 9, NULL);
SELECT changes();


INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260215111618_SeedServices', '8.0.11');

COMMIT;

BEGIN TRANSACTION;

DELETE FROM Services WHERE Id IN (1,2,3,4,5,6,7,8,9)

DELETE FROM Sectors WHERE Id IN (2,3)

INSERT INTO "Sectors" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (2, 'FIN', '2025-01-01 00:00:00', 1, 'Financiën', 2, NULL);
SELECT changes();


INSERT INTO "Sectors" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (3, 'RUI', '2025-01-01 00:00:00', 1, 'Ruimte', 3, NULL);
SELECT changes();


INSERT INTO "Sectors" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (4, 'MENS', '2025-01-01 00:00:00', 1, 'Mens', 4, NULL);
SELECT changes();

INSERT INTO "Sectors" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (5, 'ZORG', '2025-01-01 00:00:00', 1, 'Zorg', 5, NULL);
SELECT changes();


INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (1, 'BSEC', '2025-01-01 00:00:00', 1, 'Bestuurssecretariaat', 1, 1, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (2, 'COM', '2025-01-01 00:00:00', 1, 'Dienst Communicatie', 1, 2, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (3, 'IT', '2025-01-01 00:00:00', 1, 'Dienst IT', 1, 3, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (4, 'ORGB', '2025-01-01 00:00:00', 1, 'Dienst Organisatiebeheersing', 1, 4, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (5, 'HR', '2025-01-01 00:00:00', 1, 'Dienst HR', 1, 5, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (6, 'PREV', '2025-01-01 00:00:00', 1, 'Dienst Preventie - GIS & Noodplanning', 1, 6, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (7, 'AANK', '2025-01-01 00:00:00', 1, 'Dienst Aankopen', 2, 7, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (8, 'FINZ', '2025-01-01 00:00:00', 1, 'Dienst Financiën', 2, 8, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (9, 'RO', '2025-01-01 00:00:00', 1, 'Ruimtelijke Ontwikkeling', 3, 9, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (10, 'INFRA', '2025-01-01 00:00:00', 1, 'Infrastructuurprojecten', 3, 10, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (11, 'FAC', '2025-01-01 00:00:00', 1, 'Facilitaire Ondersteuning', 3, 11, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (12, 'OD', '2025-01-01 00:00:00', 1, 'Openbaar Domein', 3, 12, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (13, 'BB', '2025-01-01 00:00:00', 1, 'Beleven & Bewegen', 4, 13, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (14, 'BURG', '2025-01-01 00:00:00', 1, 'Burgerzaken', 4, 14, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (15, 'GO', '2025-01-01 00:00:00', 1, 'Gezin & Onderwijs', 4, 15, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (16, 'GBS', '2025-01-01 00:00:00', 1, 'Gemeentelijke Basisschool', 4, 16, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (17, 'SOC', '2025-01-01 00:00:00', 1, 'Sociale Dienst', 4, 17, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (18, 'THUIS', '2025-01-01 00:00:00', 1, 'Thuiszorg', 5, 18, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (19, 'ASWO', '2025-01-01 00:00:00', 1, 'Assistentiewoningen', 5, 19, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (20, 'CDV', '2025-01-01 00:00:00', 1, 'Centrum Dagverzorging', 5, 20, NULL);
SELECT changes();

INSERT INTO "Services" ("Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt")
VALUES (21, 'WZC', '2025-01-01 00:00:00', 1, 'Woonzorgcentrum', 5, 21, NULL);
SELECT changes();


INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260215143306_ResetSectorsAndServices', '8.0.11');

COMMIT;

BEGIN TRANSACTION;

DROP INDEX "IX_Assets_BuildingId";

CREATE TABLE "ef_temp_Assets" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Assets" PRIMARY KEY AUTOINCREMENT,
    "Alias" TEXT NULL,
    "AssetCode" TEXT NOT NULL,
    "AssetName" TEXT NOT NULL,
    "AssetTypeId" INTEGER NULL,
    "Brand" TEXT NULL,
    "Category" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "InstallationDate" TEXT NULL,
    "InstallationLocation" TEXT NULL,
    "IsDummy" INTEGER NOT NULL,
    "JobTitle" TEXT NULL,
    "LegacyBuilding" TEXT NULL,
    "LegacyDepartment" TEXT NULL,
    "Model" TEXT NULL,
    "OfficeLocation" TEXT NULL,
    "Owner" TEXT NULL,
    "PurchaseDate" TEXT NULL,
    "SerialNumber" TEXT NOT NULL,
    "ServiceId" INTEGER NULL,
    "Status" INTEGER NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    "WarrantyExpiry" TEXT NULL,
    CONSTRAINT "FK_Assets_AssetTypes_AssetTypeId" FOREIGN KEY ("AssetTypeId") REFERENCES "AssetTypes" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Assets_Services_ServiceId" FOREIGN KEY ("ServiceId") REFERENCES "Services" ("Id") ON DELETE SET NULL
);

INSERT INTO "ef_temp_Assets" ("Id", "Alias", "AssetCode", "AssetName", "AssetTypeId", "Brand", "Category", "CreatedAt", "InstallationDate", "InstallationLocation", "IsDummy", "JobTitle", "LegacyBuilding", "LegacyDepartment", "Model", "OfficeLocation", "Owner", "PurchaseDate", "SerialNumber", "ServiceId", "Status", "UpdatedAt", "WarrantyExpiry")
SELECT "Id", "Alias", "AssetCode", "AssetName", "AssetTypeId", "Brand", "Category", "CreatedAt", "InstallationDate", "InstallationLocation", "IsDummy", "JobTitle", "LegacyBuilding", "LegacyDepartment", "Model", "OfficeLocation", "Owner", "PurchaseDate", "SerialNumber", "ServiceId", "Status", "UpdatedAt", "WarrantyExpiry"
FROM "Assets";

COMMIT;

PRAGMA foreign_keys = 0;

BEGIN TRANSACTION;

DROP TABLE "Assets";

ALTER TABLE "ef_temp_Assets" RENAME TO "Assets";

COMMIT;

PRAGMA foreign_keys = 1;

BEGIN TRANSACTION;

CREATE UNIQUE INDEX "IX_Assets_AssetCode" ON "Assets" ("AssetCode");

CREATE INDEX "IX_Assets_AssetTypeId" ON "Assets" ("AssetTypeId");

CREATE UNIQUE INDEX "IX_Assets_SerialNumber" ON "Assets" ("SerialNumber");

CREATE INDEX "IX_Assets_ServiceId" ON "Assets" ("ServiceId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260215152419_RemoveBuildingFromAsset', '8.0.11');

COMMIT;

BEGIN TRANSACTION;

ALTER TABLE "AssetTypes" ADD "CategoryId" INTEGER NULL;

CREATE TABLE "Categories" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Categories" PRIMARY KEY AUTOINCREMENT,
    "Code" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Description" TEXT NULL,
    "IsActive" INTEGER NOT NULL,
    "SortOrder" INTEGER NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NULL
);

UPDATE "AssetTypes" SET "CategoryId" = 1
WHERE "Id" = 1;
SELECT changes();


UPDATE "AssetTypes" SET "CategoryId" = 1
WHERE "Id" = 2;
SELECT changes();


UPDATE "AssetTypes" SET "CategoryId" = 2
WHERE "Id" = 3;
SELECT changes();


UPDATE "AssetTypes" SET "CategoryId" = 5, "SortOrder" = 9
WHERE "Id" = 4;
SELECT changes();


UPDATE "AssetTypes" SET "CategoryId" = 3, "SortOrder" = 7
WHERE "Id" = 5;
SELECT changes();


UPDATE "AssetTypes" SET "CategoryId" = 5, "SortOrder" = 10
WHERE "Id" = 6;
SELECT changes();


UPDATE "AssetTypes" SET "CategoryId" = 4, "SortOrder" = 8
WHERE "Id" = 7;
SELECT changes();


INSERT INTO "Categories" ("Id", "Code", "CreatedAt", "Description", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (1, 'COMP', '2025-01-01 00:00:00', 'Computers en rekenkracht', 1, 'Computing', 1, NULL);
SELECT changes();

INSERT INTO "Categories" ("Id", "Code", "CreatedAt", "Description", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (2, 'WORK', '2025-01-01 00:00:00', 'Werkplekaccessoires en randapparatuur', 1, 'Werkplek', 2, NULL);
SELECT changes();

INSERT INTO "Categories" ("Id", "Code", "CreatedAt", "Description", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (3, 'PERIPH', '2025-01-01 00:00:00', 'Printers, scanners en andere randapparatuur', 1, 'Peripherals', 3, NULL);
SELECT changes();

INSERT INTO "Categories" ("Id", "Code", "CreatedAt", "Description", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (4, 'NET', '2025-01-01 00:00:00', 'Netwerkapparatuur', 1, 'Networking', 4, NULL);
SELECT changes();

INSERT INTO "Categories" ("Id", "Code", "CreatedAt", "Description", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (5, 'MOBILE', '2025-01-01 00:00:00', 'Mobiele apparaten', 1, 'Mobile', 5, NULL);
SELECT changes();

INSERT INTO "Categories" ("Id", "Code", "CreatedAt", "Description", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (6, 'AV', '2025-01-01 00:00:00', 'Audio- en videoapparatuur', 1, 'Audio/Video', 6, NULL);
SELECT changes();


INSERT INTO "AssetTypes" ("Id", "CategoryId", "Code", "CreatedAt", "Description", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (8, 2, 'DOCK', '2025-01-01 00:00:00', NULL, 1, 'Docking Station', 4, NULL);
SELECT changes();

INSERT INTO "AssetTypes" ("Id", "CategoryId", "Code", "CreatedAt", "Description", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (9, 2, 'KEYB', '2025-01-01 00:00:00', NULL, 1, 'Keyboard', 5, NULL);
SELECT changes();

INSERT INTO "AssetTypes" ("Id", "CategoryId", "Code", "CreatedAt", "Description", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (10, 2, 'MOUSE', '2025-01-01 00:00:00', NULL, 1, 'Mouse', 6, NULL);
SELECT changes();


CREATE INDEX "IX_AssetTypes_CategoryId" ON "AssetTypes" ("CategoryId");

CREATE UNIQUE INDEX "IX_Categories_Code" ON "Categories" ("Code");

CREATE TABLE "ef_temp_AssetTypes" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_AssetTypes" PRIMARY KEY AUTOINCREMENT,
    "CategoryId" INTEGER NULL,
    "Code" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "Description" TEXT NULL,
    "IsActive" INTEGER NOT NULL,
    "Name" TEXT NOT NULL,
    "SortOrder" INTEGER NOT NULL,
    "UpdatedAt" TEXT NULL,
    CONSTRAINT "FK_AssetTypes_Categories_CategoryId" FOREIGN KEY ("CategoryId") REFERENCES "Categories" ("Id") ON DELETE SET NULL
);

INSERT INTO "ef_temp_AssetTypes" ("Id", "CategoryId", "Code", "CreatedAt", "Description", "IsActive", "Name", "SortOrder", "UpdatedAt")
SELECT "Id", "CategoryId", "Code", "CreatedAt", "Description", "IsActive", "Name", "SortOrder", "UpdatedAt"
FROM "AssetTypes";

COMMIT;

PRAGMA foreign_keys = 0;

BEGIN TRANSACTION;

DROP TABLE "AssetTypes";

ALTER TABLE "ef_temp_AssetTypes" RENAME TO "AssetTypes";

COMMIT;

PRAGMA foreign_keys = 1;

BEGIN TRANSACTION;

CREATE INDEX "IX_AssetTypes_CategoryId" ON "AssetTypes" ("CategoryId");

CREATE UNIQUE INDEX "IX_AssetTypes_Code" ON "AssetTypes" ("Code");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260215154044_AddCategoryForAssetTypes', '8.0.11');

COMMIT;

BEGIN TRANSACTION;

UPDATE "Buildings" SET "Address" = 'Dienst IT, Aankoopdienst, Grondgebiedzaken', "Code" = 'POORT', "Name" = 'Het Poortgebouw'
WHERE "Id" = 1;
SELECT changes();


UPDATE "Buildings" SET "Address" = 'Algemeen directeur, Financiën, Burgerzaken', "Code" = 'GHUIS', "Name" = 'Het Gemeentehuis'
WHERE "Id" = 2;
SELECT changes();


UPDATE "Buildings" SET "Address" = 'Sector Mens', "Code" = 'PLAK', "Name" = 'De Plak'
WHERE "Id" = 3;
SELECT changes();


UPDATE "Buildings" SET "Code" = 'WZC', "Name" = 'Het Woonzorgcentrum'
WHERE "Id" = 4;
SELECT changes();


UPDATE "Buildings" SET "Code" = 'BKOC', "Name" = 'Buitenschoolse kinderopvang centrum', "SortOrder" = 10
WHERE "Id" = 5;
SELECT changes();


INSERT INTO "Buildings" ("Id", "Address", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (6, NULL, 'BKOR', '2025-01-01 00:00:00', 1, 'Buitenschoolse kinderopvang Rooierheide', 11, NULL);
SELECT changes();

INSERT INTO "Buildings" ("Id", "Address", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (7, NULL, 'BKOL', '2025-01-01 00:00:00', 1, 'Buitenschoolse kinderopvang Lutselus', 12, NULL);
SELECT changes();

INSERT INTO "Buildings" ("Id", "Address", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (8, NULL, 'BKOG', '2025-01-01 00:00:00', 1, 'Buitenschoolse kinderopvang gemeenteschool', 13, NULL);
SELECT changes();

INSERT INTO "Buildings" ("Id", "Address", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (9, NULL, 'OCL', '2025-01-01 00:00:00', 1, 'Ontmoetingscentrum Lutselus', 14, NULL);
SELECT changes();

INSERT INTO "Buildings" ("Id", "Address", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (10, NULL, 'OCR', '2025-01-01 00:00:00', 1, 'Ontmoetingscentrum Rooierheide', 15, NULL);
SELECT changes();

INSERT INTO "Buildings" ("Id", "Address", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (11, NULL, 'GILDE', '2025-01-01 00:00:00', 1, 'Gildezaal', 16, NULL);
SELECT changes();

INSERT INTO "Buildings" ("Id", "Address", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (12, NULL, 'KEI', '2025-01-01 00:00:00', 1, 'Zaal de Kei', 17, NULL);
SELECT changes();

INSERT INTO "Buildings" ("Id", "Address", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (13, NULL, 'TERL', '2025-01-01 00:00:00', 1, 'Zaal Terloght', 18, NULL);
SELECT changes();

INSERT INTO "Buildings" ("Id", "Address", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (14, NULL, 'HEIZ', '2025-01-01 00:00:00', 1, 'Jeugdhuis Heizoe', 19, NULL);
SELECT changes();

INSERT INTO "Buildings" ("Id", "Address", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (15, NULL, 'SENH', '2025-01-01 00:00:00', 1, 'Seniorenhuis', 20, NULL);
SELECT changes();

INSERT INTO "Buildings" ("Id", "Address", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt")
VALUES (16, NULL, 'ROZEN', '2025-01-01 00:00:00', 1, 'School Rozendaal', 21, NULL);
SELECT changes();


INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260215160723_SeedLocations', '8.0.11');

COMMIT;

BEGIN TRANSACTION;

ALTER TABLE "AssetTemplates" ADD "InstallationLocation" TEXT NULL;

ALTER TABLE "AssetTemplates" ADD "ServiceId" INTEGER NULL;

ALTER TABLE "AssetTemplates" ADD "Status" TEXT NULL;

UPDATE "AssetTemplates" SET "AssetTypeId" = 1, "InstallationLocation" = NULL, "ServiceId" = NULL, "Status" = NULL
WHERE "Id" = 1;
SELECT changes();


UPDATE "AssetTemplates" SET "AssetTypeId" = 5, "InstallationLocation" = NULL, "ServiceId" = NULL, "Status" = NULL
WHERE "Id" = 2;
SELECT changes();


UPDATE "AssetTemplates" SET "AssetTypeId" = 7, "InstallationLocation" = NULL, "ServiceId" = NULL, "Status" = NULL
WHERE "Id" = 3;
SELECT changes();


UPDATE "AssetTemplates" SET "AssetTypeId" = 3, "InstallationLocation" = NULL, "ServiceId" = NULL, "Status" = NULL
WHERE "Id" = 4;
SELECT changes();


UPDATE "AssetTemplates" SET "AssetTypeId" = 10, "InstallationLocation" = NULL, "ServiceId" = NULL, "Status" = NULL
WHERE "Id" = 5;
SELECT changes();


CREATE INDEX "IX_AssetTemplates_ServiceId" ON "AssetTemplates" ("ServiceId");

CREATE TABLE "ef_temp_AssetTemplates" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_AssetTemplates" PRIMARY KEY AUTOINCREMENT,
    "AssetName" TEXT NULL,
    "AssetTypeId" INTEGER NULL,
    "Brand" TEXT NULL,
    "Category" TEXT NULL,
    "InstallationDate" TEXT NULL,
    "InstallationLocation" TEXT NULL,
    "IsActive" INTEGER NOT NULL,
    "LegacyBuilding" TEXT NULL,
    "LegacyDepartment" TEXT NULL,
    "Model" TEXT NULL,
    "OfficeLocation" TEXT NULL,
    "Owner" TEXT NULL,
    "PurchaseDate" TEXT NULL,
    "ServiceId" INTEGER NULL,
    "Status" TEXT NULL,
    "TemplateName" TEXT NOT NULL,
    "WarrantyExpiry" TEXT NULL,
    CONSTRAINT "FK_AssetTemplates_AssetTypes_AssetTypeId" FOREIGN KEY ("AssetTypeId") REFERENCES "AssetTypes" ("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_AssetTemplates_Services_ServiceId" FOREIGN KEY ("ServiceId") REFERENCES "Services" ("Id") ON DELETE SET NULL
);

INSERT INTO "ef_temp_AssetTemplates" ("Id", "AssetName", "AssetTypeId", "Brand", "Category", "InstallationDate", "InstallationLocation", "IsActive", "LegacyBuilding", "LegacyDepartment", "Model", "OfficeLocation", "Owner", "PurchaseDate", "ServiceId", "Status", "TemplateName", "WarrantyExpiry")
SELECT "Id", "AssetName", "AssetTypeId", "Brand", "Category", "InstallationDate", "InstallationLocation", "IsActive", "LegacyBuilding", "LegacyDepartment", "Model", "OfficeLocation", "Owner", "PurchaseDate", "ServiceId", "Status", "TemplateName", "WarrantyExpiry"
FROM "AssetTemplates";

COMMIT;

PRAGMA foreign_keys = 0;

BEGIN TRANSACTION;

DROP TABLE "AssetTemplates";

ALTER TABLE "ef_temp_AssetTemplates" RENAME TO "AssetTemplates";

COMMIT;

PRAGMA foreign_keys = 1;

BEGIN TRANSACTION;

CREATE INDEX "IX_AssetTemplates_AssetTypeId" ON "AssetTemplates" ("AssetTypeId");

CREATE INDEX "IX_AssetTemplates_ServiceId" ON "AssetTemplates" ("ServiceId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260215185002_AlignTemplatesWithAssetForm', '8.0.11');

COMMIT;


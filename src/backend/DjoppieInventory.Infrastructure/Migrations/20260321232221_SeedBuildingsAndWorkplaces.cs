using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedBuildingsAndWorkplaces : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add missing buildings needed for workplace import
            // Using INSERT ... WHERE NOT EXISTS for idempotency

            // For SQLite
            if (migrationBuilder.ActiveProvider == "Microsoft.EntityFrameworkCore.Sqlite")
            {
                migrationBuilder.Sql(@"
                    INSERT OR IGNORE INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                    VALUES ('BIB', 'Bibliotheek Diepenbeek', 'Gemeenteplein', 30, 1, '2025-01-01 00:00:00');
                    INSERT OR IGNORE INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                    VALUES ('BIBrh', 'Bibliotheek Rooierheide', 'Rooierheide', 31, 1, '2025-01-01 00:00:00');
                    INSERT OR IGNORE INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                    VALUES ('BIBlu', 'Bibliotheek Lutselus', 'Lutselus', 32, 1, '2025-01-01 00:00:00');
                    INSERT OR IGNORE INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                    VALUES ('DS', 'Sportcomplex Demerstrand', 'Demerstrand', 33, 1, '2025-01-01 00:00:00');
                    INSERT OR IGNORE INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                    VALUES ('GTD', 'Gemeentelijke Technische Dienst', 'Technische Dienst', 34, 1, '2025-01-01 00:00:00');
                    INSERT OR IGNORE INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                    VALUES ('GBS', 'Gemeentelijke Basisschool', 'Schoolstraat', 35, 1, '2025-01-01 00:00:00');
                    INSERT OR IGNORE INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                    VALUES ('BKOdl', 'Buitenschoolse kinderopvang DeLoep', 'DeLoep', 36, 1, '2025-01-01 00:00:00');
                    INSERT OR IGNORE INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                    VALUES ('BKOc', 'Buitenschoolse kinderopvang Centrum', 'Centrum', 37, 1, '2025-01-01 00:00:00');
                    INSERT OR IGNORE INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                    VALUES ('BKOrh', 'Buitenschoolse kinderopvang Rooierheide', 'Rooierheide', 38, 1, '2025-01-01 00:00:00');
                    INSERT OR IGNORE INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                    VALUES ('BKOlu', 'Buitenschoolse kinderopvang Lutselus', 'Lutselus', 39, 1, '2025-01-01 00:00:00');
                    INSERT OR IGNORE INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                    VALUES ('BKOgs', 'Buitenschoolse kinderopvang Gemeenteschool', 'Gemeenteschool', 40, 1, '2025-01-01 00:00:00');
                ");
            }
            else // SQL Server
            {
                migrationBuilder.Sql(@"
                    IF NOT EXISTS (SELECT 1 FROM Buildings WHERE Code = 'BIB')
                        INSERT INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                        VALUES ('BIB', 'Bibliotheek Diepenbeek', 'Gemeenteplein', 30, 1, '2025-01-01');
                    IF NOT EXISTS (SELECT 1 FROM Buildings WHERE Code = 'BIBrh')
                        INSERT INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                        VALUES ('BIBrh', 'Bibliotheek Rooierheide', 'Rooierheide', 31, 1, '2025-01-01');
                    IF NOT EXISTS (SELECT 1 FROM Buildings WHERE Code = 'BIBlu')
                        INSERT INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                        VALUES ('BIBlu', 'Bibliotheek Lutselus', 'Lutselus', 32, 1, '2025-01-01');
                    IF NOT EXISTS (SELECT 1 FROM Buildings WHERE Code = 'DS')
                        INSERT INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                        VALUES ('DS', 'Sportcomplex Demerstrand', 'Demerstrand', 33, 1, '2025-01-01');
                    IF NOT EXISTS (SELECT 1 FROM Buildings WHERE Code = 'GTD')
                        INSERT INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                        VALUES ('GTD', 'Gemeentelijke Technische Dienst', 'Technische Dienst', 34, 1, '2025-01-01');
                    IF NOT EXISTS (SELECT 1 FROM Buildings WHERE Code = 'GBS')
                        INSERT INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                        VALUES ('GBS', 'Gemeentelijke Basisschool', 'Schoolstraat', 35, 1, '2025-01-01');
                    IF NOT EXISTS (SELECT 1 FROM Buildings WHERE Code = 'BKOdl')
                        INSERT INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                        VALUES ('BKOdl', 'Buitenschoolse kinderopvang DeLoep', 'DeLoep', 36, 1, '2025-01-01');
                    IF NOT EXISTS (SELECT 1 FROM Buildings WHERE Code = 'BKOc')
                        INSERT INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                        VALUES ('BKOc', 'Buitenschoolse kinderopvang Centrum', 'Centrum', 37, 1, '2025-01-01');
                    IF NOT EXISTS (SELECT 1 FROM Buildings WHERE Code = 'BKOrh')
                        INSERT INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                        VALUES ('BKOrh', 'Buitenschoolse kinderopvang Rooierheide', 'Rooierheide', 38, 1, '2025-01-01');
                    IF NOT EXISTS (SELECT 1 FROM Buildings WHERE Code = 'BKOlu')
                        INSERT INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                        VALUES ('BKOlu', 'Buitenschoolse kinderopvang Lutselus', 'Lutselus', 39, 1, '2025-01-01');
                    IF NOT EXISTS (SELECT 1 FROM Buildings WHERE Code = 'BKOgs')
                        INSERT INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                        VALUES ('BKOgs', 'Buitenschoolse kinderopvang Gemeenteschool', 'Gemeenteschool', 40, 1, '2025-01-01');
                ");
            }

            // Fix service codes for compatibility with CSV import
            migrationBuilder.Sql("UPDATE Services SET Code = 'FIN' WHERE Code = 'FINZ';");
            migrationBuilder.Sql("UPDATE Services SET Code = 'BZ' WHERE Code = 'BURG';");

            // Seed 157 physical workplaces
            SeedPhysicalWorkplaces(migrationBuilder);
        }

        private void SeedPhysicalWorkplaces(MigrationBuilder migrationBuilder)
        {
            // For SQL Server, we need to use building/service names to lookup IDs
            // For SQLite, we already have the data loaded with known IDs

            if (migrationBuilder.ActiveProvider == "Microsoft.EntityFrameworkCore.Sqlite")
            {
                // SQLite version - use INSERT OR REPLACE for idempotency
                migrationBuilder.Sql(@"
-- Aankoopdienst (GH, AANK)
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-AANK-TC', 'Aankoopdienst Teamcoordinator', 'Aankoopdienst - Teamcoordinator', b.Id, s.Id, '3e verdieping', 'Dienst Aankopen', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'AANK';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-AANK-01', 'Aankoopdienst Werkplek 1', 'Aankoopdienst - Werkplek 1', b.Id, s.Id, '3e verdieping', 'Dienst Aankopen', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'AANK';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-AANK-02', 'Aankoopdienst Werkplek 2', 'Aankoopdienst - Werkplek 2', b.Id, s.Id, '3e verdieping', 'Dienst Aankopen', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'AANK';

-- Financien (GH, FIN)
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-FIN-FD', 'Financieel Directeur', 'Financien - Fin. Directeur', b.Id, s.Id, '3e verdieping', 'Dienst Financien', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'FIN';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-FIN-TC', 'Financien Teamcoordinator', 'Financien - Teamcoordinator', b.Id, s.Id, '3e verdieping', 'Dienst Financien', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'FIN';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-FIN-01', 'Financien Werkplek 1', 'Financien - Werkplek 1', b.Id, s.Id, '3e verdieping', 'Dienst Financien', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'FIN';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-FIN-02', 'Financien Werkplek 2', 'Financien - Werkplek 2', b.Id, s.Id, '3e verdieping', 'Dienst Financien', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'FIN';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-FIN-03', 'Financien Werkplek 3', 'Financien - Werkplek 3', b.Id, s.Id, '3e verdieping', 'Dienst Financien', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'FIN';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-FIN-04', 'Financien Werkplek 4', 'Financien - Werkplek 4', b.Id, s.Id, '3e verdieping', 'Dienst Financien', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'FIN';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-FIN-05', 'Financien Werkplek 5', 'Financien - Werkplek 5', b.Id, s.Id, '3e verdieping', 'Dienst Financien', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'FIN';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-FIN-06', 'Financien Werkplek 6', 'Financien - Werkplek 6', b.Id, s.Id, '3e verdieping', 'Dienst Financien', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'FIN';

-- Beleven & Bewegen (PLAK, BB)
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PLAK-BB-TC', 'Beleven & Bewegen Teamcoordinator', 'Beleven & Bewegen - Teamcoordinator', b.Id, s.Id, '1e verdieping', 'Beleven & Bewegen', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PLAK' AND s.Code = 'BB';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PLAK-BB-01', 'Beleven Werkplek 1', 'Beleven - Werkplek 1', b.Id, s.Id, '1e verdieping', 'Beleven & Bewegen', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PLAK' AND s.Code = 'BB';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PLAK-BB-02', 'Beleven Werkplek 2', 'Beleven - Werkplek 2', b.Id, s.Id, '1e verdieping', 'Beleven & Bewegen', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PLAK' AND s.Code = 'BB';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PLAK-BB-03', 'Beleven Werkplek 3', 'Beleven - Werkplek 3', b.Id, s.Id, '1e verdieping', 'Beleven & Bewegen', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PLAK' AND s.Code = 'BB';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PLAK-BB-04', 'Beleven Werkplek 4', 'Beleven - Werkplek 4', b.Id, s.Id, '1e verdieping', 'Beleven & Bewegen', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PLAK' AND s.Code = 'BB';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PLAK-BB-05', 'Beleven Werkplek 5', 'Beleven - Werkplek 5', b.Id, s.Id, '1e verdieping', 'Beleven & Bewegen', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PLAK' AND s.Code = 'BB';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PLAK-BB-06', 'Beleven Werkplek 6', 'Beleven - Werkplek 6', b.Id, s.Id, '1e verdieping', 'Beleven & Bewegen', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PLAK' AND s.Code = 'BB';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PLAK-BB-07', 'Beleven Werkplek 7', 'Beleven - Werkplek 7', b.Id, s.Id, '1e verdieping', 'Beleven & Bewegen', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PLAK' AND s.Code = 'BB';

-- Bibliotheek (BIB, BB)
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BIB-BB-01', 'Bibliotheek Werkplek 1', 'Bibliotheek - Werkplek 1', b.Id, s.Id, 'Gelijkvloers', 'Bibliotheek', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'BIB' AND s.Code = 'BB';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BIB-BB-02', 'Bibliotheek Werkplek 2', 'Bibliotheek - Werkplek 2', b.Id, s.Id, 'Gelijkvloers', 'Bibliotheek', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'BIB' AND s.Code = 'BB';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BIB-BB-03', 'Bibliotheek Werkplek 3', 'Bibliotheek - Werkplek 3', b.Id, s.Id, 'Gelijkvloers', 'Bibliotheek', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'BIB' AND s.Code = 'BB';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BIB-BB-04', 'Bibliotheek Werkplek 4', 'Bibliotheek - Werkplek 4', b.Id, s.Id, 'Gelijkvloers', 'Bibliotheek', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'BIB' AND s.Code = 'BB';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BIB-BB-05', 'Bibliotheek Werkplek 5', 'Bibliotheek - Werkplek 5', b.Id, s.Id, 'Gelijkvloers', 'Bibliotheek', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'BIB' AND s.Code = 'BB';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BIB-BB-06', 'Bibliotheek Werkplek 6', 'Bibliotheek - Werkplek 6', b.Id, s.Id, 'Gelijkvloers', 'Bibliotheek', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'BIB' AND s.Code = 'BB';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BIB-BB-PUB-01', 'Bibliotheek Publiek PC 1', 'Bibliotheek - Publiek PC 1', b.Id, s.Id, 'Gelijkvloers', 'Bibliotheek', 0, 1, 0, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'BIB' AND s.Code = 'BB';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BIB-BB-PUB-02', 'Bibliotheek Publiek PC 2', 'Bibliotheek - Publiek PC 2', b.Id, s.Id, 'Gelijkvloers', 'Bibliotheek', 0, 1, 0, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'BIB' AND s.Code = 'BB';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BIB-BB-PUB-03', 'Bibliotheek Publiek PC 3', 'Bibliotheek - Publiek PC 3', b.Id, s.Id, 'Gelijkvloers', 'Bibliotheek', 0, 1, 0, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'BIB' AND s.Code = 'BB';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BIB-BB-PUB-04', 'Bibliotheek Publiek PC 4', 'Bibliotheek - Publiek PC 4', b.Id, s.Id, 'Gelijkvloers', 'Bibliotheek', 0, 1, 0, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'BIB' AND s.Code = 'BB';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BIB-BB-ONTH-01', 'Bibliotheek Onthaal', 'Bibliotheek - Onthaal', b.Id, s.Id, 'Gelijkvloers', 'Bibliotheek', 0, 2, 0, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'BIB' AND s.Code = 'BB';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BIB-BB-Rooi-01', 'Bibliotheek Rooierheide', 'Bibliotheek Rooierheide', b.Id, s.Id, 'Gelijkvloers', 'Bibliotheek Rooierheide', 0, 2, 0, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'BIBrh' AND s.Code = 'BB';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BIB-BB-Luts-01', 'Bibliotheek Lutselus', 'Bibliotheek Lutselus', b.Id, s.Id, 'Gelijkvloers', 'Bibliotheek Lutselus', 0, 2, 0, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'BIBlu' AND s.Code = 'BB';

-- Demerstrand (DS, BB)
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'DS-BB-TC', 'Bewegen Teamcoordinator', 'Bewegen - Teamcoordinator', b.Id, s.Id, 'Gelijkvloers', 'Demerstrand', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'DS' AND s.Code = 'BB';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'DS-BB-02', 'Bewegen Werkplek 1', 'Bewegen - Werkplek 1', b.Id, s.Id, 'Gelijkvloers', 'Demerstrand', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'DS' AND s.Code = 'BB';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'DS-BB-03', 'Bewegen Werkplek 2', 'Bewegen - Werkplek 2', b.Id, s.Id, 'Gelijkvloers', 'Demerstrand', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'DS' AND s.Code = 'BB';

-- Burgerzaken (GH, BZ)
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-BZ-TC', 'Burgerzaken Teamcoordinator', 'Burgerzaken - Teamcoordinator', b.Id, s.Id, 'Gelijkvloers', 'Burgerzaken', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'BZ';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-BZ-ONTH-01', 'Burgerzaken Onthaal', 'Burgerzaken - Onthaal', b.Id, s.Id, 'Gelijkvloers', 'Burgerzaken', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'BZ';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-BZ-01', 'Burgerzaken Werkplek 1', 'Burgerzaken - Werkplek 1', b.Id, s.Id, 'Gelijkvloers', 'Burgerzaken', 0, 2, 0, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'BZ';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-BZ-L01', 'Burgerzaken Loket 01', 'Burgerzaken - Loket 01', b.Id, s.Id, 'Gelijkvloers', 'Burgerzaken', 0, 2, 0, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'BZ';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-BZ-L02', 'Burgerzaken Loket 02', 'Burgerzaken - Loket 02', b.Id, s.Id, 'Gelijkvloers', 'Burgerzaken', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'BZ';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-BZ-L03', 'Burgerzaken Loket 03', 'Burgerzaken - Loket 03', b.Id, s.Id, 'Gelijkvloers', 'Burgerzaken', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'BZ';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-BZ-L04', 'Burgerzaken Loket 04', 'Burgerzaken - Loket 04', b.Id, s.Id, 'Gelijkvloers', 'Burgerzaken', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'BZ';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-BZ-L05', 'Burgerzaken Loket 05', 'Burgerzaken - Loket 05', b.Id, s.Id, 'Gelijkvloers', 'Burgerzaken', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'BZ';

-- Gezin & Onderwijs (PG, GO)
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-GO-TC', 'Gezin & Onderwijs Teamcoordinator', 'Gezin & Onderwijs - Teamcoordinator', b.Id, s.Id, 'Gelijkvloers', 'Gezin & Onderwijs', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'GO';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GBS-GO-DIR', 'Gemeentelijke basisschool - Directeur', 'Gemeentelijke basisschool - Directeur/Directrice', b.Id, s.Id, 'Gelijkvloers', 'Gezin & Onderwijs', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GBS' AND s.Code = 'GO';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GBS-GO-SEC01', 'Gemeentelijke basisschool - Secretariaat 01', 'Gemeentelijke basisschool - Secretariaat 01', b.Id, s.Id, 'Gelijkvloers', 'Gezin & Onderwijs', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GBS' AND s.Code = 'GO';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GBS-GO-SEC02', 'Gemeentelijke basisschool - Secretariaat 02', 'Gemeentelijke basisschool - Secretariaat 02', b.Id, s.Id, 'Gelijkvloers', 'Gezin & Onderwijs', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GBS' AND s.Code = 'GO';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-GO-BKO-01', 'Gezin & Onderwijs Teamcoach BKO', 'Gezin & Onderwijs Teamcoach BKO', b.Id, s.Id, 'Gelijkvloers', 'Gezin & Onderwijs - BKO', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'GO';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-GO-BKO-02', 'Gezin & Onderwijs Teamcoach BKO 2', 'Gezin & Onderwijs Teamcoach BKO', b.Id, s.Id, 'Gelijkvloers', 'Gezin & Onderwijs - BKO', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'GO';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-GO-BKO-03', 'Gezin & Onderwijs Teamcoach BKO 3', 'Gezin & Onderwijs Teamcoach BKO', b.Id, s.Id, 'Gelijkvloers', 'Gezin & Onderwijs - BKO', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'GO';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-GO-HVHK-01', 'Gezin & Onderwijs HVHK 1', 'Gezin & Onderwijs - HVHK', b.Id, s.Id, 'Gelijkvloers', 'Gezin & Onderwijs - HVHK', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'GO';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-GO-HVHK-02', 'Gezin & Onderwijs HVHK 2', 'Gezin & Onderwijs - HVHK', b.Id, s.Id, 'Gelijkvloers', 'Gezin & Onderwijs - HVHK', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'GO';

-- BKO locaties
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BKO-Centr-01', 'BKO Centrum', 'Buitenschoolse Kinderopvang - Centrum', b.Id, s.Id, 'Gelijkvloers', 'BKO Centrum', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'BKOc' AND s.Code = 'GO';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BKO-Rooi-01', 'BKO Rooierheide', 'Buitenschoolse Kinderopvang - Rooierheide', b.Id, s.Id, 'Gelijkvloers', 'BKO Rooierheide', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'BKOrh' AND s.Code = 'GO';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BKO-Luts-01', 'BKO Lutselus', 'Buitenschoolse Kinderopvang - Lutselus', b.Id, s.Id, 'Gelijkvloers', 'BKO Lutselus', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'BKOlu' AND s.Code = 'GO';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BKO-Gs-01', 'BKO Gemeenteschool', 'Buitenschoolse Kinderopvang - Gemeenteschool', b.Id, s.Id, 'Gelijkvloers', 'BKO Gemeenteschool', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'BKOgs' AND s.Code = 'GO';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BKO-Deloe-01', 'BKO DeLoep', 'Buitenschoolse Kinderopvang - DeLoep', b.Id, s.Id, 'Gelijkvloers', 'BKO DeLoep', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'BKOdl' AND s.Code = 'GO';

-- Sociale Dienst (PG, SOC)
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-SOC-TC', 'Sociale Dienst Teamcoordinator', 'Sociale Dienst - Teamcoordinator', b.Id, s.Id, 'Gelijkvloers', 'Sociale Dienst', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'SOC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-SOC-01', 'Sociale Dienst Werkplek 1', 'Sociale Dienst - Werkplek 1', b.Id, s.Id, 'Gelijkvloers', 'Sociale Dienst', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'SOC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-SOC-02', 'Sociale Dienst Werkplek 2', 'Sociale Dienst - Werkplek 2', b.Id, s.Id, 'Gelijkvloers', 'Sociale Dienst', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'SOC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-SOC-03', 'Sociale Dienst Werkplek 3', 'Sociale Dienst - Werkplek 3', b.Id, s.Id, 'Gelijkvloers', 'Sociale Dienst', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'SOC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-SOC-04', 'Sociale Dienst Werkplek 4', 'Sociale Dienst - Werkplek 4', b.Id, s.Id, 'Gelijkvloers', 'Sociale Dienst', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'SOC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-SOC-05', 'Sociale Dienst Werkplek 5', 'Sociale Dienst - Werkplek 5', b.Id, s.Id, '1e verdieping', 'Sociale Dienst', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'SOC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-SOC-06', 'Sociale Dienst Werkplek 6', 'Sociale Dienst - Werkplek 6', b.Id, s.Id, '1e verdieping', 'Sociale Dienst', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'SOC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-SOC-07', 'Sociale Dienst Werkplek 7', 'Sociale Dienst - Werkplek 7', b.Id, s.Id, '1e verdieping', 'Sociale Dienst', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'SOC';

-- Bestuurssecretariaat (GH, BSEC)
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-BSEC-TC', 'Bestuurssecretariaat Teamcoordinator', 'Bestuurssecretariaat - Teamcoordinator', b.Id, s.Id, '2e verdieping', 'Bestuurssecretariaat', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'BSEC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-BSEC-01', 'Bestuurssecretariaat Werkplek 1', 'Bestuurssecretariaat - Werkplek 1', b.Id, s.Id, '2e verdieping', 'Bestuurssecretariaat', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'BSEC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-BSEC-02', 'Bestuurssecretariaat Werkplek 2', 'Bestuurssecretariaat - Werkplek 2', b.Id, s.Id, '2e verdieping', 'Bestuurssecretariaat', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'BSEC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-BSEC-03', 'Bestuurssecretariaat Werkplek 3', 'Bestuurssecretariaat - Werkplek 3', b.Id, s.Id, '2e verdieping', 'Bestuurssecretariaat', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'BSEC';

-- Communicatie (GH, COM)
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-COM-TC', 'Communicatie Teamcoordinator', 'Communicatie - Teamcoordinator', b.Id, s.Id, '2e verdieping', 'Communicatie', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'COM';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-COM-01', 'Communicatie Werkplek 1', 'Communicatie - Werkplek 1', b.Id, s.Id, '2e verdieping', 'Communicatie', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'COM';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-COM-02', 'Communicatie Werkplek 2', 'Communicatie - Werkplek 2', b.Id, s.Id, '2e verdieping', 'Communicatie', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'COM';

-- HR (GH, HR)
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-HR-TC', 'HR Teamcoordinator', 'HR - Teamcoordinator', b.Id, s.Id, '1e verdieping', 'HR', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'HR';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-HR-01', 'HR Werkplek 1', 'HR - Werkplek 1', b.Id, s.Id, '1e verdieping', 'HR', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'HR';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-HR-02', 'HR Werkplek 2', 'HR - Werkplek 2', b.Id, s.Id, '1e verdieping', 'HR', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'HR';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-HR-03', 'HR Werkplek 3', 'HR - Werkplek 3', b.Id, s.Id, '1e verdieping', 'HR', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'HR';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-HR-04', 'HR Werkplek 4', 'HR - Werkplek 4', b.Id, s.Id, '1e verdieping', 'HR', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'HR';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-HR-05', 'HR Werkplek 5', 'HR - Werkplek 5', b.Id, s.Id, '1e verdieping', 'HR', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'HR';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-HR-06', 'HR Werkplek 6', 'HR - Werkplek 6', b.Id, s.Id, '1e verdieping', 'HR', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'HR';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-HR-07', 'HR Werkplek 7', 'HR - Werkplek 7', b.Id, s.Id, '1e verdieping', 'HR', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GH' AND s.Code = 'HR';

-- IT (PG, IT)
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-IT-TC', 'IT Teamcoordinator', 'IT - Teamcoordinator', b.Id, s.Id, '1e verdieping', 'ICT', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'IT';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-IT-01', 'IT Werkplek 1', 'IT - Werkplek 1', b.Id, s.Id, '1e verdieping', 'ICT', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'IT';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-IT-02', 'IT Werkplek 2', 'IT - Werkplek 2', b.Id, s.Id, '1e verdieping', 'ICT', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'IT';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-IT-03', 'IT Werkplek 3', 'IT - Werkplek 3', b.Id, s.Id, '1e verdieping', 'ICT', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'IT';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-IT-04', 'IT Werkplek 4', 'IT - Werkplek 4', b.Id, s.Id, '1e verdieping', 'ICT', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'IT';

-- Organisatiebeheersing (PG, ORGB)
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-ORGB-TC', 'Organisatiebeheersing Teamcoordinator', 'Organisatiebeheersing - Teamcoordinator', b.Id, s.Id, '1e verdieping', 'Organisatiebeheersing', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'ORGB';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-ORGB-01', 'Organisatiebeheersing Werkplek 1', 'Organisatiebeheersing - Werkplek 1', b.Id, s.Id, '1e verdieping', 'Organisatiebeheersing', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'ORGB';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-ORGB-02', 'Organisatiebeheersing Werkplek 2', 'Organisatiebeheersing - Werkplek 2', b.Id, s.Id, '1e verdieping', 'Organisatiebeheersing', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'ORGB';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-ORGB-03', 'Organisatiebeheersing Werkplek 3', 'Organisatiebeheersing - Werkplek 3', b.Id, s.Id, '1e verdieping', 'Organisatiebeheersing', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'ORGB';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-ORGB-FLEX01', 'Organisatiebeheersing Flexplek 01', 'Organisatiebeheersing - Flexplek 01', b.Id, s.Id, '1e verdieping', 'Organisatiebeheersing', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'ORGB';

-- Preventie (PG, PREV)
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-PREV-TC', 'Preventie Teamcoordinator', 'Preventie - Teamcoordinator', b.Id, s.Id, '1e verdieping', 'Preventie', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'PREV';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-PREV-01', 'Preventie Werkplek 1', 'Preventie - Werkplek 1', b.Id, s.Id, '1e verdieping', 'Preventie', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'PREV';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-PREV-02', 'Preventie Werkplek 2', 'Preventie - Werkplek 2', b.Id, s.Id, '1e verdieping', 'Preventie', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'PREV';

-- Infrastructuur (GTD, INFRA)
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-INFRA-01', 'Infrastructuur Werkplek 1', 'Infrastructuur - Werkplek 1', b.Id, s.Id, 'Gelijkvloers', 'Infrastructuur', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'INFRA';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-INFRA-02', 'Infrastructuur Werkplek 2', 'Infrastructuur - Werkplek 2', b.Id, s.Id, 'Gelijkvloers', 'Infrastructuur', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'INFRA';

-- Facilitaire Ondersteuning (GTD, FAC)
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-TC', 'Facilitaire Ondersteuning Teamcoordinator', 'Facilitaire Ondersteuning - Teamcoordinator', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-01', 'Facilitaire Ondersteuning Teamcoach 01', 'Facilitaire Ondersteuning - Teamcoach 01', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-02', 'Facilitaire Ondersteuning Werkplek 1', 'Facilitaire Ondersteuning - Werkplek 1', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-03', 'Facilitaire Ondersteuning Werkplek 2', 'Facilitaire Ondersteuning - Werkplek 2', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-04', 'Facilitaire Ondersteuning Werkplek 3', 'Facilitaire Ondersteuning - Werkplek 3', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-05', 'Facilitaire Ondersteuning Werkplek 4', 'Facilitaire Ondersteuning - Werkplek 4', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-06', 'Facilitaire Ondersteuning Werkplek 5', 'Facilitaire Ondersteuning - Werkplek 5', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-07', 'Facilitaire Ondersteuning Werkplek 6', 'Facilitaire Ondersteuning - Werkplek 6', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-08', 'Facilitaire Ondersteuning Werkplek 7', 'Facilitaire Ondersteuning - Werkplek 7', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-09', 'Facilitaire Ondersteuning Werkplek 8', 'Facilitaire Ondersteuning - Werkplek 8', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-10', 'Facilitaire Ondersteuning Werkplek 9', 'Facilitaire Ondersteuning - Werkplek 9', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-11', 'Facilitaire Ondersteuning Werkplek 10', 'Facilitaire Ondersteuning - Werkplek 10', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-12', 'Facilitaire Ondersteuning Werkplek 11', 'Facilitaire Ondersteuning - Werkplek 11', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-13', 'Facilitaire Ondersteuning Werkplek 12', 'Facilitaire Ondersteuning - Werkplek 12', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-14', 'Facilitaire Ondersteuning Werkplek 13', 'Facilitaire Ondersteuning - Werkplek 13', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 0, 2, 0, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-15', 'Facilitaire Ondersteuning Werkplek 14', 'Facilitaire Ondersteuning - Werkplek 14', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 0, 2, 0, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-16', 'Facilitaire Ondersteuning Werkplek 15', 'Facilitaire Ondersteuning - Werkplek 15', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 0, 3, 0, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-ONTH-01', 'Facilitaire Ondersteuning Onthaal', 'Facilitaire Ondersteuning - Public PC in de refter TD', b.Id, s.Id, 'Gelijkvloers', 'Facilitaire Ondersteuning', 0, 2, 0, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-PUBL-01', 'Facilitaire Ondersteuning Public PC - Refter TD', 'Facilitaire Ondersteuning - Onthaal balie', b.Id, s.Id, 'Gelijkvloers', 'Facilitaire Ondersteuning', 0, 2, 0, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC';

-- Openbaar Domein (GTD, OD)
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-OD-01', 'Openbaar Domein Werkplek 1', 'Openbaar Domein - Werkplek 1', b.Id, s.Id, 'Gelijkvloers', 'Openbaar Domein', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'OD';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-OD-02', 'Openbaar Domein Werkplek 2', 'Openbaar Domein - Werkplek 2', b.Id, s.Id, 'Gelijkvloers', 'Openbaar Domein', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'OD';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-OD-03', 'Openbaar Domein Werkplek 3', 'Openbaar Domein - Werkplek 3', b.Id, s.Id, 'Gelijkvloers', 'Openbaar Domein', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'OD';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-OD-04', 'Openbaar Domein Werkplek 4', 'Openbaar Domein - Werkplek 4', b.Id, s.Id, 'Gelijkvloers', 'Openbaar Domein', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'OD';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-OD-05', 'Openbaar Domein Werkplek 5', 'Openbaar Domein - Werkplek 5', b.Id, s.Id, 'Gelijkvloers', 'Openbaar Domein', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'OD';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-OD-06', 'Openbaar Domein Werkplek 6', 'Openbaar Domein - Werkplek 6', b.Id, s.Id, 'Gelijkvloers', 'Openbaar Domein', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'GTD' AND s.Code = 'OD';

-- Ruimtelijke Ontwikkeling (PG, RO)
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-RO-TC', 'Ruimtelijke Ontwikkeling Teamcoordinator', 'Ruimtelijke Ontwikkeling - Teamcoordinator', b.Id, s.Id, 'Gelijkvloers', 'Ruimtelijke Ontwikkeling', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'RO';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-RO-01', 'Ruimtelijke Ontwikkeling Werkplek 1', 'Ruimtelijke Ontwikkeling - Werkplek 1', b.Id, s.Id, 'Gelijkvloers', 'Ruimtelijke Ontwikkeling', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'RO';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-RO-02', 'Ruimtelijke Ontwikkeling Werkplek 2', 'Ruimtelijke Ontwikkeling - Werkplek 2', b.Id, s.Id, 'Gelijkvloers', 'Ruimtelijke Ontwikkeling', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'RO';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-RO-03', 'Ruimtelijke Ontwikkeling Werkplek 3', 'Ruimtelijke Ontwikkeling - Werkplek 3', b.Id, s.Id, 'Gelijkvloers', 'Ruimtelijke Ontwikkeling', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'RO';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-RO-04', 'Ruimtelijke Ontwikkeling Werkplek 4', 'Ruimtelijke Ontwikkeling - Werkplek 4', b.Id, s.Id, 'Gelijkvloers', 'Ruimtelijke Ontwikkeling', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'RO';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-RO-05', 'Ruimtelijke Ontwikkeling Werkplek 5', 'Ruimtelijke Ontwikkeling - Werkplek 5', b.Id, s.Id, 'Gelijkvloers', 'Ruimtelijke Ontwikkeling', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'RO';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-RO-06', 'Ruimtelijke Ontwikkeling Werkplek 6', 'Ruimtelijke Ontwikkeling - Werkplek 6', b.Id, s.Id, 'Gelijkvloers', 'Ruimtelijke Ontwikkeling', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'RO';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-RO-07', 'Ruimtelijke Ontwikkeling Werkplek 7', 'Ruimtelijke Ontwikkeling - Werkplek 7', b.Id, s.Id, 'Gelijkvloers', 'Ruimtelijke Ontwikkeling', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'RO';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-RO-08', 'Ruimtelijke Ontwikkeling Werkplek 8', 'Ruimtelijke Ontwikkeling - Werkplek 8', b.Id, s.Id, 'Gelijkvloers', 'Ruimtelijke Ontwikkeling', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'RO';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-RO-09', 'Ruimtelijke Ontwikkeling Werkplek 9', 'Ruimtelijke Ontwikkeling - Werkplek 9', b.Id, s.Id, 'Gelijkvloers', 'Ruimtelijke Ontwikkeling', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'RO';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-RO-GGBZ', 'Ruimtelijke Ontwikkeling GGBZ Pc', 'Ruimtelijke Ontwikkeling - GGBZ', b.Id, s.Id, 'Gelijkvloers', 'Ruimtelijke Ontwikkeling', 0, 2, 0, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'RO';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-RO-PLOT', 'Ruimtelijke Ontwikkeling Plotter', 'Ruimtelijke Ontwikkeling - Plotter', b.Id, s.Id, 'Gelijkvloers', 'Ruimtelijke Ontwikkeling', 0, 1, 0, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'PG' AND s.Code = 'RO';

-- Thuiszorg (WZC, THUIS)
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-THUIS-TC', 'Thuiszorg Teamcoordinator', 'Thuiszorg - Teamcoordinator', b.Id, s.Id, 'Gelijkvloers', 'Thuiszorg', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'WZC' AND s.Code = 'THUIS';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-THUIS-01', 'Thuiszorg Werkplek 1', 'Thuiszorg - Werkplek 1', b.Id, s.Id, 'Gelijkvloers', 'Thuiszorg', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'WZC' AND s.Code = 'THUIS';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-THUIS-02', 'Thuiszorg Werkplek 2', 'Thuiszorg - Werkplek 2', b.Id, s.Id, 'Gelijkvloers', 'Thuiszorg', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'WZC' AND s.Code = 'THUIS';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-THUIS-03', 'Thuiszorg Werkplek 3', 'Thuiszorg - Werkplek 3', b.Id, s.Id, 'Gelijkvloers', 'Thuiszorg', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'WZC' AND s.Code = 'THUIS';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-THUIS-04', 'Thuiszorg Werkplek 4', 'Thuiszorg - Werkplek 4', b.Id, s.Id, 'Gelijkvloers', 'Thuiszorg', 1, 3, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'WZC' AND s.Code = 'THUIS';

-- WZC (WZC, WZC)
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-TC', 'WZC Teamcoordinator', 'WZC - Teamcoordinator', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-01', 'WZC Werkplek 1', 'WZC - Werkplek 1', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-02', 'WZC Werkplek 2', 'WZC - Werkplek 2', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-03', 'WZC Werkplek 3', 'WZC - Werkplek 3', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-04', 'WZC Werkplek 4', 'WZC - Werkplek 4', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-05', 'WZC Werkplek 5', 'WZC - Werkplek 5', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-06', 'WZC Werkplek 6', 'WZC - Werkplek 6', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-07', 'WZC Werkplek 7', 'WZC - Werkplek 7', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-08', 'WZC Werkplek 8', 'WZC - Werkplek 8', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-09', 'WZC Werkplek 9', 'WZC - Werkplek 9', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-10', 'WZC Werkplek 10', 'WZC - Werkplek 10', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 1, 2, 1, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-11', 'WZC Werkplek Desktop 11', 'WZC - Werkplek Desktop 11', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 0, 2, 0, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-12', 'WZC Werkplek Desktop 12', 'WZC - Werkplek Desktop 12', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 0, 2, 0, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-13', 'WZC Werkplek Desktop 13', 'WZC - Werkplek Desktop 13', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 0, 2, 0, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-14', 'WZC Werkplek Desktop 14', 'WZC - Werkplek Desktop 14', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 0, 2, 0, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-15', 'WZC Werkplek Desktop 15', 'WZC - Werkplek Desktop 15', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 0, 2, 0, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-16', 'WZC Werkplek Desktop 16', 'WZC - Werkplek Desktop 16', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 0, 2, 0, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-17', 'WZC Werkplek Desktop 17', 'WZC - Werkplek Desktop 17', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 0, 2, 0, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-18', 'WZC Werkplek Desktop 18', 'WZC - Werkplek Desktop 18', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 0, 2, 0, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC';
INSERT OR REPLACE INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-19', 'WZC Werkplek Desktop 19', 'WZC - Werkplek Desktop 19', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 0, 2, 0, 1, datetime('now'), datetime('now')
FROM Buildings b, Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC';
                ");
            }
            else // SQL Server
            {
                // SQL Server version - use MERGE for upsert
                migrationBuilder.Sql(@"
-- Helper: Insert workplaces if they don't exist (using MERGE pattern)
-- This uses a cross join to lookup building and service IDs

-- Aankoopdienst (GH, AANK)
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-AANK-TC', 'Aankoopdienst Teamcoordinator', 'Aankoopdienst - Teamcoordinator', b.Id, s.Id, '3e verdieping', 'Dienst Aankopen', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'AANK' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GH-AANK-TC');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-AANK-01', 'Aankoopdienst Werkplek 1', 'Aankoopdienst - Werkplek 1', b.Id, s.Id, '3e verdieping', 'Dienst Aankopen', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'AANK' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GH-AANK-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-AANK-02', 'Aankoopdienst Werkplek 2', 'Aankoopdienst - Werkplek 2', b.Id, s.Id, '3e verdieping', 'Dienst Aankopen', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'AANK' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GH-AANK-02');

-- Financien (GH, FIN)
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-FIN-FD', 'Financieel Directeur', 'Financien - Fin. Directeur', b.Id, s.Id, '3e verdieping', 'Dienst Financien', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'FIN' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GH-FIN-FD');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-FIN-TC', 'Financien Teamcoordinator', 'Financien - Teamcoordinator', b.Id, s.Id, '3e verdieping', 'Dienst Financien', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'FIN' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GH-FIN-TC');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-FIN-01', 'Financien Werkplek 1', 'Financien - Werkplek 1', b.Id, s.Id, '3e verdieping', 'Dienst Financien', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'FIN' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GH-FIN-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-FIN-02', 'Financien Werkplek 2', 'Financien - Werkplek 2', b.Id, s.Id, '3e verdieping', 'Dienst Financien', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'FIN' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GH-FIN-02');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-FIN-03', 'Financien Werkplek 3', 'Financien - Werkplek 3', b.Id, s.Id, '3e verdieping', 'Dienst Financien', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'FIN' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GH-FIN-03');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-FIN-04', 'Financien Werkplek 4', 'Financien - Werkplek 4', b.Id, s.Id, '3e verdieping', 'Dienst Financien', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'FIN' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GH-FIN-04');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-FIN-05', 'Financien Werkplek 5', 'Financien - Werkplek 5', b.Id, s.Id, '3e verdieping', 'Dienst Financien', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'FIN' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GH-FIN-05');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-FIN-06', 'Financien Werkplek 6', 'Financien - Werkplek 6', b.Id, s.Id, '3e verdieping', 'Dienst Financien', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'FIN' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GH-FIN-06');

-- Beleven & Bewegen PLAK (PLAK, BB)
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PLAK-BB-TC', 'Beleven & Bewegen Teamcoordinator', 'Beleven & Bewegen - Teamcoordinator', b.Id, s.Id, '1e verdieping', 'Beleven & Bewegen', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PLAK' AND s.Code = 'BB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PLAK-BB-TC');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PLAK-BB-01', 'Beleven Werkplek 1', 'Beleven - Werkplek 1', b.Id, s.Id, '1e verdieping', 'Beleven & Bewegen', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PLAK' AND s.Code = 'BB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PLAK-BB-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PLAK-BB-02', 'Beleven Werkplek 2', 'Beleven - Werkplek 2', b.Id, s.Id, '1e verdieping', 'Beleven & Bewegen', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PLAK' AND s.Code = 'BB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PLAK-BB-02');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PLAK-BB-03', 'Beleven Werkplek 3', 'Beleven - Werkplek 3', b.Id, s.Id, '1e verdieping', 'Beleven & Bewegen', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PLAK' AND s.Code = 'BB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PLAK-BB-03');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PLAK-BB-04', 'Beleven Werkplek 4', 'Beleven - Werkplek 4', b.Id, s.Id, '1e verdieping', 'Beleven & Bewegen', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PLAK' AND s.Code = 'BB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PLAK-BB-04');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PLAK-BB-05', 'Beleven Werkplek 5', 'Beleven - Werkplek 5', b.Id, s.Id, '1e verdieping', 'Beleven & Bewegen', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PLAK' AND s.Code = 'BB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PLAK-BB-05');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PLAK-BB-06', 'Beleven Werkplek 6', 'Beleven - Werkplek 6', b.Id, s.Id, '1e verdieping', 'Beleven & Bewegen', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PLAK' AND s.Code = 'BB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PLAK-BB-06');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PLAK-BB-07', 'Beleven Werkplek 7', 'Beleven - Werkplek 7', b.Id, s.Id, '1e verdieping', 'Beleven & Bewegen', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PLAK' AND s.Code = 'BB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PLAK-BB-07');

-- Bibliotheek (BIB, BB)
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BIB-BB-01', 'Bibliotheek Werkplek 1', 'Bibliotheek - Werkplek 1', b.Id, s.Id, 'Gelijkvloers', 'Bibliotheek', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'BIB' AND s.Code = 'BB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'BIB-BB-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BIB-BB-02', 'Bibliotheek Werkplek 2', 'Bibliotheek - Werkplek 2', b.Id, s.Id, 'Gelijkvloers', 'Bibliotheek', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'BIB' AND s.Code = 'BB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'BIB-BB-02');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BIB-BB-03', 'Bibliotheek Werkplek 3', 'Bibliotheek - Werkplek 3', b.Id, s.Id, 'Gelijkvloers', 'Bibliotheek', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'BIB' AND s.Code = 'BB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'BIB-BB-03');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BIB-BB-04', 'Bibliotheek Werkplek 4', 'Bibliotheek - Werkplek 4', b.Id, s.Id, 'Gelijkvloers', 'Bibliotheek', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'BIB' AND s.Code = 'BB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'BIB-BB-04');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BIB-BB-05', 'Bibliotheek Werkplek 5', 'Bibliotheek - Werkplek 5', b.Id, s.Id, 'Gelijkvloers', 'Bibliotheek', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'BIB' AND s.Code = 'BB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'BIB-BB-05');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BIB-BB-06', 'Bibliotheek Werkplek 6', 'Bibliotheek - Werkplek 6', b.Id, s.Id, 'Gelijkvloers', 'Bibliotheek', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'BIB' AND s.Code = 'BB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'BIB-BB-06');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BIB-BB-PUB-01', 'Bibliotheek Publiek PC 1', 'Bibliotheek - Publiek PC 1', b.Id, s.Id, 'Gelijkvloers', 'Bibliotheek', 0, 1, 0, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'BIB' AND s.Code = 'BB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'BIB-BB-PUB-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BIB-BB-PUB-02', 'Bibliotheek Publiek PC 2', 'Bibliotheek - Publiek PC 2', b.Id, s.Id, 'Gelijkvloers', 'Bibliotheek', 0, 1, 0, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'BIB' AND s.Code = 'BB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'BIB-BB-PUB-02');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BIB-BB-PUB-03', 'Bibliotheek Publiek PC 3', 'Bibliotheek - Publiek PC 3', b.Id, s.Id, 'Gelijkvloers', 'Bibliotheek', 0, 1, 0, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'BIB' AND s.Code = 'BB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'BIB-BB-PUB-03');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BIB-BB-PUB-04', 'Bibliotheek Publiek PC 4', 'Bibliotheek - Publiek PC 4', b.Id, s.Id, 'Gelijkvloers', 'Bibliotheek', 0, 1, 0, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'BIB' AND s.Code = 'BB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'BIB-BB-PUB-04');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BIB-BB-ONTH-01', 'Bibliotheek Onthaal', 'Bibliotheek - Onthaal', b.Id, s.Id, 'Gelijkvloers', 'Bibliotheek', 0, 2, 0, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'BIB' AND s.Code = 'BB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'BIB-BB-ONTH-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BIB-BB-Rooi-01', 'Bibliotheek Rooierheide', 'Bibliotheek Rooierheide', b.Id, s.Id, 'Gelijkvloers', 'Bibliotheek Rooierheide', 0, 2, 0, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'BIBrh' AND s.Code = 'BB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'BIB-BB-Rooi-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BIB-BB-Luts-01', 'Bibliotheek Lutselus', 'Bibliotheek Lutselus', b.Id, s.Id, 'Gelijkvloers', 'Bibliotheek Lutselus', 0, 2, 0, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'BIBlu' AND s.Code = 'BB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'BIB-BB-Luts-01');

-- Demerstrand (DS, BB)
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'DS-BB-TC', 'Bewegen Teamcoordinator', 'Bewegen - Teamcoordinator', b.Id, s.Id, 'Gelijkvloers', 'Demerstrand', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'DS' AND s.Code = 'BB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'DS-BB-TC');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'DS-BB-02', 'Bewegen Werkplek 1', 'Bewegen - Werkplek 1', b.Id, s.Id, 'Gelijkvloers', 'Demerstrand', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'DS' AND s.Code = 'BB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'DS-BB-02');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'DS-BB-03', 'Bewegen Werkplek 2', 'Bewegen - Werkplek 2', b.Id, s.Id, 'Gelijkvloers', 'Demerstrand', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'DS' AND s.Code = 'BB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'DS-BB-03');

-- Burgerzaken (GH, BZ)
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-BZ-TC', 'Burgerzaken Teamcoordinator', 'Burgerzaken - Teamcoordinator', b.Id, s.Id, 'Gelijkvloers', 'Burgerzaken', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'BZ' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GH-BZ-TC');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-BZ-ONTH-01', 'Burgerzaken Onthaal', 'Burgerzaken - Onthaal', b.Id, s.Id, 'Gelijkvloers', 'Burgerzaken', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'BZ' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GH-BZ-ONTH-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-BZ-01', 'Burgerzaken Werkplek 1', 'Burgerzaken - Werkplek 1', b.Id, s.Id, 'Gelijkvloers', 'Burgerzaken', 0, 2, 0, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'BZ' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GH-BZ-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-BZ-L01', 'Burgerzaken Loket 01', 'Burgerzaken - Loket 01', b.Id, s.Id, 'Gelijkvloers', 'Burgerzaken', 0, 2, 0, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'BZ' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GH-BZ-L01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-BZ-L02', 'Burgerzaken Loket 02', 'Burgerzaken - Loket 02', b.Id, s.Id, 'Gelijkvloers', 'Burgerzaken', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'BZ' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GH-BZ-L02');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-BZ-L03', 'Burgerzaken Loket 03', 'Burgerzaken - Loket 03', b.Id, s.Id, 'Gelijkvloers', 'Burgerzaken', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'BZ' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GH-BZ-L03');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-BZ-L04', 'Burgerzaken Loket 04', 'Burgerzaken - Loket 04', b.Id, s.Id, 'Gelijkvloers', 'Burgerzaken', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'BZ' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GH-BZ-L04');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-BZ-L05', 'Burgerzaken Loket 05', 'Burgerzaken - Loket 05', b.Id, s.Id, 'Gelijkvloers', 'Burgerzaken', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'BZ' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GH-BZ-L05');

-- Gezin & Onderwijs + BKO (PG/GBS/BKO*, GO)
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-GO-TC', 'Gezin & Onderwijs Teamcoordinator', 'Gezin & Onderwijs - Teamcoordinator', b.Id, s.Id, 'Gelijkvloers', 'Gezin & Onderwijs', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'GO' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-GO-TC');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GBS-GO-DIR', 'Gemeentelijke basisschool - Directeur/Directrice', 'Gemeentelijke basisschool - Directeur/Directrice', b.Id, s.Id, 'Gelijkvloers', 'Gezin & Onderwijs', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GBS' AND s.Code = 'GO' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GBS-GO-DIR');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GBS-GO-SEC01', 'Gemeentelijke basisschool - Secretariaat 01', 'Gemeentelijke basisschool - Secretariaat 01', b.Id, s.Id, 'Gelijkvloers', 'Gezin & Onderwijs', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GBS' AND s.Code = 'GO' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GBS-GO-SEC01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GBS-GO-SEC02', 'Gemeentelijke basisschool - Secretariaat 02', 'Gemeentelijke basisschool - Secretariaat 02', b.Id, s.Id, 'Gelijkvloers', 'Gezin & Onderwijs', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GBS' AND s.Code = 'GO' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GBS-GO-SEC02');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-GO-BKO-01', 'Gezin & Onderwijs Teamcoach BKO', 'Gezin & Onderwijs Teamcoach BKO', b.Id, s.Id, 'Gelijkvloers', 'Gezin & Onderwijs - BKO', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'GO' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-GO-BKO-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-GO-BKO-02', 'Gezin & Onderwijs Teamcoach BKO 2', 'Gezin & Onderwijs Teamcoach BKO 2', b.Id, s.Id, 'Gelijkvloers', 'Gezin & Onderwijs - BKO', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'GO' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-GO-BKO-02');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-GO-BKO-03', 'Gezin & Onderwijs Teamcoach BKO 3', 'Gezin & Onderwijs Teamcoach BKO 3', b.Id, s.Id, 'Gelijkvloers', 'Gezin & Onderwijs - BKO', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'GO' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-GO-BKO-03');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-GO-HVHK-01', 'Gezin & Onderwijs HVHK', 'Gezin & Onderwijs - HVHK', b.Id, s.Id, 'Gelijkvloers', 'Gezin & Onderwijs - HVHK', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'GO' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-GO-HVHK-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-GO-HVHK-02', 'Gezin & Onderwijs HVHK 2', 'Gezin & Onderwijs - HVHK 2', b.Id, s.Id, 'Gelijkvloers', 'Gezin & Onderwijs - HVHK', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'GO' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-GO-HVHK-02');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BKO-Centr-01', 'BKO Centrum', 'Buitenschoolse Kinderopvang - Centrum', b.Id, s.Id, 'Gelijkvloers', 'BKO Centrum', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'BKOc' AND s.Code = 'GO' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'BKO-Centr-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BKO-Rooi-01', 'BKO Rooierheide', 'Buitenschoolse Kinderopvang - Rooierheide', b.Id, s.Id, 'Gelijkvloers', 'BKO Rooierheide', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'BKOrh' AND s.Code = 'GO' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'BKO-Rooi-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BKO-Luts-01', 'BKO Lutselus', 'Buitenschoolse Kinderopvang - Lutselus', b.Id, s.Id, 'Gelijkvloers', 'BKO Lutselus', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'BKOlu' AND s.Code = 'GO' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'BKO-Luts-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BKO-Gs-01', 'BKO Gemeenteschool', 'Buitenschoolse Kinderopvang - Gemeenteschool', b.Id, s.Id, 'Gelijkvloers', 'BKO Gemeenteschool', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'BKOgs' AND s.Code = 'GO' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'BKO-Gs-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'BKO-Deloe-01', 'BKO DeLoep', 'Buitenschoolse Kinderopvang - DeLoep', b.Id, s.Id, 'Gelijkvloers', 'BKO DeLoep', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'BKOdl' AND s.Code = 'GO' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'BKO-Deloe-01');

-- Sociale Dienst (PG, SOC)
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-SOC-TC', 'Sociale Dienst Teamcoordinator', 'Sociale Dienst - Teamcoordinator', b.Id, s.Id, 'Gelijkvloers', 'Sociale Dienst', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'SOC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-SOC-TC');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-SOC-01', 'Sociale Dienst Werkplek 1', 'Sociale Dienst - Werkplek 1', b.Id, s.Id, 'Gelijkvloers', 'Sociale Dienst', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'SOC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-SOC-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-SOC-02', 'Sociale Dienst Werkplek 2', 'Sociale Dienst - Werkplek 2', b.Id, s.Id, 'Gelijkvloers', 'Sociale Dienst', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'SOC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-SOC-02');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-SOC-03', 'Sociale Dienst Werkplek 3', 'Sociale Dienst - Werkplek 3', b.Id, s.Id, 'Gelijkvloers', 'Sociale Dienst', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'SOC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-SOC-03');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-SOC-04', 'Sociale Dienst Werkplek 4', 'Sociale Dienst - Werkplek 4', b.Id, s.Id, 'Gelijkvloers', 'Sociale Dienst', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'SOC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-SOC-04');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-SOC-05', 'Sociale Dienst Werkplek 5', 'Sociale Dienst - Werkplek 5', b.Id, s.Id, '1e verdieping', 'Sociale Dienst', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'SOC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-SOC-05');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-SOC-06', 'Sociale Dienst Werkplek 6', 'Sociale Dienst - Werkplek 6', b.Id, s.Id, '1e verdieping', 'Sociale Dienst', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'SOC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-SOC-06');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-SOC-07', 'Sociale Dienst Werkplek 7', 'Sociale Dienst - Werkplek 7', b.Id, s.Id, '1e verdieping', 'Sociale Dienst', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'SOC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-SOC-07');

-- Bestuurssecretariaat (GH, BSEC)
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-BSEC-TC', 'Bestuurssecretariaat Teamcoordinator', 'Bestuurssecretariaat - Teamcoordinator', b.Id, s.Id, '2e verdieping', 'Bestuurssecretariaat', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'BSEC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GH-BSEC-TC');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-BSEC-01', 'Bestuurssecretariaat Werkplek 1', 'Bestuurssecretariaat - Werkplek 1', b.Id, s.Id, '2e verdieping', 'Bestuurssecretariaat', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'BSEC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GH-BSEC-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-BSEC-02', 'Bestuurssecretariaat Werkplek 2', 'Bestuurssecretariaat - Werkplek 2', b.Id, s.Id, '2e verdieping', 'Bestuurssecretariaat', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'BSEC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GH-BSEC-02');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-BSEC-03', 'Bestuurssecretariaat Werkplek 3', 'Bestuurssecretariaat - Werkplek 3', b.Id, s.Id, '2e verdieping', 'Bestuurssecretariaat', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'BSEC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GH-BSEC-03');

-- Communicatie (GH, COM)
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-COM-TC', 'Communicatie Teamcoordinator', 'Communicatie - Teamcoordinator', b.Id, s.Id, '2e verdieping', 'Communicatie', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'COM' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GH-COM-TC');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-COM-01', 'Communicatie Werkplek 1', 'Communicatie - Werkplek 1', b.Id, s.Id, '2e verdieping', 'Communicatie', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'COM' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GH-COM-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GH-COM-02', 'Communicatie Werkplek 2', 'Communicatie - Werkplek 2', b.Id, s.Id, '2e verdieping', 'Communicatie', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'COM' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GH-COM-02');

-- HR (GH, HR)
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-HR-TC', 'HR Teamcoordinator', 'HR - Teamcoordinator', b.Id, s.Id, '1e verdieping', 'HR', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'HR' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-HR-TC');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-HR-01', 'HR Werkplek 1', 'HR - Werkplek 1', b.Id, s.Id, '1e verdieping', 'HR', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'HR' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-HR-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-HR-02', 'HR Werkplek 2', 'HR - Werkplek 2', b.Id, s.Id, '1e verdieping', 'HR', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'HR' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-HR-02');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-HR-03', 'HR Werkplek 3', 'HR - Werkplek 3', b.Id, s.Id, '1e verdieping', 'HR', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'HR' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-HR-03');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-HR-04', 'HR Werkplek 4', 'HR - Werkplek 4', b.Id, s.Id, '1e verdieping', 'HR', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'HR' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-HR-04');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-HR-05', 'HR Werkplek 5', 'HR - Werkplek 5', b.Id, s.Id, '1e verdieping', 'HR', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'HR' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-HR-05');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-HR-06', 'HR Werkplek 6', 'HR - Werkplek 6', b.Id, s.Id, '1e verdieping', 'HR', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'HR' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-HR-06');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-HR-07', 'HR Werkplek 7', 'HR - Werkplek 7', b.Id, s.Id, '1e verdieping', 'HR', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GH' AND s.Code = 'HR' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-HR-07');

-- IT (PG, IT)
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-IT-TC', 'IT Teamcoordinator', 'IT - Teamcoordinator', b.Id, s.Id, '1e verdieping', 'ICT', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'IT' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-IT-TC');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-IT-01', 'IT Werkplek 1', 'IT - Werkplek 1', b.Id, s.Id, '1e verdieping', 'ICT', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'IT' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-IT-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-IT-02', 'IT Werkplek 2', 'IT - Werkplek 2', b.Id, s.Id, '1e verdieping', 'ICT', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'IT' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-IT-02');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-IT-03', 'IT Werkplek 3', 'IT - Werkplek 3', b.Id, s.Id, '1e verdieping', 'ICT', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'IT' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-IT-03');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-IT-04', 'IT Werkplek 4', 'IT - Werkplek 4', b.Id, s.Id, '1e verdieping', 'ICT', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'IT' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-IT-04');

-- Organisatiebeheersing (PG, ORGB)
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-ORGB-TC', 'Organisatiebeheersing Teamcoordinator', 'Organisatiebeheersing - Teamcoordinator', b.Id, s.Id, '1e verdieping', 'Organisatiebeheersing', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'ORGB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-ORGB-TC');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-ORGB-01', 'Organisatiebeheersing Werkplek 1', 'Organisatiebeheersing - Werkplek 1', b.Id, s.Id, '1e verdieping', 'Organisatiebeheersing', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'ORGB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-ORGB-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-ORGB-02', 'Organisatiebeheersing Werkplek 2', 'Organisatiebeheersing - Werkplek 2', b.Id, s.Id, '1e verdieping', 'Organisatiebeheersing', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'ORGB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-ORGB-02');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-ORGB-03', 'Organisatiebeheersing Werkplek 3', 'Organisatiebeheersing - Werkplek 3', b.Id, s.Id, '1e verdieping', 'Organisatiebeheersing', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'ORGB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-ORGB-03');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-ORGB-FLEX01', 'Organisatiebeheersing Flexplek 01', 'Organisatiebeheersing - Flexplek 01', b.Id, s.Id, '1e verdieping', 'Organisatiebeheersing', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'ORGB' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-ORGB-FLEX01');

-- Preventie (PG, PREV)
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-PREV-TC', 'Preventie Teamcoordinator', 'Preventie - Teamcoordinator', b.Id, s.Id, '1e verdieping', 'Preventie', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'PREV' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-PREV-TC');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-PREV-01', 'Preventie Werkplek 1', 'Preventie - Werkplek 1', b.Id, s.Id, '1e verdieping', 'Preventie', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'PREV' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-PREV-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-PREV-02', 'Preventie Werkplek 2', 'Preventie - Werkplek 2', b.Id, s.Id, '1e verdieping', 'Preventie', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'PREV' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-PREV-02');

-- Infrastructuur (GTD, INFRA)
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-INFRA-01', 'Infrastructuur Werkplek 1', 'Infrastructuur - Werkplek 1', b.Id, s.Id, 'Gelijkvloers', 'Infrastructuur', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'INFRA' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-INFRA-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-INFRA-02', 'Infrastructuur Werkplek 2', 'Infrastructuur - Werkplek 2', b.Id, s.Id, 'Gelijkvloers', 'Infrastructuur', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'INFRA' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-INFRA-02');

-- Facilitaire Ondersteuning (GTD, FAC)
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-TC', 'Facilitaire Ondersteuning Teamcoordinator', 'Facilitaire Ondersteuning - Teamcoordinator', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-FAC-TC');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-01', 'Facilitaire Ondersteuning Teamcoach 01', 'Facilitaire Ondersteuning - Teamcoach 01', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-FAC-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-02', 'Facilitaire Ondersteuning Werkplek 1', 'Facilitaire Ondersteuning - Werkplek 1', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-FAC-02');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-03', 'Facilitaire Ondersteuning Werkplek 2', 'Facilitaire Ondersteuning - Werkplek 2', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-FAC-03');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-04', 'Facilitaire Ondersteuning Werkplek 3', 'Facilitaire Ondersteuning - Werkplek 3', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-FAC-04');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-05', 'Facilitaire Ondersteuning Werkplek 4', 'Facilitaire Ondersteuning - Werkplek 4', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-FAC-05');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-06', 'Facilitaire Ondersteuning Werkplek 5', 'Facilitaire Ondersteuning - Werkplek 5', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-FAC-06');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-07', 'Facilitaire Ondersteuning Werkplek 6', 'Facilitaire Ondersteuning - Werkplek 6', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-FAC-07');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-08', 'Facilitaire Ondersteuning Werkplek 7', 'Facilitaire Ondersteuning - Werkplek 7', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-FAC-08');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-09', 'Facilitaire Ondersteuning Werkplek 8', 'Facilitaire Ondersteuning - Werkplek 8', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-FAC-09');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-10', 'Facilitaire Ondersteuning Werkplek 9', 'Facilitaire Ondersteuning - Werkplek 9', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-FAC-10');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-11', 'Facilitaire Ondersteuning Werkplek 10', 'Facilitaire Ondersteuning - Werkplek 10', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-FAC-11');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-12', 'Facilitaire Ondersteuning Werkplek 11', 'Facilitaire Ondersteuning - Werkplek 11', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-FAC-12');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-13', 'Facilitaire Ondersteuning Werkplek 12', 'Facilitaire Ondersteuning - Werkplek 12', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-FAC-13');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-14', 'Facilitaire Ondersteuning Werkplek 13', 'Facilitaire Ondersteuning - Werkplek 13', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 0, 2, 0, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-FAC-14');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-15', 'Facilitaire Ondersteuning Werkplek 14', 'Facilitaire Ondersteuning - Werkplek 14', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 0, 2, 0, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-FAC-15');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-16', 'Facilitaire Ondersteuning Werkplek 15', 'Facilitaire Ondersteuning - Werkplek 15', b.Id, s.Id, '1e verdieping', 'Facilitaire Ondersteuning', 0, 3, 0, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-FAC-16');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-ONTH-01', 'Facilitaire Ondersteuning Onthaal', 'Facilitaire Ondersteuning - Public PC in de refter TD', b.Id, s.Id, 'Gelijkvloers', 'Facilitaire Ondersteuning', 0, 2, 0, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-FAC-ONTH-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-FAC-PUBL-01', 'Facilitaire Ondersteuning Public PC - Refter TD', 'Facilitaire Ondersteuning - Onthaal balie', b.Id, s.Id, 'Gelijkvloers', 'Facilitaire Ondersteuning', 0, 2, 0, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'FAC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-FAC-PUBL-01');

-- Openbaar Domein (GTD, OD)
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-OD-01', 'Openbaar Domein Werkplek 1', 'Openbaar Domein - Werkplek 1', b.Id, s.Id, 'Gelijkvloers', 'Openbaar Domein', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'OD' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-OD-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-OD-02', 'Openbaar Domein Werkplek 2', 'Openbaar Domein - Werkplek 2', b.Id, s.Id, 'Gelijkvloers', 'Openbaar Domein', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'OD' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-OD-02');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-OD-03', 'Openbaar Domein Werkplek 3', 'Openbaar Domein - Werkplek 3', b.Id, s.Id, 'Gelijkvloers', 'Openbaar Domein', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'OD' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-OD-03');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-OD-04', 'Openbaar Domein Werkplek 4', 'Openbaar Domein - Werkplek 4', b.Id, s.Id, 'Gelijkvloers', 'Openbaar Domein', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'OD' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-OD-04');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-OD-05', 'Openbaar Domein Werkplek 5', 'Openbaar Domein - Werkplek 5', b.Id, s.Id, 'Gelijkvloers', 'Openbaar Domein', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'OD' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-OD-05');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'GTD-OD-06', 'Openbaar Domein Werkplek 6', 'Openbaar Domein - Werkplek 6', b.Id, s.Id, 'Gelijkvloers', 'Openbaar Domein', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'GTD' AND s.Code = 'OD' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'GTD-OD-06');

-- Ruimtelijke Ontwikkeling (PG, RO)
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-RO-TC', 'Ruimtelijke Ontwikkeling Teamcoordinator', 'Ruimtelijke Ontwikkeling - Teamcoordinator', b.Id, s.Id, 'Gelijkvloers', 'Ruimtelijke Ontwikkeling', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'RO' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-RO-TC');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-RO-01', 'Ruimtelijke Ontwikkeling Werkplek 1', 'Ruimtelijke Ontwikkeling - Werkplek 1', b.Id, s.Id, 'Gelijkvloers', 'Ruimtelijke Ontwikkeling', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'RO' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-RO-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-RO-02', 'Ruimtelijke Ontwikkeling Werkplek 2', 'Ruimtelijke Ontwikkeling - Werkplek 2', b.Id, s.Id, 'Gelijkvloers', 'Ruimtelijke Ontwikkeling', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'RO' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-RO-02');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-RO-03', 'Ruimtelijke Ontwikkeling Werkplek 3', 'Ruimtelijke Ontwikkeling - Werkplek 3', b.Id, s.Id, 'Gelijkvloers', 'Ruimtelijke Ontwikkeling', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'RO' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-RO-03');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-RO-04', 'Ruimtelijke Ontwikkeling Werkplek 4', 'Ruimtelijke Ontwikkeling - Werkplek 4', b.Id, s.Id, 'Gelijkvloers', 'Ruimtelijke Ontwikkeling', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'RO' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-RO-04');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-RO-05', 'Ruimtelijke Ontwikkeling Werkplek 5', 'Ruimtelijke Ontwikkeling - Werkplek 5', b.Id, s.Id, 'Gelijkvloers', 'Ruimtelijke Ontwikkeling', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'RO' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-RO-05');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-RO-06', 'Ruimtelijke Ontwikkeling Werkplek 6', 'Ruimtelijke Ontwikkeling - Werkplek 6', b.Id, s.Id, 'Gelijkvloers', 'Ruimtelijke Ontwikkeling', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'RO' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-RO-06');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-RO-07', 'Ruimtelijke Ontwikkeling Werkplek 7', 'Ruimtelijke Ontwikkeling - Werkplek 7', b.Id, s.Id, 'Gelijkvloers', 'Ruimtelijke Ontwikkeling', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'RO' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-RO-07');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-RO-08', 'Ruimtelijke Ontwikkeling Werkplek 8', 'Ruimtelijke Ontwikkeling - Werkplek 8', b.Id, s.Id, 'Gelijkvloers', 'Ruimtelijke Ontwikkeling', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'RO' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-RO-08');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-RO-09', 'Ruimtelijke Ontwikkeling Werkplek 9', 'Ruimtelijke Ontwikkeling - Werkplek 9', b.Id, s.Id, 'Gelijkvloers', 'Ruimtelijke Ontwikkeling', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'RO' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-RO-09');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-RO-GGBZ', 'Ruimtelijke Ontwikkeling GGBZ Pc', 'Ruimtelijke Ontwikkeling - GGBZ', b.Id, s.Id, 'Gelijkvloers', 'Ruimtelijke Ontwikkeling', 0, 2, 0, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'RO' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-RO-GGBZ');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'PG-RO-PLOT', 'Ruimtelijke Ontwikkeling Plotter', 'Ruimtelijke Ontwikkeling - Plotter', b.Id, s.Id, 'Gelijkvloers', 'Ruimtelijke Ontwikkeling', 0, 1, 0, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'PG' AND s.Code = 'RO' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'PG-RO-PLOT');

-- Thuiszorg (WZC, THUIS)
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-THUIS-TC', 'Thuiszorg Teamcoordinator', 'Thuiszorg - Teamcoordinator', b.Id, s.Id, 'Gelijkvloers', 'Thuiszorg', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'WZC' AND s.Code = 'THUIS' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'WZC-THUIS-TC');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-THUIS-01', 'Thuiszorg Werkplek 1', 'Thuiszorg - Werkplek 1', b.Id, s.Id, 'Gelijkvloers', 'Thuiszorg', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'WZC' AND s.Code = 'THUIS' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'WZC-THUIS-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-THUIS-02', 'Thuiszorg Werkplek 2', 'Thuiszorg - Werkplek 2', b.Id, s.Id, 'Gelijkvloers', 'Thuiszorg', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'WZC' AND s.Code = 'THUIS' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'WZC-THUIS-02');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-THUIS-03', 'Thuiszorg Werkplek 3', 'Thuiszorg - Werkplek 3', b.Id, s.Id, 'Gelijkvloers', 'Thuiszorg', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'WZC' AND s.Code = 'THUIS' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'WZC-THUIS-03');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-THUIS-04', 'Thuiszorg Werkplek 4', 'Thuiszorg - Werkplek 4', b.Id, s.Id, 'Gelijkvloers', 'Thuiszorg', 1, 3, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'WZC' AND s.Code = 'THUIS' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'WZC-THUIS-04');

-- WZC (WZC, WZC)
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-TC', 'WZC Teamcoordinator', 'WZC - Teamcoordinator', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'WZC-WZC-TC');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-01', 'WZC Werkplek 1', 'WZC - Werkplek 1', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'WZC-WZC-01');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-02', 'WZC Werkplek 2', 'WZC - Werkplek 2', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'WZC-WZC-02');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-03', 'WZC Werkplek 3', 'WZC - Werkplek 3', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'WZC-WZC-03');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-04', 'WZC Werkplek 4', 'WZC - Werkplek 4', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'WZC-WZC-04');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-05', 'WZC Werkplek 5', 'WZC - Werkplek 5', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'WZC-WZC-05');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-06', 'WZC Werkplek 6', 'WZC - Werkplek 6', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'WZC-WZC-06');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-07', 'WZC Werkplek 7', 'WZC - Werkplek 7', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'WZC-WZC-07');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-08', 'WZC Werkplek 8', 'WZC - Werkplek 8', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'WZC-WZC-08');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-09', 'WZC Werkplek 9', 'WZC - Werkplek 9', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'WZC-WZC-09');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-10', 'WZC Werkplek 10', 'WZC - Werkplek 10', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 1, 2, 1, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'WZC-WZC-10');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-11', 'WZC Werkplek Desktop 11', 'WZC - Werkplek Desktop 11', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 0, 2, 0, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'WZC-WZC-11');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-12', 'WZC Werkplek Desktop 12', 'WZC - Werkplek Desktop 12', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 0, 2, 0, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'WZC-WZC-12');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-13', 'WZC Werkplek Desktop 13', 'WZC - Werkplek Desktop 13', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 0, 2, 0, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'WZC-WZC-13');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-14', 'WZC Werkplek Desktop 14', 'WZC - Werkplek Desktop 14', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 0, 2, 0, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'WZC-WZC-14');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-15', 'WZC Werkplek Desktop 15', 'WZC - Werkplek Desktop 15', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 0, 2, 0, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'WZC-WZC-15');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-16', 'WZC Werkplek Desktop 16', 'WZC - Werkplek Desktop 16', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 0, 2, 0, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'WZC-WZC-16');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-17', 'WZC Werkplek Desktop 17', 'WZC - Werkplek Desktop 17', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 0, 2, 0, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'WZC-WZC-17');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-18', 'WZC Werkplek Desktop 18', 'WZC - Werkplek Desktop 18', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 0, 2, 0, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'WZC-WZC-18');
INSERT INTO PhysicalWorkplaces (Code, Name, Description, BuildingId, ServiceId, Floor, Room, Type, MonitorCount, HasDockingStation, IsActive, CreatedAt, UpdatedAt)
SELECT 'WZC-WZC-19', 'WZC Werkplek Desktop 19', 'WZC - Werkplek Desktop 19', b.Id, s.Id, 'Gelijkvloers', 'WZC Administratie', 0, 2, 0, 1, GETUTCDATE(), GETUTCDATE()
FROM Buildings b CROSS JOIN Services s WHERE b.Code = 'WZC' AND s.Code = 'WZC' AND NOT EXISTS (SELECT 1 FROM PhysicalWorkplaces WHERE Code = 'WZC-WZC-19');
                ");
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove seeded workplaces
            migrationBuilder.Sql("DELETE FROM PhysicalWorkplaces WHERE Code LIKE 'GH-%' OR Code LIKE 'PLAK-%' OR Code LIKE 'BIB-%' OR Code LIKE 'DS-%' OR Code LIKE 'PG-%' OR Code LIKE 'GTD-%' OR Code LIKE 'GBS-%' OR Code LIKE 'WZC-%' OR Code LIKE 'BKO-%';");

            // Restore original service codes
            migrationBuilder.Sql("UPDATE Services SET Code = 'FINZ' WHERE Code = 'FIN';");
            migrationBuilder.Sql("UPDATE Services SET Code = 'BURG' WHERE Code = 'BZ';");

            // Remove added buildings
            migrationBuilder.Sql("DELETE FROM Buildings WHERE Code IN ('BIB', 'BIBrh', 'BIBlu', 'DS', 'GTD', 'GBS', 'BKOdl');");
        }
    }
}

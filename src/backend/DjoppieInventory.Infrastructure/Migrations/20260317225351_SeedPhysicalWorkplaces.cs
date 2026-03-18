using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedPhysicalWorkplaces : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Use INSERT OR IGNORE to skip if data already exists (idempotent)
            migrationBuilder.Sql(@"
                INSERT OR IGNORE INTO PhysicalWorkplaces (Id, BuildingId, Code, CreatedAt, CurrentOccupantEmail, CurrentOccupantEntraId, CurrentOccupantName, Description, Floor, HasDockingStation, IsActive, MonitorCount, Name, OccupiedSince, Room, ServiceId, Type, UpdatedAt)
                VALUES
                (1, 2, 'GH-BZ-L01', '2025-01-01 00:00:00', NULL, NULL, NULL, 'Eerste loket Burgerzaken - Identiteitskaarten', 'Gelijkvloers', 1, 1, 2, 'Loket 1 Burgerzaken', NULL, 'Lokettenhal', 9, 1, '2025-01-01 00:00:00'),
                (2, 2, 'GH-BZ-L02', '2025-01-01 00:00:00', NULL, NULL, NULL, 'Tweede loket Burgerzaken - Rijbewijzen', 'Gelijkvloers', 1, 1, 2, 'Loket 2 Burgerzaken', NULL, 'Lokettenhal', 9, 1, '2025-01-01 00:00:00'),
                (3, 2, 'GH-BZ-L03', '2025-01-01 00:00:00', NULL, NULL, NULL, 'Derde loket Burgerzaken - Paspoorten', 'Gelijkvloers', 1, 1, 2, 'Loket 3 Burgerzaken', NULL, 'Lokettenhal', 9, 1, '2025-01-01 00:00:00'),
                (4, 1, 'PG-IT-01', '2025-01-01 00:00:00', NULL, NULL, NULL, 'Helpdesk werkplek', '1e verdieping', 0, 1, 3, 'Werkplek IT 1', NULL, 'Lokaal IT', 3, 0, '2025-01-01 00:00:00'),
                (5, 1, 'PG-IT-02', '2025-01-01 00:00:00', NULL, NULL, NULL, 'Systeembeheer werkplek', '1e verdieping', 0, 1, 3, 'Werkplek IT 2', NULL, 'Lokaal IT', 3, 0, '2025-01-01 00:00:00'),
                (6, 3, 'PL-FLEX-01', '2025-01-01 00:00:00', NULL, NULL, NULL, 'Gedeelde werkplek voor medewerkers Sector Mens', 'Gelijkvloers', 1, 1, 1, 'Flexplek 1', NULL, 'Open kantoor', 13, 2, '2025-01-01 00:00:00'),
                (7, 2, 'GH-VERG-01', '2025-01-01 00:00:00', NULL, NULL, NULL, 'Grote vergaderzaal met presentatiescherm', '1e verdieping', 1, 1, 1, 'Vergaderzaal Raadzaal', NULL, 'Raadzaal', NULL, 3, '2025-01-01 00:00:00');
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "PhysicalWorkplaces",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "PhysicalWorkplaces",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "PhysicalWorkplaces",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "PhysicalWorkplaces",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "PhysicalWorkplaces",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "PhysicalWorkplaces",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "PhysicalWorkplaces",
                keyColumn: "Id",
                keyValue: 7);
        }
    }
}

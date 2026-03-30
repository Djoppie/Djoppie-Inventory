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
            // Use INSERT OR IGNORE for SQLite compatibility (also works with SQL Server via INSERT)
            migrationBuilder.InsertData(
                table: "PhysicalWorkplaces",
                columns: new[] { "Id", "BuildingId", "Code", "CreatedAt", "CurrentOccupantEmail", "CurrentOccupantEntraId", "CurrentOccupantName", "Description", "Floor", "HasDockingStation", "IsActive", "MonitorCount", "Name", "OccupiedSince", "Room", "ServiceId", "Type", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, 2, "GH-BZ-L01", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, null, null, "Eerste loket Burgerzaken - Identiteitskaarten", "Gelijkvloers", true, true, 2, "Loket 1 Burgerzaken", null, "Lokettenhal", 9, 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 2, 2, "GH-BZ-L02", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, null, null, "Tweede loket Burgerzaken - Rijbewijzen", "Gelijkvloers", true, true, 2, "Loket 2 Burgerzaken", null, "Lokettenhal", 9, 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 3, 2, "GH-BZ-L03", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, null, null, "Derde loket Burgerzaken - Paspoorten", "Gelijkvloers", true, true, 2, "Loket 3 Burgerzaken", null, "Lokettenhal", 9, 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 4, 1, "PG-IT-01", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, null, null, "Helpdesk werkplek", "1e verdieping", false, true, 3, "Werkplek IT 1", null, "Lokaal IT", 3, 0, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 5, 1, "PG-IT-02", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, null, null, "Systeembeheer werkplek", "1e verdieping", false, true, 3, "Werkplek IT 2", null, "Lokaal IT", 3, 0, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 6, 3, "PL-FLEX-01", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, null, null, "Gedeelde werkplek voor medewerkers Sector Mens", "Gelijkvloers", true, true, 1, "Flexplek 1", null, "Open kantoor", 13, 2, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 7, 2, "GH-VERG-01", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, null, null, "Grote vergaderzaal met presentatiescherm", "1e verdieping", true, true, 1, "Vergaderzaal Raadzaal", null, "Raadzaal", null, 3, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) }
                });
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

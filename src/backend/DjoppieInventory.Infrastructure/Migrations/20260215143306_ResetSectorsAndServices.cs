using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ResetSectorsAndServices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // First, delete all existing services to avoid unique constraint violations
            migrationBuilder.Sql("DELETE FROM Services WHERE Id IN (1,2,3,4,5,6,7,8,9)");

            // Delete old sectors (Id 2 and 3 will be reused, but clear any that might conflict)
            migrationBuilder.Sql("DELETE FROM Sectors WHERE Id IN (2,3)");

            // Update Sector 2: RUI -> FIN
            migrationBuilder.InsertData(
                table: "Sectors",
                columns: new[] { "Id", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt" },
                values: new object[] { 2, "FIN", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Financiën", 2, null });

            // Update Sector 3: ZOR -> RUI
            migrationBuilder.InsertData(
                table: "Sectors",
                columns: new[] { "Id", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt" },
                values: new object[] { 3, "RUI", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Ruimte", 3, null });

            // Add new sectors
            migrationBuilder.InsertData(
                table: "Sectors",
                columns: new[] { "Id", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt" },
                values: new object[,]
                {
                    { 4, "MENS", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Mens", 4, null },
                    { 5, "ZORG", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Zorg", 5, null }
                });

            // Insert all new services
            migrationBuilder.InsertData(
                table: "Services",
                columns: new[] { "Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt" },
                values: new object[,]
                {
                    // Sector Organisatie (Id = 1)
                    { 1, "BSEC", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Bestuurssecretariaat", 1, 1, null },
                    { 2, "COM", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Dienst Communicatie", 1, 2, null },
                    { 3, "IT", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Dienst IT", 1, 3, null },
                    { 4, "ORGB", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Dienst Organisatiebeheersing", 1, 4, null },
                    { 5, "HR", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Dienst HR", 1, 5, null },
                    { 6, "PREV", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Dienst Preventie - GIS & Noodplanning", 1, 6, null },
                    // Sector Financiën (Id = 2)
                    { 7, "AANK", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Dienst Aankopen", 2, 7, null },
                    { 8, "FINZ", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Dienst Financiën", 2, 8, null },
                    // Sector Ruimte (Id = 3)
                    { 9, "RO", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Ruimtelijke Ontwikkeling", 3, 9, null },
                    { 10, "INFRA", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Infrastructuurprojecten", 3, 10, null },
                    { 11, "FAC", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Facilitaire Ondersteuning", 3, 11, null },
                    { 12, "OD", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Openbaar Domein", 3, 12, null },
                    // Sector Mens (Id = 4)
                    { 13, "BB", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Beleven & Bewegen", 4, 13, null },
                    { 14, "BURG", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Burgerzaken", 4, 14, null },
                    { 15, "GO", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Gezin & Onderwijs", 4, 15, null },
                    { 16, "GBS", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Gemeentelijke Basisschool", 4, 16, null },
                    { 17, "SOC", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Sociale Dienst", 4, 17, null },
                    // Sector Zorg (Id = 5)
                    { 18, "THUIS", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Thuiszorg", 5, 18, null },
                    { 19, "ASWO", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Assistentiewoningen", 5, 19, null },
                    { 20, "CDV", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Centrum Dagverzorging", 5, 20, null },
                    { 21, "WZC", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Woonzorgcentrum", 5, 21, null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "Sectors",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Sectors",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.UpdateData(
                table: "Sectors",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Code", "Name" },
                values: new object[] { "RUI", "Ruimte" });

            migrationBuilder.UpdateData(
                table: "Sectors",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Code", "Name" },
                values: new object[] { "ZOR", "Zorg" });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Code", "Name" },
                values: new object[] { "IT", "Informatica" });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Code", "Name" },
                values: new object[] { "FIN", "Financiën" });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Code", "Name" },
                values: new object[] { "HR", "Human Resources" });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Code", "Name" },
                values: new object[] { "COM", "Communicatie" });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "Code", "Name" },
                values: new object[] { "SEC", "Secretariaat" });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "Code", "Name", "SectorId" },
                values: new object[] { "TD", "Technische Dienst", 2 });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "Code", "Name" },
                values: new object[] { "RO", "Ruimtelijke Ordening" });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "Code", "Name", "SectorId" },
                values: new object[] { "OCMW", "OCMW", 3 });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "Code", "Name" },
                values: new object[] { "WZC", "Woonzorgcentrum" });
        }
    }
}

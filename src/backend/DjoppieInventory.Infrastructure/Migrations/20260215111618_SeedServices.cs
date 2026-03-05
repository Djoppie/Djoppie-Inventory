using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedServices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Services",
                columns: new[] { "Id", "Code", "CreatedAt", "IsActive", "Name", "SectorId", "SortOrder", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, "IT", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Informatica", 1, 1, null },
                    { 2, "FIN", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Financiën", 1, 2, null },
                    { 3, "HR", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Human Resources", 1, 3, null },
                    { 4, "COM", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Communicatie", 1, 4, null },
                    { 5, "SEC", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Secretariaat", 1, 5, null },
                    { 6, "TD", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Technische Dienst", 2, 6, null },
                    { 7, "RO", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Ruimtelijke Ordening", 2, 7, null },
                    { 8, "OCMW", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "OCMW", 3, 8, null },
                    { 9, "WZC", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Woonzorgcentrum", 3, 9, null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 9);
        }
    }
}

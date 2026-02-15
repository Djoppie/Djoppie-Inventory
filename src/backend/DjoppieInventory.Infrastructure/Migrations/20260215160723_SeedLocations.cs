using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedLocations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Buildings",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Address", "Code", "Name" },
                values: new object[] { "Dienst IT, Aankoopdienst, Grondgebiedzaken", "POORT", "Het Poortgebouw" });

            migrationBuilder.UpdateData(
                table: "Buildings",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Address", "Code", "Name" },
                values: new object[] { "Algemeen directeur, Financiën, Burgerzaken", "GHUIS", "Het Gemeentehuis" });

            migrationBuilder.UpdateData(
                table: "Buildings",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Address", "Code", "Name" },
                values: new object[] { "Sector Mens", "PLAK", "De Plak" });

            migrationBuilder.UpdateData(
                table: "Buildings",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Code", "Name" },
                values: new object[] { "WZC", "Het Woonzorgcentrum" });

            migrationBuilder.UpdateData(
                table: "Buildings",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "Code", "Name", "SortOrder" },
                values: new object[] { "BKOC", "Buitenschoolse kinderopvang centrum", 10 });

            migrationBuilder.InsertData(
                table: "Buildings",
                columns: new[] { "Id", "Address", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt" },
                values: new object[,]
                {
                    { 6, null, "BKOR", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Buitenschoolse kinderopvang Rooierheide", 11, null },
                    { 7, null, "BKOL", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Buitenschoolse kinderopvang Lutselus", 12, null },
                    { 8, null, "BKOG", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Buitenschoolse kinderopvang gemeenteschool", 13, null },
                    { 9, null, "OCL", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Ontmoetingscentrum Lutselus", 14, null },
                    { 10, null, "OCR", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Ontmoetingscentrum Rooierheide", 15, null },
                    { 11, null, "GILDE", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Gildezaal", 16, null },
                    { 12, null, "KEI", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Zaal de Kei", 17, null },
                    { 13, null, "TERL", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Zaal Terloght", 18, null },
                    { 14, null, "HEIZ", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Jeugdhuis Heizoe", 19, null },
                    { 15, null, "SENH", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Seniorenhuis", 20, null },
                    { 16, null, "ROZEN", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "School Rozendaal", 21, null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Buildings",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Buildings",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Buildings",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Buildings",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Buildings",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "Buildings",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "Buildings",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "Buildings",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "Buildings",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "Buildings",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "Buildings",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.UpdateData(
                table: "Buildings",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Address", "Code", "Name" },
                values: new object[] { null, "DBK", "Gemeentehuis Diepenbeek" });

            migrationBuilder.UpdateData(
                table: "Buildings",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Address", "Code", "Name" },
                values: new object[] { null, "WZC", "WZC De Visserij" });

            migrationBuilder.UpdateData(
                table: "Buildings",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Address", "Code", "Name" },
                values: new object[] { null, "GBS", "Gemeentelijke Basisschool" });

            migrationBuilder.UpdateData(
                table: "Buildings",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Code", "Name" },
                values: new object[] { "PLAG", "Plaatselijk Comité" });

            migrationBuilder.UpdateData(
                table: "Buildings",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "Code", "Name", "SortOrder" },
                values: new object[] { "BIB", "Bibliotheek", 5 });
        }
    }
}

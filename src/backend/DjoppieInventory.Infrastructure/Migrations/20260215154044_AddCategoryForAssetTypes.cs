using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoryForAssetTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CategoryId",
                table: "AssetTypes",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Code = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                });

            migrationBuilder.UpdateData(
                table: "AssetTypes",
                keyColumn: "Id",
                keyValue: 1,
                column: "CategoryId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "AssetTypes",
                keyColumn: "Id",
                keyValue: 2,
                column: "CategoryId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "AssetTypes",
                keyColumn: "Id",
                keyValue: 3,
                column: "CategoryId",
                value: 2);

            migrationBuilder.UpdateData(
                table: "AssetTypes",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "CategoryId", "SortOrder" },
                values: new object[] { 5, 9 });

            migrationBuilder.UpdateData(
                table: "AssetTypes",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "CategoryId", "SortOrder" },
                values: new object[] { 3, 7 });

            migrationBuilder.UpdateData(
                table: "AssetTypes",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "CategoryId", "SortOrder" },
                values: new object[] { 5, 10 });

            migrationBuilder.UpdateData(
                table: "AssetTypes",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "CategoryId", "SortOrder" },
                values: new object[] { 4, 8 });

            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "Code", "CreatedAt", "Description", "IsActive", "Name", "SortOrder", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, "COMP", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Computers en rekenkracht", true, "Computing", 1, null },
                    { 2, "WORK", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Werkplekaccessoires en randapparatuur", true, "Werkplek", 2, null },
                    { 3, "PERIPH", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Printers, scanners en andere randapparatuur", true, "Peripherals", 3, null },
                    { 4, "NET", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Netwerkapparatuur", true, "Networking", 4, null },
                    { 5, "MOBILE", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Mobiele apparaten", true, "Mobile", 5, null },
                    { 6, "AV", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Audio- en videoapparatuur", true, "Audio/Video", 6, null }
                });

            migrationBuilder.InsertData(
                table: "AssetTypes",
                columns: new[] { "Id", "CategoryId", "Code", "CreatedAt", "Description", "IsActive", "Name", "SortOrder", "UpdatedAt" },
                values: new object[,]
                {
                    { 8, 2, "DOCK", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, "Docking Station", 4, null },
                    { 9, 2, "KEYB", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, "Keyboard", 5, null },
                    { 10, 2, "MOUSE", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, "Mouse", 6, null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_AssetTypes_CategoryId",
                table: "AssetTypes",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Code",
                table: "Categories",
                column: "Code",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_AssetTypes_Categories_CategoryId",
                table: "AssetTypes",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AssetTypes_Categories_CategoryId",
                table: "AssetTypes");

            migrationBuilder.DropTable(
                name: "Categories");

            migrationBuilder.DropIndex(
                name: "IX_AssetTypes_CategoryId",
                table: "AssetTypes");

            migrationBuilder.DeleteData(
                table: "AssetTypes",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "AssetTypes",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "AssetTypes",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "AssetTypes");

            migrationBuilder.UpdateData(
                table: "AssetTypes",
                keyColumn: "Id",
                keyValue: 4,
                column: "SortOrder",
                value: 4);

            migrationBuilder.UpdateData(
                table: "AssetTypes",
                keyColumn: "Id",
                keyValue: 5,
                column: "SortOrder",
                value: 5);

            migrationBuilder.UpdateData(
                table: "AssetTypes",
                keyColumn: "Id",
                keyValue: 6,
                column: "SortOrder",
                value: 6);

            migrationBuilder.UpdateData(
                table: "AssetTypes",
                keyColumn: "Id",
                keyValue: 7,
                column: "SortOrder",
                value: 7);
        }
    }
}

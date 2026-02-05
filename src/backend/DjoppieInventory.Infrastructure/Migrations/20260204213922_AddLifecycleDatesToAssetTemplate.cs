using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLifecycleDatesToAssetTemplate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "InstallationDate",
                table: "AssetTemplates",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PurchaseDate",
                table: "AssetTemplates",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "WarrantyExpiry",
                table: "AssetTemplates",
                type: "TEXT",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "AssetTemplates",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "InstallationDate", "PurchaseDate", "WarrantyExpiry" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "AssetTemplates",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "InstallationDate", "PurchaseDate", "WarrantyExpiry" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "AssetTemplates",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "InstallationDate", "PurchaseDate", "WarrantyExpiry" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "AssetTemplates",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "InstallationDate", "PurchaseDate", "WarrantyExpiry" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "AssetTemplates",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "InstallationDate", "PurchaseDate", "WarrantyExpiry" },
                values: new object[] { null, null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InstallationDate",
                table: "AssetTemplates");

            migrationBuilder.DropColumn(
                name: "PurchaseDate",
                table: "AssetTemplates");

            migrationBuilder.DropColumn(
                name: "WarrantyExpiry",
                table: "AssetTemplates");
        }
    }
}

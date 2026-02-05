using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOwnerBuildingSpaceToAssetTemplate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Building",
                table: "AssetTemplates",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Owner",
                table: "AssetTemplates",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SpaceOrFloor",
                table: "AssetTemplates",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "AssetTemplates",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Building", "Owner", "SpaceOrFloor" },
                values: new object[] { "", "", "" });

            migrationBuilder.UpdateData(
                table: "AssetTemplates",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Building", "Owner", "SpaceOrFloor" },
                values: new object[] { "", "", "" });

            migrationBuilder.UpdateData(
                table: "AssetTemplates",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Building", "Owner", "SpaceOrFloor" },
                values: new object[] { "", "", "" });

            migrationBuilder.UpdateData(
                table: "AssetTemplates",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Building", "Owner", "SpaceOrFloor" },
                values: new object[] { "", "", "" });

            migrationBuilder.UpdateData(
                table: "AssetTemplates",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "Building", "Owner", "SpaceOrFloor" },
                values: new object[] { "", "", "" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Building",
                table: "AssetTemplates");

            migrationBuilder.DropColumn(
                name: "Owner",
                table: "AssetTemplates");

            migrationBuilder.DropColumn(
                name: "SpaceOrFloor",
                table: "AssetTemplates");
        }
    }
}

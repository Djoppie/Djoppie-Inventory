using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameSpaceOrFloorToDepartmentAndAddOfficeLocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Rename SpaceOrFloor to Department
            migrationBuilder.RenameColumn(
                name: "SpaceOrFloor",
                table: "Assets",
                newName: "Department");

            // Add OfficeLocation column
            migrationBuilder.AddColumn<string>(
                name: "OfficeLocation",
                table: "Assets",
                type: "TEXT",
                nullable: true);

            // Rename SpaceOrFloor to Department in AssetTemplates
            migrationBuilder.RenameColumn(
                name: "SpaceOrFloor",
                table: "AssetTemplates",
                newName: "Department");

            // Add OfficeLocation column to AssetTemplates
            migrationBuilder.AddColumn<string>(
                name: "OfficeLocation",
                table: "AssetTemplates",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove OfficeLocation from AssetTemplates
            migrationBuilder.DropColumn(
                name: "OfficeLocation",
                table: "AssetTemplates");

            // Rename Department back to SpaceOrFloor in AssetTemplates
            migrationBuilder.RenameColumn(
                name: "Department",
                table: "AssetTemplates",
                newName: "SpaceOrFloor");

            // Remove OfficeLocation from Assets
            migrationBuilder.DropColumn(
                name: "OfficeLocation",
                table: "Assets");

            // Rename Department back to SpaceOrFloor
            migrationBuilder.RenameColumn(
                name: "Department",
                table: "Assets",
                newName: "SpaceOrFloor");
        }
    }
}

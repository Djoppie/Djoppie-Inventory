using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveBuildingFromAsset : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Assets_Buildings_BuildingId",
                table: "Assets");

            migrationBuilder.DropIndex(
                name: "IX_Assets_BuildingId",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "BuildingId",
                table: "Assets");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BuildingId",
                table: "Assets",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Assets_BuildingId",
                table: "Assets",
                column: "BuildingId");

            migrationBuilder.AddForeignKey(
                name: "FK_Assets_Buildings_BuildingId",
                table: "Assets",
                column: "BuildingId",
                principalTable: "Buildings",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkplaceMoveTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MovedFromWorkplaceId",
                table: "RolloutWorkplaces",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MovedToWorkplaceId",
                table: "RolloutWorkplaces",
                type: "INTEGER",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MovedFromWorkplaceId",
                table: "RolloutWorkplaces");

            migrationBuilder.DropColumn(
                name: "MovedToWorkplaceId",
                table: "RolloutWorkplaces");
        }
    }
}

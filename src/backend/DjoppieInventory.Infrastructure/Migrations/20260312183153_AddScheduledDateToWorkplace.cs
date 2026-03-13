using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddScheduledDateToWorkplace : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ScheduledDate",
                table: "RolloutWorkplaces",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ScheduledDate",
                table: "RolloutWorkplaces");
        }
    }
}

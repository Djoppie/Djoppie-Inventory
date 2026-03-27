using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIntuneFieldsToAsset : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "IntuneCertificateExpiry",
                table: "Assets",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "IntuneEnrollmentDate",
                table: "Assets",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "IntuneLastCheckIn",
                table: "Assets",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "IntuneSyncedAt",
                table: "Assets",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IntuneCertificateExpiry",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "IntuneEnrollmentDate",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "IntuneLastCheckIn",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "IntuneSyncedAt",
                table: "Assets");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPhysicalWorkplace : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RolloutAssetMovements_RolloutWorkplaces_RolloutWorkplaceId",
                table: "RolloutAssetMovements");

            migrationBuilder.DropForeignKey(
                name: "FK_RolloutAssetMovements_Services_NewServiceId",
                table: "RolloutAssetMovements");

            migrationBuilder.DropForeignKey(
                name: "FK_RolloutAssetMovements_Services_PreviousServiceId",
                table: "RolloutAssetMovements");

            migrationBuilder.DropForeignKey(
                name: "FK_RolloutAssetMovements_WorkplaceAssetAssignments_WorkplaceAssetAssignmentId",
                table: "RolloutAssetMovements");

            migrationBuilder.DropForeignKey(
                name: "FK_RolloutDayServices_Services_ServiceId",
                table: "RolloutDayServices");

            migrationBuilder.AddColumn<int>(
                name: "PhysicalWorkplaceId",
                table: "RolloutWorkplaces",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PhysicalWorkplaceId",
                table: "Assets",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PhysicalWorkplaces",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Code = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    BuildingId = table.Column<int>(type: "INTEGER", nullable: false),
                    ServiceId = table.Column<int>(type: "INTEGER", nullable: true),
                    Floor = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    Room = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    MonitorCount = table.Column<int>(type: "INTEGER", nullable: false),
                    HasDockingStation = table.Column<bool>(type: "INTEGER", nullable: false),
                    CurrentOccupantEntraId = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    CurrentOccupantName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    CurrentOccupantEmail = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    OccupiedSince = table.Column<DateTime>(type: "TEXT", nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PhysicalWorkplaces", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PhysicalWorkplaces_Buildings_BuildingId",
                        column: x => x.BuildingId,
                        principalTable: "Buildings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PhysicalWorkplaces_Services_ServiceId",
                        column: x => x.ServiceId,
                        principalTable: "Services",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RolloutWorkplaces_PhysicalWorkplaceId",
                table: "RolloutWorkplaces",
                column: "PhysicalWorkplaceId");

            migrationBuilder.CreateIndex(
                name: "IX_Assets_PhysicalWorkplaceId",
                table: "Assets",
                column: "PhysicalWorkplaceId");

            migrationBuilder.CreateIndex(
                name: "IX_PhysicalWorkplaces_BuildingId",
                table: "PhysicalWorkplaces",
                column: "BuildingId");

            migrationBuilder.CreateIndex(
                name: "IX_PhysicalWorkplaces_Code",
                table: "PhysicalWorkplaces",
                column: "Code");

            migrationBuilder.CreateIndex(
                name: "IX_PhysicalWorkplaces_CurrentOccupantEntraId",
                table: "PhysicalWorkplaces",
                column: "CurrentOccupantEntraId");

            migrationBuilder.CreateIndex(
                name: "IX_PhysicalWorkplaces_ServiceId",
                table: "PhysicalWorkplaces",
                column: "ServiceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Assets_PhysicalWorkplaces_PhysicalWorkplaceId",
                table: "Assets",
                column: "PhysicalWorkplaceId",
                principalTable: "PhysicalWorkplaces",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_RolloutAssetMovements_RolloutWorkplaces_RolloutWorkplaceId",
                table: "RolloutAssetMovements",
                column: "RolloutWorkplaceId",
                principalTable: "RolloutWorkplaces",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_RolloutAssetMovements_Services_NewServiceId",
                table: "RolloutAssetMovements",
                column: "NewServiceId",
                principalTable: "Services",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_RolloutAssetMovements_Services_PreviousServiceId",
                table: "RolloutAssetMovements",
                column: "PreviousServiceId",
                principalTable: "Services",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_RolloutAssetMovements_WorkplaceAssetAssignments_WorkplaceAssetAssignmentId",
                table: "RolloutAssetMovements",
                column: "WorkplaceAssetAssignmentId",
                principalTable: "WorkplaceAssetAssignments",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_RolloutDayServices_Services_ServiceId",
                table: "RolloutDayServices",
                column: "ServiceId",
                principalTable: "Services",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_RolloutWorkplaces_PhysicalWorkplaces_PhysicalWorkplaceId",
                table: "RolloutWorkplaces",
                column: "PhysicalWorkplaceId",
                principalTable: "PhysicalWorkplaces",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Assets_PhysicalWorkplaces_PhysicalWorkplaceId",
                table: "Assets");

            migrationBuilder.DropForeignKey(
                name: "FK_RolloutAssetMovements_RolloutWorkplaces_RolloutWorkplaceId",
                table: "RolloutAssetMovements");

            migrationBuilder.DropForeignKey(
                name: "FK_RolloutAssetMovements_Services_NewServiceId",
                table: "RolloutAssetMovements");

            migrationBuilder.DropForeignKey(
                name: "FK_RolloutAssetMovements_Services_PreviousServiceId",
                table: "RolloutAssetMovements");

            migrationBuilder.DropForeignKey(
                name: "FK_RolloutAssetMovements_WorkplaceAssetAssignments_WorkplaceAssetAssignmentId",
                table: "RolloutAssetMovements");

            migrationBuilder.DropForeignKey(
                name: "FK_RolloutDayServices_Services_ServiceId",
                table: "RolloutDayServices");

            migrationBuilder.DropForeignKey(
                name: "FK_RolloutWorkplaces_PhysicalWorkplaces_PhysicalWorkplaceId",
                table: "RolloutWorkplaces");

            migrationBuilder.DropTable(
                name: "PhysicalWorkplaces");

            migrationBuilder.DropIndex(
                name: "IX_RolloutWorkplaces_PhysicalWorkplaceId",
                table: "RolloutWorkplaces");

            migrationBuilder.DropIndex(
                name: "IX_Assets_PhysicalWorkplaceId",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "PhysicalWorkplaceId",
                table: "RolloutWorkplaces");

            migrationBuilder.DropColumn(
                name: "PhysicalWorkplaceId",
                table: "Assets");

            migrationBuilder.AddForeignKey(
                name: "FK_RolloutAssetMovements_RolloutWorkplaces_RolloutWorkplaceId",
                table: "RolloutAssetMovements",
                column: "RolloutWorkplaceId",
                principalTable: "RolloutWorkplaces",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_RolloutAssetMovements_Services_NewServiceId",
                table: "RolloutAssetMovements",
                column: "NewServiceId",
                principalTable: "Services",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_RolloutAssetMovements_Services_PreviousServiceId",
                table: "RolloutAssetMovements",
                column: "PreviousServiceId",
                principalTable: "Services",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_RolloutAssetMovements_WorkplaceAssetAssignments_WorkplaceAssetAssignmentId",
                table: "RolloutAssetMovements",
                column: "WorkplaceAssetAssignmentId",
                principalTable: "WorkplaceAssetAssignments",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_RolloutDayServices_Services_ServiceId",
                table: "RolloutDayServices",
                column: "ServiceId",
                principalTable: "Services",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

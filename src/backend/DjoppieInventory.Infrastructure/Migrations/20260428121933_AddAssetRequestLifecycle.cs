using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAssetRequestLifecycle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop old AssetRequest shape (placeholder table — no production data).
            migrationBuilder.DropForeignKey(
                name: "FK_AssetRequests_Assets_AssignedAssetId",
                table: "AssetRequests");

            migrationBuilder.DropIndex(
                name: "IX_AssetRequests_AssignedAssetId",
                table: "AssetRequests");

            migrationBuilder.DropColumn(
                name: "AssetType",
                table: "AssetRequests");

            migrationBuilder.DropColumn(
                name: "AssignedAssetId",
                table: "AssetRequests");

            migrationBuilder.DropColumn(
                name: "EmployeeName",
                table: "AssetRequests");

            // Add new AssetRequest columns.
            migrationBuilder.AddColumn<string>(
                name: "RequestedFor",
                table: "AssetRequests",
                type: "TEXT",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "EmployeeId",
                table: "AssetRequests",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PhysicalWorkplaceId",
                table: "AssetRequests",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AssetRequests_EmployeeId",
                table: "AssetRequests",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_AssetRequests_PhysicalWorkplaceId",
                table: "AssetRequests",
                column: "PhysicalWorkplaceId");

            migrationBuilder.AddForeignKey(
                name: "FK_AssetRequests_Employees_EmployeeId",
                table: "AssetRequests",
                column: "EmployeeId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_AssetRequests_PhysicalWorkplaces_PhysicalWorkplaceId",
                table: "AssetRequests",
                column: "PhysicalWorkplaceId",
                principalTable: "PhysicalWorkplaces",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            // Create AssetRequestLines table.
            migrationBuilder.CreateTable(
                name: "AssetRequestLines",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    AssetRequestId = table.Column<int>(type: "INTEGER", nullable: false),
                    AssetTypeId = table.Column<int>(type: "INTEGER", nullable: false),
                    SourceType = table.Column<int>(type: "INTEGER", nullable: false),
                    AssetId = table.Column<int>(type: "INTEGER", nullable: true),
                    AssetTemplateId = table.Column<int>(type: "INTEGER", nullable: true),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    ReturnAction = table.Column<int>(type: "INTEGER", nullable: true),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssetRequestLines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssetRequestLines_AssetRequests_AssetRequestId",
                        column: x => x.AssetRequestId,
                        principalTable: "AssetRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AssetRequestLines_AssetTemplates_AssetTemplateId",
                        column: x => x.AssetTemplateId,
                        principalTable: "AssetTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_AssetRequestLines_AssetTypes_AssetTypeId",
                        column: x => x.AssetTypeId,
                        principalTable: "AssetTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AssetRequestLines_Assets_AssetId",
                        column: x => x.AssetId,
                        principalTable: "Assets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AssetRequestLines_AssetId",
                table: "AssetRequestLines",
                column: "AssetId");

            migrationBuilder.CreateIndex(
                name: "IX_AssetRequestLines_AssetRequestId",
                table: "AssetRequestLines",
                column: "AssetRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_AssetRequestLines_AssetTemplateId",
                table: "AssetRequestLines",
                column: "AssetTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_AssetRequestLines_AssetTypeId",
                table: "AssetRequestLines",
                column: "AssetTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_AssetRequestLines_Status",
                table: "AssetRequestLines",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AssetRequestLines");

            migrationBuilder.DropForeignKey(
                name: "FK_AssetRequests_Employees_EmployeeId",
                table: "AssetRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_AssetRequests_PhysicalWorkplaces_PhysicalWorkplaceId",
                table: "AssetRequests");

            migrationBuilder.DropIndex(
                name: "IX_AssetRequests_EmployeeId",
                table: "AssetRequests");

            migrationBuilder.DropIndex(
                name: "IX_AssetRequests_PhysicalWorkplaceId",
                table: "AssetRequests");

            migrationBuilder.DropColumn(
                name: "EmployeeId",
                table: "AssetRequests");

            migrationBuilder.DropColumn(
                name: "PhysicalWorkplaceId",
                table: "AssetRequests");

            migrationBuilder.DropColumn(
                name: "RequestedFor",
                table: "AssetRequests");

            migrationBuilder.AddColumn<string>(
                name: "EmployeeName",
                table: "AssetRequests",
                type: "TEXT",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AssetType",
                table: "AssetRequests",
                type: "TEXT",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "AssignedAssetId",
                table: "AssetRequests",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AssetRequests_AssignedAssetId",
                table: "AssetRequests",
                column: "AssignedAssetId");

            migrationBuilder.AddForeignKey(
                name: "FK_AssetRequests_Assets_AssignedAssetId",
                table: "AssetRequests",
                column: "AssignedAssetId",
                principalTable: "Assets",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}

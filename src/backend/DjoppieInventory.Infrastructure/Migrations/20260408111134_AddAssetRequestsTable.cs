using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAssetRequestsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AssetRequests",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("Sqlite:Autoincrement", true)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RequestedDate = table.Column<DateTime>(nullable: false),
                    RequestType = table.Column<int>(nullable: false),
                    EmployeeName = table.Column<string>(maxLength: 200, nullable: false),
                    AssetType = table.Column<string>(maxLength: 100, nullable: false),
                    Notes = table.Column<string>(maxLength: 2000, nullable: true),
                    Status = table.Column<int>(nullable: false),
                    AssignedAssetId = table.Column<int>(nullable: true),
                    CreatedBy = table.Column<string>(maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTime>(nullable: false),
                    ModifiedBy = table.Column<string>(maxLength: 200, nullable: true),
                    ModifiedAt = table.Column<DateTime>(nullable: true),
                    CompletedAt = table.Column<DateTime>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssetRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssetRequests_Assets_AssignedAssetId",
                        column: x => x.AssignedAssetId,
                        principalTable: "Assets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AssetRequests_AssignedAssetId",
                table: "AssetRequests",
                column: "AssignedAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_AssetRequests_CreatedAt",
                table: "AssetRequests",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AssetRequests_RequestedDate",
                table: "AssetRequests",
                column: "RequestedDate");

            migrationBuilder.CreateIndex(
                name: "IX_AssetRequests_RequestType",
                table: "AssetRequests",
                column: "RequestType");

            migrationBuilder.CreateIndex(
                name: "IX_AssetRequests_Status",
                table: "AssetRequests",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AssetRequests");
        }
    }
}

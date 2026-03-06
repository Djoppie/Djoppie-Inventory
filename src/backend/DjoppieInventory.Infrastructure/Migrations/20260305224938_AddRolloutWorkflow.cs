using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRolloutWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RolloutSessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SessionName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    PlannedDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedBy = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    CreatedByEmail = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RolloutSessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AssetSwaps",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RolloutSessionId = table.Column<int>(type: "INTEGER", nullable: false),
                    OldAssetId = table.Column<int>(type: "INTEGER", nullable: true),
                    NewAssetId = table.Column<int>(type: "INTEGER", nullable: false),
                    TargetUser = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    TargetLocation = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    SwapDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    SwappedBy = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    SwappedByEmail = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    OldAssetNewStatus = table.Column<int>(type: "INTEGER", nullable: true),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    IsCompleted = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssetSwaps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssetSwaps_Assets_NewAssetId",
                        column: x => x.NewAssetId,
                        principalTable: "Assets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AssetSwaps_Assets_OldAssetId",
                        column: x => x.OldAssetId,
                        principalTable: "Assets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_AssetSwaps_RolloutSessions_RolloutSessionId",
                        column: x => x.RolloutSessionId,
                        principalTable: "RolloutSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RolloutItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RolloutSessionId = table.Column<int>(type: "INTEGER", nullable: false),
                    AssetId = table.Column<int>(type: "INTEGER", nullable: false),
                    TargetUser = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    TargetUserEmail = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    TargetLocation = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    TargetServiceId = table.Column<int>(type: "INTEGER", nullable: true),
                    MonitorPosition = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    MonitorDisplayNumber = table.Column<int>(type: "INTEGER", nullable: true),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CompletedBy = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    CompletedByEmail = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RolloutItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RolloutItems_Assets_AssetId",
                        column: x => x.AssetId,
                        principalTable: "Assets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RolloutItems_RolloutSessions_RolloutSessionId",
                        column: x => x.RolloutSessionId,
                        principalTable: "RolloutSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RolloutItems_Services_TargetServiceId",
                        column: x => x.TargetServiceId,
                        principalTable: "Services",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AssetSwaps_NewAssetId",
                table: "AssetSwaps",
                column: "NewAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_AssetSwaps_OldAssetId",
                table: "AssetSwaps",
                column: "OldAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_AssetSwaps_RolloutSessionId",
                table: "AssetSwaps",
                column: "RolloutSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_RolloutItems_AssetId",
                table: "RolloutItems",
                column: "AssetId");

            migrationBuilder.CreateIndex(
                name: "IX_RolloutItems_RolloutSessionId",
                table: "RolloutItems",
                column: "RolloutSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_RolloutItems_Status",
                table: "RolloutItems",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_RolloutItems_TargetServiceId",
                table: "RolloutItems",
                column: "TargetServiceId");

            migrationBuilder.CreateIndex(
                name: "IX_RolloutSessions_PlannedDate",
                table: "RolloutSessions",
                column: "PlannedDate");

            migrationBuilder.CreateIndex(
                name: "IX_RolloutSessions_Status",
                table: "RolloutSessions",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AssetSwaps");

            migrationBuilder.DropTable(
                name: "RolloutItems");

            migrationBuilder.DropTable(
                name: "RolloutSessions");
        }
    }
}

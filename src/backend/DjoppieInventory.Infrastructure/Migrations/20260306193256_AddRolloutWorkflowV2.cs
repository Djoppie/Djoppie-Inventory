using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRolloutWorkflowV2 : Migration
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
                    PlannedStartDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    PlannedEndDate = table.Column<DateTime>(type: "TEXT", nullable: true),
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
                name: "RolloutDays",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RolloutSessionId = table.Column<int>(type: "INTEGER", nullable: false),
                    Date = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    DayNumber = table.Column<int>(type: "INTEGER", nullable: false),
                    ScheduledServiceIds = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    TotalWorkplaces = table.Column<int>(type: "INTEGER", nullable: false),
                    CompletedWorkplaces = table.Column<int>(type: "INTEGER", nullable: false),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RolloutDays", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RolloutDays_RolloutSessions_RolloutSessionId",
                        column: x => x.RolloutSessionId,
                        principalTable: "RolloutSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RolloutWorkplaces",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RolloutDayId = table.Column<int>(type: "INTEGER", nullable: false),
                    UserName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    UserEmail = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Location = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    ServiceId = table.Column<int>(type: "INTEGER", nullable: true),
                    IsLaptopSetup = table.Column<bool>(type: "INTEGER", nullable: false),
                    AssetPlansJson = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    TotalItems = table.Column<int>(type: "INTEGER", nullable: false),
                    CompletedItems = table.Column<int>(type: "INTEGER", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CompletedBy = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    CompletedByEmail = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RolloutWorkplaces", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RolloutWorkplaces_RolloutDays_RolloutDayId",
                        column: x => x.RolloutDayId,
                        principalTable: "RolloutDays",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RolloutWorkplaces_Services_ServiceId",
                        column: x => x.ServiceId,
                        principalTable: "Services",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RolloutDays_Date",
                table: "RolloutDays",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_RolloutDays_RolloutSessionId",
                table: "RolloutDays",
                column: "RolloutSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_RolloutSessions_PlannedStartDate",
                table: "RolloutSessions",
                column: "PlannedStartDate");

            migrationBuilder.CreateIndex(
                name: "IX_RolloutSessions_Status",
                table: "RolloutSessions",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_RolloutWorkplaces_RolloutDayId",
                table: "RolloutWorkplaces",
                column: "RolloutDayId");

            migrationBuilder.CreateIndex(
                name: "IX_RolloutWorkplaces_ServiceId",
                table: "RolloutWorkplaces",
                column: "ServiceId");

            migrationBuilder.CreateIndex(
                name: "IX_RolloutWorkplaces_Status",
                table: "RolloutWorkplaces",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RolloutWorkplaces");

            migrationBuilder.DropTable(
                name: "RolloutDays");

            migrationBuilder.DropTable(
                name: "RolloutSessions");
        }
    }
}

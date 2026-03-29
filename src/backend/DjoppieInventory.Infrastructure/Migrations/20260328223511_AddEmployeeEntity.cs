using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEmployeeEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Disable FK checks for SQLite during table rebuild operations
            migrationBuilder.Sql("PRAGMA foreign_keys = OFF;");

            // Create Employees table first before adding FK column to Assets
            migrationBuilder.CreateTable(
                name: "Employees",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    EntraId = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    UserPrincipalName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    DisplayName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Department = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    JobTitle = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    OfficeLocation = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    MobilePhone = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    CompanyName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    ServiceId = table.Column<int>(type: "INTEGER", nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    EntraLastSyncAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    EntraSyncStatus = table.Column<int>(type: "INTEGER", nullable: false),
                    EntraSyncError = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Employees", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Employees_Services_ServiceId",
                        column: x => x.ServiceId,
                        principalTable: "Services",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            // Now add EmployeeId column to Assets (after Employees table exists)
            migrationBuilder.AddColumn<int>(
                name: "EmployeeId",
                table: "Assets",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Assets_EmployeeId",
                table: "Assets",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_Employees_DisplayName",
                table: "Employees",
                column: "DisplayName");

            migrationBuilder.CreateIndex(
                name: "IX_Employees_EntraId",
                table: "Employees",
                column: "EntraId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Employees_ServiceId",
                table: "Employees",
                column: "ServiceId");

            migrationBuilder.CreateIndex(
                name: "IX_Employees_UserPrincipalName",
                table: "Employees",
                column: "UserPrincipalName");

            migrationBuilder.AddForeignKey(
                name: "FK_Assets_Employees_EmployeeId",
                table: "Assets",
                column: "EmployeeId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            // Re-enable FK checks
            migrationBuilder.Sql("PRAGMA foreign_keys = ON;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Assets_Employees_EmployeeId",
                table: "Assets");

            migrationBuilder.DropTable(
                name: "Employees");

            migrationBuilder.DropIndex(
                name: "IX_Assets_EmployeeId",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "EmployeeId",
                table: "Assets");
        }
    }
}

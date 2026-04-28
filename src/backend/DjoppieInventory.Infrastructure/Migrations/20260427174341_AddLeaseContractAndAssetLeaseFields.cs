using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <summary>
    /// Adds the new <c>LeaseContracts</c> table (1:N model — one contract groups
    /// many assets) plus <c>LeaseContractId</c> and <c>LeaseStatus</c> on
    /// <c>Assets</c>.
    ///
    /// NOTE: column types are explicit SQL Server compatible (<c>nvarchar</c>,
    /// <c>int</c>, <c>datetime2</c>) because the migration's Designer snapshot
    /// was generated under SQLite (the dev provider). SQL Server cannot index
    /// <c>TEXT</c> columns, which would otherwise break the unique index on
    /// <c>LeaseScheduleNumber</c>. SQLite ignores <c>nvarchar(...)</c> /
    /// <c>datetime2</c> and treats them as TEXT, so this is safe across both
    /// providers. Same pattern as <c>AddAssetCodeCounter</c>.
    /// </summary>
    public partial class AddLeaseContractAndAssetLeaseFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop the legacy LeaseContracts table that was orphaned when the
            // original LeaseContract entity was removed as dead code. The new
            // 1:N schema below replaces it.
            migrationBuilder.Sql("DROP TABLE IF EXISTS LeaseContracts;");

            migrationBuilder.AddColumn<int>(
                name: "LeaseContractId",
                table: "Assets",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LeaseStatus",
                table: "Assets",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "LeaseContracts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LeaseScheduleNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    VendorName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Customer = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ContractStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    PlannedLeaseEnd = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeaseContracts", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Assets_LeaseContractId",
                table: "Assets",
                column: "LeaseContractId");

            migrationBuilder.CreateIndex(
                name: "IX_LeaseContracts_LeaseScheduleNumber",
                table: "LeaseContracts",
                column: "LeaseScheduleNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LeaseContracts_PlannedLeaseEnd",
                table: "LeaseContracts",
                column: "PlannedLeaseEnd");

            migrationBuilder.AddForeignKey(
                name: "FK_Assets_LeaseContracts_LeaseContractId",
                table: "Assets",
                column: "LeaseContractId",
                principalTable: "LeaseContracts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Assets_LeaseContracts_LeaseContractId",
                table: "Assets");

            migrationBuilder.DropTable(
                name: "LeaseContracts");

            migrationBuilder.DropIndex(
                name: "IX_Assets_LeaseContractId",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "LeaseContractId",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "LeaseStatus",
                table: "Assets");
        }
    }
}

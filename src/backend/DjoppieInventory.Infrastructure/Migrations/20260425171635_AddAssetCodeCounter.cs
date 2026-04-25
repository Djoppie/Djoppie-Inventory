using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <summary>
    /// Adds the <c>AssetCodeCounters</c> table that backs atomic asset-code
    /// generation. The legacy MAX(AssetCode)+1 approach in
    /// <c>AssetCodeGeneratorService</c> was not concurrency-safe; this counter
    /// row, updated inside a serializable transaction, eliminates the race.
    ///
    /// NOTE: the model snapshot also tracks the unrelated removal of the
    /// <c>LeaseContract</c> EF entity (intentional dead-code cleanup performed
    /// in a prior commit). The table is intentionally kept in the database
    /// per the comment in <c>ApplicationDbContext</c>; the auto-scaffolded
    /// <c>DropTable("LeaseContracts")</c> has been removed from this
    /// migration to honour that intent.
    /// </summary>
    public partial class AddAssetCodeCounter : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AssetCodeCounters",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Prefix = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    NextNumber = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssetCodeCounters", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AssetCodeCounters_Prefix",
                table: "AssetCodeCounters",
                column: "Prefix",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AssetCodeCounters");
        }
    }
}

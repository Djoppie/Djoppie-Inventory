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
            // NOTE: column types are intentionally left unspecified so each
            // EF provider picks the correct mapping. SQL Server picks
            // nvarchar(50) for Prefix (which is required because Prefix is
            // the unique-indexed key column — TEXT cannot be indexed on SQL
            // Server). SQLite picks TEXT and INTEGER as usual.
            migrationBuilder.CreateTable(
                name: "AssetCodeCounters",
                columns: table => new
                {
                    // Explicit SQL Server-compatible types because the migration's
                    // Designer snapshot was generated under SQLite (HasColumnType
                    // "TEXT") and SQL Server cannot index TEXT columns.
                    // SQLite ignores `nvarchar(...)` and treats it as TEXT
                    // anyway, so this is safe across both providers.
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Prefix = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    NextNumber = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
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

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateBuildingCodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Update building codes to shorter/cleaner versions
            migrationBuilder.Sql("UPDATE Buildings SET Code = 'PG' WHERE Code = 'POORT'");
            migrationBuilder.Sql("UPDATE Buildings SET Code = 'GH' WHERE Code = 'GHUIS'");
            migrationBuilder.Sql("UPDATE Buildings SET Code = 'BKOc' WHERE Code = 'BKOC'");
            migrationBuilder.Sql("UPDATE Buildings SET Code = 'BKOrh' WHERE Code = 'BKOR'");
            migrationBuilder.Sql("UPDATE Buildings SET Code = 'BKOlu' WHERE Code = 'BKOL'");
            migrationBuilder.Sql("UPDATE Buildings SET Code = 'BKOgs' WHERE Code = 'BKOG'");
            migrationBuilder.Sql("UPDATE Buildings SET Code = 'OClu' WHERE Code = 'OCL'");
            migrationBuilder.Sql("UPDATE Buildings SET Code = 'OCrh' WHERE Code = 'OCR'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revert to original building codes
            migrationBuilder.Sql("UPDATE Buildings SET Code = 'POORT' WHERE Code = 'PG'");
            migrationBuilder.Sql("UPDATE Buildings SET Code = 'GHUIS' WHERE Code = 'GH'");
            migrationBuilder.Sql("UPDATE Buildings SET Code = 'BKOC' WHERE Code = 'BKOc'");
            migrationBuilder.Sql("UPDATE Buildings SET Code = 'BKOR' WHERE Code = 'BKOrh'");
            migrationBuilder.Sql("UPDATE Buildings SET Code = 'BKOL' WHERE Code = 'BKOlu'");
            migrationBuilder.Sql("UPDATE Buildings SET Code = 'BKOG' WHERE Code = 'BKOgs'");
            migrationBuilder.Sql("UPDATE Buildings SET Code = 'OCL' WHERE Code = 'OClu'");
            migrationBuilder.Sql("UPDATE Buildings SET Code = 'OCR' WHERE Code = 'OCrh'");
        }
    }
}

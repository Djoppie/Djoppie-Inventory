using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ExpandServiceCodeLength : Migration
    {
        /// <summary>
        /// Expand Service.Code column from nvarchar(10) to nvarchar(50)
        /// to support Entra MG- group names (e.g., "bestuurssecretariaat", "facilitaire-ondersteuning")
        /// </summary>
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "Services",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(10)",
                oldMaxLength: 10);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "Services",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);
        }
    }
}

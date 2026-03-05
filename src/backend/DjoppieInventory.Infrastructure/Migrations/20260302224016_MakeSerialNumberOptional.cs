using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MakeSerialNumberOptional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Assets_SerialNumber",
                table: "Assets");

            migrationBuilder.AlterColumn<string>(
                name: "SerialNumber",
                table: "Assets",
                type: "TEXT",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 100);

            migrationBuilder.CreateIndex(
                name: "IX_Assets_SerialNumber",
                table: "Assets",
                column: "SerialNumber",
                unique: true,
                filter: "[SerialNumber] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Assets_SerialNumber",
                table: "Assets");

            migrationBuilder.AlterColumn<string>(
                name: "SerialNumber",
                table: "Assets",
                type: "TEXT",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Assets_SerialNumber",
                table: "Assets",
                column: "SerialNumber",
                unique: true);
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AlignTemplatesWithAssetForm : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AssetTemplates_AssetTypes_AssetTypeId",
                table: "AssetTemplates");

            migrationBuilder.AlterColumn<string>(
                name: "Category",
                table: "AssetTemplates",
                type: "TEXT",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 100);

            migrationBuilder.AddColumn<string>(
                name: "InstallationLocation",
                table: "AssetTemplates",
                type: "TEXT",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ServiceId",
                table: "AssetTemplates",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "AssetTemplates",
                type: "TEXT",
                maxLength: 50,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "AssetTemplates",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "AssetTypeId", "InstallationLocation", "ServiceId", "Status" },
                values: new object[] { 1, null, null, null });

            migrationBuilder.UpdateData(
                table: "AssetTemplates",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "AssetTypeId", "InstallationLocation", "ServiceId", "Status" },
                values: new object[] { 5, null, null, null });

            migrationBuilder.UpdateData(
                table: "AssetTemplates",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "AssetTypeId", "InstallationLocation", "ServiceId", "Status" },
                values: new object[] { 7, null, null, null });

            migrationBuilder.UpdateData(
                table: "AssetTemplates",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "AssetTypeId", "InstallationLocation", "ServiceId", "Status" },
                values: new object[] { 3, null, null, null });

            migrationBuilder.UpdateData(
                table: "AssetTemplates",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "AssetTypeId", "InstallationLocation", "ServiceId", "Status" },
                values: new object[] { 10, null, null, null });

            migrationBuilder.CreateIndex(
                name: "IX_AssetTemplates_ServiceId",
                table: "AssetTemplates",
                column: "ServiceId");

            migrationBuilder.AddForeignKey(
                name: "FK_AssetTemplates_AssetTypes_AssetTypeId",
                table: "AssetTemplates",
                column: "AssetTypeId",
                principalTable: "AssetTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_AssetTemplates_Services_ServiceId",
                table: "AssetTemplates",
                column: "ServiceId",
                principalTable: "Services",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AssetTemplates_AssetTypes_AssetTypeId",
                table: "AssetTemplates");

            migrationBuilder.DropForeignKey(
                name: "FK_AssetTemplates_Services_ServiceId",
                table: "AssetTemplates");

            migrationBuilder.DropIndex(
                name: "IX_AssetTemplates_ServiceId",
                table: "AssetTemplates");

            migrationBuilder.DropColumn(
                name: "InstallationLocation",
                table: "AssetTemplates");

            migrationBuilder.DropColumn(
                name: "ServiceId",
                table: "AssetTemplates");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "AssetTemplates");

            migrationBuilder.AlterColumn<string>(
                name: "Category",
                table: "AssetTemplates",
                type: "TEXT",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "AssetTemplates",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssetTypeId",
                value: null);

            migrationBuilder.UpdateData(
                table: "AssetTemplates",
                keyColumn: "Id",
                keyValue: 2,
                column: "AssetTypeId",
                value: null);

            migrationBuilder.UpdateData(
                table: "AssetTemplates",
                keyColumn: "Id",
                keyValue: 3,
                column: "AssetTypeId",
                value: null);

            migrationBuilder.UpdateData(
                table: "AssetTemplates",
                keyColumn: "Id",
                keyValue: 4,
                column: "AssetTypeId",
                value: null);

            migrationBuilder.UpdateData(
                table: "AssetTemplates",
                keyColumn: "Id",
                keyValue: 5,
                column: "AssetTypeId",
                value: null);

            migrationBuilder.AddForeignKey(
                name: "FK_AssetTemplates_AssetTypes_AssetTypeId",
                table: "AssetTemplates",
                column: "AssetTypeId",
                principalTable: "AssetTypes",
                principalColumn: "Id");
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPhysicalWorkplaceEquipmentSlots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DockingStationAssetId",
                table: "PhysicalWorkplaces",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "KeyboardAssetId",
                table: "PhysicalWorkplaces",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Monitor1AssetId",
                table: "PhysicalWorkplaces",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Monitor2AssetId",
                table: "PhysicalWorkplaces",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Monitor3AssetId",
                table: "PhysicalWorkplaces",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MouseAssetId",
                table: "PhysicalWorkplaces",
                type: "int",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "PhysicalWorkplaces",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "DockingStationAssetId", "KeyboardAssetId", "Monitor1AssetId", "Monitor2AssetId", "Monitor3AssetId", "MouseAssetId" },
                values: new object[] { null, null, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "PhysicalWorkplaces",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "DockingStationAssetId", "KeyboardAssetId", "Monitor1AssetId", "Monitor2AssetId", "Monitor3AssetId", "MouseAssetId" },
                values: new object[] { null, null, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "PhysicalWorkplaces",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "DockingStationAssetId", "KeyboardAssetId", "Monitor1AssetId", "Monitor2AssetId", "Monitor3AssetId", "MouseAssetId" },
                values: new object[] { null, null, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "PhysicalWorkplaces",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "DockingStationAssetId", "KeyboardAssetId", "Monitor1AssetId", "Monitor2AssetId", "Monitor3AssetId", "MouseAssetId" },
                values: new object[] { null, null, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "PhysicalWorkplaces",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "DockingStationAssetId", "KeyboardAssetId", "Monitor1AssetId", "Monitor2AssetId", "Monitor3AssetId", "MouseAssetId" },
                values: new object[] { null, null, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "PhysicalWorkplaces",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "DockingStationAssetId", "KeyboardAssetId", "Monitor1AssetId", "Monitor2AssetId", "Monitor3AssetId", "MouseAssetId" },
                values: new object[] { null, null, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "PhysicalWorkplaces",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "DockingStationAssetId", "KeyboardAssetId", "Monitor1AssetId", "Monitor2AssetId", "Monitor3AssetId", "MouseAssetId" },
                values: new object[] { null, null, null, null, null, null });

            migrationBuilder.CreateIndex(
                name: "IX_PhysicalWorkplaces_DockingStationAssetId",
                table: "PhysicalWorkplaces",
                column: "DockingStationAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_PhysicalWorkplaces_KeyboardAssetId",
                table: "PhysicalWorkplaces",
                column: "KeyboardAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_PhysicalWorkplaces_Monitor1AssetId",
                table: "PhysicalWorkplaces",
                column: "Monitor1AssetId");

            migrationBuilder.CreateIndex(
                name: "IX_PhysicalWorkplaces_Monitor2AssetId",
                table: "PhysicalWorkplaces",
                column: "Monitor2AssetId");

            migrationBuilder.CreateIndex(
                name: "IX_PhysicalWorkplaces_Monitor3AssetId",
                table: "PhysicalWorkplaces",
                column: "Monitor3AssetId");

            migrationBuilder.CreateIndex(
                name: "IX_PhysicalWorkplaces_MouseAssetId",
                table: "PhysicalWorkplaces",
                column: "MouseAssetId");

            migrationBuilder.AddForeignKey(
                name: "FK_PhysicalWorkplaces_Assets_DockingStationAssetId",
                table: "PhysicalWorkplaces",
                column: "DockingStationAssetId",
                principalTable: "Assets",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_PhysicalWorkplaces_Assets_KeyboardAssetId",
                table: "PhysicalWorkplaces",
                column: "KeyboardAssetId",
                principalTable: "Assets",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_PhysicalWorkplaces_Assets_Monitor1AssetId",
                table: "PhysicalWorkplaces",
                column: "Monitor1AssetId",
                principalTable: "Assets",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_PhysicalWorkplaces_Assets_Monitor2AssetId",
                table: "PhysicalWorkplaces",
                column: "Monitor2AssetId",
                principalTable: "Assets",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_PhysicalWorkplaces_Assets_Monitor3AssetId",
                table: "PhysicalWorkplaces",
                column: "Monitor3AssetId",
                principalTable: "Assets",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_PhysicalWorkplaces_Assets_MouseAssetId",
                table: "PhysicalWorkplaces",
                column: "MouseAssetId",
                principalTable: "Assets",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PhysicalWorkplaces_Assets_DockingStationAssetId",
                table: "PhysicalWorkplaces");

            migrationBuilder.DropForeignKey(
                name: "FK_PhysicalWorkplaces_Assets_KeyboardAssetId",
                table: "PhysicalWorkplaces");

            migrationBuilder.DropForeignKey(
                name: "FK_PhysicalWorkplaces_Assets_Monitor1AssetId",
                table: "PhysicalWorkplaces");

            migrationBuilder.DropForeignKey(
                name: "FK_PhysicalWorkplaces_Assets_Monitor2AssetId",
                table: "PhysicalWorkplaces");

            migrationBuilder.DropForeignKey(
                name: "FK_PhysicalWorkplaces_Assets_Monitor3AssetId",
                table: "PhysicalWorkplaces");

            migrationBuilder.DropForeignKey(
                name: "FK_PhysicalWorkplaces_Assets_MouseAssetId",
                table: "PhysicalWorkplaces");

            migrationBuilder.DropIndex(
                name: "IX_PhysicalWorkplaces_DockingStationAssetId",
                table: "PhysicalWorkplaces");

            migrationBuilder.DropIndex(
                name: "IX_PhysicalWorkplaces_KeyboardAssetId",
                table: "PhysicalWorkplaces");

            migrationBuilder.DropIndex(
                name: "IX_PhysicalWorkplaces_Monitor1AssetId",
                table: "PhysicalWorkplaces");

            migrationBuilder.DropIndex(
                name: "IX_PhysicalWorkplaces_Monitor2AssetId",
                table: "PhysicalWorkplaces");

            migrationBuilder.DropIndex(
                name: "IX_PhysicalWorkplaces_Monitor3AssetId",
                table: "PhysicalWorkplaces");

            migrationBuilder.DropIndex(
                name: "IX_PhysicalWorkplaces_MouseAssetId",
                table: "PhysicalWorkplaces");

            migrationBuilder.DropColumn(
                name: "DockingStationAssetId",
                table: "PhysicalWorkplaces");

            migrationBuilder.DropColumn(
                name: "KeyboardAssetId",
                table: "PhysicalWorkplaces");

            migrationBuilder.DropColumn(
                name: "Monitor1AssetId",
                table: "PhysicalWorkplaces");

            migrationBuilder.DropColumn(
                name: "Monitor2AssetId",
                table: "PhysicalWorkplaces");

            migrationBuilder.DropColumn(
                name: "Monitor3AssetId",
                table: "PhysicalWorkplaces");

            migrationBuilder.DropColumn(
                name: "MouseAssetId",
                table: "PhysicalWorkplaces");
        }
    }
}

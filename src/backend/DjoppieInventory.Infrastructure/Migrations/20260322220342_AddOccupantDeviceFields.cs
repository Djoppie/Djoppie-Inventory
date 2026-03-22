using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOccupantDeviceFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OccupantDeviceAssetCode",
                table: "PhysicalWorkplaces",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OccupantDeviceBrand",
                table: "PhysicalWorkplaces",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OccupantDeviceModel",
                table: "PhysicalWorkplaces",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OccupantDeviceSerial",
                table: "PhysicalWorkplaces",
                type: "TEXT",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "PhysicalWorkplaces",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "OccupantDeviceAssetCode", "OccupantDeviceBrand", "OccupantDeviceModel", "OccupantDeviceSerial" },
                values: new object[] { null, null, null, null });

            migrationBuilder.UpdateData(
                table: "PhysicalWorkplaces",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "OccupantDeviceAssetCode", "OccupantDeviceBrand", "OccupantDeviceModel", "OccupantDeviceSerial" },
                values: new object[] { null, null, null, null });

            migrationBuilder.UpdateData(
                table: "PhysicalWorkplaces",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "OccupantDeviceAssetCode", "OccupantDeviceBrand", "OccupantDeviceModel", "OccupantDeviceSerial" },
                values: new object[] { null, null, null, null });

            migrationBuilder.UpdateData(
                table: "PhysicalWorkplaces",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "OccupantDeviceAssetCode", "OccupantDeviceBrand", "OccupantDeviceModel", "OccupantDeviceSerial" },
                values: new object[] { null, null, null, null });

            migrationBuilder.UpdateData(
                table: "PhysicalWorkplaces",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "OccupantDeviceAssetCode", "OccupantDeviceBrand", "OccupantDeviceModel", "OccupantDeviceSerial" },
                values: new object[] { null, null, null, null });

            migrationBuilder.UpdateData(
                table: "PhysicalWorkplaces",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "OccupantDeviceAssetCode", "OccupantDeviceBrand", "OccupantDeviceModel", "OccupantDeviceSerial" },
                values: new object[] { null, null, null, null });

            migrationBuilder.UpdateData(
                table: "PhysicalWorkplaces",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "OccupantDeviceAssetCode", "OccupantDeviceBrand", "OccupantDeviceModel", "OccupantDeviceSerial" },
                values: new object[] { null, null, null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OccupantDeviceAssetCode",
                table: "PhysicalWorkplaces");

            migrationBuilder.DropColumn(
                name: "OccupantDeviceBrand",
                table: "PhysicalWorkplaces");

            migrationBuilder.DropColumn(
                name: "OccupantDeviceModel",
                table: "PhysicalWorkplaces");

            migrationBuilder.DropColumn(
                name: "OccupantDeviceSerial",
                table: "PhysicalWorkplaces");
        }
    }
}

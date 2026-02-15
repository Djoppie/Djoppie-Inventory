using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDataModelFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Department",
                table: "AssetTemplates",
                newName: "LegacyDepartment");

            migrationBuilder.RenameColumn(
                name: "Building",
                table: "AssetTemplates",
                newName: "LegacyBuilding");

            migrationBuilder.RenameColumn(
                name: "Department",
                table: "Assets",
                newName: "LegacyDepartment");

            migrationBuilder.RenameColumn(
                name: "Building",
                table: "Assets",
                newName: "LegacyBuilding");

            migrationBuilder.AddColumn<int>(
                name: "AssetTypeId",
                table: "AssetTemplates",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AssetTypeId",
                table: "Assets",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BuildingId",
                table: "Assets",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InstallationLocation",
                table: "Assets",
                type: "TEXT",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ServiceId",
                table: "Assets",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AssetEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    AssetId = table.Column<int>(type: "INTEGER", nullable: false),
                    EventType = table.Column<int>(type: "INTEGER", nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    OldValue = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    NewValue = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    PerformedBy = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    PerformedByEmail = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    EventDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssetEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssetEvents_Assets_AssetId",
                        column: x => x.AssetId,
                        principalTable: "Assets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AssetTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Code = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssetTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Buildings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Code = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Address = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Buildings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LeaseContracts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    AssetId = table.Column<int>(type: "INTEGER", nullable: false),
                    ContractNumber = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Vendor = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    StartDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    EndDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    MonthlyRate = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: true),
                    TotalValue = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: true),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeaseContracts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LeaseContracts_Assets_AssetId",
                        column: x => x.AssetId,
                        principalTable: "Assets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Sectors",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Code = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sectors", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Services",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SectorId = table.Column<int>(type: "INTEGER", nullable: true),
                    Code = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Services", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Services_Sectors_SectorId",
                        column: x => x.SectorId,
                        principalTable: "Sectors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

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

            migrationBuilder.InsertData(
                table: "AssetTypes",
                columns: new[] { "Id", "Code", "CreatedAt", "Description", "IsActive", "Name", "SortOrder", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, "LAP", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, "Laptop", 1, null },
                    { 2, "DESK", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, "Desktop", 2, null },
                    { 3, "MON", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, "Monitor", 3, null },
                    { 4, "TAB", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, "Tablet", 4, null },
                    { 5, "PRN", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, "Printer", 5, null },
                    { 6, "TEL", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, "Telefoon", 6, null },
                    { 7, "NET", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, "Netwerk", 7, null }
                });

            migrationBuilder.InsertData(
                table: "Buildings",
                columns: new[] { "Id", "Address", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, null, "DBK", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Gemeentehuis Diepenbeek", 1, null },
                    { 2, null, "WZC", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "WZC De Visserij", 2, null },
                    { 3, null, "GBS", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Gemeentelijke Basisschool", 3, null },
                    { 4, null, "PLAG", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Plaatselijk Comité", 4, null },
                    { 5, null, "BIB", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Bibliotheek", 5, null }
                });

            migrationBuilder.InsertData(
                table: "Sectors",
                columns: new[] { "Id", "Code", "CreatedAt", "IsActive", "Name", "SortOrder", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, "ORG", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Organisatie", 1, null },
                    { 2, "RUI", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Ruimte", 2, null },
                    { 3, "ZOR", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Zorg", 3, null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_AssetTemplates_AssetTypeId",
                table: "AssetTemplates",
                column: "AssetTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Assets_AssetTypeId",
                table: "Assets",
                column: "AssetTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Assets_BuildingId",
                table: "Assets",
                column: "BuildingId");

            migrationBuilder.CreateIndex(
                name: "IX_Assets_ServiceId",
                table: "Assets",
                column: "ServiceId");

            migrationBuilder.CreateIndex(
                name: "IX_AssetEvents_AssetId",
                table: "AssetEvents",
                column: "AssetId");

            migrationBuilder.CreateIndex(
                name: "IX_AssetEvents_EventDate",
                table: "AssetEvents",
                column: "EventDate");

            migrationBuilder.CreateIndex(
                name: "IX_AssetTypes_Code",
                table: "AssetTypes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Buildings_Code",
                table: "Buildings",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LeaseContracts_AssetId",
                table: "LeaseContracts",
                column: "AssetId");

            migrationBuilder.CreateIndex(
                name: "IX_LeaseContracts_EndDate",
                table: "LeaseContracts",
                column: "EndDate");

            migrationBuilder.CreateIndex(
                name: "IX_Sectors_Code",
                table: "Sectors",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Services_Code",
                table: "Services",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Services_SectorId",
                table: "Services",
                column: "SectorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Assets_AssetTypes_AssetTypeId",
                table: "Assets",
                column: "AssetTypeId",
                principalTable: "AssetTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Assets_Buildings_BuildingId",
                table: "Assets",
                column: "BuildingId",
                principalTable: "Buildings",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Assets_Services_ServiceId",
                table: "Assets",
                column: "ServiceId",
                principalTable: "Services",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_AssetTemplates_AssetTypes_AssetTypeId",
                table: "AssetTemplates",
                column: "AssetTypeId",
                principalTable: "AssetTypes",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Assets_AssetTypes_AssetTypeId",
                table: "Assets");

            migrationBuilder.DropForeignKey(
                name: "FK_Assets_Buildings_BuildingId",
                table: "Assets");

            migrationBuilder.DropForeignKey(
                name: "FK_Assets_Services_ServiceId",
                table: "Assets");

            migrationBuilder.DropForeignKey(
                name: "FK_AssetTemplates_AssetTypes_AssetTypeId",
                table: "AssetTemplates");

            migrationBuilder.DropTable(
                name: "AssetEvents");

            migrationBuilder.DropTable(
                name: "AssetTypes");

            migrationBuilder.DropTable(
                name: "Buildings");

            migrationBuilder.DropTable(
                name: "LeaseContracts");

            migrationBuilder.DropTable(
                name: "Services");

            migrationBuilder.DropTable(
                name: "Sectors");

            migrationBuilder.DropIndex(
                name: "IX_AssetTemplates_AssetTypeId",
                table: "AssetTemplates");

            migrationBuilder.DropIndex(
                name: "IX_Assets_AssetTypeId",
                table: "Assets");

            migrationBuilder.DropIndex(
                name: "IX_Assets_BuildingId",
                table: "Assets");

            migrationBuilder.DropIndex(
                name: "IX_Assets_ServiceId",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "AssetTypeId",
                table: "AssetTemplates");

            migrationBuilder.DropColumn(
                name: "AssetTypeId",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "BuildingId",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "InstallationLocation",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "ServiceId",
                table: "Assets");

            migrationBuilder.RenameColumn(
                name: "LegacyDepartment",
                table: "AssetTemplates",
                newName: "Department");

            migrationBuilder.RenameColumn(
                name: "LegacyBuilding",
                table: "AssetTemplates",
                newName: "Building");

            migrationBuilder.RenameColumn(
                name: "LegacyDepartment",
                table: "Assets",
                newName: "Department");

            migrationBuilder.RenameColumn(
                name: "LegacyBuilding",
                table: "Assets",
                newName: "Building");
        }
    }
}

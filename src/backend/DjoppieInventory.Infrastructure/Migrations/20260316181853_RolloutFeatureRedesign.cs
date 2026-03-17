using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RolloutFeatureRedesign : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BuildingId",
                table: "Services",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EntraGroupId",
                table: "Services",
                type: "TEXT",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EntraLastSyncAt",
                table: "Services",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EntraMailNickname",
                table: "Services",
                type: "TEXT",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EntraSyncEnabled",
                table: "Services",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "EntraSyncError",
                table: "Services",
                type: "TEXT",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EntraSyncStatus",
                table: "Services",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ManagerDisplayName",
                table: "Services",
                type: "TEXT",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ManagerEmail",
                table: "Services",
                type: "TEXT",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ManagerEntraId",
                table: "Services",
                type: "TEXT",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MemberCount",
                table: "Services",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "EntraGroupId",
                table: "Sectors",
                type: "TEXT",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EntraLastSyncAt",
                table: "Sectors",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EntraMailNickname",
                table: "Sectors",
                type: "TEXT",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EntraSyncEnabled",
                table: "Sectors",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "EntraSyncError",
                table: "Sectors",
                type: "TEXT",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EntraSyncStatus",
                table: "Sectors",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ManagerDisplayName",
                table: "Sectors",
                type: "TEXT",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ManagerEmail",
                table: "Sectors",
                type: "TEXT",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ManagerEntraId",
                table: "Sectors",
                type: "TEXT",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BuildingId",
                table: "RolloutWorkplaces",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserEntraId",
                table: "RolloutWorkplaces",
                type: "TEXT",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BuildingId",
                table: "Assets",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CurrentWorkplaceAssignmentId",
                table: "Assets",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LastRolloutSessionId",
                table: "Assets",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "RolloutDayServices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RolloutDayId = table.Column<int>(type: "INTEGER", nullable: false),
                    ServiceId = table.Column<int>(type: "INTEGER", nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RolloutDayServices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RolloutDayServices_RolloutDays_RolloutDayId",
                        column: x => x.RolloutDayId,
                        principalTable: "RolloutDays",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RolloutDayServices_Services_ServiceId",
                        column: x => x.ServiceId,
                        principalTable: "Services",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkplaceAssetAssignments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RolloutWorkplaceId = table.Column<int>(type: "INTEGER", nullable: false),
                    AssetTypeId = table.Column<int>(type: "INTEGER", nullable: false),
                    AssignmentCategory = table.Column<int>(type: "INTEGER", nullable: false),
                    SourceType = table.Column<int>(type: "INTEGER", nullable: false),
                    NewAssetId = table.Column<int>(type: "INTEGER", nullable: true),
                    OldAssetId = table.Column<int>(type: "INTEGER", nullable: true),
                    AssetTemplateId = table.Column<int>(type: "INTEGER", nullable: true),
                    Position = table.Column<int>(type: "INTEGER", nullable: false),
                    SerialNumberRequired = table.Column<bool>(type: "INTEGER", nullable: false),
                    QRCodeRequired = table.Column<bool>(type: "INTEGER", nullable: false),
                    SerialNumberCaptured = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    InstalledAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    InstalledBy = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    InstalledByEmail = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    MetadataJson = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkplaceAssetAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkplaceAssetAssignments_AssetTemplates_AssetTemplateId",
                        column: x => x.AssetTemplateId,
                        principalTable: "AssetTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_WorkplaceAssetAssignments_AssetTypes_AssetTypeId",
                        column: x => x.AssetTypeId,
                        principalTable: "AssetTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkplaceAssetAssignments_Assets_NewAssetId",
                        column: x => x.NewAssetId,
                        principalTable: "Assets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.NoAction);
                    table.ForeignKey(
                        name: "FK_WorkplaceAssetAssignments_Assets_OldAssetId",
                        column: x => x.OldAssetId,
                        principalTable: "Assets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.NoAction);
                    table.ForeignKey(
                        name: "FK_WorkplaceAssetAssignments_RolloutWorkplaces_RolloutWorkplaceId",
                        column: x => x.RolloutWorkplaceId,
                        principalTable: "RolloutWorkplaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RolloutAssetMovements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RolloutSessionId = table.Column<int>(type: "INTEGER", nullable: false),
                    RolloutWorkplaceId = table.Column<int>(type: "INTEGER", nullable: true),
                    WorkplaceAssetAssignmentId = table.Column<int>(type: "INTEGER", nullable: true),
                    AssetId = table.Column<int>(type: "INTEGER", nullable: false),
                    MovementType = table.Column<int>(type: "INTEGER", nullable: false),
                    PreviousStatus = table.Column<int>(type: "INTEGER", nullable: true),
                    NewStatus = table.Column<int>(type: "INTEGER", nullable: false),
                    PreviousOwner = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    NewOwner = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    PreviousServiceId = table.Column<int>(type: "INTEGER", nullable: true),
                    NewServiceId = table.Column<int>(type: "INTEGER", nullable: true),
                    PreviousLocation = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    NewLocation = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    SerialNumber = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    PerformedBy = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    PerformedByEmail = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    PerformedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RolloutAssetMovements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RolloutAssetMovements_Assets_AssetId",
                        column: x => x.AssetId,
                        principalTable: "Assets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RolloutAssetMovements_RolloutSessions_RolloutSessionId",
                        column: x => x.RolloutSessionId,
                        principalTable: "RolloutSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RolloutAssetMovements_RolloutWorkplaces_RolloutWorkplaceId",
                        column: x => x.RolloutWorkplaceId,
                        principalTable: "RolloutWorkplaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_RolloutAssetMovements_Services_NewServiceId",
                        column: x => x.NewServiceId,
                        principalTable: "Services",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_RolloutAssetMovements_Services_PreviousServiceId",
                        column: x => x.PreviousServiceId,
                        principalTable: "Services",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_RolloutAssetMovements_WorkplaceAssetAssignments_WorkplaceAssetAssignmentId",
                        column: x => x.WorkplaceAssetAssignmentId,
                        principalTable: "WorkplaceAssetAssignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.UpdateData(
                table: "Sectors",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "EntraGroupId", "EntraLastSyncAt", "EntraMailNickname", "EntraSyncEnabled", "EntraSyncError", "EntraSyncStatus", "ManagerDisplayName", "ManagerEmail", "ManagerEntraId" },
                values: new object[] { null, null, null, false, null, 0, null, null, null });

            migrationBuilder.UpdateData(
                table: "Sectors",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "EntraGroupId", "EntraLastSyncAt", "EntraMailNickname", "EntraSyncEnabled", "EntraSyncError", "EntraSyncStatus", "ManagerDisplayName", "ManagerEmail", "ManagerEntraId" },
                values: new object[] { null, null, null, false, null, 0, null, null, null });

            migrationBuilder.UpdateData(
                table: "Sectors",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "EntraGroupId", "EntraLastSyncAt", "EntraMailNickname", "EntraSyncEnabled", "EntraSyncError", "EntraSyncStatus", "ManagerDisplayName", "ManagerEmail", "ManagerEntraId" },
                values: new object[] { null, null, null, false, null, 0, null, null, null });

            migrationBuilder.UpdateData(
                table: "Sectors",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "EntraGroupId", "EntraLastSyncAt", "EntraMailNickname", "EntraSyncEnabled", "EntraSyncError", "EntraSyncStatus", "ManagerDisplayName", "ManagerEmail", "ManagerEntraId" },
                values: new object[] { null, null, null, false, null, 0, null, null, null });

            migrationBuilder.UpdateData(
                table: "Sectors",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "EntraGroupId", "EntraLastSyncAt", "EntraMailNickname", "EntraSyncEnabled", "EntraSyncError", "EntraSyncStatus", "ManagerDisplayName", "ManagerEmail", "ManagerEntraId" },
                values: new object[] { null, null, null, false, null, 0, null, null, null });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "BuildingId", "EntraGroupId", "EntraLastSyncAt", "EntraMailNickname", "EntraSyncEnabled", "EntraSyncError", "EntraSyncStatus", "ManagerDisplayName", "ManagerEmail", "ManagerEntraId", "MemberCount" },
                values: new object[] { null, null, null, null, false, null, 0, null, null, null, 0 });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "BuildingId", "EntraGroupId", "EntraLastSyncAt", "EntraMailNickname", "EntraSyncEnabled", "EntraSyncError", "EntraSyncStatus", "ManagerDisplayName", "ManagerEmail", "ManagerEntraId", "MemberCount" },
                values: new object[] { null, null, null, null, false, null, 0, null, null, null, 0 });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "BuildingId", "EntraGroupId", "EntraLastSyncAt", "EntraMailNickname", "EntraSyncEnabled", "EntraSyncError", "EntraSyncStatus", "ManagerDisplayName", "ManagerEmail", "ManagerEntraId", "MemberCount" },
                values: new object[] { null, null, null, null, false, null, 0, null, null, null, 0 });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "BuildingId", "EntraGroupId", "EntraLastSyncAt", "EntraMailNickname", "EntraSyncEnabled", "EntraSyncError", "EntraSyncStatus", "ManagerDisplayName", "ManagerEmail", "ManagerEntraId", "MemberCount" },
                values: new object[] { null, null, null, null, false, null, 0, null, null, null, 0 });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "BuildingId", "EntraGroupId", "EntraLastSyncAt", "EntraMailNickname", "EntraSyncEnabled", "EntraSyncError", "EntraSyncStatus", "ManagerDisplayName", "ManagerEmail", "ManagerEntraId", "MemberCount" },
                values: new object[] { null, null, null, null, false, null, 0, null, null, null, 0 });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "BuildingId", "EntraGroupId", "EntraLastSyncAt", "EntraMailNickname", "EntraSyncEnabled", "EntraSyncError", "EntraSyncStatus", "ManagerDisplayName", "ManagerEmail", "ManagerEntraId", "MemberCount" },
                values: new object[] { null, null, null, null, false, null, 0, null, null, null, 0 });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "BuildingId", "EntraGroupId", "EntraLastSyncAt", "EntraMailNickname", "EntraSyncEnabled", "EntraSyncError", "EntraSyncStatus", "ManagerDisplayName", "ManagerEmail", "ManagerEntraId", "MemberCount" },
                values: new object[] { null, null, null, null, false, null, 0, null, null, null, 0 });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "BuildingId", "EntraGroupId", "EntraLastSyncAt", "EntraMailNickname", "EntraSyncEnabled", "EntraSyncError", "EntraSyncStatus", "ManagerDisplayName", "ManagerEmail", "ManagerEntraId", "MemberCount" },
                values: new object[] { null, null, null, null, false, null, 0, null, null, null, 0 });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "BuildingId", "EntraGroupId", "EntraLastSyncAt", "EntraMailNickname", "EntraSyncEnabled", "EntraSyncError", "EntraSyncStatus", "ManagerDisplayName", "ManagerEmail", "ManagerEntraId", "MemberCount" },
                values: new object[] { null, null, null, null, false, null, 0, null, null, null, 0 });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "BuildingId", "EntraGroupId", "EntraLastSyncAt", "EntraMailNickname", "EntraSyncEnabled", "EntraSyncError", "EntraSyncStatus", "ManagerDisplayName", "ManagerEmail", "ManagerEntraId", "MemberCount" },
                values: new object[] { null, null, null, null, false, null, 0, null, null, null, 0 });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 11,
                columns: new[] { "BuildingId", "EntraGroupId", "EntraLastSyncAt", "EntraMailNickname", "EntraSyncEnabled", "EntraSyncError", "EntraSyncStatus", "ManagerDisplayName", "ManagerEmail", "ManagerEntraId", "MemberCount" },
                values: new object[] { null, null, null, null, false, null, 0, null, null, null, 0 });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "BuildingId", "EntraGroupId", "EntraLastSyncAt", "EntraMailNickname", "EntraSyncEnabled", "EntraSyncError", "EntraSyncStatus", "ManagerDisplayName", "ManagerEmail", "ManagerEntraId", "MemberCount" },
                values: new object[] { null, null, null, null, false, null, 0, null, null, null, 0 });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 13,
                columns: new[] { "BuildingId", "EntraGroupId", "EntraLastSyncAt", "EntraMailNickname", "EntraSyncEnabled", "EntraSyncError", "EntraSyncStatus", "ManagerDisplayName", "ManagerEmail", "ManagerEntraId", "MemberCount" },
                values: new object[] { null, null, null, null, false, null, 0, null, null, null, 0 });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 14,
                columns: new[] { "BuildingId", "EntraGroupId", "EntraLastSyncAt", "EntraMailNickname", "EntraSyncEnabled", "EntraSyncError", "EntraSyncStatus", "ManagerDisplayName", "ManagerEmail", "ManagerEntraId", "MemberCount" },
                values: new object[] { null, null, null, null, false, null, 0, null, null, null, 0 });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 15,
                columns: new[] { "BuildingId", "EntraGroupId", "EntraLastSyncAt", "EntraMailNickname", "EntraSyncEnabled", "EntraSyncError", "EntraSyncStatus", "ManagerDisplayName", "ManagerEmail", "ManagerEntraId", "MemberCount" },
                values: new object[] { null, null, null, null, false, null, 0, null, null, null, 0 });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 16,
                columns: new[] { "BuildingId", "EntraGroupId", "EntraLastSyncAt", "EntraMailNickname", "EntraSyncEnabled", "EntraSyncError", "EntraSyncStatus", "ManagerDisplayName", "ManagerEmail", "ManagerEntraId", "MemberCount" },
                values: new object[] { null, null, null, null, false, null, 0, null, null, null, 0 });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 17,
                columns: new[] { "BuildingId", "EntraGroupId", "EntraLastSyncAt", "EntraMailNickname", "EntraSyncEnabled", "EntraSyncError", "EntraSyncStatus", "ManagerDisplayName", "ManagerEmail", "ManagerEntraId", "MemberCount" },
                values: new object[] { null, null, null, null, false, null, 0, null, null, null, 0 });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 18,
                columns: new[] { "BuildingId", "EntraGroupId", "EntraLastSyncAt", "EntraMailNickname", "EntraSyncEnabled", "EntraSyncError", "EntraSyncStatus", "ManagerDisplayName", "ManagerEmail", "ManagerEntraId", "MemberCount" },
                values: new object[] { null, null, null, null, false, null, 0, null, null, null, 0 });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 19,
                columns: new[] { "BuildingId", "EntraGroupId", "EntraLastSyncAt", "EntraMailNickname", "EntraSyncEnabled", "EntraSyncError", "EntraSyncStatus", "ManagerDisplayName", "ManagerEmail", "ManagerEntraId", "MemberCount" },
                values: new object[] { null, null, null, null, false, null, 0, null, null, null, 0 });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 20,
                columns: new[] { "BuildingId", "EntraGroupId", "EntraLastSyncAt", "EntraMailNickname", "EntraSyncEnabled", "EntraSyncError", "EntraSyncStatus", "ManagerDisplayName", "ManagerEmail", "ManagerEntraId", "MemberCount" },
                values: new object[] { null, null, null, null, false, null, 0, null, null, null, 0 });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: 21,
                columns: new[] { "BuildingId", "EntraGroupId", "EntraLastSyncAt", "EntraMailNickname", "EntraSyncEnabled", "EntraSyncError", "EntraSyncStatus", "ManagerDisplayName", "ManagerEmail", "ManagerEntraId", "MemberCount" },
                values: new object[] { null, null, null, null, false, null, 0, null, null, null, 0 });

            migrationBuilder.CreateIndex(
                name: "IX_Services_BuildingId",
                table: "Services",
                column: "BuildingId");

            migrationBuilder.CreateIndex(
                name: "IX_RolloutWorkplaces_BuildingId",
                table: "RolloutWorkplaces",
                column: "BuildingId");

            migrationBuilder.CreateIndex(
                name: "IX_Assets_BuildingId",
                table: "Assets",
                column: "BuildingId");

            migrationBuilder.CreateIndex(
                name: "IX_Assets_CurrentWorkplaceAssignmentId",
                table: "Assets",
                column: "CurrentWorkplaceAssignmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Assets_LastRolloutSessionId",
                table: "Assets",
                column: "LastRolloutSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_RolloutAssetMovements_AssetId",
                table: "RolloutAssetMovements",
                column: "AssetId");

            migrationBuilder.CreateIndex(
                name: "IX_RolloutAssetMovements_MovementType",
                table: "RolloutAssetMovements",
                column: "MovementType");

            migrationBuilder.CreateIndex(
                name: "IX_RolloutAssetMovements_NewServiceId",
                table: "RolloutAssetMovements",
                column: "NewServiceId");

            migrationBuilder.CreateIndex(
                name: "IX_RolloutAssetMovements_PerformedAt",
                table: "RolloutAssetMovements",
                column: "PerformedAt");

            migrationBuilder.CreateIndex(
                name: "IX_RolloutAssetMovements_PreviousServiceId",
                table: "RolloutAssetMovements",
                column: "PreviousServiceId");

            migrationBuilder.CreateIndex(
                name: "IX_RolloutAssetMovements_RolloutSessionId",
                table: "RolloutAssetMovements",
                column: "RolloutSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_RolloutAssetMovements_RolloutWorkplaceId",
                table: "RolloutAssetMovements",
                column: "RolloutWorkplaceId");

            migrationBuilder.CreateIndex(
                name: "IX_RolloutAssetMovements_WorkplaceAssetAssignmentId",
                table: "RolloutAssetMovements",
                column: "WorkplaceAssetAssignmentId");

            migrationBuilder.CreateIndex(
                name: "IX_RolloutDayServices_RolloutDayId",
                table: "RolloutDayServices",
                column: "RolloutDayId");

            migrationBuilder.CreateIndex(
                name: "IX_RolloutDayServices_RolloutDayId_ServiceId",
                table: "RolloutDayServices",
                columns: new[] { "RolloutDayId", "ServiceId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RolloutDayServices_ServiceId",
                table: "RolloutDayServices",
                column: "ServiceId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkplaceAssetAssignments_AssetTemplateId",
                table: "WorkplaceAssetAssignments",
                column: "AssetTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkplaceAssetAssignments_AssetTypeId",
                table: "WorkplaceAssetAssignments",
                column: "AssetTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkplaceAssetAssignments_NewAssetId",
                table: "WorkplaceAssetAssignments",
                column: "NewAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkplaceAssetAssignments_OldAssetId",
                table: "WorkplaceAssetAssignments",
                column: "OldAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkplaceAssetAssignments_RolloutWorkplaceId",
                table: "WorkplaceAssetAssignments",
                column: "RolloutWorkplaceId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkplaceAssetAssignments_Status",
                table: "WorkplaceAssetAssignments",
                column: "Status");

            migrationBuilder.AddForeignKey(
                name: "FK_Assets_Buildings_BuildingId",
                table: "Assets",
                column: "BuildingId",
                principalTable: "Buildings",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Assets_RolloutSessions_LastRolloutSessionId",
                table: "Assets",
                column: "LastRolloutSessionId",
                principalTable: "RolloutSessions",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Assets_WorkplaceAssetAssignments_CurrentWorkplaceAssignmentId",
                table: "Assets",
                column: "CurrentWorkplaceAssignmentId",
                principalTable: "WorkplaceAssetAssignments",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_RolloutWorkplaces_Buildings_BuildingId",
                table: "RolloutWorkplaces",
                column: "BuildingId",
                principalTable: "Buildings",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Services_Buildings_BuildingId",
                table: "Services",
                column: "BuildingId",
                principalTable: "Buildings",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Assets_Buildings_BuildingId",
                table: "Assets");

            migrationBuilder.DropForeignKey(
                name: "FK_Assets_RolloutSessions_LastRolloutSessionId",
                table: "Assets");

            migrationBuilder.DropForeignKey(
                name: "FK_Assets_WorkplaceAssetAssignments_CurrentWorkplaceAssignmentId",
                table: "Assets");

            migrationBuilder.DropForeignKey(
                name: "FK_RolloutWorkplaces_Buildings_BuildingId",
                table: "RolloutWorkplaces");

            migrationBuilder.DropForeignKey(
                name: "FK_Services_Buildings_BuildingId",
                table: "Services");

            migrationBuilder.DropTable(
                name: "RolloutAssetMovements");

            migrationBuilder.DropTable(
                name: "RolloutDayServices");

            migrationBuilder.DropTable(
                name: "WorkplaceAssetAssignments");

            migrationBuilder.DropIndex(
                name: "IX_Services_BuildingId",
                table: "Services");

            migrationBuilder.DropIndex(
                name: "IX_RolloutWorkplaces_BuildingId",
                table: "RolloutWorkplaces");

            migrationBuilder.DropIndex(
                name: "IX_Assets_BuildingId",
                table: "Assets");

            migrationBuilder.DropIndex(
                name: "IX_Assets_CurrentWorkplaceAssignmentId",
                table: "Assets");

            migrationBuilder.DropIndex(
                name: "IX_Assets_LastRolloutSessionId",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "BuildingId",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "EntraGroupId",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "EntraLastSyncAt",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "EntraMailNickname",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "EntraSyncEnabled",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "EntraSyncError",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "EntraSyncStatus",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "ManagerDisplayName",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "ManagerEmail",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "ManagerEntraId",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "MemberCount",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "EntraGroupId",
                table: "Sectors");

            migrationBuilder.DropColumn(
                name: "EntraLastSyncAt",
                table: "Sectors");

            migrationBuilder.DropColumn(
                name: "EntraMailNickname",
                table: "Sectors");

            migrationBuilder.DropColumn(
                name: "EntraSyncEnabled",
                table: "Sectors");

            migrationBuilder.DropColumn(
                name: "EntraSyncError",
                table: "Sectors");

            migrationBuilder.DropColumn(
                name: "EntraSyncStatus",
                table: "Sectors");

            migrationBuilder.DropColumn(
                name: "ManagerDisplayName",
                table: "Sectors");

            migrationBuilder.DropColumn(
                name: "ManagerEmail",
                table: "Sectors");

            migrationBuilder.DropColumn(
                name: "ManagerEntraId",
                table: "Sectors");

            migrationBuilder.DropColumn(
                name: "BuildingId",
                table: "RolloutWorkplaces");

            migrationBuilder.DropColumn(
                name: "UserEntraId",
                table: "RolloutWorkplaces");

            migrationBuilder.DropColumn(
                name: "BuildingId",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "CurrentWorkplaceAssignmentId",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "LastRolloutSessionId",
                table: "Assets");
        }
    }
}

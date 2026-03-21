using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DjoppieInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedBuildingsAndWorkplaces : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add missing buildings needed for workplace import
            // Using INSERT ... WHERE NOT EXISTS for idempotency

            // For SQLite
            if (migrationBuilder.ActiveProvider == "Microsoft.EntityFrameworkCore.Sqlite")
            {
                migrationBuilder.Sql(@"
                    INSERT OR IGNORE INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                    VALUES ('BIB', 'Bibliotheek Diepenbeek', 'Gemeenteplein', 30, 1, '2025-01-01 00:00:00');
                    INSERT OR IGNORE INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                    VALUES ('BIBrh', 'Bibliotheek Rooierheide', 'Rooierheide', 31, 1, '2025-01-01 00:00:00');
                    INSERT OR IGNORE INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                    VALUES ('BIBlu', 'Bibliotheek Lutselus', 'Lutselus', 32, 1, '2025-01-01 00:00:00');
                    INSERT OR IGNORE INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                    VALUES ('DS', 'Sportcomplex Demerstrand', 'Demerstrand', 33, 1, '2025-01-01 00:00:00');
                    INSERT OR IGNORE INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                    VALUES ('GTD', 'Gemeentelijke Technische Dienst', 'Technische Dienst', 34, 1, '2025-01-01 00:00:00');
                    INSERT OR IGNORE INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                    VALUES ('GBS', 'Gemeentelijke Basisschool', 'Schoolstraat', 35, 1, '2025-01-01 00:00:00');
                    INSERT OR IGNORE INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                    VALUES ('BKOdl', 'Buitenschoolse kinderopvang DeLoep', 'DeLoep', 36, 1, '2025-01-01 00:00:00');
                ");
            }
            else // SQL Server
            {
                migrationBuilder.Sql(@"
                    IF NOT EXISTS (SELECT 1 FROM Buildings WHERE Code = 'BIB')
                        INSERT INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                        VALUES ('BIB', 'Bibliotheek Diepenbeek', 'Gemeenteplein', 30, 1, '2025-01-01');
                    IF NOT EXISTS (SELECT 1 FROM Buildings WHERE Code = 'BIBrh')
                        INSERT INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                        VALUES ('BIBrh', 'Bibliotheek Rooierheide', 'Rooierheide', 31, 1, '2025-01-01');
                    IF NOT EXISTS (SELECT 1 FROM Buildings WHERE Code = 'BIBlu')
                        INSERT INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                        VALUES ('BIBlu', 'Bibliotheek Lutselus', 'Lutselus', 32, 1, '2025-01-01');
                    IF NOT EXISTS (SELECT 1 FROM Buildings WHERE Code = 'DS')
                        INSERT INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                        VALUES ('DS', 'Sportcomplex Demerstrand', 'Demerstrand', 33, 1, '2025-01-01');
                    IF NOT EXISTS (SELECT 1 FROM Buildings WHERE Code = 'GTD')
                        INSERT INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                        VALUES ('GTD', 'Gemeentelijke Technische Dienst', 'Technische Dienst', 34, 1, '2025-01-01');
                    IF NOT EXISTS (SELECT 1 FROM Buildings WHERE Code = 'GBS')
                        INSERT INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                        VALUES ('GBS', 'Gemeentelijke Basisschool', 'Schoolstraat', 35, 1, '2025-01-01');
                    IF NOT EXISTS (SELECT 1 FROM Buildings WHERE Code = 'BKOdl')
                        INSERT INTO Buildings (Code, Name, Address, SortOrder, IsActive, CreatedAt)
                        VALUES ('BKOdl', 'Buitenschoolse kinderopvang DeLoep', 'DeLoep', 36, 1, '2025-01-01');
                ");
            }

            // Fix service codes for compatibility with CSV import
            migrationBuilder.Sql("UPDATE Services SET Code = 'FIN' WHERE Code = 'FINZ';");
            migrationBuilder.Sql("UPDATE Services SET Code = 'BZ' WHERE Code = 'BURG';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Restore original service codes
            migrationBuilder.Sql("UPDATE Services SET Code = 'FINZ' WHERE Code = 'FIN';");
            migrationBuilder.Sql("UPDATE Services SET Code = 'BURG' WHERE Code = 'BZ';");

            // Remove added buildings
            migrationBuilder.Sql("DELETE FROM Buildings WHERE Code IN ('BIB', 'BIBrh', 'BIBlu', 'DS', 'GTD', 'GBS', 'BKOdl');");
        }
    }
}

/* =====================================================================
   Azure SQL - Reset and Seed Reference Tables
   =====================================================================
   Auteur:      Jo Wijnen
   Datum:       2026-02-17
   Database:    sqldb-djoppie-inventory-dev

   Doel:
   - Leegmaken en opnieuw vullen van referentietabellen
   - Azure SQL compatibel (geen SQLite-specifieke functies)
   - Veilige handling van foreign keys en identity columns

   Tabellen:
   - dbo.Buildings        (17 records: 5 hoofdlocaties + 12 satellieten)
   - dbo.Categories       (6 records: COMP, WORK, PERIPH, NET, MOBILE, AV)
   - dbo.LeaseContracts   (wordt leeggemaakt - geen seed data)
   - dbo.Sectors          (5 records: ORG, FIN, RUI, MENS, ZORG)
   - dbo.Services         (38 records: 25 actief, 13 inactief - Entra MG- groepen)

   WAARSCHUWING:
   - Dit script verwijdert ALLE data uit bovenstaande tabellen
   - AssetTypes wordt NIET gereset (heeft FK naar Categories)
   - Assets en LeaseContracts worden NIET gereset (transactionele data)
   - Maak een backup voordat je dit script uitvoert

   Gebruik:
   1. Via Azure Portal Query Editor
   2. Via Azure Data Studio / SQL Server Management Studio
   3. Via sqlcmd: sqlcmd -S <server>.database.windows.net -d sqldb-djoppie-inventory-dev -U <user> -P <password> -i reset-and-seed-reference-tables.sql
   ===================================================================== */

SET NOCOUNT ON;
SET XACT_ABORT ON; -- Auto-rollback bij fouten

PRINT '========================================';
PRINT 'Azure SQL - Reset Reference Tables';
PRINT 'Database: ' + DB_NAME();
PRINT 'Started: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================';
PRINT '';

BEGIN TRY
    BEGIN TRANSACTION;

    /* ---------------------------------------------------------------
       STAP 1: Foreign Keys tijdelijk uitschakelen

       We schakelen alleen FK's uit voor de tabellen die we gaan resetten.
       Dit voorkomt dat we AssetTypes of Assets hoeven aan te passen.
       --------------------------------------------------------------- */

    PRINT 'STAP 1: Foreign keys uitschakelen...';

    -- FK's die verwijzen naar Services (vanuit Assets en AssetTemplates)
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Assets_Services_ServiceId')
        ALTER TABLE dbo.Assets NOCHECK CONSTRAINT FK_Assets_Services_ServiceId;

    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_AssetTemplates_Services_ServiceId')
        ALTER TABLE dbo.AssetTemplates NOCHECK CONSTRAINT FK_AssetTemplates_Services_ServiceId;

    -- FK's die verwijzen naar Categories (vanuit AssetTypes)
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_AssetTypes_Categories_CategoryId')
        ALTER TABLE dbo.AssetTypes NOCHECK CONSTRAINT FK_AssetTypes_Categories_CategoryId;

    -- FK's binnen de Services tabel (naar Sectors)
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Services_Sectors_SectorId')
        ALTER TABLE dbo.Services NOCHECK CONSTRAINT FK_Services_Sectors_SectorId;

    PRINT '  - Foreign keys uitgeschakeld';
    PRINT '';

    /* ---------------------------------------------------------------
       STAP 2: Data verwijderen (child -> parent volgorde)

       Volgorde is kritiek om FK violations te voorkomen:
       1. LeaseContracts (hangt af van Assets)
       2. Services (hangt af van Sectors)
       3. Sectors (parent)
       4. Categories (parent)
       5. Buildings (parent)
       --------------------------------------------------------------- */

    PRINT 'STAP 2: Data verwijderen...';

    -- LeaseContracts (child van Assets - maar we clearen ze wel)
    DELETE FROM dbo.LeaseContracts;
    PRINT '  - LeaseContracts: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' rijen verwijderd';

    -- Services (child van Sectors)
    DELETE FROM dbo.Services;
    PRINT '  - Services: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' rijen verwijderd';

    -- Sectors (parent)
    DELETE FROM dbo.Sectors;
    PRINT '  - Sectors: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' rijen verwijderd';

    -- Categories (parent)
    DELETE FROM dbo.Categories;
    PRINT '  - Categories: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' rijen verwijderd';

    -- Buildings (parent)
    DELETE FROM dbo.Buildings;
    PRINT '  - Buildings: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' rijen verwijderd';

    PRINT '';

    /* ---------------------------------------------------------------
       STAP 3: Identity seeds resetten

       DBCC CHECKIDENT reset de auto-increment counters.
       RESEED zorgt ervoor dat volgende insert vanaf Id=1 begint.
       --------------------------------------------------------------- */

    PRINT 'STAP 3: Identity seeds resetten...';

    DBCC CHECKIDENT ('dbo.LeaseContracts', RESEED, 0);
    DBCC CHECKIDENT ('dbo.Services', RESEED, 0);
    DBCC CHECKIDENT ('dbo.Sectors', RESEED, 0);
    DBCC CHECKIDENT ('dbo.Categories', RESEED, 0);
    DBCC CHECKIDENT ('dbo.Buildings', RESEED, 0);

    PRINT '  - Identity seeds gereset naar 0';
    PRINT '';

    /* ---------------------------------------------------------------
       STAP 4: Seed data invoegen (parent -> child volgorde)

       We gebruiken IDENTITY_INSERT om expliciete Id-waarden in te voegen.
       Dit is nodig omdat andere tabellen (AssetTypes, Assets) naar deze
       Id's verwijzen via FK's.
       --------------------------------------------------------------- */

    PRINT 'STAP 4: Seed data invoegen...';
    PRINT '';

    /* --- CATEGORIES --- */
    PRINT '  Invoegen: Categories (6 records)...';

    SET IDENTITY_INSERT dbo.Categories ON;

    INSERT INTO dbo.Categories (Id, Code, Name, Description, SortOrder, IsActive, CreatedAt)
    VALUES
        (1, 'COMP', 'Computing', 'Computers en rekenkracht', 1, 1, '2025-01-01 00:00:00'),
        (2, 'WORK', 'Werkplek', 'Werkplekaccessoires en randapparatuur', 2, 1, '2025-01-01 00:00:00'),
        (3, 'PERIPH', 'Peripherals', 'Printers, scanners en andere randapparatuur', 3, 1, '2025-01-01 00:00:00'),
        (4, 'NET', 'Networking', 'Netwerkapparatuur', 4, 1, '2025-01-01 00:00:00'),
        (5, 'MOBILE', 'Mobile', 'Mobiele apparaten', 5, 1, '2025-01-01 00:00:00'),
        (6, 'AV', 'Audio/Video', 'Audio- en videoapparatuur', 6, 1, '2025-01-01 00:00:00');

    SET IDENTITY_INSERT dbo.Categories OFF;

    PRINT '    - ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' categories toegevoegd';

    /* --- BUILDINGS --- */
    PRINT '  Invoegen: Buildings (17 records: 5 hoofdlocaties + 12 satellieten)...';

    SET IDENTITY_INSERT dbo.Buildings ON;

    INSERT INTO dbo.Buildings (Id, Code, Name, Address, SortOrder, IsActive, CreatedAt)
    VALUES
        -- 5 Hoofdlocaties
        (1, 'POORT', 'Het Poortgebouw', 'Dienst IT, Aankoopdienst, Grondgebiedzaken', 1, 1, '2025-01-01 00:00:00'),
        (2, 'GHUIS', 'Het Gemeentehuis', 'Algemeen directeur, Financien, Burgerzaken', 2, 1, '2025-01-01 00:00:00'),
        (3, 'PLAK', 'De Plak', 'Sector Mens', 3, 1, '2025-01-01 00:00:00'),
        (4, 'WZC', 'Het Woonzorgcentrum', NULL, 4, 1, '2025-01-01 00:00:00'),
        (5, 'DEMER', 'Sportcomplex Demerstrand', 'Sport en recreatie', 5, 1, '2025-01-01 00:00:00'),

        -- 12 Sateliet locaties
        (6, 'BKOC', 'Buitenschoolse kinderopvang centrum', NULL, 10, 1, '2025-01-01 00:00:00'),
        (7, 'BKOR', 'Buitenschoolse kinderopvang Rooierheide', NULL, 11, 1, '2025-01-01 00:00:00'),
        (8, 'BKOL', 'Buitenschoolse kinderopvang Lutselus', NULL, 12, 1, '2025-01-01 00:00:00'),
        (9, 'BKOG', 'Buitenschoolse kinderopvang gemeenteschool', NULL, 13, 1, '2025-01-01 00:00:00'),
        (10, 'OCL', 'Ontmoetingscentrum Lutselus', NULL, 14, 1, '2025-01-01 00:00:00'),
        (11, 'OCR', 'Ontmoetingscentrum Rooierheide', NULL, 15, 1, '2025-01-01 00:00:00'),
        (12, 'GILDE', 'Gildezaal', NULL, 16, 1, '2025-01-01 00:00:00'),
        (13, 'KEI', 'Zaal de Kei', NULL, 17, 1, '2025-01-01 00:00:00'),
        (14, 'TERL', 'Zaal Terloght', NULL, 18, 1, '2025-01-01 00:00:00'),
        (15, 'HEIZ', 'Jeugdhuis Heizoe', NULL, 19, 1, '2025-01-01 00:00:00'),
        (16, 'SENH', 'Seniorenhuis', NULL, 20, 1, '2025-01-01 00:00:00'),
        (17, 'ROZEN', 'School Rozendaal', NULL, 21, 1, '2025-01-01 00:00:00');

    SET IDENTITY_INSERT dbo.Buildings OFF;

    PRINT '    - ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' buildings toegevoegd';

    /* --- SECTORS --- */
    PRINT '  Invoegen: Sectors (5 records)...';

    SET IDENTITY_INSERT dbo.Sectors ON;

    INSERT INTO dbo.Sectors (Id, Code, Name, SortOrder, IsActive, CreatedAt)
    VALUES
        (1, 'ORG', 'Organisatie', 1, 1, '2025-01-01 00:00:00'),
        (2, 'FIN', 'Financien', 2, 1, '2025-01-01 00:00:00'),
        (3, 'RUI', 'Ruimte', 3, 1, '2025-01-01 00:00:00'),
        (4, 'MENS', 'Mens', 4, 1, '2025-01-01 00:00:00'),
        (5, 'ZORG', 'Zorg', 5, 1, '2025-01-01 00:00:00');

    SET IDENTITY_INSERT dbo.Sectors OFF;

    PRINT '    - ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' sectors toegevoegd';

    /* --- SERVICES --- */
    /* Codes komen overeen met MG- groepen in Microsoft Entra ID */
    PRINT '  Invoegen: Services (38 records: 25 actief, 13 inactief)...';

    SET IDENTITY_INSERT dbo.Services ON;

    INSERT INTO dbo.Services (Id, Code, Name, SectorId, SortOrder, IsActive, CreatedAt)
    VALUES
        -- Sector Organisatie (Id = 1) - MG-SECTOR-organisatie
        (1,  'bestuurssecretariaat',      'Bestuurssecretariaat',                    1,  1, 1, '2025-01-01 00:00:00'),
        (2,  'communicatie',              'Communicatie',                            1,  2, 1, '2025-01-01 00:00:00'),
        (3,  'IT',                        'IT',                                      1,  3, 1, '2025-01-01 00:00:00'),
        (4,  'organisatiebeheersing',     'Organisatiebeheersing',                   1,  4, 1, '2025-01-01 00:00:00'),
        (5,  'HR',                        'HR',                                      1,  5, 1, '2025-01-01 00:00:00'),
        (6,  'preventie',                 'Preventie',                               1,  6, 1, '2025-01-01 00:00:00'),
        -- Bestuurlijke groepen (inactief - geen assets)
        (23, 'college',                   'College van Burgemeester en Schepenen',   1, 23, 0, '2025-01-01 00:00:00'),
        (24, 'gemeenteraad',              'Gemeenteraad',                            1, 24, 0, '2025-01-01 00:00:00'),
        (25, 'managementteam',            'Managementteam',                          1, 25, 0, '2025-01-01 00:00:00'),
        (26, 'sectormanager',             'Sectormanagers',                          1, 26, 0, '2025-01-01 00:00:00'),
        (27, 'iedereenpersoneel',         'Iedereen Personeel',                      1, 27, 0, '2025-01-01 00:00:00'),

        -- Sector Financien (Id = 2)
        (7,  'aankopen',                  'Aankopen',                                2,  7, 1, '2025-01-01 00:00:00'),
        (8,  'financien',                 'Financien',                               2,  8, 1, '2025-01-01 00:00:00'),

        -- Sector Ruimte (Id = 3) - MG-SECTOR-ruimte
        (9,  'ruimte',                    'Ruimte',                                  3,  9, 1, '2025-01-01 00:00:00'),
        (10, 'infrastructuur',            'Infrastructuur',                          3, 10, 1, '2025-01-01 00:00:00'),
        (11, 'facilitaire-ondersteuning', 'Facilitaire Ondersteuning',               3, 11, 1, '2025-01-01 00:00:00'),
        (12, 'openbaardomein',            'Openbaar Domein',                         3, 12, 1, '2025-01-01 00:00:00'),
        (28, 'poetspool',                 'Poetspool',                               3, 28, 1, '2025-01-01 00:00:00'),
        (29, 'deplak',                    'De Plak (Facilitair)',                    3, 29, 1, '2025-01-01 00:00:00'),
        -- Onthaal (inactief - assets vallen onder building)
        (36, 'onthaal-td',                'Onthaal Technische Dienst',               3, 36, 0, '2025-01-01 00:00:00'),

        -- Sector Mens (Id = 4) - MG-SECTOR-mens
        (13, 'beleven-bewegen',           'Beleven & Bewegen',                       4, 13, 1, '2025-01-01 00:00:00'),
        (14, 'bibliotheek',               'Bibliotheek',                             4, 14, 1, '2025-01-01 00:00:00'),
        (15, 'burgerzaken',               'Burgerzaken',                             4, 15, 1, '2025-01-01 00:00:00'),
        (16, 'gezin-onderwijs',           'Gezin & Onderwijs',                       4, 16, 1, '2025-01-01 00:00:00'),
        (17, 'GBS',                       'Gemeentelijke Basisschool',               4, 17, 1, '2025-01-01 00:00:00'),
        (18, 'socialedienst',             'Sociale Dienst',                          4, 18, 1, '2025-01-01 00:00:00'),
        (22, 'begeleiders-BKO',           'Begeleiders BKO',                         4, 22, 1, '2025-01-01 00:00:00'),
        (31, 'demerstrand',               'Demerstrand',                             4, 31, 1, '2025-01-01 00:00:00'),
        -- Bestuurlijk (inactief)
        (30, 'bijzonder-comite-sociale-dienst', 'Bijzonder Comite Sociale Dienst',   4, 30, 0, '2025-01-01 00:00:00'),
        -- Onthaal (inactief - assets vallen onder building)
        (32, 'onthaalbalies',             'Onthaalbalies',                           4, 32, 0, '2025-01-01 00:00:00'),
        (33, 'onthaal-gemeentehuis',      'Onthaal Gemeentehuis',                    4, 33, 0, '2025-01-01 00:00:00'),
        (34, 'onthaal-poortgebouw',       'Onthaal Poortgebouw',                     4, 34, 0, '2025-01-01 00:00:00'),
        (35, 'onthaal-sociaalhuis',       'Onthaal Sociaal Huis',                    4, 35, 0, '2025-01-01 00:00:00'),
        (37, 'onthaal-vrijetijdsloket',   'Onthaal Vrijetijdsloket',                 4, 37, 0, '2025-01-01 00:00:00'),

        -- Sector Zorg (Id = 5) - MG-SECTOR-zorg
        (19, 'thuiszorg',                 'Thuiszorg',                               5, 19, 1, '2025-01-01 00:00:00'),
        (20, 'dagverzorging',             'Dagverzorging',                           5, 20, 1, '2025-01-01 00:00:00'),
        (21, 'WZC',                       'Woonzorgcentrum',                         5, 21, 1, '2025-01-01 00:00:00'),
        -- Onthaal (inactief - assets vallen onder building)
        (38, 'onthaal-wzc',               'Onthaal Woonzorgcentrum',                 5, 38, 0, '2025-01-01 00:00:00');

    SET IDENTITY_INSERT dbo.Services OFF;

    PRINT '    - ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' services toegevoegd';
    PRINT '';

    /* ---------------------------------------------------------------
       STAP 5: Foreign Keys weer inschakelen

       We schakelen de FK's weer in en valideren de data.
       WITH CHECK zorgt ervoor dat bestaande data gevalideerd wordt.
       --------------------------------------------------------------- */

    PRINT 'STAP 5: Foreign keys weer inschakelen en valideren...';

    -- FK's die verwijzen naar Services
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Assets_Services_ServiceId')
        ALTER TABLE dbo.Assets WITH CHECK CHECK CONSTRAINT FK_Assets_Services_ServiceId;

    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_AssetTemplates_Services_ServiceId')
        ALTER TABLE dbo.AssetTemplates WITH CHECK CHECK CONSTRAINT FK_AssetTemplates_Services_ServiceId;

    -- FK's die verwijzen naar Categories
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_AssetTypes_Categories_CategoryId')
        ALTER TABLE dbo.AssetTypes WITH CHECK CHECK CONSTRAINT FK_AssetTypes_Categories_CategoryId;

    -- FK's binnen Services tabel
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Services_Sectors_SectorId')
        ALTER TABLE dbo.Services WITH CHECK CHECK CONSTRAINT FK_Services_Sectors_SectorId;

    PRINT '  - Foreign keys ingeschakeld en gevalideerd';
    PRINT '';

    /* ---------------------------------------------------------------
       STAP 6: Verificatie - tellen van records
       --------------------------------------------------------------- */

    PRINT 'STAP 6: Verificatie van ingevoegde data...';
    PRINT '';

    DECLARE @CategoryCount INT, @BuildingCount INT, @SectorCount INT, @ServiceCount INT, @LeaseContractCount INT;

    SELECT @CategoryCount = COUNT(*) FROM dbo.Categories;
    SELECT @BuildingCount = COUNT(*) FROM dbo.Buildings;
    SELECT @SectorCount = COUNT(*) FROM dbo.Sectors;
    SELECT @ServiceCount = COUNT(*) FROM dbo.Services;
    SELECT @LeaseContractCount = COUNT(*) FROM dbo.LeaseContracts;

    PRINT '  Resultaten:';
    PRINT '  -----------';
    PRINT '  - Categories:       ' + CAST(@CategoryCount AS VARCHAR(10)) + ' (verwacht: 6)';
    PRINT '  - Buildings:        ' + CAST(@BuildingCount AS VARCHAR(10)) + ' (verwacht: 17)';
    PRINT '  - Sectors:          ' + CAST(@SectorCount AS VARCHAR(10)) + ' (verwacht: 5)';
    PRINT '  - Services:         ' + CAST(@ServiceCount AS VARCHAR(10)) + ' (verwacht: 38)';
    PRINT '  - LeaseContracts:   ' + CAST(@LeaseContractCount AS VARCHAR(10)) + ' (verwacht: 0)';
    PRINT '';

    -- Validatie: controleer of aantallen kloppen
    IF @CategoryCount <> 6 OR @BuildingCount <> 17 OR @SectorCount <> 5 OR @ServiceCount <> 38
    BEGIN
        RAISERROR('WAARSCHUWING: Record counts komen niet overeen met verwachte waarden!', 10, 1);
    END
    ELSE
    BEGIN
        PRINT '  Verificatie GESLAAGD - alle record counts kloppen!';
    END
    PRINT '';

    /* ---------------------------------------------------------------
       STAP 7: Commit transactie
       --------------------------------------------------------------- */

    COMMIT TRANSACTION;

    PRINT '========================================';
    PRINT 'SUCCES: Reference tables gereset en gevuld';
    PRINT 'Completed: ' + CONVERT(VARCHAR, GETDATE(), 120);
    PRINT '========================================';
    PRINT '';
    PRINT 'Samenvatting:';
    PRINT '- Categories gereset en gevuld (6 records)';
    PRINT '- Buildings gereset en gevuld (17 records)';
    PRINT '- Sectors gereset en gevuld (5 records)';
    PRINT '- Services gereset en gevuld (38 records: 25 actief, 13 inactief)';
    PRINT '- LeaseContracts geleegd (0 records)';
    PRINT '';
    PRINT 'OPMERKING:';
    PRINT '- AssetTypes is NIET gereset (bestaande links naar Categories blijven intact)';
    PRINT '- Assets is NIET gereset (transactionele data behouden)';
    PRINT '- Bestaande Assets met ServiceId blijven geldig (Services opnieuw aangemaakt met zelfde Ids)';

END TRY
BEGIN CATCH
    /* ---------------------------------------------------------------
       Error handling - rollback bij fouten
       --------------------------------------------------------------- */

    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    DECLARE @ErrorLine INT = ERROR_LINE();

    PRINT '';
    PRINT '========================================';
    PRINT 'FOUT: Transactie gerollback';
    PRINT '========================================';
    PRINT 'Error Message: ' + @ErrorMessage;
    PRINT 'Error Line: ' + CAST(@ErrorLine AS VARCHAR(10));
    PRINT 'Severity: ' + CAST(@ErrorSeverity AS VARCHAR(10));
    PRINT 'State: ' + CAST(@ErrorState AS VARCHAR(10));
    PRINT '';
    PRINT 'Alle wijzigingen zijn ongedaan gemaakt.';
    PRINT 'Los de fout op en voer het script opnieuw uit.';

    -- Re-throw de error voor logging doeleinden
    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;

SET NOCOUNT OFF;

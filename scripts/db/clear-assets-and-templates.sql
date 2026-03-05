/* =====================================================================
   Azure SQL - Clear Assets and AssetTemplates
   =====================================================================
   Auteur:      Jo Wijnen
   Datum:       2026-02-17
   Database:    sqldb-djoppie-inventory-dev

   Doel:
   - Leegmaken van Assets en AssetTemplates tabellen
   - Cascade delete van gerelateerde data (AssetEvents, LeaseContracts)
   - Azure SQL compatibel

   Tabellen die worden leeggemaakt:
   - dbo.AssetEvents       (cascade via Assets)
   - dbo.LeaseContracts    (cascade via Assets)
   - dbo.Assets            (hoofdtabel)
   - dbo.AssetTemplates    (templates)

   WAARSCHUWING:
   - Dit script verwijdert ALLE assets en templates!
   - AssetEvents en LeaseContracts worden ook verwijderd (cascade)
   - Referentietabellen (Categories, Buildings, etc.) blijven intact
   - MAAK EEN BACKUP VOORDAT JE DIT SCRIPT UITVOERT!

   Gebruik:
   1. Via Azure Portal Query Editor
   2. Via Azure Data Studio / SQL Server Management Studio
   3. Via sqlcmd: sqlcmd -S <server>.database.windows.net -d <database> -G -i clear-assets-and-templates.sql
   ===================================================================== */

SET NOCOUNT ON;
SET XACT_ABORT ON; -- Auto-rollback bij fouten

PRINT '========================================';
PRINT 'Azure SQL - Clear Assets and Templates';
PRINT 'Database: ' + DB_NAME();
PRINT 'Started: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================';
PRINT '';

-- Toon huidige aantallen
PRINT 'Huidige aantallen:';
DECLARE @AssetCount INT, @TemplateCount INT, @EventCount INT, @LeaseCount INT;
SELECT @AssetCount = COUNT(*) FROM dbo.Assets;
SELECT @TemplateCount = COUNT(*) FROM dbo.AssetTemplates;
SELECT @EventCount = COUNT(*) FROM dbo.AssetEvents;
SELECT @LeaseCount = COUNT(*) FROM dbo.LeaseContracts;
PRINT '  - Assets:         ' + CAST(@AssetCount AS VARCHAR(10));
PRINT '  - AssetTemplates: ' + CAST(@TemplateCount AS VARCHAR(10));
PRINT '  - AssetEvents:    ' + CAST(@EventCount AS VARCHAR(10));
PRINT '  - LeaseContracts: ' + CAST(@LeaseCount AS VARCHAR(10));
PRINT '';

IF @AssetCount = 0 AND @TemplateCount = 0
BEGIN
    PRINT 'Tabellen zijn al leeg. Geen actie nodig.';
    RETURN;
END

BEGIN TRY
    BEGIN TRANSACTION;

    /* ---------------------------------------------------------------
       STAP 1: Child tabellen leegmaken (cascade)

       AssetEvents en LeaseContracts hebben FK naar Assets met
       ON DELETE CASCADE, maar we maken ze expliciet leeg voor
       duidelijke logging.
       --------------------------------------------------------------- */

    PRINT 'STAP 1: Gerelateerde data verwijderen...';

    DELETE FROM dbo.AssetEvents;
    PRINT '  - AssetEvents: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' rijen verwijderd';

    DELETE FROM dbo.LeaseContracts;
    PRINT '  - LeaseContracts: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' rijen verwijderd';

    PRINT '';

    /* ---------------------------------------------------------------
       STAP 2: Hoofdtabellen leegmaken
       --------------------------------------------------------------- */

    PRINT 'STAP 2: Assets en Templates verwijderen...';

    DELETE FROM dbo.Assets;
    PRINT '  - Assets: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' rijen verwijderd';

    DELETE FROM dbo.AssetTemplates;
    PRINT '  - AssetTemplates: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' rijen verwijderd';

    PRINT '';

    /* ---------------------------------------------------------------
       STAP 3: Identity seeds resetten
       --------------------------------------------------------------- */

    PRINT 'STAP 3: Identity seeds resetten...';

    DBCC CHECKIDENT ('dbo.Assets', RESEED, 0);
    DBCC CHECKIDENT ('dbo.AssetTemplates', RESEED, 0);
    DBCC CHECKIDENT ('dbo.AssetEvents', RESEED, 0);
    DBCC CHECKIDENT ('dbo.LeaseContracts', RESEED, 0);

    PRINT '  - Identity seeds gereset naar 0';
    PRINT '';

    /* ---------------------------------------------------------------
       STAP 4: Verificatie
       --------------------------------------------------------------- */

    PRINT 'STAP 4: Verificatie...';

    SELECT @AssetCount = COUNT(*) FROM dbo.Assets;
    SELECT @TemplateCount = COUNT(*) FROM dbo.AssetTemplates;
    SELECT @EventCount = COUNT(*) FROM dbo.AssetEvents;
    SELECT @LeaseCount = COUNT(*) FROM dbo.LeaseContracts;

    PRINT '  - Assets:         ' + CAST(@AssetCount AS VARCHAR(10)) + ' (verwacht: 0)';
    PRINT '  - AssetTemplates: ' + CAST(@TemplateCount AS VARCHAR(10)) + ' (verwacht: 0)';
    PRINT '  - AssetEvents:    ' + CAST(@EventCount AS VARCHAR(10)) + ' (verwacht: 0)';
    PRINT '  - LeaseContracts: ' + CAST(@LeaseCount AS VARCHAR(10)) + ' (verwacht: 0)';
    PRINT '';

    IF @AssetCount <> 0 OR @TemplateCount <> 0 OR @EventCount <> 0 OR @LeaseCount <> 0
    BEGIN
        RAISERROR('WAARSCHUWING: Niet alle tabellen zijn leeg!', 16, 1);
    END

    /* ---------------------------------------------------------------
       STAP 5: Commit
       --------------------------------------------------------------- */

    COMMIT TRANSACTION;

    PRINT '========================================';
    PRINT 'SUCCES: Assets en Templates verwijderd';
    PRINT 'Completed: ' + CONVERT(VARCHAR, GETDATE(), 120);
    PRINT '========================================';
    PRINT '';
    PRINT 'Samenvatting:';
    PRINT '- Alle Assets verwijderd';
    PRINT '- Alle AssetTemplates verwijderd';
    PRINT '- Alle AssetEvents verwijderd (cascade)';
    PRINT '- Alle LeaseContracts verwijderd (cascade)';
    PRINT '- Identity seeds gereset naar 0';
    PRINT '';
    PRINT 'Referentietabellen NIET aangeraakt:';
    PRINT '- Categories, AssetTypes, Buildings';
    PRINT '- Sectors, Services';

END TRY
BEGIN CATCH
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

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;

SET NOCOUNT OFF;

-- clear-data.sql
-- Removes all user data (assets, events, leases) while preserving reference/seed data.
-- Usage: sqlite3 src/backend/DjoppieInventory.API/djoppie.db < scripts/db/clear-data.sql

PRAGMA foreign_keys = OFF;

-- Delete child tables first
DELETE FROM LeaseContracts;
DELETE FROM AssetEvents;
DELETE FROM Assets;

-- Reset autoincrement counters
DELETE FROM sqlite_sequence WHERE name IN ('Assets', 'AssetEvents', 'LeaseContracts');

PRAGMA foreign_keys = ON;

SELECT 'Cleared ' || changes() || ' rows. Assets, AssetEvents, and LeaseContracts are now empty.';

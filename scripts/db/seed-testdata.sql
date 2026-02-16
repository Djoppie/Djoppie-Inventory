-- seed-testdata.sql
-- Seeds ~40 realistic test assets into the database.
-- Clears existing asset data first (idempotent).
-- Usage: sqlite3 src/backend/DjoppieInventory.API/djoppie.db < scripts/db/seed-testdata.sql
--
-- Prerequisites: Reference data (Categories, AssetTypes, Buildings, Sectors, Services)
-- must already exist from EF Core migrations.

PRAGMA foreign_keys = OFF;

-- Clear existing asset data first
DELETE FROM LeaseContracts;
DELETE FROM AssetEvents;
DELETE FROM Assets;
DELETE FROM sqlite_sequence WHERE name IN ('Assets', 'AssetEvents', 'LeaseContracts');

PRAGMA foreign_keys = ON;

-- ============================================================================
-- ASSETS (~40 realistic test assets)
-- ============================================================================
-- AssetType IDs: LAP=1, DESK=2, MON=3, TAB=4, PRN=5, TEL=6, NET=7, DOCK=8, KEYB=9, MOUSE=10
-- Status: InGebruik=0, Stock=1, Herstelling=2, Defect=3, UitDienst=4, Nieuw=5
-- Building IDs: 1=Poortgebouw, 2=Gemeentehuis, 3=De Plak, 4=WZC, 5-16=satellites
-- Service IDs: 1-6=Organisatie, 7-8=Financien, 9-12=Ruimte, 13-17=Mens, 18-21=Zorg

INSERT INTO Assets (AssetCode, AssetName, Category, IsDummy, Owner, Status, Brand, Model, SerialNumber, PurchaseDate, WarrantyExpiry, InstallationDate, AssetTypeId, ServiceId, InstallationLocation, CreatedAt, UpdatedAt) VALUES

-- === LAPTOPS (10) ===
('LAP-26-DELL-00001', 'LAPTOP-IT-001', 'Computing', 0, 'Jo Wijnen', 0, 'Dell', 'Latitude 5540', 'DELL-SN-7X8K2M1', '2025-09-15', '2028-09-15', '2025-09-20', 1, 3, 'Kantoor IT - 1e verdieping', datetime('now'), datetime('now')),
('LAP-26-DELL-00002', 'LAPTOP-FIN-001', 'Computing', 0, 'Marie Janssens', 0, 'Dell', 'Latitude 5540', 'DELL-SN-9P3J5N2', '2025-09-15', '2028-09-15', '2025-09-22', 1, 8, 'Kantoor Financien', datetime('now'), datetime('now')),
('LAP-26-DELL-00003', 'LAPTOP-HR-001', 'Computing', 0, 'Pieter De Smedt', 0, 'Dell', 'Latitude 7440', 'DELL-SN-4R6T8W3', '2025-11-01', '2028-11-01', '2025-11-05', 1, 5, 'Kantoor HR', datetime('now'), datetime('now')),
('LAP-26-HP-00001', 'LAPTOP-COM-001', 'Computing', 0, 'Sophie Maes', 0, 'HP', 'EliteBook 840 G10', 'HP-SN-2CK48X901', '2025-06-10', '2028-06-10', '2025-06-15', 1, 2, 'Kantoor Communicatie', datetime('now'), datetime('now')),
('LAP-26-HP-00002', 'LAPTOP-BURG-001', 'Computing', 0, 'Lien Van Damme', 0, 'HP', 'EliteBook 840 G10', 'HP-SN-5FM72Y302', '2025-06-10', '2028-06-10', '2025-06-18', 1, 14, NULL, datetime('now'), datetime('now')),
('LAP-26-LENO-00001', 'LAPTOP-RO-001', 'Computing', 0, 'Tom Claes', 0, 'Lenovo', 'ThinkPad T14s Gen 4', 'LEN-SN-PF3N8K21', '2025-03-20', '2028-03-20', '2025-03-25', 1, 9, NULL, datetime('now'), datetime('now')),
('LAP-26-DELL-00004', '', 'Computing', 0, NULL, 1, 'Dell', 'Latitude 5540', 'DELL-SN-8M2K6P4', '2026-01-10', '2029-01-10', NULL, 1, NULL, NULL, datetime('now'), datetime('now')),
('LAP-26-DELL-00005', '', 'Computing', 0, NULL, 5, 'Dell', 'Latitude 5540', 'DELL-SN-1Q9W3E5', '2026-02-01', '2029-02-01', NULL, 1, NULL, NULL, datetime('now'), datetime('now')),
('LAP-25-DELL-00001', 'LAPTOP-OLD-001', 'Computing', 0, NULL, 4, 'Dell', 'Latitude 5430', 'DELL-SN-OLD1X2Y3', '2022-04-15', '2025-04-15', '2022-04-20', 1, NULL, NULL, datetime('now'), datetime('now')),
('LAP-26-HP-00003', 'LAPTOP-REP-001', 'Computing', 0, 'Jan Peeters', 2, 'HP', 'EliteBook 840 G10', 'HP-SN-8GN93Z503', '2025-06-10', '2028-06-10', '2025-07-01', 1, 7, 'Kantoor Aankopen', datetime('now'), datetime('now')),

-- === DESKTOPS (5) ===
('DESK-26-DELL-00001', 'DESKTOP-SEC-001', 'Computing', 0, 'Karen Willems', 0, 'Dell', 'OptiPlex 7010', 'DELL-SN-DK1A2B3C', '2025-08-01', '2028-08-01', '2025-08-05', 2, 1, 'Bestuurssecretariaat', datetime('now'), datetime('now')),
('DESK-26-DELL-00002', 'DESKTOP-FIN-001', 'Computing', 0, 'Bart Hermans', 0, 'Dell', 'OptiPlex 7010', 'DELL-SN-DK4D5E6F', '2025-08-01', '2028-08-01', '2025-08-05', 2, 8, 'Kantoor Financien', datetime('now'), datetime('now')),
('DESK-26-HP-00001', 'DESKTOP-BURG-001', 'Computing', 0, 'Els Vandenberghe', 0, 'HP', 'ProDesk 400 G9', 'HP-SN-DK7G8H9I0', '2025-10-15', '2028-10-15', '2025-10-20', 2, 14, 'Loket Burgerzaken', datetime('now'), datetime('now')),
('DESK-26-LENO-00001', 'DESKTOP-SOC-001', 'Computing', 0, 'An Mertens', 0, 'Lenovo', 'ThinkCentre M70q', 'LEN-SN-DK2J3K4L5', '2025-05-20', '2028-05-20', '2025-05-25', 2, 17, NULL, datetime('now'), datetime('now')),
('DESK-26-DELL-00003', '', 'Computing', 0, NULL, 1, 'Dell', 'OptiPlex 7010', 'DELL-SN-DK6M7N8O9', '2026-01-15', '2029-01-15', NULL, 2, NULL, NULL, datetime('now'), datetime('now')),

-- === MONITORS (6) ===
('MON-26-SAMS-00001', 'MONITOR-IT-001', 'Werkplek', 0, 'Jo Wijnen', 0, 'Samsung', 'S27A600U 27"', 'SAM-SN-MN1P2Q3R4', '2025-09-15', '2028-09-15', '2025-09-20', 3, 3, 'Kantoor IT - 1e verdieping', datetime('now'), datetime('now')),
('MON-26-SAMS-00002', 'MONITOR-IT-002', 'Werkplek', 0, 'Jo Wijnen', 0, 'Samsung', 'S27A600U 27"', 'SAM-SN-MN5S6T7U8', '2025-09-15', '2028-09-15', '2025-09-20', 3, 3, 'Kantoor IT - 1e verdieping', datetime('now'), datetime('now')),
('MON-26-DELL-00001', 'MONITOR-FIN-001', 'Werkplek', 0, 'Marie Janssens', 0, 'Dell', 'P2422H 24"', 'DELL-SN-MN9V0W1X2', '2025-09-15', '2028-09-15', '2025-09-22', 3, 8, 'Kantoor Financien', datetime('now'), datetime('now')),
('MON-26-DELL-00002', 'MONITOR-SEC-001', 'Werkplek', 0, 'Karen Willems', 0, 'Dell', 'P2422H 24"', 'DELL-SN-MN3Y4Z5A6', '2025-08-01', '2028-08-01', '2025-08-05', 3, 1, 'Bestuurssecretariaat', datetime('now'), datetime('now')),
('MON-26-DELL-00003', '', 'Werkplek', 0, NULL, 3, 'Dell', 'P2422H 24"', 'DELL-SN-MN7B8C9D0', '2024-03-10', '2027-03-10', '2024-03-15', 3, NULL, NULL, datetime('now'), datetime('now')),
('MON-26-SAMS-00003', '', 'Werkplek', 0, NULL, 1, 'Samsung', 'S27A600U 27"', 'SAM-SN-MN1E2F3G4', '2026-01-20', '2029-01-20', NULL, 3, NULL, NULL, datetime('now'), datetime('now')),

-- === DOCKING STATIONS (4) ===
('DOCK-26-DELL-00001', 'DOCK-IT-001', 'Werkplek', 0, 'Jo Wijnen', 0, 'Dell', 'WD19S 130W', 'DELL-SN-DC1H2I3J4', '2025-09-15', '2028-09-15', '2025-09-20', 8, 3, 'Kantoor IT - 1e verdieping', datetime('now'), datetime('now')),
('DOCK-26-DELL-00002', 'DOCK-FIN-001', 'Werkplek', 0, 'Marie Janssens', 0, 'Dell', 'WD19S 130W', 'DELL-SN-DC5K6L7M8', '2025-09-15', '2028-09-15', '2025-09-22', 8, 8, 'Kantoor Financien', datetime('now'), datetime('now')),
('DOCK-26-DELL-00003', 'DOCK-HR-001', 'Werkplek', 0, 'Pieter De Smedt', 0, 'Dell', 'WD19S 130W', 'DELL-SN-DC9N0O1P2', '2025-11-01', '2028-11-01', '2025-11-05', 8, 5, 'Kantoor HR', datetime('now'), datetime('now')),
('DOCK-26-DELL-00004', '', 'Werkplek', 0, NULL, 1, 'Dell', 'WD19S 130W', 'DELL-SN-DC3Q4R5S6', '2026-01-10', '2029-01-10', NULL, 8, NULL, NULL, datetime('now'), datetime('now')),

-- === PRINTERS (3) ===
('PRN-26-HP-00001', 'PRINTER-POORT-001', 'Peripherals', 0, NULL, 0, 'HP', 'LaserJet Pro M404dn', 'HP-SN-PR1T2U3V4', '2025-04-01', '2028-04-01', '2025-04-10', 5, NULL, 'Gang 1e verdieping', datetime('now'), datetime('now')),
('PRN-26-HP-00002', 'PRINTER-GHUIS-001', 'Peripherals', 0, NULL, 0, 'HP', 'Color LaserJet Pro M454dw', 'HP-SN-PR5W6X7Y8', '2025-04-01', '2028-04-01', '2025-04-12', 5, NULL, 'Onthaal Gemeentehuis', datetime('now'), datetime('now')),
('PRN-25-HP-00001', 'PRINTER-OLD-001', 'Peripherals', 0, NULL, 4, 'HP', 'LaserJet Pro M402dn', 'HP-SN-PR9Z0A1B2', '2021-06-01', '2024-06-01', '2021-06-10', 5, NULL, NULL, datetime('now'), datetime('now')),

-- === TABLETS (2) ===
('TAB-26-APPL-00001', 'IPAD-BB-001', 'Mobile', 0, 'Lucas De Wolf', 0, 'Apple', 'iPad Air M2', 'APPL-SN-TB1C2D3E4', '2025-10-01', '2027-10-01', '2025-10-05', 4, 13, NULL, datetime('now'), datetime('now')),
('TAB-26-SAMS-00001', 'TAB-GBS-001', 'Mobile', 0, NULL, 0, 'Samsung', 'Galaxy Tab S9 FE', 'SAM-SN-TB5F6G7H8', '2025-11-15', '2027-11-15', '2025-11-20', 4, 16, 'Klaslokaal 3B', datetime('now'), datetime('now')),

-- === PHONES (2) ===
('TEL-26-APPL-00001', 'IPHONE-DIR-001', 'Mobile', 0, 'Marc Hendrickx', 0, 'Apple', 'iPhone 15', 'APPL-SN-TL1I2J3K4', '2025-07-01', '2027-07-01', '2025-07-05', 6, 1, NULL, datetime('now'), datetime('now')),
('TEL-26-SAMS-00001', 'PHONE-PREV-001', 'Mobile', 0, 'Koen Jansen', 0, 'Samsung', 'Galaxy A55', 'SAM-SN-TL5L6M7N8', '2025-08-15', '2027-08-15', '2025-08-20', 6, 6, NULL, datetime('now'), datetime('now')),

-- === NETWORK EQUIPMENT (2) ===
('NET-26-CISC-00001', 'SWITCH-POORT-001', 'Networking', 0, NULL, 0, 'Cisco', 'Catalyst 2960-X', 'CISC-SN-NT1O2P3Q4', '2025-02-01', '2030-02-01', '2025-02-15', 7, 3, 'Serverruimte Poortgebouw', datetime('now'), datetime('now')),
('NET-26-CISC-00002', 'SWITCH-GHUIS-001', 'Networking', 0, NULL, 0, 'Cisco', 'Catalyst 2960-X', 'CISC-SN-NT5R6S7T8', '2025-02-01', '2030-02-01', '2025-02-15', 7, 3, 'Serverruimte Gemeentehuis', datetime('now'), datetime('now')),

-- === KEYBOARDS (2) ===
('KEYB-26-LOGI-00001', 'KB-IT-001', 'Werkplek', 0, 'Jo Wijnen', 0, 'Logitech', 'MX Keys S', 'LOGI-SN-KB1U2V3W4', '2025-09-15', '2027-09-15', '2025-09-20', 9, 3, 'Kantoor IT - 1e verdieping', datetime('now'), datetime('now')),
('KEYB-26-MICR-00001', '', 'Werkplek', 0, NULL, 1, 'Microsoft', 'Ergonomic Keyboard', 'MSFT-SN-KB5X6Y7Z8', '2026-01-10', '2028-01-10', NULL, 9, NULL, NULL, datetime('now'), datetime('now')),

-- === MICE (2) ===
('MOUSE-26-LOGI-00001', 'MOUSE-IT-001', 'Werkplek', 0, 'Jo Wijnen', 0, 'Logitech', 'MX Master 3S', 'LOGI-SN-MS1A2B3C4', '2025-09-15', '2027-09-15', '2025-09-20', 10, 3, 'Kantoor IT - 1e verdieping', datetime('now'), datetime('now')),
('MOUSE-26-LOGI-00002', '', 'Werkplek', 0, NULL, 1, 'Logitech', 'MX Master 3S', 'LOGI-SN-MS5D6E7F8', '2026-01-10', '2028-01-10', NULL, 10, NULL, NULL, datetime('now'), datetime('now')),

-- === DUMMY ASSETS (3) ===
('DUM-LAP-26-DELL-90001', 'DUMMY-LAPTOP-001', 'Computing', 1, 'Test User', 0, 'Dell', 'Latitude Test', 'DUM-SN-LAP90001', '2026-01-01', '2029-01-01', '2026-01-05', 1, 3, 'Test Location', datetime('now'), datetime('now')),
('DUM-MON-26-SAMS-90001', 'DUMMY-MONITOR-001', 'Werkplek', 1, NULL, 1, 'Samsung', 'Test Monitor 27"', 'DUM-SN-MON90001', '2026-01-01', '2029-01-01', NULL, 3, NULL, NULL, datetime('now'), datetime('now')),
('DUM-PRN-26-HP-90001', 'DUMMY-PRINTER-001', 'Peripherals', 1, NULL, 5, 'HP', 'LaserJet Test', 'DUM-SN-PRN90001', '2026-02-01', '2029-02-01', NULL, 5, NULL, NULL, datetime('now'), datetime('now'));

SELECT 'Seeded ' || (SELECT COUNT(*) FROM Assets) || ' test assets.';

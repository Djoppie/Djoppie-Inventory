// Lazy-load exceljs (~270KB gzip) only when the user actually triggers an Excel export.
// Prevents this heavy dependency from landing in the initial bundle.
import type ExcelJSType from 'exceljs';
import { Asset, AssetStatus } from '../types/asset.types';
import { format } from 'date-fns';

let _excelJs: typeof ExcelJSType | null = null;
const loadExcelJs = async (): Promise<typeof ExcelJSType> => {
  if (!_excelJs) {
    _excelJs = (await import('exceljs')).default;
  }
  return _excelJs;
};

export interface ExportColumn {
  key: keyof Asset;
  label: string;
  enabled: boolean;
}

export interface ExportConfig {
  columns: ExportColumn[];
  format: 'xlsx' | 'csv';
  fileName: string;
  includeTimestamp: boolean;
}

/**
 * Formats a date string to a readable format
 */
const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  try {
    return format(new Date(dateString), 'dd-MM-yyyy');
  } catch {
    return dateString;
  }
};

/**
 * Formats asset status to readable text
 */
const formatStatus = (status: AssetStatus): string => {
  const statusMap: Record<AssetStatus, string> = {
    [AssetStatus.InGebruik]: 'In gebruik',
    [AssetStatus.Stock]: 'Stock',
    [AssetStatus.Herstelling]: 'Herstelling',
    [AssetStatus.Defect]: 'Defect',
    [AssetStatus.UitDienst]: 'Uit dienst',
    [AssetStatus.Nieuw]: 'Nieuw',
  };
  return statusMap[status] || status;
};

/**
 * Prepares asset data for export based on selected columns
 */
const prepareExportData = (assets: Asset[], columns: ExportColumn[]): Record<string, string | number>[] => {
  const enabledColumns = columns.filter(col => col.enabled);

  return assets.map(asset => {
    const row: Record<string, string | number> = {};

    enabledColumns.forEach(column => {
      const value = asset[column.key];

      // Format specific fields
      if (column.key === 'status') {
        row[column.label] = formatStatus(value as AssetStatus);
      } else if (column.key === 'purchaseDate' || column.key === 'warrantyExpiry' || column.key === 'installationDate') {
        row[column.label] = formatDate(value as string);
      } else if (column.key === 'intuneEnrollmentDate' || column.key === 'intuneLastCheckIn' || column.key === 'intuneCertificateExpiry' || column.key === 'intuneSyncedAt') {
        row[column.label] = formatDate(value as string);
      } else if (column.key === 'createdAt' || column.key === 'updatedAt') {
        row[column.label] = formatDate(value as string);
      } else {
        row[column.label] = (value as string | number) || '';
      }
    });

    return row;
  });
};

/**
 * Generates a filename with optional timestamp
 */
const generateFileName = (baseName: string, includeTimestamp: boolean, extension: string): string => {
  const timestamp = includeTimestamp ? `_${format(new Date(), 'yyyyMMdd_HHmmss')}` : '';
  return `${baseName}${timestamp}.${extension}`;
};

/**
 * Downloads a blob as a file
 */
const downloadBlob = (blob: Blob, fileName: string): void => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

/**
 * Exports assets to Excel format using ExcelJS
 */
export const exportToExcel = async (assets: Asset[], config: ExportConfig): Promise<void> => {
  const ExcelJS = await loadExcelJs();
  const data = prepareExportData(assets, config.columns);
  const enabledColumns = config.columns.filter(col => col.enabled);

  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Djoppie Inventory';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Assets', {
    headerFooter: {
      firstHeader: 'Djoppie Inventory Export',
    },
  });

  // Define columns with headers and widths
  worksheet.columns = enabledColumns.map(col => ({
    header: col.label,
    key: col.label,
    width: Math.max(col.label.length + 2, 15),
  }));

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' }, // Indigo color
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // Add data rows
  data.forEach((row, index) => {
    const dataRow = worksheet.addRow(row);

    // Alternate row colors for better readability
    if (index % 2 === 0) {
      dataRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF9FAFB' }, // Light gray
      };
    }
    dataRow.alignment = { vertical: 'middle' };
  });

  // Add borders to all cells
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
    });
  });

  // Auto-filter on header row
  if (data.length > 0) {
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: enabledColumns.length },
    };
  }

  // Freeze header row
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Generate file and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const fileName = generateFileName(config.fileName, config.includeTimestamp, 'xlsx');
  downloadBlob(blob, fileName);
};

/**
 * Exports assets to CSV format
 */
export const exportToCSV = async (assets: Asset[], config: ExportConfig): Promise<void> => {
  const ExcelJS = await loadExcelJs();
  const data = prepareExportData(assets, config.columns);
  const enabledColumns = config.columns.filter(col => col.enabled);

  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Assets');

  // Define columns
  worksheet.columns = enabledColumns.map(col => ({
    header: col.label,
    key: col.label,
  }));

  // Add data rows
  data.forEach(row => {
    worksheet.addRow(row);
  });

  // Generate CSV and download
  const buffer = await workbook.csv.writeBuffer();
  const blob = new Blob([buffer], { type: 'text/csv;charset=utf-8;' });
  const fileName = generateFileName(config.fileName, config.includeTimestamp, 'csv');
  downloadBlob(blob, fileName);
};

/**
 * Main export function that routes to appropriate format handler
 */
export const exportAssets = async (assets: Asset[], config: ExportConfig): Promise<void> => {
  if (assets.length === 0) {
    throw new Error('No assets to export');
  }

  if (config.format === 'xlsx') {
    await exportToExcel(assets, config);
  } else if (config.format === 'csv') {
    await exportToCSV(assets, config);
  } else {
    throw new Error(`Unsupported export format: ${config.format}`);
  }
};

/**
 * Default column configuration
 */
export const getDefaultExportColumns = (): ExportColumn[] => [
  { key: 'assetCode', label: 'Asset Code', enabled: true },
  { key: 'assetName', label: 'Asset Name', enabled: true },
  { key: 'category', label: 'Category', enabled: true },
  { key: 'status', label: 'Status', enabled: true },
  { key: 'owner', label: 'Owner', enabled: true },
  { key: 'legacyBuilding', label: 'Building', enabled: true },
  { key: 'legacyDepartment', label: 'Department', enabled: true },
  { key: 'officeLocation', label: 'Office Location', enabled: false },
  { key: 'brand', label: 'Brand', enabled: true },
  { key: 'model', label: 'Model', enabled: true },
  { key: 'serialNumber', label: 'Serial Number', enabled: true },
  { key: 'purchaseDate', label: 'Purchase Date', enabled: false },
  { key: 'warrantyExpiry', label: 'Warranty Expiry', enabled: false },
  { key: 'installationDate', label: 'Installation Date', enabled: false },
  { key: 'intuneEnrollmentDate', label: 'Intune Enrollment Date', enabled: false },
  { key: 'intuneLastCheckIn', label: 'Intune Last Check-in', enabled: false },
  { key: 'intuneCertificateExpiry', label: 'Intune Certificate Expiry', enabled: false },
  { key: 'createdAt', label: 'Created At', enabled: false },
  { key: 'updatedAt', label: 'Updated At', enabled: false },
];

// ========================================
// Generic Export Utilities (for all tables)
// ========================================

export interface GenericExportColumn<T = unknown> {
  field: string;
  headerName: string;
  valueFormatter?: (value: T) => string;
}

/**
 * Generic export to CSV function that works with any data type
 * @param data - Array of objects to export
 * @param filename - Name of the file to download
 * @param columns - Column definitions with field names and headers
 */
export const exportToCsv = <T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns: GenericExportColumn[]
): void => {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Create CSV header row
  const headers = columns.map((col) => col.headerName);
  const headerRow = headers.map((h) => `"${h}"`).join(',');

  // Create CSV data rows
  const dataRows = data.map((row) => {
    return columns
      .map((col) => {
        const value = row[col.field];
        const formattedValue = col.valueFormatter
          ? col.valueFormatter(value)
          : value ?? '';

        // Escape quotes and wrap in quotes if contains comma, newline, or quote
        const stringValue = String(formattedValue);
        if (
          stringValue.includes(',') ||
          stringValue.includes('\n') ||
          stringValue.includes('"')
        ) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',');
  });

  // Combine header and data
  const csvContent = [headerRow, ...dataRows].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
};

/**
 * Format date for CSV export (generic helper)
 * @param date - Date string or Date object
 * @returns Formatted date string (DD/MM/YYYY)
 */
export const formatDateForExport = (date: string | Date | null | undefined): string => {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  return format(d, 'dd/MM/yyyy');
};

/**
 * Format currency for CSV export (generic helper)
 * @param value - Numeric value
 * @param currency - Currency symbol (default: '€')
 * @returns Formatted currency string
 */
export const formatCurrencyForExport = (value: number | null | undefined, currency = '€'): string => {
  if (value === null || value === undefined) return '';
  return `${currency}${value.toFixed(2)}`;
};

/**
 * Format boolean for CSV export (generic helper)
 * @param value - Boolean value
 * @param trueLabel - Label for true value (default: 'Yes')
 * @param falseLabel - Label for false value (default: 'No')
 * @returns Formatted string
 */
export const formatBooleanForExport = (
  value: boolean | null | undefined,
  trueLabel = 'Yes',
  falseLabel = 'No'
): string => {
  if (value === null || value === undefined) return '';
  return value ? trueLabel : falseLabel;
};

import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { RolloutWorkplace, RolloutDay, RolloutSession } from '../types/rollout';

/**
 * Swap Checklist Export Utility
 *
 * Generates Excel checklists for IT device swaps during rollouts.
 * Includes columns for:
 * - User information
 * - New laptop serial number (with space to fill in)
 * - Docking station serial number (with space to fill in)
 * - QR code applied checkbox
 */

interface SwapChecklistRow {
  userName: string;
  userEmail: string;
  location: string;
  serviceName: string;
  laptopSerial: string;
  laptopAssetCode: string;
  dockingSerial: string;
  dockingAssetCode: string;
  qrCodesApplied: string;
}

/**
 * Extract laptop and docking info from workplace asset plans
 */
const extractAssetInfo = (workplace: RolloutWorkplace): {
  laptopSerial: string;
  laptopAssetCode: string;
  dockingSerial: string;
  dockingAssetCode: string;
} => {
  let laptopSerial = '';
  let laptopAssetCode = '';
  let dockingSerial = '';
  let dockingAssetCode = '';

  if (workplace.assetPlans) {
    workplace.assetPlans.forEach((plan) => {
      if (plan.equipmentType === 'laptop') {
        laptopSerial = plan.metadata?.serialNumber || '';
        laptopAssetCode = plan.existingAssetCode || '';
      } else if (plan.equipmentType === 'docking') {
        dockingSerial = plan.metadata?.serialNumber || '';
        dockingAssetCode = plan.existingAssetCode || '';
      }
    });
  }

  return { laptopSerial, laptopAssetCode, dockingSerial, dockingAssetCode };
};

/**
 * Prepare checklist data from workplaces
 */
const prepareChecklistData = (workplaces: RolloutWorkplace[]): SwapChecklistRow[] => {
  return workplaces.map((workplace) => {
    const assetInfo = extractAssetInfo(workplace);

    return {
      userName: workplace.userName,
      userEmail: workplace.userEmail || '',
      location: workplace.location || '',
      serviceName: workplace.serviceName || '',
      laptopSerial: assetInfo.laptopSerial,
      laptopAssetCode: assetInfo.laptopAssetCode,
      dockingSerial: assetInfo.dockingSerial,
      dockingAssetCode: assetInfo.dockingAssetCode,
      qrCodesApplied: '',
    };
  });
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
 * Create styled worksheet with checklist data
 */
const createChecklistWorksheet = (
  workbook: ExcelJS.Workbook,
  sheetName: string,
  data: SwapChecklistRow[],
  title: string,
  subtitle?: string
): void => {
  const worksheet = workbook.addWorksheet(sheetName);

  // Title row
  worksheet.mergeCells('A1:I1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = title;
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF333333' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  // Subtitle row (if provided)
  let headerRowNum = 3;
  if (subtitle) {
    worksheet.mergeCells('A2:I2');
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = subtitle;
    subtitleCell.font = { italic: true, size: 11, color: { argb: 'FF666666' } };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRowNum = 4;
  }

  // Column definitions
  const columns = [
    { header: 'Gebruiker', key: 'userName', width: 25 },
    { header: 'E-mail', key: 'userEmail', width: 30 },
    { header: 'Locatie', key: 'location', width: 20 },
    { header: 'Dienst', key: 'serviceName', width: 20 },
    { header: 'Laptop Asset Code', key: 'laptopAssetCode', width: 18 },
    { header: 'Laptop Serienummer', key: 'laptopSerial', width: 20 },
    { header: 'Docking Asset Code', key: 'dockingAssetCode', width: 18 },
    { header: 'Docking Serienummer', key: 'dockingSerial', width: 20 },
    { header: 'QR Codes Aangebracht', key: 'qrCodesApplied', width: 20 },
  ];

  // Set column widths
  worksheet.columns = columns.map(col => ({ key: col.key, width: col.width }));

  // Header row
  const headerRow = worksheet.getRow(headerRowNum);
  columns.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = col.header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF7700' }, // Orange brand color
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE65100' } },
      bottom: { style: 'thin', color: { argb: 'FFE65100' } },
      left: { style: 'thin', color: { argb: 'FFE65100' } },
      right: { style: 'thin', color: { argb: 'FFE65100' } },
    };
  });
  headerRow.height = 30;

  // Data rows
  data.forEach((row, index) => {
    const dataRow = worksheet.getRow(headerRowNum + 1 + index);

    columns.forEach((col, colIndex) => {
      const cell = dataRow.getCell(colIndex + 1);
      cell.value = row[col.key as keyof SwapChecklistRow] || '';

      // Alternate row colors for readability
      if (index % 2 === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF3E0' }, // Light orange
        };
      }

      cell.alignment = { vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      };

      // Make empty serial number cells more prominent for filling in
      if ((col.key === 'laptopSerial' || col.key === 'dockingSerial') && !cell.value) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF9C4' }, // Light yellow - needs to be filled
        };
      }

      // QR checkbox column - add a checkbox character placeholder
      if (col.key === 'qrCodesApplied') {
        cell.value = '[ ]';
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });

    dataRow.height = 25;
  });

  // Add footer with generation info
  const footerRowNum = headerRowNum + data.length + 3;
  worksheet.mergeCells(`A${footerRowNum}:I${footerRowNum}`);
  const footerCell = worksheet.getCell(`A${footerRowNum}`);
  footerCell.value = `Gegenereerd op: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: nl })} | Djoppie Inventory`;
  footerCell.font = { italic: true, size: 9, color: { argb: 'FF999999' } };
  footerCell.alignment = { horizontal: 'right' };

  // Freeze header row
  worksheet.views = [{ state: 'frozen', ySplit: headerRowNum }];
};

/**
 * Export swap checklist for a single day
 */
export const exportDaySwapChecklist = async (
  day: RolloutDay,
  sessionName: string
): Promise<void> => {
  if (!day.workplaces || day.workplaces.length === 0) {
    throw new Error('Geen werkplekken gevonden voor deze dag');
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Djoppie Inventory';
  workbook.created = new Date();

  const data = prepareChecklistData(day.workplaces);
  const formattedDate = format(new Date(day.date), 'dd MMMM yyyy', { locale: nl });
  const title = `Swap Checklist - ${day.name || `Dag ${day.dayNumber}`}`;
  const subtitle = `${sessionName} | ${formattedDate} | ${day.workplaces.length} werkplekken`;

  createChecklistWorksheet(workbook, 'Swap Checklist', data, title, subtitle);

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const safeDayName = (day.name || `Dag${day.dayNumber}`).replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = format(new Date(day.date), 'yyyyMMdd');
  const fileName = `SwapChecklist_${safeDayName}_${dateStr}.xlsx`;

  downloadBlob(blob, fileName);
};

/**
 * Export swap checklist for entire rollout session
 */
export const exportSessionSwapChecklist = async (
  session: RolloutSession,
  days: RolloutDay[]
): Promise<void> => {
  const daysWithWorkplaces = days.filter(d => d.workplaces && d.workplaces.length > 0);

  if (daysWithWorkplaces.length === 0) {
    throw new Error('Geen werkplekken gevonden in deze rollout sessie');
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Djoppie Inventory';
  workbook.created = new Date();

  // Create overview sheet with all workplaces
  const allWorkplaces = daysWithWorkplaces.flatMap(day =>
    (day.workplaces || []).map(wp => ({
      ...wp,
      dayName: day.name || `Dag ${day.dayNumber}`,
      dayDate: day.date,
    }))
  );

  // Overview sheet
  const overviewSheet = workbook.addWorksheet('Overzicht');

  // Title
  overviewSheet.mergeCells('A1:J1');
  const titleCell = overviewSheet.getCell('A1');
  titleCell.value = `Swap Checklist Overzicht - ${session.sessionName}`;
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF333333' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  overviewSheet.getRow(1).height = 30;

  // Subtitle with date range
  const startDate = format(new Date(session.plannedStartDate), 'dd MMM yyyy', { locale: nl });
  const endDate = session.plannedEndDate
    ? format(new Date(session.plannedEndDate), 'dd MMM yyyy', { locale: nl })
    : 'n.v.t.';

  overviewSheet.mergeCells('A2:J2');
  const subtitleCell = overviewSheet.getCell('A2');
  subtitleCell.value = `Periode: ${startDate} - ${endDate} | Totaal: ${allWorkplaces.length} werkplekken over ${daysWithWorkplaces.length} dagen`;
  subtitleCell.font = { italic: true, size: 11, color: { argb: 'FF666666' } };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Column definitions for overview (includes day info)
  const columns = [
    { header: 'Dag', key: 'dayName', width: 20 },
    { header: 'Datum', key: 'dayDate', width: 15 },
    { header: 'Gebruiker', key: 'userName', width: 25 },
    { header: 'E-mail', key: 'userEmail', width: 28 },
    { header: 'Locatie', key: 'location', width: 18 },
    { header: 'Laptop Asset Code', key: 'laptopAssetCode', width: 16 },
    { header: 'Laptop Serienummer', key: 'laptopSerial', width: 18 },
    { header: 'Docking Asset Code', key: 'dockingAssetCode', width: 16 },
    { header: 'Docking Serienummer', key: 'dockingSerial', width: 18 },
    { header: 'QR Codes', key: 'qrCodesApplied', width: 12 },
  ];

  overviewSheet.columns = columns.map(col => ({ key: col.key, width: col.width }));

  // Header row
  const headerRow = overviewSheet.getRow(4);
  columns.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = col.header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF7700' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE65100' } },
      bottom: { style: 'thin', color: { argb: 'FFE65100' } },
      left: { style: 'thin', color: { argb: 'FFE65100' } },
      right: { style: 'thin', color: { argb: 'FFE65100' } },
    };
  });
  headerRow.height = 30;

  // Data rows
  allWorkplaces.forEach((workplace, index) => {
    const assetInfo = extractAssetInfo(workplace);
    const dataRow = overviewSheet.getRow(5 + index);

    const rowData = {
      dayName: workplace.dayName,
      dayDate: format(new Date(workplace.dayDate), 'dd-MM-yyyy'),
      userName: workplace.userName,
      userEmail: workplace.userEmail || '',
      location: workplace.location || '',
      laptopAssetCode: assetInfo.laptopAssetCode,
      laptopSerial: assetInfo.laptopSerial,
      dockingAssetCode: assetInfo.dockingAssetCode,
      dockingSerial: assetInfo.dockingSerial,
      qrCodesApplied: '[ ]',
    };

    columns.forEach((col, colIndex) => {
      const cell = dataRow.getCell(colIndex + 1);
      cell.value = rowData[col.key as keyof typeof rowData] || '';

      if (index % 2 === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF3E0' },
        };
      }

      cell.alignment = { vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      };

      if ((col.key === 'laptopSerial' || col.key === 'dockingSerial') && !cell.value) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF9C4' },
        };
      }

      if (col.key === 'qrCodesApplied') {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });

    dataRow.height = 22;
  });

  // Freeze header row
  overviewSheet.views = [{ state: 'frozen', ySplit: 4 }];

  // Add individual day sheets with unique names
  const usedSheetNames = new Set<string>(['Overzicht']);

  daysWithWorkplaces.forEach((day) => {
    const data = prepareChecklistData(day.workplaces || []);
    const formattedDate = format(new Date(day.date), 'dd MMMM yyyy', { locale: nl });
    const dateShort = format(new Date(day.date), 'dd-MM');

    // Create base sheet name and ensure uniqueness
    const baseSheetName = (day.name || `Dag ${day.dayNumber}`).substring(0, 25); // Leave room for suffix
    let sheetName = baseSheetName;
    let counter = 1;

    // If name already exists, add date or counter suffix
    while (usedSheetNames.has(sheetName)) {
      sheetName = `${baseSheetName} (${dateShort})`;
      if (usedSheetNames.has(sheetName)) {
        counter++;
        sheetName = `${baseSheetName} ${counter}`;
      }
    }
    usedSheetNames.add(sheetName);

    const title = `Swap Checklist - ${day.name || `Dag ${day.dayNumber}`}`;
    const subtitle = `${formattedDate} | ${(day.workplaces || []).length} werkplekken`;

    createChecklistWorksheet(workbook, sheetName, data, title, subtitle);
  });

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const safeSessionName = session.sessionName.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = format(new Date(), 'yyyyMMdd');
  const fileName = `SwapChecklist_${safeSessionName}_${dateStr}.xlsx`;

  downloadBlob(blob, fileName);
};

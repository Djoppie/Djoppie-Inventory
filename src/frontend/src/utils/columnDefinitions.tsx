/**
 * Column Definitions Utility
 * Reusable DataGrid column builders to reduce code duplication
 */

import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Chip, Tooltip, alpha, LinearProgress, Box } from '@mui/material';
import StatusBadge from '../components/common/StatusBadge';
import { format } from 'date-fns';

/**
 * Creates an asset code column with shortened display and full code in tooltip
 * Format: DOCK-26-DELL-00004 → D-00004
 */
export const createAssetCodeColumn = (width = 120): GridColDef => ({
  field: 'assetCode',
  headerName: 'Asset Code',
  width,
  renderCell: (params: GridRenderCellParams) => {
    if (!params.value) return '-';

    const code = String(params.value);
    const parts = code.split('-');
    const prefix = parts[0]?.[0] || '';
    const number = parts[parts.length - 1] || '';
    const shortened = `${prefix}-${number}`;

    return (
      <Tooltip title={code} arrow>
        <Chip
          label={shortened}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            height: 24,
          }}
        />
      </Tooltip>
    );
  },
});

/**
 * Creates a status badge column using the StatusBadge component
 */
export const createStatusColumn = (
  field = 'status',
  headerName = 'Status',
  width = 120
): GridColDef => ({
  field,
  headerName,
  width,
  align: 'center',
  headerAlign: 'center',
  renderCell: (params: GridRenderCellParams) => (
    <StatusBadge status={params.value} size="small" />
  ),
});

/**
 * Creates a date column with formatted display and optional age calculation
 */
export const createDateColumn = (
  field: string,
  headerName: string,
  options?: {
    width?: number;
    showAge?: boolean;
    ageColorCoding?: boolean;
  }
): GridColDef => ({
  field,
  headerName,
  width: options?.width || 130,
  renderCell: (params: GridRenderCellParams) => {
    if (!params.value) return '-';

    try {
      const date = new Date(params.value);
      const formatted = format(date, 'dd/MM/yyyy');

      if (options?.showAge) {
        const ageInDays = Math.floor(
          (new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );
        const ageInYears = Math.floor(ageInDays / 365);

        let color = 'inherit';
        if (options?.ageColorCoding) {
          if (ageInYears >= 5) color = '#F44336';
          else if (ageInYears >= 3) color = '#FF9800';
          else color = '#4CAF50';
        }

        return (
          <Tooltip
            title={`${ageInYears} years old (${ageInDays} days)`}
            arrow
          >
            <span style={{ color }}>{formatted}</span>
          </Tooltip>
        );
      }

      return formatted;
    } catch {
      return String(params.value);
    }
  },
});

/**
 * Creates a currency column with formatted display
 */
export const createCurrencyColumn = (
  field: string,
  headerName: string,
  options?: {
    width?: number;
    currency?: string;
  }
): GridColDef => ({
  field,
  headerName,
  width: options?.width || 120,
  align: 'right',
  headerAlign: 'right',
  renderCell: (params: GridRenderCellParams) => {
    if (params.value === null || params.value === undefined) return '-';

    const currency = options?.currency || '€';
    const value = Number(params.value);

    return `${currency}${value.toFixed(2)}`;
  },
});

/**
 * Creates a progress bar column
 */
export const createProgressColumn = (
  field: string,
  headerName: string,
  options?: {
    width?: number;
    max?: number;
    color?: string;
  }
): GridColDef => ({
  field,
  headerName,
  width: options?.width || 150,
  renderCell: (params: GridRenderCellParams) => {
    const value = Number(params.value) || 0;
    const max = options?.max || 100;
    const percentage = (value / max) * 100;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
        <LinearProgress
          variant="determinate"
          value={Math.min(percentage, 100)}
          sx={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            bgcolor: alpha(options?.color || '#2196F3', 0.1),
            '& .MuiLinearProgress-bar': {
              bgcolor: options?.color || '#2196F3',
            },
          }}
        />
        <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: 40 }}>
          {value}/{max}
        </span>
      </Box>
    );
  },
});

/**
 * Creates a chip column with color mapping
 */
export const createChipColumn = (
  field: string,
  headerName: string,
  colorMap: Record<string, string>,
  options?: {
    width?: number;
  }
): GridColDef => ({
  field,
  headerName,
  width: options?.width || 140,
  renderCell: (params: GridRenderCellParams) => {
    if (!params.value) return '-';

    const value = String(params.value);
    const color = colorMap[value] || '#757575';

    return (
      <Chip
        label={value}
        size="small"
        sx={{
          bgcolor: alpha(color, 0.1),
          color,
          fontWeight: 600,
          fontSize: '0.75rem',
          border: `1px solid ${alpha(color, 0.3)}`,
        }}
      />
    );
  },
});

/**
 * Creates a tooltip column with rich content
 */
export const createTooltipColumn = <T extends Record<string, unknown> = Record<string, unknown>>(
  field: string,
  headerName: string,
  renderTooltip: (value: unknown, row: T) => React.ReactNode,
  options?: {
    width?: number;
    displayValue?: (value: unknown) => string;
  }
): GridColDef<T> => ({
  field,
  headerName,
  width: options?.width || 150,
  renderCell: (params: GridRenderCellParams) => {
    const displayValue = options?.displayValue
      ? options.displayValue(params.value)
      : String(params.value || '-');

    return (
      <Tooltip title={renderTooltip(params.value, params.row)} arrow>
        <span>{displayValue}</span>
      </Tooltip>
    );
  },
});

/**
 * Creates a boolean column with checkmark/cross icons
 */
export const createBooleanColumn = (
  field: string,
  headerName: string,
  options?: {
    width?: number;
    trueLabel?: string;
    falseLabel?: string;
  }
): GridColDef => ({
  field,
  headerName,
  width: options?.width || 100,
  align: 'center',
  headerAlign: 'center',
  renderCell: (params: GridRenderCellParams) => {
    const isTrue = params.value === true;
    const label = isTrue
      ? options?.trueLabel || 'Yes'
      : options?.falseLabel || 'No';
    const color = isTrue ? '#4CAF50' : '#757575';

    return (
      <Chip
        label={label}
        size="small"
        sx={{
          bgcolor: alpha(color, 0.1),
          color,
          fontWeight: 600,
          fontSize: '0.7rem',
        }}
      />
    );
  },
});

/**
 * Creates a count/number column with chip styling
 */
export const createCountColumn = (
  field: string,
  headerName: string,
  options?: {
    width?: number;
    color?: string;
  }
): GridColDef => ({
  field,
  headerName,
  width: options?.width || 100,
  align: 'center',
  headerAlign: 'center',
  renderCell: (params: GridRenderCellParams) => {
    const count = Number(params.value) || 0;
    const color = options?.color || '#2196F3';

    return (
      <Chip
        label={count}
        size="small"
        sx={{
          bgcolor: alpha(color, 0.1),
          color,
          fontWeight: 700,
          fontSize: '0.75rem',
          minWidth: 32,
        }}
      />
    );
  },
});

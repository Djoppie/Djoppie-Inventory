import { useMemo, memo, useCallback } from 'react';
import {
  Box,
  IconButton,
  Stack,
  Tooltip,
  Chip,
  useTheme,
  alpha,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRowsProp,
  GridToolbarContainer,
  GridToolbarQuickFilter,
  GridRenderCellParams,
  GridRowParams,
  GridPaginationModel,
} from '@mui/x-data-grid';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import DownloadIcon from '@mui/icons-material/Download';
import { getNeumorphColors, getNeumorph, getNeumorphInset } from '../../utils/neumorphicStyles';
import { ASSET_COLOR } from '../../constants/filterColors';

interface CustomToolbarProps {
  accentColor: string;
  isDark: boolean;
  toolbarActions?: React.ReactNode;
  rowCount: number;
  exportable?: boolean;
  onExport?: () => void;
  isExporting?: boolean;
}

declare module '@mui/x-data-grid' {
  interface ToolbarPropsOverrides extends CustomToolbarProps {}
}

export interface NeumorphicDataGridProps<T extends { id: number | string }> {
  rows: T[];
  columns: GridColDef[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  showActiveStatus?: boolean;
  accentColor?: string;
  loading?: boolean;
  checkboxSelection?: boolean;
  rowSelectionModel?: any;
  onRowSelectionModelChange?: any;
  toolbarActions?: React.ReactNode;
  initialPageSize?: number;
  autoHeight?: boolean;
  getRowClassName?: (params: GridRowParams) => string;

  // NEW: Export functionality
  exportable?: boolean;
  onExport?: () => void;
  isExporting?: boolean;

  // NEW: Statistics cards (rendered above table)
  statisticsCards?: React.ReactNode;

  // NEW: Advanced filters (rendered between stats and table)
  advancedFilters?: React.ReactNode;

  // NEW: Row click handler
  onRowClick?: (row: T) => void;

  // NEW: Sticky header with max height
  stickyHeader?: boolean;
  maxHeight?: number | string;

  // NEW: Column visibility model for responsive columns
  columnVisibilityModel?: any;
}

const CustomToolbar = memo(function CustomToolbar({
  accentColor,
  isDark,
  toolbarActions,
  rowCount,
  exportable,
  onExport,
  isExporting,
}: CustomToolbarProps) {
  const { bgBase } = getNeumorphColors(isDark);
  return (
    <GridToolbarContainer
      sx={{
        p: 1.5,
        gap: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          flex: { xs: 1, md: '0 0 280px' },
          '& .MuiOutlinedInput-root': {
            bgcolor: bgBase,
            borderRadius: 1.5,
            fontSize: '0.85rem',
            boxShadow: getNeumorphInset(isDark),
            '& fieldset': { border: 'none' },
            '&:hover': {
              boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 1px ${alpha(accentColor, 0.3)}`,
            },
            '&.Mui-focused': {
              boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 2px ${alpha(accentColor, 0.4)}`,
            },
          },
          '& .MuiInputBase-input': {
            py: 0.75,
          },
        }}
      >
        <GridToolbarQuickFilter />
      </Box>
      {toolbarActions}
      {exportable && onExport && (
        <Button
          variant="outlined"
          size="small"
          startIcon={isExporting ? <CircularProgress size={14} /> : <DownloadIcon />}
          onClick={onExport}
          disabled={isExporting}
          sx={{
            borderColor: alpha(accentColor, 0.35),
            color: accentColor,
            fontSize: '0.75rem',
            fontWeight: 600,
            py: 0.5,
            px: 1.5,
            borderRadius: 1,
            textTransform: 'none',
            bgcolor: bgBase,
            boxShadow: getNeumorph(isDark, 'soft'),
            '&:hover': {
              bgcolor: alpha(accentColor, 0.08),
              borderColor: accentColor,
            },
            '&.Mui-disabled': {
              opacity: 0.5,
            },
          }}
        >
          Export
        </Button>
      )}
      <Box sx={{ ml: 'auto' }}>
        <Chip
          size="small"
          label={`${rowCount} items`}
          sx={{
            height: 24,
            fontSize: '0.7rem',
            fontWeight: 600,
            bgcolor: alpha(accentColor, 0.1),
            color: accentColor,
            border: 'none',
          }}
        />
      </Box>
    </GridToolbarContainer>
  );
});

// Status column definition helper
export function getStatusColumn(_accentColor: string = ASSET_COLOR): GridColDef {
  return {
    field: 'isActive',
    headerName: 'Status',
    width: 80,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params: GridRenderCellParams) =>
      params.value ? (
        <Tooltip title="Active" arrow>
          <CheckCircleOutlineIcon sx={{ fontSize: 18, color: '#4CAF50' }} />
        </Tooltip>
      ) : (
        <Tooltip title="Inactive" arrow>
          <HighlightOffIcon sx={{ fontSize: 18, color: alpha('#F44336', 0.6) }} />
        </Tooltip>
      ),
    filterable: true,
    type: 'boolean',
  };
}

// Actions column definition helper
export function getActionsColumn<T extends { id: number | string }>(
  onEdit?: (item: T) => void,
  onDelete?: (item: T) => void,
  accentColor: string = ASSET_COLOR,
): GridColDef {
  return {
    field: 'actions',
    headerName: 'Actions',
    width: 100,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    renderCell: (params: GridRenderCellParams) => (
      <Stack direction="row" spacing={0.5} justifyContent="center">
        {onEdit && (
          <Tooltip title="Edit" arrow>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onEdit(params.row as T); }}
              sx={{
                width: 28,
                height: 28,
                borderRadius: 0.75,
                color: accentColor,
                border: '1px solid',
                borderColor: alpha(accentColor, 0.35),
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: alpha(accentColor, 0.08),
                  borderColor: accentColor,
                },
              }}
            >
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
        {onDelete && (
          <Tooltip title="Delete" arrow>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onDelete(params.row as T); }}
              sx={{
                width: 28,
                height: 28,
                borderRadius: 0.75,
                color: '#EF5350',
                border: '1px solid',
                borderColor: alpha('#EF5350', 0.35),
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: alpha('#EF5350', 0.08),
                  borderColor: '#EF5350',
                },
              }}
            >
              <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    ),
  };
}

const NeumorphicDataGrid = memo(function NeumorphicDataGrid<T extends { id: number | string; isActive?: boolean }>({
  rows,
  columns,
  onEdit,
  onDelete,
  showActiveStatus = false,
  accentColor = ASSET_COLOR,
  loading = false,
  checkboxSelection = false,
  rowSelectionModel,
  onRowSelectionModelChange,
  toolbarActions,
  initialPageSize = 15,
  autoHeight = true,
  getRowClassName,
  exportable = false,
  onExport,
  isExporting = false,
  statisticsCards,
  advancedFilters,
  onRowClick,
  stickyHeader: _stickyHeader = false,
  maxHeight,
  columnVisibilityModel,
}: NeumorphicDataGridProps<T>) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgBase, bgSurface } = getNeumorphColors(isDark);

  // Build final columns: user columns + status + actions
  const finalColumns = useMemo(() => {
    const cols: GridColDef[] = [...columns];
    if (showActiveStatus) {
      cols.push(getStatusColumn(accentColor));
    }
    if (onEdit || onDelete) {
      cols.push(getActionsColumn<T>(onEdit, onDelete, accentColor));
    }
    return cols;
  }, [columns, showActiveStatus, onEdit, onDelete, accentColor]);

  const paginationModel: GridPaginationModel = useMemo(
    () => ({ pageSize: initialPageSize, page: 0 }),
    [initialPageSize]
  );

  // Build initialState - do NOT mix initialState.rowSelection with controlled props
  const gridInitialState = useMemo(() => ({
    pagination: { paginationModel },
  }), [paginationModel]);

  // Memoize row click handler
  const handleRowClick = useCallback(
    (params: GridRowParams) => {
      if (onRowClick) {
        onRowClick(params.row as T);
      }
    },
    [onRowClick]
  );

  // Memoize row className getter
  const getRowClass = useCallback(
    (params: GridRowParams) => {
      if (getRowClassName) {
        return getRowClassName(params);
      }
      if (showActiveStatus && params.row.isActive === false) {
        return 'row-inactive';
      }
      return '';
    },
    [getRowClassName, showActiveStatus]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Statistics Cards Section */}
      {statisticsCards && <Box>{statisticsCards}</Box>}

      {/* Advanced Filters Section */}
      {advancedFilters && <Box>{advancedFilters}</Box>}

      {/* Data Grid Section */}
      <Box
        sx={{
          bgcolor: bgBase,
          borderRadius: 3,
          p: { xs: 1.5, sm: 2 },
          boxShadow: getNeumorph(isDark, 'medium'),
        }}
      >
      <DataGrid
        rows={rows as GridRowsProp}
        columns={finalColumns}
        loading={loading}
        autoHeight={autoHeight}
        checkboxSelection={checkboxSelection}
        rowSelectionModel={checkboxSelection ? (rowSelectionModel ?? []) : undefined}
        onRowSelectionModelChange={checkboxSelection ? (onRowSelectionModelChange ?? (() => {})) : undefined}
        {...(columnVisibilityModel && { columnVisibilityModel })}
        disableRowSelectionOnClick={!onRowClick}
        {...(onRowClick && { onRowClick: handleRowClick })}
        initialState={gridInitialState}
        pageSizeOptions={[10, 15, 25, 50]}
        getRowClassName={getRowClass}
        slots={{
          toolbar: CustomToolbar,
          footer: () => null,
        }}
        slotProps={{
          toolbar: {
            accentColor,
            isDark,
            toolbarActions,
            rowCount: rows.length,
            exportable,
            onExport,
            isExporting,
          },
        }}
        sx={{
          bgcolor: bgSurface,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          fontSize: '0.85rem',
          ...(maxHeight && {
            maxHeight,
            '& .MuiDataGrid-virtualScroller': {
              maxHeight,
            },
          }),
          ...(onRowClick && {
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
            },
          }),

          // Header styling
          '& .MuiDataGrid-columnHeaders': {
            bgcolor: isDark ? alpha(accentColor, 0.08) : alpha(accentColor, 0.04),
            borderBottom: '2px solid',
            borderColor: accentColor,
          },
          '& .MuiDataGrid-columnHeader': {
            py: 1,
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 700,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
          '& .MuiDataGrid-sortIcon': {
            color: accentColor,
          },
          '& .MuiDataGrid-menuIconButton': {
            color: alpha(accentColor, 0.6),
          },

          // Row styling
          '& .MuiDataGrid-row': {
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: isDark ? alpha(accentColor, 0.08) : alpha(accentColor, 0.04),
            },
            '&.Mui-selected': {
              bgcolor: alpha(accentColor, isDark ? 0.15 : 0.08),
              '&:hover': {
                bgcolor: alpha(accentColor, isDark ? 0.2 : 0.12),
              },
            },
            '&:nth-of-type(even)': {
              bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              '&:hover': {
                bgcolor: isDark ? alpha(accentColor, 0.08) : alpha(accentColor, 0.04),
              },
            },
          },
          '& .row-inactive': {
            opacity: 0.5,
          },

          // Cell styling
          '& .MuiDataGrid-cell': {
            py: 1,
            px: 1.5,
            fontSize: '0.85rem',
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          },

          // Checkbox styling
          '& .MuiCheckbox-root': {
            color: alpha(accentColor, 0.5),
            '&.Mui-checked, &.MuiCheckbox-indeterminate': {
              color: accentColor,
            },
          },

          // Pagination styling
          '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid',
            borderColor: 'divider',
          },
          '& .MuiTablePagination-root': {
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontSize: '0.75rem',
            },
            '& .MuiTablePagination-select': {
              fontSize: '0.75rem',
            },
            '& .MuiIconButton-root': {
              bgcolor: bgBase,
              boxShadow: getNeumorph(isDark, 'soft'),
              mx: 0.25,
              '&:hover': {
                bgcolor: alpha(accentColor, 0.1),
              },
              '&.Mui-disabled': {
                opacity: 0.4,
              },
            },
          },

          // Column resize handle
          '& .MuiDataGrid-columnSeparator': {
            color: alpha(accentColor, 0.3),
            '&:hover': {
              color: accentColor,
            },
          },

          // Overlay (loading/no rows)
          '& .MuiDataGrid-overlay': {
            bgcolor: alpha(bgSurface, 0.8),
          },

          // Scrollbar
          '& .MuiDataGrid-virtualScroller::-webkit-scrollbar': {
            height: 8,
            width: 8,
          },
          '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track': {
            bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            borderRadius: 4,
          },
          '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb': {
            bgcolor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
            borderRadius: 4,
            '&:hover': {
              bgcolor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
            },
          },
        }}
      />
      </Box>
    </Box>
  );
}) as <T extends { id: number | string; isActive?: boolean }>(
  props: NeumorphicDataGridProps<T>
) => React.ReactElement;

export default NeumorphicDataGrid;

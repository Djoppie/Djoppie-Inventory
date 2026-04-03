import { useState, useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  TextField,
  IconButton,
  Chip,
  Typography,
  InputAdornment,
  useTheme,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  alpha,
  Checkbox,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { ASSET_COLOR } from '../../constants/filterColors';

type Order = 'asc' | 'desc';
type StatusFilter = 'all' | 'active' | 'inactive';

export interface Column<T> {
  id: keyof T | string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: T) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
}

interface AdminDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  getItemId: (item: T) => number | string;
  showActiveStatus?: boolean;
  title?: string;
  defaultRowsPerPage?: number;
  // Selection support
  selectable?: boolean;
  selectedIds?: Set<number | string>;
  onSelectionChange?: (selectedIds: Set<number | string>) => void;
  // Custom actions support
  renderActions?: (item: T) => React.ReactNode;
  actionsColumnWidth?: number;
  // External search control
  externalSearchTerm?: string;
  onSearchTermChange?: (value: string) => void;
  hideSearch?: boolean;
}

// Neumorphic shadow utilities
const getNeumorph = (isDark: boolean, intensity: 'soft' | 'medium' | 'strong' = 'medium') => {
  const shadows = {
    soft: isDark
      ? '4px 4px 8px rgba(0,0,0,0.4), -2px -2px 6px rgba(255,255,255,0.03)'
      : '4px 4px 8px rgba(0,0,0,0.08), -2px -2px 6px rgba(255,255,255,0.8)',
    medium: isDark
      ? '6px 6px 12px rgba(0,0,0,0.5), -3px -3px 8px rgba(255,255,255,0.04)'
      : '6px 6px 12px rgba(0,0,0,0.1), -3px -3px 8px rgba(255,255,255,0.9)',
    strong: isDark
      ? '8px 8px 16px rgba(0,0,0,0.6), -4px -4px 10px rgba(255,255,255,0.05)'
      : '8px 8px 16px rgba(0,0,0,0.12), -4px -4px 10px rgba(255,255,255,1)',
  };
  return shadows[intensity];
};

const getNeumorphInset = (isDark: boolean) =>
  isDark
    ? 'inset 2px 2px 4px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.03)'
    : 'inset 2px 2px 4px rgba(0,0,0,0.06), inset -1px -1px 3px rgba(255,255,255,0.7)';

function AdminDataTable<T extends object & { isActive?: boolean }>({
  data,
  columns,
  onEdit,
  onDelete,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data available',
  getItemId,
  showActiveStatus = false,
  defaultRowsPerPage = 15,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  renderActions,
  actionsColumnWidth = 80,
  externalSearchTerm,
  onSearchTermChange,
  hideSearch = false,
}: AdminDataTableProps<T>) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [internalSearchTerm, setInternalSearchTerm] = useState('');

  // Use external search term if provided, otherwise use internal
  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;
  const setSearchTerm = (value: string) => {
    if (onSearchTermChange) {
      onSearchTermChange(value);
    } else {
      setInternalSearchTerm(value);
    }
  };
  const [orderBy, setOrderBy] = useState<keyof T | string>('');
  const [order, setOrder] = useState<Order>('asc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  // Theme colors
  const bgBase = isDark ? '#1a1f2e' : '#f0f2f5';
  const bgSurface = isDark ? '#232936' : '#ffffff';
  const accentColor = ASSET_COLOR;

  const handleRequestSort = (property: keyof T | string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleStatusFilterChange = (
    _event: React.MouseEvent<HTMLElement>,
    newFilter: StatusFilter | null
  ) => {
    if (newFilter !== null) {
      setStatusFilter(newFilter);
      setPage(0);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Selection handlers
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSelectionChange) return;
    if (event.target.checked) {
      const allIds = new Set(filteredAndSortedData.map((item) => getItemId(item)));
      onSelectionChange(allIds);
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectOne = (id: number | string) => {
    if (!onSelectionChange) return;
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    onSelectionChange(newSelected);
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = [...data];

    if (showActiveStatus && statusFilter !== 'all') {
      filtered = filtered.filter((item) =>
        statusFilter === 'active' ? item.isActive === true : item.isActive === false
      );
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((item) => {
        return columns.some((column) => {
          if (column.searchable !== false) {
            const value = item[column.id as keyof T];
            return String(value).toLowerCase().includes(searchLower);
          }
          return false;
        });
      });
    }

    if (orderBy) {
      filtered.sort((a, b) => {
        const aValue = a[orderBy as keyof T];
        const bValue = b[orderBy as keyof T];
        if (aValue === bValue) return 0;
        const comparison = aValue < bValue ? -1 : 1;
        return order === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, orderBy, order, columns, statusFilter, showActiveStatus]);

  const activeCount = useMemo(
    () => data.filter((item) => item.isActive === true).length,
    [data]
  );
  const inactiveCount = useMemo(
    () => data.filter((item) => item.isActive === false).length,
    [data]
  );

  const paginatedData = useMemo(() => {
    return filteredAndSortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredAndSortedData, page, rowsPerPage]);

  return (
    <Box
      sx={{
        bgcolor: bgBase,
        borderRadius: 3,
        p: { xs: 1.5, sm: 2 },
        boxShadow: getNeumorph(isDark, 'medium'),
      }}
    >
      {/* Compact Toolbar */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 1.5,
          mb: 2,
          p: 1.5,
          bgcolor: bgSurface,
          borderRadius: 2,
          boxShadow: getNeumorphInset(isDark),
        }}
      >
        {/* Search */}
        {!hideSearch && (
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSearchTerm('');
                      setPage(0);
                    }}
                    sx={{ p: 0.25 }}
                  >
                    <ClearIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
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
          />
        )}

        {/* Status Filter Pills */}
        {showActiveStatus && (
          <ToggleButtonGroup
            value={statusFilter}
            exclusive
            onChange={handleStatusFilterChange}
            size="small"
            sx={{
              bgcolor: bgBase,
              borderRadius: 1.5,
              boxShadow: getNeumorphInset(isDark),
              p: 0.25,
              '& .MuiToggleButton-root': {
                border: 'none',
                borderRadius: '6px !important',
                px: 1.5,
                py: 0.4,
                fontSize: '0.75rem',
                fontWeight: 500,
                textTransform: 'none',
                color: 'text.secondary',
                transition: 'all 0.15s ease',
                '&.Mui-selected': {
                  bgcolor: bgSurface,
                  color: accentColor,
                  boxShadow: getNeumorph(isDark, 'soft'),
                  '&:hover': {
                    bgcolor: bgSurface,
                  },
                },
                '&:hover:not(.Mui-selected)': {
                  bgcolor: alpha(accentColor, 0.05),
                },
              },
            }}
          >
            <ToggleButton value="all">All ({data.length})</ToggleButton>
            <ToggleButton value="active">Active ({activeCount})</ToggleButton>
            <ToggleButton value="inactive">Inactive ({inactiveCount})</ToggleButton>
          </ToggleButtonGroup>
        )}

        {/* Stats */}
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            size="small"
            label={`${filteredAndSortedData.length} items`}
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
      </Box>

      {/* Table Container */}
      <TableContainer
        sx={{
          bgcolor: bgSurface,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflowX: 'auto',
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
            borderRadius: 4,
            '&:hover': {
              bgcolor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
            },
          },
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow
              sx={{
                bgcolor: isDark ? alpha(ASSET_COLOR, 0.08) : alpha(ASSET_COLOR, 0.04),
                borderBottom: '2px solid',
                borderColor: ASSET_COLOR,
              }}
            >
              {selectable && (
                <TableCell
                  padding="checkbox"
                  sx={{
                    py: 1.5,
                    px: 0.5,
                    width: 42,
                  }}
                >
                  <Checkbox
                    indeterminate={selectedIds.size > 0 && selectedIds.size < filteredAndSortedData.length}
                    checked={filteredAndSortedData.length > 0 && selectedIds.size === filteredAndSortedData.length}
                    onChange={handleSelectAll}
                    sx={{
                      color: alpha(accentColor, 0.5),
                      '&.Mui-checked, &.MuiCheckbox-indeterminate': {
                        color: accentColor,
                      },
                    }}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={String(column.id)}
                  align={column.align || 'left'}
                  sx={{
                    py: 1.5,
                    px: 1.5,
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                    minWidth: column.minWidth,
                  }}
                >
                  {column.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                      sx={{
                        '&.Mui-active': { color: accentColor },
                        '& .MuiTableSortLabel-icon': { color: `${accentColor} !important`, fontSize: 16 },
                        '&:hover': { color: accentColor },
                      }}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {showActiveStatus && (
                <TableCell
                  align="center"
                  sx={{
                    py: 1.5,
                    px: 1,
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: 70,
                  }}
                >
                  Status
                </TableCell>
              )}
              <TableCell
                align="center"
                sx={{
                  py: 1.5,
                  px: 1,
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  width: actionsColumnWidth,
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (showActiveStatus ? 1 : 0) + 1 + (selectable ? 1 : 0)}
                  sx={{ py: 4, textAlign: 'center' }}
                >
                  <TableRowsIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm || statusFilter !== 'all' ? 'No matching results' : emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, idx) => {
                const isInactive = showActiveStatus && !item.isActive;
                const itemId = getItemId(item);
                const isSelected = selectedIds.has(itemId);
                return (
                  <TableRow
                    key={itemId}
                    selected={isSelected}
                    hover
                    sx={{
                      bgcolor: isSelected
                        ? alpha(accentColor, isDark ? 0.15 : 0.08)
                        : idx % 2 === 1
                        ? isDark
                          ? 'rgba(255, 255, 255, 0.02)'
                          : 'rgba(0, 0, 0, 0.02)'
                        : 'transparent',
                      opacity: isInactive ? 0.5 : 1,
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: isDark ? alpha(ASSET_COLOR, 0.08) : alpha(ASSET_COLOR, 0.04),
                      },
                    }}
                  >
                    {selectable && (
                      <TableCell
                        padding="checkbox"
                        sx={{
                          py: 1,
                          px: 0.5,
                        }}
                      >
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleSelectOne(itemId)}
                          sx={{
                            color: alpha(accentColor, 0.5),
                            '&.Mui-checked': {
                              color: accentColor,
                            },
                          }}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell
                        key={String(column.id)}
                        align={column.align || 'left'}
                        sx={{
                          py: 1,
                          px: 1.5,
                          fontSize: '0.85rem',
                        }}
                      >
                        {column.format
                          ? column.format(item)
                          : String(item[column.id as keyof T] ?? '-')}
                      </TableCell>
                    ))}
                    {showActiveStatus && (
                      <TableCell
                        align="center"
                        sx={{
                          py: 1,
                          px: 1,
                        }}
                      >
                        {item.isActive ? (
                          <Tooltip title="Active" arrow>
                            <CheckCircleOutlineIcon
                              sx={{ fontSize: 18, color: '#4CAF50' }}
                            />
                          </Tooltip>
                        ) : (
                          <Tooltip title="Inactive" arrow>
                            <HighlightOffIcon
                              sx={{ fontSize: 18, color: alpha('#F44336', 0.6) }}
                            />
                          </Tooltip>
                        )}
                      </TableCell>
                    )}
                    <TableCell
                      align="center"
                      sx={{
                        py: 1,
                        px: 0.5,
                      }}
                    >
                      {renderActions ? (
                        renderActions(item)
                      ) : (
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          {onEdit && (
                            <Tooltip title="Edit" arrow>
                              <IconButton
                                size="small"
                                onClick={() => onEdit(item)}
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 0.75,
                                  bgcolor: 'transparent',
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
                                onClick={() => onDelete(item)}
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 0.75,
                                  bgcolor: 'transparent',
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
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Compact Pagination */}
      <Box
        sx={{
          mt: 1.5,
          px: 1.5,
          py: 0.75,
          bgcolor: bgSurface,
          borderRadius: 1.5,
          boxShadow: getNeumorph(isDark, 'soft'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <TablePagination
          component="div"
          count={filteredAndSortedData.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 15, 25, 50]}
          sx={{
            '& .MuiTablePagination-toolbar': {
              minHeight: 32,
              pl: 0,
            },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontSize: '0.75rem',
              m: 0,
            },
            '& .MuiTablePagination-select': {
              fontSize: '0.75rem',
            },
            '& .MuiTablePagination-actions': {
              ml: 1,
              '& .MuiIconButton-root': {
                p: 0.5,
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
          }}
        />
      </Box>
    </Box>
  );
}

export default AdminDataTable;

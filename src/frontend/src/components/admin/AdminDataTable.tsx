import { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  IconButton,
  Chip,
  Typography,
  InputAdornment,
  useTheme,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

type Order = 'asc' | 'desc';

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
}

function AdminDataTable<T extends Record<string, unknown>>({
  data,
  columns,
  onEdit,
  onDelete,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data available',
  getItemId,
  showActiveStatus = false,
}: AdminDataTableProps<T>) {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrderBy] = useState<keyof T | string>('');
  const [order, setOrder] = useState<Order>('asc');

  const handleRequestSort = (property: keyof T | string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = [...data];

    // Apply search filter
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

    // Apply sorting
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
  }, [data, searchTerm, orderBy, order, columns]);

  return (
    <Box>
      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              background: theme.palette.mode === 'light' ? '#FFFFFF' : '#0A0D12',
            },
          }}
        />
      </Box>

      {/* Data Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          boxShadow:
            theme.palette.mode === 'light'
              ? '6px 6px 12px rgba(0, 0, 0, 0.15), -6px -6px 12px rgba(255, 255, 255, 0.95)'
              : '8px 8px 18px rgba(0, 0, 0, 0.75), -5px -5px 12px rgba(255, 255, 255, 0.06)',
        }}
      >
        <Table>
          <TableHead>
            <TableRow
              sx={{
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 119, 0, 0.05)'
                    : 'rgba(255, 119, 0, 0.02)',
              }}
            >
              {columns.map((column) => (
                <TableCell
                  key={String(column.id)}
                  align={column.align || 'left'}
                  style={{ minWidth: column.minWidth }}
                  sx={{ fontWeight: 700 }}
                >
                  {column.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                      sx={{
                        '&.Mui-active': {
                          color: 'primary.main',
                        },
                        '& .MuiTableSortLabel-icon': {
                          color: 'primary.main !important',
                        },
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
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  Status
                </TableCell>
              )}
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (showActiveStatus ? 1 : 0) + 1} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedData.map((item) => (
                <TableRow
                  key={getItemId(item)}
                  hover
                  sx={{
                    '&:hover': {
                      backgroundColor:
                        theme.palette.mode === 'dark'
                          ? 'rgba(255, 119, 0, 0.05)'
                          : 'rgba(255, 119, 0, 0.02)',
                    },
                  }}
                >
                  {columns.map((column) => (
                    <TableCell key={String(column.id)} align={column.align || 'left'}>
                      {column.format
                        ? column.format(item)
                        : String(item[column.id as keyof T] ?? '-')}
                    </TableCell>
                  ))}
                  {showActiveStatus && (
                    <TableCell align="center">
                      {item.isActive ? (
                        <Chip
                          icon={<CheckCircleIcon sx={{ color: '#FFFFFF !important' }} />}
                          label="Active"
                          size="small"
                          sx={{
                            fontWeight: 600,
                            borderRadius: '20px',
                            backgroundColor: '#10B981',
                            color: '#FFFFFF',
                            '& .MuiChip-icon': {
                              color: '#FFFFFF',
                            },
                          }}
                        />
                      ) : (
                        <Chip
                          icon={<CancelIcon sx={{ color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280' }} />}
                          label="Inactive"
                          size="small"
                          sx={{
                            fontWeight: 600,
                            borderRadius: '20px',
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.15)'
                                : 'rgba(0, 0, 0, 0.12)',
                            color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280',
                          }}
                        />
                      )}
                    </TableCell>
                  )}
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {onEdit && (
                      <IconButton
                        size="small"
                        onClick={() => onEdit(item)}
                        sx={{
                          color: 'primary.main',
                          mr: 0.5,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? 'rgba(255, 119, 0, 0.1)'
                                : 'rgba(255, 119, 0, 0.05)',
                            transform: 'scale(1.1)',
                          },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    {onDelete && (
                      <IconButton
                        size="small"
                        onClick={() => onDelete(item)}
                        sx={{
                          color: 'error.main',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? 'rgba(244, 67, 54, 0.1)'
                                : 'rgba(244, 67, 54, 0.05)',
                            transform: 'scale(1.1)',
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Results Counter */}
      <Box sx={{ mt: 2, textAlign: 'right' }}>
        <Typography variant="caption" color="text.secondary">
          Showing {filteredAndSortedData.length} of {data.length} items
        </Typography>
      </Box>
    </Box>
  );
}

export default AdminDataTable;

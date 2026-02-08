import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Typography,
  Pagination,
  Stack,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Asset } from '../../types/asset.types';
import StatusBadge from '../common/StatusBadge';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

interface AssetTableViewProps {
  assets: Asset[];
}

type SortField = 'assetCode' | 'assetName' | 'category' | 'owner' | 'building' | 'status';
type SortOrder = 'asc' | 'desc';

const AssetTableView = ({ assets }: AssetTableViewProps) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField>('assetCode');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Sort assets
  const sortedAssets = [...assets].sort((a, b) => {
    const aValue = a[sortField] ?? '';
    const bValue = b[sortField] ?? '';

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedAssets.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentAssets = sortedAssets.slice(startIndex, endIndex);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRowsPerPageChange = (event: SelectChangeEvent<number>) => {
    setRowsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  const handleRowClick = (assetId: number) => {
    navigate(`/assets/${assetId}`);
  };

  if (assets.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          No assets found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create your first asset to get started
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Table Container with Neumorphic Styling */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          overflow: 'hidden',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(255, 119, 0, 0.03) 0%, transparent 50%)'
              : '#ffffff',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.05)'
              : '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.9)',
        }}
      >
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow
              sx={{
                background: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(255, 119, 0, 0.15) 0%, rgba(204, 0, 0, 0.08) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 119, 0, 0.12) 0%, rgba(204, 0, 0, 0.06) 100%)',
                borderBottom: '2px solid',
                borderColor: 'divider',
              }}
            >
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'primary.main',
                  py: 2,
                }}
              >
                <TableSortLabel
                  active={sortField === 'assetCode'}
                  direction={sortField === 'assetCode' ? sortOrder : 'asc'}
                  onClick={() => handleSort('assetCode')}
                  IconComponent={sortOrder === 'asc' ? ArrowUpwardIcon : ArrowDownwardIcon}
                  sx={{
                    '&:hover': {
                      color: 'primary.main',
                    },
                    '&.Mui-active': {
                      color: 'primary.main',
                      fontWeight: 800,
                    },
                  }}
                >
                  Asset Code
                </TableSortLabel>
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'primary.main',
                }}
              >
                <TableSortLabel
                  active={sortField === 'status'}
                  direction={sortField === 'status' ? sortOrder : 'asc'}
                  onClick={() => handleSort('status')}
                  IconComponent={sortOrder === 'asc' ? ArrowUpwardIcon : ArrowDownwardIcon}
                  sx={{
                    '&:hover': {
                      color: 'primary.main',
                    },
                    '&.Mui-active': {
                      color: 'primary.main',
                      fontWeight: 800,
                    },
                  }}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'primary.main',
                }}
              >
                <TableSortLabel
                  active={sortField === 'assetName'}
                  direction={sortField === 'assetName' ? sortOrder : 'asc'}
                  onClick={() => handleSort('assetName')}
                  IconComponent={sortOrder === 'asc' ? ArrowUpwardIcon : ArrowDownwardIcon}
                  sx={{
                    '&:hover': {
                      color: 'primary.main',
                    },
                    '&.Mui-active': {
                      color: 'primary.main',
                      fontWeight: 800,
                    },
                  }}
                >
                  Asset Name
                </TableSortLabel>
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'primary.main',
                }}
              >
                <TableSortLabel
                  active={sortField === 'category'}
                  direction={sortField === 'category' ? sortOrder : 'asc'}
                  onClick={() => handleSort('category')}
                  IconComponent={sortOrder === 'asc' ? ArrowUpwardIcon : ArrowDownwardIcon}
                  sx={{
                    '&:hover': {
                      color: 'primary.main',
                    },
                    '&.Mui-active': {
                      color: 'primary.main',
                      fontWeight: 800,
                    },
                  }}
                >
                  Category
                </TableSortLabel>
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'primary.main',
                }}
              >
                <TableSortLabel
                  active={sortField === 'owner'}
                  direction={sortField === 'owner' ? sortOrder : 'asc'}
                  onClick={() => handleSort('owner')}
                  IconComponent={sortOrder === 'asc' ? ArrowUpwardIcon : ArrowDownwardIcon}
                  sx={{
                    '&:hover': {
                      color: 'primary.main',
                    },
                    '&.Mui-active': {
                      color: 'primary.main',
                      fontWeight: 800,
                    },
                  }}
                >
                  Owner
                </TableSortLabel>
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'primary.main',
                }}
              >
                <TableSortLabel
                  active={sortField === 'building'}
                  direction={sortField === 'building' ? sortOrder : 'asc'}
                  onClick={() => handleSort('building')}
                  IconComponent={sortOrder === 'asc' ? ArrowUpwardIcon : ArrowDownwardIcon}
                  sx={{
                    '&:hover': {
                      color: 'primary.main',
                    },
                    '&.Mui-active': {
                      color: 'primary.main',
                      fontWeight: 800,
                    },
                  }}
                >
                  Location
                </TableSortLabel>
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'primary.main',
                  width: 100,
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentAssets.map((asset, index) => (
              <TableRow
                key={asset.id}
                onClick={() => handleRowClick(asset.id)}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  backgroundColor:
                    index % 2 === 0
                      ? (theme) =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.02)'
                            : 'rgba(0, 0, 0, 0.01)'
                      : 'transparent',
                  '&:hover': {
                    backgroundColor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 119, 0, 0.08)'
                        : 'rgba(255, 119, 0, 0.05)',
                    boxShadow: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'inset 0 0 0 1px rgba(255, 119, 0, 0.2)'
                        : 'inset 0 0 0 1px rgba(255, 119, 0, 0.15)',
                    transform: 'scale(1.005)',
                  },
                  '&:last-child td': {
                    borderBottom: 0,
                  },
                }}
              >
                <TableCell
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: 'primary.main',
                  }}
                >
                  {asset.assetCode}
                </TableCell>
                <TableCell>
                  <StatusBadge status={asset.status} />
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.95rem',
                  }}
                >
                  {asset.assetName}
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: '0.9rem',
                    color: 'text.secondary',
                  }}
                >
                  {asset.category}
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: '0.9rem',
                  }}
                >
                  {asset.owner}
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: '0.9rem',
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {asset.building}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {asset.department} {asset.officeLocation && `/ ${asset.officeLocation}`}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="View Details" arrow>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(asset.id);
                      }}
                      sx={{
                        color: 'primary.main',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 119, 0, 0.15)',
                          transform: 'scale(1.1)',
                          boxShadow: '0 0 12px rgba(255, 119, 0, 0.4)',
                        },
                      }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Controls */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          py: 2,
        }}
      >
        {/* Rows per page selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            Rows per page:
          </Typography>
          <FormControl size="small">
            <Select
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
              sx={{
                minWidth: 80,
                fontWeight: 600,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'divider',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                  borderWidth: 2,
                },
              }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            Showing {startIndex + 1}-{Math.min(endIndex, assets.length)} of {assets.length}
          </Typography>
        </Box>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPaginationItem-root': {
                fontWeight: 600,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: '0 0 12px rgba(255, 119, 0, 0.4)',
                },
              },
              '& .Mui-selected': {
                background: 'linear-gradient(135deg, var(--djoppie-orange-500), var(--djoppie-red-500))',
                color: '#fff',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(255, 119, 0, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, var(--djoppie-orange-600), var(--djoppie-red-600))',
                },
              },
            }}
          />
        )}
      </Box>
    </Stack>
  );
};

export default AssetTableView;

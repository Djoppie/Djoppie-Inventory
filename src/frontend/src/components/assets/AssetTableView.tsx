import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  Checkbox,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Asset } from '../../types/asset.types';
import StatusBadge from '../common/StatusBadge';
import VisibilityIcon from '@mui/icons-material/Visibility';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import AppsIcon from '@mui/icons-material/Apps';
import DevicesIcon from '@mui/icons-material/Devices';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';

interface AssetTableViewProps {
  assets: Asset[];
  selectable?: boolean;
  selectedAssetIds?: Set<number>;
  onSelectionChange?: (assetId: number, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
}

type SortField = 'assetCode' | 'serialNumber' | 'assetType' | 'purchaseDate' | 'model' | 'assignment' | 'owner' | 'status';

// Helper to check if asset is a laptop/notebook (user-assigned)
const isUserAssignedAsset = (asset: Asset): boolean => {
  const category = asset.category?.toLowerCase() || '';
  const assetTypeName = asset.assetType?.name?.toLowerCase() || '';
  const assetTypeCode = asset.assetType?.code?.toLowerCase() || '';

  const laptopKeywords = ['laptop', 'notebook', 'not', 'lap'];
  return laptopKeywords.some(keyword =>
    category.includes(keyword) ||
    assetTypeName.includes(keyword) ||
    assetTypeCode.includes(keyword)
  );
};
type SortOrder = 'asc' | 'desc';

// Responsive display styles for columns
const columnVisibility = {
  // Always visible
  always: {},
  // Hidden on xs, visible from sm up
  smUp: { display: { xs: 'none', sm: 'table-cell' } },
  // Hidden on xs/sm, visible from md up
  mdUp: { display: { xs: 'none', md: 'table-cell' } },
  // Hidden on xs/sm/md, visible from lg up
  lgUp: { display: { xs: 'none', lg: 'table-cell' } },
};

// Compact professional header cell styles - using SxProps type
const headerCellSx: import('@mui/material').SxProps = {
  fontWeight: 600,
  fontSize: { xs: '0.6875rem', sm: '0.75rem' },
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: (theme) => (theme as { palette: { mode: string } }).palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
  whiteSpace: 'nowrap',
  py: { xs: 1, sm: 1.25 },
  px: { xs: 1, sm: 1.5 },
  borderBottom: '2px solid',
  borderColor: (theme) => (theme as { palette: { mode: string } }).palette.mode === 'dark' ? 'rgba(255, 119, 0, 0.2)' : 'rgba(0, 0, 0, 0.08)',
  background: (theme) => (theme as { palette: { mode: string } }).palette.mode === 'dark'
    ? 'linear-gradient(180deg, rgba(255, 119, 0, 0.04) 0%, rgba(255, 119, 0, 0.02) 100%)'
    : 'linear-gradient(180deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0.01) 100%)',
};

const AssetTableView = ({
  assets,
  selectable = false,
  selectedAssetIds = new Set(),
  onSelectionChange,
  onSelectAll,
}: AssetTableViewProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField>('assetCode');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Calculate if all visible assets are selected
  const allSelected = assets.length > 0 && assets.every(a => selectedAssetIds.has(a.id));
  const someSelected = assets.some(a => selectedAssetIds.has(a.id)) && !allSelected;

  // Sort assets
  const sortedAssets = [...assets].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    if (sortField === 'assetType') {
      aValue = a.assetType?.name ?? '';
      bValue = b.assetType?.name ?? '';
    } else if (sortField === 'purchaseDate') {
      aValue = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
      bValue = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
    } else if (sortField === 'assignment') {
      // Sort by owner for laptops, workplace code for fixed assets
      aValue = isUserAssignedAsset(a) ? (a.owner ?? '') : (a.physicalWorkplace?.code ?? '');
      bValue = isUserAssignedAsset(b) ? (b.owner ?? '') : (b.physicalWorkplace?.code ?? '');
    } else {
      aValue = (a[sortField as keyof typeof a] as string) ?? '';
      bValue = (b[sortField as keyof typeof b] as string) ?? '';
    }

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
    <Stack spacing={{ xs: 2, sm: 2.5 }}>
      {/* Table Container - Compact Professional Design */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          borderRadius: { xs: 1, sm: 1.5 },
          overflow: 'auto',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? '#1a1a1a'
              : '#ffffff',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 2px 8px rgba(0, 0, 0, 0.4)'
              : '0 1px 4px rgba(0, 0, 0, 0.05)',
          // Custom scrollbar styling
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': {
            height: 6,
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 119, 0, 0.4)' : 'rgba(0, 0, 0, 0.2)',
            borderRadius: 3,
            '&:hover': {
              background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 119, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)',
            },
          },
        }}
      >
        <Table sx={{ minWidth: { xs: 500, sm: 700, md: 900, lg: 1100 } }}>
          <TableHead>
            <TableRow>
              {/* Selection Checkbox Column */}
              {selectable && (
                <TableCell
                  padding="checkbox"
                  sx={{
                    ...headerCellSx,
                    width: { xs: 42, sm: 48 },
                    px: { xs: 1, sm: 1.5 },
                  }}
                >
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    color="primary"
                    size="small"
                    sx={{
                      '&.Mui-checked': {
                        color: '#FF7700',
                      },
                    }}
                  />
                </TableCell>
              )}

              {/* Asset Code */}
              <TableCell sx={headerCellSx}>
                <TableSortLabel
                  active={sortField === 'assetCode'}
                  direction={sortField === 'assetCode' ? sortOrder : 'asc'}
                  onClick={() => handleSort('assetCode')}
                  IconComponent={UnfoldMoreIcon}
                  sx={{
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    '&:hover': {
                      color: '#FF7700',
                    },
                    '&.Mui-active': {
                      color: '#FF7700',
                      fontWeight: 700,
                    },
                    '& .MuiTableSortLabel-icon': {
                      fontSize: '1rem',
                      opacity: 0.5,
                    },
                  }}
                >
                  {isMobile ? 'Code' : 'Asset Code'}
                </TableSortLabel>
              </TableCell>

              {/* Status */}
              <TableCell sx={headerCellSx}>
                <TableSortLabel
                  active={sortField === 'status'}
                  direction={sortField === 'status' ? sortOrder : 'asc'}
                  onClick={() => handleSort('status')}
                  IconComponent={UnfoldMoreIcon}
                  sx={{
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    '&:hover': { color: '#FF7700' },
                    '&.Mui-active': { color: '#FF7700', fontWeight: 700 },
                    '& .MuiTableSortLabel-icon': { fontSize: '1rem', opacity: 0.5 },
                  }}
                >
                  Status
                </TableSortLabel>
              </TableCell>

              {/* Asset Type */}
              <TableCell sx={{ ...headerCellSx, ...columnVisibility.smUp }}>
                <TableSortLabel
                  active={sortField === 'assetType'}
                  direction={sortField === 'assetType' ? sortOrder : 'asc'}
                  onClick={() => handleSort('assetType')}
                  IconComponent={UnfoldMoreIcon}
                  sx={{
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    '&:hover': { color: '#FF7700' },
                    '&.Mui-active': { color: '#FF7700', fontWeight: 700 },
                    '& .MuiTableSortLabel-icon': { fontSize: '1rem', opacity: 0.5 },
                  }}
                >
                  Type
                </TableSortLabel>
              </TableCell>

              {/* Purchase Date */}
              <TableCell sx={{ ...headerCellSx, ...columnVisibility.mdUp }}>
                <TableSortLabel
                  active={sortField === 'purchaseDate'}
                  direction={sortField === 'purchaseDate' ? sortOrder : 'asc'}
                  onClick={() => handleSort('purchaseDate')}
                  IconComponent={UnfoldMoreIcon}
                  sx={{
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    '&:hover': { color: '#FF7700' },
                    '&.Mui-active': { color: '#FF7700', fontWeight: 700 },
                    '& .MuiTableSortLabel-icon': { fontSize: '1rem', opacity: 0.5 },
                  }}
                >
                  Aankoop
                </TableSortLabel>
              </TableCell>

              {/* Serial Number */}
              <TableCell sx={{ ...headerCellSx, ...columnVisibility.smUp }}>
                <TableSortLabel
                  active={sortField === 'serialNumber'}
                  direction={sortField === 'serialNumber' ? sortOrder : 'asc'}
                  onClick={() => handleSort('serialNumber')}
                  IconComponent={UnfoldMoreIcon}
                  sx={{
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    '&:hover': { color: '#FF7700' },
                    '&.Mui-active': { color: '#FF7700', fontWeight: 700 },
                    '& .MuiTableSortLabel-icon': { fontSize: '1rem', opacity: 0.5 },
                  }}
                >
                  Serial
                </TableSortLabel>
              </TableCell>

              {/* Model */}
              <TableCell sx={{ ...headerCellSx, ...columnVisibility.mdUp }}>
                <TableSortLabel
                  active={sortField === 'model'}
                  direction={sortField === 'model' ? sortOrder : 'asc'}
                  onClick={() => handleSort('model')}
                  IconComponent={UnfoldMoreIcon}
                  sx={{
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    '&:hover': { color: '#FF7700' },
                    '&.Mui-active': { color: '#FF7700', fontWeight: 700 },
                    '& .MuiTableSortLabel-icon': { fontSize: '1rem', opacity: 0.5 },
                  }}
                >
                  Model
                </TableSortLabel>
              </TableCell>

              {/* Toewijzing (Owner for laptops, Workplace for fixed assets) */}
              <TableCell sx={{ ...headerCellSx, ...columnVisibility.lgUp }}>
                <TableSortLabel
                  active={sortField === 'assignment'}
                  direction={sortField === 'assignment' ? sortOrder : 'asc'}
                  onClick={() => handleSort('assignment')}
                  IconComponent={UnfoldMoreIcon}
                  sx={{
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    '&:hover': { color: '#FF7700' },
                    '&.Mui-active': { color: '#FF7700', fontWeight: 700 },
                    '& .MuiTableSortLabel-icon': { fontSize: '1rem', opacity: 0.5 },
                  }}
                >
                  Toewijzing
                </TableSortLabel>
              </TableCell>

              {/* Actions */}
              <TableCell
                align="center"
                sx={{
                  ...headerCellSx,
                  minWidth: { xs: 80, sm: 100 },
                  width: { xs: 80, sm: 100 },
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentAssets.map((asset, index) => {
              const isSelected = selectedAssetIds.has(asset.id);
              return (
              <TableRow
                key={asset.id}
                onClick={() => handleRowClick(asset.id)}
                sx={{
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  borderBottom: '1px solid',
                  borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  backgroundColor: isSelected
                    ? (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(255, 119, 0, 0.1)'
                          : 'rgba(255, 119, 0, 0.06)'
                    : index % 2 === 1
                      ? (theme) =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.015)'
                            : 'rgba(0, 0, 0, 0.015)'
                      : 'transparent',
                  '&:hover': {
                    backgroundColor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 119, 0, 0.06)'
                        : 'rgba(255, 119, 0, 0.04)',
                  },
                  '&:last-child td': {
                    borderBottom: 0,
                  },
                }}
              >
                {/* Row Selection Checkbox */}
                {selectable && (
                  <TableCell
                    padding="checkbox"
                    sx={{
                      py: { xs: 0.75, sm: 1 },
                      px: { xs: 1, sm: 1.5 },
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        onSelectionChange?.(asset.id, e.target.checked);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      color="primary"
                      size="small"
                      sx={{
                        '&.Mui-checked': {
                          color: '#FF7700',
                        },
                      }}
                    />
                  </TableCell>
                )}

                {/* Asset Code */}
                <TableCell
                  sx={{
                    fontFamily: '"SF Mono", "Monaco", "Consolas", monospace',
                    fontWeight: 600,
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    color: '#FF7700',
                    py: { xs: 0.75, sm: 1 },
                    px: { xs: 1, sm: 1.5 },
                    letterSpacing: '0.01em',
                  }}
                >
                  {asset.assetCode}
                </TableCell>

                {/* Status */}
                <TableCell
                  sx={{
                    py: { xs: 0.75, sm: 1 },
                    px: { xs: 1, sm: 1.5 },
                  }}
                >
                  <StatusBadge status={asset.status} size="small" />
                </TableCell>

                {/* Asset Type */}
                <TableCell
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    color: 'text.secondary',
                    py: { xs: 0.75, sm: 1 },
                    px: { xs: 1, sm: 1.5 },
                    ...columnVisibility.smUp,
                  }}
                >
                  {asset.assetType?.name || '-'}
                </TableCell>

                {/* Purchase Date */}
                <TableCell
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    py: { xs: 0.75, sm: 1 },
                    px: { xs: 1, sm: 1.5 },
                    ...columnVisibility.mdUp,
                  }}
                >
                  {asset.purchaseDate ? (() => {
                    const purchaseDate = new Date(asset.purchaseDate);
                    const ageInYears = (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                    const isMonitor = asset.category === 'Monitor';
                    // Different thresholds for monitors vs other assets
                    const color = isMonitor
                      ? (ageInYears < 4
                          ? '#4CAF50' // green: 0-4 years
                          : ageInYears < 7
                            ? '#FFA726' // yellow/orange: 4-7 years
                            : '#EF5350') // light red: 7+ years
                      : (ageInYears < 3
                          ? '#4CAF50' // green: 0-3 years
                          : ageInYears < 4
                            ? '#FFA726' // yellow/orange: 3-4 years
                            : '#EF5350'); // light red: 4+ years
                    const ageDisplay = ageInYears < 1
                      ? `${Math.round(ageInYears * 12)} maanden`
                      : `${ageInYears.toFixed(1)} jaar`;
                    return (
                      <Tooltip title={ageDisplay} arrow placement="top">
                        <Box
                          component="span"
                          sx={{
                            color,
                            fontWeight: 500,
                            cursor: 'default',
                          }}
                        >
                          {purchaseDate.toLocaleDateString()}
                        </Box>
                      </Tooltip>
                    );
                  })() : '-'}
                </TableCell>

                {/* Serial Number */}
                <TableCell
                  sx={{
                    fontFamily: '"SF Mono", "Monaco", "Consolas", monospace',
                    fontWeight: 500,
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    maxWidth: { sm: 180, md: 220 },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    py: { xs: 0.75, sm: 1 },
                    px: { xs: 1, sm: 1.5 },
                    ...columnVisibility.smUp,
                  }}
                >
                  {asset.serialNumber || '-'}
                </TableCell>

                {/* Model */}
                <TableCell
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    maxWidth: 160,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    py: { xs: 0.75, sm: 1 },
                    px: { xs: 1, sm: 1.5 },
                    ...columnVisibility.mdUp,
                  }}
                >
                  {asset.model || '-'}
                </TableCell>

                {/* Toewijzing: Owner (purple) for laptops, Workplace (teal) for fixed assets */}
                <TableCell
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    py: { xs: 0.75, sm: 1 },
                    px: { xs: 1, sm: 1.5 },
                    ...columnVisibility.lgUp,
                  }}
                >
                  {isUserAssignedAsset(asset) ? (
                    // Laptop/Notebook: Show owner with purple accent
                    asset.owner ? (
                      <Tooltip
                        title={
                          <Box sx={{ p: 0.5 }}>
                            <Box sx={{ display: 'flex', gap: 0.5, mb: 0.3 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>Hoofdgebruiker:</Typography>
                              <Typography variant="caption">{asset.owner}</Typography>
                            </Box>
                            {asset.jobTitle && (
                              <Box sx={{ display: 'flex', gap: 0.5, mb: 0.3 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>Functie:</Typography>
                                <Typography variant="caption">{asset.jobTitle}</Typography>
                              </Box>
                            )}
                            {asset.officeLocation && (
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>Locatie:</Typography>
                                <Typography variant="caption">{asset.officeLocation}</Typography>
                              </Box>
                            )}
                          </Box>
                        }
                        arrow
                        placement="top"
                      >
                        <Box
                          sx={{
                            color: '#7B1FA2',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            cursor: 'default',
                          }}
                        >
                          <PersonIcon sx={{ fontSize: 14 }} />
                          <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {asset.owner}
                          </span>
                        </Box>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" sx={{ color: 'text.disabled' }}>-</Typography>
                    )
                  ) : (
                    // Fixed asset (monitor, docking, etc.): Show workplace with teal accent
                    asset.physicalWorkplace ? (
                      <Tooltip
                        title={
                          <Box sx={{ p: 0.5 }}>
                            {asset.physicalWorkplace.currentOccupantName && (
                              <Box sx={{ display: 'flex', gap: 0.5, mb: 0.3 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>Gebruiker:</Typography>
                                <Typography variant="caption">{asset.physicalWorkplace.currentOccupantName}</Typography>
                              </Box>
                            )}
                            {(asset.physicalWorkplace.serviceName || asset.physicalWorkplace.sectorName) && (
                              <Box sx={{ display: 'flex', gap: 0.5, mb: 0.3 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>Dienst:</Typography>
                                <Typography variant="caption">
                                  {asset.physicalWorkplace.serviceName}
                                  {asset.physicalWorkplace.sectorName && ` (${asset.physicalWorkplace.sectorName})`}
                                </Typography>
                              </Box>
                            )}
                            {asset.physicalWorkplace.buildingName && (
                              <Box sx={{ display: 'flex', gap: 0.5, mb: 0.3 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>Gebouw:</Typography>
                                <Typography variant="caption">{asset.physicalWorkplace.buildingName}</Typography>
                              </Box>
                            )}
                            {asset.physicalWorkplace.floor && (
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>Verdieping:</Typography>
                                <Typography variant="caption">{asset.physicalWorkplace.floor}</Typography>
                              </Box>
                            )}
                          </Box>
                        }
                        arrow
                        placement="top"
                      >
                        <Link
                          to="/workplaces"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            color: '#009688',
                            textDecoration: 'none',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <BusinessIcon sx={{ fontSize: 14 }} />
                          {asset.physicalWorkplace.code}
                        </Link>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" sx={{ color: 'text.disabled' }}>-</Typography>
                    )
                  )}
                </TableCell>

                {/* Actions - Always Visible */}
                <TableCell
                  align="center"
                  sx={{
                    py: { xs: 0.75, sm: 1 },
                    px: { xs: 0.75, sm: 1.5 },
                    minWidth: { xs: 70, sm: 90 },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      gap: { xs: 0.25, sm: 0.5 },
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {/* Software Icon - Laptops/Desktops Only */}
                    {(asset.category === 'Laptop' || asset.category === 'Desktop') && (
                      <Tooltip title="View Software" arrow placement="top">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/assets/${asset.id}/software`);
                          }}
                          sx={{
                            width: { xs: 28, sm: 32 },
                            height: { xs: 28, sm: 32 },
                            padding: 0,
                            color: (theme) => theme.palette.mode === 'dark' ? '#64B5F6' : '#1976D2',
                            backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(100, 181, 246, 0.08)' : 'rgba(25, 118, 210, 0.06)',
                            border: '1px solid',
                            borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(100, 181, 246, 0.2)' : 'rgba(25, 118, 210, 0.15)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(100, 181, 246, 0.15)' : 'rgba(25, 118, 210, 0.12)',
                              borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(100, 181, 246, 0.4)' : 'rgba(25, 118, 210, 0.3)',
                              transform: isMobile ? 'none' : 'scale(1.05)',
                            },
                          }}
                        >
                          <AppsIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                        </IconButton>
                      </Tooltip>
                    )}

                    {/* Intune/Device Management Icon - Laptops/Desktops with Serial Number */}
                    {(asset.category === 'Laptop' || asset.category === 'Desktop') && asset.serialNumber && (
                      <Tooltip title={t('intune.pageTitle', 'Device Management')} arrow placement="top">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/assets/${asset.id}/intune`);
                          }}
                          sx={{
                            width: { xs: 28, sm: 32 },
                            height: { xs: 28, sm: 32 },
                            padding: 0,
                            color: (theme) => theme.palette.mode === 'dark' ? '#81C784' : '#388E3C',
                            backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(129, 199, 132, 0.08)' : 'rgba(56, 142, 60, 0.06)',
                            border: '1px solid',
                            borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(129, 199, 132, 0.2)' : 'rgba(56, 142, 60, 0.15)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(129, 199, 132, 0.15)' : 'rgba(56, 142, 60, 0.12)',
                              borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(129, 199, 132, 0.4)' : 'rgba(56, 142, 60, 0.3)',
                              transform: isMobile ? 'none' : 'scale(1.05)',
                            },
                          }}
                        >
                          <DevicesIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                        </IconButton>
                      </Tooltip>
                    )}

                    {/* View Details Icon - Always Present */}
                    <Tooltip title="View Details" arrow placement="top">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(asset.id);
                        }}
                        sx={{
                          width: { xs: 28, sm: 32 },
                          height: { xs: 28, sm: 32 },
                          padding: 0,
                          color: '#FF7700',
                          backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 119, 0, 0.1)' : 'rgba(255, 119, 0, 0.08)',
                          border: '1px solid',
                          borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 119, 0, 0.25)' : 'rgba(255, 119, 0, 0.2)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 119, 0, 0.18)' : 'rgba(255, 119, 0, 0.15)',
                            borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 119, 0, 0.4)' : 'rgba(255, 119, 0, 0.35)',
                            transform: isMobile ? 'none' : 'scale(1.05)',
                          },
                        }}
                      >
                        <VisibilityIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Controls - Compact Professional */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: { xs: 1.5, sm: 2 },
          py: { xs: 1, sm: 1.5 },
          px: { xs: 0.5, sm: 0 },
        }}
      >
        {/* Rows per page selector */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1.5, sm: 2 },
            justifyContent: { xs: 'space-between', sm: 'flex-start' },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                color: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
              }}
            >
              {isMobile ? 'Rows:' : 'Per page:'}
            </Typography>
            <FormControl size="small">
              <Select
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                sx={{
                  minWidth: { xs: 60, sm: 70 },
                  fontWeight: 500,
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  height: { xs: 28, sm: 32 },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#FF7700',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#FF7700',
                    borderWidth: 1.5,
                  },
                }}
              >
                <MenuItem value={10} sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}>10</MenuItem>
                <MenuItem value={20} sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}>20</MenuItem>
                <MenuItem value={50} sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}>50</MenuItem>
                <MenuItem value={100} sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}>100</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.8125rem' },
              fontWeight: 500,
              color: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
            }}
          >
            {isMobile
              ? `${startIndex + 1}-${Math.min(endIndex, assets.length)} / ${assets.length}`
              : `${startIndex + 1}-${Math.min(endIndex, assets.length)} of ${assets.length}`
            }
          </Typography>
        </Box>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size={isMobile ? 'small' : 'medium'}
            showFirstButton={!isMobile}
            showLastButton={!isMobile}
            siblingCount={isMobile ? 0 : 1}
            boundaryCount={isMobile ? 1 : 1}
            sx={{
              alignSelf: { xs: 'center', sm: 'auto' },
              '& .MuiPaginationItem-root': {
                fontWeight: 500,
                fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                minWidth: { xs: 28, sm: 32 },
                height: { xs: 28, sm: 32 },
                border: '1px solid',
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#FF7700',
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 119, 0, 0.08)' : 'rgba(255, 119, 0, 0.05)',
                },
              },
              '& .Mui-selected': {
                backgroundColor: '#FF7700',
                color: '#fff',
                fontWeight: 600,
                borderColor: '#FF7700',
                '&:hover': {
                  backgroundColor: '#E66A00',
                  borderColor: '#E66A00',
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

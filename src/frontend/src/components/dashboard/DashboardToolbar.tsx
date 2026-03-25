import { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Badge,
  Chip,
  Typography,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { getNeumorphColors, getNeumorph, getNeumorphInset } from '../../utils/neumorphicStyles';
import ViewToggle, { ViewMode } from '../common/ViewToggle';
import ServiceSelect from '../common/ServiceSelect';
import BuildingSelect from '../common/BuildingSelect';
import ApartmentIcon from '@mui/icons-material/Apartment';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import SortIcon from '@mui/icons-material/Sort';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import BusinessIcon from '@mui/icons-material/Business';
import CheckIcon from '@mui/icons-material/Check';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { SortOption } from '../../constants/dashboard.constants';
import { SERVICE_COLOR, BUILDING_COLOR } from '../../constants/filterColors';

interface DashboardToolbarProps {
  viewMode: ViewMode;
  searchInputValue: string;
  categoryFilter: string;
  serviceFilter: string;
  buildingFilter: string;
  sortBy: SortOption;
  categories: string[];
  selectedCount: number;
  onViewModeChange: (mode: ViewMode) => void;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  onSortChange: (option: SortOption) => void;
  onCategoryChange: (category: string) => void;
  onServiceChange: (serviceId: string) => void;
  onBuildingChange: (buildingId: string) => void;
  onExportClick: () => void;
  onBulkEditClick: () => void;
  onBulkPrintClick: () => void;
  onBulkDeleteClick: () => void;
}

export default function DashboardToolbar({
  viewMode,
  searchInputValue,
  categoryFilter,
  serviceFilter,
  buildingFilter,
  sortBy,
  categories,
  selectedCount,
  onViewModeChange,
  onSearchChange,
  onSearchClear,
  onSortChange,
  onCategoryChange,
  onServiceChange,
  onBuildingChange,
  onExportClick,
  onBulkEditClick,
  onBulkPrintClick,
  onBulkDeleteClick,
}: DashboardToolbarProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgBase, bgSurface, accentColor } = getNeumorphColors(isDark);
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  const [categoryMenuAnchor, setCategoryMenuAnchor] = useState<null | HTMLElement>(null);
  const [serviceMenuAnchor, setServiceMenuAnchor] = useState<null | HTMLElement>(null);
  const [buildingMenuAnchor, setBuildingMenuAnchor] = useState<null | HTMLElement>(null);

  const handleSortMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSortMenuAnchor(event.currentTarget);
  };

  const handleSortMenuClose = () => {
    setSortMenuAnchor(null);
  };

  const handleSortSelect = (option: SortOption) => {
    onSortChange(option);
    handleSortMenuClose();
  };

  const handleCategoryMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setCategoryMenuAnchor(event.currentTarget);
  };

  const handleCategoryMenuClose = () => {
    setCategoryMenuAnchor(null);
  };

  const handleCategorySelect = (category: string) => {
    onCategoryChange(category);
    handleCategoryMenuClose();
  };

  const handleServiceMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setServiceMenuAnchor(event.currentTarget);
  };

  const handleServiceMenuClose = () => {
    setServiceMenuAnchor(null);
  };

  const handleServiceSelect = (serviceId: number | null) => {
    onServiceChange(serviceId ? String(serviceId) : '');
    handleServiceMenuClose();
  };

  const handleBuildingMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setBuildingMenuAnchor(event.currentTarget);
  };

  const handleBuildingMenuClose = () => {
    setBuildingMenuAnchor(null);
  };

  const handleBuildingSelect = (buildingId: number | null) => {
    onBuildingChange(buildingId ? String(buildingId) : '');
    handleBuildingMenuClose();
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          mb: 2,
          p: 1.5,
          borderRadius: 2,
          bgcolor: bgSurface,
          boxShadow: getNeumorphInset(isDark),
          position: 'sticky',
          top: 16,
          zIndex: 10,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* View Toggle */}
          <ViewToggle value={viewMode} onChange={onViewModeChange} />

          {/* Sort Button */}
          <Tooltip title="Sort assets">
            <IconButton
              size="small"
              onClick={handleSortMenuOpen}
              sx={{
                width: 32,
                height: 32,
                bgcolor: bgBase,
                color: 'text.secondary',
                boxShadow: getNeumorph(isDark, 'soft'),
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: accentColor,
                  color: '#fff',
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 12px ${alpha(accentColor, 0.4)}`,
                },
              }}
            >
              <SortIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          {/* Category Filter Button */}
          <Tooltip title="Filter by category">
            <IconButton
              size="small"
              onClick={handleCategoryMenuOpen}
              sx={{
                width: 32,
                height: 32,
                bgcolor: categoryFilter ? alpha(accentColor, 0.15) : bgBase,
                color: categoryFilter ? accentColor : 'text.secondary',
                boxShadow: getNeumorph(isDark, 'soft'),
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: accentColor,
                  color: '#fff',
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 12px ${alpha(accentColor, 0.4)}`,
                },
              }}
            >
              {categoryFilter ? <CheckIcon sx={{ fontSize: 18 }} /> : <FilterAltIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>

          {/* Service Filter Button */}
          <Tooltip title="Filter by service">
            <IconButton
              size="small"
              onClick={handleServiceMenuOpen}
              sx={{
                width: 32,
                height: 32,
                bgcolor: serviceFilter ? alpha(SERVICE_COLOR, 0.15) : bgBase,
                color: serviceFilter ? SERVICE_COLOR : 'text.secondary',
                boxShadow: getNeumorph(isDark, 'soft'),
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: SERVICE_COLOR,
                  color: '#fff',
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 12px ${alpha(SERVICE_COLOR, 0.4)}`,
                },
              }}
            >
              {serviceFilter ? <CheckIcon sx={{ fontSize: 18 }} /> : <BusinessIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>

          {/* Building Filter Button */}
          <Tooltip title="Filter by building">
            <IconButton
              size="small"
              onClick={handleBuildingMenuOpen}
              sx={{
                width: 32,
                height: 32,
                bgcolor: buildingFilter ? alpha(BUILDING_COLOR, 0.15) : bgBase,
                color: buildingFilter ? BUILDING_COLOR : 'text.secondary',
                boxShadow: getNeumorph(isDark, 'soft'),
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: BUILDING_COLOR,
                  color: '#fff',
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 12px ${alpha(BUILDING_COLOR, 0.4)}`,
                },
              }}
            >
              {buildingFilter ? <CheckIcon sx={{ fontSize: 18 }} /> : <ApartmentIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>

          {/* Compact Search Field */}
          <TextField
            size="small"
            placeholder="Search assets..."
            value={searchInputValue}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
                </InputAdornment>
              ),
              endAdornment: searchInputValue && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={onSearchClear} edge="end" sx={{ p: 0.25 }}>
                    <ClearIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              flex: 1,
              minWidth: 180,
              maxWidth: 280,
              '& .MuiOutlinedInput-root': {
                bgcolor: bgBase,
                borderRadius: 1.5,
                fontSize: '0.85rem',
                height: 32,
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
                py: 0.5,
              },
            }}
          />

          {/* Active Filter Chips */}
          {(categoryFilter || serviceFilter || buildingFilter) && (
            <>
              {categoryFilter && (
                <Chip
                  label={categoryFilter}
                  onDelete={() => onCategoryChange('')}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    bgcolor: alpha(accentColor, 0.1),
                    color: accentColor,
                    border: 'none',
                    '& .MuiChip-deleteIcon': {
                      color: accentColor,
                      fontSize: 14,
                    },
                  }}
                />
              )}
              {serviceFilter && (
                <Chip
                  icon={<BusinessIcon sx={{ fontSize: 14 }} />}
                  label="Dienst"
                  onDelete={() => onServiceChange('')}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    bgcolor: alpha(SERVICE_COLOR, 0.1),
                    color: SERVICE_COLOR,
                    border: 'none',
                    '& .MuiChip-icon': { color: SERVICE_COLOR },
                    '& .MuiChip-deleteIcon': { color: SERVICE_COLOR, fontSize: 14 },
                  }}
                />
              )}
              {buildingFilter && (
                <Chip
                  icon={<ApartmentIcon sx={{ fontSize: 14 }} />}
                  label="Gebouw"
                  onDelete={() => onBuildingChange('')}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    bgcolor: alpha(BUILDING_COLOR, 0.1),
                    color: BUILDING_COLOR,
                    border: 'none',
                    '& .MuiChip-icon': { color: BUILDING_COLOR },
                    '& .MuiChip-deleteIcon': { color: BUILDING_COLOR, fontSize: 14 },
                  }}
                />
              )}
            </>
          )}

          {/* Spacer */}
          <Box sx={{ flex: 1 }} />

          {/* Bulk Actions - shows when assets are selected */}
          {selectedCount > 0 && (
            <>
              {/* Bulk Edit Button */}
              <Tooltip title={t('bulkEdit.editSelected', { defaultValue: 'Edit Selected' })}>
                <Badge badgeContent={selectedCount} color="primary">
                  <IconButton
                    onClick={onBulkEditClick}
                    size="small"
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1.5,
                      bgcolor: accentColor,
                      color: '#fff',
                      boxShadow: `0 2px 8px ${alpha(accentColor, 0.3)}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: `0 4px 12px ${alpha(accentColor, 0.4)}`,
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    <EditIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Badge>
              </Tooltip>

              {/* Bulk Print Button */}
              <Tooltip title={t('bulkPrintLabel.printSelected')}>
                <Badge badgeContent={selectedCount} color="primary">
                  <IconButton
                    onClick={onBulkPrintClick}
                    size="small"
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1.5,
                      bgcolor: '#2196F3',
                      color: '#fff',
                      boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    <PrintIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Badge>
              </Tooltip>

              {/* Bulk Delete Button */}
              <Tooltip title={t('bulkDelete.deleteSelected', { defaultValue: 'Delete Selected' })}>
                <Badge badgeContent={selectedCount} color="error">
                  <IconButton
                    onClick={onBulkDeleteClick}
                    size="small"
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1.5,
                      bgcolor: '#F44336',
                      color: '#fff',
                      boxShadow: '0 2px 8px rgba(244, 67, 54, 0.3)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(244, 67, 54, 0.4)',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Badge>
              </Tooltip>
            </>
          )}

          {/* Export Button */}
          <Tooltip title={t('export.title')}>
            <IconButton
              onClick={onExportClick}
              size="small"
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                bgcolor: bgBase,
                color: accentColor,
                boxShadow: getNeumorph(isDark, 'soft'),
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: accentColor,
                  color: '#fff',
                  boxShadow: `0 4px 12px ${alpha(accentColor, 0.4)}`,
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <DownloadIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>

      </Paper>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={handleSortMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 180,
            bgcolor: bgSurface,
            boxShadow: getNeumorph(isDark, 'medium'),
            borderRadius: 2,
            '& .MuiMenuItem-root': {
              fontSize: '0.8rem',
              py: 0.75,
              '&:hover': {
                bgcolor: alpha(accentColor, isDark ? 0.15 : 0.08),
              },
              '&.Mui-selected': {
                bgcolor: alpha(accentColor, isDark ? 0.2 : 0.12),
                '&:hover': {
                  bgcolor: alpha(accentColor, isDark ? 0.25 : 0.15),
                },
              },
            },
          },
        }}
      >
        <MenuItem onClick={() => handleSortSelect('name-asc')} selected={sortBy === 'name-asc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Name (A-Z)</span>
            {sortBy === 'name-asc' && <CheckIcon sx={{ fontSize: 16, color: accentColor }} />}
          </Box>
        </MenuItem>
        <MenuItem onClick={() => handleSortSelect('name-desc')} selected={sortBy === 'name-desc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Name (Z-A)</span>
            {sortBy === 'name-desc' && <CheckIcon sx={{ fontSize: 16, color: accentColor }} />}
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleSortSelect('code-asc')} selected={sortBy === 'code-asc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Code (A-Z)</span>
            {sortBy === 'code-asc' && <CheckIcon sx={{ fontSize: 16, color: accentColor }} />}
          </Box>
        </MenuItem>
        <MenuItem onClick={() => handleSortSelect('code-desc')} selected={sortBy === 'code-desc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Code (Z-A)</span>
            {sortBy === 'code-desc' && <CheckIcon sx={{ fontSize: 16, color: accentColor }} />}
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleSortSelect('date-newest')} selected={sortBy === 'date-newest'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Newest First</span>
            {sortBy === 'date-newest' && <CheckIcon sx={{ fontSize: 16, color: accentColor }} />}
          </Box>
        </MenuItem>
        <MenuItem onClick={() => handleSortSelect('date-oldest')} selected={sortBy === 'date-oldest'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Oldest First</span>
            {sortBy === 'date-oldest' && <CheckIcon sx={{ fontSize: 16, color: accentColor }} />}
          </Box>
        </MenuItem>
      </Menu>

      {/* Category Filter Menu */}
      <Menu
        anchorEl={categoryMenuAnchor}
        open={Boolean(categoryMenuAnchor)}
        onClose={handleCategoryMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 180,
            bgcolor: bgSurface,
            boxShadow: getNeumorph(isDark, 'medium'),
            borderRadius: 2,
            '& .MuiMenuItem-root': {
              fontSize: '0.8rem',
              py: 0.75,
              '&:hover': {
                bgcolor: alpha(accentColor, isDark ? 0.15 : 0.08),
              },
              '&.Mui-selected': {
                bgcolor: alpha(accentColor, isDark ? 0.2 : 0.12),
                '&:hover': {
                  bgcolor: alpha(accentColor, isDark ? 0.25 : 0.15),
                },
              },
            },
          },
        }}
      >
        <MenuItem onClick={() => handleCategorySelect('')} selected={categoryFilter === ''}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>All Categories</span>
            {categoryFilter === '' && <CheckIcon sx={{ fontSize: 16, color: accentColor }} />}
          </Box>
        </MenuItem>
        <Divider />
        {categories.map((category) => (
          <MenuItem
            key={category}
            onClick={() => handleCategorySelect(category)}
            selected={categoryFilter === category}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span>{category}</span>
              {categoryFilter === category && <CheckIcon sx={{ fontSize: 16, color: accentColor }} />}
            </Box>
          </MenuItem>
        ))}
      </Menu>

      {/* Service Filter Menu */}
      <Menu
        anchorEl={serviceMenuAnchor}
        open={Boolean(serviceMenuAnchor)}
        onClose={handleServiceMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 280,
            maxWidth: 350,
            bgcolor: bgSurface,
            boxShadow: getNeumorph(isDark, 'medium'),
            borderRadius: 2,
            p: 1,
          },
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ px: 1, mb: 1, display: 'block' }}>
          Filter by service
        </Typography>
        <ServiceSelect
          value={serviceFilter ? parseInt(serviceFilter, 10) : null}
          onChange={handleServiceSelect}
          label="Dienst"
          size="small"
          required={false}
        />
      </Menu>

      {/* Building Filter Menu */}
      <Menu
        anchorEl={buildingMenuAnchor}
        open={Boolean(buildingMenuAnchor)}
        onClose={handleBuildingMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 250,
            bgcolor: bgSurface,
            boxShadow: getNeumorph(isDark, 'medium'),
            borderRadius: 2,
            p: 1,
          },
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ px: 1, mb: 1, display: 'block' }}>
          Filter by building
        </Typography>
        <BuildingSelect
          value={buildingFilter ? parseInt(buildingFilter, 10) : null}
          onChange={handleBuildingSelect}
          label="Gebouw"
        />
      </Menu>
    </>
  );
}

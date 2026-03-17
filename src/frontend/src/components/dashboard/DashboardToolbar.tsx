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
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import ViewToggle, { ViewMode } from '../common/ViewToggle';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import SortIcon from '@mui/icons-material/Sort';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import CheckIcon from '@mui/icons-material/Check';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { SortOption } from '../../constants/dashboard.constants';

interface DashboardToolbarProps {
  viewMode: ViewMode;
  searchInputValue: string;
  categoryFilter: string;
  sortBy: SortOption;
  categories: string[];
  selectedCount: number;
  onViewModeChange: (mode: ViewMode) => void;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  onSortChange: (option: SortOption) => void;
  onCategoryChange: (category: string) => void;
  onExportClick: () => void;
  onBulkEditClick: () => void;
  onBulkPrintClick: () => void;
  onBulkDeleteClick: () => void;
}

export default function DashboardToolbar({
  viewMode,
  searchInputValue,
  categoryFilter,
  sortBy,
  categories,
  selectedCount,
  onViewModeChange,
  onSearchChange,
  onSearchClear,
  onSortChange,
  onCategoryChange,
  onExportClick,
  onBulkEditClick,
  onBulkPrintClick,
  onBulkDeleteClick,
}: DashboardToolbarProps) {
  const { t } = useTranslation();
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  const [categoryMenuAnchor, setCategoryMenuAnchor] = useState<null | HTMLElement>(null);

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

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(18, 18, 18, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 16,
          zIndex: 10,
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          {/* Left side - View Toggle & Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <ViewToggle value={viewMode} onChange={onViewModeChange} />

            {/* Bulk Actions - shows when assets are selected */}
            {selectedCount > 0 && (
              <>
                {/* Bulk Edit Button */}
                <Tooltip title={t('bulkEdit.editSelected', { defaultValue: 'Edit Selected' })}>
                  <Badge badgeContent={selectedCount} color="primary">
                    <IconButton
                      onClick={onBulkEditClick}
                      sx={{
                        borderRadius: 2,
                        background: (theme) =>
                          theme.palette.mode === 'dark'
                            ? 'linear-gradient(135deg, rgba(255, 119, 0, 0.9) 0%, rgba(255, 153, 51, 0.8) 100%)'
                            : 'linear-gradient(135deg, rgba(255, 119, 0, 1) 0%, rgba(255, 153, 51, 0.9) 100%)',
                        color: '#fff',
                        boxShadow: '0 4px 12px rgba(255, 119, 0, 0.3)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 6px 16px rgba(255, 119, 0, 0.4)',
                        },
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Badge>
                </Tooltip>

                {/* Bulk Print Button */}
                <Tooltip title={t('bulkPrintLabel.printSelected')}>
                  <Badge badgeContent={selectedCount} color="primary">
                    <IconButton
                      onClick={onBulkPrintClick}
                      sx={{
                        borderRadius: 2,
                        background: (theme) =>
                          theme.palette.mode === 'dark'
                            ? 'linear-gradient(135deg, rgba(33, 150, 243, 0.9) 0%, rgba(25, 118, 210, 0.8) 100%)'
                            : 'linear-gradient(135deg, rgba(33, 150, 243, 1) 0%, rgba(25, 118, 210, 0.9) 100%)',
                        color: '#fff',
                        boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 6px 16px rgba(33, 150, 243, 0.4)',
                        },
                      }}
                    >
                      <PrintIcon />
                    </IconButton>
                  </Badge>
                </Tooltip>

                {/* Bulk Delete Button */}
                <Tooltip title={t('bulkDelete.deleteSelected', { defaultValue: 'Delete Selected' })}>
                  <Badge badgeContent={selectedCount} color="error">
                    <IconButton
                      onClick={onBulkDeleteClick}
                      sx={{
                        borderRadius: 2,
                        background: (theme) =>
                          theme.palette.mode === 'dark'
                            ? 'linear-gradient(135deg, rgba(244, 67, 54, 0.9) 0%, rgba(211, 47, 47, 0.8) 100%)'
                            : 'linear-gradient(135deg, rgba(244, 67, 54, 1) 0%, rgba(211, 47, 47, 0.9) 100%)',
                        color: '#fff',
                        boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 6px 16px rgba(244, 67, 54, 0.4)',
                        },
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Badge>
                </Tooltip>
              </>
            )}

            <Tooltip title={t('export.title')}>
              <IconButton
                onClick={onExportClick}
                sx={{
                  borderRadius: 2,
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(255, 119, 0, 0.9) 0%, rgba(204, 0, 0, 0.8) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 119, 0, 1) 0%, rgba(204, 0, 0, 0.9) 100%)',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(255, 119, 0, 0.3)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(255, 119, 0, 0.4)',
                  },
                }}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Center - Search */}
          <Box sx={{ flex: '1 1 300px', maxWidth: 500 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search assets..."
              value={searchInputValue}
              onChange={(e) => onSearchChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchInputValue && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={onSearchClear} edge="end">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
          </Box>

          {/* Right side - Sort and Filter */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Sort Button */}
            <Tooltip title="Sort assets">
              <IconButton
                onClick={handleSortMenuOpen}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 119, 0, 0.1)'
                        : 'rgba(255, 119, 0, 0.05)',
                    borderColor: 'primary.main',
                  },
                }}
              >
                <SortIcon />
              </IconButton>
            </Tooltip>

            {/* Category Filter Button */}
            <Tooltip title="Filter by category">
              <IconButton
                onClick={handleCategoryMenuOpen}
                sx={{
                  border: '1px solid',
                  borderColor: categoryFilter ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  color: categoryFilter ? 'primary.main' : 'inherit',
                  '&:hover': {
                    backgroundColor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 119, 0, 0.1)'
                        : 'rgba(255, 119, 0, 0.05)',
                    borderColor: 'primary.main',
                  },
                }}
              >
                {categoryFilter ? <CheckIcon /> : <FilterAltIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Active Filters Display */}
        {(searchInputValue || categoryFilter) && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Active filters:
            </Typography>
            {searchInputValue && (
              <Chip
                label={`Search: "${searchInputValue}"`}
                onDelete={onSearchClear}
                size="small"
                sx={{
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 119, 0, 0.2)'
                      : 'rgba(255, 119, 0, 0.1)',
                  color: 'primary.main',
                  border: '1px solid',
                  borderColor: 'primary.main',
                }}
              />
            )}
            {categoryFilter && (
              <Chip
                label={`Category: ${categoryFilter}`}
                onDelete={() => onCategoryChange('')}
                size="small"
                sx={{
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 119, 0, 0.2)'
                      : 'rgba(255, 119, 0, 0.1)',
                  color: 'primary.main',
                  border: '1px solid',
                  borderColor: 'primary.main',
                }}
              />
            )}
          </Box>
        )}
      </Paper>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={handleSortMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <MenuItem onClick={() => handleSortSelect('name-asc')} selected={sortBy === 'name-asc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Name (A-Z)</span>
            {sortBy === 'name-asc' && <CheckIcon fontSize="small" color="primary" />}
          </Box>
        </MenuItem>
        <MenuItem onClick={() => handleSortSelect('name-desc')} selected={sortBy === 'name-desc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Name (Z-A)</span>
            {sortBy === 'name-desc' && <CheckIcon fontSize="small" color="primary" />}
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleSortSelect('code-asc')} selected={sortBy === 'code-asc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Code (A-Z)</span>
            {sortBy === 'code-asc' && <CheckIcon fontSize="small" color="primary" />}
          </Box>
        </MenuItem>
        <MenuItem onClick={() => handleSortSelect('code-desc')} selected={sortBy === 'code-desc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Code (Z-A)</span>
            {sortBy === 'code-desc' && <CheckIcon fontSize="small" color="primary" />}
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleSortSelect('date-newest')} selected={sortBy === 'date-newest'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Newest First</span>
            {sortBy === 'date-newest' && <CheckIcon fontSize="small" color="primary" />}
          </Box>
        </MenuItem>
        <MenuItem onClick={() => handleSortSelect('date-oldest')} selected={sortBy === 'date-oldest'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Oldest First</span>
            {sortBy === 'date-oldest' && <CheckIcon fontSize="small" color="primary" />}
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
            minWidth: 200,
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <MenuItem onClick={() => handleCategorySelect('')} selected={categoryFilter === ''}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>All Categories</span>
            {categoryFilter === '' && <CheckIcon fontSize="small" color="primary" />}
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
              {categoryFilter === category && <CheckIcon fontSize="small" color="primary" />}
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

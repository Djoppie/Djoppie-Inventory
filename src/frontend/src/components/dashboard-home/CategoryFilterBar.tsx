import React, { useMemo } from 'react';
import { Box, Typography, useTheme, alpha, Tooltip } from '@mui/material';
import ComputerIcon from '@mui/icons-material/Computer';
import MonitorIcon from '@mui/icons-material/Monitor';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import DockIcon from '@mui/icons-material/Dock';
import CategoryIcon from '@mui/icons-material/Category';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import TuneIcon from '@mui/icons-material/Tune';
import type { Category, AssetType } from '../../types/admin.types';
import { ASSET_COLOR } from '../../constants/filterColors';

interface CategoryFilterBarProps {
  categories: Category[];
  assetTypes: AssetType[];
  selectedCategoryIds: Set<number>;
  selectedAssetTypeIds: Set<number>;
  onToggleCategory: (categoryId: number) => void;
  onToggleAssetType: (assetTypeId: number) => void;
  onClear: () => void;
  // For count badges: how many assets fall in each category/assetType
  assetCountByCategoryId: Map<number, number>;
  assetCountByAssetTypeId: Map<number, number>;
}

/**
 * Resolve an icon for a category based on its code. Falls back to a generic
 * Category icon so unknown categories still render with visual consistency.
 */
const getCategoryIcon = (code: string): React.ReactNode => {
  const key = code.toUpperCase();
  if (key.includes('COMP') || key.includes('LAP') || key.includes('PC')) return <ComputerIcon fontSize="small" />;
  if (key.includes('MON') || key.includes('DISPLAY')) return <MonitorIcon fontSize="small" />;
  if (key.includes('PERIF') || key.includes('KEYB') || key.includes('PERIPH')) return <KeyboardIcon fontSize="small" />;
  if (key.includes('DOCK') || key.includes('WERKPLEK')) return <DockIcon fontSize="small" />;
  return <CategoryIcon fontSize="small" />;
};

const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  categories,
  assetTypes,
  selectedCategoryIds,
  selectedAssetTypeIds,
  onToggleCategory,
  onToggleAssetType,
  onClear,
  assetCountByCategoryId,
  assetCountByAssetTypeId,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const hasAnySelection = selectedCategoryIds.size > 0 || selectedAssetTypeIds.size > 0;

  // Asset types drill-down: show types only for selected categories (or all if no cat selected)
  const visibleAssetTypes = useMemo(() => {
    const active = assetTypes.filter((t) => t.isActive);
    if (selectedCategoryIds.size === 0) return [];
    return active
      .filter((t) => t.categoryId && selectedCategoryIds.has(t.categoryId))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }, [assetTypes, selectedCategoryIds]);

  // Ordered, active-only categories
  const sortedCategories = useMemo(
    () =>
      categories
        .filter((c) => c.isActive)
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [categories],
  );

  const pillBase = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.75,
    px: 1.25,
    py: 0.5,
    minHeight: 30,
    borderRadius: 999,
    cursor: 'pointer',
    userSelect: 'none' as const,
    fontSize: '0.78rem',
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: '0.01em',
    transition: 'background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease, box-shadow 0.2s ease',
    whiteSpace: 'nowrap' as const,
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        p: { xs: 1.25, md: 1.5 },
        borderRadius: 2.5,
        bgcolor: isDark ? alpha('#1a1f2e', 0.6) : alpha('#ffffff', 0.85),
        border: '1px solid',
        borderColor: hasAnySelection
          ? alpha(ASSET_COLOR, 0.35)
          : isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(0,0,0,0.06)',
        boxShadow: hasAnySelection
          ? `0 0 0 3px ${alpha(ASSET_COLOR, 0.08)}`
          : 'none',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {/* Header row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <TuneIcon sx={{ fontSize: '1rem', color: hasAnySelection ? ASSET_COLOR : 'text.secondary' }} />
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: hasAnySelection ? ASSET_COLOR : 'text.secondary',
          }}
        >
          Filter op categorie
        </Typography>
        {hasAnySelection && (
          <Box
            component="button"
            onClick={onClear}
            type="button"
            sx={{
              ml: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              border: 'none',
              background: 'transparent',
              color: ASSET_COLOR,
              cursor: 'pointer',
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 999,
              '&:hover': {
                bgcolor: alpha(ASSET_COLOR, 0.1),
              },
            }}
          >
            <ClearAllIcon sx={{ fontSize: '0.9rem' }} />
            Wissen
          </Box>
        )}
      </Box>

      {/* Category row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          overflowX: 'auto',
          pb: 0.25,
          // Custom scrollbar styling
          '&::-webkit-scrollbar': { height: 4 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            borderRadius: 2,
          },
        }}
      >
        {sortedCategories.map((cat) => {
          const isSelected = selectedCategoryIds.has(cat.id);
          const count = assetCountByCategoryId.get(cat.id) ?? 0;
          return (
            <Tooltip key={cat.id} title={cat.description || cat.name} placement="top" arrow>
              <Box
                role="button"
                tabIndex={0}
                onClick={() => onToggleCategory(cat.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleCategory(cat.id);
                  }
                }}
                sx={{
                  ...pillBase,
                  border: '1.5px solid',
                  borderColor: isSelected ? ASSET_COLOR : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                  bgcolor: isSelected
                    ? alpha(ASSET_COLOR, isDark ? 0.25 : 0.15)
                    : isDark
                      ? alpha('#ffffff', 0.03)
                      : alpha('#ffffff', 0.7),
                  color: isSelected ? (isDark ? '#FFB47A' : ASSET_COLOR) : 'text.primary',
                  '&:hover': {
                    borderColor: ASSET_COLOR,
                    bgcolor: isSelected
                      ? alpha(ASSET_COLOR, isDark ? 0.3 : 0.2)
                      : alpha(ASSET_COLOR, 0.08),
                    transform: 'translateY(-1px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                }}
              >
                <Box sx={{ display: 'inline-flex', color: isSelected ? 'inherit' : 'text.secondary' }}>
                  {getCategoryIcon(cat.code)}
                </Box>
                <span>{cat.name}</span>
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 22,
                    height: 18,
                    px: 0.75,
                    borderRadius: 999,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    bgcolor: isSelected ? ASSET_COLOR : alpha(ASSET_COLOR, 0.12),
                    color: isSelected ? '#fff' : ASSET_COLOR,
                  }}
                >
                  {count}
                </Box>
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      {/* Asset-type drill-down row — only visible when at least one category is selected */}
      {visibleAssetTypes.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            overflowX: 'auto',
            pt: 0.5,
            borderTop: '1px dashed',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            '&::-webkit-scrollbar': { height: 4 },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              borderRadius: 2,
            },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.62rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'text.secondary',
              flexShrink: 0,
              pr: 0.5,
            }}
          >
            Type:
          </Typography>
          {visibleAssetTypes.map((t) => {
            const isSelected = selectedAssetTypeIds.has(t.id);
            const count = assetCountByAssetTypeId.get(t.id) ?? 0;
            return (
              <Box
                key={t.id}
                role="button"
                tabIndex={0}
                onClick={() => onToggleAssetType(t.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleAssetType(t.id);
                  }
                }}
                sx={{
                  ...pillBase,
                  fontSize: '0.7rem',
                  minHeight: 24,
                  px: 1,
                  border: '1px solid',
                  borderColor: isSelected ? ASSET_COLOR : 'transparent',
                  bgcolor: isSelected
                    ? alpha(ASSET_COLOR, isDark ? 0.2 : 0.12)
                    : isDark
                      ? alpha('#ffffff', 0.03)
                      : alpha('#000000', 0.03),
                  color: isSelected ? (isDark ? '#FFB47A' : ASSET_COLOR) : 'text.secondary',
                  '&:hover': {
                    borderColor: alpha(ASSET_COLOR, 0.5),
                    color: ASSET_COLOR,
                  },
                }}
              >
                <span>{t.name}</span>
                <Box
                  component="span"
                  sx={{
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    opacity: 0.75,
                  }}
                >
                  {count}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default CategoryFilterBar;

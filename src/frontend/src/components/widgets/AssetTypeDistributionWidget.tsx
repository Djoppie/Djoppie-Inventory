/**
 * AssetTypeDistributionWidget Component
 * Shows breakdown of assets by device type with horizontal bars
 */

import {
  Box,
  Typography,
  Paper,
  alpha,
  useTheme,
  Skeleton,
  Chip,
} from '@mui/material';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getNeumorph, getNeumorphColors } from '../../utils/neumorphicStyles';
import {
  Laptop,
  DesktopWindows,
  Monitor,
  DockOutlined,
  Mouse,
  Keyboard,
  Smartphone,
  Tablet,
  Devices,
} from '@mui/icons-material';
import { Asset } from '../../types/asset.types';

interface AssetTypeDistributionProps {
  assets: Asset[];
  onTypeClick?: (type: string) => void;
  isLoading?: boolean;
}

const typeIconMap: Record<string, { icon: typeof Laptop; color: string }> = {
  'Laptop': { icon: Laptop, color: '#FF7700' },
  'Desktop': { icon: DesktopWindows, color: '#2196F3' },
  'Monitor': { icon: Monitor, color: '#4CAF50' },
  'Docking': { icon: DockOutlined, color: '#9C27B0' },
  'Mouse': { icon: Mouse, color: '#FF9800' },
  'Keyboard': { icon: Keyboard, color: '#00BCD4' },
  'Smartphone': { icon: Smartphone, color: '#E91E63' },
  'Tablet': { icon: Tablet, color: '#673AB7' },
};

export const AssetTypeDistributionWidget = memo<AssetTypeDistributionProps>(({
  assets,
  onTypeClick,
  isLoading = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.palette.mode === 'dark';
  const { bgBase, bgSurface } = getNeumorphColors(isDark);

  const typeData = useMemo(() => {
    const typeCounts = assets.reduce((acc, asset) => {
      const typeName = asset.assetType?.name || 'Overig';
      acc[typeName] = (acc[typeName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = assets.length;

    return Object.entries(typeCounts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        icon: typeIconMap[type]?.icon || Devices,
        color: typeIconMap[type]?.color || '#607D8B',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Show top 8 types
  }, [assets]);

  const total = useMemo(() => assets.length, [assets]);

  if (isLoading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          bgcolor: bgSurface,
          boxShadow: getNeumorph(isDark, 'medium'),
          height: '100%',
        }}
      >
        <Skeleton variant="text" width="60%" height={32} />
        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} variant="rectangular" height={48} sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        bgcolor: bgSurface,
        boxShadow: getNeumorph(isDark, 'medium'),
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.87)',
          }}
        >
          Verdeling per Type
        </Typography>
        <Chip
          label={`${total} assets`}
          size="small"
          sx={{
            fontWeight: 700,
            bgcolor: alpha('#FF7700', 0.15),
            color: '#FF7700',
          }}
        />
      </Box>

      {/* Type bars */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {typeData.map(item => {
          const Icon = item.icon;
          return (
            <Box
              key={item.type}
              onClick={() => onTypeClick?.(item.type)}
              sx={{
                cursor: onTypeClick ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                '&:hover': onTypeClick ? {
                  transform: 'translateX(4px)',
                } : {},
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(item.color, 0.12),
                    border: `1px solid ${alpha(item.color, 0.25)}`,
                  }}
                >
                  <Icon sx={{ fontSize: 18, color: item.color }} />
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    flex: 1,
                    color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.87)',
                  }}
                >
                  {item.type}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: item.color,
                    minWidth: 35,
                    textAlign: 'right',
                  }}
                >
                  {item.count}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                    minWidth: 45,
                    textAlign: 'right',
                  }}
                >
                  {item.percentage.toFixed(1)}%
                </Typography>
              </Box>

              {/* Progress bar */}
              <Box
                sx={{
                  width: '100%',
                  height: 8,
                  borderRadius: 1,
                  bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${item.percentage}%`,
                    bgcolor: item.color,
                    borderRadius: 1,
                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: `0 0 8px ${alpha(item.color, 0.5)}`,
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Footer note */}
      {typeData.length === 8 && (
        <Typography
          variant="caption"
          sx={{
            mt: 2,
            color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
            fontStyle: 'italic',
            textAlign: 'center',
          }}
        >
          Top 8 types weergegeven
        </Typography>
      )}
    </Paper>
  );
});

AssetTypeDistributionWidget.displayName = 'AssetTypeDistributionWidget';

export default AssetTypeDistributionWidget;

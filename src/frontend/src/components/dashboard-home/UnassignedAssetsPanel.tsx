import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, useTheme, alpha, Chip, List, ListItem, ListItemText, Button, Skeleton } from '@mui/material';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PlaceIcon from '@mui/icons-material/Place';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { getNeumorph, getNeumorphColors } from '../../utils/neumorphicStyles';
import { useRecentNieuwAssets } from '../../hooks/useAssets';
import { buildRoute } from '../../constants/routes';
import type { Asset } from '../../types/asset.types';
import AssignEmployeeDialog from '../inventory/dialogs/AssignEmployeeDialog';
import AssignWorkplaceDialog from '../inventory/dialogs/AssignWorkplaceDialog';

const NIEUW_COLOR = '#FF7700';

const UnassignedAssetsPanel: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);
  const navigate = useNavigate();

  const { data: recentNieuw, isLoading } = useRecentNieuwAssets(8);

  const [assignEmployeeAsset, setAssignEmployeeAsset] = useState<Asset | null>(null);
  const [assignWorkplaceAsset, setAssignWorkplaceAsset] = useState<Asset | null>(null);

  if (isLoading) {
    return (
      <Box
        sx={{
          borderRadius: 3,
          bgcolor: bgSurface,
          boxShadow: getNeumorph(isDark, 'medium'),
          borderTop: `3px solid ${NIEUW_COLOR}`,
          p: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FiberNewIcon sx={{ color: NIEUW_COLOR, fontSize: 22 }} />
          <Skeleton variant="text" width={200} height={24} />
        </Box>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={48} sx={{ mb: 1, borderRadius: 1.5 }} />
        ))}
      </Box>
    );
  }

  if (!recentNieuw || recentNieuw.length === 0) {
    return null;
  }

  return (
    <>
      <Box
        sx={{
          borderRadius: 3,
          bgcolor: bgSurface,
          boxShadow: getNeumorph(isDark, 'medium'),
          borderTop: `3px solid ${NIEUW_COLOR}`,
          p: 3,
          position: 'relative',
          overflow: 'hidden',
          // Subtle orange glow on the accent bar
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${NIEUW_COLOR}, #FF9933, ${NIEUW_COLOR})`,
            backgroundSize: '200% 100%',
            animation: 'shiftGradient 3s linear infinite',
          },
          '@keyframes shiftGradient': {
            '0%': { backgroundPosition: '0% 0%' },
            '100%': { backgroundPosition: '200% 0%' },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(NIEUW_COLOR, 0.15),
                color: NIEUW_COLOR,
                animation: 'pulseIcon 2.5s ease-in-out infinite',
                '@keyframes pulseIcon': {
                  '0%, 100%': { boxShadow: `0 0 0 0 ${alpha(NIEUW_COLOR, 0.4)}` },
                  '50%': { boxShadow: `0 0 0 6px ${alpha(NIEUW_COLOR, 0)}` },
                },
              }}
            >
              <FiberNewIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: isDark ? '#fff' : '#1a1a2e',
                }}
              >
                Recent aangemaakt — wacht op toewijzing
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {recentNieuw.length} asset{recentNieuw.length !== 1 ? 's' : ''} met status Nieuw
              </Typography>
            </Box>
          </Box>
          <Button
            size="small"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
            onClick={() => navigate('/inventory?status=Nieuw')}
            sx={{
              color: NIEUW_COLOR,
              fontSize: '0.72rem',
              fontWeight: 600,
              px: 1.5,
              py: 0.5,
              borderRadius: 1.5,
              bgcolor: alpha(NIEUW_COLOR, 0.08),
              border: `1px solid ${alpha(NIEUW_COLOR, 0.2)}`,
              '&:hover': {
                bgcolor: alpha(NIEUW_COLOR, 0.15),
              },
            }}
          >
            Alle bekijken
          </Button>
        </Box>

        {/* Asset list */}
        <List dense disablePadding>
          {recentNieuw.map((asset, idx) => (
            <ListItem
              key={asset.id}
              disableGutters
              sx={{
                py: 0.5,
                px: 1,
                mb: 0.5,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05),
                bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.01),
                opacity: 0,
                animation: `fadeSlideIn 0.3s ease forwards ${idx * 0.05}s`,
                '@keyframes fadeSlideIn': {
                  from: { opacity: 0, transform: 'translateY(6px)' },
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
                '&:hover': {
                  bgcolor: alpha(NIEUW_COLOR, 0.05),
                  borderColor: alpha(NIEUW_COLOR, 0.15),
                },
              }}
            >
              {/* Clickable asset code */}
              <Box
                sx={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                onClick={() => navigate(buildRoute.assetDetail(asset.id))}
              >
                <ListItemText
                  primaryTypographyProps={{ component: 'div' }}
                  secondaryTypographyProps={{ component: 'div' }}
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: NIEUW_COLOR,
                          fontSize: '0.78rem',
                        }}
                      >
                        {asset.assetCode}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        sx={{ fontSize: '0.72rem' }}
                      >
                        {asset.assetName || asset.alias || (asset.assetType?.name ?? '')}
                      </Typography>
                      <Chip
                        label="Nieuw"
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          bgcolor: alpha(NIEUW_COLOR, 0.12),
                          color: NIEUW_COLOR,
                          '& .MuiChip-label': { px: 0.75 },
                        }}
                      />
                    </Box>
                  }
                />
              </Box>

              {/* CTA buttons */}
              <Box sx={{ display: 'flex', gap: 0.5, ml: 1, flexShrink: 0 }}>
                <Button
                  size="small"
                  startIcon={<PersonAddIcon sx={{ fontSize: '0.85rem !important' }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setAssignEmployeeAsset(asset);
                  }}
                  sx={{
                    height: 26,
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    px: 1,
                    minWidth: 'unset',
                    color: '#7b1fa2',
                    bgcolor: alpha('#7b1fa2', 0.08),
                    border: `1px solid ${alpha('#7b1fa2', 0.2)}`,
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: alpha('#7b1fa2', 0.15),
                    },
                  }}
                >
                  Medewerker
                </Button>
                <Button
                  size="small"
                  startIcon={<PlaceIcon sx={{ fontSize: '0.85rem !important' }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setAssignWorkplaceAsset(asset);
                  }}
                  sx={{
                    height: 26,
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    px: 1,
                    minWidth: 'unset',
                    color: '#009688',
                    bgcolor: alpha('#009688', 0.08),
                    border: `1px solid ${alpha('#009688', 0.2)}`,
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: alpha('#009688', 0.15),
                    },
                  }}
                >
                  Werkplek
                </Button>
              </Box>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Assignment dialogs */}
      {assignEmployeeAsset && (
        <AssignEmployeeDialog
          open={!!assignEmployeeAsset}
          onClose={() => setAssignEmployeeAsset(null)}
          asset={assignEmployeeAsset}
        />
      )}
      {assignWorkplaceAsset && (
        <AssignWorkplaceDialog
          open={!!assignWorkplaceAsset}
          onClose={() => setAssignWorkplaceAsset(null)}
          asset={assignWorkplaceAsset}
        />
      )}
    </>
  );
};

export default UnassignedAssetsPanel;

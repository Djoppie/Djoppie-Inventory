/**
 * LeaseWarrantyWidget Component
 * Alerts for expiring warranties and lease contracts
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
import { getNeumorph, getNeumorphColors } from '../../utils/neumorphicStyles';
import {
  Warning,
  Assignment,
  VerifiedUser,
  Event,
  ErrorOutline,
} from '@mui/icons-material';
import { Asset } from '../../types/asset.types';
import { differenceInDays, format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface ExpiringItem {
  assetCode: string;
  assetName: string;
  type: 'warranty' | 'lease';
  expiryDate: Date;
  daysUntilExpiry: number;
  urgency: 'critical' | 'warning' | 'info';
}

interface LeaseWarrantyProps {
  assets: Asset[];
  isLoading?: boolean;
}

export const LeaseWarrantyWidget = memo<LeaseWarrantyProps>(({
  assets,
  isLoading = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  const expiringItems = useMemo(() => {
    const items: ExpiringItem[] = [];
    const now = new Date();

    assets.forEach(asset => {
      // Check warranty expiry
      if (asset.warrantyExpiry) {
        const expiryDate = new Date(asset.warrantyExpiry);
        const daysUntilExpiry = differenceInDays(expiryDate, now);

        if (daysUntilExpiry <= 90 && daysUntilExpiry >= -30) {
          items.push({
            assetCode: asset.assetCode,
            assetName: asset.assetName,
            type: 'warranty',
            expiryDate,
            daysUntilExpiry,
            urgency: daysUntilExpiry <= 0 ? 'critical' :
                     daysUntilExpiry <= 30 ? 'warning' : 'info',
          });
        }
      }

      // Note: Lease contracts would be checked here if available
      // For now, we'll just focus on warranties
    });

    return items.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }, [assets]);

  const stats = useMemo(() => {
    const critical = expiringItems.filter(i => i.urgency === 'critical').length;
    const warning = expiringItems.filter(i => i.urgency === 'warning').length;
    const info = expiringItems.filter(i => i.urgency === 'info').length;

    return { critical, warning, info, total: expiringItems.length };
  }, [expiringItems]);

  const getUrgencyColor = (urgency: ExpiringItem['urgency']) => {
    switch (urgency) {
      case 'critical': return '#F44336';
      case 'warning': return '#FF9800';
      case 'info': return '#2196F3';
    }
  };

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
        <Box sx={{ mt: 3 }}>
          <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2, mb: 2 }} />
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(stats.critical > 0 ? '#F44336' : '#FF9800', 0.12),
            border: `1px solid ${alpha(stats.critical > 0 ? '#F44336' : '#FF9800', 0.25)}`,
          }}
        >
          {stats.critical > 0 ? (
            <ErrorOutline sx={{ fontSize: 22, color: '#F44336' }} />
          ) : (
            <Warning sx={{ fontSize: 22, color: '#FF9800' }} />
          )}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.87)',
            }}
          >
            Garanties & Leases
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            }}
          >
            Verloop binnen 90 dagen
          </Typography>
        </Box>
        {stats.total > 0 && (
          <Chip
            label={stats.total}
            size="small"
            sx={{
              fontWeight: 700,
              bgcolor: alpha(stats.critical > 0 ? '#F44336' : '#FF9800', 0.15),
              color: stats.critical > 0 ? '#F44336' : '#FF9800',
            }}
          />
        )}
      </Box>

      {/* Summary Stats */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
        {stats.critical > 0 && (
          <Box
            sx={{
              flex: 1,
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: alpha('#F44336', 0.08),
              border: `1px solid ${alpha('#F44336', 0.2)}`,
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#F44336' }}>
              {stats.critical}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                fontWeight: 500,
                fontSize: '0.65rem',
              }}
            >
              Verlopen
            </Typography>
          </Box>
        )}
        {stats.warning > 0 && (
          <Box
            sx={{
              flex: 1,
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: alpha('#FF9800', 0.08),
              border: `1px solid ${alpha('#FF9800', 0.2)}`,
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#FF9800' }}>
              {stats.warning}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                fontWeight: 500,
                fontSize: '0.65rem',
              }}
            >
              30 dagen
            </Typography>
          </Box>
        )}
        {stats.info > 0 && (
          <Box
            sx={{
              flex: 1,
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: alpha('#2196F3', 0.08),
              border: `1px solid ${alpha('#2196F3', 0.2)}`,
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#2196F3' }}>
              {stats.info}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                fontWeight: 500,
                fontSize: '0.65rem',
              }}
            >
              90 dagen
            </Typography>
          </Box>
        )}
      </Box>

      {/* Items List */}
      {expiringItems.length === 0 ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
          }}
        >
          <VerifiedUser sx={{ fontSize: 48, color: '#4CAF50', mb: 2, opacity: 0.5 }} />
          <Typography variant="body2" color="text.secondary">
            Geen verlopende garanties
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            pr: 1,
            '&::-webkit-scrollbar': {
              width: 6,
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              borderRadius: 3,
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
              borderRadius: 3,
              '&:hover': {
                bgcolor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
              },
            },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {expiringItems.slice(0, 10).map((item) => {
              const urgencyColor = getUrgencyColor(item.urgency);
              const formattedDate = format(item.expiryDate, 'dd MMM yyyy', { locale: nl });

              return (
                <Box
                  key={`${item.assetCode}-${item.type}`}
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    bgcolor: alpha(urgencyColor, 0.05),
                    border: `1px solid ${alpha(urgencyColor, 0.15)}`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: alpha(urgencyColor, 0.08),
                      borderColor: alpha(urgencyColor, 0.3),
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(urgencyColor, 0.12),
                        border: `1px solid ${alpha(urgencyColor, 0.25)}`,
                        flexShrink: 0,
                      }}
                    >
                      {item.type === 'warranty' ? (
                        <VerifiedUser sx={{ fontSize: 18, color: urgencyColor }} />
                      ) : (
                        <Assignment sx={{ fontSize: 18, color: urgencyColor }} />
                      )}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          color: '#FF7700',
                          fontSize: '0.75rem',
                          mb: 0.25,
                        }}
                      >
                        {item.assetCode}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
                          fontWeight: 500,
                          fontSize: '0.85rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          mb: 0.5,
                        }}
                      >
                        {item.assetName}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Event sx={{ fontSize: 12, color: urgencyColor }} />
                        <Typography
                          variant="caption"
                          sx={{
                            color: urgencyColor,
                            fontWeight: 600,
                            fontSize: '0.7rem',
                          }}
                        >
                          {formattedDate}
                        </Typography>
                        <Chip
                          label={
                            item.daysUntilExpiry <= 0
                              ? 'Verlopen'
                              : `${item.daysUntilExpiry} dagen`
                          }
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            bgcolor: alpha(urgencyColor, 0.15),
                            color: urgencyColor,
                            ml: 'auto',
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {expiringItems.length > 10 && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 2,
                textAlign: 'center',
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                fontStyle: 'italic',
              }}
            >
              +{expiringItems.length - 10} meer items
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
});

LeaseWarrantyWidget.displayName = 'LeaseWarrantyWidget';

export default LeaseWarrantyWidget;

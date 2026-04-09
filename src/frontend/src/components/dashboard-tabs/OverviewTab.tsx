/**
 * OverviewTab Component
 * Executive dashboard with workplace occupancy, equipment status, and inventory planning
 * Enhanced with modern visual hierarchy, animations, and eye-catching design elements
 */

import { useMemo } from 'react';
import { Box, Typography, useTheme, alpha, Skeleton, LinearProgress, Chip, Fade, Zoom } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Business,
  Devices,
  CheckCircle,
  Inventory2,
  Warning,
  DockTwoTone,
  Monitor,
  Keyboard,
  Mouse,
  Laptop,
  Computer,
  CalendarMonth,
  TrendingDown,
  Person,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useAssets } from '../../hooks/useAssets';
import { useRolloutSessions } from '../../hooks/rollout/useRolloutSessions';
import { physicalWorkplacesStatisticsApi } from '../../api/physicalWorkplaces.api';
import { getNeumorphColors, getNeumorph } from '../../utils/neumorphicStyles';
import { ROUTES } from '../../constants/routes';
import { AssetPlanningCalendar } from '../dashboard/AssetPlanningCalendar';
import type { EquipmentTypeStatus } from '../../types/physicalWorkplace.types';

const OverviewTab = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  const { data: assets, isLoading: assetsLoading } = useAssets();
  const { data: rolloutSessions, isLoading: rolloutsLoading } = useRolloutSessions();

  // Fetch workplace statistics
  const { data: workplaceStats, isLoading: workplaceStatsLoading } = useQuery({
    queryKey: ['workplace-statistics'],
    queryFn: () => physicalWorkplacesStatisticsApi.getStatistics(),
  });

  // Fetch equipment statistics
  const { data: equipmentStats, isLoading: equipmentStatsLoading } = useQuery({
    queryKey: ['equipment-statistics'],
    queryFn: () => physicalWorkplacesStatisticsApi.getEquipmentStatistics(),
  });

  // Calculate stock metrics
  const stockMetrics = useMemo(() => {
    if (!assets) {
      return {
        laptopsInStock: [],
        desktopsInStock: [],
        totalLaptopsStock: 0,
        totalDesktopsStock: 0,
      };
    }

    const laptopsInStock = assets.filter(
      (a) => a.status === 'Stock' && a.assetType?.name.toLowerCase().includes('lap')
    );
    const desktopsInStock = assets.filter(
      (a) => a.status === 'Stock' && a.assetType?.name.toLowerCase().includes('desk')
    );

    return {
      laptopsInStock,
      desktopsInStock,
      totalLaptopsStock: laptopsInStock.length,
      totalDesktopsStock: desktopsInStock.length,
    };
  }, [assets]);

  // Calculate upcoming rollouts with stock requirements
  const upcomingRollouts = useMemo(() => {
    if (!rolloutSessions) return [];

    const now = new Date();
    const futureRollouts = rolloutSessions
      .filter((s) => s.status === 'Planning' || s.status === 'InProgress')
      .map((session) => {
        const futureDays = (session.days || []).filter((day) => {
          const dayDate = new Date(day.date || '');
          return dayDate >= now;
        });

        const totalWorkplaces = futureDays.reduce(
          (sum, day) => sum + (day.workplaces?.length || 0),
          0
        );

        // Estimate: assume 1 laptop per workplace (simplified)
        const estimatedLaptopsNeeded = totalWorkplaces;

        return {
          sessionId: session.id,
          sessionName: session.sessionName,
          totalWorkplaces,
          estimatedLaptopsNeeded,
          hasEnoughLaptops: stockMetrics.totalLaptopsStock >= estimatedLaptopsNeeded,
          earliestDate: futureDays[0]?.date || '',
        };
      })
      .filter((r) => r.totalWorkplaces > 0)
      .sort((a, b) => new Date(a.earliestDate).getTime() - new Date(b.earliestDate).getTime())
      .slice(0, 5);

    return futureRollouts;
  }, [rolloutSessions, stockMetrics.totalLaptopsStock]);

  // Calculate devices becoming available (assets with upcoming decommission dates)
  const upcomingAvailableDevices = useMemo(() => {
    if (!assets) return [];

    const now = new Date();
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    // Look for assets with warranty expiry or other date fields as proxy for "expected decommission"
    // In a real scenario, you'd have a dedicated "expectedDecommissionDate" field
    const upcoming = assets
      .filter((a) => {
        if (a.status !== 'InGebruik') return false;
        // Use warranty expiry as proxy for when device might become available
        if (a.warrantyExpiry) {
          const expiryDate = new Date(a.warrantyExpiry);
          return expiryDate > now && expiryDate <= ninetyDaysFromNow;
        }
        return false;
      })
      .map((a) => ({
        assetCode: a.assetCode,
        assetName: a.assetName || '',
        assetType: a.assetType?.name || '',
        brand: a.brand || '',
        model: a.model || '',
        serialNumber: a.serialNumber || '',
        expectedDate: a.warrantyExpiry || '',
      }))
      .sort((a, b) => new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime())
      .slice(0, 5);

    return upcoming;
  }, [assets]);

  // Calculate expiring management certificates with primary user information
  const expiringCertificates = useMemo(() => {
    if (!assets) return [];

    const now = new Date();
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const expiring = assets
      .filter((a) => {
        if (!a.intuneCertificateExpiry) return false;
        const expiryDate = new Date(a.intuneCertificateExpiry);
        return expiryDate > now && expiryDate <= ninetyDaysFromNow;
      })
      .map((a) => ({
        assetCode: a.assetCode,
        assetName: a.assetName || '',
        assetType: a.assetType?.name || '',
        brand: a.brand || '',
        model: a.model || '',
        serialNumber: a.serialNumber || '',
        expiryDate: a.intuneCertificateExpiry || '',
        primaryUser: a.employee?.displayName || a.owner || 'Niet toegewezen',
        userEmail: a.employee?.email || '',
        daysRemaining: Math.ceil(
          (new Date(a.intuneCertificateExpiry!).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      }))
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 5);

    return expiring;
  }, [assets]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getEquipmentIcon = (type: string) => {
    const icons: Record<string, React.ElementType> = {
      docking: DockTwoTone,
      monitor: Monitor,
      keyboard: Keyboard,
      mouse: Mouse,
    };
    return icons[type.toLowerCase()] || Devices;
  };

  const getEquipmentColor = (fillRate: number) => {
    if (fillRate >= 80) return '#10B981'; // Green
    if (fillRate >= 50) return '#FF7700'; // Orange
    return '#EF4444'; // Red
  };

  if (assetsLoading || rolloutsLoading || workplaceStatsLoading || equipmentStatsLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1.5, maxWidth: '1600px', mx: 'auto' }}>
      {/* Hero Metrics Row - Eye-catching KPIs */}
      <Fade in timeout={600}>
        <Box sx={{ mb: 1.5 }}>
          <Typography
            variant="h5"
            sx={{
              fontSize: '1.25rem',
              fontWeight: 800,
              mb: 1.5,
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #FF7700 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
            }}
          >
            Business Dashboard
          </Typography>
        </Box>
      </Fade>

      {/* Top Row: Workplace Occupancy + Equipment Status */}
      <Zoom in timeout={700}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5, mb: 1.5 }}>
        {/* Werkplek Bezetting (Workplace Occupancy) */}
        <Box>
          <Box
            onClick={() => navigate(ROUTES.PHYSICAL_WORKPLACES)}
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: bgSurface,
              boxShadow: getNeumorph(isDark, 'medium'),
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              border: `1px solid ${alpha('#3B82F6', 0.1)}`,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)',
                opacity: 0,
                transition: 'opacity 0.3s ease',
              },
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `${getNeumorph(isDark, 'strong')}, 0 8px 16px ${alpha('#3B82F6', 0.15)}`,
                '&::before': {
                  opacity: 1,
                },
              },
            }}
          >
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${alpha('#3B82F6', 0.15)} 0%, ${alpha('#8B5CF6', 0.15)} 100%)`,
                    boxShadow: `inset 0 2px 6px ${alpha('#3B82F6', 0.2)}`,
                  }}
                >
                  <Business sx={{ fontSize: 20, color: '#3B82F6' }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.2 }}>
                    Werkplekken
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                    Bezetting overzicht
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1.5,
                  background: `linear-gradient(135deg, ${alpha('#3B82F6', 0.15)} 0%, ${alpha('#8B5CF6', 0.1)} 100%)`,
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {workplaceStats?.occupancyRate.toFixed(1)}%
                </Typography>
              </Box>
            </Box>

            {/* Occupancy Progress Bar */}
            <Box sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Bezettingsgraad
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#3B82F6' }}>
                  {workplaceStats?.occupiedWorkplaces} / {workplaceStats?.activeWorkplaces}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={workplaceStats?.occupancyRate || 0}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: alpha('#3B82F6', 0.12),
                  boxShadow: `inset 0 2px 4px ${alpha('#000', 0.1)}`,
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                    background: `linear-gradient(90deg, #10B981 0%, #3B82F6 50%, #8B5CF6 100%)`,
                    boxShadow: `0 0 12px ${alpha('#3B82F6', 0.4)}`,
                  },
                }}
              />
            </Box>

            {/* Breakdown */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
              <Box
                sx={{
                  flex: 1,
                  p: 1,
                  borderRadius: 1.5,
                  bgcolor: alpha('#3B82F6', 0.08),
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  border: `1px solid ${alpha('#3B82F6', 0.15)}`,
                  '&:hover': {
                    bgcolor: alpha('#3B82F6', 0.12),
                    transform: 'scale(1.02)',
                  },
                }}
              >
                <Business sx={{ fontSize: 16, color: '#3B82F6', mb: 0.25 }} />
                <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#3B82F6' }}>
                  {workplaceStats?.activeWorkplaces || 0}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 600 }}>
                  Totaal actief
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  p: 1,
                  borderRadius: 1.5,
                  bgcolor: alpha('#10B981', 0.08),
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  border: `1px solid ${alpha('#10B981', 0.15)}`,
                  '&:hover': {
                    bgcolor: alpha('#10B981', 0.12),
                    transform: 'scale(1.02)',
                  },
                }}
              >
                <CheckCircle sx={{ fontSize: 16, color: '#10B981', mb: 0.25 }} />
                <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#10B981' }}>
                  {workplaceStats?.occupiedWorkplaces || 0}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 600 }}>
                  Bezet
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  p: 1,
                  borderRadius: 1.5,
                  bgcolor: alpha('#F59E0B', 0.08),
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  border: `1px solid ${alpha('#F59E0B', 0.15)}`,
                  '&:hover': {
                    bgcolor: alpha('#F59E0B', 0.12),
                    transform: 'scale(1.02)',
                  },
                }}
              >
                <Inventory2 sx={{ fontSize: 16, color: '#F59E0B', mb: 0.25 }} />
                <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#F59E0B' }}>
                  {workplaceStats?.vacantWorkplaces || 0}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 600 }}>
                  Vrij
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Apparatuur (Equipment Status) */}
        <Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: bgSurface,
              boxShadow: getNeumorph(isDark, 'medium'),
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              border: `1px solid ${alpha('#FF7700', 0.1)}`,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #FF7700 0%, #F59E0B 100%)',
              },
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `${getNeumorph(isDark, 'strong')}, 0 8px 16px ${alpha('#FF7700', 0.12)}`,
              },
            }}
          >
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${alpha('#FF7700', 0.15)} 0%, ${alpha('#F59E0B', 0.15)} 100%)`,
                    boxShadow: `inset 0 2px 6px ${alpha('#FF7700', 0.2)}`,
                  }}
                >
                  <Devices sx={{ fontSize: 20, color: '#FF7700' }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.2 }}>
                    Apparatuur
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                    Toewijzingsstatus per type
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1.5,
                  background: `linear-gradient(135deg, ${alpha('#FF7700', 0.15)} 0%, ${alpha('#F59E0B', 0.1)} 100%)`,
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #FF7700 0%, #F59E0B 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {workplaceStats?.equipment.overallEquipmentRate.toFixed(0)}%
                </Typography>
              </Box>
            </Box>

            {/* Equipment Breakdown */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {equipmentStats?.map((equipment: EquipmentTypeStatus) => {
                const Icon = getEquipmentIcon(equipment.equipmentType);
                const color = getEquipmentColor(equipment.fillRate);

                return (
                  <Box
                    key={equipment.equipmentType}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 0.75,
                      borderRadius: 1.5,
                      bgcolor: alpha(color, 0.05),
                      border: `1px solid ${alpha(color, 0.12)}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: alpha(color, 0.08),
                        transform: 'translateX(2px)',
                        borderColor: alpha(color, 0.25),
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(color, 0.12),
                        flexShrink: 0,
                      }}
                    >
                      <Icon sx={{ fontSize: 16, color }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                          {equipment.displayName}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 800, color }}>
                          {equipment.filledSlots} / {equipment.totalSlots}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={equipment.fillRate}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: alpha(color, 0.15),
                          boxShadow: `inset 0 1px 2px ${alpha('#000', 0.08)}`,
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            bgcolor: color,
                            boxShadow: `0 0 6px ${alpha(color, 0.3)}`,
                          },
                        }}
                      />
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Total Summary */}
            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: `2px solid ${alpha('#FF7700', 0.1)}`,
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600, mb: 0.5, display: 'block' }}>
                Totaal toewijzing
              </Typography>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#FF7700' }}>
                {equipmentStats?.reduce((sum, e) => sum + e.filledSlots, 0)} /{' '}
                {equipmentStats?.reduce((sum, e) => sum + e.totalSlots, 0)} slots
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      </Zoom>

      {/* Asset Planning Calendar - Prominent Feature */}
      <Fade in timeout={800}>
        <Box sx={{ mb: 1.5 }}>
          <AssetPlanningCalendar />
        </Box>
      </Fade>

      {/* Second Row: Upcoming Rollouts + Stock Inventory */}
      <Zoom in timeout={900}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5, mb: 1.5 }}>
        {/* Planned Onboarding/Offboarding */}
        <Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: bgSurface,
              boxShadow: getNeumorph(isDark, 'medium'),
              maxHeight: 350,
              overflow: 'hidden',
              border: `1px solid ${alpha('#9C27B0', 0.1)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `${getNeumorph(isDark, 'strong')}, 0 8px 16px ${alpha('#9C27B0', 0.12)}`,
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `linear-gradient(135deg, ${alpha('#9C27B0', 0.15)} 0%, ${alpha('#7C3AED', 0.15)} 100%)`,
                  boxShadow: `inset 0 2px 4px ${alpha('#9C27B0', 0.2)}`,
                }}
              >
                <CalendarMonth sx={{ fontSize: 18, color: '#9C27B0' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.2 }}>
                  Geplande Rollouts
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                  Toekomstige onboarding met voorraad indicatie
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0.75,
                maxHeight: 260,
                overflowY: 'auto',
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: alpha('#9C27B0', 0.3),
                  borderRadius: 2,
                },
              }}
            >
              {upcomingRollouts.length > 0 ? (
                upcomingRollouts.map((rollout) => (
                  <Box
                    key={rollout.sessionId}
                    onClick={() => navigate(`${ROUTES.ROLLOUTS}?session=${rollout.sessionId}`)}
                    sx={{
                      p: 1,
                      borderRadius: 1.5,
                      bgcolor: alpha(rollout.hasEnoughLaptops ? '#10B981' : '#EF4444', 0.08),
                      border: `1px solid ${alpha(
                        rollout.hasEnoughLaptops ? '#10B981' : '#EF4444',
                        0.2
                      )}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: alpha(rollout.hasEnoughLaptops ? '#10B981' : '#EF4444', 0.12),
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {rollout.sessionName}
                      </Typography>
                      <Chip
                        icon={rollout.hasEnoughLaptops ? <CheckCircle /> : <Warning />}
                        label={rollout.hasEnoughLaptops ? 'Voorraad OK' : 'Tekort'}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          bgcolor: alpha(rollout.hasEnoughLaptops ? '#10B981' : '#EF4444', 0.15),
                          color: rollout.hasEnoughLaptops ? '#10B981' : '#EF4444',
                          '& .MuiChip-icon': { fontSize: 12 },
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', display: 'block' }}>
                      {rollout.totalWorkplaces} werkplekken • {formatDate(rollout.earliestDate)}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                      Geschatte behoefte: {rollout.estimatedLaptopsNeeded} LAP
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.disabled', p: 1 }}>
                  Geen geplande rollouts
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Stock Inventory (Laptops + Desktops) */}
        <Box sx={{ flex: '1 1 calc(50% - 16px)', minWidth: 320 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: bgSurface,
              boxShadow: getNeumorph(isDark, 'medium'),
              maxHeight: 400,
              overflow: 'hidden',
              border: `1px solid ${alpha('#3B82F6', 0.1)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `${getNeumorph(isDark, 'strong')}, 0 8px 20px ${alpha('#3B82F6', 0.12)}`,
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `linear-gradient(135deg, ${alpha('#3B82F6', 0.15)} 0%, ${alpha('#14B8A6', 0.15)} 100%)`,
                  boxShadow: `inset 0 2px 6px ${alpha('#3B82F6', 0.2)}`,
                }}
              >
                <Inventory2 sx={{ fontSize: 24, color: '#3B82F6' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.2 }}>
                  Voorraad (Stock)
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                  Beschikbare apparaten in voorraad
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Box
                sx={{
                  flex: 1,
                  p: 0.75,
                  borderRadius: 1.5,
                  bgcolor: alpha('#3B82F6', 0.08),
                  textAlign: 'center',
                }}
              >
                <Laptop sx={{ fontSize: 16, color: '#3B82F6', mb: 0.25 }} />
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, color: '#3B82F6' }}>
                  {stockMetrics.totalLaptopsStock}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                  Laptops (LAP)
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  p: 0.75,
                  borderRadius: 1.5,
                  bgcolor: alpha('#14B8A6', 0.08),
                  textAlign: 'center',
                }}
              >
                <Computer sx={{ fontSize: 16, color: '#14B8A6', mb: 0.25 }} />
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, color: '#14B8A6' }}>
                  {stockMetrics.totalDesktopsStock}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                  Desktops (DESK)
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                maxHeight: 220,
                overflowY: 'auto',
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: alpha('#3B82F6', 0.3),
                  borderRadius: 2,
                },
              }}
            >
              {/* Laptops */}
              {stockMetrics.laptopsInStock.slice(0, 5).map((asset) => (
                <Box
                  key={asset.id}
                  onClick={() => navigate(`${ROUTES.ASSET_DETAIL}/${asset.id}`)}
                  sx={{
                    p: 0.75,
                    mb: 0.5,
                    borderRadius: 1,
                    bgcolor: alpha('#3B82F6', 0.05),
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: alpha('#3B82F6', 0.1),
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {asset.assetCode}
                    </Typography>
                    <Chip label="LAP" size="small" sx={{ height: 16, fontSize: '0.6rem' }} />
                  </Box>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                    {asset.brand} {asset.model}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled' }}>
                    SN: {asset.serialNumber || 'N/A'}
                  </Typography>
                </Box>
              ))}

              {/* Desktops */}
              {stockMetrics.desktopsInStock.slice(0, 3).map((asset) => (
                <Box
                  key={asset.id}
                  onClick={() => navigate(`${ROUTES.ASSET_DETAIL}/${asset.id}`)}
                  sx={{
                    p: 0.75,
                    mb: 0.5,
                    borderRadius: 1,
                    bgcolor: alpha('#14B8A6', 0.05),
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: alpha('#14B8A6', 0.1),
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {asset.assetCode}
                    </Typography>
                    <Chip label="DESK" size="small" sx={{ height: 16, fontSize: '0.6rem' }} />
                  </Box>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                    {asset.brand} {asset.model}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled' }}>
                    SN: {asset.serialNumber || 'N/A'}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
      </Zoom>

      {/* Third Row: Upcoming Available Devices + Expiring Certificates */}
      <Fade in timeout={1000}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5 }}>
        {/* Devices Becoming Available */}
        <Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: bgSurface,
              boxShadow: getNeumorph(isDark, 'medium'),
              maxHeight: 300,
              overflow: 'hidden',
              border: `1px solid ${alpha('#10B981', 0.1)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `${getNeumorph(isDark, 'strong')}, 0 8px 16px ${alpha('#10B981', 0.12)}`,
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `linear-gradient(135deg, ${alpha('#10B981', 0.15)} 0%, ${alpha('#059669', 0.15)} 100%)`,
                  boxShadow: `inset 0 2px 4px ${alpha('#10B981', 0.2)}`,
                }}
              >
                <TrendingDown sx={{ fontSize: 18, color: '#10B981' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.2 }}>
                  Vrijkomende Apparaten
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
                  Apparaten beschikbaar binnen 90 dagen
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                maxHeight: 180,
                overflowY: 'auto',
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: alpha('#10B981', 0.3),
                  borderRadius: 2,
                },
              }}
            >
              {upcomingAvailableDevices.length > 0 ? (
                upcomingAvailableDevices.map((device, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      p: 0.75,
                      mb: 0.5,
                      borderRadius: 1,
                      bgcolor: alpha('#10B981', 0.05),
                      border: `1px solid ${alpha('#10B981', 0.15)}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                        {device.assetCode}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#10B981' }}>
                        {formatDate(device.expectedDate)}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                      {device.brand} {device.model}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.disabled', p: 1 }}>
                  Geen verwachte vrijkomende apparaten
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Expiring Management Certificates */}
        <Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: bgSurface,
              boxShadow: getNeumorph(isDark, 'medium'),
              maxHeight: 300,
              overflow: 'hidden',
              border: `1px solid ${alpha('#F59E0B', 0.1)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `${getNeumorph(isDark, 'strong')}, 0 8px 16px ${alpha('#F59E0B', 0.12)}`,
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `linear-gradient(135deg, ${alpha('#F59E0B', 0.15)} 0%, ${alpha('#EF4444', 0.15)} 100%)`,
                  boxShadow: `inset 0 2px 4px ${alpha('#F59E0B', 0.2)}`,
                }}
              >
                <Warning sx={{ fontSize: 18, color: '#F59E0B' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.2 }}>
                  Verlopende Certificaten
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
                  Management certificaten binnen 90 dagen
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                maxHeight: 180,
                overflowY: 'auto',
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: alpha('#F59E0B', 0.3),
                  borderRadius: 2,
                },
              }}
            >
              {expiringCertificates.length > 0 ? (
                expiringCertificates.map((cert, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      p: 0.75,
                      mb: 0.5,
                      borderRadius: 1,
                      bgcolor: alpha('#F59E0B', 0.05),
                      border: `1px solid ${alpha('#F59E0B', 0.15)}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: alpha('#F59E0B', 0.08),
                        borderColor: alpha('#F59E0B', 0.25),
                        transform: 'translateX(2px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                        {cert.assetCode}
                      </Typography>
                      <Chip
                        label={`${cert.daysRemaining}d`}
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: '0.6rem',
                          fontWeight: 600,
                          bgcolor: alpha(cert.daysRemaining <= 30 ? '#EF4444' : '#F59E0B', 0.15),
                          color: cert.daysRemaining <= 30 ? '#EF4444' : '#F59E0B',
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                      {cert.brand} {cert.model}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <Person sx={{ fontSize: 12, color: '#3B82F6' }} />
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#3B82F6', fontWeight: 600 }}>
                        {cert.primaryUser}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled', display: 'block', mt: 0.25 }}>
                      Verloopt: {formatDate(cert.expiryDate)}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.disabled', p: 1 }}>
                  Geen verlopende certificaten
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
      </Fade>
    </Box>
  );
};

export default OverviewTab;

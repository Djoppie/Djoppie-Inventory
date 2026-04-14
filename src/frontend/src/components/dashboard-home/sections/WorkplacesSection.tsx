import React from 'react';
import { Box, Typography, useTheme, alpha, LinearProgress } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { WORKPLACE_COLOR } from '../../../constants/filterColors';
import { ROUTES } from '../../../constants/routes';
import DashboardSection from './DashboardSection';
import SectionKPICard from './SectionKPICard';

interface WorkplaceStatistics {
  totalWorkplaces?: number;
  activeWorkplaces?: number;
  occupiedWorkplaces?: number;
  vacantWorkplaces?: number;
  occupancyRate?: number;
}

interface EquipmentStat {
  equipmentType: string;
  displayName: string;
  totalSlots: number;
  filledSlots: number;
  emptySlots: number;
}

interface WorkplacesSectionProps {
  workplaceStats?: WorkplaceStatistics;
  equipmentStats?: EquipmentStat[];
  delay?: number;
}

const WorkplacesSection: React.FC<WorkplacesSectionProps> = ({
  workplaceStats,
  equipmentStats = [],
  delay = 0,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const occupancyRate = workplaceStats?.occupancyRate ?? 0;
  const occupancyColor = occupancyRate >= 80 ? '#4CAF50' : occupancyRate >= 50 ? '#FF9800' : '#f44336';

  return (
    <DashboardSection
      title="Werkplekken"
      icon={<BusinessIcon />}
      accentColor={WORKPLACE_COLOR}
      route={ROUTES.PHYSICAL_WORKPLACES}
      delay={delay}
    >
      {/* KPI Cards Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 1.5,
          mb: 2,
        }}
      >
        <SectionKPICard
          label="Bezettingsgraad"
          value={Math.round(occupancyRate)}
          color={occupancyColor}
          icon={<PeopleIcon />}
          isPercentage
        />
        <SectionKPICard
          label="Totaal Actief"
          value={workplaceStats?.activeWorkplaces ?? 0}
          color={WORKPLACE_COLOR}
          icon={<BusinessIcon />}
        />
        <SectionKPICard
          label="Bezet"
          value={workplaceStats?.occupiedWorkplaces ?? 0}
          color="#4CAF50"
          icon={<CheckCircleOutlineIcon />}
        />
        <SectionKPICard
          label="Vrij"
          value={workplaceStats?.vacantWorkplaces ?? 0}
          color="#2196F3"
          icon={<EventSeatIcon />}
        />
      </Box>

      {/* Mini Equipment Fill Rates */}
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: isDark ? alpha('#1a1f2e', 0.4) : alpha('#f8f8f8', 0.8),
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: isDark ? alpha('#fff', 0.5) : alpha('#000', 0.5),
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            mb: 1,
            display: 'block',
          }}
        >
          Apparatuur Toewijzing
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {equipmentStats.slice(0, 3).map((eq) => {
            const percent = eq.totalSlots > 0 ? Math.round((eq.filledSlots / eq.totalSlots) * 100) : 0;
            const fillColor = percent >= 80 ? '#4CAF50' : percent >= 50 ? '#FF9800' : '#f44336';
            return (
              <Box key={eq.equipmentType}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: isDark ? alpha('#fff', 0.7) : alpha('#000', 0.7) }}>
                    {eq.displayName}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600, color: fillColor }}>
                    {eq.filledSlots}/{eq.totalSlots}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={percent}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: isDark ? alpha('#fff', 0.1) : alpha('#000', 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: fillColor,
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>
            );
          })}
        </Box>
      </Box>
    </DashboardSection>
  );
};

export default WorkplacesSection;

import React, { useMemo } from 'react';
import { Box, Typography, useTheme, alpha, Chip } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { EMPLOYEE_COLOR } from '../../../constants/filterColors';
import { ROUTES } from '../../../constants/routes';
import DashboardSection from './DashboardSection';
import SectionKPICard from './SectionKPICard';

interface AssetRequest {
  id: number;
  type: 'Onboarding' | 'Offboarding' | 'Transfer';
  status: 'Pending' | 'InProgress' | 'Completed' | 'Cancelled';
  employeeName?: string;
  createdAt?: string;
}

interface RequestsSectionProps {
  requests?: AssetRequest[];
  delay?: number;
}

const RequestsSection: React.FC<RequestsSectionProps> = ({
  requests = [],
  delay = 0,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const kpis = useMemo(() => {
    const pending = requests.filter(r => r.status === 'Pending' || r.status === 'InProgress').length;
    const onboarding = requests.filter(r => r.type === 'Onboarding' && (r.status === 'Pending' || r.status === 'InProgress')).length;
    const offboarding = requests.filter(r => r.type === 'Offboarding' && (r.status === 'Pending' || r.status === 'InProgress')).length;

    // Completed this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const completedThisWeek = requests.filter(r => {
      if (r.status !== 'Completed' || !r.createdAt) return false;
      return new Date(r.createdAt) >= weekAgo;
    }).length;

    return { pending, onboarding, offboarding, completedThisWeek };
  }, [requests]);

  // Recent requests
  const recentRequests = useMemo(() => {
    return [...requests]
      .filter(r => r.status === 'Pending' || r.status === 'InProgress')
      .slice(0, 3);
  }, [requests]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Onboarding': return <PersonAddIcon sx={{ fontSize: 12 }} />;
      case 'Offboarding': return <PersonRemoveIcon sx={{ fontSize: 12 }} />;
      default: return <AssignmentIcon sx={{ fontSize: 12 }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#FF9800';
      case 'InProgress': return '#2196F3';
      case 'Completed': return '#4CAF50';
      case 'Cancelled': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  return (
    <DashboardSection
      title="Requests"
      icon={<AssignmentIcon />}
      accentColor={EMPLOYEE_COLOR}
      route={ROUTES.REQUESTS}
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
          label="Openstaand"
          value={kpis.pending}
          color={EMPLOYEE_COLOR}
          icon={<PendingActionsIcon />}
          pulse={kpis.pending > 0}
        />
        <SectionKPICard
          label="Onboarding"
          value={kpis.onboarding}
          color="#4CAF50"
          icon={<PersonAddIcon />}
        />
        <SectionKPICard
          label="Offboarding"
          value={kpis.offboarding}
          color="#f44336"
          icon={<PersonRemoveIcon />}
        />
        <SectionKPICard
          label="Voltooid (7d)"
          value={kpis.completedThisWeek}
          color="#2196F3"
          icon={<CheckCircleIcon />}
        />
      </Box>

      {/* Mini Recent Requests */}
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
          Recente Requests
        </Typography>
        {recentRequests.length === 0 ? (
          <Typography variant="caption" sx={{ color: isDark ? alpha('#fff', 0.4) : alpha('#000', 0.4), fontStyle: 'italic' }}>
            Geen openstaande requests
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {recentRequests.map((request) => (
              <Box
                key={request.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1 }}>
                  <Box sx={{ color: EMPLOYEE_COLOR, display: 'flex' }}>
                    {getTypeIcon(request.type)}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.65rem',
                      color: isDark ? alpha('#fff', 0.8) : alpha('#000', 0.8),
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {request.employeeName || `Request #${request.id}`}
                  </Typography>
                </Box>
                <Chip
                  label={request.status === 'Pending' ? 'Wacht' : 'Bezig'}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.55rem',
                    fontWeight: 600,
                    bgcolor: alpha(getStatusColor(request.status), 0.15),
                    color: getStatusColor(request.status),
                    '& .MuiChip-label': { px: 0.75 },
                    flexShrink: 0,
                  }}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </DashboardSection>
  );
};

export default RequestsSection;

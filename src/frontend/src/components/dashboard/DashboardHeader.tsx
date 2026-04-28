import { Box, Typography, Tooltip, IconButton, Chip, Badge, alpha, useTheme, Card } from '@mui/material';
import { useTranslation } from 'react-i18next';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import CommentIcon from '@mui/icons-material/Comment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import StatusCardGrid from './StatusCardGrid';
import { StatusCounts } from '../../hooks/dashboard';

interface DashboardHeaderProps {
  statusCounts: StatusCounts;
  statusFilter: string;
  hasNotes: boolean;
  onStatusClick: (status: string) => void;
  onNotesClick: (event: React.MouseEvent<HTMLElement>) => void;
  onAlarmsClick: (event: React.MouseEvent<HTMLElement>) => void;
  notesOpen: boolean;
  alarmsOpen: boolean;
}

export default function DashboardHeader({
  statusCounts,
  statusFilter,
  hasNotes,
  onStatusClick,
  onNotesClick,
  onAlarmsClick,
  notesOpen,
  alarmsOpen,
}: DashboardHeaderProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <>
    <Card
      elevation={0}
      sx={{
        mb: 3,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(255, 215, 0, 0.2), inset 0 0 24px rgba(255, 215, 0, 0.05)'
              : '0 4px 20px rgba(253, 185, 49, 0.3)',
        },
      }}
    >
      {/* Title bar */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <DashboardIcon
            sx={{
              fontSize: 32,
              color: 'primary.main',
              filter: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))'
                  : 'none',
            }}
          />
          <Typography variant="h5" component="h1" fontWeight={700}>
            {t('dashboard.title')}
          </Typography>
        </Box>

        {/* Right side: icon buttons + total count */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Discussion & Notes */}
          <Tooltip title="Discussion & Notes">
            <IconButton
              onClick={onNotesClick}
              size="small"
              sx={{
                border: '1px solid',
                borderColor: notesOpen ? 'primary.main' : 'divider',
                borderRadius: 1.5,
                color: notesOpen ? 'primary.main' : 'text.secondary',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              <Badge
                variant={hasNotes ? 'dot' : 'standard'}
                color="primary"
                invisible={!hasNotes}
              >
                <CommentIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Upcoming Alarms / Requests */}
          <Tooltip title={t('dashboard.alarms', { defaultValue: 'Alarms & Requests' })}>
            <IconButton
              onClick={onAlarmsClick}
              size="small"
              sx={{
                border: '1px solid',
                borderColor: alarmsOpen ? 'primary.main' : 'divider',
                borderRadius: 1.5,
                color: alarmsOpen ? 'primary.main' : 'text.secondary',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              <NotificationsIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Total count badge */}
          <Chip
            icon={<InventoryIcon />}
            label={`${statusCounts.total} assets`}
            onClick={() => onStatusClick('')}
            sx={{
              ml: 0.5,
              fontWeight: 700,
              fontSize: '0.9rem',
              border: statusFilter === '' ? '2px solid' : '1px solid',
              borderColor: statusFilter === '' ? 'primary.main' : 'divider',
              color: statusFilter === '' ? 'primary.main' : 'text.primary',
            }}
          />
        </Box>
      </Box>

      {/* Status cards grid */}
      <StatusCardGrid
        statusCounts={statusCounts}
        statusFilter={statusFilter}
        onStatusClick={onStatusClick}
      />
    </Card>

    </>
  );
}

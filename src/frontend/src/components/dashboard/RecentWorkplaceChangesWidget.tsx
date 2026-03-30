import {
  Box,
  Typography,
  Paper,
  alpha,
  useTheme,
  Skeleton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Theme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import HistoryIcon from '@mui/icons-material/History';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DevicesIcon from '@mui/icons-material/Devices';
import { useWorkplaceRecentChanges } from '../../hooks/usePhysicalWorkplaces';
import type { WorkplaceChange } from '../../types/physicalWorkplace.types';

/**
 * Get icon for change type
 */
const getChangeIcon = (changeType: string) => {
  switch (changeType) {
    case 'occupancy':
      return PersonAddIcon;
    case 'equipment':
      return DevicesIcon;
    default:
      return HistoryIcon;
  }
};

/**
 * Get color for change type
 */
const getChangeColor = (changeType: string, theme: Theme) => {
  switch (changeType) {
    case 'occupancy':
      return theme.palette.success.main;
    case 'equipment':
      return theme.palette.info.main;
    default:
      return theme.palette.grey[500];
  }
};

/**
 * Widget showing recent workplace changes (occupancy, equipment assignments)
 * Activity feed for the dashboard
 */
const RecentWorkplaceChangesWidget = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { data: changes, isLoading, error } = useWorkplaceRecentChanges(8);

  const handleChangeClick = (workplaceId: number) => {
    navigate(`/workplaces/${workplaceId}`);
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true, locale: nl });
    } catch {
      return dateString;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          height: '100%',
        }}
      >
        <Skeleton variant="text" width="60%" height={32} />
        <Box sx={{ mt: 2 }}>
          {[1, 2, 3, 4].map((i) => (
            <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Skeleton variant="circular" width={32} height={32} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="70%" />
                <Skeleton variant="text" width="40%" />
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>
    );
  }

  // Error state
  if (error || !changes) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'error.main',
          bgcolor: alpha(theme.palette.error.main, 0.05),
        }}
      >
        <Typography color="error">
          Fout bij laden recente wijzigingen
        </Typography>
      </Paper>
    );
  }

  // Empty state
  if (changes.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${theme.palette.grey[400]}, ${theme.palette.grey[500]})`,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 2,
              background: alpha(theme.palette.grey[500], 0.1),
              color: theme.palette.grey[500],
            }}
          >
            <HistoryIcon />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Recente wijzigingen
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          Geen recente wijzigingen gevonden
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.info.main})`,
        },
      }}
    >
      <Box sx={{ p: 3, pb: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 2,
              background: alpha(theme.palette.success.main, 0.1),
              color: theme.palette.success.main,
            }}
          >
            <HistoryIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Recente wijzigingen
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Werkplek activiteit
            </Typography>
          </Box>
          <Chip
            label={changes.length}
            size="small"
            sx={{
              ml: 'auto',
              fontWeight: 600,
              backgroundColor: alpha(theme.palette.success.main, 0.15),
              color: theme.palette.success.main,
            }}
          />
        </Box>
      </Box>

      <Divider />

      {/* Changes list */}
      <List sx={{ p: 0 }}>
        {changes.map((change: WorkplaceChange, index: number) => {
          const Icon = getChangeIcon(change.changeType);
          const color = getChangeColor(change.changeType, theme);

          return (
            <Box key={`${change.workplaceId}-${change.changedAt}`}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => handleChangeClick(change.workplaceId)}
                  sx={{
                    py: 1.5,
                    px: 3,
                    '&:hover': {
                      bgcolor: alpha(color, 0.05),
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 1.5,
                        bgcolor: alpha(color, 0.1),
                        color: color,
                      }}
                    >
                      <Icon sx={{ fontSize: 18 }} />
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primaryTypographyProps={{ component: 'div' }}
                    secondaryTypographyProps={{ component: 'div' }}
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {change.workplaceCode}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {change.workplaceName}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                        <Typography variant="caption" color="text.secondary">
                          {change.description}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.disabled', fontSize: '0.7rem' }}
                        >
                          {formatRelativeTime(change.changedAt)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
              {index < changes.length - 1 && <Divider />}
            </Box>
          );
        })}
      </List>

      {/* View all link */}
      <Divider />
      <Box
        sx={{
          p: 2,
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
        }}
        onClick={() => navigate('/workplaces')}
      >
        <Typography
          variant="caption"
          sx={{ color: 'primary.main', fontWeight: 600 }}
        >
          Bekijk alle werkplekken
        </Typography>
      </Box>
    </Paper>
  );
};

export default RecentWorkplaceChangesWidget;

import { logger } from '../../utils/logger';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Collapse,
  IconButton,
  Alert,
  alpha,
  useTheme,
  CircularProgress,
  Stack,
  Avatar,
} from '@mui/material';
import {
  AddCircle as AddCircleIcon,
  Edit as EditIcon,
  SwapHoriz as SwapHorizIcon,
  Person as PersonIcon,
  LocationOn as LocationOnIcon,
  Build as BuildIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { assetEventsApi, AssetEvent } from '../../api/assetEvents.api';

interface AssetEventHistoryProps {
  assetId: number;
}

const AssetEventHistory = ({ assetId }: AssetEventHistoryProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [events, setEvents] = useState<AssetEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await assetEventsApi.getByAssetId(assetId);
        setEvents(data);
        setError(null);
      } catch (err) {
        logger.error('Failed to fetch asset events:', err);
        setError(err instanceof Error ? err.message : t('assetEvents.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [assetId, t]);

  const toggleExpanded = (eventId: number) => {
    setExpandedEvents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const getEventIcon = (eventType: string) => {
    const type = eventType.toLowerCase();
    // Handle both "StatusChanged" and "statuschange" formats
    if (type === 'created' || type === 'create' || type === 'aangemaakt') {
      return <AddCircleIcon />;
    }
    if (type === 'updated' || type === 'update' || type === 'edited' || type === 'edit' || type === 'gewijzigd') {
      return <EditIcon />;
    }
    if (type.includes('status')) {
      return <SwapHorizIcon />;
    }
    if (type.includes('owner') || type === 'eigenaargewijzigd') {
      return <PersonIcon />;
    }
    if (type.includes('location') || type === 'locatiegewijzigd') {
      return <LocationOnIcon />;
    }
    if (type === 'maintenance' || type === 'repair' || type === 'onderhoud' || type === 'herstelling') {
      return <BuildIcon />;
    }
    if (type === 'deleted' || type === 'delete' || type === 'verwijderd') {
      return <DeleteIcon />;
    }
    return <HistoryIcon />;
  };

  // Custom colors for different event types
  const getEventColorValues = (eventType: string): { bg: string; text: string; main: string } => {
    const type = eventType.toLowerCase();

    // Created - Green
    if (type === 'created' || type === 'create' || type === 'aangemaakt') {
      return {
        bg: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.15)',
        text: '#4CAF50',
        main: '#4CAF50',
      };
    }
    // Status Changed - Orange/Warning
    if (type.includes('status')) {
      return {
        bg: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.15)',
        text: '#FF9800',
        main: '#FF9800',
      };
    }
    // Owner Changed - Blue/Info
    if (type.includes('owner') || type === 'eigenaargewijzigd') {
      return {
        bg: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.15)',
        text: '#2196F3',
        main: '#2196F3',
      };
    }
    // Location Changed - Purple
    if (type.includes('location') || type === 'locatiegewijzigd') {
      return {
        bg: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.2)' : 'rgba(156, 39, 176, 0.15)',
        text: '#9C27B0',
        main: '#9C27B0',
      };
    }
    // Updated/Edited - Cyan
    if (type === 'updated' || type === 'update' || type === 'edited' || type === 'edit' || type === 'gewijzigd') {
      return {
        bg: theme.palette.mode === 'dark' ? 'rgba(0, 188, 212, 0.2)' : 'rgba(0, 188, 212, 0.15)',
        text: '#00BCD4',
        main: '#00BCD4',
      };
    }
    // Maintenance/Repair - Amber
    if (type === 'maintenance' || type === 'repair' || type === 'onderhoud' || type === 'herstelling') {
      return {
        bg: theme.palette.mode === 'dark' ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 193, 7, 0.15)',
        text: '#FFC107',
        main: '#FFC107',
      };
    }
    // Deleted - Red
    if (type === 'deleted' || type === 'delete' || type === 'verwijderd') {
      return {
        bg: theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.15)',
        text: '#F44336',
        main: '#F44336',
      };
    }
    // Default - Grey
    return {
      bg: theme.palette.mode === 'dark' ? 'rgba(158, 158, 158, 0.2)' : 'rgba(158, 158, 158, 0.15)',
      text: '#9E9E9E',
      main: '#9E9E9E',
    };
  };

  // Get status-specific colors for status change events
  const getStatusColor = (status: string): { bg: string; text: string; border: string } => {
    const statusLower = status.toLowerCase();

    // InGebruik - Green (In use)
    if (statusLower === 'ingebruik' || statusLower === 'in gebruik') {
      return {
        bg: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.15)',
        text: '#4CAF50',
        border: '#4CAF50',
      };
    }
    // Stock - Blue
    if (statusLower === 'stock') {
      return {
        bg: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.15)',
        text: '#2196F3',
        border: '#2196F3',
      };
    }
    // Herstelling - Orange (Repair)
    if (statusLower === 'herstelling') {
      return {
        bg: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.15)',
        text: '#FF9800',
        border: '#FF9800',
      };
    }
    // Defect - Red
    if (statusLower === 'defect') {
      return {
        bg: theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.15)',
        text: '#F44336',
        border: '#F44336',
      };
    }
    // UitDienst - Grey (Decommissioned)
    if (statusLower === 'uitdienst' || statusLower === 'uit dienst') {
      return {
        bg: theme.palette.mode === 'dark' ? 'rgba(158, 158, 158, 0.2)' : 'rgba(158, 158, 158, 0.15)',
        text: '#9E9E9E',
        border: '#9E9E9E',
      };
    }
    // Nieuw - Purple (New)
    if (statusLower === 'nieuw') {
      return {
        bg: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.2)' : 'rgba(156, 39, 176, 0.15)',
        text: '#9C27B0',
        border: '#9C27B0',
      };
    }
    // Default - Grey
    return {
      bg: theme.palette.mode === 'dark' ? 'rgba(158, 158, 158, 0.2)' : 'rgba(158, 158, 158, 0.15)',
      text: theme.palette.text.secondary,
      border: theme.palette.divider,
    };
  };

  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (events.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          textAlign: 'center',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.primary.main, 0.02),
        }}
      >
        <HistoryIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          {t('assetEvents.noEvents')}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 700 }}>
        {t('assetEvents.title')} ({events.length})
      </Typography>

      <Stack spacing={2}>
        {events.map((event, index) => {
          const isExpanded = expandedEvents.has(event.id);
          const hasDetails = event.oldValue || event.newValue || event.notes;
          const eventColors = getEventColorValues(event.eventType);

          return (
            <Box key={event.id} sx={{ position: 'relative', pl: { xs: 0, sm: 6 } }}>
              {/* Timeline dot for desktop */}
              <Box
                sx={{
                  display: { xs: 'none', sm: 'flex' },
                  position: 'absolute',
                  left: 0,
                  top: 12,
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: eventColors.main,
                    color: '#fff',
                    boxShadow: `0 2px 8px ${alpha(eventColors.main, 0.4)}`,
                  }}
                >
                  {getEventIcon(event.eventType)}
                </Avatar>
                {index < events.length - 1 && (
                  <Box
                    sx={{
                      width: 2,
                      flex: 1,
                      minHeight: 40,
                      bgcolor: alpha(eventColors.main, 0.3),
                      mt: 1,
                    }}
                  />
                )}
              </Box>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    background:
                      theme.palette.mode === 'light'
                        ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)}, ${alpha(
                            theme.palette.primary.light,
                            0.05
                          )})`
                        : `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.1)}, ${alpha(
                            theme.palette.primary.main,
                            0.05
                          )})`,
                    boxShadow:
                      theme.palette.mode === 'light'
                        ? '1px 1px 3px rgba(0, 0, 0, 0.05), -1px -1px 3px rgba(255, 255, 255, 0.9)'
                        : '2px 2px 4px rgba(0, 0, 0, 0.4), -1px -1px 2px rgba(255, 255, 255, 0.02)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateX(4px)',
                      boxShadow:
                        theme.palette.mode === 'light'
                          ? '2px 2px 6px rgba(0, 0, 0, 0.1), -2px -2px 6px rgba(255, 255, 255, 0.9)'
                          : '3px 3px 8px rgba(0, 0, 0, 0.6), -2px -2px 4px rgba(255, 255, 255, 0.03)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Chip
                          label={t(`assetEvents.types.${event.eventType.toLowerCase()}`, event.eventType)}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            bgcolor: eventColors.bg,
                            color: eventColors.text,
                            borderColor: eventColors.main,
                            border: '1px solid',
                          }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: { xs: 'block', sm: 'none' } }}
                        >
                          {formatEventDate(event.eventDate)}
                        </Typography>
                      </Box>

                      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                        {event.description}
                      </Typography>

                      {event.performedBy && (
                        <Typography variant="caption" color="text.secondary">
                          {t('assetEvents.performedBy')}: {event.performedBy}
                          {event.performedByEmail && ` (${event.performedByEmail})`}
                        </Typography>
                      )}
                    </Box>

                    {hasDetails && (
                      <IconButton
                        size="small"
                        onClick={() => toggleExpanded(event.id)}
                        sx={{
                          ml: 1,
                          color: theme.palette.primary.main,
                        }}
                      >
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    )}
                  </Box>

                  {/* Expandable Details */}
                  {hasDetails && (
                    <Collapse in={isExpanded}>
                      <Box
                        sx={{
                          mt: 2,
                          pt: 2,
                          borderTop: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        {event.oldValue && event.newValue && (() => {
                          const isStatusChange = event.eventType.toLowerCase().includes('status');
                          const oldColors = isStatusChange ? getStatusColor(event.oldValue) : null;
                          const newColors = isStatusChange ? getStatusColor(event.newValue) : null;

                          return (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {t('assetEvents.changed')}:
                              </Typography>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  flexWrap: 'wrap',
                                  mt: 0.5,
                                }}
                              >
                                <Chip
                                  label={event.oldValue}
                                  size="small"
                                  sx={{
                                    bgcolor: oldColors?.bg ?? alpha(theme.palette.error.main, 0.1),
                                    color: oldColors?.text ?? 'error.main',
                                    border: '1px solid',
                                    borderColor: oldColors?.border ?? theme.palette.error.main,
                                    textDecoration: 'line-through',
                                    opacity: 0.7,
                                  }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  →
                                </Typography>
                                <Chip
                                  label={event.newValue}
                                  size="small"
                                  sx={{
                                    bgcolor: newColors?.bg ?? alpha(theme.palette.success.main, 0.1),
                                    color: newColors?.text ?? 'success.main',
                                    border: '1px solid',
                                    borderColor: newColors?.border ?? theme.palette.success.main,
                                    fontWeight: 600,
                                  }}
                                />
                              </Box>
                            </Box>
                          );
                        })()}

                        {event.notes && (
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {t('assetEvents.notes')}:
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {event.notes}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  )}
                </Paper>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};

export default AssetEventHistory;

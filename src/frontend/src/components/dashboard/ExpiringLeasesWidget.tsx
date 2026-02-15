import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  alpha,
  useTheme,
  Paper,
  Divider,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays, parseISO } from 'date-fns';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EventIcon from '@mui/icons-material/Event';
import { getExpiringLeaseContracts, LeaseContract } from '../../api/leaseContracts.api';
import { logger } from '../../utils/logger';

const ExpiringLeasesWidget = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const [expiringLeases, setExpiringLeases] = useState<LeaseContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExpiringLeases = async () => {
      setIsLoading(true);
      try {
        const leases = await getExpiringLeaseContracts(90);
        setExpiringLeases(leases);
      } catch (error) {
        logger.error('Error fetching expiring leases:', error);
        setExpiringLeases([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExpiringLeases();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd MMM yyyy');
    } catch {
      return dateString;
    }
  };

  const getDaysRemaining = (endDate: string) => {
    try {
      return differenceInDays(parseISO(endDate), new Date());
    } catch {
      return 0;
    }
  };

  const getUrgencyColor = (daysRemaining: number) => {
    if (daysRemaining < 0) return theme.palette.error.main;
    if (daysRemaining < 30) return theme.palette.error.main;
    if (daysRemaining < 60) return theme.palette.warning.main;
    return 'rgb(255, 193, 7)';
  };

  const getUrgencyBgColor = (daysRemaining: number) => {
    if (daysRemaining < 0) return alpha(theme.palette.error.main, 0.1);
    if (daysRemaining < 30) return alpha(theme.palette.error.main, 0.1);
    if (daysRemaining < 60) return alpha(theme.palette.warning.main, 0.1);
    return alpha('rgb(255, 193, 7)', 0.1);
  };

  const handleLeaseClick = (assetId: number) => {
    navigate(`/assets/${assetId}`);
  };

  if (isLoading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {t('common.loading')}
        </Typography>
      </Paper>
    );
  }

  if (expiringLeases.length === 0) {
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
            background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
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
              background: alpha(theme.palette.success.main, 0.1),
              color: theme.palette.success.main,
            }}
          >
            <EventIcon />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('lease.expiringLeases')}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          {t('lease.noExpiringLeases')}
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
          background: `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.error.main})`,
        },
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ p: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 2,
                background: alpha(theme.palette.warning.main, 0.1),
                color: theme.palette.warning.main,
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': {
                    boxShadow: `0 0 0 0 ${alpha(theme.palette.warning.main, 0.4)}`,
                  },
                  '50%': {
                    boxShadow: `0 0 0 8px ${alpha(theme.palette.warning.main, 0)}`,
                  },
                },
              }}
            >
              <WarningAmberIcon />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('lease.expiringLeases')}
            </Typography>
            <Chip
              label={expiringLeases.length}
              size="small"
              sx={{
                ml: 'auto',
                fontWeight: 600,
                backgroundColor: alpha(theme.palette.warning.main, 0.2),
                color: theme.palette.warning.main,
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('lease.expiringLeasesDescription')}
          </Typography>
        </Box>

        <Divider />

        <List sx={{ p: 0 }}>
          {expiringLeases.map((lease, index) => {
            const daysRemaining = getDaysRemaining(lease.endDate);
            return (
              <Box key={lease.id}>
                <ListItem
                  disablePadding
                  sx={{
                    background: getUrgencyBgColor(daysRemaining),
                    borderLeft: '4px solid',
                    borderLeftColor: getUrgencyColor(daysRemaining),
                  }}
                >
                  <ListItemButton
                    onClick={() => handleLeaseClick(lease.assetId)}
                    sx={{
                      py: 2,
                      px: 3,
                      '&:hover': {
                        background: alpha(getUrgencyColor(daysRemaining), 0.15),
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="body1" fontWeight="600">
                            Asset #{lease.assetId}
                          </Typography>
                          {lease.vendor && (
                            <Typography variant="body2" color="text.secondary">
                              • {lease.vendor}
                            </Typography>
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {t('lease.endDate')}: {formatDate(lease.endDate)}
                          </Typography>
                          <Chip
                            label={
                              daysRemaining < 0
                                ? t('lease.expiredDays', { days: Math.abs(daysRemaining) })
                                : t('lease.daysRemaining', { days: daysRemaining })
                            }
                            size="small"
                            sx={{
                              ml: 1,
                              height: 20,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              backgroundColor: alpha(getUrgencyColor(daysRemaining), 0.2),
                              color: getUrgencyColor(daysRemaining),
                              border: '1px solid',
                              borderColor: getUrgencyColor(daysRemaining),
                            }}
                          />
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
                {index < expiringLeases.length - 1 && <Divider />}
              </Box>
            );
          })}
        </List>
      </CardContent>
    </Paper>
  );
};

export default ExpiringLeasesWidget;

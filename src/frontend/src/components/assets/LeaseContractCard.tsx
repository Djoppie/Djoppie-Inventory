import { Box, Typography, Card, CardContent, Chip, Button, alpha, useTheme } from '@mui/material';
import { format, differenceInDays, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { LeaseContract } from '../../api/leaseContracts.api';

interface LeaseContractCardProps {
  leaseContract: LeaseContract | null;
  onEdit?: () => void;
  onAdd?: () => void;
}

const LeaseContractCard = ({ leaseContract, onEdit, onAdd }: LeaseContractCardProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd MMM yyyy');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getDaysRemaining = (endDate: string) => {
    try {
      return differenceInDays(parseISO(endDate), new Date());
    } catch {
      return 0;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Expiring': return 'warning';
      case 'Expired': return 'error';
      case 'Terminated': return 'default';
      case 'Renewed': return 'info';
      default: return 'default';
    }
  };

  const getUrgencyColor = (daysRemaining: number) => {
    if (daysRemaining < 0) return theme.palette.error.main;
    if (daysRemaining < 30) return theme.palette.error.main;
    if (daysRemaining < 60) return theme.palette.warning.main;
    if (daysRemaining < 90) return 'rgb(255, 193, 7)';
    return theme.palette.success.main;
  };

  if (!leaseContract) {
    return (
      <Card
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
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
          },
        }}
      >
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('lease.noActiveContract')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAdd}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              color: '#fff',
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            {t('lease.addContract')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const daysRemaining = getDaysRemaining(leaseContract.endDate);

  return (
    <Card
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
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 2,
                background: theme.palette.mode === 'light'
                  ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.2)})`
                  : `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.3)}, ${alpha(theme.palette.primary.main, 0.2)})`,
                color: theme.palette.primary.main,
                boxShadow: theme.palette.mode === 'light'
                  ? '2px 2px 4px rgba(0, 0, 0, 0.1), -2px -2px 4px rgba(255, 255, 255, 0.9)'
                  : '3px 3px 6px rgba(0, 0, 0, 0.6), -2px -2px 4px rgba(255, 255, 255, 0.03)',
              }}
            >
              <DescriptionIcon />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('lease.currentContract')}
            </Typography>
          </Box>
          <Chip
            label={t(`lease.status.${leaseContract.status.toLowerCase()}`)}
            color={getStatusColor(leaseContract.status)}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {leaseContract.contractNumber && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DescriptionIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('lease.contractNumber')}
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {leaseContract.contractNumber}
                </Typography>
              </Box>
            </Box>
          )}

          {leaseContract.vendor && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('lease.vendor')}
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {leaseContract.vendor}
                </Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarTodayIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('lease.startDate')}
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatDate(leaseContract.startDate)}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EventAvailableIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('lease.endDate')}
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatDate(leaseContract.endDate)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {(leaseContract.monthlyRate || leaseContract.totalValue) && (
            <Box sx={{ display: 'flex', gap: 3 }}>
              {leaseContract.monthlyRate && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachMoneyIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('lease.monthlyRate')}
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(leaseContract.monthlyRate)}
                    </Typography>
                  </Box>
                </Box>
              )}

              {leaseContract.totalValue && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachMoneyIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('lease.totalValue')}
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(leaseContract.totalValue)}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* Days Remaining Indicator */}
          {leaseContract.status === 'Active' && (
            <Box
              sx={{
                mt: 1,
                p: 2,
                borderRadius: 2,
                background: alpha(getUrgencyColor(daysRemaining), 0.1),
                border: '1px solid',
                borderColor: alpha(getUrgencyColor(daysRemaining), 0.3),
              }}
            >
              <Typography variant="body2" sx={{ color: getUrgencyColor(daysRemaining), fontWeight: 600 }}>
                {daysRemaining < 0
                  ? t('lease.expired', { days: Math.abs(daysRemaining) })
                  : t('lease.daysRemaining', { days: daysRemaining })}
              </Typography>
            </Box>
          )}

          {/* Edit Button */}
          <Button
            fullWidth
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={onEdit}
            sx={{
              mt: 1,
              borderRadius: 2,
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              fontWeight: 600,
              '&:hover': {
                borderColor: theme.palette.primary.dark,
                background: alpha(theme.palette.primary.main, 0.05),
              },
            }}
          >
            {t('lease.editContract')}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LeaseContractCard;

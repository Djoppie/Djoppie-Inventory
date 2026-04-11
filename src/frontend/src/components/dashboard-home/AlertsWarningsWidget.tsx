import React from 'react';
import { Box, Typography, Fade, useTheme, alpha, Chip } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import DescriptionIcon from '@mui/icons-material/Description';
import SecurityIcon from '@mui/icons-material/Security';
import InventoryIcon from '@mui/icons-material/Inventory';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getNeumorph } from '../../utils/neumorphicStyles';
import { DANGER_COLOR } from '../../constants/filterColors';

interface ExpiringLease {
  id: number;
  assetCode: string;
  provider: string;
  endDate: string;
}

interface ExpiringCert {
  id: number;
  assetCode: string;
  daysRemaining: number;
}

interface LowStockType {
  typeName: string;
  count: number;
}

interface AlertsWarningsWidgetProps {
  expiringLeases: ExpiringLease[];
  expiringCerts: ExpiringCert[];
  lowStockTypes: LowStockType[];
}

const getDaysRemainingColor = (days: number): string => {
  if (days < 30) return '#f44336';
  if (days < 60) return '#FF9800';
  return '#FDD835';
};

const getDaysFromEndDate = (endDate: string): number => {
  const now = new Date();
  const end = new Date(endDate);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
};

interface AlertSectionProps {
  title: string;
  icon: React.ReactNode;
  isDark: boolean;
  children: React.ReactNode;
  isEmpty: boolean;
}

const AlertSection: React.FC<AlertSectionProps> = ({ title, icon, isDark, children, isEmpty }) => (
  <Box sx={{ mb: 1.5 }}>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 0.75,
        pb: 0.5,
        borderBottom: `1px solid ${isDark ? alpha('#fff', 0.06) : alpha('#000', 0.06)}`,
      }}
    >
      <Box sx={{ color: isDark ? alpha('#fff', 0.5) : alpha('#000', 0.45), display: 'flex' }}>
        {icon}
      </Box>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: isDark ? alpha('#fff', 0.6) : alpha('#000', 0.55),
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          fontSize: '0.7rem',
        }}
      >
        {title}
      </Typography>
    </Box>
    {isEmpty ? (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, py: 0.5, px: 1 }}>
        <CheckCircleIcon sx={{ fontSize: 16, color: '#4CAF50' }} />
        <Typography
          variant="caption"
          sx={{ color: '#4CAF50', fontWeight: 500, fontSize: '0.75rem' }}
        >
          Alles in orde
        </Typography>
      </Box>
    ) : (
      children
    )}
  </Box>
);

export const AlertsWarningsWidget: React.FC<AlertsWarningsWidgetProps> = ({
  expiringLeases,
  expiringCerts,
  lowStockTypes,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const totalAlerts = expiringLeases.length + expiringCerts.length + lowStockTypes.length;
  const allClear = totalAlerts === 0;

  return (
    <Fade in timeout={600}>
      <Box
        sx={{
          borderRadius: 3,
          bgcolor: isDark ? '#232936' : '#ffffff',
          boxShadow: getNeumorph(isDark, 'medium'),
          borderTop: `3px solid ${DANGER_COLOR}`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, pt: 2.5, pb: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(DANGER_COLOR, 0.15),
              color: DANGER_COLOR,
              ...(totalAlerts > 0
                ? {
                    animation: 'alertPulse 2s infinite',
                    '@keyframes alertPulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                    },
                  }
                : {}),
            }}
          >
            <WarningIcon fontSize="small" />
          </Box>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              color: isDark ? '#fff' : '#1a1a2e',
              fontSize: '0.95rem',
              flex: 1,
            }}
          >
            Waarschuwingen
          </Typography>
          {totalAlerts > 0 && (
            <Chip
              label={totalAlerts}
              size="small"
              sx={{
                height: 22,
                minWidth: 28,
                fontSize: '0.72rem',
                fontWeight: 700,
                bgcolor: alpha(DANGER_COLOR, 0.15),
                color: DANGER_COLOR,
                border: 'none',
              }}
            />
          )}
        </Box>

        {/* Content */}
        <Box
          sx={{
            px: 2.5,
            pb: 2.5,
            maxHeight: 380,
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: 5,
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: isDark ? alpha('#fff', 0.12) : alpha('#000', 0.12),
              borderRadius: 3,
            },
            '&::-webkit-scrollbar-thumb:hover': {
              bgcolor: isDark ? alpha('#fff', 0.2) : alpha('#000', 0.2),
            },
          }}
        >
          {allClear ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
                gap: 1.5,
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 48, color: '#4CAF50' }} />
              <Typography
                variant="body2"
                sx={{
                  color: '#4CAF50',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                Geen waarschuwingen
              </Typography>
            </Box>
          ) : (
            <>
              {/* Lease Contracts Section */}
              <AlertSection
                title="Lease Contracten"
                icon={<DescriptionIcon sx={{ fontSize: 16 }} />}
                isDark={isDark}
                isEmpty={expiringLeases.length === 0}
              >
                {expiringLeases.map((lease, index) => {
                  const daysLeft = getDaysFromEndDate(lease.endDate);
                  const dayColor = getDaysRemainingColor(daysLeft);
                  return (
                    <Fade in timeout={300 + index * 80} key={lease.id}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          py: 0.5,
                          px: 1,
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02),
                          },
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 600,
                              color: isDark ? '#fff' : '#1a1a2e',
                              fontSize: '0.78rem',
                              display: 'block',
                            }}
                          >
                            {lease.assetCode}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: isDark ? alpha('#fff', 0.4) : alpha('#000', 0.4),
                              fontSize: '0.68rem',
                            }}
                          >
                            {lease.provider}
                          </Typography>
                        </Box>
                        <Chip
                          label={`${daysLeft}d`}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            bgcolor: alpha(dayColor, 0.15),
                            color: dayColor,
                            border: 'none',
                            ml: 1,
                            flexShrink: 0,
                          }}
                        />
                      </Box>
                    </Fade>
                  );
                })}
              </AlertSection>

              {/* Intune Certificates Section */}
              <AlertSection
                title="Intune Certificaten"
                icon={<SecurityIcon sx={{ fontSize: 16 }} />}
                isDark={isDark}
                isEmpty={expiringCerts.length === 0}
              >
                {expiringCerts.map((cert, index) => {
                  const dayColor = getDaysRemainingColor(cert.daysRemaining);
                  return (
                    <Fade in timeout={300 + index * 80} key={cert.id}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          py: 0.5,
                          px: 1,
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02),
                          },
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            color: isDark ? '#fff' : '#1a1a2e',
                            fontSize: '0.78rem',
                          }}
                        >
                          {cert.assetCode}
                        </Typography>
                        <Chip
                          label={`${cert.daysRemaining}d`}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            bgcolor: alpha(dayColor, 0.15),
                            color: dayColor,
                            border: 'none',
                            ml: 1,
                            flexShrink: 0,
                          }}
                        />
                      </Box>
                    </Fade>
                  );
                })}
              </AlertSection>

              {/* Low Stock Section */}
              <AlertSection
                title="Lage Voorraad"
                icon={<InventoryIcon sx={{ fontSize: 16 }} />}
                isDark={isDark}
                isEmpty={lowStockTypes.length === 0}
              >
                {lowStockTypes.map((item, index) => (
                  <Fade in timeout={300 + index * 80} key={item.typeName}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 0.5,
                        px: 1,
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02),
                        },
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          color: isDark ? '#fff' : '#1a1a2e',
                          fontSize: '0.78rem',
                        }}
                      >
                        {item.typeName}
                      </Typography>
                      <Chip
                        label={item.count}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          bgcolor: alpha('#f44336', 0.15),
                          color: '#f44336',
                          border: 'none',
                          ml: 1,
                          flexShrink: 0,
                        }}
                      />
                    </Box>
                  </Fade>
                ))}
              </AlertSection>
            </>
          )}
        </Box>
      </Box>
    </Fade>
  );
};

export default AlertsWarningsWidget;

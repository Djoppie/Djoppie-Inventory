import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Paper,
  alpha,
  useTheme,
  Chip,
} from '@mui/material';

// Icons
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import HistoryIcon from '@mui/icons-material/History';

import { getNeumorph, getNeumorphColors } from '../utils/neumorphicStyles';

// Reports accent color
const REPORTS_COLOR = '#FF9800'; // Orange

type ReportTab = 'onboarding' | 'offboarding';

const RequestsReportsPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  const [activeTab, setActiveTab] = useState<ReportTab>('onboarding');

  // TODO: Implement onboarding history table
  // - Fetch: GET /api/requests/onboarding/history
  // - Columns: Employee, Start Date, Assets Assigned, Status, Service
  // - Filters: Date range, Status, Service
  // - Export functionality (CSV/Excel)

  // TODO: Implement offboarding history table
  // - Fetch: GET /api/requests/offboarding/history
  // - Columns: Employee, Exit Date, Assets Returned, Status, Service
  // - Filters: Date range, Status, Service
  // - Export functionality (CSV/Excel)

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: ReportTab) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 2, md: 2.5 }, pb: 10 }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2.5,
            py: 1.5,
            borderRadius: 2,
            bgcolor: alpha(REPORTS_COLOR, 0.1),
            border: '1px solid',
            borderColor: alpha(REPORTS_COLOR, 0.2),
          }}
        >
          <HistoryIcon sx={{ color: REPORTS_COLOR, fontSize: 28 }} />
          <Box>
            <Box
              sx={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: REPORTS_COLOR,
                lineHeight: 1.2,
              }}
            >
              Aanvragen Historiek
            </Box>
            <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mt: 0.25 }}>
              Volledige geschiedenis van on- en offboarding
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Tabs Navigation */}
      <Paper
        sx={{
          bgcolor: bgSurface,
          boxShadow: getNeumorph(isDark, 'medium'),
          borderRadius: 2,
          mb: 3,
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            minHeight: 56,
            borderBottom: '1px solid',
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 56,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              gap: 1,
              transition: 'all 0.2s ease',
              '&.Mui-selected': {
                color: REPORTS_COLOR,
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              backgroundColor: REPORTS_COLOR,
            },
          }}
        >
          <Tab
            value="onboarding"
            label="Onboarding"
            icon={<PersonAddIcon />}
            iconPosition="start"
          />
          <Tab
            value="offboarding"
            label="Offboarding"
            icon={<PersonRemoveIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box>
        {activeTab === 'onboarding' && (
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: getNeumorph(isDark, 'soft'),
            }}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <PersonAddIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" fontWeight={600} mb={1}>
                Onboarding Geschiedenis
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Overzicht van alle onboarding processen en asset toewijzingen
              </Typography>
              <Chip
                label="Binnenkort beschikbaar"
                sx={{
                  bgcolor: alpha('#43A047', 0.1),
                  color: '#43A047',
                  fontWeight: 600,
                }}
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'offboarding' && (
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: getNeumorph(isDark, 'soft'),
            }}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <PersonRemoveIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" fontWeight={600} mb={1}>
                Offboarding Geschiedenis
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Overzicht van alle offboarding processen en asset retourneringen
              </Typography>
              <Chip
                label="Binnenkort beschikbaar"
                sx={{
                  bgcolor: alpha('#E53935', 0.1),
                  color: '#E53935',
                  fontWeight: 600,
                }}
              />
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default RequestsReportsPage;

import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  keyframes,
  useTheme,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CategoryIcon from '@mui/icons-material/Category';
import BusinessIcon from '@mui/icons-material/Business';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import AssetTypesTab from '../components/admin/AssetTypesTab';
import BuildingsTab from '../components/admin/BuildingsTab';
import SectorsTab from '../components/admin/SectorsTab';
import ServicesTab from '../components/admin/ServicesTab';

// Glow animation for header
const headerGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 10px rgba(255, 119, 0, 0.2), inset 0 0 10px rgba(255, 119, 0, 0.05);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 119, 0, 0.4), inset 0 0 15px rgba(255, 119, 0, 0.1);
  }
`;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const AdminPage = () => {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header Section */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          animation: `${headerGlow} 3s ease-in-out infinite`,
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(255, 119, 0, 0.08) 0%, rgba(204, 0, 0, 0.03) 50%, transparent 100%)'
              : 'linear-gradient(135deg, rgba(255, 119, 0, 0.06) 0%, rgba(204, 0, 0, 0.02) 50%, transparent 100%)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Admin icon */}
          <AdminPanelSettingsIcon
            sx={{
              color: 'primary.main',
              fontSize: '2.5rem',
              filter:
                theme.palette.mode === 'dark'
                  ? 'drop-shadow(0 0 8px rgba(255, 119, 0, 0.5))'
                  : 'none',
            }}
          />

          {/* Title */}
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                letterSpacing: '0.05em',
                background:
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(90deg, #FF9233, #CC0000)'
                    : 'linear-gradient(90deg, #FF7700, #CC0000)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Administration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Manage reference data and system configuration
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Tabs Navigation */}
      <Paper
        elevation={0}
        sx={{
          mb: 0,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '16px 16px 0 0',
          boxShadow:
            theme.palette.mode === 'light'
              ? '6px 6px 12px rgba(0, 0, 0, 0.15), -6px -6px 12px rgba(255, 255, 255, 0.95)'
              : '8px 8px 18px rgba(0, 0, 0, 0.75), -5px -5px 12px rgba(255, 255, 255, 0.06)',
        }}
      >
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            px: 2,
            '& .MuiTab-root': {
              minHeight: 64,
              fontWeight: 600,
              fontSize: '0.9375rem',
              textTransform: 'none',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                color: 'primary.main',
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 119, 0, 0.05)'
                    : 'rgba(255, 119, 0, 0.02)',
              },
              '&.Mui-selected': {
                color: 'primary.main',
              },
            },
          }}
        >
          <Tab
            icon={<CategoryIcon />}
            iconPosition="start"
            label="Asset Types"
            id="admin-tab-0"
            aria-controls="admin-tabpanel-0"
          />
          <Tab
            icon={<BusinessIcon />}
            iconPosition="start"
            label="Buildings"
            id="admin-tab-1"
            aria-controls="admin-tabpanel-1"
          />
          <Tab
            icon={<AccountTreeIcon />}
            iconPosition="start"
            label="Sectors"
            id="admin-tab-2"
            aria-controls="admin-tabpanel-2"
          />
          <Tab
            icon={<MiscellaneousServicesIcon />}
            iconPosition="start"
            label="Services"
            id="admin-tab-3"
            aria-controls="admin-tabpanel-3"
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderTop: 'none',
          borderRadius: '0 0 16px 16px',
          boxShadow:
            theme.palette.mode === 'light'
              ? '6px 6px 12px rgba(0, 0, 0, 0.15), -6px -6px 12px rgba(255, 255, 255, 0.95)'
              : '8px 8px 18px rgba(0, 0, 0, 0.75), -5px -5px 12px rgba(255, 255, 255, 0.06)',
        }}
      >
        <TabPanel value={currentTab} index={0}>
          <AssetTypesTab />
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <BuildingsTab />
        </TabPanel>
        <TabPanel value={currentTab} index={2}>
          <SectorsTab />
        </TabPanel>
        <TabPanel value={currentTab} index={3}>
          <ServicesTab />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AdminPage;

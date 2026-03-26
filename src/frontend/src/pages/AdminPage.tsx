import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CategoryIcon from '@mui/icons-material/Category';
import FolderIcon from '@mui/icons-material/Folder';
import BusinessIcon from '@mui/icons-material/Business';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import PlaceIcon from '@mui/icons-material/Place';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CategoriesTab from '../components/admin/CategoriesTab';
import AssetTypesTab from '../components/admin/AssetTypesTab';
import BuildingsTab from '../components/admin/BuildingsTab';
import SectorsTab from '../components/admin/SectorsTab';
import ServicesTab from '../components/admin/ServicesTab';
import PhysicalWorkplacesTab from '../components/admin/PhysicalWorkplacesTab';
import OrganizationTab from '../components/admin/OrganizationTab';
import SchemaIcon from '@mui/icons-material/Schema';
import { alpha } from '@mui/material';
import { WORKPLACE_COLOR, EMPLOYEE_COLOR, ASSET_COLOR } from '../constants/filterColors';

// Scanner-style card wrapper - consistent with ScanPage
const scannerCardSx = {
  mb: 3,
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    borderColor: 'primary.main',
    boxShadow: (theme: { palette: { mode: string } }) =>
      theme.palette.mode === 'dark'
        ? '0 8px 32px rgba(255, 215, 0, 0.2), inset 0 0 24px rgba(255, 215, 0, 0.05)'
        : '0 4px 20px rgba(253, 185, 49, 0.3)',
  },
};


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
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ pb: 10 }}>
      {/* Back Button - Outside card */}
      <Tooltip title="Back to Dashboard" arrow>
        <IconButton
          onClick={() => navigate('/')}
          sx={{
            mb: 2,
            width: 36,
            height: 36,
            borderRadius: 1,
            color: 'text.secondary',
            bgcolor: 'transparent',
            border: '1px solid',
            borderColor: 'divider',
            transition: 'all 0.15s ease',
            '&:hover': {
              color: ASSET_COLOR,
              bgcolor: alpha(ASSET_COLOR, 0.08),
              borderColor: ASSET_COLOR,
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Tooltip>

      {/* Header - Scanner style */}
      <Card elevation={0} sx={scannerCardSx}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 215, 0, 0.08)'
                    : 'rgba(253, 185, 49, 0.08)',
                transition: 'all 0.3s ease',
              }}
            >
              <AdminPanelSettingsIcon
                sx={{
                  fontSize: 28,
                  color: 'primary.main',
                  filter: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))'
                      : 'none',
                }}
              />
            </Box>
            <Box>
              <Typography variant="h4" component="h1" fontWeight={700}>
                Administration
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Manage reference data and system configuration
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Tabs Card - Scanner style */}
      <Card elevation={0} sx={{ ...scannerCardSx, mb: 0 }}>
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
              fontSize: '0.95rem',
              letterSpacing: '0.05em',
              transition: 'all 0.3s ease',
              '&:hover': {
                color: 'primary.main',
              },
            },
            '& .Mui-selected': {
              color: 'primary.main',
            },
          }}
        >
          <Tab
            icon={<FolderIcon />}
            iconPosition="start"
            label="Categories"
            id="admin-tab-0"
            aria-controls="admin-tabpanel-0"
          />
          <Tab
            icon={<CategoryIcon />}
            iconPosition="start"
            label="Asset Types"
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
            label="Diensten"
            id="admin-tab-3"
            aria-controls="admin-tabpanel-3"
          />
          <Tab
            icon={<PlaceIcon />}
            iconPosition="start"
            label="Werkplekken"
            id="admin-tab-4"
            aria-controls="admin-tabpanel-4"
            sx={{ color: WORKPLACE_COLOR, '&.Mui-selected': { color: WORKPLACE_COLOR } }}
          />
          <Tab
            icon={<BusinessIcon />}
            iconPosition="start"
            label="Gebouwen"
            id="admin-tab-5"
            aria-controls="admin-tabpanel-5"
          />
          <Tab
            icon={<SchemaIcon />}
            iconPosition="start"
            label="Organisatie"
            id="admin-tab-6"
            aria-controls="admin-tabpanel-6"
            sx={{ color: EMPLOYEE_COLOR, '&.Mui-selected': { color: EMPLOYEE_COLOR } }}
          />
        </Tabs>

        <CardContent sx={{ p: 3 }}>
          <TabPanel value={currentTab} index={0}>
            <CategoriesTab />
          </TabPanel>
          <TabPanel value={currentTab} index={1}>
            <AssetTypesTab />
          </TabPanel>
          <TabPanel value={currentTab} index={2}>
            <SectorsTab />
          </TabPanel>
          <TabPanel value={currentTab} index={3}>
            <ServicesTab />
          </TabPanel>
          <TabPanel value={currentTab} index={4}>
            <PhysicalWorkplacesTab />
          </TabPanel>
          <TabPanel value={currentTab} index={5}>
            <BuildingsTab />
          </TabPanel>
          <TabPanel value={currentTab} index={6}>
            <OrganizationTab />
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminPage;

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, IconButton, Tooltip, alpha, useTheme, useMediaQuery } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useQuery } from '@tanstack/react-query';

// Components
import AdminNavigation, {
  CategoryIcon,
  FolderIcon,
  SyncIcon,
  AccountTreeIcon,
  MiscellaneousServicesIcon,
  PeopleIcon,
  PlaceIcon,
  BusinessIcon,
  NavigationSection,
} from '../components/admin/AdminNavigation';
import AdminSection, { QuickStat } from '../components/admin/AdminSection';
import CategoriesTab from '../components/admin/CategoriesTab';
import AssetTypesTab from '../components/admin/AssetTypesTab';
import BuildingsTab from '../components/admin/BuildingsTab';
import SectorsTab from '../components/admin/SectorsTab';
import ServicesTab from '../components/admin/ServicesTab';
import PhysicalWorkplacesTab from '../components/admin/PhysicalWorkplacesTab';
import EmployeesTab from '../components/admin/EmployeesTab';
import IntuneSyncTab from '../components/admin/IntuneSyncTab';

// API
import { categoriesApi, assetTypesApi, sectorsApi, servicesApi, buildingsApi } from '../api/admin.api';

// Admin-specific colors (matching design requirements)
const ADMIN_ASSET_COLOR = '#FF7700'; // Djoppie Orange
const ADMIN_ORGANIZATION_COLOR = '#26A69A'; // Teal
const ADMIN_LOCATION_COLOR = '#7E57C2'; // Purple

const AdminPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeSection, setActiveSection] = useState('categories');

  // Handle URL section parameter (e.g., /admin?section=employees)
  useEffect(() => {
    const sectionParam = searchParams.get('section');
    if (sectionParam) {
      setActiveSection(sectionParam);
    }
  }, [searchParams]);

  // Fetch data for quick stats
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(true),
  });

  const { data: assetTypes = [] } = useQuery({
    queryKey: ['assetTypes'],
    queryFn: () => assetTypesApi.getAll(true),
  });

  const { data: sectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: () => sectorsApi.getAll(true),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.getAll(true),
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => buildingsApi.getAll(true),
  });

  // Define navigation sections
  const sections: NavigationSection[] = [
    {
      id: 'assets-group',
      label: 'Assets',
      color: ADMIN_ASSET_COLOR,
      items: [
        {
          id: 'categories',
          label: 'Categories',
          icon: <FolderIcon />,
          badge: categories.filter((c) => c.isActive).length,
        },
        {
          id: 'asset-types',
          label: 'Asset Types',
          icon: <CategoryIcon />,
          badge: assetTypes.filter((a) => a.isActive).length,
        },
        {
          id: 'intune-sync',
          label: 'Intune Sync',
          icon: <SyncIcon />,
        },
      ],
    },
    {
      id: 'organization-group',
      label: 'Organisation',
      color: ADMIN_ORGANIZATION_COLOR,
      items: [
        {
          id: 'sectors',
          label: 'Sectors',
          icon: <AccountTreeIcon />,
          badge: sectors.filter((s) => s.isActive).length,
        },
        {
          id: 'services',
          label: 'Services',
          icon: <MiscellaneousServicesIcon />,
          badge: services.filter((s) => s.isActive).length,
        },
        {
          id: 'employees',
          label: 'Employees',
          icon: <PeopleIcon />,
        },
      ],
    },
    {
      id: 'locations-group',
      label: 'Locations',
      color: ADMIN_LOCATION_COLOR,
      items: [
        {
          id: 'workplaces',
          label: 'Physical Workplaces',
          icon: <PlaceIcon />,
        },
        {
          id: 'buildings',
          label: 'Buildings',
          icon: <BusinessIcon />,
          badge: buildings.filter((b) => b.isActive).length,
        },
      ],
    },
  ];

  // Section configurations
  const sectionConfigs = {
    categories: {
      title: 'Categories',
      description: 'Organize asset types into logical categories',
      icon: <FolderIcon />,
      color: ADMIN_ASSET_COLOR,
      quickStats: [
        { label: 'Total', value: categories.length },
        { label: 'Active', value: categories.filter((c) => c.isActive).length },
        { label: 'Inactive', value: categories.filter((c) => !c.isActive).length },
      ] as QuickStat[],
      component: <CategoriesTab />,
    },
    'asset-types': {
      title: 'Asset Types',
      description: 'Define types of assets that can be tracked in the inventory',
      icon: <CategoryIcon />,
      color: ADMIN_ASSET_COLOR,
      quickStats: [
        { label: 'Total', value: assetTypes.length },
        { label: 'Active', value: assetTypes.filter((a) => a.isActive).length },
      ] as QuickStat[],
      component: <AssetTypesTab />,
    },
    'intune-sync': {
      title: 'Intune Sync',
      description: 'Synchronize hardware inventory from Microsoft Intune',
      icon: <SyncIcon />,
      color: ADMIN_ASSET_COLOR,
      quickStats: [] as QuickStat[],
      component: <IntuneSyncTab />,
    },
    sectors: {
      title: 'Sectors',
      description: 'Manage organizational sectors and departments',
      icon: <AccountTreeIcon />,
      color: ADMIN_ORGANIZATION_COLOR,
      quickStats: [
        { label: 'Total', value: sectors.length },
        { label: 'Active', value: sectors.filter((s) => s.isActive).length },
      ] as QuickStat[],
      component: <SectorsTab />,
    },
    services: {
      title: 'Services',
      description: 'Configure services within sectors',
      icon: <MiscellaneousServicesIcon />,
      color: ADMIN_ORGANIZATION_COLOR,
      quickStats: [
        { label: 'Total', value: services.length },
        { label: 'Active', value: services.filter((s) => s.isActive).length },
      ] as QuickStat[],
      component: <ServicesTab />,
    },
    employees: {
      title: 'Employees',
      description: 'Manage employee accounts, roles, and permissions',
      icon: <PeopleIcon />,
      color: ADMIN_ORGANIZATION_COLOR,
      quickStats: [] as QuickStat[],
      component: <EmployeesTab />,
    },
    workplaces: {
      title: 'Physical Workplaces',
      description: 'Define physical workplace locations for assets',
      icon: <PlaceIcon />,
      color: ADMIN_LOCATION_COLOR,
      quickStats: [] as QuickStat[],
      component: <PhysicalWorkplacesTab />,
    },
    buildings: {
      title: 'Buildings',
      description: 'Manage buildings and physical locations',
      icon: <BusinessIcon />,
      color: ADMIN_LOCATION_COLOR,
      quickStats: [
        { label: 'Total', value: buildings.length },
        { label: 'Active', value: buildings.filter((b) => b.isActive).length },
      ] as QuickStat[],
      component: <BuildingsTab />,
    },
  };

  const currentConfig = sectionConfigs[activeSection as keyof typeof sectionConfigs];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar Navigation */}
      <AdminNavigation
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        sections={sections}
      />

      {/* Main Content Area */}
      <Box
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          ml: { md: 0 },
          width: { xs: '100%', md: 'calc(100% - 280px)' },
          pb: 10,
        }}
      >
        {/* Back Button - Mobile only (desktop has sidebar) */}
        {!isMobile && (
          <Tooltip title="Back to Dashboard" arrow>
            <IconButton
              onClick={() => navigate('/')}
              sx={{
                mb: 3,
                width: 40,
                height: 40,
                borderRadius: 1.5,
                color: 'text.secondary',
                bgcolor: 'transparent',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  borderColor: 'primary.main',
                  transform: 'translateX(-4px)',
                },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Section Content */}
        {currentConfig && (
          <AdminSection
            sectionId={activeSection}
            title={currentConfig.title}
            description={currentConfig.description}
            icon={currentConfig.icon}
            color={currentConfig.color}
            quickStats={currentConfig.quickStats}
          >
            {currentConfig.component}
          </AdminSection>
        )}
      </Box>
    </Box>
  );
};

export default AdminPage;

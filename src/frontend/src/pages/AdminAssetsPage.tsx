import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Tabs, Tab, Paper, alpha, useTheme, Fade, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

// Components
import CategoriesTab from '../components/admin/CategoriesTab';
import AssetTypesTab from '../components/admin/AssetTypesTab';
import IntuneSyncTab from '../components/admin/IntuneSyncTab';

// Icons
import FolderIcon from '@mui/icons-material/Folder';
import CategoryIcon from '@mui/icons-material/Category';
import SyncIcon from '@mui/icons-material/Sync';

// API
import { categoriesApi, assetTypesApi } from '../api/admin.api';
import { getNeumorph, getNeumorphColors } from '../utils/neumorphicStyles';
import { ADMIN_ASSET_COLOR } from '../constants/filterColors';

type AdminAssetTab = 'categories' | 'asset-types' | 'intune-sync';

const AdminAssetsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  // Get active tab from URL or default to 'categories'
  const tabParam = searchParams.get('tab') as AdminAssetTab | null;
  const [activeTab, setActiveTab] = useState<AdminAssetTab>(
    tabParam && ['categories', 'asset-types', 'intune-sync'].includes(tabParam)
      ? tabParam
      : 'categories'
  );

  // Sync URL with active tab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam !== activeTab) {
      setSearchParams({ tab: activeTab }, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  // Fetch data for badges
  const { data: categories = [], isError: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(true),
  });

  const { data: assetTypes = [], isError: assetTypesError } = useQuery({
    queryKey: ['assetTypes'],
    queryFn: () => assetTypesApi.getAll(true),
  });

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: AdminAssetTab) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 2, md: 3 }, pb: 10 }}>
      {/* Enhanced Page Header with Gradient */}
      <Fade in timeout={600}>
        <Paper
          elevation={0}
          sx={{
            mb: 4,
            p: 3,
            borderRadius: 3,
            background: isDark
              ? `linear-gradient(135deg, ${alpha(ADMIN_ASSET_COLOR, 0.15)} 0%, ${alpha(ADMIN_ASSET_COLOR, 0.05)} 100%)`
              : `linear-gradient(135deg, ${alpha(ADMIN_ASSET_COLOR, 0.08)} 0%, ${alpha(ADMIN_ASSET_COLOR, 0.02)} 100%)`,
            border: '1px solid',
            borderColor: alpha(ADMIN_ASSET_COLOR, 0.2),
            boxShadow: `0 4px 20px ${alpha(ADMIN_ASSET_COLOR, 0.1)}`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${ADMIN_ASSET_COLOR}, ${alpha(ADMIN_ASSET_COLOR, 0.6)})`,
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(ADMIN_ASSET_COLOR, isDark ? 0.2 : 0.1),
                boxShadow: `inset 0 2px 8px ${alpha(ADMIN_ASSET_COLOR, 0.2)}`,
              }}
            >
              <CategoryIcon sx={{ color: ADMIN_ASSET_COLOR, fontSize: 32 }} />
            </Box>
            <Box>
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{
                  background: `linear-gradient(135deg, ${ADMIN_ASSET_COLOR}, ${alpha(ADMIN_ASSET_COLOR, 0.7)})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 0.5,
                }}
              >
                Asset Beheer
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                Categorieën, asset types en Intune synchronisatie
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Fade>

      {/* Enhanced Tabs Navigation */}
      <Fade in timeout={800} style={{ transitionDelay: '200ms' }}>
        <Paper
          elevation={0}
          sx={{
            bgcolor: bgSurface,
            boxShadow: `0 8px 32px ${alpha(isDark ? '#000' : ADMIN_ASSET_COLOR, isDark ? 0.3 : 0.08)}`,
            borderRadius: 3,
            mb: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: `0 12px 40px ${alpha(isDark ? '#000' : ADMIN_ASSET_COLOR, isDark ? 0.4 : 0.12)}`,
            },
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              minHeight: 60,
              borderBottom: '1px solid',
              borderColor: 'divider',
              '& .MuiTab-root': {
                minHeight: 60,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                gap: 1,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&.Mui-selected': {
                  color: ADMIN_ASSET_COLOR,
                  fontWeight: 700,
                  transform: 'translateY(-2px)',
                },
                '&:hover': {
                  bgcolor: alpha(ADMIN_ASSET_COLOR, 0.05),
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                background: `linear-gradient(90deg, ${ADMIN_ASSET_COLOR}, ${alpha(ADMIN_ASSET_COLOR, 0.7)})`,
                boxShadow: `0 0 8px ${alpha(ADMIN_ASSET_COLOR, 0.5)}`,
              },
            }}
          >
          <Tab
            value="categories"
            label={`Categorieën (${categoriesError ? '?' : categories.filter((c) => c.isActive).length})`}
            icon={<FolderIcon />}
            iconPosition="start"
          />
          <Tab
            value="asset-types"
            label={`Asset Types (${assetTypesError ? '?' : assetTypes.filter((a) => a.isActive).length})`}
            icon={<CategoryIcon />}
            iconPosition="start"
          />
          <Tab
            value="intune-sync"
            label="Intune Sync"
            icon={<SyncIcon />}
            iconPosition="start"
          />
          </Tabs>
        </Paper>
      </Fade>

      {/* Tab Content */}
      <Box>
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'asset-types' && <AssetTypesTab />}
        {activeTab === 'intune-sync' && <IntuneSyncTab />}
      </Box>
    </Box>
  );
};

export default AdminAssetsPage;

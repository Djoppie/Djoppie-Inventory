import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Tabs, Tab, Paper, alpha, useTheme, Fade, Typography, Badge } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

import RuleFolderIcon from '@mui/icons-material/RuleFolder';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

import DataQualityTab from '../../components/admin/DataQualityTab';
import MisalignedAssetsTab from '../../components/admin/MisalignedAssetsTab';
import { getDataQualitySummary } from '../../api/dataQuality.api';
import { getNeumorphColors } from '../../utils/neumorphicStyles';
import { ADMIN_DATA_QUALITY_COLOR } from '../../constants/filterColors';

type AdminDataQualityTab = 'overview' | 'misalignment';

const VALID_TABS: AdminDataQualityTab[] = ['overview', 'misalignment'];

const AdminDataQualityPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  const tabParam = searchParams.get('tab') as AdminDataQualityTab | null;
  const [activeTab, setActiveTab] = useState<AdminDataQualityTab>(
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'overview',
  );

  useEffect(() => {
    const current = searchParams.get('tab');
    if (current !== activeTab) {
      setSearchParams({ tab: activeTab }, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  // Lightweight summary fetch for tab badges.
  const { data: summary } = useQuery({
    queryKey: ['data-quality', 'summary'],
    queryFn: () => getDataQualitySummary(),
    staleTime: 2 * 60 * 1000,
  });

  const overviewIssues =
    (summary?.inUseAssetsWithoutWorkplace ?? 0) + (summary?.inUseAssetsWithoutEmployee ?? 0);
  const misalignmentIssues =
    (summary?.misalignedWorkplaceAssets ?? 0) + (summary?.userAssetsOnWorkplace ?? 0);

  const handleTabChange = (_e: React.SyntheticEvent, value: AdminDataQualityTab) => {
    setActiveTab(value);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 2, md: 3 }, pb: 10 }}>
      <Fade in timeout={600}>
        <Paper
          elevation={0}
          sx={{
            mb: 4,
            p: 3,
            borderRadius: 3,
            background: isDark
              ? `linear-gradient(135deg, ${alpha(ADMIN_DATA_QUALITY_COLOR, 0.15)} 0%, ${alpha(ADMIN_DATA_QUALITY_COLOR, 0.05)} 100%)`
              : `linear-gradient(135deg, ${alpha(ADMIN_DATA_QUALITY_COLOR, 0.08)} 0%, ${alpha(ADMIN_DATA_QUALITY_COLOR, 0.02)} 100%)`,
            border: '1px solid',
            borderColor: alpha(ADMIN_DATA_QUALITY_COLOR, 0.2),
            boxShadow: `0 4px 20px ${alpha(ADMIN_DATA_QUALITY_COLOR, 0.1)}`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${ADMIN_DATA_QUALITY_COLOR}, ${alpha(ADMIN_DATA_QUALITY_COLOR, 0.6)})`,
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
                bgcolor: alpha(ADMIN_DATA_QUALITY_COLOR, isDark ? 0.2 : 0.1),
                boxShadow: `inset 0 2px 8px ${alpha(ADMIN_DATA_QUALITY_COLOR, 0.2)}`,
              }}
            >
              <RuleFolderIcon sx={{ color: ADMIN_DATA_QUALITY_COLOR, fontSize: 32 }} />
            </Box>
            <Box>
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{
                  background: `linear-gradient(135deg, ${ADMIN_DATA_QUALITY_COLOR}, ${alpha(ADMIN_DATA_QUALITY_COLOR, 0.7)})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 0.5,
                }}
              >
                Data Kwaliteit
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                Audits en éénmalige fixes voor inconsistente asset-koppelingen
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Fade>

      <Fade in timeout={800} style={{ transitionDelay: '200ms' }}>
        <Paper
          elevation={0}
          sx={{
            bgcolor: bgSurface,
            boxShadow: `0 8px 32px ${alpha(isDark ? '#000' : ADMIN_DATA_QUALITY_COLOR, isDark ? 0.3 : 0.08)}`,
            borderRadius: 3,
            mb: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            transition: 'all 0.3s ease',
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
                  color: ADMIN_DATA_QUALITY_COLOR,
                  fontWeight: 700,
                  transform: 'translateY(-2px)',
                },
                '&:hover': {
                  bgcolor: alpha(ADMIN_DATA_QUALITY_COLOR, 0.05),
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                background: `linear-gradient(90deg, ${ADMIN_DATA_QUALITY_COLOR}, ${alpha(ADMIN_DATA_QUALITY_COLOR, 0.7)})`,
              },
            }}
          >
            <Tab
              value="overview"
              icon={<FactCheckIcon />}
              iconPosition="start"
              label={
                <Badge
                  color="warning"
                  badgeContent={overviewIssues > 0 ? overviewIssues : undefined}
                  max={9999}
                  sx={{ '& .MuiBadge-badge': { right: -16, top: 4 } }}
                >
                  Asset overzicht
                </Badge>
              }
            />
            <Tab
              value="misalignment"
              icon={<SyncAltIcon />}
              iconPosition="start"
              label={
                <Badge
                  color="warning"
                  badgeContent={misalignmentIssues > 0 ? misalignmentIssues : undefined}
                  max={9999}
                  sx={{ '& .MuiBadge-badge': { right: -16, top: 4 } }}
                >
                  Werkplek-koppelingen
                </Badge>
              }
            />
          </Tabs>
        </Paper>
      </Fade>

      <Box>
        {activeTab === 'overview' && (
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ReportProblemIcon sx={{ color: ADMIN_DATA_QUALITY_COLOR }} />
              <Typography variant="h6" fontWeight={700}>
                Asset data kwaliteit
              </Typography>
            </Box>
            <DataQualityTab />
          </Paper>
        )}
        {activeTab === 'misalignment' && <MisalignedAssetsTab />}
      </Box>
    </Box>
  );
};

export default AdminDataQualityPage;

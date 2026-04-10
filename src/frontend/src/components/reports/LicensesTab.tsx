/**
 * LicensesTab - MS365 License Report
 * @updated 2026-04-03
 *
 * Enterprise-level data visualization for Microsoft 365 license overview with:
 * - Neumorphic Djoppy Admin styling
 * - License utilization summary cards
 * - Multi-select expandable filter panel for license types (E3, E5, F1)
 * - AdminDataTable integration for user license assignments
 * - Export functionality
 *
 * Note: Requires Graph API permissions for license data
 */

import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Alert,
  LinearProgress,
  Collapse,
  Stack,
  alpha,
  useTheme,
  Skeleton,
  Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import ClearIcon from '@mui/icons-material/Clear';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import BadgeIcon from '@mui/icons-material/Badge';
import PersonIcon from '@mui/icons-material/Person';
import VerifiedIcon from '@mui/icons-material/Verified';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import GroupsIcon from '@mui/icons-material/Groups';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SavingsIcon from '@mui/icons-material/Savings';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import TuneIcon from '@mui/icons-material/Tune';

import {
  useLicenseSummary,
  useLicenseUsers,
  useLicenseOptimization,
  useExportLicenseReport,
  getLicenseDisplayName,
  getLicenseCategory,
  getLicenseColor,
} from '../../hooks/reports';
import {
  getNeumorph,
  getNeumorphInset,
  getNeumorphColors,
} from '../../utils/neumorphicStyles';
import AdminDataTable, { Column } from '../admin/AdminDataTable';
import type {
  LicenseUser,
  LicenseInfo,
  InactiveUser,
  DowngradeRecommendation,
} from '../../types/report.types';
// Accent colors imported for potential future use in interactive elements
// import { EMPLOYEE_COLOR, SUCCESS_COLOR } from '../../constants/filterColors';

// License colors aligned with domain color system
const LICENSE_COLOR = '#1976D2'; // Blue - primary license color
const E3_COLOR = '#2196F3'; // Light Blue - E3 licenses
const E5_COLOR = '#7B1FA2'; // Purple - E5 premium licenses
const F1_COLOR = '#009688'; // Teal - F1 frontline licenses
const SAVINGS_COLOR = '#4CAF50'; // Green - savings/optimization
const WARNING_COLOR = '#FF9800'; // Orange - warnings/inactive

const LicensesTab = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const neumorphColors = getNeumorphColors(isDark);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');

  // Multi-select license filter state
  const [selectedLicenseSkuIds, setSelectedLicenseSkuIds] = useState<string[]>([]);
  const [licenseFilterExpanded, setLicenseFilterExpanded] = useState(false);

  // Optimization analysis state
  const [showOptimization, setShowOptimization] = useState(false);
  const [inactiveDaysThreshold] = useState(90);

  // Queries
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useLicenseSummary();
  const { data: users = [], isLoading: usersLoading } = useLicenseUsers();
  const {
    data: optimization,
    isLoading: optimizationLoading,
    error: optimizationError,
  } = useLicenseOptimization(inactiveDaysThreshold, showOptimization);
  const exportMutation = useExportLicenseReport();

  // Get main licenses (E3, E5, F1) for the filter panel
  const mainLicenses = useMemo(() => {
    return summary?.licenses?.filter(lic => lic.isE3 || lic.isE5 || lic.isF1) || [];
  }, [summary]);

  // Filter users by selected license types and search
  const filteredUsers = useMemo(() => {
    let result = users;

    // Filter by selected license types (multi-select)
    if (selectedLicenseSkuIds.length > 0) {
      result = result.filter(user =>
        user.assignedLicenses.some(lic => selectedLicenseSkuIds.includes(lic.skuId))
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user =>
        user.displayName?.toLowerCase().includes(query) ||
        user.userPrincipalName?.toLowerCase().includes(query) ||
        user.department?.toLowerCase().includes(query) ||
        user.jobTitle?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [users, selectedLicenseSkuIds, searchQuery]);

  // Get selected license names for chip display
  const selectedLicenses = mainLicenses.filter(lic => selectedLicenseSkuIds.includes(lic.skuId));

  // License filter handlers
  const handleLicenseToggle = () => {
    setLicenseFilterExpanded(!licenseFilterExpanded);
  };

  const handleLicenseSelect = (skuId: string) => {
    const isCurrentlySelected = selectedLicenseSkuIds.includes(skuId);
    if (isCurrentlySelected) {
      setSelectedLicenseSkuIds(prev => prev.filter(id => id !== skuId));
    } else {
      setSelectedLicenseSkuIds(prev => [...prev, skuId]);
    }
  };

  const handleClearLicenseFilter = () => {
    setSelectedLicenseSkuIds([]);
    setLicenseFilterExpanded(false);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedLicenseSkuIds([]);
    setLicenseFilterExpanded(false);
  };

  const hasActiveFilters = searchQuery || selectedLicenseSkuIds.length > 0;

  // Export handler
  const handleExport = () => {
    exportMutation.mutate();
  };

  // Get license icon based on category
  const getLicenseIcon = (license: LicenseInfo) => {
    if (license.isE5) return <WorkspacePremiumIcon sx={{ fontSize: 18 }} />;
    if (license.isE3) return <BusinessCenterIcon sx={{ fontSize: 18 }} />;
    return <GroupsIcon sx={{ fontSize: 18 }} />;
  };

  // Get license accent color
  const getLicenseAccentColor = (license: LicenseInfo) => {
    if (license.isE5) return E5_COLOR;
    if (license.isE3) return E3_COLOR;
    return F1_COLOR;
  };

  // Define columns for AdminDataTable
  const columns: Column<LicenseUser>[] = useMemo(() => [
    {
      id: 'displayName',
      label: 'Naam',
      minWidth: 180,
      format: (user) => (
        <Box>
          <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
            {user.displayName}
          </Typography>
          {user.department && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {user.department}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'userPrincipalName',
      label: 'E-mail',
      minWidth: 200,
      format: (user) => (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontSize: '0.8rem',
            fontFamily: 'monospace',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 220,
          }}
        >
          {user.userPrincipalName}
        </Typography>
      ),
    },
    {
      id: 'jobTitle',
      label: 'Functie',
      minWidth: 150,
      format: (user) => (
        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
          {user.jobTitle || '-'}
        </Typography>
      ),
    },
    {
      id: 'licenses',
      label: 'Licenties',
      minWidth: 120,
      sortable: false,
      searchable: false,
      format: (user) => (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {user.assignedLicenses.map((lic) => {
            const category = getLicenseCategory(lic.skuPartNumber);
            const color = getLicenseColor(category);
            return (
              <Chip
                key={lic.skuId}
                label={category.toUpperCase()}
                size="small"
                sx={{
                  height: 24,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  bgcolor: alpha(color, isDark ? 0.2 : 0.12),
                  color: color,
                  border: '1px solid',
                  borderColor: alpha(color, 0.3),
                }}
              />
            );
          })}
        </Stack>
      ),
    },
  ], [isDark]);

  // Define columns for inactive users table
  const inactiveUsersColumns: Column<InactiveUser>[] = useMemo(() => [
    {
      id: 'displayName',
      label: 'Naam',
      minWidth: 160,
      format: (user) => (
        <Box>
          <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
            {user.displayName}
          </Typography>
          {user.department && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {user.department}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'userPrincipalName',
      label: 'E-mail',
      minWidth: 180,
      format: (user) => (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontSize: '0.8rem',
            fontFamily: 'monospace',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 200,
          }}
        >
          {user.userPrincipalName}
        </Typography>
      ),
    },
    {
      id: 'currentLicense',
      label: 'Licentie',
      minWidth: 80,
      format: (user) => {
        const category = user.licenseCategory;
        const color = category === 'E5' ? E5_COLOR : category === 'E3' ? E3_COLOR : F1_COLOR;
        return (
          <Chip
            label={category}
            size="small"
            sx={{
              height: 24,
              fontSize: '0.75rem',
              fontWeight: 700,
              bgcolor: alpha(color, isDark ? 0.2 : 0.12),
              color: color,
              border: '1px solid',
              borderColor: alpha(color, 0.3),
            }}
          />
        );
      },
    },
    {
      id: 'daysSinceLastSignIn',
      label: 'Dagen inactief',
      minWidth: 100,
      format: (user) => (
        <Chip
          icon={<WarningAmberIcon sx={{ fontSize: 14 }} />}
          label={`${user.daysSinceLastSignIn}d`}
          size="small"
          sx={{
            height: 22,
            fontSize: '0.7rem',
            fontWeight: 600,
            bgcolor: alpha(WARNING_COLOR, isDark ? 0.2 : 0.12),
            color: WARNING_COLOR,
            '& .MuiChip-icon': { color: WARNING_COLOR },
          }}
        />
      ),
    },
    {
      id: 'monthlyCost',
      label: 'Kosten/mnd',
      minWidth: 80,
      format: (user) => (
        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem', color: '#f44336' }}>
          €{user.monthlyCost.toFixed(2)}
        </Typography>
      ),
    },
    {
      id: 'recommendation',
      label: 'Aanbeveling',
      minWidth: 100,
      format: (user) => {
        const isRemove = user.recommendation.toLowerCase().includes('verwijder');
        return (
          <Chip
            icon={isRemove ? <RemoveCircleIcon sx={{ fontSize: 14 }} /> : <TuneIcon sx={{ fontSize: 14 }} />}
            label={user.recommendation}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.7rem',
              fontWeight: 600,
              bgcolor: alpha(isRemove ? '#f44336' : WARNING_COLOR, isDark ? 0.2 : 0.12),
              color: isRemove ? '#f44336' : WARNING_COLOR,
              '& .MuiChip-icon': { color: isRemove ? '#f44336' : WARNING_COLOR },
            }}
          />
        );
      },
    },
  ], [isDark]);

  // Define columns for downgrade recommendations table
  const downgradeColumns: Column<DowngradeRecommendation>[] = useMemo(() => [
    {
      id: 'displayName',
      label: 'Naam',
      minWidth: 160,
      format: (user) => (
        <Box>
          <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
            {user.displayName}
          </Typography>
          {user.department && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {user.department}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'jobTitle',
      label: 'Functie',
      minWidth: 120,
      format: (user) => (
        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
          {user.jobTitle || '-'}
        </Typography>
      ),
    },
    {
      id: 'licenseChange',
      label: 'Licentie wijziging',
      minWidth: 140,
      sortable: false,
      format: (user) => {
        const fromColor = user.currentCategory === 'E5' ? E5_COLOR : E3_COLOR;
        const toColor = user.recommendedCategory === 'E3' ? E3_COLOR : F1_COLOR;
        return (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Chip
              label={user.currentCategory}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 700,
                bgcolor: alpha(fromColor, isDark ? 0.2 : 0.12),
                color: fromColor,
              }}
            />
            <SwapHorizIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Chip
              label={user.recommendedCategory}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 700,
                bgcolor: alpha(toColor, isDark ? 0.2 : 0.12),
                color: toColor,
              }}
            />
          </Stack>
        );
      },
    },
    {
      id: 'reason',
      label: 'Reden',
      minWidth: 180,
      format: (user) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
          {user.reason}
        </Typography>
      ),
    },
    {
      id: 'monthlySavings',
      label: 'Besparing/mnd',
      minWidth: 100,
      format: (user) => (
        <Chip
          icon={<SavingsIcon sx={{ fontSize: 14 }} />}
          label={`€${user.monthlySavings.toFixed(2)}`}
          size="small"
          sx={{
            height: 22,
            fontSize: '0.7rem',
            fontWeight: 700,
            bgcolor: alpha(SAVINGS_COLOR, isDark ? 0.2 : 0.12),
            color: SAVINGS_COLOR,
            '& .MuiChip-icon': { color: SAVINGS_COLOR },
          }}
        />
      ),
    },
  ], [isDark]);

  // Error state - either from React Query error or backend errorMessage
  const backendError = summary?.errorMessage;
  if (summaryError || backendError) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            MS365 Licentie gegevens niet beschikbaar
          </Typography>
          <Typography variant="body2">
            {backendError || 'De Graph API endpoint voor licenties is nog niet geïmplementeerd of er zijn onvoldoende rechten.'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Neem contact op met de beheerder.
          </Typography>
        </Alert>
        <Alert severity="info" icon={<InfoIcon />}>
          <Typography variant="body2">
            Vereiste Graph API permissies:
          </Typography>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
            <li>Organization.Read.All</li>
            <li>User.Read.All</li>
            <li>Directory.Read.All</li>
          </ul>
        </Alert>
      </Box>
    );
  }

  // Empty data state
  if (!summaryLoading && (!summary?.licenses || summary.licenses.length === 0)) {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Geen licentie gegevens gevonden
          </Typography>
          <Typography variant="body2">
            Er zijn geen E3, E5 of F1 licenties gevonden in uw Microsoft 365 tenant.
            Controleer of de Graph API permissies correct zijn geconfigureerd.
          </Typography>
        </Alert>
      </Box>
    );
  }

  const isLoading = summaryLoading || usersLoading;

  return (
    <Box sx={{ pb: 4 }}>
      {/* Summary Cards - Compact Enterprise Style */}
      <Grid container spacing={1} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: neumorphColors.bgSurface,
              boxShadow: getNeumorph(isDark, 'soft'),
              borderRadius: 2.5,
              borderLeft: `3px solid ${LICENSE_COLOR}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: getNeumorph(isDark, 'medium'),
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: alpha(LICENSE_COLOR, isDark ? 0.15 : 0.1),
                  boxShadow: getNeumorphInset(isDark),
                }}
              >
                <BadgeIcon sx={{ fontSize: 22, color: LICENSE_COLOR }} />
              </Box>
              <Box>
                {summaryLoading ? (
                  <Skeleton variant="text" width={60} height={32} />
                ) : (
                  <Typography variant="h5" sx={{ fontWeight: 800, color: LICENSE_COLOR, lineHeight: 1 }}>
                    {summary?.totalPurchased || 0}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Totaal Aangekocht
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: neumorphColors.bgSurface,
              boxShadow: getNeumorph(isDark, 'soft'),
              borderRadius: 2.5,
              borderLeft: `3px solid ${LICENSE_COLOR}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: getNeumorph(isDark, 'medium'),
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: alpha(LICENSE_COLOR, isDark ? 0.15 : 0.1),
                  boxShadow: getNeumorphInset(isDark),
                }}
              >
                <PersonIcon sx={{ fontSize: 22, color: LICENSE_COLOR }} />
              </Box>
              <Box>
                {summaryLoading ? (
                  <Skeleton variant="text" width={60} height={32} />
                ) : (
                  <Typography variant="h5" sx={{ fontWeight: 800, color: LICENSE_COLOR, lineHeight: 1 }}>
                    {summary?.totalAssigned || 0}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Toegewezen
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: neumorphColors.bgSurface,
              boxShadow: getNeumorph(isDark, 'soft'),
              borderRadius: 2.5,
              borderLeft: `3px solid ${LICENSE_COLOR}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: getNeumorph(isDark, 'medium'),
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: alpha(LICENSE_COLOR, isDark ? 0.15 : 0.1),
                  boxShadow: getNeumorphInset(isDark),
                }}
              >
                <VerifiedIcon sx={{ fontSize: 22, color: LICENSE_COLOR }} />
              </Box>
              <Box>
                {summaryLoading ? (
                  <Skeleton variant="text" width={60} height={32} />
                ) : (
                  <Typography variant="h5" sx={{ fontWeight: 800, color: LICENSE_COLOR, lineHeight: 1 }}>
                    {summary?.totalAvailable || 0}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Beschikbaar
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: neumorphColors.bgSurface,
              boxShadow: getNeumorph(isDark, 'soft'),
              borderRadius: 2.5,
              borderLeft: `3px solid ${LICENSE_COLOR}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: getNeumorph(isDark, 'medium'),
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate"
                  value={summary?.utilizationPercentage || 0}
                  size={40}
                  thickness={4}
                  sx={{
                    color: LICENSE_COLOR,
                    '& .MuiCircularProgress-circle': {
                      strokeLinecap: 'round',
                    },
                  }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="caption" fontWeight={700} color={LICENSE_COLOR} sx={{ fontSize: '0.65rem' }}>
                    {summary?.utilizationPercentage || 0}%
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: LICENSE_COLOR, lineHeight: 1 }}>
                  Benutting
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Gebruik ratio
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Toolbar - Neumorphic style */}
      <Paper
        elevation={0}
        sx={{
          mb: licenseFilterExpanded ? 0 : 2,
          p: 1.5,
          borderRadius: licenseFilterExpanded ? '12px 12px 0 0' : 3,
          bgcolor: neumorphColors.bgSurface,
          boxShadow: licenseFilterExpanded ? 'none' : getNeumorph(isDark, 'soft'),
          borderLeft: `3px solid ${LICENSE_COLOR}`,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          {/* License Filter Toggle Button */}
          <Tooltip title={licenseFilterExpanded ? 'Sluit filter' : 'Filter op licentie type'}>
            <IconButton
              size="small"
              onClick={handleLicenseToggle}
              sx={{
                width: 32,
                height: 32,
                bgcolor: (selectedLicenseSkuIds.length > 0 || licenseFilterExpanded) ? LICENSE_COLOR : 'transparent',
                color: (selectedLicenseSkuIds.length > 0 || licenseFilterExpanded) ? '#fff' : LICENSE_COLOR,
                border: '1px solid',
                borderColor: alpha(LICENSE_COLOR, 0.3),
                transition: 'all 0.15s ease',
                '& .expand-icon': {
                  transition: 'transform 0.2s ease',
                  transform: licenseFilterExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                },
                '&:hover': {
                  bgcolor: (selectedLicenseSkuIds.length > 0 || licenseFilterExpanded) ? LICENSE_COLOR : alpha(LICENSE_COLOR, 0.1),
                  borderColor: LICENSE_COLOR,
                },
              }}
            >
              {selectedLicenseSkuIds.length > 0 ? (
                <CheckIcon sx={{ fontSize: 18 }} />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AssignmentIcon sx={{ fontSize: 16 }} />
                  <ExpandMoreIcon className="expand-icon" sx={{ fontSize: 14, ml: -0.25 }} />
                </Box>
              )}
            </IconButton>
          </Tooltip>

          {/* Clear All Filters */}
          {hasActiveFilters && (
            <Tooltip title="Wis alle filters">
              <IconButton
                size="small"
                onClick={clearAllFilters}
                sx={{
                  width: 32,
                  height: 32,
                  color: '#f44336',
                  bgcolor: 'transparent',
                  border: '1px solid',
                  borderColor: alpha('#f44336', 0.3),
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: alpha('#f44336', 0.1),
                    borderColor: '#f44336',
                  },
                }}
              >
                <ClearAllIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Search Field */}
          <TextField
            size="small"
            placeholder="Zoek op naam, e-mail, afdeling..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')} sx={{ p: 0.25 }}>
                    <ClearIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              flex: 1,
              minWidth: 200,
              maxWidth: 320,
              '& .MuiOutlinedInput-root': {
                bgcolor: isDark ? alpha('#fff', 0.05) : '#fff',
                borderRadius: 1.5,
                fontSize: '0.85rem',
                height: 32,
                '& fieldset': { borderColor: alpha(LICENSE_COLOR, 0.3) },
                '&:hover fieldset': { borderColor: alpha(LICENSE_COLOR, 0.5) },
                '&.Mui-focused fieldset': { borderColor: LICENSE_COLOR },
              },
            }}
          />

          {/* Active Filter Chips */}
          {selectedLicenseSkuIds.length > 0 && (
            <Chip
              icon={<AssignmentIcon sx={{ fontSize: 14 }} />}
              label={selectedLicenses.length === 1
                ? getLicenseDisplayName(selectedLicenses[0].skuPartNumber)
                : `${selectedLicenses.length} licenties`}
              onDelete={handleClearLicenseFilter}
              size="small"
              sx={{
                height: 24,
                fontSize: '0.7rem',
                fontWeight: 600,
                bgcolor: alpha(LICENSE_COLOR, 0.15),
                color: LICENSE_COLOR,
                border: `1px solid ${alpha(LICENSE_COLOR, 0.3)}`,
                '& .MuiChip-icon': { color: LICENSE_COLOR },
                '& .MuiChip-deleteIcon': { color: LICENSE_COLOR, fontSize: 14 },
              }}
            />
          )}

          <Box sx={{ flex: 1 }} />

          {/* User Count */}
          <Chip
            size="small"
            label={`${filteredUsers.length} gebruikers`}
            sx={{
              height: 24,
              fontSize: '0.7rem',
              fontWeight: 600,
              bgcolor: alpha(LICENSE_COLOR, 0.1),
              color: LICENSE_COLOR,
              border: 'none',
            }}
          />

          {/* Optimization Toggle Button */}
          <Tooltip title={showOptimization ? 'Verberg optimalisatie analyse' : 'Toon optimalisatie analyse'}>
            <IconButton
              onClick={() => setShowOptimization(!showOptimization)}
              size="small"
              sx={{
                width: 32,
                height: 32,
                bgcolor: showOptimization ? SAVINGS_COLOR : 'transparent',
                color: showOptimization ? '#fff' : SAVINGS_COLOR,
                border: '1px solid',
                borderColor: alpha(SAVINGS_COLOR, 0.3),
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: showOptimization ? SAVINGS_COLOR : alpha(SAVINGS_COLOR, 0.1),
                  borderColor: SAVINGS_COLOR,
                },
              }}
            >
              <TrendingDownIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          {/* Export Button */}
          <Tooltip title="Exporteer naar Excel">
            <IconButton
              onClick={handleExport}
              disabled={exportMutation.isPending}
              size="small"
              sx={{
                width: 32,
                height: 32,
                color: LICENSE_COLOR,
                bgcolor: 'transparent',
                border: '1px solid',
                borderColor: alpha(LICENSE_COLOR, 0.3),
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: alpha(LICENSE_COLOR, 0.1),
                  borderColor: LICENSE_COLOR,
                },
                '&:disabled': {
                  opacity: 0.5,
                },
              }}
            >
              {exportMutation.isPending ? (
                <CircularProgress size={16} sx={{ color: LICENSE_COLOR }} />
              ) : (
                <DownloadIcon sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      {/* Expandable License Filter Panel */}
      <Collapse in={licenseFilterExpanded} timeout={250}>
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            p: 2,
            pt: 1.5,
            borderRadius: '0 0 12px 12px',
            bgcolor: neumorphColors.bgBase,
            boxShadow: getNeumorphInset(isDark),
            borderLeft: `3px solid ${LICENSE_COLOR}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssignmentIcon sx={{ fontSize: 18, color: LICENSE_COLOR }} />
              Filter op Licentie Type
            </Typography>
            {selectedLicenseSkuIds.length > 0 && (
              <Chip
                label="Wis selectie"
                size="small"
                onClick={handleClearLicenseFilter}
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  bgcolor: alpha('#f44336', 0.1),
                  color: '#f44336',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: alpha('#f44336', 0.2) },
                }}
              />
            )}
          </Box>

          {summaryLoading ? (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" width={280} height={100} />)}
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              {mainLicenses.map((license) => {
                const isSelected = selectedLicenseSkuIds.includes(license.skuId);
                const accentColor = getLicenseAccentColor(license);

                return (
                  <Box
                    key={license.skuId}
                    onClick={() => handleLicenseSelect(license.skuId)}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      cursor: 'pointer',
                      bgcolor: isSelected ? alpha(accentColor, 0.12) : (isDark ? alpha('#fff', 0.02) : '#fff'),
                      border: '1px solid',
                      borderColor: isSelected ? accentColor : (isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08)),
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: isSelected ? alpha(accentColor, 0.18) : (isDark ? alpha('#fff', 0.05) : alpha('#000', 0.04)),
                        transform: 'translateY(-2px)',
                        boxShadow: getNeumorph(isDark, 'soft'),
                      },
                    }}
                  >
                    <Stack direction="row" spacing={0.75} alignItems="flex-start">
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 36,
                          height: 36,
                          borderRadius: 1.5,
                          bgcolor: isSelected ? accentColor : alpha(accentColor, isDark ? 0.2 : 0.1),
                          color: isSelected ? '#fff' : accentColor,
                          flexShrink: 0,
                        }}
                      >
                        {getLicenseIcon(license)}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                          <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.85rem' }}>
                            {getLicenseDisplayName(license.skuPartNumber)}
                          </Typography>
                          {isSelected && <CheckIcon sx={{ fontSize: 18, color: accentColor }} />}
                        </Stack>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                          <Typography variant="caption" color="text.secondary">
                            Toegewezen:
                          </Typography>
                          <Typography variant="caption" fontWeight={600}>
                            {license.consumedUnits} / {license.prepaidUnits}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={license.utilizationPercentage}
                          sx={{
                            height: 4,
                            borderRadius: 2,
                            bgcolor: alpha(accentColor, 0.15),
                            '& .MuiLinearProgress-bar': {
                              bgcolor: accentColor,
                              borderRadius: 2,
                            },
                          }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                            {license.availableUnits} beschikbaar
                          </Typography>
                          <Typography variant="caption" fontWeight={700} sx={{ color: accentColor, fontSize: '0.65rem' }}>
                            {license.utilizationPercentage}%
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          )}
        </Paper>
      </Collapse>

      {/* License Optimization Analysis Section */}
      <Collapse in={showOptimization} timeout={300}>
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            p: 2.5,
            borderRadius: 3,
            bgcolor: neumorphColors.bgSurface,
            boxShadow: getNeumorph(isDark, 'soft'),
            borderLeft: `4px solid ${SAVINGS_COLOR}`,
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: alpha(SAVINGS_COLOR, isDark ? 0.15 : 0.1),
                  boxShadow: getNeumorphInset(isDark),
                }}
              >
                <TrendingDownIcon sx={{ fontSize: 24, color: SAVINGS_COLOR }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  Licentie Optimalisatie Analyse
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Identificeer besparingspotentieel in uw MS365 licenties
                </Typography>
              </Box>
            </Stack>
            <IconButton
              onClick={() => setShowOptimization(false)}
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              <ClearIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>

          {/* Loading State */}
          {optimizationLoading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress sx={{ color: SAVINGS_COLOR }} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Analyse wordt uitgevoerd...
              </Typography>
            </Box>
          )}

          {/* Error State */}
          {optimizationError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                {optimization?.errorMessage || 'Er is een fout opgetreden bij het ophalen van de optimalisatie analyse.'}
              </Typography>
            </Alert>
          )}

          {/* Results */}
          {!optimizationLoading && optimization && !optimizationError && (
            <>
              {/* Summary Cards */}
              <Grid container spacing={1} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: isDark ? alpha('#fff', 0.02) : '#fff',
                      border: '1px solid',
                      borderColor: isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08),
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: getNeumorph(isDark, 'soft') },
                    }}
                  >
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <PersonOffIcon sx={{ fontSize: 28, color: WARNING_COLOR }} />
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: WARNING_COLOR, lineHeight: 1 }}>
                          {optimization.summary.inactiveUserCount}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Inactieve gebruikers
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: isDark ? alpha('#fff', 0.02) : '#fff',
                      border: '1px solid',
                      borderColor: isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08),
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: getNeumorph(isDark, 'soft') },
                    }}
                  >
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <SwapHorizIcon sx={{ fontSize: 28, color: E3_COLOR }} />
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: E3_COLOR, lineHeight: 1 }}>
                          {optimization.summary.downgradeCandidateCount}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Downgrade kandidaten
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: isDark ? alpha('#fff', 0.02) : '#fff',
                      border: '1px solid',
                      borderColor: isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08),
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: getNeumorph(isDark, 'soft') },
                    }}
                  >
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <SavingsIcon sx={{ fontSize: 28, color: SAVINGS_COLOR }} />
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: SAVINGS_COLOR, lineHeight: 1 }}>
                          €{optimization.summary.estimatedMonthlySavings.toFixed(0)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Besparing / maand
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: alpha(SAVINGS_COLOR, isDark ? 0.1 : 0.08),
                      border: '1px solid',
                      borderColor: alpha(SAVINGS_COLOR, 0.3),
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: getNeumorph(isDark, 'soft') },
                    }}
                  >
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <SavingsIcon sx={{ fontSize: 28, color: SAVINGS_COLOR }} />
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: SAVINGS_COLOR, lineHeight: 1 }}>
                          €{optimization.summary.estimatedYearlySavings.toFixed(0)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Besparing / jaar
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              {/* Inactive Users Table */}
              {optimization.inactiveUsers.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonOffIcon sx={{ fontSize: 18, color: WARNING_COLOR }} />
                    Inactieve Gebruikers ({optimization.inactiveUsers.length})
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      Geen aanmelding in laatste {inactiveDaysThreshold} dagen
                    </Typography>
                  </Typography>
                  <AdminDataTable
                    data={optimization.inactiveUsers}
                    columns={inactiveUsersColumns}
                    emptyMessage="Geen inactieve gebruikers gevonden"
                    getItemId={(item) => item.userId}
                    defaultRowsPerPage={5}
                    hideSearch
                  />
                </Box>
              )}

              {/* Downgrade Recommendations Table */}
              {optimization.downgradeRecommendations.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SwapHorizIcon sx={{ fontSize: 18, color: E3_COLOR }} />
                    Downgrade Aanbevelingen ({optimization.downgradeRecommendations.length})
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      E5→E3 of E3→F1 voor frontline medewerkers
                    </Typography>
                  </Typography>
                  <AdminDataTable
                    data={optimization.downgradeRecommendations}
                    columns={downgradeColumns}
                    emptyMessage="Geen downgrade aanbevelingen"
                    getItemId={(item) => item.userId}
                    defaultRowsPerPage={5}
                    hideSearch
                  />
                </Box>
              )}

              {/* No optimization opportunities */}
              {optimization.inactiveUsers.length === 0 && optimization.downgradeRecommendations.length === 0 && (
                <Alert severity="success" icon={<CheckIcon />}>
                  <Typography variant="body2">
                    Uitstekend! Er zijn geen optimalisatiemogelijkheden gevonden. Alle licenties worden actief en efficiënt gebruikt.
                  </Typography>
                </Alert>
              )}
            </>
          )}
        </Paper>
      </Collapse>

      {/* Data Table */}
      {isLoading ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: neumorphColors.bgSurface,
            boxShadow: getNeumorph(isDark, 'soft'),
            borderRadius: 3,
          }}
        >
          <CircularProgress sx={{ color: LICENSE_COLOR }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Licentie gegevens laden...
          </Typography>
        </Paper>
      ) : (
        <AdminDataTable
          data={filteredUsers}
          columns={columns}
          emptyMessage="Geen gebruikers gevonden met de geselecteerde filters"
          getItemId={(item) => item.userId}
          defaultRowsPerPage={15}
          searchPlaceholder="Zoek gebruikers..."
          hideSearch
          externalSearchTerm={searchQuery}
          onSearchTermChange={setSearchQuery}
        />
      )}
    </Box>
  );
};

export default LicensesTab;

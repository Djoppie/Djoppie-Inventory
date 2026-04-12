import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  Skeleton,
  Button,
  alpha,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PlaceIcon from '@mui/icons-material/Place';
import PersonIcon from '@mui/icons-material/Person';
import LaptopIcon from '@mui/icons-material/Laptop';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import DockIcon from '@mui/icons-material/Dock';
import MonitorIcon from '@mui/icons-material/Monitor';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import DevicesIcon from '@mui/icons-material/Devices';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';

// Hooks
import { usePhysicalWorkplace, usePhysicalWorkplaceAssets, useClearOccupant, useUpdateOccupant } from '../hooks/usePhysicalWorkplaces';

// Common components
import UserAutocomplete from '../components/common/UserAutocomplete';

// Types
import { GraphUser } from '../types/graph.types';

// Dialogs
import EditPhysicalWorkplaceDialog from '../components/physicalWorkplaces/EditPhysicalWorkplaceDialog';
import WorkplaceAssetsDialog from '../components/physicalWorkplaces/WorkplaceAssetsDialog';
import DeviceAssignmentDialog from '../components/physicalWorkplaces/DeviceAssignmentDialog';

// Neumorphic utilities
import { getNeumorph, getNeumorphInset, getNeumorphColors } from '../utils/neumorphicStyles';

// Types
import { WorkplaceType, WorkplaceTypeLabels, PhysicalWorkplace } from '../types/physicalWorkplace.types';

// Constants
const WORKPLACE_COLOR = '#009688'; // Teal - consistent with workplaces
const OCCUPANT_COLOR = '#7B1FA2'; // Purple - consistent with employees
const EQUIPMENT_COLOR = '#FF7700'; // Orange - consistent with assets

// Get icon for workplace type
const getWorkplaceTypeIcon = (type: WorkplaceType) => {
  switch (type) {
    case WorkplaceType.Desktop:
      return <DesktopWindowsIcon />;
    case WorkplaceType.Laptop:
      return <LaptopIcon />;
    case WorkplaceType.HotDesk:
      return <EventSeatIcon />;
    case WorkplaceType.MeetingRoom:
      return <MeetingRoomIcon />;
    default:
      return <PlaceIcon />;
  }
};

// Loading Skeleton
const WorkplaceDetailSkeleton = () => (
  <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
    <Skeleton variant="rectangular" width={40} height={40} sx={{ borderRadius: 1, mb: 3 }} />
    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3, mb: 3 }} />
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 3 }} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 3 }} />
      </Grid>
    </Grid>
  </Box>
);

// Main Component
const WorkplaceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark = theme.palette.mode === 'dark';
  const neumorphColors = getNeumorphColors(isDark);

  const workplaceId = parseInt(id || '0', 10);
  const { data: workplace, isLoading, error } = usePhysicalWorkplace(workplaceId);
  const { data: allFixedAssets = [] } = usePhysicalWorkplaceAssets(workplaceId);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assetsDialogOpen, setAssetsDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [deviceAssignmentDialogOpen, setDeviceAssignmentDialogOpen] = useState(false);
  const [clearOccupantDialogOpen, setClearOccupantDialogOpen] = useState(false);
  const [assignOccupantDialogOpen, setAssignOccupantDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<GraphUser | null>(null);
  const [selectedUserName, setSelectedUserName] = useState('');

  // Mutations
  const clearOccupantMutation = useClearOccupant();
  const updateOccupantMutation = useUpdateOccupant();

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleSnackbarClose = () => setSnackbar((prev) => ({ ...prev, open: false }));
  const showSuccess = (message: string) => setSnackbar({ open: true, message, severity: 'success' });
  const showError = (message: string) => setSnackbar({ open: true, message, severity: 'error' });

  // Find shared device (laptop/desktop) from fixed assets when no occupant device is set
  const sharedDevice = useMemo(() => {
    if (!workplace || workplace.occupantDeviceAssetCode) return null;

    // Look for a laptop or desktop type asset assigned to this workplace
    // Check asset code prefix (LAP0002, DESK-26-XXXX), asset type name, and asset type code
    const devicePrefixes = ['lap', 'desk', 'laptop', 'desktop', 'pc', 'computer', 'notebook'];
    return allFixedAssets.find((asset: any) => {
      const assetCode = asset.assetCode?.toLowerCase() || '';
      const typeName = asset.assetType?.name?.toLowerCase() || '';
      const typeCode = asset.assetType?.code?.toLowerCase() || '';
      return devicePrefixes.some(prefix =>
        assetCode.startsWith(prefix) || typeName.includes(prefix) || typeCode.includes(prefix)
      );
    }) || null;
  }, [workplace, allFixedAssets]);

  // Filter out assets already shown in equipment slots (including shared device)
  const fixedAssets = useMemo(() => {
    if (!workplace) return allFixedAssets;

    const equipmentAssetIds = new Set([
      workplace.dockingStationAssetId,
      workplace.monitor1AssetId,
      workplace.monitor2AssetId,
      workplace.monitor3AssetId,
      workplace.keyboardAssetId,
      workplace.mouseAssetId,
      sharedDevice?.id, // Also filter out the shared device shown in Desktop/Laptop row
    ].filter(Boolean));

    return allFixedAssets.filter((asset: any) => !equipmentAssetIds.has(asset.id));
  }, [workplace, allFixedAssets, sharedDevice]);

  // Calculate equipment status
  const equipmentStatus = useMemo(() => {
    if (!workplace) return { filled: 0, expected: 0, percentage: 0 };

    let filled = 0;
    let expected = 0;

    // Docking station
    if (workplace.hasDockingStation) {
      expected++;
      if (workplace.dockingStationAssetId) filled++;
    }

    // Monitors
    for (let i = 1; i <= workplace.monitorCount; i++) {
      expected++;
      const monitorKey = `monitor${i}AssetId` as keyof PhysicalWorkplace;
      if (workplace[monitorKey]) filled++;
    }

    // Keyboard & Mouse (always expected)
    expected += 2;
    if (workplace.keyboardAssetId) filled++;
    if (workplace.mouseAssetId) filled++;

    return {
      filled,
      expected,
      percentage: expected > 0 ? Math.round((filled / expected) * 100) : 0,
    };
  }, [workplace]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  if (isLoading) {
    return <WorkplaceDetailSkeleton />;
  }

  if (error || !workplace) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Werkplek niet gevonden
        </Typography>
        <Button onClick={handleBack} sx={{ mt: 2 }}>
          Terug
        </Button>
      </Box>
    );
  }

  const isOccupied = !!workplace.currentOccupantName;

  return (
    <Box sx={{ minHeight: '100vh', pb: 8, bgcolor: neumorphColors.bgBase }}>
      {/* Header */}
      <Box
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 2, sm: 3 },
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          {/* Left: Back + Title */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Tooltip title="Terug" arrow>
              <IconButton
                onClick={handleBack}
                sx={{
                  mt: 0.5,
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  color: 'text.secondary',
                  bgcolor: neumorphColors.bgSurface,
                  boxShadow: getNeumorph(isDark, 'soft'),
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: WORKPLACE_COLOR,
                    bgcolor: neumorphColors.bgSurface,
                    transform: 'translateX(-2px)',
                    boxShadow: `0 4px 12px ${alpha(WORKPLACE_COLOR, 0.3)}`,
                  },
                  '&:active': {
                    boxShadow: getNeumorphInset(isDark),
                    transform: 'translateX(0)',
                  },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: alpha(WORKPLACE_COLOR, 0.1),
                    color: WORKPLACE_COLOR,
                  }}
                >
                  {getWorkplaceTypeIcon(workplace.type)}
                </Avatar>
                <Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      color: WORKPLACE_COLOR,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {workplace.code}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {workplace.name}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                <Chip
                  size="small"
                  label={WorkplaceTypeLabels[workplace.type]}
                  icon={getWorkplaceTypeIcon(workplace.type)}
                  sx={{
                    bgcolor: alpha(WORKPLACE_COLOR, 0.1),
                    color: WORKPLACE_COLOR,
                    fontWeight: 600,
                    '& .MuiChip-icon': { color: WORKPLACE_COLOR },
                  }}
                />
                <Chip
                  size="small"
                  label={workplace.isActive ? 'Actief' : 'Inactief'}
                  sx={{
                    bgcolor: workplace.isActive ? alpha('#4CAF50', 0.1) : alpha('#9E9E9E', 0.1),
                    color: workplace.isActive ? '#4CAF50' : '#9E9E9E',
                    fontWeight: 600,
                  }}
                />
                <Chip
                  size="small"
                  label={isOccupied ? 'Bezet' : 'Vacant'}
                  icon={isOccupied ? <PersonIcon /> : undefined}
                  sx={{
                    bgcolor: isOccupied ? alpha(OCCUPANT_COLOR, 0.1) : alpha('#9E9E9E', 0.1),
                    color: isOccupied ? OCCUPANT_COLOR : '#9E9E9E',
                    fontWeight: 600,
                    '& .MuiChip-icon': { color: OCCUPANT_COLOR },
                  }}
                />
                <Chip
                  size="small"
                  label={`${equipmentStatus.percentage}% uitgerust`}
                  icon={<DevicesIcon />}
                  sx={{
                    bgcolor: equipmentStatus.percentage === 100
                      ? alpha('#4CAF50', 0.1)
                      : equipmentStatus.percentage >= 50
                        ? alpha('#FFA726', 0.1)
                        : alpha('#EF5350', 0.1),
                    color: equipmentStatus.percentage === 100
                      ? '#4CAF50'
                      : equipmentStatus.percentage >= 50
                        ? '#FFA726'
                        : '#EF5350',
                    fontWeight: 600,
                    '& .MuiChip-icon': {
                      color: equipmentStatus.percentage === 100
                        ? '#4CAF50'
                        : equipmentStatus.percentage >= 50
                          ? '#FFA726'
                          : '#EF5350',
                    },
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Right: Actions */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Tooltip title="Equipment beheren" arrow>
                <IconButton
                  onClick={() => setAssetsDialogOpen(true)}
                  sx={{
                    color: EQUIPMENT_COLOR,
                    bgcolor: neumorphColors.bgSurface,
                    boxShadow: getNeumorph(isDark, 'soft'),
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: EQUIPMENT_COLOR,
                      color: '#fff',
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${alpha(EQUIPMENT_COLOR, 0.4)}`,
                    },
                    '&:active': {
                      boxShadow: getNeumorphInset(isDark),
                      transform: 'translateY(0)',
                    },
                  }}
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('deviceAssignment.title')} arrow>
                <IconButton
                  onClick={() => setDeviceAssignmentDialogOpen(true)}
                  sx={{
                    color: '#1976d2',
                    bgcolor: neumorphColors.bgSurface,
                    boxShadow: getNeumorph(isDark, 'soft'),
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: '#1976d2',
                      color: '#fff',
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${alpha('#1976d2', 0.4)}`,
                    },
                    '&:active': {
                      boxShadow: getNeumorphInset(isDark),
                      transform: 'translateY(0)',
                    },
                  }}
                >
                  <LaptopIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Bewerken" arrow>
                <IconButton
                  onClick={() => setEditDialogOpen(true)}
                  sx={{
                    color: WORKPLACE_COLOR,
                    bgcolor: neumorphColors.bgSurface,
                    boxShadow: getNeumorph(isDark, 'soft'),
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: WORKPLACE_COLOR,
                      color: '#fff',
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${alpha(WORKPLACE_COLOR, 0.4)}`,
                    },
                    '&:active': {
                      boxShadow: getNeumorphInset(isDark),
                      transform: 'translateY(0)',
                    },
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="QR Code" arrow>
                <IconButton
                  onClick={() => setQrDialogOpen(true)}
                  sx={{
                    color: 'text.secondary',
                    bgcolor: neumorphColors.bgSurface,
                    boxShadow: getNeumorph(isDark, 'soft'),
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: theme.palette.primary.main,
                      color: '#fff',
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                    },
                    '&:active': {
                      boxShadow: getNeumorphInset(isDark),
                      transform: 'translateY(0)',
                    },
                  }}
                >
                  <QrCode2Icon />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Top Row: Bezetter + Locatie side by side */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Occupant Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                p: 2.5,
                height: '100%',
                bgcolor: neumorphColors.bgSurface,
                boxShadow: getNeumorph(isDark, 'medium'),
                borderLeft: isOccupied ? `3px solid ${OCCUPANT_COLOR}` : `3px solid ${alpha(theme.palette.text.disabled, 0.3)}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: getNeumorph(isDark, 'strong'),
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <PersonIcon sx={{ fontSize: 18, color: OCCUPANT_COLOR }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: OCCUPANT_COLOR }}>
                  Bezetter
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: isOccupied ? alpha(OCCUPANT_COLOR, 0.15) : alpha(theme.palette.action.disabled, 0.1),
                    color: isOccupied ? OCCUPANT_COLOR : 'text.disabled',
                    fontSize: '1rem',
                  }}
                >
                  {isOccupied ? workplace.currentOccupantName?.charAt(0).toUpperCase() : <PersonIcon />}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {isOccupied ? workplace.currentOccupantName : 'Geen bezetter'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {isOccupied ? workplace.currentOccupantEmail : 'Niet toegewezen'}
                  </Typography>
                </Box>
                {isOccupied ? (
                  <Tooltip title={t('physicalWorkplaces.clearOccupant')} arrow>
                    <IconButton
                      size="small"
                      onClick={() => setClearOccupantDialogOpen(true)}
                      sx={{ color: 'error.main' }}
                    >
                      <PersonRemoveIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setAssignOccupantDialogOpen(true)}
                    sx={{ color: OCCUPANT_COLOR, borderColor: alpha(OCCUPANT_COLOR, 0.3) }}
                  >
                    {t('physicalWorkplaces.occupier.assignOccupier')}
                  </Button>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Location Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                p: 2.5,
                height: '100%',
                bgcolor: neumorphColors.bgSurface,
                boxShadow: getNeumorph(isDark, 'medium'),
                borderLeft: `3px solid ${WORKPLACE_COLOR}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: getNeumorph(isDark, 'strong'),
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <LocationOnIcon sx={{ fontSize: 18, color: WORKPLACE_COLOR }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: WORKPLACE_COLOR }}>
                  Locatie
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ minWidth: 120 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                    Gebouw
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {workplace.buildingName || '-'}
                  </Typography>
                </Box>
                <Box sx={{ minWidth: 100 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                    Dienst
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {workplace.serviceName || '-'}
                  </Typography>
                </Box>
                <Box sx={{ minWidth: 60 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                    Verdieping
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {workplace.floor || '-'}
                  </Typography>
                </Box>
                <Box sx={{ minWidth: 80 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                    Kamer
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {workplace.room || '-'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Equipment Table */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: neumorphColors.bgSurface,
            boxShadow: getNeumorph(isDark, 'medium'),
          }}
        >
          {/* Table Header Bar */}
          <Box
            sx={{
              px: 2.5,
              py: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: neumorphColors.bgBase,
              boxShadow: getNeumorphInset(isDark),
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: alpha(EQUIPMENT_COLOR, 0.15),
                  color: EQUIPMENT_COLOR,
                }}
              >
                <DevicesIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: EQUIPMENT_COLOR }}>
                  Equipment
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {equipmentStatus.filled} van {equipmentStatus.expected} ingevuld
                </Typography>
              </Box>
            </Box>
            <Button
              size="small"
              startIcon={<SettingsIcon />}
              onClick={() => setAssetsDialogOpen(true)}
              sx={{
                color: EQUIPMENT_COLOR,
                bgcolor: neumorphColors.bgSurface,
                boxShadow: getNeumorph(isDark, 'soft'),
                px: 2,
                '&:hover': {
                  bgcolor: EQUIPMENT_COLOR,
                  color: '#fff',
                  boxShadow: `0 4px 12px ${alpha(EQUIPMENT_COLOR, 0.4)}`,
                },
              }}
            >
              Beheren
            </Button>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: isDark ? alpha(EQUIPMENT_COLOR, 0.08) : alpha(EQUIPMENT_COLOR, 0.04),
                    '& th': {
                      borderBottom: `2px solid ${EQUIPMENT_COLOR}`,
                      color: EQUIPMENT_COLOR,
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    },
                  }}
                >
                  <TableCell sx={{ width: 160, py: 1.5 }}>Type</TableCell>
                  <TableCell sx={{ py: 1.5 }}>Asset Code</TableCell>
                  <TableCell sx={{ width: 80, py: 1.5, textAlign: 'center' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody
                sx={{
                  '& tr': {
                    transition: 'all 0.15s ease',
                  },
                  '& tr:nth-of-type(odd)': {
                    bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
                  },
                  '& tr:nth-of-type(even)': {
                    bgcolor: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.025)',
                  },
                  '& tr:hover': {
                    bgcolor: isDark ? alpha(EQUIPMENT_COLOR, 0.08) : alpha(EQUIPMENT_COLOR, 0.04),
                  },
                  '& td': {
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                    py: 1.25,
                  },
                }}
              >
                {/* Desktop (only for Desktop workplaces) */}
                {workplace.type === WorkplaceType.Desktop && (
                  <TableRow>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DesktopWindowsIcon sx={{ fontSize: 18, color: EQUIPMENT_COLOR }} />
                        Desktop
                        {sharedDevice && !workplace.occupantDeviceAssetCode && (
                          <Chip size="small" label="Gedeeld" sx={{ ml: 1, height: 18, fontSize: '0.65rem', bgcolor: alpha(OCCUPANT_COLOR, 0.1), color: OCCUPANT_COLOR }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {workplace.occupantDeviceAssetCode ? (
                        <Typography
                          component={Link}
                          to={`/inventory/assets?search=${workplace.occupantDeviceAssetCode}`}
                          sx={{ fontFamily: 'monospace', color: EQUIPMENT_COLOR, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {workplace.occupantDeviceAssetCode}
                        </Typography>
                      ) : sharedDevice ? (
                        <Typography
                          component={Link}
                          to={`/inventory/assets/${sharedDevice.id}`}
                          sx={{ fontFamily: 'monospace', color: EQUIPMENT_COLOR, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {sharedDevice.assetCode}
                        </Typography>
                      ) : (
                        <Typography color="text.disabled">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {workplace.occupantDeviceAssetCode || sharedDevice ? (
                        <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                      ) : (
                        <WarningIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                      )}
                    </TableCell>
                  </TableRow>
                )}

                {/* Docking Station */}
                {workplace.hasDockingStation && (
                  <TableRow>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DockIcon sx={{ fontSize: 18, color: EQUIPMENT_COLOR }} />
                        Docking Station
                      </Box>
                    </TableCell>
                    <TableCell>
                      {workplace.dockingStationAssetId ? (
                        <Typography
                          component={Link}
                          to={`/inventory/assets/${workplace.dockingStationAssetId}`}
                          sx={{ fontFamily: 'monospace', color: EQUIPMENT_COLOR, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {workplace.dockingStationAssetCode}
                        </Typography>
                      ) : (
                        <Typography color="text.disabled">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {workplace.dockingStationAssetId ? (
                        <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                      ) : (
                        <WarningIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                      )}
                    </TableCell>
                  </TableRow>
                )}

                {/* Monitor 1 */}
                {workplace.monitorCount >= 1 && (
                  <TableRow>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MonitorIcon sx={{ fontSize: 18, color: EQUIPMENT_COLOR }} />
                        Monitor 1
                      </Box>
                    </TableCell>
                    <TableCell>
                      {workplace.monitor1AssetId ? (
                        <Typography
                          component={Link}
                          to={`/inventory/assets/${workplace.monitor1AssetId}`}
                          sx={{ fontFamily: 'monospace', color: EQUIPMENT_COLOR, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {workplace.monitor1AssetCode}
                        </Typography>
                      ) : (
                        <Typography color="text.disabled">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {workplace.monitor1AssetId ? (
                        <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                      ) : (
                        <WarningIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                      )}
                    </TableCell>
                  </TableRow>
                )}

                {/* Monitor 2 */}
                {workplace.monitorCount >= 2 && (
                  <TableRow>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MonitorIcon sx={{ fontSize: 18, color: EQUIPMENT_COLOR }} />
                        Monitor 2
                      </Box>
                    </TableCell>
                    <TableCell>
                      {workplace.monitor2AssetId ? (
                        <Typography
                          component={Link}
                          to={`/inventory/assets/${workplace.monitor2AssetId}`}
                          sx={{ fontFamily: 'monospace', color: EQUIPMENT_COLOR, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {workplace.monitor2AssetCode}
                        </Typography>
                      ) : (
                        <Typography color="text.disabled">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {workplace.monitor2AssetId ? (
                        <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                      ) : (
                        <WarningIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                      )}
                    </TableCell>
                  </TableRow>
                )}

                {/* Monitor 3 */}
                {workplace.monitorCount >= 3 && (
                  <TableRow>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MonitorIcon sx={{ fontSize: 18, color: EQUIPMENT_COLOR }} />
                        Monitor 3
                      </Box>
                    </TableCell>
                    <TableCell>
                      {workplace.monitor3AssetId ? (
                        <Typography
                          component={Link}
                          to={`/inventory/assets/${workplace.monitor3AssetId}`}
                          sx={{ fontFamily: 'monospace', color: EQUIPMENT_COLOR, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {workplace.monitor3AssetCode}
                        </Typography>
                      ) : (
                        <Typography color="text.disabled">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {workplace.monitor3AssetId ? (
                        <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                      ) : (
                        <WarningIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                      )}
                    </TableCell>
                  </TableRow>
                )}

                {/* Keyboard */}
                <TableRow>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <KeyboardIcon sx={{ fontSize: 18, color: EQUIPMENT_COLOR }} />
                      Toetsenbord
                    </Box>
                  </TableCell>
                  <TableCell>
                    {workplace.keyboardAssetId ? (
                      <Typography
                        component={Link}
                        to={`/inventory/assets/${workplace.keyboardAssetId}`}
                        sx={{ fontFamily: 'monospace', color: EQUIPMENT_COLOR, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        {workplace.keyboardAssetCode}
                      </Typography>
                    ) : (
                      <Typography color="text.disabled">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {workplace.keyboardAssetId ? (
                      <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                    ) : (
                      <WarningIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                    )}
                  </TableCell>
                </TableRow>

                {/* Mouse */}
                <TableRow>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MouseIcon sx={{ fontSize: 18, color: EQUIPMENT_COLOR }} />
                      Muis
                    </Box>
                  </TableCell>
                  <TableCell>
                    {workplace.mouseAssetId ? (
                      <Typography
                        component={Link}
                        to={`/inventory/assets/${workplace.mouseAssetId}`}
                        sx={{ fontFamily: 'monospace', color: EQUIPMENT_COLOR, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        {workplace.mouseAssetCode}
                      </Typography>
                    ) : (
                      <Typography color="text.disabled">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {workplace.mouseAssetId ? (
                      <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                    ) : (
                      <WarningIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                    )}
                  </TableCell>
                </TableRow>

                {/* Laptop (for non-desktop workplaces) - shows occupant's laptop or shared device */}
                {workplace.type !== WorkplaceType.Desktop && (workplace.occupantDeviceAssetCode || sharedDevice) && (
                  <TableRow
                    sx={{
                      borderLeft: `3px solid ${OCCUPANT_COLOR}`,
                      '&:hover': {
                        bgcolor: `${alpha(OCCUPANT_COLOR, 0.08)} !important`,
                      },
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LaptopIcon sx={{ fontSize: 18, color: OCCUPANT_COLOR }} />
                        <Typography sx={{ fontWeight: 500 }}>
                          {workplace.occupantDeviceAssetCode ? 'Laptop (bezetter)' : 'Laptop'}
                        </Typography>
                        {sharedDevice && !workplace.occupantDeviceAssetCode && (
                          <Chip size="small" label="Gedeeld" sx={{ height: 18, fontSize: '0.65rem', bgcolor: alpha(OCCUPANT_COLOR, 0.1), color: OCCUPANT_COLOR }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {workplace.occupantDeviceAssetCode ? (
                        <Typography
                          component={Link}
                          to={`/inventory/assets?search=${workplace.occupantDeviceAssetCode}`}
                          sx={{ fontFamily: 'monospace', color: OCCUPANT_COLOR, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {workplace.occupantDeviceAssetCode}
                        </Typography>
                      ) : sharedDevice ? (
                        <Typography
                          component={Link}
                          to={`/inventory/assets/${sharedDevice.id}`}
                          sx={{ fontFamily: 'monospace', color: OCCUPANT_COLOR, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {sharedDevice.assetCode}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                    </TableCell>
                  </TableRow>
                )}

                {/* Additional Fixed Assets */}
                {fixedAssets.map((asset: any) => (
                  <TableRow key={asset.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InventoryIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        {asset.assetType?.name || 'Overig'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography
                        component={Link}
                        to={`/inventory/assets/${asset.id}`}
                        sx={{ fontFamily: 'monospace', color: EQUIPMENT_COLOR, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        {asset.assetCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Metadata Footer */}
        <Box
          sx={{
            mt: 4,
            pt: 2.5,
            pb: 1,
            px: 2,
            bgcolor: neumorphColors.bgBase,
            borderRadius: 2,
            boxShadow: getNeumorphInset(isDark),
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.02em' }}>
            Aangemaakt: {new Date(workplace.createdAt).toLocaleDateString('nl-NL', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })} &nbsp;&bull;&nbsp;
            Laatst bijgewerkt: {new Date(workplace.updatedAt).toLocaleDateString('nl-NL', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Typography>
        </Box>
      </Box>

      {/* Edit Workplace Dialog */}
      <EditPhysicalWorkplaceDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        workplace={workplace}
        onSuccess={showSuccess}
        onError={showError}
      />

      {/* Assets Management Dialog */}
      <WorkplaceAssetsDialog
        open={assetsDialogOpen}
        onClose={() => setAssetsDialogOpen(false)}
        workplace={workplace}
        onSuccess={showSuccess}
        onError={showError}
      />

      {/* Device Assignment Dialog */}
      <DeviceAssignmentDialog
        open={deviceAssignmentDialogOpen}
        onClose={() => setDeviceAssignmentDialogOpen(false)}
        workplace={workplace}
        onSuccess={showSuccess}
        onError={showError}
      />

      {/* Clear Occupant Confirmation Dialog */}
      <Dialog
        open={clearOccupantDialogOpen}
        onClose={() => setClearOccupantDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: neumorphColors.bgSurface,
            boxShadow: getNeumorph(isDark, 'strong'),
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          {t('physicalWorkplaces.clearOccupantTitle')}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t('physicalWorkplaces.clearOccupantConfirm', { name: workplace.currentOccupantName })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearOccupantDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={clearOccupantMutation.isPending}
            onClick={async () => {
              try {
                await clearOccupantMutation.mutateAsync(workplaceId);
                showSuccess(t('physicalWorkplaces.occupantCleared'));
                setClearOccupantDialogOpen(false);
              } catch (error) {
                showError(t('physicalWorkplaces.occupantClearError'));
              }
            }}
          >
            {clearOccupantMutation.isPending ? t('common.loading') : t('physicalWorkplaces.clearOccupant')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Occupant Dialog */}
      <Dialog
        open={assignOccupantDialogOpen}
        onClose={() => {
          setAssignOccupantDialogOpen(false);
          setSelectedUser(null);
          setSelectedUserName('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: neumorphColors.bgSurface,
            boxShadow: getNeumorph(isDark, 'strong'),
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: OCCUPANT_COLOR }}>
          {t('physicalWorkplaces.occupier.assignOccupier')}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            {t('physicalWorkplaces.occupier.searchPlaceholder')}
          </Typography>
          <UserAutocomplete
            value={selectedUserName}
            onChange={(displayName, user) => {
              setSelectedUserName(displayName);
              setSelectedUser(user);
            }}
            label={t('physicalWorkplaces.occupier.title')}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAssignOccupantDialogOpen(false);
              setSelectedUser(null);
              setSelectedUserName('');
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={!selectedUser || updateOccupantMutation.isPending}
            onClick={async () => {
              if (!selectedUser) return;
              try {
                await updateOccupantMutation.mutateAsync({
                  id: workplaceId,
                  data: {
                    occupantEntraId: selectedUser.id,
                    occupantName: selectedUser.displayName,
                    occupantEmail: selectedUser.mail || selectedUser.userPrincipalName,
                  },
                });
                showSuccess(t('physicalWorkplaces.occupier.assignSuccess'));
                setAssignOccupantDialogOpen(false);
                setSelectedUser(null);
                setSelectedUserName('');
              } catch (error) {
                showError(t('physicalWorkplaces.occupier.assignError'));
              }
            }}
            sx={{
              bgcolor: OCCUPANT_COLOR,
              '&:hover': { bgcolor: alpha(OCCUPANT_COLOR, 0.85) },
            }}
          >
            {updateOccupantMutation.isPending ? t('common.loading') : t('physicalWorkplaces.occupier.assignOccupier')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog
        open={qrDialogOpen}
        onClose={() => setQrDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: neumorphColors.bgSurface,
            boxShadow: getNeumorph(isDark, 'strong'),
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 700, color: WORKPLACE_COLOR }}>
          QR Code - {workplace.code}
        </DialogTitle>
        <DialogContent id="qr-dialog-content" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
          <Box
            sx={{
              p: 3,
              bgcolor: '#fff',
              borderRadius: 2,
              boxShadow: getNeumorph(isDark, 'medium'),
            }}
          >
            <QRCodeSVG
              value={workplace.code}
              size={200}
              level="H"
              includeMargin
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            Scan deze QR code om werkplek <strong>{workplace.code}</strong> te identificeren
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            variant="contained"
            onClick={() => {
              // Download QR code as SVG
              const svg = document.querySelector('#qr-dialog-content svg');
              if (svg) {
                const svgData = new XMLSerializer().serializeToString(svg);
                const blob = new Blob([svgData], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${workplace.code}-QR.svg`;
                a.click();
                URL.revokeObjectURL(url);
              }
              setQrDialogOpen(false);
            }}
            sx={{
              bgcolor: WORKPLACE_COLOR,
              '&:hover': { bgcolor: alpha(WORKPLACE_COLOR, 0.85) },
            }}
          >
            Download QR Code
          </Button>
          <Button onClick={() => setQrDialogOpen(false)}>
            Sluiten
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WorkplaceDetailPage;

import { useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  Grid,
  Skeleton,
  Divider,
  Button,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';

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
import EmailIcon from '@mui/icons-material/Email';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import DevicesIcon from '@mui/icons-material/Devices';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ApartmentIcon from '@mui/icons-material/Apartment';
import GroupsIcon from '@mui/icons-material/Groups';
import LayersIcon from '@mui/icons-material/Layers';
import RoomIcon from '@mui/icons-material/Room';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';

// Hooks
import { usePhysicalWorkplace, usePhysicalWorkplaceAssets } from '../hooks/usePhysicalWorkplaces';

// Types
import { WorkplaceType, WorkplaceTypeLabels, PhysicalWorkplace } from '../types/physicalWorkplace.types';

// Constants
const WORKPLACE_COLOR = '#009688'; // Teal - consistent with workplaces
const OCCUPANT_COLOR = '#7B1FA2'; // Purple - consistent with employees
const EQUIPMENT_COLOR = '#FF7700'; // Orange - consistent with assets

// Helper to format date difference
const formatTimeSince = (dateString?: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return 'Vandaag';
  if (diffDays === 1) return '1 dag';
  if (diffDays < 30) return `${diffDays} dagen`;
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'maand' : 'maanden'}`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} ${years === 1 ? 'jaar' : 'jaar'}`;
};

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

// Equipment Slot Component
interface EquipmentSlotProps {
  label: string;
  icon: React.ReactNode;
  assetId?: number;
  assetCode?: string;
  serialNumber?: string;
  isExpected?: boolean;
  color?: string;
}

const EquipmentSlot = ({ label, icon, assetId, assetCode, serialNumber, isExpected = true, color = EQUIPMENT_COLOR }: EquipmentSlotProps) => {
  const theme = useTheme();
  const isAssigned = !!assetId;
  const isEmpty = isExpected && !isAssigned;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: isEmpty
          ? alpha(theme.palette.warning.main, 0.3)
          : isAssigned
            ? alpha(color, 0.2)
            : alpha(theme.palette.divider, 0.5),
        bgcolor: isEmpty
          ? alpha(theme.palette.warning.main, 0.03)
          : isAssigned
            ? alpha(color, 0.02)
            : 'transparent',
        transition: 'all 0.2s ease',
        cursor: assetId ? 'pointer' : 'default',
        '&:hover': assetId ? {
          borderColor: color,
          bgcolor: alpha(color, 0.05),
          transform: 'translateY(-2px)',
          boxShadow: `0 4px 12px ${alpha(color, 0.15)}`,
        } : {},
      }}
      component={assetId ? Link : 'div'}
      {...(assetId && { to: `/assets/${assetId}` })}
      style={assetId ? { textDecoration: 'none', color: 'inherit' } : undefined}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: isEmpty
              ? alpha(theme.palette.warning.main, 0.1)
              : isAssigned
                ? alpha(color, 0.1)
                : alpha(theme.palette.action.disabled, 0.1),
            color: isEmpty
              ? theme.palette.warning.main
              : isAssigned
                ? color
                : theme.palette.text.disabled,
          }}
        >
          {icon}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 600,
              fontSize: '0.65rem',
            }}
          >
            {label}
          </Typography>
          {isAssigned ? (
            <>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: color,
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                }}
              >
                {assetCode}
              </Typography>
              {serialNumber && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  S/N: {serialNumber}
                </Typography>
              )}
            </>
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: isEmpty ? 'warning.main' : 'text.disabled',
                fontStyle: 'italic',
                fontSize: '0.8rem',
              }}
            >
              {isEmpty ? 'Niet toegewezen' : 'Niet vereist'}
            </Typography>
          )}
        </Box>
        {isAssigned && (
          <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main', opacity: 0.8 }} />
        )}
        {isEmpty && (
          <WarningIcon sx={{ fontSize: 18, color: 'warning.main', opacity: 0.8 }} />
        )}
      </Box>
    </Paper>
  );
};

// Info Card Component
interface InfoCardProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

const InfoCard = ({ title, icon, color, children, action }: InfoCardProps) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: alpha(color, 0.15),
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: `linear-gradient(135deg, ${alpha(color, 0.08)} 0%, ${alpha(color, 0.03)} 100%)`,
          borderBottom: '1px solid',
          borderColor: alpha(color, 0.1),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: alpha(color, 0.15),
              color: color,
            }}
          >
            {icon}
          </Avatar>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: theme.palette.mode === 'dark' ? '#fff' : color,
              letterSpacing: '0.02em',
            }}
          >
            {title}
          </Typography>
        </Box>
        {action}
      </Box>
      <Box sx={{ p: 2.5 }}>
        {children}
      </Box>
    </Paper>
  );
};

// Info Row Component
interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string | React.ReactNode;
  color?: string;
  monospace?: boolean;
}

const InfoRow = ({ icon, label, value, color, monospace }: InfoRowProps) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5, '&:last-child': { mb: 0 } }}>
    <Box sx={{ color: color || 'text.secondary', mt: 0.25 }}>
      {icon}
    </Box>
    <Box sx={{ flex: 1 }}>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: 600,
          fontSize: '0.6rem',
          display: 'block',
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 500,
          fontFamily: monospace ? 'monospace' : 'inherit',
          color: value ? 'text.primary' : 'text.disabled',
        }}
      >
        {value || '-'}
      </Typography>
    </Box>
  </Box>
);

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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const workplaceId = parseInt(id || '0', 10);
  const { data: workplace, isLoading, error } = usePhysicalWorkplace(workplaceId);
  const { data: fixedAssets = [] } = usePhysicalWorkplaceAssets(workplaceId);

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
    <Box sx={{ minHeight: '100vh', pb: 8 }}>
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
                  borderRadius: 1.5,
                  color: 'text.secondary',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: WORKPLACE_COLOR,
                    borderColor: WORKPLACE_COLOR,
                    bgcolor: alpha(WORKPLACE_COLOR, 0.08),
                    transform: 'translateX(-2px)',
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
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Equipment beheren" arrow>
                <IconButton
                  sx={{
                    color: EQUIPMENT_COLOR,
                    border: '1px solid',
                    borderColor: alpha(EQUIPMENT_COLOR, 0.3),
                    '&:hover': {
                      bgcolor: alpha(EQUIPMENT_COLOR, 0.08),
                      borderColor: EQUIPMENT_COLOR,
                    },
                  }}
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Bewerken" arrow>
                <IconButton
                  sx={{
                    color: WORKPLACE_COLOR,
                    border: '1px solid',
                    borderColor: alpha(WORKPLACE_COLOR, 0.3),
                    '&:hover': {
                      bgcolor: alpha(WORKPLACE_COLOR, 0.08),
                      borderColor: WORKPLACE_COLOR,
                    },
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="QR Code" arrow>
                <IconButton
                  sx={{
                    color: 'text.secondary',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
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
        <Grid container spacing={3}>
          {/* Left Column: Occupant + Location */}
          <Grid size={{ xs: 12, lg: 5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Occupant Hero Card */}
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: isOccupied ? alpha(OCCUPANT_COLOR, 0.2) : 'divider',
                  overflow: 'hidden',
                  background: isOccupied
                    ? `linear-gradient(135deg, ${alpha(OCCUPANT_COLOR, 0.05)} 0%, ${alpha(OCCUPANT_COLOR, 0.02)} 100%)`
                    : undefined,
                }}
              >
                <Box
                  sx={{
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: isOccupied ? alpha(OCCUPANT_COLOR, 0.15) : alpha(theme.palette.action.disabled, 0.1),
                      color: isOccupied ? OCCUPANT_COLOR : 'text.disabled',
                      fontSize: '2rem',
                      mb: 2,
                    }}
                  >
                    {isOccupied ? workplace.currentOccupantName?.charAt(0).toUpperCase() : <PersonIcon sx={{ fontSize: 40 }} />}
                  </Avatar>

                  {isOccupied ? (
                    <>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {workplace.currentOccupantName}
                      </Typography>
                      {workplace.currentOccupantEmail && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mb: 1 }}>
                          <EmailIcon sx={{ fontSize: 16 }} />
                          <Typography variant="body2">
                            {workplace.currentOccupantEmail}
                          </Typography>
                        </Box>
                      )}
                      {workplace.occupiedSince && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                          <ScheduleIcon sx={{ fontSize: 16 }} />
                          <Typography variant="body2">
                            Op deze werkplek sinds {formatTimeSince(workplace.occupiedSince)}
                          </Typography>
                        </Box>
                      )}
                    </>
                  ) : (
                    <>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
                        Geen bezetter
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        Deze werkplek is momenteel niet toegewezen
                      </Typography>
                    </>
                  )}
                </Box>

                {/* Occupant's Device */}
                {isOccupied && workplace.occupantDeviceAssetCode && (
                  <>
                    <Divider />
                    <Box sx={{ p: 2 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          fontWeight: 600,
                          display: 'block',
                          mb: 1,
                        }}
                      >
                        Apparaat van bezetter
                      </Typography>
                      <Box
                        component={Link}
                        to={`/assets?search=${workplace.occupantDeviceAssetCode}`}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: alpha(EQUIPMENT_COLOR, 0.05),
                          border: '1px solid',
                          borderColor: alpha(EQUIPMENT_COLOR, 0.1),
                          textDecoration: 'none',
                          color: 'inherit',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: alpha(EQUIPMENT_COLOR, 0.1),
                            borderColor: EQUIPMENT_COLOR,
                          },
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: alpha(EQUIPMENT_COLOR, 0.1),
                            color: EQUIPMENT_COLOR,
                          }}
                        >
                          <LaptopIcon sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, fontFamily: 'monospace', color: EQUIPMENT_COLOR }}
                          >
                            {workplace.occupantDeviceAssetCode}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {[workplace.occupantDeviceBrand, workplace.occupantDeviceModel].filter(Boolean).join(' ') || 'Geen details'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </>
                )}

                {/* Actions */}
                <Divider />
                <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
                  {isOccupied ? (
                    <Button
                      size="small"
                      startIcon={<PersonRemoveIcon />}
                      sx={{ color: 'error.main' }}
                    >
                      Bezetter verwijderen
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      startIcon={<PersonIcon />}
                      sx={{ color: OCCUPANT_COLOR }}
                    >
                      Bezetter toewijzen
                    </Button>
                  )}
                </Box>
              </Paper>

              {/* Location Card */}
              <InfoCard
                title="Locatie"
                icon={<LocationOnIcon sx={{ fontSize: 18 }} />}
                color={WORKPLACE_COLOR}
              >
                <InfoRow
                  icon={<ApartmentIcon sx={{ fontSize: 18 }} />}
                  label="Gebouw"
                  value={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{workplace.buildingName}</span>
                      {workplace.buildingCode && (
                        <Chip
                          size="small"
                          label={workplace.buildingCode}
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontFamily: 'monospace',
                            bgcolor: alpha(WORKPLACE_COLOR, 0.1),
                            color: WORKPLACE_COLOR,
                          }}
                        />
                      )}
                    </Box>
                  }
                  color={WORKPLACE_COLOR}
                />
                <InfoRow
                  icon={<GroupsIcon sx={{ fontSize: 18 }} />}
                  label="Dienst"
                  value={workplace.serviceName}
                  color={WORKPLACE_COLOR}
                />
                <InfoRow
                  icon={<LayersIcon sx={{ fontSize: 18 }} />}
                  label="Verdieping"
                  value={workplace.floor}
                  color={WORKPLACE_COLOR}
                />
                <InfoRow
                  icon={<RoomIcon sx={{ fontSize: 18 }} />}
                  label="Kamer / Zone"
                  value={workplace.room}
                  color={WORKPLACE_COLOR}
                />
                {workplace.description && (
                  <>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      {workplace.description}
                    </Typography>
                  </>
                )}
              </InfoCard>
            </Box>
          </Grid>

          {/* Right Column: Equipment */}
          <Grid size={{ xs: 12, lg: 7 }}>
            <InfoCard
              title={`Equipment (${equipmentStatus.filled}/${equipmentStatus.expected})`}
              icon={<DevicesIcon sx={{ fontSize: 18 }} />}
              color={EQUIPMENT_COLOR}
              action={
                <Button
                  size="small"
                  startIcon={<SettingsIcon />}
                  sx={{ color: EQUIPMENT_COLOR }}
                >
                  Beheren
                </Button>
              }
            >
              {/* Equipment Configuration Summary */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Configuratie: {workplace.monitorCount} monitor{workplace.monitorCount !== 1 ? 's' : ''},
                  {workplace.hasDockingStation ? ' docking station, ' : ' geen docking, '}
                  keyboard, muis
                </Typography>
                {/* Progress bar */}
                <Box
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(EQUIPMENT_COLOR, 0.1),
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      width: `${equipmentStatus.percentage}%`,
                      borderRadius: 4,
                      bgcolor: equipmentStatus.percentage === 100
                        ? '#4CAF50'
                        : equipmentStatus.percentage >= 50
                          ? '#FFA726'
                          : '#EF5350',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </Box>
              </Box>

              {/* Equipment Grid */}
              <Grid container spacing={2}>
                {/* Docking Station */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <EquipmentSlot
                    label="Docking Station"
                    icon={<DockIcon sx={{ fontSize: 20 }} />}
                    assetId={workplace.dockingStationAssetId}
                    assetCode={workplace.dockingStationAssetCode}
                    serialNumber={workplace.dockingStationSerialNumber}
                    isExpected={workplace.hasDockingStation}
                  />
                </Grid>

                {/* Monitor 1 */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <EquipmentSlot
                    label="Monitor 1"
                    icon={<MonitorIcon sx={{ fontSize: 20 }} />}
                    assetId={workplace.monitor1AssetId}
                    assetCode={workplace.monitor1AssetCode}
                    serialNumber={workplace.monitor1SerialNumber}
                    isExpected={workplace.monitorCount >= 1}
                  />
                </Grid>

                {/* Monitor 2 */}
                {workplace.monitorCount >= 2 && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <EquipmentSlot
                      label="Monitor 2"
                      icon={<MonitorIcon sx={{ fontSize: 20 }} />}
                      assetId={workplace.monitor2AssetId}
                      assetCode={workplace.monitor2AssetCode}
                      serialNumber={workplace.monitor2SerialNumber}
                      isExpected={true}
                    />
                  </Grid>
                )}

                {/* Monitor 3 */}
                {workplace.monitorCount >= 3 && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <EquipmentSlot
                      label="Monitor 3"
                      icon={<MonitorIcon sx={{ fontSize: 20 }} />}
                      assetId={workplace.monitor3AssetId}
                      assetCode={workplace.monitor3AssetCode}
                      serialNumber={workplace.monitor3SerialNumber}
                      isExpected={true}
                    />
                  </Grid>
                )}

                {/* Keyboard */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <EquipmentSlot
                    label="Toetsenbord"
                    icon={<KeyboardIcon sx={{ fontSize: 20 }} />}
                    assetId={workplace.keyboardAssetId}
                    assetCode={workplace.keyboardAssetCode}
                    serialNumber={workplace.keyboardSerialNumber}
                    isExpected={true}
                  />
                </Grid>

                {/* Mouse */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <EquipmentSlot
                    label="Muis"
                    icon={<MouseIcon sx={{ fontSize: 20 }} />}
                    assetId={workplace.mouseAssetId}
                    assetCode={workplace.mouseAssetCode}
                    serialNumber={workplace.mouseSerialNumber}
                    isExpected={true}
                  />
                </Grid>
              </Grid>

              {/* Additional Fixed Assets */}
              {fixedAssets.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography
                    variant="subtitle2"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 2,
                      color: 'text.secondary',
                    }}
                  >
                    <InventoryIcon sx={{ fontSize: 18 }} />
                    Overige Vaste Assets ({fixedAssets.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {fixedAssets.slice(0, 5).map((asset: any) => (
                      <Box
                        key={asset.id}
                        component={Link}
                        to={`/assets/${asset.id}`}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1,
                          borderRadius: 1,
                          bgcolor: alpha(EQUIPMENT_COLOR, 0.03),
                          border: '1px solid',
                          borderColor: alpha(EQUIPMENT_COLOR, 0.1),
                          textDecoration: 'none',
                          color: 'inherit',
                          '&:hover': {
                            bgcolor: alpha(EQUIPMENT_COLOR, 0.08),
                          },
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: 'monospace', fontWeight: 600, color: EQUIPMENT_COLOR }}
                        >
                          {asset.assetCode}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {asset.assetType?.name || asset.category}
                        </Typography>
                      </Box>
                    ))}
                    {fixedAssets.length > 5 && (
                      <Button size="small" sx={{ alignSelf: 'flex-start' }}>
                        + {fixedAssets.length - 5} meer assets bekijken
                      </Button>
                    )}
                  </Box>
                </Box>
              )}
            </InfoCard>
          </Grid>
        </Grid>

        {/* Metadata Footer */}
        <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.disabled">
            Aangemaakt: {new Date(workplace.createdAt).toLocaleDateString('nl-NL', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })} |
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
    </Box>
  );
};

export default WorkplaceDetailPage;

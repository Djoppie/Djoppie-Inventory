/**
 * PhysicalWorkplaceCard - Neumorphic card showing physical workplace details
 *
 * Features:
 * - Visual indicators for occupancy status (occupied/available)
 * - Equipment slot status (monitors, docking, peripherals)
 * - Building/floor/room location info
 * - Selection state with orange glow
 * - Dark/light mode support
 */

import { Box, Typography, Chip, Stack, useTheme, Tooltip } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import MonitorIcon from '@mui/icons-material/Monitor';
import DockIcon from '@mui/icons-material/Dock';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import type { PhysicalWorkplace, PhysicalWorkplaceSummary } from '../../types/physicalWorkplace.types';

interface EquipmentChipProps {
  icon: React.ReactNode;
  label: string;
  present: boolean;
  tooltip?: string;
}

const EquipmentChip = ({ icon, label, present, tooltip }: EquipmentChipProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const chip = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.5,
        borderRadius: 1.5,
        bgcolor: isDark ? '#1e2328' : '#e8eef3',
        boxShadow: present
          ? (isDark
              ? 'inset 2px 2px 4px #161a1d, inset -2px -2px 4px #262c33'
              : 'inset 2px 2px 4px #c5cad0, inset -2px -2px 4px #ffffff')
          : (isDark
              ? '2px 2px 4px #161a1d, -2px -2px 4px #262c33'
              : '2px 2px 4px #c5cad0, -2px -2px 4px #ffffff'),
        transition: 'all 0.2s ease',
      }}
    >
      <Box
        sx={{
          color: present ? '#16a34a' : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.25)'),
          display: 'flex',
          alignItems: 'center',
          '& svg': { fontSize: 14 },
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="caption"
        sx={{
          fontSize: '0.65rem',
          fontWeight: 600,
          color: present
            ? (isDark ? '#16a34a' : '#15803d')
            : (isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.35)'),
        }}
      >
        {label}
      </Typography>
    </Box>
  );

  if (tooltip) {
    return <Tooltip title={tooltip} arrow placement="top">{chip}</Tooltip>;
  }

  return chip;
};

interface PhysicalWorkplaceCardProps {
  workplace: PhysicalWorkplace | PhysicalWorkplaceSummary;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
  showEquipment?: boolean;
}

export default function PhysicalWorkplaceCard({
  workplace,
  selected = false,
  onClick,
  compact = false,
  showEquipment = true,
}: PhysicalWorkplaceCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isOccupied = Boolean(workplace.currentOccupantName);

  // Check if workplace has full details (PhysicalWorkplace vs PhysicalWorkplaceSummary)
  const hasFullDetails = 'monitorCount' in workplace;
  const fullWorkplace = hasFullDetails ? (workplace as PhysicalWorkplace) : null;

  // Calculate equipment completion
  const hasAllEquipment = fullWorkplace
    ? (fullWorkplace.dockingStationAssetId !== null || !fullWorkplace.hasDockingStation) &&
      (fullWorkplace.monitor1AssetId !== null || fullWorkplace.monitorCount < 1) &&
      (fullWorkplace.monitor2AssetId !== null || fullWorkplace.monitorCount < 2)
    : true;

  return (
    <Box
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        p: compact ? 2 : 2.5,
        borderRadius: 3,
        bgcolor: isDark ? '#1e2328' : '#e8eef3',
        border: selected ? '2px solid #FF7700' : '2px solid transparent',
        boxShadow: () => {
          if (selected) {
            return isDark
              ? '0 0 20px rgba(255, 119, 0, 0.35), 6px 6px 12px #161a1d, -6px -6px 12px #262c33'
              : '0 0 20px rgba(255, 119, 0, 0.25), 6px 6px 12px #c5cad0, -6px -6px 12px #ffffff';
          }
          if (isOccupied && hasAllEquipment) {
            return isDark
              ? '0 0 15px rgba(22, 163, 74, 0.2), 5px 5px 10px #161a1d, -5px -5px 10px #262c33'
              : '0 0 15px rgba(22, 163, 74, 0.15), 5px 5px 10px #c5cad0, -5px -5px 10px #ffffff';
          }
          if (isOccupied) {
            return isDark
              ? '0 0 15px rgba(255, 119, 0, 0.15), 5px 5px 10px #161a1d, -5px -5px 10px #262c33'
              : '0 0 15px rgba(255, 119, 0, 0.1), 5px 5px 10px #c5cad0, -5px -5px 10px #ffffff';
          }
          return isDark
            ? '5px 5px 10px #161a1d, -5px -5px 10px #262c33'
            : '5px 5px 10px #c5cad0, -5px -5px 10px #ffffff';
        },
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: isDark
            ? '0 8px 24px rgba(0, 0, 0, 0.4), 8px 8px 16px #161a1d, -8px -8px 16px #262c33'
            : '0 8px 24px rgba(0, 0, 0, 0.1), 8px 8px 16px #c5cad0, -8px -8px 16px #ffffff',
        } : {},
      }}
    >
      {/* Occupancy Status Badge */}
      <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
        <Chip
          label={isOccupied ? 'Bezet' : 'Beschikbaar'}
          size="small"
          icon={isOccupied ? <PersonIcon sx={{ fontSize: '14px !important' }} /> : undefined}
          sx={{
            height: 22,
            fontSize: '0.65rem',
            fontWeight: 700,
            bgcolor: isOccupied
              ? (isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)')
              : (isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)'),
            color: isOccupied ? '#dc2626' : '#16a34a',
            border: `1px solid ${isOccupied ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
            '& .MuiChip-icon': {
              color: 'inherit',
              marginLeft: '6px',
            },
          }}
        />
      </Box>

      {/* Code & Name */}
      <Typography
        variant={compact ? 'subtitle1' : 'h6'}
        fontWeight={700}
        sx={{
          color: selected ? '#FF7700' : (isDark ? '#fff' : '#333'),
          mb: 0.5,
          pr: 10, // Space for badge
          transition: 'color 0.2s ease',
        }}
      >
        {workplace.code}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
          mb: compact ? 1 : 1.5,
        }}
      >
        {workplace.name}
      </Typography>

      {/* Location Info */}
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: compact ? 1 : 1.5 }}>
        <LocationOnIcon
          sx={{
            fontSize: 16,
            color: '#FF7700',
          }}
        />
        <Typography
          variant="caption"
          sx={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
        >
          {workplace.buildingName}
          {fullWorkplace?.floor && ` - ${fullWorkplace.floor}`}
          {fullWorkplace?.room && ` - ${fullWorkplace.room}`}
        </Typography>
      </Stack>

      {/* Service Name */}
      {workplace.serviceName && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mb: compact ? 1 : 1.5,
            color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
            fontStyle: 'italic',
          }}
        >
          {workplace.serviceName}
        </Typography>
      )}

      {/* Current Occupant */}
      {isOccupied && (
        <Box
          sx={{
            mb: compact ? 1.5 : 2,
            p: 1.5,
            borderRadius: 2,
            bgcolor: isDark ? '#1e2328' : '#e8eef3',
            boxShadow: isDark
              ? 'inset 2px 2px 4px #161a1d, inset -2px -2px 4px #262c33'
              : 'inset 2px 2px 4px #c5cad0, inset -2px -2px 4px #ffffff',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <PersonIcon sx={{ fontSize: 18, color: '#3B82F6' }} />
            <Box>
              <Typography variant="body2" fontWeight={600} sx={{ color: isDark ? '#fff' : '#333' }}>
                {workplace.currentOccupantName}
              </Typography>
              {fullWorkplace?.currentOccupantEmail && (
                <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}>
                  {fullWorkplace.currentOccupantEmail}
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>
      )}

      {/* Equipment Status */}
      {showEquipment && fullWorkplace && (
        <>
          {/* Divider */}
          <Box
            sx={{
              my: 1.5,
              height: 1,
              borderRadius: 0.5,
              bgcolor: isDark ? '#1e2328' : '#e8eef3',
              boxShadow: isDark
                ? 'inset 1px 1px 2px #161a1d, inset -1px -1px 2px #262c33'
                : 'inset 1px 1px 2px #c5cad0, inset -1px -1px 2px #ffffff',
            }}
          />

          {/* Equipment Chips */}
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {fullWorkplace.monitorCount > 0 && (
              <EquipmentChip
                icon={<MonitorIcon />}
                label={`${fullWorkplace.monitorCount}x`}
                present={fullWorkplace.monitor1AssetId !== null}
                tooltip={fullWorkplace.monitor1AssetCode || 'Monitor niet toegewezen'}
              />
            )}
            {fullWorkplace.hasDockingStation && (
              <EquipmentChip
                icon={<DockIcon />}
                label="Dock"
                present={fullWorkplace.dockingStationAssetId !== null}
                tooltip={fullWorkplace.dockingStationAssetCode || 'Docking niet toegewezen'}
              />
            )}
            <EquipmentChip
              icon={<KeyboardIcon />}
              label="KB"
              present={fullWorkplace.keyboardAssetId !== null}
              tooltip={fullWorkplace.keyboardAssetCode || 'Toetsenbord niet toegewezen'}
            />
            <EquipmentChip
              icon={<MouseIcon />}
              label="MS"
              present={fullWorkplace.mouseAssetId !== null}
              tooltip={fullWorkplace.mouseAssetCode || 'Muis niet toegewezen'}
            />
          </Stack>

          {/* Equipment Status Summary */}
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1.5 }}>
            {hasAllEquipment ? (
              <>
                <CheckCircleIcon sx={{ fontSize: 14, color: '#16a34a' }} />
                <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600 }}>
                  Volledig uitgerust
                </Typography>
              </>
            ) : (
              <>
                <ErrorOutlineIcon sx={{ fontSize: 14, color: '#ca8a04' }} />
                <Typography variant="caption" sx={{ color: '#ca8a04', fontWeight: 600 }}>
                  Apparatuur ontbreekt
                </Typography>
              </>
            )}
          </Stack>
        </>
      )}
    </Box>
  );
}

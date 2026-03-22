/**
 * EquipmentChip
 *
 * Compact chip component for visualizing equipment status at a workplace.
 * Shows icons for DOCK, MON×N, KEYB, MOUSE with filled/empty states.
 *
 * Design Philosophy:
 * - Teal (#00897B) for workplace-fixed equipment
 * - Filled state: Equipment assigned
 * - Empty state: Equipment slot available but unfilled
 * - Hover: Shows asset details tooltip
 * - Compact mode: 2x2 grid layout for table view
 */

import { Box, Tooltip, useTheme, alpha } from '@mui/material';
import DockIcon from '@mui/icons-material/Dock';
import MonitorIcon from '@mui/icons-material/Monitor';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import { PhysicalWorkplace } from '../../types/physicalWorkplace.types';

interface EquipmentChipProps {
  workplace: PhysicalWorkplace;
  compact?: boolean;
}

const EquipmentChip = ({ workplace, compact = false }: EquipmentChipProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Teal accent color for workplace equipment
  const tealColor = '#00897B';

  // Equipment status
  const hasDock = workplace.hasDockingStation && !!workplace.dockingStationAssetId;
  const monitorCount = [
    workplace.monitor1AssetId,
    workplace.monitor2AssetId,
    workplace.monitor3AssetId,
  ].filter(Boolean).length;
  const totalMonitorSlots = workplace.monitorCount;
  const hasKeyboard = !!workplace.keyboardAssetId;
  const hasMouse = !!workplace.mouseAssetId;

  // Compact mini-badge styling
  const badgeSx = (filled: boolean) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.3,
    px: 0.6,
    py: 0.2,
    borderRadius: 1,
    fontSize: '0.65rem',
    fontWeight: 700,
    letterSpacing: '0.02em',
    bgcolor: filled ? alpha(tealColor, isDark ? 0.25 : 0.15) : alpha(isDark ? '#fff' : '#000', 0.04),
    color: filled ? tealColor : alpha(isDark ? '#fff' : '#000', 0.35),
    border: '1px solid',
    borderColor: filled ? alpha(tealColor, 0.4) : 'transparent',
    transition: 'all 0.15s ease',
    cursor: 'default',
    whiteSpace: 'nowrap',
    '&:hover': {
      bgcolor: filled ? alpha(tealColor, isDark ? 0.35 : 0.25) : alpha(isDark ? '#fff' : '#000', 0.08),
    },
  });

  // Icon styling for mini badges
  const iconSx = {
    fontSize: 11,
  };

  // Tooltip content
  const getTooltipContent = (type: string, assetCode?: string, serialNumber?: string) => {
    if (!assetCode) return `${type}: Niet toegewezen`;
    return (
      <Box>
        <Box sx={{ fontWeight: 700, mb: 0.5 }}>{type}</Box>
        <Box sx={{ fontSize: '0.75rem' }}>Asset: {assetCode}</Box>
        {serialNumber && <Box sx={{ fontSize: '0.75rem' }}>S/N: {serialNumber}</Box>}
      </Box>
    );
  };

  // Compact mode: 2x2 grid for table view
  if (compact) {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, auto)',
          gap: 0.4,
          justifyContent: 'start',
        }}
      >
        {/* Row 1: DOCK + MON */}
        {workplace.hasDockingStation && (
          <Tooltip
            title={getTooltipContent(
              'Docking Station',
              workplace.dockingStationAssetCode,
              workplace.dockingStationSerialNumber
            )}
            placement="top"
            arrow
          >
            <Box sx={badgeSx(hasDock)}>
              <DockIcon sx={iconSx} />
              <span>DOCK</span>
            </Box>
          </Tooltip>
        )}
        {totalMonitorSlots > 0 && (
          <Tooltip
            title={
              <Box>
                <Box sx={{ fontWeight: 700, mb: 0.5 }}>Monitoren</Box>
                {workplace.monitor1AssetCode && (
                  <Box sx={{ fontSize: '0.75rem' }}>
                    M1: {workplace.monitor1AssetCode}
                  </Box>
                )}
                {workplace.monitor2AssetCode && (
                  <Box sx={{ fontSize: '0.75rem' }}>
                    M2: {workplace.monitor2AssetCode}
                  </Box>
                )}
                {workplace.monitor3AssetCode && (
                  <Box sx={{ fontSize: '0.75rem' }}>
                    M3: {workplace.monitor3AssetCode}
                  </Box>
                )}
                {monitorCount === 0 && <Box sx={{ fontSize: '0.75rem' }}>Geen monitoren toegewezen</Box>}
              </Box>
            }
            placement="top"
            arrow
          >
            <Box sx={badgeSx(monitorCount > 0)}>
              <MonitorIcon sx={iconSx} />
              <span>{monitorCount}/{totalMonitorSlots}</span>
            </Box>
          </Tooltip>
        )}

        {/* Row 2: KEYB + MOUSE */}
        <Tooltip
          title={getTooltipContent(
            'Toetsenbord',
            workplace.keyboardAssetCode,
            workplace.keyboardSerialNumber
          )}
          placement="top"
          arrow
        >
          <Box sx={badgeSx(hasKeyboard)}>
            <KeyboardIcon sx={iconSx} />
            <span>KEYB</span>
          </Box>
        </Tooltip>
        <Tooltip
          title={getTooltipContent(
            'Muis',
            workplace.mouseAssetCode,
            workplace.mouseSerialNumber
          )}
          placement="top"
          arrow
        >
          <Box sx={badgeSx(hasMouse)}>
            <MouseIcon sx={iconSx} />
            <span>MUIS</span>
          </Box>
        </Tooltip>
      </Box>
    );
  }

  // Full mode: Horizontal row with larger chips
  const fullBadgeSx = (filled: boolean) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.5,
    px: 1,
    py: 0.4,
    borderRadius: 1.5,
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.03em',
    bgcolor: filled ? tealColor : alpha(isDark ? '#fff' : '#000', 0.06),
    color: filled ? '#fff' : alpha(isDark ? '#fff' : '#000', 0.4),
    border: '1px solid',
    borderColor: filled ? alpha(tealColor, 0.6) : 'transparent',
    boxShadow: filled
      ? isDark
        ? '0 2px 4px rgba(0, 0, 0, 0.3)'
        : '0 2px 4px rgba(0, 137, 123, 0.2)'
      : 'none',
    transition: 'all 0.2s ease',
    cursor: 'default',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: filled
        ? '0 4px 8px rgba(0, 137, 123, 0.3)'
        : 'none',
    },
  });

  const fullIconSx = {
    fontSize: 14,
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
      {/* Docking Station */}
      {workplace.hasDockingStation && (
        <Tooltip
          title={getTooltipContent(
            'Docking Station',
            workplace.dockingStationAssetCode,
            workplace.dockingStationSerialNumber
          )}
          placement="top"
          arrow
        >
          <Box sx={fullBadgeSx(hasDock)}>
            <DockIcon sx={fullIconSx} />
            <span>DOCK</span>
          </Box>
        </Tooltip>
      )}

      {/* Monitors */}
      {totalMonitorSlots > 0 && (
        <Tooltip
          title={
            <Box>
              <Box sx={{ fontWeight: 700, mb: 0.5 }}>Monitoren</Box>
              {workplace.monitor1AssetCode && (
                <Box sx={{ fontSize: '0.75rem' }}>
                  M1: {workplace.monitor1AssetCode}
                  {workplace.monitor1SerialNumber && ` (${workplace.monitor1SerialNumber})`}
                </Box>
              )}
              {workplace.monitor2AssetCode && (
                <Box sx={{ fontSize: '0.75rem' }}>
                  M2: {workplace.monitor2AssetCode}
                  {workplace.monitor2SerialNumber && ` (${workplace.monitor2SerialNumber})`}
                </Box>
              )}
              {workplace.monitor3AssetCode && (
                <Box sx={{ fontSize: '0.75rem' }}>
                  M3: {workplace.monitor3AssetCode}
                  {workplace.monitor3SerialNumber && ` (${workplace.monitor3SerialNumber})`}
                </Box>
              )}
              {monitorCount === 0 && <Box sx={{ fontSize: '0.75rem' }}>Geen monitoren toegewezen</Box>}
            </Box>
          }
          placement="top"
          arrow
        >
          <Box sx={fullBadgeSx(monitorCount > 0)}>
            <MonitorIcon sx={fullIconSx} />
            <span>MON×{monitorCount}/{totalMonitorSlots}</span>
          </Box>
        </Tooltip>
      )}

      {/* Keyboard */}
      <Tooltip
        title={getTooltipContent(
          'Toetsenbord',
          workplace.keyboardAssetCode,
          workplace.keyboardSerialNumber
        )}
        placement="top"
        arrow
      >
        <Box sx={fullBadgeSx(hasKeyboard)}>
          <KeyboardIcon sx={fullIconSx} />
          <span>KEYB</span>
        </Box>
      </Tooltip>

      {/* Mouse */}
      <Tooltip
        title={getTooltipContent(
          'Muis',
          workplace.mouseAssetCode,
          workplace.mouseSerialNumber
        )}
        placement="top"
        arrow
      >
        <Box sx={fullBadgeSx(hasMouse)}>
          <MouseIcon sx={fullIconSx} />
          <span>MOUSE</span>
        </Box>
      </Tooltip>
    </Box>
  );
};

export default EquipmentChip;

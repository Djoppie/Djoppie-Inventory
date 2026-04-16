/**
 * WorkplaceOccupantChip
 *
 * Chip component for displaying workplace occupant status.
 * Uses EMPLOYEE_COLOR (purple) for person/occupant to distinguish from workplace equipment.
 *
 * Design Philosophy:
 * - Purple color scheme for person-related information
 * - Neumorph styling for depth
 * - Shows name and email on hover
 */

import { Chip, Tooltip, Box, useTheme, alpha } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import DeskIcon from '@mui/icons-material/Desk';
import ComputerIcon from '@mui/icons-material/Computer';
import LaptopIcon from '@mui/icons-material/Laptop';
import { PhysicalWorkplace, WorkplaceType } from '../../types/physicalWorkplace.types';
import { EMPLOYEE_COLOR } from '../../constants/filterColors';

interface WorkplaceOccupantChipProps {
  workplace: PhysicalWorkplace;
  showVacant?: boolean;
}

const WorkplaceOccupantChip = ({ workplace, showVacant = true }: WorkplaceOccupantChipProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Check both EntraId and Name - some workplaces may have name but not EntraId (legacy data)
  const isOccupied = !!workplace.currentOccupantEntraId || !!workplace.currentOccupantName;

  // Purple accent for person (using centralized EMPLOYEE_COLOR)
  const purpleColor = EMPLOYEE_COLOR;
  const purpleLight = alpha(EMPLOYEE_COLOR, 0.7);

  if (!isOccupied && !showVacant) {
    return null;
  }

  // For Desktop type workplaces without occupant, show "Desktop" or "Publieke PC"
  if (!isOccupied) {
    const isDesktop = workplace.type === WorkplaceType.Desktop;
    const desktopColor = '#607D8B'; // Blue-grey for desktop

    if (isDesktop) {
      return (
        <Chip
          icon={<ComputerIcon />}
          label="Desktop PC"
          size="small"
          sx={{
            bgcolor: isDark ? alpha(desktopColor, 0.2) : alpha(desktopColor, 0.1),
            color: isDark ? alpha(desktopColor, 0.9) : desktopColor,
            fontWeight: 600,
            border: '1px solid',
            borderColor: alpha(desktopColor, 0.3),
            '& .MuiChip-icon': {
              color: isDark ? alpha(desktopColor, 0.8) : desktopColor,
            },
          }}
        />
      );
    }

    return (
      <Chip
        icon={<DeskIcon />}
        label="Vacant"
        size="small"
        variant="outlined"
        sx={{
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
          color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
          fontWeight: 600,
          '& .MuiChip-icon': {
            color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
          },
        }}
      />
    );
  }

  const tooltipContent = (
    <Box>
      <Box sx={{ fontWeight: 700, mb: 0.5 }}>{workplace.currentOccupantName}</Box>
      {workplace.currentOccupantEmail && (
        <Box sx={{ fontSize: '0.75rem', opacity: 0.9 }}>{workplace.currentOccupantEmail}</Box>
      )}
      {workplace.occupantDeviceSerial && (
        <Box sx={{ fontSize: '0.75rem', mt: 0.5, opacity: 0.9 }}>
          {workplace.occupantDeviceBrand} {workplace.occupantDeviceModel}
          <Box component="span" sx={{ ml: 0.5, fontFamily: 'monospace' }}>
            ({workplace.occupantDeviceSerial})
          </Box>
        </Box>
      )}
      {workplace.occupiedSince && (
        <Box sx={{ fontSize: '0.7rem', mt: 0.5, opacity: 0.8 }}>
          Sinds: {new Date(workplace.occupiedSince).toLocaleDateString('nl-NL')}
        </Box>
      )}
    </Box>
  );

  // Custom label with name and device info (laptop prominently displayed)
  const chipLabel = (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 0.25 }}>
      <Box sx={{ lineHeight: 1.2 }}>{workplace.currentOccupantName}</Box>
      {(workplace.occupantDeviceSerial || workplace.occupantDeviceAssetCode) && (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          fontSize: '0.65rem',
          opacity: 0.9,
          lineHeight: 1.2,
          mt: 0.25,
        }}>
          <LaptopIcon sx={{ fontSize: '0.75rem' }} />
          <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
            {workplace.occupantDeviceAssetCode || workplace.occupantDeviceSerial}
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} placement="top" arrow>
      <Chip
        icon={<PersonIcon />}
        label={chipLabel}
        size="small"
        sx={{
          bgcolor: isDark ? purpleColor : alpha(EMPLOYEE_COLOR, 0.12),
          color: isDark ? '#fff' : purpleColor,
          fontWeight: 700,
          letterSpacing: '0.02em',
          border: '1px solid',
          borderColor: isDark ? purpleLight : purpleColor,
          height: (workplace.occupantDeviceSerial || workplace.occupantDeviceAssetCode) ? 'auto' : undefined,
          '& .MuiChip-label': {
            py: (workplace.occupantDeviceSerial || workplace.occupantDeviceAssetCode) ? 0.5 : undefined,
          },
          boxShadow: isDark
            ? '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            : `0 1px 3px ${alpha(EMPLOYEE_COLOR, 0.15)}`,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '& .MuiChip-icon': {
            color: isDark ? '#fff' : purpleColor,
          },
          '&:hover': {
            transform: 'translateY(-1px)',
            bgcolor: isDark ? purpleColor : alpha(EMPLOYEE_COLOR, 0.18),
            boxShadow: isDark
              ? `0 4px 8px ${alpha(EMPLOYEE_COLOR, 0.4)}, inset 0 1px 0 rgba(255, 255, 255, 0.15)`
              : `0 2px 6px ${alpha(EMPLOYEE_COLOR, 0.25)}`,
          },
        }}
      />
    </Tooltip>
  );
};

export default WorkplaceOccupantChip;

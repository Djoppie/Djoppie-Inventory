import {
  Box,
  Typography,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Tooltip,
  IconButton,
  alpha,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import LaptopIcon from '@mui/icons-material/Laptop';
import DockIcon from '@mui/icons-material/Dock';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import EditIcon from '@mui/icons-material/Edit';

import { getNeumorph, getNeumorphColors } from '../../../utils/neumorphicStyles';
import {
  getWorkplaceStatusColor,
  getWorkplaceStatusLabel,
} from '../../../hooks/reports';
import type { RolloutMovementType, RolloutEquipmentRow } from '../../../types/report.types';
import type { GroupedChecklist, RolloutWorkplaceChecklistWithDate } from './groupWorkplacesBy';

const ROLLOUT_COLOR = '#FF7700';
const SUCCESS_COLOR = '#4CAF50';
const WARNING_COLOR = '#FF9800';
const INFO_COLOR = '#2196F3';

// ===== Type color helper =====

const typeColor = (t: RolloutMovementType): string => ({
  Onboarding: '#4CAF50',
  Offboarding: '#F44336',
  Swap: '#FF7700',
  Other: '#9E9E9E',
}[t]);

// ===== EquipmentRowChip (private helper) =====

interface EquipmentRowChipProps {
  row: RolloutEquipmentRow;
  isDark: boolean;
  onEditSerialNumber?: (assignmentId: number, currentSerial: string | undefined) => void;
}

const EquipmentRowChip: React.FC<EquipmentRowChipProps> = ({ row, isDark, onEditSerialNumber }) => {
  const isLaptop = row.equipmentType.includes('Desktop') || row.equipmentType.includes('Laptop');
  const icon = isLaptop ? <LaptopIcon sx={{ fontSize: 14 }} /> : <DockIcon sx={{ fontSize: 14 }} />;

  const bgColor = row.isMissingSerialNumber
    ? alpha('#FFC107', isDark ? 0.3 : 0.2)
    : alpha(SUCCESS_COLOR, isDark ? 0.15 : 0.1);

  const borderColor = row.isMissingSerialNumber
    ? '#FFC107'
    : SUCCESS_COLOR;

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEditSerialNumber) {
      onEditSerialNumber(row.assignmentId, row.newSerialNumber);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        p: 0.5,
        px: 1,
        borderRadius: 1,
        bgcolor: bgColor,
        border: '1px solid',
        borderColor: alpha(borderColor, 0.5),
        fontSize: '0.7rem',
      }}
    >
      {icon}
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          fontFamily: 'monospace',
          color: row.isMissingSerialNumber ? WARNING_COLOR : 'text.primary',
        }}
      >
        {row.newSerialNumber || '???'}
      </Typography>
      {row.isMissingSerialNumber && onEditSerialNumber && (
        <Tooltip title="Serienummer invullen">
          <IconButton
            size="small"
            onClick={handleEditClick}
            sx={{
              p: 0.25,
              ml: 0.25,
              color: WARNING_COLOR,
              '&:hover': { bgcolor: alpha(WARNING_COLOR, 0.1) },
            }}
          >
            <EditIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      )}
      {row.oldSerialNumber && (
        <>
          <SwapHorizIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
            {row.oldSerialNumber}
          </Typography>
        </>
      )}
      {row.qrCodeApplied !== null && row.qrCodeApplied !== undefined && (
        <Tooltip title={row.qrCodeApplied ? 'QR toegepast' : 'QR niet toegepast'}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {row.qrCodeApplied ? (
              <CheckIcon sx={{ fontSize: 14, color: SUCCESS_COLOR }} />
            ) : (
              <CloseIcon sx={{ fontSize: 14, color: '#F44336' }} />
            )}
          </Box>
        </Tooltip>
      )}
      {row.isSharedDevice && (
        <Chip
          label="Gedeeld"
          size="small"
          sx={{
            height: 16,
            fontSize: '0.6rem',
            bgcolor: alpha(INFO_COLOR, 0.15),
            color: INFO_COLOR,
            ml: 0.5,
          }}
        />
      )}
    </Box>
  );
};

// ===== WorkplaceRow (private helper) =====

interface WorkplaceRowProps {
  workplace: RolloutWorkplaceChecklistWithDate;
  isDark: boolean;
  showDateColumn?: boolean;
  onEditSerialNumber?: (assignmentId: number, currentSerial: string | undefined) => void;
}

const WorkplaceRow: React.FC<WorkplaceRowProps> = ({ workplace, isDark, showDateColumn, onEditSerialNumber }) => {
  const statusColor = getWorkplaceStatusColor(workplace.status);
  const color = typeColor(workplace.movementType);

  return (
    <TableRow
      sx={{
        bgcolor: workplace.hasMissingSerialNumbers ? alpha('#FFC107', isDark ? 0.15 : 0.1) : 'inherit',
        '&:hover': {
          bgcolor: workplace.hasMissingSerialNumbers
            ? alpha('#FFC107', isDark ? 0.2 : 0.15)
            : alpha('#000', 0.02),
        },
      }}
    >
      {showDateColumn && (
        <TableCell sx={{ fontSize: '0.75rem' }}>
          {workplace._dayDate
            ? new Date(workplace._dayDate).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit' })
            : '-'}
        </TableCell>
      )}
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
          {workplace.workplaceName}
        </Typography>
        {workplace.location && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {workplace.location}
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
              {workplace.userDisplayName || '-'}
            </Typography>
            {workplace.userJobTitle && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                {workplace.userJobTitle}
              </Typography>
            )}
          </Box>
        </Box>
      </TableCell>
      <TableCell sx={{ fontSize: '0.8rem' }}>{workplace.serviceName}</TableCell>
      <TableCell sx={{ fontSize: '0.8rem' }}>{workplace.buildingName}</TableCell>
      <TableCell>
        <Chip
          size="small"
          label={workplace.movementType}
          sx={{
            height: 20,
            fontSize: '0.65rem',
            fontWeight: 600,
            bgcolor: alpha(color, 0.12),
            color,
          }}
        />
      </TableCell>
      <TableCell>
        <Stack spacing={0.5}>
          {workplace.equipmentRows.map((row, idx) => (
            <EquipmentRowChip key={idx} row={row} isDark={isDark} onEditSerialNumber={onEditSerialNumber} />
          ))}
        </Stack>
      </TableCell>
      <TableCell>
        <Chip
          label={getWorkplaceStatusLabel(workplace.status)}
          size="small"
          sx={{
            height: 24,
            fontSize: '0.7rem',
            fontWeight: 600,
            bgcolor: alpha(statusColor, isDark ? 0.2 : 0.12),
            color: statusColor,
          }}
        />
      </TableCell>
    </TableRow>
  );
};

// ===== RolloutGroupCard =====

interface RolloutGroupCardProps {
  group: GroupedChecklist;
  isExpanded: boolean;
  onToggle: () => void;
  showDateColumn?: boolean;
  isDark: boolean;
  neumorphColors: ReturnType<typeof getNeumorphColors>;
  onEditSerialNumber?: (assignmentId: number, currentSerial: string | undefined) => void;
}

const RolloutGroupCard: React.FC<RolloutGroupCardProps> = ({
  group,
  isExpanded,
  onToggle,
  showDateColumn = false,
  isDark,
  neumorphColors,
  onEditSerialNumber,
}) => {
  const progress = group.completionPercentage;

  return (
    <Accordion
      expanded={isExpanded}
      onChange={onToggle}
      disableGutters
      elevation={0}
      sx={{
        bgcolor: neumorphColors.bgSurface,
        boxShadow: getNeumorph(isDark, 'soft'),
        borderRadius: '12px !important',
        '&:before': { display: 'none' },
        overflow: 'hidden',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          borderLeft: `4px solid ${progress === 100 ? SUCCESS_COLOR : ROLLOUT_COLOR}`,
          '& .MuiAccordionSummary-content': { my: 1.5 },
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', pr: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: alpha(progress === 100 ? SUCCESS_COLOR : ROLLOUT_COLOR, isDark ? 0.15 : 0.1),
            }}
          >
            <CalendarTodayIcon sx={{ fontSize: 22, color: progress === 100 ? SUCCESS_COLOR : ROLLOUT_COLOR }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {group.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {group.subtitle}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              width: 120,
              height: 8,
              borderRadius: 4,
              bgcolor: alpha(progress === 100 ? SUCCESS_COLOR : ROLLOUT_COLOR, 0.15),
              '& .MuiLinearProgress-bar': {
                bgcolor: progress === 100 ? SUCCESS_COLOR : ROLLOUT_COLOR,
                borderRadius: 4,
              },
            }}
          />
          <Typography variant="body2" sx={{ fontWeight: 700, color: progress === 100 ? SUCCESS_COLOR : ROLLOUT_COLOR, minWidth: 40 }}>
            {progress}%
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        {group.workplaces.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">Geen werkplekken voor deze groep</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(ROLLOUT_COLOR, isDark ? 0.05 : 0.03) }}>
                  {showDateColumn && (
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', width: 100 }}>Datum</TableCell>
                  )}
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', width: 180 }}>Werkplek</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', width: 180 }}>Medewerker</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', width: 120 }}>Dienst</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', width: 120 }}>Gebouw</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', width: 100 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>SWAP Details</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', width: 100 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {group.workplaces.map((workplace) => (
                  <WorkplaceRow
                    key={workplace.workplaceId}
                    workplace={workplace}
                    isDark={isDark}
                    showDateColumn={showDateColumn}
                    onEditSerialNumber={onEditSerialNumber}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default RolloutGroupCard;

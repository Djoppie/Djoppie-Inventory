/**
 * WorkplaceStatusChip - Unified status chip for rollout workplace status
 *
 * Used across planning, execution, and reporting pages for consistent
 * workplace status display in the Djoppie neumorphic style.
 */

import { Chip, type ChipProps } from '@mui/material';
import PendingIcon from '@mui/icons-material/HourglassEmpty';
import ReadyIcon from '@mui/icons-material/PlayArrow';
import InProgressIcon from '@mui/icons-material/PlayCircleFilled';
import CompletedIcon from '@mui/icons-material/CheckCircle';
import SkippedIcon from '@mui/icons-material/SkipNext';
import FailedIcon from '@mui/icons-material/Error';

export type WorkplaceStatus = 'Pending' | 'Ready' | 'InProgress' | 'Completed' | 'Skipped' | 'Failed';

interface StatusConfig {
  label: string;
  color: string;
  bgcolor: string;
  borderColor: string;
  icon: React.ReactElement;
}

const STATUS_CONFIG: Record<WorkplaceStatus, StatusConfig> = {
  Pending: {
    label: 'Wachtend',
    color: '#6B7280',
    bgcolor: 'rgba(107, 114, 128, 0.1)',
    borderColor: 'rgba(107, 114, 128, 0.4)',
    icon: <PendingIcon sx={{ fontSize: '14px !important' }} />,
  },
  Ready: {
    label: 'Gereed',
    color: '#22c55e',
    bgcolor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
    icon: <ReadyIcon sx={{ fontSize: '14px !important' }} />,
  },
  InProgress: {
    label: 'Bezig',
    color: '#f59e0b',
    bgcolor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.5)',
    icon: <InProgressIcon sx={{ fontSize: '14px !important' }} />,
  },
  Completed: {
    label: 'Voltooid',
    color: '#16a34a',
    bgcolor: 'rgba(22, 163, 74, 0.1)',
    borderColor: 'rgba(22, 163, 74, 0.5)',
    icon: <CompletedIcon sx={{ fontSize: '14px !important' }} />,
  },
  Skipped: {
    label: 'Overgeslagen',
    color: '#9CA3AF',
    bgcolor: 'rgba(156, 163, 175, 0.1)',
    borderColor: 'rgba(156, 163, 175, 0.4)',
    icon: <SkippedIcon sx={{ fontSize: '14px !important' }} />,
  },
  Failed: {
    label: 'Mislukt',
    color: '#ef4444',
    bgcolor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
    icon: <FailedIcon sx={{ fontSize: '14px !important' }} />,
  },
};

interface WorkplaceStatusChipProps {
  status: string;
  size?: 'small' | 'medium';
  showIcon?: boolean;
  component?: ChipProps['component'];
}

const WorkplaceStatusChip = ({
  status,
  size = 'small',
  showIcon = true,
  component = 'span',
}: WorkplaceStatusChipProps) => {
  const config = STATUS_CONFIG[status as WorkplaceStatus] || STATUS_CONFIG.Pending;

  return (
    <Chip
      label={config.label}
      size={size}
      icon={showIcon ? config.icon : undefined}
      component={component}
      sx={{
        fontWeight: 600,
        fontSize: size === 'small' ? '0.7rem' : '0.8rem',
        letterSpacing: '0.02em',
        color: config.color,
        bgcolor: config.bgcolor,
        border: `1px solid ${config.borderColor}`,
        '& .MuiChip-icon': {
          color: config.color,
        },
      }}
    />
  );
};

export default WorkplaceStatusChip;

/** Get the status color for a workplace status (for progress bars, borders, etc.) */
// eslint-disable-next-line react-refresh/only-export-components
export const getWorkplaceStatusColor = (status: string): string => {
  return STATUS_CONFIG[status as WorkplaceStatus]?.color || STATUS_CONFIG.Pending.color;
};

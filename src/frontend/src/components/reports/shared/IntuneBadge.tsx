import { Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HelpIcon from '@mui/icons-material/Help';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import ScheduleIcon from '@mui/icons-material/Schedule';

export type IntuneComplianceState =
  | 'compliant'
  | 'noncompliant'
  | 'error'
  | 'unenrolled'
  | 'stale'
  | 'unknown';

interface IntuneBadgeProps {
  state: IntuneComplianceState | string | null | undefined;
  lastSync?: string | null;
  size?: 'small' | 'medium';
}

const staleThresholdDays = 30;

const deriveState = (state: string | null | undefined, lastSync?: string | null): IntuneComplianceState => {
  if (!state) return 'unknown';
  const s = state.toLowerCase();
  if (s === 'compliant') {
    if (lastSync) {
      const syncDate = new Date(lastSync);
      const ageDays = (Date.now() - syncDate.getTime()) / 86400000;
      if (ageDays > staleThresholdDays) return 'stale';
    }
    return 'compliant';
  }
  if (s === 'noncompliant') return 'noncompliant';
  if (s === 'error') return 'error';
  if (s === 'unenrolled' || s === '') return 'unenrolled';
  return 'unknown';
};

const config: Record<IntuneComplianceState, { label: string; color: string; Icon: typeof CheckCircleIcon }> = {
  compliant:    { label: 'Compliant',     color: '#4CAF50', Icon: CheckCircleIcon },
  noncompliant: { label: 'Non-compliant', color: '#F44336', Icon: ErrorIcon },
  error:        { label: 'Error',         color: '#FF9800', Icon: ErrorIcon },
  unenrolled:   { label: 'Niet enrolled', color: '#9E9E9E', Icon: CloudOffIcon },
  stale:        { label: 'Stale',         color: '#FFC107', Icon: ScheduleIcon },
  unknown:      { label: 'Onbekend',      color: '#757575', Icon: HelpIcon },
};

/** Intune compliance indicator rendered as an icon + coloured label (no chip background). */
const IntuneBadge = ({ state, lastSync, size = 'small' }: IntuneBadgeProps) => {
  const derived = deriveState(state, lastSync);
  const { label, color, Icon } = config[derived];
  const iconSize = size === 'small' ? 14 : 16;
  const fontSize = size === 'small' ? '0.72rem' : '0.8rem';

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color, fontWeight: 600, fontSize }}>
      <Icon sx={{ fontSize: iconSize }} />
      {label}
    </Box>
  );
};

export default IntuneBadge;

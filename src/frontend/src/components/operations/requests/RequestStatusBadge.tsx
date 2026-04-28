import { Chip, useTheme } from '@mui/material';
import { alpha } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { AssetRequestStatus } from '../../../types/assetRequest.types';

// Semantic color map — use brand-consistent hex values instead of MUI palette
// names so the neumorphic chip rendering is explicit and predictable.
const BADGE_COLORS: Record<AssetRequestStatus, { bg: string; fg: string }> = {
  Pending:    { bg: '#78909C', fg: '#fff' }, // Blue-grey — neutral/awaiting
  Approved:   { bg: '#039BE5', fg: '#fff' }, // Light blue — acknowledged
  InProgress: { bg: '#FF9800', fg: '#fff' }, // Orange — active work
  Completed:  { bg: '#43A047', fg: '#fff' }, // Green — done
  Cancelled:  { bg: '#757575', fg: '#fff' }, // Grey — terminated
  Rejected:   { bg: '#E53935', fg: '#fff' }, // Red — denied
};

interface Props {
  status: AssetRequestStatus;
  size?: 'small' | 'medium';
}

export function RequestStatusBadge({ status, size = 'small' }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bg, fg } = BADGE_COLORS[status];

  const isNeutral = status === 'Pending' || status === 'Cancelled';

  return (
    <Chip
      size={size}
      label={t(`requests.status.${status}`)}
      sx={{
        fontWeight: 700,
        letterSpacing: '0.02em',
        fontSize: size === 'small' ? '0.68rem' : '0.75rem',
        height: size === 'small' ? 22 : 28,
        // Neumorphic chip: tinted background with alpha, accent text for neutral
        // states; filled solid for active/terminal states.
        bgcolor: isNeutral
          ? alpha(bg, isDark ? 0.18 : 0.12)
          : alpha(bg, isDark ? 0.85 : 1),
        color: isNeutral ? bg : fg,
        border: `1px solid ${alpha(bg, isNeutral ? (isDark ? 0.3 : 0.25) : 0)}`,
        boxShadow: isNeutral
          ? 'none'
          : `0 2px 6px ${alpha(bg, 0.35)}`,
        '& .MuiChip-label': {
          px: 1.25,
        },
        transition: 'all 0.15s ease',
      }}
    />
  );
}

import { Chip, useTheme, alpha } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { AssetRequestLineStatus } from '../../../types/assetRequest.types';

const BADGE_COLORS: Record<AssetRequestLineStatus, { bg: string; fg: string }> = {
  Pending:   { bg: '#78909C', fg: '#fff' }, // Blue-grey — awaiting
  Reserved:  { bg: '#FF9800', fg: '#fff' }, // Orange — held but not installed
  Completed: { bg: '#43A047', fg: '#fff' }, // Green — installed/done
  Skipped:   { bg: '#9E9E9E', fg: '#fff' }, // Grey — explicitly skipped
};

interface Props {
  status: AssetRequestLineStatus;
}

export function LineStatusBadge({ status }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bg, fg } = BADGE_COLORS[status];

  const isNeutral = status === 'Pending' || status === 'Skipped';

  return (
    <Chip
      size="small"
      label={t(`requests.lineStatus.${status}`)}
      sx={{
        fontWeight: 700,
        letterSpacing: '0.02em',
        fontSize: '0.65rem',
        height: 20,
        bgcolor: isNeutral
          ? alpha(bg, isDark ? 0.18 : 0.12)
          : alpha(bg, isDark ? 0.85 : 1),
        color: isNeutral ? bg : fg,
        border: `1px solid ${alpha(bg, isNeutral ? (isDark ? 0.3 : 0.25) : 0)}`,
        boxShadow: isNeutral
          ? 'none'
          : `0 2px 4px ${alpha(bg, 0.3)}`,
        '& .MuiChip-label': {
          px: 1,
        },
        transition: 'all 0.15s ease',
      }}
    />
  );
}

import { Box, Typography, IconButton, Chip, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { getStatusColor } from '../../../api/rollout.api';
import type { RolloutSession, RolloutDay, RolloutSessionStatus } from '../../../types/rollout';

/**
 * Convert status to translation key (handles camelCase properly)
 */
const getStatusTranslationKey = (status: string): string => {
  const statusMap: Record<string, string> = {
    'Planning': 'planning',
    'Ready': 'ready',
    'InProgress': 'inProgress',
    'Completed': 'completed',
    'Cancelled': 'cancelled',
  };
  return statusMap[status] || status.toLowerCase();
};

interface SessionHeaderProps {
  isEditMode: boolean;
  session: RolloutSession | undefined;
  days: RolloutDay[] | undefined;
  isPending: boolean;
  onBack: () => void;
  onSetStatus: (status: RolloutSessionStatus) => void;
}

export default function SessionHeader({
  isEditMode,
  session,
  days,
  isPending,
  onBack,
  onSetStatus,
}: SessionHeaderProps) {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
      <IconButton onClick={onBack} sx={{ mr: 2 }}>
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
        {isEditMode ? 'Rollout Bewerken' : 'Nieuwe Rollout'}
      </Typography>
      {isEditMode && session && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
          <Chip
            label={t(`rollout.status.${getStatusTranslationKey(session.status)}`)}
            color={getStatusColor(session.status)}
            sx={{ color: 'text.primary' }}
          />
          {session.status === 'Planning' && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<CheckCircleOutlineIcon />}
              onClick={() => onSetStatus('Ready')}
              disabled={isPending || !days || days.length === 0}
              sx={{
                borderColor: '#16a34a',
                color: '#16a34a',
                '&:hover': { borderColor: '#15803d', bgcolor: 'rgba(22, 163, 74, 0.08)' },
              }}
            >
              Markeer als Gereed
            </Button>
          )}
          {(session.status === 'Ready' || session.status === 'Planning') && (
            <Button
              variant="contained"
              size="small"
              startIcon={<PlayArrowIcon />}
              onClick={() => onSetStatus('InProgress')}
              disabled={isPending || !days || days.length === 0}
              sx={{
                bgcolor: '#FF7700',
                '&:hover': { bgcolor: '#e66a00' },
              }}
            >
              Uitvoeren
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}

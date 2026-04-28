import { useState } from 'react';
import { Button, Stack, Typography, alpha, useTheme } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import CancelIcon from '@mui/icons-material/Cancel';
import { useTranslation } from 'react-i18next';
import type { AssetRequestDetailDto } from '../../../types/assetRequest.types';
import NeomorphConfirmDialog from '../../workplaces/NeomorphConfirmDialog';

type TransitionTarget = 'Approved' | 'InProgress' | 'Completed' | 'Cancelled';

interface Props {
  request: AssetRequestDetailDto;
  onTransition: (target: TransitionTarget) => Promise<void>;
  busy?: boolean;
}

const ACTION_ICONS: Record<TransitionTarget, typeof CheckCircleOutlineIcon> = {
  Approved: ThumbUpAltIcon,
  InProgress: PlayArrowIcon,
  Completed: CheckCircleOutlineIcon,
  Cancelled: CancelIcon,
};

export function RequestStatusTransition({ request, onTransition, busy }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [pending, setPending] = useState<TransitionTarget | null>(null);
  const [executing, setExecuting] = useState(false);

  const allowed: TransitionTarget[] = (() => {
    switch (request.status) {
      case 'Pending':
        return ['Approved', 'InProgress', 'Cancelled'];
      case 'Approved':
        return ['InProgress', 'Cancelled'];
      case 'InProgress':
        return ['Completed', 'Cancelled'];
      default:
        return [];
    }
  })();

  const buttonLabel: Record<TransitionTarget, string> = {
    Approved: 'requests.actions.approve',
    InProgress: 'requests.actions.start',
    Completed: 'requests.actions.complete',
    Cancelled: 'requests.actions.cancel',
  };

  const confirmBody: Record<TransitionTarget, string> = {
    Approved: 'requests.actions.approve',
    InProgress: 'requests.actions.start',
    Completed:
      request.requestType === 'onboarding'
        ? 'requests.confirm.completeOnboarding'
        : 'requests.confirm.completeOffboarding',
    Cancelled: 'requests.confirm.cancel',
  };

  // Accent for the primary forward action (orange per Djoppie brand)
  const primaryAccent = '#FF7700';
  // Destructive
  const cancelAccent = theme.palette.error.main;
  // Secondary forward steps
  const secondaryAccent = '#1976D2';

  if (allowed.length === 0) return null;

  return (
    <>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {allowed.map((tgt) => {
          const Icon = ACTION_ICONS[tgt];
          const isCancel = tgt === 'Cancelled';
          const isForwardPrimary = tgt === 'Completed';
          const color = isCancel ? cancelAccent : isForwardPrimary ? primaryAccent : secondaryAccent;

          return (
            <Button
              key={tgt}
              size="small"
              startIcon={<Icon sx={{ fontSize: 16 }} />}
              disabled={busy || executing}
              onClick={() => setPending(tgt)}
              variant={isForwardPrimary ? 'contained' : 'outlined'}
              sx={{
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 1.5,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                ...(isForwardPrimary
                  ? {
                      bgcolor: color,
                      color: '#fff',
                      boxShadow: `0 3px 10px ${alpha(color, 0.35)}`,
                      border: 'none',
                      '&:hover': {
                        bgcolor: alpha(color, 0.9),
                        boxShadow: `0 5px 16px ${alpha(color, 0.5)}`,
                        transform: 'translateY(-1px)',
                      },
                      '&:active': {
                        transform: 'translateY(0)',
                        boxShadow: `0 2px 6px ${alpha(color, 0.35)}`,
                      },
                    }
                  : {
                      bgcolor: alpha(color, isDark ? 0.12 : 0.07),
                      color: color,
                      border: `1px solid ${alpha(color, isDark ? 0.35 : 0.25)}`,
                      '&:hover': {
                        bgcolor: alpha(color, isDark ? 0.2 : 0.12),
                        borderColor: alpha(color, 0.6),
                        transform: 'translateY(-1px)',
                        boxShadow: `0 3px 10px ${alpha(color, 0.2)}`,
                      },
                      '&:active': {
                        transform: 'translateY(0)',
                      },
                    }),
              }}
            >
              {t(buttonLabel[tgt])}
            </Button>
          );
        })}
      </Stack>

      {pending && (
        <NeomorphConfirmDialog
          open={pending !== null}
          onClose={() => setPending(null)}
          onConfirm={async () => {
            if (!pending) return;
            setExecuting(true);
            try {
              await onTransition(pending);
            } finally {
              setExecuting(false);
              setPending(null);
            }
          }}
          title={t(buttonLabel[pending])}
          message={
            pending === 'Completed' || pending === 'Cancelled' ? (
              <Typography variant="body1" color="text.primary">
                {t(confirmBody[pending])}
              </Typography>
            ) : (
              <Typography variant="body1" color="text.primary">
                {t(buttonLabel[pending])}?
              </Typography>
            )
          }
          confirmText={t(buttonLabel[pending])}
          cancelText={t('requests.actions.cancel')}
          isLoading={executing || busy}
          variant={pending === 'Cancelled' ? 'delete' : pending === 'Completed' ? 'info' : 'info'}
          icon={pending === 'Cancelled' ? 'warning' : 'warning'}
        />
      )}
    </>
  );
}

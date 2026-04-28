import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { AssetRequestDetailDto } from '../../../types/assetRequest.types';

type TransitionTarget = 'Approved' | 'InProgress' | 'Completed' | 'Cancelled';

interface Props {
  request: AssetRequestDetailDto;
  onTransition: (target: TransitionTarget) => Promise<void>;
  busy?: boolean;
}

export function RequestStatusTransition({ request, onTransition, busy }: Props) {
  const { t } = useTranslation();
  const [pending, setPending] = useState<TransitionTarget | null>(null);

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

  const confirmKey: Record<TransitionTarget, string> = {
    Approved: 'requests.actions.approve',
    InProgress: 'requests.actions.start',
    Completed:
      request.requestType === 'onboarding'
        ? 'requests.confirm.completeOnboarding'
        : 'requests.confirm.completeOffboarding',
    Cancelled: 'requests.confirm.cancel',
  };

  const buttonLabel: Record<TransitionTarget, string> = {
    Approved: 'requests.actions.approve',
    InProgress: 'requests.actions.start',
    Completed: 'requests.actions.complete',
    Cancelled: 'requests.actions.cancel',
  };

  return (
    <>
      <Stack direction="row" spacing={1}>
        {allowed.map((tgt) => (
          <Button
            key={tgt}
            variant={tgt === 'Completed' ? 'contained' : 'outlined'}
            color={tgt === 'Cancelled' ? 'error' : tgt === 'Completed' ? 'success' : 'primary'}
            disabled={busy}
            onClick={() => setPending(tgt)}
          >
            {t(buttonLabel[tgt])}
          </Button>
        ))}
      </Stack>

      <Dialog open={pending !== null} onClose={() => setPending(null)}>
        <DialogTitle>{pending && t(buttonLabel[pending])}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {pending && (pending === 'Completed' || pending === 'Cancelled')
              ? t(confirmKey[pending])
              : null}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPending(null)}>{t('requests.actions.cancel')}</Button>
          <Button
            variant="contained"
            color={pending === 'Cancelled' ? 'error' : 'primary'}
            disabled={busy}
            onClick={async () => {
              if (!pending) return;
              await onTransition(pending);
              setPending(null);
            }}
          >
            {pending && t(buttonLabel[pending])}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

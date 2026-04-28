import { Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { AssetRequestStatus } from '../../../types/assetRequest.types';

const COLOR: Record<AssetRequestStatus, 'default' | 'primary' | 'success' | 'warning' | 'info' | 'error'> = {
  Pending: 'default',
  Approved: 'info',
  InProgress: 'warning',
  Completed: 'success',
  Cancelled: 'default',
  Rejected: 'error',
};

interface Props {
  status: AssetRequestStatus;
  size?: 'small' | 'medium';
}

export function RequestStatusBadge({ status, size = 'small' }: Props) {
  const { t } = useTranslation();
  return (
    <Chip
      size={size}
      color={COLOR[status]}
      label={t(`requests.status.${status}`)}
      variant={status === 'Pending' || status === 'Cancelled' ? 'outlined' : 'filled'}
    />
  );
}

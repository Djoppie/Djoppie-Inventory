import { Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { AssetRequestLineStatus } from '../../../types/assetRequest.types';

const COLOR: Record<AssetRequestLineStatus, 'default' | 'success' | 'warning'> = {
  Pending: 'default',
  Reserved: 'warning',
  Completed: 'success',
  Skipped: 'default',
};

interface Props {
  status: AssetRequestLineStatus;
}

export function LineStatusBadge({ status }: Props) {
  const { t } = useTranslation();
  return (
    <Chip
      size="small"
      color={COLOR[status]}
      label={t(`requests.lineStatus.${status}`)}
      variant={status === 'Skipped' ? 'outlined' : 'filled'}
    />
  );
}

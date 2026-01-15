import { Chip } from '@mui/material';
import { AssetStatus } from '../../types/asset.types';

interface StatusBadgeProps {
  status: AssetStatus | string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const isActive = status === AssetStatus.Active || status === 'Active';

  return (
    <Chip
      label={status}
      color={isActive ? 'success' : 'warning'}
      size="small"
      sx={{ fontWeight: 'bold' }}
    />
  );
};

export default StatusBadge;

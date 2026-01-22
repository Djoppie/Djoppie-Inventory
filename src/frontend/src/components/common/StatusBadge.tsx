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
      size="small"
      sx={{
        fontWeight: 'bold',
        ...(isActive
          ? {
              backgroundColor: 'rgba(76, 175, 80, 0.2)',
              color: 'rgb(76, 175, 80)',
              border: '1px solid rgba(76, 175, 80, 0.4)',
              '& .MuiChip-label': {
                color: 'rgb(76, 175, 80)',
              },
              '&:hover': {
                backgroundColor: 'rgba(76, 175, 80, 0.3)',
              },
            }
          : {
              backgroundColor: 'rgba(255, 119, 0, 0.15)',
              color: 'rgb(255, 119, 0)',
              border: '1px solid rgba(255, 119, 0, 0.4)',
              '& .MuiChip-label': {
                color: 'rgb(255, 119, 0)',
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 119, 0, 0.25)',
              },
            }),
      }}
    />
  );
};

export default StatusBadge;

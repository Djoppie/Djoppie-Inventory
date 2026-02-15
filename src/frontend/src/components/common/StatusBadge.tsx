import { Chip } from '@mui/material';
import { AssetStatus } from '../../types/asset.types';

interface StatusBadgeProps {
  status: AssetStatus | string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  // Define color schemes for each status
  const getStatusStyle = () => {
    switch (status) {
      case AssetStatus.InGebruik:
      case 'InGebruik':
        // Green - In Use/Active
        return {
          backgroundColor: 'rgba(76, 175, 80, 0.15)',
          color: 'rgb(27, 94, 32)',
          border: '2px solid rgba(76, 175, 80, 0.6)',
          '& .MuiChip-label': {
            color: 'rgb(27, 94, 32)',
            fontWeight: 700,
          },
          '&:hover': {
            backgroundColor: 'rgba(76, 175, 80, 0.25)',
            boxShadow: '0 0 8px rgba(76, 175, 80, 0.3)',
          },
        };

      case AssetStatus.Stock:
      case 'Stock':
        // Blue - In Stock
        return {
          backgroundColor: 'rgba(33, 150, 243, 0.15)',
          color: 'rgb(13, 71, 161)',
          border: '2px solid rgba(33, 150, 243, 0.6)',
          '& .MuiChip-label': {
            color: 'rgb(13, 71, 161)',
            fontWeight: 700,
          },
          '&:hover': {
            backgroundColor: 'rgba(33, 150, 243, 0.25)',
            boxShadow: '0 0 8px rgba(33, 150, 243, 0.3)',
          },
        };

      case AssetStatus.Herstelling:
      case 'Herstelling':
        // Orange - Under Repair/Maintenance
        return {
          backgroundColor: 'rgba(255, 152, 0, 0.15)',
          color: 'rgb(230, 81, 0)',
          border: '2px solid rgba(255, 152, 0, 0.6)',
          '& .MuiChip-label': {
            color: 'rgb(230, 81, 0)',
            fontWeight: 700,
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 152, 0, 0.25)',
            boxShadow: '0 0 8px rgba(255, 152, 0, 0.3)',
          },
        };

      case AssetStatus.Defect:
      case 'Defect':
        // Red - Defective
        return {
          backgroundColor: 'rgba(244, 67, 54, 0.15)',
          color: 'rgb(183, 28, 28)',
          border: '2px solid rgba(244, 67, 54, 0.6)',
          '& .MuiChip-label': {
            color: 'rgb(183, 28, 28)',
            fontWeight: 700,
          },
          '&:hover': {
            backgroundColor: 'rgba(244, 67, 54, 0.25)',
            boxShadow: '0 0 8px rgba(244, 67, 54, 0.3)',
          },
        };

      case AssetStatus.UitDienst:
      case 'UitDienst':
        // Gray - Out of Service
        return {
          backgroundColor: 'rgba(158, 158, 158, 0.15)',
          color: 'rgb(66, 66, 66)',
          border: '2px solid rgba(158, 158, 158, 0.6)',
          '& .MuiChip-label': {
            color: 'rgb(66, 66, 66)',
            fontWeight: 700,
          },
          '&:hover': {
            backgroundColor: 'rgba(158, 158, 158, 0.25)',
            boxShadow: '0 0 8px rgba(158, 158, 158, 0.3)',
          },
        };

      case AssetStatus.Nieuw:
      case 'Nieuw':
        // Cyan/Teal - New (added to inventory, not yet in use)
        return {
          backgroundColor: 'rgba(0, 188, 212, 0.15)',
          color: 'rgb(0, 131, 143)',
          border: '2px solid rgba(0, 188, 212, 0.6)',
          '& .MuiChip-label': {
            color: 'rgb(0, 131, 143)',
            fontWeight: 700,
          },
          '&:hover': {
            backgroundColor: 'rgba(0, 188, 212, 0.25)',
            boxShadow: '0 0 8px rgba(0, 188, 212, 0.3)',
          },
        };

      default:
        // Default - Djoppie Orange for unknown statuses
        return {
          backgroundColor: 'rgba(255, 119, 0, 0.15)',
          color: 'rgb(204, 0, 0)',
          border: '2px solid rgba(255, 119, 0, 0.6)',
          '& .MuiChip-label': {
            color: 'rgb(204, 0, 0)',
            fontWeight: 700,
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 119, 0, 0.25)',
            boxShadow: '0 0 8px rgba(255, 119, 0, 0.3)',
          },
        };
    }
  };

  return (
    <Chip
      label={status}
      size="small"
      sx={{
        fontWeight: 'bold',
        transition: 'all 0.2s ease',
        ...getStatusStyle(),
      }}
    />
  );
};

export default StatusBadge;

import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
} from '@mui/material';
import { Asset } from '../../types/asset.types';
import StatusBadge from '../common/StatusBadge';

interface AssetCardProps {
  asset: Asset;
}

const AssetCard = ({ asset }: AssetCardProps) => {
  const navigate = useNavigate();

  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea onClick={() => navigate(`/assets/${asset.id}`)}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="h6" component="div" gutterBottom>
              {asset.assetName}
            </Typography>
            <StatusBadge status={asset.status} />
          </Box>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Code:</strong> {asset.assetCode}
          </Typography>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Category:</strong> {asset.category}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Owner:</strong>
              </Typography>
              <Typography variant="body2">{asset.owner}</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Location:</strong>
              </Typography>
              <Typography variant="body2">
                {asset.building} - {asset.spaceOrFloor}
              </Typography>
            </Box>
          </Box>

          {asset.brand && asset.model && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {asset.brand} {asset.model}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default AssetCard;

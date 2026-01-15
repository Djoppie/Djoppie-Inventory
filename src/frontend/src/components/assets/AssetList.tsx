import { Typography, Box } from '@mui/material';
import { Asset } from '../../types/asset.types';
import AssetCard from './AssetCard';

interface AssetListProps {
  assets: Asset[];
}

const AssetList = ({ assets }: AssetListProps) => {
  if (assets.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          No assets found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create your first asset to get started
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
        },
        gap: 2,
      }}
    >
      {assets.map((asset) => (
        <AssetCard key={asset.id} asset={asset} />
      ))}
    </Box>
  );
};

export default AssetList;

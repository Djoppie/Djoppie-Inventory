import { useState } from 'react';
import { Typography, Box, Pagination, Stack } from '@mui/material';
import { Asset } from '../../types/asset.types';
import AssetCard from './AssetCard';
import AssetTableView from './AssetTableView';
import { ViewMode } from '../common/ViewToggle';

interface AssetListProps {
  assets: Asset[];
  viewMode: ViewMode;
}

const ITEMS_PER_PAGE = 10;

const AssetList = ({ assets, viewMode }: AssetListProps) => {
  const [currentPage, setCurrentPage] = useState(1);

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

  // If table view, delegate to AssetTableView component
  if (viewMode === 'table') {
    return <AssetTableView assets={assets} />;
  }

  // Card view logic (existing implementation)
  const totalPages = Math.ceil(assets.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentAssets = assets.slice(startIndex, endIndex);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    // Scroll to top of asset list
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Stack spacing={3}>
      {/* Asset Grid */}
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
        {currentAssets.map((asset) => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 3,
          }}
        >
          <Stack spacing={2} alignItems="center">
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size="large"
              showFirstButton
              showLastButton
              sx={{
                '& .MuiPaginationItem-root': {
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    boxShadow: '0 0 12px rgba(255, 119, 0, 0.4)',
                  },
                },
                '& .Mui-selected': {
                  background: 'linear-gradient(135deg, var(--djoppie-orange-500), var(--djoppie-red-500))',
                  color: '#fff',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(255, 119, 0, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, var(--djoppie-orange-600), var(--djoppie-red-600))',
                  },
                },
              }}
            />
            <Typography variant="body2" color="text.secondary">
              Showing {startIndex + 1}-{Math.min(endIndex, assets.length)} of {assets.length} assets
            </Typography>
          </Stack>
        </Box>
      )}
    </Stack>
  );
};

export default AssetList;

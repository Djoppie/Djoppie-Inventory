import { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface ManualEntryProps {
  onSearch: (assetCode: string) => void;
  isLoading?: boolean;
}

const ManualEntry = ({ onSearch, isLoading }: ManualEntryProps) => {
  const [assetCode, setAssetCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (assetCode.trim()) {
      onSearch(assetCode.trim());
    }
  };

  return (
    <Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
        Enter an asset code to search for the asset manually
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          maxWidth: 500,
          mx: 'auto',
        }}
      >
        <TextField
          fullWidth
          label="Asset Code"
          value={assetCode}
          onChange={(e) => setAssetCode(e.target.value.toUpperCase())}
          placeholder="e.g., AST-001"
          autoFocus
          disabled={isLoading}
          helperText="Enter the asset code exactly as shown on the label"
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          startIcon={<SearchIcon />}
          disabled={!assetCode.trim() || isLoading}
        >
          {isLoading ? 'Searching...' : 'Search Asset'}
        </Button>
      </Box>
    </Box>
  );
};

export default ManualEntry;

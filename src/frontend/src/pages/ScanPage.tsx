import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
  Snackbar,
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import QRScanner from '../components/scanner/QRScanner';
import ManualEntry from '../components/scanner/ManualEntry';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { useAssetByCode } from '../hooks/useAssets';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const ScanPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [searchCode, setSearchCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    data: asset,
    isLoading,
    error,
    refetch,
  } = useAssetByCode(searchCode);

  const handleScanSuccess = async (assetCode: string) => {
    setSearchCode(assetCode);
    // Trigger the query
    const result = await refetch();

    if (result.data) {
      // Navigate to asset detail page
      navigate(`/assets/${result.data.id}`);
    } else {
      setErrorMessage(`Asset not found: ${assetCode}`);
    }
  };

  const handleManualSearch = async (assetCode: string) => {
    setSearchCode(assetCode);
    const result = await refetch();

    if (result.data) {
      navigate(`/assets/${result.data.id}`);
    } else {
      setErrorMessage(`Asset not found: ${assetCode}`);
    }
  };

  const handleScanError = (error: string) => {
    setErrorMessage(error);
  };

  return (
    <Box>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Find Asset
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Scan a QR code or enter an asset code manually
        </Typography>
      </Box>

      <Card elevation={2} sx={{ maxWidth: 700, mx: 'auto' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<QrCodeScannerIcon />} label="QR Scanner" />
          <Tab icon={<KeyboardIcon />} label="Manual Entry" />
        </Tabs>

        <CardContent sx={{ p: 3 }}>
          <TabPanel value={activeTab} index={0}>
            <ErrorBoundary
              onReset={() => {
                setErrorMessage('');
                setSearchCode('');
              }}
            >
              <QRScanner
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
              />
            </ErrorBoundary>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <ManualEntry
              onSearch={handleManualSearch}
              isLoading={isLoading}
            />
          </TabPanel>

          {isLoading && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Searching for asset...
            </Alert>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={4000}
        onClose={() => setErrorMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ScanPage;

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
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
import { logger } from '../utils/logger';

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
  const isProcessingRef = useRef(false); // Prevent duplicate processing

  const {
    data: _asset, // eslint-disable-line @typescript-eslint/no-unused-vars
    isLoading,
    error: _error, // eslint-disable-line @typescript-eslint/no-unused-vars
    refetch,
  } = useAssetByCode(searchCode);

  const handleScanSuccess = async (assetCode: string) => {
    // Prevent duplicate processing
    if (isProcessingRef.current) {
      logger.warn('[ScanPage] Already processing a scan, ignoring duplicate:', assetCode);
      return;
    }

    try {
      isProcessingRef.current = true;
      logger.info('[ScanPage] Processing scanned asset code:', assetCode);

      setSearchCode(assetCode);
      setErrorMessage(''); // Clear any previous errors

      // Trigger the query
      const result = await refetch();

      if (result.data) {
        logger.info('[ScanPage] Asset found, navigating to detail page:', result.data.id);
        // Navigate to asset detail page
        navigate(`/assets/${result.data.id}`);
      } else if (result.error) {
        logger.error('[ScanPage] Error fetching asset:', result.error);
        setErrorMessage(`Asset not found: ${assetCode}`);
      } else {
        logger.warn('[ScanPage] No data returned for asset code:', assetCode);
        setErrorMessage(`Asset not found: ${assetCode}`);
      }
    } catch (error) {
      logger.error('[ScanPage] Unexpected error during scan processing:', error);
      setErrorMessage(`Error processing scan: ${assetCode}`);
    } finally {
      // Reset processing flag after a delay
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1000);
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
      {/* Scanner Card with enhanced styling */}
      <Card
        elevation={0}
        sx={{
          maxWidth: 700,
          mx: 'auto',
          mt: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: (theme) =>
              theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(255, 215, 0, 0.2), inset 0 0 24px rgba(255, 215, 0, 0.05)'
                : '0 4px 20px rgba(253, 185, 49, 0.3)',
          },
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{
            borderBottom: 2,
            borderColor: 'divider',
            '& .MuiTab-root': {
              fontWeight: 600,
              fontSize: '0.95rem',
              letterSpacing: '0.05em',
              transition: 'all 0.3s ease',
              '&:hover': {
                color: 'primary.main',
              },
            },
            '& .Mui-selected': {
              color: 'primary.main',
            },
          }}
        >
          <Tab
            icon={<QrCodeScannerIcon />}
            label="QR Scanner"
            iconPosition="start"
          />
          <Tab
            icon={<KeyboardIcon />}
            label="Manual Entry"
            iconPosition="start"
          />
        </Tabs>

        <CardContent sx={{ p: 4 }}>
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
            <Alert
              severity="info"
              sx={{
                mt: 2,
                border: '1px solid',
                borderColor: 'info.main',
                fontWeight: 600,
                '& .MuiAlert-icon': {
                  filter: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))'
                      : 'none',
                },
              }}
            >
              [SEARCH] Searching for asset...
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Error Notification */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={4000}
        onClose={() => setErrorMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="error"
          onClose={() => setErrorMessage('')}
          sx={{
            border: '1px solid',
            borderColor: 'error.main',
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(255, 85, 85, 0.3)',
          }}
        >
          [ERROR] {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ScanPage;

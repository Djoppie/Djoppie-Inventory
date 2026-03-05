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
import { getAssetByCode } from '../api/assets.api';
import { logger } from '../utils/logger';
import { validateAssetCode, normalizeAssetCode } from '../utils/validation';

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
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const isProcessingRef = useRef(false); // Prevent duplicate processing

  const handleScanSuccess = async (assetCode: string) => {
    // Prevent duplicate processing
    if (isProcessingRef.current) {
      logger.warn('[ScanPage] Already processing a scan, ignoring duplicate:', assetCode);
      return;
    }

    try {
      isProcessingRef.current = true;
      setIsLoading(true);

      // Normalize the scanned code: trim whitespace and convert to uppercase
      const normalizedCode = normalizeAssetCode(assetCode);
      logger.info('[ScanPage] Processing scanned asset code:', {
        original: assetCode,
        normalized: normalizedCode,
        length: assetCode.length,
        hasWhitespace: assetCode !== assetCode.trim()
      });

      // Validate the asset code format
      const validation = validateAssetCode(normalizedCode);
      if (!validation.isValid) {
        logger.warn('[ScanPage] Invalid asset code format:', normalizedCode);
        setErrorMessage(validation.errorMessage || 'Invalid asset code format');
        return;
      }

      setErrorMessage(''); // Clear any previous errors

      // Directly call the API with the normalized code
      const asset = await getAssetByCode(normalizedCode);

      if (asset) {
        logger.info('[ScanPage] Asset found, navigating to detail page:', asset.id);
        // Navigate to asset detail page
        navigate(`/assets/${asset.id}`);
      } else {
        logger.warn('[ScanPage] No data returned for asset code:', normalizedCode);
        setErrorMessage(`Asset "${normalizedCode}" not found in the system. Please verify the code and try again.`);
      }
    } catch (error) {
      logger.error('[ScanPage] Error fetching asset:', error);
      const err = error as Error & { response?: { status?: number; data?: { message?: string } } };
      if (err?.response?.status === 404) {
        const normalizedCode = normalizeAssetCode(assetCode);
        setErrorMessage(`Asset "${normalizedCode}" not found in the system. Please verify the code and try again.`);
      } else {
        const errorMsg = err?.response?.data?.message || err?.message || 'Unknown error';
        setErrorMessage(`Error processing scan: ${errorMsg}`);
      }
    } finally {
      setIsLoading(false);
      // Reset processing flag after a delay
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1000);
    }
  };

  const handleManualSearch = async (assetCode: string) => {
    // Normalize the code: trim whitespace and convert to uppercase
    const normalizedCode = normalizeAssetCode(assetCode);

    // Validate the asset code format
    const validation = validateAssetCode(normalizedCode);
    if (!validation.isValid) {
      logger.warn('[ScanPage] Invalid asset code format from manual entry:', normalizedCode);
      setErrorMessage(validation.errorMessage || 'Invalid asset code format');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');

      const asset = await getAssetByCode(normalizedCode);

      if (asset) {
        navigate(`/assets/${asset.id}`);
      } else {
        setErrorMessage(`Asset "${normalizedCode}" not found in the system`);
      }
    } catch (error) {
      logger.error('[ScanPage] Error fetching asset by manual entry:', error);
      const err = error as Error & { response?: { status?: number; data?: { message?: string } } };
      if (err?.response?.status === 404) {
        setErrorMessage(`Asset "${normalizedCode}" not found in the system`);
      } else {
        const errorMsg = err?.response?.data?.message || err?.message || 'Unknown error';
        setErrorMessage(`Error: ${errorMsg}`);
      }
    } finally {
      setIsLoading(false);
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
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: 4 }}
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

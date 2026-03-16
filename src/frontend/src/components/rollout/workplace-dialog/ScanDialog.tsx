/**
 * ScanDialog - QR code scanning dialog
 *
 * Modal dialog for scanning asset QR codes or manual entry.
 * Features neumorphic styling with tab navigation.
 */

import {
  Dialog,
  DialogContent,
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  InputAdornment,
  Alert,
  useTheme,
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import QRScanner from '../../scanner/QRScanner';
import type { AssetScanMode } from './types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

interface ScanDialogProps {
  open: boolean;
  scanMode: AssetScanMode;
  activeTab: number;
  manualAssetCode: string;
  isLoadingAsset: boolean;
  scanError: string;
  onClose: () => void;
  onTabChange: (tab: number) => void;
  onManualAssetCodeChange: (value: string) => void;
  onScanSuccess: (assetCode: string) => Promise<void>;
  onScanError: (error: string) => void;
  onManualSearch: () => Promise<void>;
}

export function ScanDialog({
  open,
  scanMode,
  activeTab,
  manualAssetCode,
  isLoadingAsset,
  scanError,
  onClose,
  onTabChange,
  onManualAssetCodeChange,
  onScanSuccess,
  onScanError,
  onManualSearch,
}: ScanDialogProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const getScanModeLabel = () => {
    if (scanMode === 'update-asset') return 'Koppel bestaand asset uit inventaris';
    if (scanMode === 'new-device') return 'Link nieuw toestel';
    return 'Link oud toestel in te leveren';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onManualSearch();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          border: 'none',
          bgcolor: isDark ? 'rgba(30, 35, 40, 0.85)' : 'rgba(232, 238, 243, 0.85)',
          backdropFilter: 'blur(20px)',
          boxShadow: isDark
            ? '20px 20px 60px #161a1d, -20px -20px 60px #262c33'
            : '20px 20px 60px #c5cad0, -20px -20px 60px #ffffff',
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: isDark ? '#1e2328' : '#e8eef3',
          borderBottom: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 2.5,
              bgcolor: isDark ? '#1e2328' : '#e8eef3',
              boxShadow: isDark
                ? '4px 4px 8px #161a1d, -4px -4px 8px #262c33, inset 0 0 0 1px rgba(255, 119, 0, 0.3)'
                : '4px 4px 8px #c5cad0, -4px -4px 8px #ffffff, inset 0 0 0 1px rgba(255, 119, 0, 0.2)',
            }}
          >
            <QrCodeScannerIcon
              sx={{
                color: '#FF7700',
                fontSize: '1.4rem',
                filter: 'drop-shadow(0 2px 4px rgba(255, 119, 0, 0.3))',
              }}
            />
          </Box>
          <Box>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{
                color: '#FF7700',
                textShadow: isDark ? '0 2px 8px rgba(255, 119, 0, 0.3)' : 'none',
              }}
            >
              Scan Asset QR-code
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
            >
              {getScanModeLabel()}
            </Typography>
          </Box>
        </Stack>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            bgcolor: isDark ? '#1e2328' : '#e8eef3',
            boxShadow: isDark
              ? '3px 3px 6px #161a1d, -3px -3px 6px #262c33'
              : '3px 3px 6px #c5cad0, -3px -3px 6px #ffffff',
            '&:hover': {
              bgcolor: isDark ? '#1e2328' : '#e8eef3',
              boxShadow: isDark
                ? 'inset 2px 2px 4px #161a1d, inset -2px -2px 4px #262c33'
                : 'inset 2px 2px 4px #c5cad0, inset -2px -2px 4px #ffffff',
            },
          }}
        >
          <CloseIcon sx={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)' }} />
        </IconButton>
      </Box>

      {/* Tabs */}
      <Box sx={{ px: 2, py: 1.5, bgcolor: isDark ? '#1e2328' : '#e8eef3' }}>
        <Box
          sx={{
            borderRadius: 2,
            bgcolor: isDark ? '#1e2328' : '#e8eef3',
            boxShadow: isDark
              ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
              : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff',
            p: 0.5,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => onTabChange(newValue)}
            variant="fullWidth"
            sx={{
              minHeight: 44,
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '0.9rem',
                minHeight: 44,
                borderRadius: 1.5,
                color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                transition: 'all 0.3s ease',
              },
              '& .Mui-selected': {
                color: '#FF7700',
                bgcolor: isDark ? '#1e2328' : '#e8eef3',
                boxShadow: isDark
                  ? '3px 3px 6px #161a1d, -3px -3px 6px #262c33'
                  : '3px 3px 6px #c5cad0, -3px -3px 6px #ffffff',
              },
            }}
          >
            <Tab icon={<QrCodeScannerIcon />} label="QR Scanner" iconPosition="start" />
            <Tab icon={<KeyboardIcon />} label="Manual Entry" iconPosition="start" />
          </Tabs>
        </Box>
      </Box>

      <DialogContent sx={{ p: 3, bgcolor: isDark ? '#1e2328' : '#e8eef3' }}>
        {/* QR Scanner Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box
            sx={{
              borderRadius: 3,
              bgcolor: isDark ? '#1e2328' : '#e8eef3',
              boxShadow: isDark
                ? 'inset 4px 4px 8px #161a1d, inset -4px -4px 8px #262c33'
                : 'inset 4px 4px 8px #c5cad0, inset -4px -4px 8px #ffffff',
              p: 2,
            }}
          >
            <QRScanner onScanSuccess={onScanSuccess} onScanError={onScanError} />
          </Box>
        </TabPanel>

        {/* Manual Entry Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Asset Code"
              value={manualAssetCode}
              onChange={(e) => onManualAssetCodeChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="bijv. LAPTOP001"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={onManualSearch}
                      disabled={!manualAssetCode.trim() || isLoadingAsset}
                      sx={{
                        bgcolor: isDark ? '#1e2328' : '#e8eef3',
                        boxShadow: isDark
                          ? '2px 2px 4px #161a1d, -2px -2px 4px #262c33'
                          : '2px 2px 4px #c5cad0, -2px -2px 4px #ffffff',
                        '&:hover': {
                          bgcolor: isDark ? '#1e2328' : '#e8eef3',
                          boxShadow: isDark
                            ? 'inset 2px 2px 4px #161a1d, inset -2px -2px 4px #262c33'
                            : 'inset 2px 2px 4px #c5cad0, inset -2px -2px 4px #ffffff',
                        },
                      }}
                    >
                      {isLoadingAsset ? (
                        <CircularProgress size={20} />
                      ) : (
                        <SearchIcon sx={{ color: '#FF7700' }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: isDark ? '#1e2328' : '#e8eef3',
                  borderRadius: 2,
                  boxShadow: isDark
                    ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
                    : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff',
                  '& fieldset': { border: 'none' },
                  '&:hover, &.Mui-focused': {
                    boxShadow: isDark
                      ? 'inset 4px 4px 8px #161a1d, inset -4px -4px 8px #262c33, 0 0 0 2px rgba(255, 119, 0, 0.3)'
                      : 'inset 4px 4px 8px #c5cad0, inset -4px -4px 8px #ffffff, 0 0 0 2px rgba(255, 119, 0, 0.2)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                  '&.Mui-focused': { color: '#FF7700' },
                },
              }}
            />
            <Button
              fullWidth
              onClick={onManualSearch}
              disabled={!manualAssetCode.trim() || isLoadingAsset}
              sx={{
                mt: 2,
                py: 1.5,
                borderRadius: 2,
                bgcolor: isDark ? '#1e2328' : '#e8eef3',
                color: '#FF7700',
                fontWeight: 700,
                boxShadow: isDark
                  ? '4px 4px 8px #161a1d, -4px -4px 8px #262c33, inset 0 0 0 2px rgba(255, 119, 0, 0.3)'
                  : '4px 4px 8px #c5cad0, -4px -4px 8px #ffffff, inset 0 0 0 2px rgba(255, 119, 0, 0.2)',
                '&:hover': {
                  bgcolor: isDark ? '#1e2328' : '#e8eef3',
                  boxShadow: isDark
                    ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33, inset 0 0 0 2px rgba(255, 119, 0, 0.5)'
                    : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff, inset 0 0 0 2px rgba(255, 119, 0, 0.4)',
                },
                '&.Mui-disabled': {
                  color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)',
                  boxShadow: isDark
                    ? 'inset 2px 2px 4px #161a1d, inset -2px -2px 4px #262c33'
                    : 'inset 2px 2px 4px #c5cad0, inset -2px -2px 4px #ffffff',
                },
              }}
            >
              {isLoadingAsset ? 'Zoeken...' : 'Zoek Asset'}
            </Button>
          </Box>
        </TabPanel>

        {isLoadingAsset && (
          <Alert
            severity="info"
            sx={{
              mt: 2,
              borderRadius: 2,
              bgcolor: isDark ? '#1e2328' : '#e8eef3',
              boxShadow: isDark
                ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
                : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff',
              border: 'none',
            }}
          >
            Searching for asset...
          </Alert>
        )}

        {scanError && (
          <Alert
            severity="error"
            sx={{
              mt: 2,
              borderRadius: 2,
              bgcolor: isDark ? '#2a1f1f' : '#fef2f2',
              border: 'none',
            }}
          >
            {scanError}
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}

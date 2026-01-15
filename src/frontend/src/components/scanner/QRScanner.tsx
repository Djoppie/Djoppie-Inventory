import { useEffect, useRef, useState } from 'react';
import { Box, Typography, Alert, Button } from '@mui/material';
import { Html5Qrcode } from 'html5-qrcode';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import CameraHelp from './CameraHelp';

interface QRScannerProps {
  onScanSuccess: (assetCode: string) => void;
  onScanError?: (error: string) => void;
}

const QRScanner = ({ onScanSuccess, onScanError }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrCodeRegionId = 'qr-code-scanner-region';
  const isMountedRef = useRef(true);

  const startScanning = async () => {
    if (isInitializing) return;

    try {
      setIsInitializing(true);
      setError('');

      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser');
      }

      // Initialize scanner if not already done
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrCodeRegionId);
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await scannerRef.current.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          // Successfully scanned
          if (isMountedRef.current) {
            onScanSuccess(decodedText);
            stopScanning();
          }
        },
        (errorMessage) => {
          // Scanning in progress, errors can be ignored
          console.debug('QR scan error:', errorMessage);
        }
      );

      if (isMountedRef.current) {
        setIsScanning(true);
        setIsInitializing(false);
      }
    } catch (err) {
      if (isMountedRef.current) {
        let errorMsg = 'Failed to start camera';

        if (err instanceof Error) {
          errorMsg = err.message;

          // Provide user-friendly error messages
          if (err.message.includes('Permission')) {
            errorMsg = 'Camera permission denied. Please allow camera access in your browser settings.';
          } else if (err.message.includes('NotFound')) {
            errorMsg = 'No camera found. Please ensure your device has a working camera.';
          } else if (err.message.includes('NotReadable')) {
            errorMsg = 'Camera is already in use by another application.';
          }
        }

        setError(errorMsg);
        setIsInitializing(false);
        onScanError?.(errorMsg);
      }
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      // Mark as unmounted to prevent state updates
      isMountedRef.current = false;

      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch((err) => console.error('Error stopping scanner on unmount:', err))
          .finally(() => {
            scannerRef.current = null;
          });
      }
    };
  }, []);

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Please ensure camera permissions are granted and try again.
          </Typography>
        </Alert>
      )}

      <Box
        id={qrCodeRegionId}
        sx={{
          width: '100%',
          maxWidth: 500,
          mx: 'auto',
          mb: 3,
          '& video': {
            borderRadius: 2,
          },
        }}
      />

      <Box sx={{ textAlign: 'center' }}>
        {!isScanning ? (
          <Button
            variant="contained"
            size="large"
            startIcon={<CameraAltIcon />}
            onClick={startScanning}
            disabled={isInitializing}
          >
            {isInitializing ? 'Initializing Camera...' : 'Start Camera'}
          </Button>
        ) : (
          <Button
            variant="outlined"
            size="large"
            color="error"
            startIcon={<StopCircleIcon />}
            onClick={stopScanning}
          >
            Stop Scanning
          </Button>
        )}
      </Box>

      {isScanning && (
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{ mt: 2 }}
        >
          Point your camera at a QR code to scan
        </Typography>
      )}

      {/* Show help guide if there's an error */}
      {error && <CameraHelp />}
    </Box>
  );
};

export default QRScanner;

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Alert,
  Divider,
  useTheme,
  alpha,
  IconButton,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTranslation } from 'react-i18next';
import PrintLabel from './PrintLabel';

interface PrintLabelDialogProps {
  open: boolean;
  onClose: () => void;
  assetCode: string;
  assetName?: string;
}

/**
 * PrintLabelDialog Component
 *
 * Provides a professional preview and print interface for asset labels.
 * Features:
 * - Visual preview of the label at multiple sizes
 * - Print instructions and best practices
 * - Optimized print styles for Dymo 400 thermal printer
 */
const PrintLabelDialog = ({ open, onClose, assetCode, assetName }: PrintLabelDialogProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);

    // Create a hidden print window with optimized styles
    const printWindow = window.open('', '_blank', 'width=400,height=400');

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>${t('printLabel.title')} - ${assetCode}</title>
            <style>
              /* Reset and base styles */
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }

              body {
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                background: #FFFFFF;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }

              /* Label container - exact 25mm x 25mm */
              .label-container {
                width: 25mm;
                height: 25mm;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 0.5mm;
                padding: 1mm;
                background: #FFFFFF;
              }

              /* QR Code container */
              .qr-code {
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
              }

              .qr-code svg {
                display: block;
                width: 20mm;
                height: 20mm;
                max-width: 100%;
              }

              /* Asset code text */
              .asset-code {
                font-size: 6pt;
                font-weight: 700;
                color: #000000;
                text-align: center;
                line-height: 1.2;
                letter-spacing: -0.01em;
                word-break: break-all;
                max-width: 100%;
              }

              /* Print-specific styles */
              @media print {
                body {
                  min-height: auto;
                  background: #FFFFFF;
                }

                .label-container {
                  page-break-inside: avoid;
                  margin: 0;
                  padding: 1mm;
                }

                /* Hide everything except the label */
                @page {
                  size: 25mm 25mm;
                  margin: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="label-container">
              <div class="qr-code">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" shape-rendering="crispEdges">
                  ${generateQRCodeSVGPath(assetCode)}
                </svg>
              </div>
              <div class="asset-code">${assetCode}</div>
            </div>
            <script>
              // Auto-print when loaded
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.onafterprint = function() {
                    window.close();
                  };
                }, 250);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }

    // Reset printing state after a delay
    setTimeout(() => {
      setIsPrinting(false);
    }, 1000);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
        },
      }}
    >
      {/* Header with gradient accent */}
      <Box
        sx={{
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light}, ${theme.palette.secondary.main})`,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pt: 3,
            pb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 2,
                background: theme.palette.mode === 'light'
                  ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.2)})`
                  : `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.3)}, ${alpha(theme.palette.primary.main, 0.2)})`,
                color: theme.palette.primary.main,
              }}
            >
              <PrintIcon />
            </Box>
            <Box>
              <Typography variant="h6" component="div" fontWeight={700}>
                {t('printLabel.title')}
              </Typography>
              {assetName && (
                <Typography variant="caption" color="text.secondary">
                  {assetName}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: alpha(theme.palette.error.main, 0.1),
                color: theme.palette.error.main,
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
      </Box>

      <DialogContent sx={{ pt: 2, pb: 3 }}>
        {/* Label Preview Section */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            bgcolor: theme.palette.mode === 'light' ? '#F5F5F5' : alpha('#000000', 0.2),
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
            {t('printLabel.previewTitle')}
          </Typography>

          {/* Preview at different sizes */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
              gap: 3,
              flexWrap: 'wrap',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <PrintLabel assetCode={assetCode} size="small" />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {t('printLabel.actualSize')}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <PrintLabel assetCode={assetCode} size="medium" />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {t('printLabel.preview')}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Instructions */}
        <Alert
          severity="info"
          icon={<InfoOutlinedIcon />}
          sx={{
            mb: 2,
            '& .MuiAlert-message': {
              width: '100%',
            },
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            {t('printLabel.instructions.title')}
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2, mb: 0 }}>
            <li>
              <Typography variant="body2">
                {t('printLabel.instructions.step1')}
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                {t('printLabel.instructions.step2')}
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                {t('printLabel.instructions.step3')}
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                {t('printLabel.instructions.step4')}
              </Typography>
            </li>
          </Box>
        </Alert>

        {/* Printer Settings */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            bgcolor: alpha(theme.palette.success.main, 0.05),
            border: '1px solid',
            borderColor: alpha(theme.palette.success.main, 0.2),
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20, mt: 0.2 }} />
            <Box>
              <Typography variant="subtitle2" fontWeight={600} color="success.dark" gutterBottom>
                {t('printLabel.printerSettings.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('printLabel.printerSettings.dymoLabel')}: <strong>25mm x 25mm</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('printLabel.printerSettings.quality')}: <strong>{t('printLabel.printerSettings.highQuality')}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('printLabel.printerSettings.scale')}: <strong>100%</strong>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
        >
          {t('common.close')}
        </Button>
        <Button
          onClick={handlePrint}
          variant="contained"
          startIcon={<PrintIcon />}
          disabled={isPrinting}
          sx={{
            minWidth: 120,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
            },
          }}
        >
          {isPrinting ? t('printLabel.printing') : t('printLabel.print')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Generate a simple QR code SVG path for the print window
 * This is a simplified version - the actual QR is generated by qrcode.react
 */
function generateQRCodeSVGPath(text: string): string {
  // For the print window, we'll extract the QR code from the DOM
  // This is a fallback that creates a simple pattern
  const qrElement = document.querySelector('.print-label svg');
  if (qrElement) {
    return qrElement.innerHTML;
  }

  // Fallback: simple grid pattern (this should never be used in production)
  return `<rect width="100" height="100" fill="#FFFFFF"/>
          <text x="50" y="50" text-anchor="middle" fill="#000000" font-size="8">${text}</text>`;
}

export default PrintLabelDialog;

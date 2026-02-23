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
  ToggleButtonGroup,
  ToggleButton,
  FormControlLabel,
  Switch,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTranslation } from 'react-i18next';
import PrintLabel from './PrintLabel';
import { LABEL_CONFIG } from './labelConfig';
import type { LabelLayout } from './labelConfig';

interface PrintLabelDialogProps {
  open: boolean;
  onClose: () => void;
  assetCode: string;
  assetName?: string;
}

const PrintLabelDialog = ({ open, onClose, assetCode, assetName }: PrintLabelDialogProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [isPrinting, setIsPrinting] = useState(false);
  const [layout, setLayout] = useState<LabelLayout>('qrCode');
  const [showLogo, setShowLogo] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);

    // Extract the actual rendered QR code SVG from the DOM
    const qrElement = document.querySelector('.print-label svg');
    const qrSvgHtml = qrElement ? qrElement.outerHTML : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="50" text-anchor="middle" fill="#000">${assetCode}</text></svg>`;

    // Determine text content based on layout
    const bottomText = layout === 'qrName' ? (assetName || assetCode) : assetCode;
    const topText = layout === 'codeQrName' ? assetCode : '';
    const bottomLabel = layout === 'codeQrName' ? (assetName || '') : bottomText;
    const isDoubleText = layout === 'codeQrName';

    const printWindow = window.open('', '_blank', 'width=400,height=400');

    // Font sizes: 7pt for single text, 6pt for double text (codeQrName)
    const printFontSize = isDoubleText ? '6pt' : '7pt';
    // QR sizes: 70% of label for single text, 56% for double text
    // This ensures equal margins on left and right with QR centered
    const qrPercentage = isDoubleText ? LABEL_CONFIG.qrPercentageDouble : LABEL_CONFIG.qrPercentageSingle;
    const qrSizeMm = LABEL_CONFIG.sizeMm * qrPercentage;
    const qrSize = `${qrSizeMm}mm`;
    const labelSize = `${LABEL_CONFIG.sizeMm}mm`;

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>${t('printLabel.title')} - ${assetCode}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }

              @page {
                size: ${labelSize} ${labelSize};
                margin: 0;
              }

              html, body {
                width: 100%;
                height: 100%;
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                background: #FFFFFF;
                overflow: hidden;
              }

              .label-container {
                width: 100vw;
                height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 0.3mm;
                padding: 0.5mm;
                background: #FFFFFF;
                overflow: hidden;
              }

              .top-text, .bottom-text {
                font-size: ${printFontSize};
                font-weight: 700;
                color: #000000;
                text-align: center;
                line-height: 1;
                letter-spacing: -0.01em;
                width: ${LABEL_CONFIG.sizeMm - 1}mm; /* Label size minus 0.5mm padding on each side */
                flex-shrink: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }

              .qr-code {
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                width: ${qrSize};
                height: ${qrSize};
              }

              .qr-code svg {
                display: block;
                width: ${qrSize};
                height: ${qrSize};
              }

              @media print {
                html, body {
                  width: 100%;
                  height: 100%;
                }

                .label-container {
                  width: 100%;
                  height: 100%;
                  page-break-inside: avoid;
                  margin: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="label-container">
              ${topText ? `<div class="top-text">${topText}</div>` : ''}
              <div class="qr-code">
                ${qrSvgHtml}
              </div>
              ${bottomLabel ? `<div class="bottom-text">${bottomLabel}</div>` : ''}
            </div>
            <script>
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
      disableRestoreFocus
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
        {/* Layout Selection */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            bgcolor: theme.palette.mode === 'light' ? '#F5F5F5' : alpha('#000000', 0.2),
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            {t('printLabel.layoutTitle')}
          </Typography>

          <ToggleButtonGroup
            value={layout}
            exclusive
            onChange={(_, val) => val && setLayout(val)}
            size="small"
            sx={{
              display: 'flex',
              mb: 1.5,
              '& .MuiToggleButton-root': {
                flex: 1,
                textTransform: 'none',
                fontSize: '0.75rem',
                py: 0.75,
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                  },
                },
              },
            }}
          >
            <ToggleButton value="codeQrName">
              {t('printLabel.layouts.codeQrName')}
            </ToggleButton>
            <ToggleButton value="qrCode">
              {t('printLabel.layouts.qrCode')}
            </ToggleButton>
            <ToggleButton value="qrName">
              {t('printLabel.layouts.qrName')}
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Logo toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={showLogo}
                onChange={(e) => setShowLogo(e.target.checked)}
                size="small"
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                {t('printLabel.showLogo')}
              </Typography>
            }
          />
        </Paper>

        {/* Label Preview */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 2,
            bgcolor: theme.palette.mode === 'light' ? '#FAFAFA' : alpha('#000000', 0.15),
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
            {t('printLabel.previewTitle')}
          </Typography>

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
              <PrintLabel
                assetCode={assetCode}
                assetName={assetName}
                size="small"
                layout={layout}
                showLogo={showLogo}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {t('printLabel.actualSize')}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <PrintLabel
                assetCode={assetCode}
                assetName={assetName}
                size="medium"
                layout={layout}
                showLogo={showLogo}
              />
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
                {t('printLabel.printerSettings.dymoLabel')}: <strong>{LABEL_CONFIG.sizeMm}mm x {LABEL_CONFIG.sizeMm}mm</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('printLabel.printerSettings.qrSize')}: <strong>{(LABEL_CONFIG.sizeMm * (layout === 'codeQrName' ? LABEL_CONFIG.qrPercentageDouble : LABEL_CONFIG.qrPercentageSingle)).toFixed(1)}mm ({Math.round((layout === 'codeQrName' ? LABEL_CONFIG.qrPercentageDouble : LABEL_CONFIG.qrPercentageSingle) * 100)}%)</strong>
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

export default PrintLabelDialog;

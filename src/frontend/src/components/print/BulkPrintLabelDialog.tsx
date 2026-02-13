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
  Chip,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTranslation } from 'react-i18next';
import PrintLabel from './PrintLabel';
import type { LabelLayout } from './PrintLabel';
import type { Asset } from '../../types/asset.types';

interface BulkPrintLabelDialogProps {
  open: boolean;
  onClose: () => void;
  assets: Asset[];
}

const MAX_BULK_PRINT = 20;

const BulkPrintLabelDialog = ({ open, onClose, assets }: BulkPrintLabelDialogProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [isPrinting, setIsPrinting] = useState(false);
  const [layout, setLayout] = useState<LabelLayout>('qrCode');
  const [showLogo, setShowLogo] = useState(false);

  const assetsToProcess = assets.slice(0, MAX_BULK_PRINT);
  const hasExcess = assets.length > MAX_BULK_PRINT;

  const handlePrint = () => {
    setIsPrinting(true);

    const isDoubleText = layout === 'codeQrName';
    const printFontSize = isDoubleText ? '6pt' : '7pt';
    const qrSize = isDoubleText ? '14mm' : '18mm';

    // Generate labels HTML for all selected assets
    const labelsHtml = assetsToProcess.map((asset) => {
      const bottomText = layout === 'qrName' ? (asset.assetName || asset.assetCode) : asset.assetCode;
      const topText = layout === 'codeQrName' ? asset.assetCode : '';
      const bottomLabel = layout === 'codeQrName' ? (asset.assetName || '') : bottomText;

      // Generate QR code SVG inline (simplified version without logo for bulk printing)
      const qrValue = asset.assetCode;

      return `
        <div class="label-container">
          ${topText ? `<div class="top-text">${topText}</div>` : ''}
          <div class="qr-code">
            <div class="qr-placeholder" data-value="${qrValue}"></div>
          </div>
          ${bottomLabel ? `<div class="bottom-text">${bottomLabel}</div>` : ''}
        </div>
      `;
    }).join('');

    const printWindow = window.open('', '_blank', 'width=400,height=600');

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>${t('bulkPrintLabel.title')} - ${assetsToProcess.length} ${t('bulkPrintLabel.labels')}</title>
            <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></` + `script>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }

              @page {
                size: 25mm 25mm;
                margin: 0;
              }

              html, body {
                width: 100%;
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                background: #FFFFFF;
              }

              .labels-wrapper {
                display: flex;
                flex-direction: column;
                align-items: center;
              }

              .label-container {
                width: 25mm;
                height: 25mm;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 0.3mm;
                padding: 0.5mm;
                background: #FFFFFF;
                overflow: hidden;
                page-break-after: always;
                page-break-inside: avoid;
              }

              .label-container:last-child {
                page-break-after: auto;
              }

              .top-text, .bottom-text {
                font-size: ${printFontSize};
                font-weight: 700;
                color: #000000;
                text-align: center;
                line-height: 1;
                letter-spacing: -0.01em;
                width: 24mm;
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

              .qr-code svg, .qr-code img {
                display: block;
                width: ${qrSize};
                height: ${qrSize};
              }

              @media print {
                html, body {
                  width: 100%;
                }
              }

              /* Screen preview styles */
              @media screen {
                body {
                  padding: 20px;
                  background: #f5f5f5;
                }

                .labels-wrapper {
                  gap: 10px;
                }

                .label-container {
                  border: 1px dashed #ccc;
                  background: #fff;
                }
              }
            </style>
          </head>
          <body>
            <div class="labels-wrapper">
              ${labelsHtml}
            </div>
            <script>
              // Generate QR codes for each placeholder
              document.querySelectorAll('.qr-placeholder').forEach(function(placeholder) {
                var value = placeholder.getAttribute('data-value');
                var qr = qrcode(0, 'H');
                qr.addData(value);
                qr.make();

                // Create SVG from QR code
                var moduleCount = qr.getModuleCount();
                var cellSize = 4;
                var size = moduleCount * cellSize;

                var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + ' ' + size + '">';
                svg += '<rect width="' + size + '" height="' + size + '" fill="#FFFFFF"/>';

                for (var row = 0; row < moduleCount; row++) {
                  for (var col = 0; col < moduleCount; col++) {
                    if (qr.isDark(row, col)) {
                      svg += '<rect x="' + (col * cellSize) + '" y="' + (row * cellSize) + '" width="' + cellSize + '" height="' + cellSize + '" fill="#000000"/>';
                    }
                  }
                }

                svg += '</svg>';
                placeholder.innerHTML = svg;
              });

              // Auto-print after QR codes are generated
              setTimeout(function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              }, 500);
            </` + `script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }

    setTimeout(() => {
      setIsPrinting(false);
    }, 1000);
  };

  // Get first asset for preview
  const previewAsset = assetsToProcess[0];

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
                {t('bulkPrintLabel.title')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={`${assetsToProcess.length} ${t('bulkPrintLabel.labelsSelected')}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                {hasExcess && (
                  <Chip
                    label={t('bulkPrintLabel.maxLimitReached', { max: MAX_BULK_PRINT })}
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                )}
              </Box>
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
        {/* Warning for excess assets */}
        {hasExcess && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('bulkPrintLabel.excessWarning', { total: assets.length, max: MAX_BULK_PRINT })}
          </Alert>
        )}

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
        {previewAsset && (
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
              {t('bulkPrintLabel.previewFirstLabel')}
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
                  assetCode={previewAsset.assetCode}
                  assetName={previewAsset.assetName}
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
                  assetCode={previewAsset.assetCode}
                  assetName={previewAsset.assetName}
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
        )}

        {/* Asset List Preview */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            bgcolor: theme.palette.mode === 'light' ? '#FAFAFA' : alpha('#000000', 0.15),
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            maxHeight: 150,
            overflow: 'auto',
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            {t('bulkPrintLabel.assetsToprint')}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {assetsToProcess.map((asset) => (
              <Chip
                key={asset.id}
                label={asset.assetCode}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            ))}
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
            {t('bulkPrintLabel.instructions.title')}
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2, mb: 0 }}>
            <li>
              <Typography variant="body2">
                {t('bulkPrintLabel.instructions.step1')}
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                {t('bulkPrintLabel.instructions.step2')}
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                {t('bulkPrintLabel.instructions.step3')}
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
                {t('bulkPrintLabel.printMode')}: <strong>{t('bulkPrintLabel.continuous')}</strong>
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
          disabled={isPrinting || assetsToProcess.length === 0}
          sx={{
            minWidth: 140,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
            },
          }}
        >
          {isPrinting
            ? t('printLabel.printing')
            : t('bulkPrintLabel.printAll', { count: assetsToProcess.length })}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkPrintLabelDialog;

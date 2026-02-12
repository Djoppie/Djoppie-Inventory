import { Box, Typography } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';

interface PrintLabelProps {
  assetCode: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * PrintLabel Component - Optimized for Dymo 400 thermal labelprinter
 * Label size: 25mm x 25mm (approximately 94.5 x 94.5 pixels at 96 DPI)
 *
 * Design optimizations for thermal printing:
 * - High contrast black and white
 * - Clean, simple lines (no gradients or shadows)
 * - Large QR code for reliable scanning
 * - Compact, readable text
 * - Proper millimeter-based sizing for accurate print output
 */
const PrintLabel = ({ assetCode, size = 'medium' }: PrintLabelProps) => {
  // Size configurations for different contexts
  const sizeConfig = {
    small: { container: 100, qr: 70, fontSize: 7 },
    medium: { container: 150, qr: 110, fontSize: 9 },
    large: { container: 200, qr: 150, fontSize: 11 },
  };

  const config = sizeConfig[size];

  return (
    <Box
      className="print-label"
      sx={{
        width: `${config.container}px`,
        height: `${config.container}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        bgcolor: '#FFFFFF',
        border: '1px solid #E0E0E0',
        borderRadius: 1,
        padding: '8px',
        boxSizing: 'border-box',
        '@media print': {
          // Exact 25mm x 25mm label size for printing
          width: '25mm',
          height: '25mm',
          border: 'none',
          borderRadius: 0,
          padding: '1mm',
          pageBreakInside: 'avoid',
          margin: 0,
          gap: '0.5mm',
        },
      }}
    >
      {/* QR Code */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <QRCodeSVG
          value={assetCode}
          size={config.qr}
          level="H" // High error correction for reliable scanning
          bgColor="#FFFFFF"
          fgColor="#000000"
          includeMargin={false}
          style={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto',
          }}
        />
      </Box>

      {/* Asset Code Text */}
      <Typography
        sx={{
          fontSize: `${config.fontSize}px`,
          fontWeight: 700,
          color: '#000000',
          textAlign: 'center',
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
          wordBreak: 'break-all',
          maxWidth: '100%',
          '@media print': {
            fontSize: '6pt',
            fontWeight: 700,
            letterSpacing: '-0.01em',
          },
        }}
      >
        {assetCode}
      </Typography>
    </Box>
  );
};

export default PrintLabel;

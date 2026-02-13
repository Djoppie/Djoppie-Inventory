import { Box, Typography } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';

export type LabelLayout = 'codeQrName' | 'qrCode' | 'qrName';

interface PrintLabelProps {
  assetCode: string;
  assetName?: string;
  size?: 'small' | 'medium' | 'large';
  layout?: LabelLayout;
  showLogo?: boolean;
}

// Simple Djoppie "D" logo as data URL - black on white for thermal printing
const DJOPPIE_LOGO_SVG = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">' +
  '<circle cx="20" cy="20" r="18" fill="white" stroke="black" stroke-width="2.5"/>' +
  '<text x="20" y="27" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="22" font-weight="900" fill="black">D</text>' +
  '</svg>'
)}`;

// Dynamic QR sizing based on layout:
// - qrCode/qrName: QR ~18mm (single text line, more space for QR)
// - codeQrName: QR ~14mm (two text lines, less space for QR)
// Preview scales proportionally (container represents 25mm label)
const PrintLabel = ({ assetCode, assetName, size = 'medium', layout = 'qrCode', showLogo = false }: PrintLabelProps) => {
  const isDoubleText = layout === 'codeQrName';

  // QR sizes: 18mm for single text layouts, 14mm for double text layout
  // Scale factor: container/25 (since label is 25mm)
  const sizeConfig = {
    small:  {
      container: 100,
      qrSingle: 72,  // 18mm scaled (18/25 * 100)
      qrDouble: 56,  // 14mm scaled (14/25 * 100)
      fontSize: 8,
      fontSizeSmall: 6,
      logoSizeSingle: 16,
      logoSizeDouble: 12,
    },
    medium: {
      container: 150,
      qrSingle: 108, // 18mm scaled (18/25 * 150)
      qrDouble: 84,  // 14mm scaled (14/25 * 150)
      fontSize: 11,
      fontSizeSmall: 9,
      logoSizeSingle: 24,
      logoSizeDouble: 18,
    },
    large:  {
      container: 200,
      qrSingle: 144, // 18mm scaled (18/25 * 200)
      qrDouble: 112, // 14mm scaled (14/25 * 200)
      fontSize: 15,
      fontSizeSmall: 12,
      logoSizeSingle: 32,
      logoSizeDouble: 24,
    },
  };

  const config = sizeConfig[size];
  const qrSize = isDoubleText ? config.qrDouble : config.qrSingle;
  const logoSize = isDoubleText ? config.logoSizeDouble : config.logoSizeSingle;
  const textFontSize = isDoubleText ? config.fontSizeSmall : config.fontSize;

  const topText = layout === 'codeQrName' ? assetCode : undefined;
  const bottomLabel = layout === 'codeQrName'
    ? (assetName || '')
    : layout === 'qrName'
      ? (assetName || assetCode)
      : assetCode;

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
        gap: '2px',
        bgcolor: '#FFFFFF',
        border: '1px solid #E0E0E0',
        borderRadius: 1,
        padding: '4px',
        boxSizing: 'border-box',
        '@media print': {
          width: '25mm',
          height: '25mm',
          border: 'none',
          borderRadius: 0,
          padding: '0.5mm',
          pageBreakInside: 'avoid',
          margin: 0,
          gap: '0.3mm',
        },
      }}
    >
      {/* Top text (only for codeQrName layout) */}
      {topText && (
        <Typography
          sx={{
            fontSize: `${textFontSize}px`,
            fontWeight: 700,
            color: '#000000',
            textAlign: 'center',
            lineHeight: 1,
            letterSpacing: '-0.02em',
            fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
            wordBreak: 'break-all',
            width: '100%',
            flexShrink: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            '@media print': {
              fontSize: '6pt',
              width: '24mm',
            },
          }}
        >
          {topText}
        </Typography>
      )}

      {/* QR Code - dynamic size based on layout (18mm single text, 14mm double text) */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          width: `${qrSize}px`,
          height: `${qrSize}px`,
          '@media print': {
            width: isDoubleText ? '14mm' : '18mm',
            height: isDoubleText ? '14mm' : '18mm',
          },
        }}
      >
        <QRCodeSVG
          value={assetCode}
          size={qrSize}
          level="H"
          bgColor="#FFFFFF"
          fgColor="#000000"
          includeMargin={false}
          {...(showLogo ? {
            imageSettings: {
              src: DJOPPIE_LOGO_SVG,
              x: undefined,
              y: undefined,
              height: logoSize,
              width: logoSize,
              excavate: true,
            },
          } : {})}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
          }}
        />
      </Box>

      {/* Bottom text */}
      {bottomLabel && (
        <Typography
          sx={{
            fontSize: `${textFontSize}px`,
            fontWeight: 700,
            color: '#000000',
            textAlign: 'center',
            lineHeight: 1,
            letterSpacing: '-0.02em',
            fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
            wordBreak: 'break-all',
            width: '100%',
            flexShrink: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            '@media print': {
              fontSize: isDoubleText ? '6pt' : '7pt',
              width: '24mm',
            },
          }}
        >
          {bottomLabel}
        </Typography>
      )}
    </Box>
  );
};

export default PrintLabel;

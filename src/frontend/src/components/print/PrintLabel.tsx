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

// Preview scales: QR is 80% of container (20mm/25mm), text gets remaining space
const PrintLabel = ({ assetCode, assetName, size = 'medium', layout = 'qrCode', showLogo = false }: PrintLabelProps) => {
  const sizeConfig = {
    small:  { container: 100, qr: 80,  fontSize: 7,  fontSizeSmall: 5.5, logoSize: 18 },
    medium: { container: 150, qr: 120, fontSize: 10, fontSizeSmall: 8,   logoSize: 26 },
    large:  { container: 200, qr: 160, fontSize: 14, fontSizeSmall: 10,  logoSize: 36 },
  };

  const config = sizeConfig[size];
  const isDoubleText = layout === 'codeQrName';
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
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
            wordBreak: 'break-all',
            maxWidth: '100%',
            flexShrink: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            '@media print': {
              fontSize: isDoubleText ? '5pt' : '7pt',
            },
          }}
        >
          {topText}
        </Typography>
      )}

      {/* QR Code - fixed 20mm on print, 80% of container on screen */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          width: `${config.qr}px`,
          height: `${config.qr}px`,
        }}
      >
        <QRCodeSVG
          value={assetCode}
          size={config.qr}
          level="H"
          bgColor="#FFFFFF"
          fgColor="#000000"
          includeMargin={false}
          {...(showLogo ? {
            imageSettings: {
              src: DJOPPIE_LOGO_SVG,
              x: undefined,
              y: undefined,
              height: config.logoSize,
              width: config.logoSize,
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
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
            wordBreak: 'break-all',
            maxWidth: '100%',
            flexShrink: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            '@media print': {
              fontSize: isDoubleText ? '5pt' : '7pt',
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

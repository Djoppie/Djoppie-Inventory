import { Box, Typography } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { LABEL_CONFIG } from './labelConfig';
import type { LabelLayout } from './labelConfig';

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

// Label dimensions and QR code sizing from exported config
// QR code: 70% of label width for single text, 56% for double text
// This ensures equal margins on left and right with QR centered
const LABEL_SIZE_MM = LABEL_CONFIG.sizeMm;
const QR_PERCENTAGE_SINGLE = LABEL_CONFIG.qrPercentageSingle;
const QR_PERCENTAGE_DOUBLE = LABEL_CONFIG.qrPercentageDouble;

const PrintLabel = ({ assetCode, assetName, size = 'medium', layout = 'qrCode', showLogo = false }: PrintLabelProps) => {
  const isDoubleText = layout === 'codeQrName';

  // Container sizes for preview (px) - proportional to 25mm label
  // QR sizes calculated as percentage of container for consistent scaling
  const sizeConfig = {
    small:  {
      container: 100,
      fontSize: 8,
      fontSizeSmall: 6,
    },
    medium: {
      container: 150,
      fontSize: 11,
      fontSizeSmall: 9,
    },
    large:  {
      container: 200,
      fontSize: 15,
      fontSizeSmall: 12,
    },
  };

  const config = sizeConfig[size];
  const qrPercentage = isDoubleText ? QR_PERCENTAGE_DOUBLE : QR_PERCENTAGE_SINGLE;
  const qrSize = Math.round(config.container * qrPercentage);
  const logoSize = Math.round(qrSize * 0.22); // Logo is ~22% of QR size
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
          width: `${LABEL_SIZE_MM}mm`,
          height: `${LABEL_SIZE_MM}mm`,
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
              width: `${LABEL_SIZE_MM - 1}mm`, // Label size minus 0.5mm padding on each side
            },
          }}
        >
          {topText}
        </Typography>
      )}

      {/* QR Code - centered with equal margins (70% of label width for single text, 56% for double) */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          width: `${qrSize}px`,
          height: `${qrSize}px`,
          '@media print': {
            // 70% of 25mm = 17.5mm for single text, 56% = 14mm for double text
            width: isDoubleText ? `${LABEL_SIZE_MM * QR_PERCENTAGE_DOUBLE}mm` : `${LABEL_SIZE_MM * QR_PERCENTAGE_SINGLE}mm`,
            height: isDoubleText ? `${LABEL_SIZE_MM * QR_PERCENTAGE_DOUBLE}mm` : `${LABEL_SIZE_MM * QR_PERCENTAGE_SINGLE}mm`,
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
              width: `${LABEL_SIZE_MM - 1}mm`, // Label size minus 0.5mm padding on each side
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

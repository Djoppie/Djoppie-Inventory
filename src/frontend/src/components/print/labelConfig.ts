// Label configuration for print labels
// All dimensions in millimeters

export const LABEL_CONFIG = {
  sizeMm: 25,                    // Label size: 25mm x 25mm
  qrPercentageSingle: 0.70,      // 70% for single text line layouts (QR + Code or QR + Name)
  qrPercentageDouble: 0.56,      // 56% for double text line layouts (Code + QR + Name)
};

export type LabelLayout = 'codeQrName' | 'qrCode' | 'qrName';

/**
 * Validation utilities for asset codes and other inputs.
 * These validation rules match the backend validation in InputValidator.cs
 */

/**
 * Pattern for valid asset code following the format: [DUM-]TYPE-YY-MERK-NNNNN
 * Examples: LAP-24-DBK-00001, DUM-LAP-26-HP-90001
 *
 * Format breakdown:
 * - Optional "DUM-" prefix for dummy assets
 * - TYPE: 2-10 uppercase letters (e.g., LAP, DT, MON)
 * - YY: 2 digits for year (e.g., 24, 25, 26)
 * - MERK: 1-4 alphanumeric characters for brand (e.g., DBK, HP, DELL)
 * - NNNNN: Exactly 5 digits for sequence number (e.g., 00001, 12345)
 */
const ASSET_CODE_PATTERN = /^(?:DUM-)?[A-Z]{2,10}-\d{2}-[A-Z0-9]{1,4}-\d{5}$/i;

/**
 * Maximum allowed length for asset codes
 */
const MAX_ASSET_CODE_LENGTH = 50;

/**
 * Validates an asset code against the expected format.
 *
 * @param assetCode - The asset code to validate
 * @returns Object with isValid flag and optional error message
 */
export const validateAssetCode = (assetCode: string | null | undefined): {
  isValid: boolean;
  errorMessage?: string;
} => {
  // Check if code is provided
  if (!assetCode || assetCode.trim().length === 0) {
    return {
      isValid: false,
      errorMessage: 'Asset code is required',
    };
  }

  const trimmedCode = assetCode.trim();

  // Check length
  if (trimmedCode.length > MAX_ASSET_CODE_LENGTH) {
    return {
      isValid: false,
      errorMessage: `Asset code cannot exceed ${MAX_ASSET_CODE_LENGTH} characters`,
    };
  }

  // Check format
  if (!ASSET_CODE_PATTERN.test(trimmedCode)) {
    return {
      isValid: false,
      errorMessage: 'Asset code must be in format TYPE-YY-MERK-NNNNN (e.g., LAP-24-DBK-00001) or DUM-TYPE-YY-MERK-NNNNN for dummy assets',
    };
  }

  return { isValid: true };
};

/**
 * Checks if an asset code is valid (simple boolean check).
 *
 * @param assetCode - The asset code to check
 * @returns True if valid, false otherwise
 */
export const isValidAssetCode = (assetCode: string | null | undefined): boolean => {
  return validateAssetCode(assetCode).isValid;
};

/**
 * Normalizes an asset code by trimming whitespace and converting to uppercase.
 *
 * @param assetCode - The asset code to normalize
 * @returns Normalized asset code
 */
export const normalizeAssetCode = (assetCode: string): string => {
  return assetCode.trim().toUpperCase();
};

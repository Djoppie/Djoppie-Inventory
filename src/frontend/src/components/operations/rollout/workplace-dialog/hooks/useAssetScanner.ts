/**
 * useAssetScanner - Custom hook for QR code scanning and asset lookup
 *
 * Handles QR scanning dialog state, manual asset code entry,
 * and asset lookup from the database.
 */

import { useState, useCallback, useRef } from 'react';
import type { Asset } from '../../../../../types/asset.types';
import type { AssetScanMode, ScanDialogState } from '../types';
import { getAssetByCode, getAssetBySerialNumber } from '../../../../../api/assets.api';
import { normalizeAssetCode, validateAssetCode } from '../../../../../utils/validation';
import { logger } from '../../../../../utils/logger';
import { ROLLOUT_TIMING } from '../../../../../constants/rollout.constants';

interface ScanResult {
  success: boolean;
  asset?: Asset;
  error?: string;
}

interface UseAssetScannerReturn extends ScanDialogState {
  // Dialog actions
  openScanDialog: (mode: AssetScanMode) => void;
  closeScanDialog: () => void;
  setActiveTab: (tab: number) => void;
  setManualAssetCode: (code: string) => void;
  setScanError: (error: string) => void;
  setScanSuccess: (message: string) => void;

  // Scan actions
  handleScanSuccess: (assetCode: string) => Promise<ScanResult>;
  handleManualSearch: () => Promise<ScanResult>;
  handleSerialSearch: (serial: string) => Promise<Asset | null>;
}

export function useAssetScanner(): UseAssetScannerReturn {
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [scanMode, setScanMode] = useState<AssetScanMode>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [manualAssetCode, setManualAssetCode] = useState('');
  const [isLoadingAsset, setIsLoadingAsset] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState('');

  const isProcessingScanRef = useRef(false);

  const openScanDialog = useCallback((mode: AssetScanMode) => {
    setScanMode(mode);
    setScanDialogOpen(true);
    setActiveTab(0);
    setManualAssetCode('');
    setScanError('');
    setScanSuccess('');
    isProcessingScanRef.current = false;
  }, []);

  const closeScanDialog = useCallback(() => {
    setScanDialogOpen(false);
    setScanMode(null);
    setActiveTab(0);
    setManualAssetCode('');
    setScanError('');
    setScanSuccess('');
  }, []);

  const handleScanSuccess = useCallback(async (assetCode: string): Promise<ScanResult> => {
    if (isProcessingScanRef.current) {
      logger.warn('[useAssetScanner] Already processing a scan');
      return { success: false, error: 'Already processing a scan' };
    }

    try {
      isProcessingScanRef.current = true;
      setIsLoadingAsset(true);
      setScanError('');

      const normalizedCode = normalizeAssetCode(assetCode);
      logger.info('[useAssetScanner] Processing scanned asset code:', normalizedCode);

      const validation = validateAssetCode(normalizedCode);
      if (!validation.isValid) {
        const error = validation.errorMessage || 'Invalid asset code format';
        setScanError(error);
        return { success: false, error };
      }

      const asset = await getAssetByCode(normalizedCode);

      if (asset) {
        setScanSuccess(`Asset gekoppeld: ${asset.assetCode}`);
        return { success: true, asset };
      } else {
        const error = `Asset "${normalizedCode}" not found in the system`;
        setScanError(error);
        return { success: false, error };
      }
    } catch (error) {
      logger.error('[useAssetScanner] Error fetching asset:', error);
      const err = error as Error & { response?: { status?: number } };
      const errorMessage = err?.response?.status === 404
        ? 'Asset not found'
        : 'Error processing scan';
      setScanError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoadingAsset(false);
      setTimeout(() => {
        isProcessingScanRef.current = false;
      }, ROLLOUT_TIMING.SCAN_SUCCESS_CLEAR_DELAY_MS);
    }
  }, []);

  const handleManualSearch = useCallback(async (): Promise<ScanResult> => {
    if (!manualAssetCode.trim()) {
      return { success: false, error: 'No asset code entered' };
    }

    setIsLoadingAsset(true);
    setScanError('');

    try {
      const normalizedCode = normalizeAssetCode(manualAssetCode);
      const validation = validateAssetCode(normalizedCode);

      if (!validation.isValid) {
        const error = validation.errorMessage || 'Invalid asset code format';
        setScanError(error);
        return { success: false, error };
      }

      const asset = await getAssetByCode(normalizedCode);

      if (asset) {
        setScanSuccess(`Asset gekoppeld: ${asset.assetCode}`);
        return { success: true, asset };
      } else {
        const error = `Asset "${normalizedCode}" not found`;
        setScanError(error);
        return { success: false, error };
      }
    } catch {
      const error = 'Error searching for asset';
      setScanError(error);
      return { success: false, error };
    } finally {
      setIsLoadingAsset(false);
    }
  }, [manualAssetCode]);

  const handleSerialSearch = useCallback(async (serial: string): Promise<Asset | null> => {
    if (!serial.trim()) return null;

    try {
      return await getAssetBySerialNumber(serial);
    } catch {
      return null;
    }
  }, []);

  return {
    // State
    scanDialogOpen,
    scanMode,
    activeTab,
    manualAssetCode,
    isLoadingAsset,
    scanError,
    scanSuccess,

    // Dialog actions
    openScanDialog,
    closeScanDialog,
    setActiveTab,
    setManualAssetCode,
    setScanError,
    setScanSuccess,

    // Scan actions
    handleScanSuccess,
    handleManualSearch,
    handleSerialSearch,
  };
}

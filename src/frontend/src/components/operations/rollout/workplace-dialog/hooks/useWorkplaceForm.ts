/**
 * useWorkplaceForm - Custom hook for managing workplace form state
 *
 * Consolidates all form-related state into a single hook for cleaner component code.
 */

import { useState, useCallback } from 'react';
import type { RolloutWorkplace, RolloutWorkplaceStatus } from '../../../../../types/rollout';
import type { OldDeviceConfig } from '../../OldDeviceConfigSection';
import type { AssetConfigItem } from '../../WorkplaceConfigSection';
import type { WorkplaceFormState } from '../types';

interface UseWorkplaceFormReturn {
  // Form state
  state: WorkplaceFormState;

  // User info setters
  setUserName: (value: string) => void;
  setUserEmail: (value: string) => void;
  setUserEntraId: (value: string) => void;
  setLocation: (value: string) => void;
  setServiceId: (value: number | undefined) => void;
  setScheduledDate: (value: string | undefined) => void;
  setWorkplaceStatus: (status: RolloutWorkplaceStatus) => void;
  setPhysicalWorkplaceId: (value: number | undefined) => void;

  // Device state setters
  setOldDevices: (devices: OldDeviceConfig[]) => void;
  setConfigItems: (items: AssetConfigItem[]) => void;
  setReturningOldDevice: (value: boolean) => void;

  // Sync methods
  syncFromWorkplace: (workplace: RolloutWorkplace) => void;
  resetForm: () => void;

  // Validation
  isFormValid: boolean;
  hasTemplateErrors: boolean;
  hasDeviceConfigured: boolean;
  hasWorkplaceFixedWithoutPhysicalWorkplace: boolean;
}

const initialState: WorkplaceFormState = {
  userName: '',
  userEmail: '',
  userEntraId: '',
  location: '',
  serviceId: undefined,
  scheduledDate: undefined,
  workplaceStatus: 'Pending',
  physicalWorkplaceId: undefined,
  oldDevices: [],
  configItems: [],
  returningOldDevice: false,
};

export function useWorkplaceForm(): UseWorkplaceFormReturn {
  const [state, setState] = useState<WorkplaceFormState>(initialState);

  // User info setters
  const setUserName = useCallback((value: string) => {
    setState(prev => ({ ...prev, userName: value }));
  }, []);

  const setUserEmail = useCallback((value: string) => {
    setState(prev => ({ ...prev, userEmail: value }));
  }, []);

  const setUserEntraId = useCallback((value: string) => {
    setState(prev => ({ ...prev, userEntraId: value }));
  }, []);

  const setLocation = useCallback((value: string) => {
    setState(prev => ({ ...prev, location: value }));
  }, []);

  const setServiceId = useCallback((value: number | undefined) => {
    setState(prev => ({ ...prev, serviceId: value }));
  }, []);

  const setScheduledDate = useCallback((value: string | undefined) => {
    setState(prev => ({ ...prev, scheduledDate: value }));
  }, []);

  const setWorkplaceStatus = useCallback((status: RolloutWorkplaceStatus) => {
    setState(prev => ({ ...prev, workplaceStatus: status }));
  }, []);

  const setPhysicalWorkplaceId = useCallback((value: number | undefined) => {
    setState(prev => ({ ...prev, physicalWorkplaceId: value }));
  }, []);

  // Device state setters
  const setOldDevices = useCallback((devices: OldDeviceConfig[]) => {
    setState(prev => ({ ...prev, oldDevices: devices }));
  }, []);

  const setConfigItems = useCallback((items: AssetConfigItem[]) => {
    setState(prev => ({ ...prev, configItems: items }));
  }, []);

  const setReturningOldDevice = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, returningOldDevice: value }));
  }, []);

  // Sync from existing workplace (for edit mode)
  const syncFromWorkplace = useCallback((workplace: RolloutWorkplace) => {
    const plans = workplace.assetPlans || [];
    const oldDevicePlans = plans.filter(p => p.metadata?.isOldDevice === 'true');
    const devicePlans = plans.filter(p => p.metadata?.isOldDevice !== 'true');

    const oldDevices: OldDeviceConfig[] = oldDevicePlans.map((p, idx) => ({
      id: `old-device-edit-${idx}`,
      serialNumber: p.metadata?.oldSerial || '',
      linkedAsset: p.oldAssetId ? {
        id: p.oldAssetId,
        assetCode: p.oldAssetCode || '',
        assetName: p.oldAssetName || '',
      } as OldDeviceConfig['linkedAsset'] : null,
    }));

    const configItems: AssetConfigItem[] = devicePlans.map((p, idx) => ({
      id: `config-edit-${idx}`,
      equipmentType: p.equipmentType as AssetConfigItem['equipmentType'],
      mode: p.existingAssetId ? 'link' : 'create',
      linkedAsset: p.existingAssetId ? {
        id: p.existingAssetId,
        assetCode: p.existingAssetCode || '',
        assetName: p.existingAssetName || '',
      } as AssetConfigItem['linkedAsset'] : null,
      template: p.brand ? { brand: p.brand, model: p.model } as AssetConfigItem['template'] : null,
      brand: p.brand,
      model: p.model,
      serialNumber: p.metadata?.serialNumber || '',
      metadata: p.metadata,
      originalStatus: p.status,
    }));

    setState({
      userName: workplace.userName,
      userEmail: workplace.userEmail || '',
      userEntraId: workplace.userEntraId || '',
      location: workplace.location || '',
      serviceId: workplace.serviceId,
      scheduledDate: workplace.scheduledDate || undefined,
      workplaceStatus: workplace.status,
      physicalWorkplaceId: workplace.physicalWorkplaceId,
      oldDevices,
      configItems,
      returningOldDevice: oldDevicePlans.length > 0,
    });
  }, []);

  // Reset to initial state
  const resetForm = useCallback(() => {
    setState(initialState);
  }, []);

  // Validation
  const hasTemplateErrors = state.configItems.some(
    (item) => item.mode === 'create' && !item.linkedAsset && !item.template && !item.brand
  );

  const hasOldDeviceConfigured = state.returningOldDevice &&
    state.oldDevices.some(d => d.serialNumber || d.linkedAsset);

  const hasConfigItemConfigured = state.configItems.some(item =>
    (item.mode === 'link' && item.linkedAsset) ||
    (item.mode === 'create' && (item.template || item.brand || item.serialNumber))
  );

  const hasDeviceConfigured = hasConfigItemConfigured || hasOldDeviceConfigured;

  // Equipment types that are assigned to the user (employee takes it with them)
  // All other equipment types are workplace-fixed (docking, monitor, keyboard, mouse)
  const USER_ASSIGNED_EQUIPMENT = ['laptop'];

  // Check if workplace-fixed assets are configured but no physical workplace is selected
  const hasWorkplaceFixedWithoutPhysicalWorkplace = state.configItems.some(item => {
    const isWorkplaceFixed = !USER_ASSIGNED_EQUIPMENT.includes(item.equipmentType);
    const isConfigured = (item.mode === 'link' && item.linkedAsset) ||
      (item.mode === 'create' && (item.template || item.brand || item.serialNumber));
    return isWorkplaceFixed && isConfigured && !state.physicalWorkplaceId;
  });

  const isFormValid = state.userName.trim() !== '' && !hasTemplateErrors;

  return {
    state,
    setUserName,
    setUserEmail,
    setUserEntraId,
    setLocation,
    setServiceId,
    setScheduledDate,
    setWorkplaceStatus,
    setPhysicalWorkplaceId,
    setOldDevices,
    setConfigItems,
    setReturningOldDevice,
    syncFromWorkplace,
    resetForm,
    isFormValid,
    hasTemplateErrors,
    hasDeviceConfigured,
    hasWorkplaceFixedWithoutPhysicalWorkplace,
  };
}

/**
 * assetPlanBuilder - Utility for building asset plans from form state
 *
 * Converts the form state (oldDevices, configItems) into AssetPlan[]
 * for API submission.
 */

import type { AssetPlan } from '../../../types/rollout';
import type { OldDeviceConfig } from '../OldDeviceConfigSection';
import type { AssetConfigItem } from '../WorkplaceConfigSection';

interface BuildAssetPlansOptions {
  oldDevices: OldDeviceConfig[];
  configItems: AssetConfigItem[];
  returningOldDevice: boolean;
}

/**
 * Build asset plans from form state for API submission
 */
export function buildAssetPlans({
  oldDevices,
  configItems,
  returningOldDevice,
}: BuildAssetPlansOptions): AssetPlan[] {
  const plans: AssetPlan[] = [];

  // Add old devices being returned (swap/inleveren)
  if (returningOldDevice && oldDevices.length > 0) {
    oldDevices.forEach((oldDevice) => {
      if (oldDevice.serialNumber || oldDevice.linkedAsset) {
        plans.push({
          equipmentType: 'laptop',
          createNew: false,
          requiresSerialNumber: false,
          requiresQRCode: false,
          status: 'pending',
          metadata: {
            oldSerial: oldDevice.serialNumber,
            isOldDevice: 'true',
            returnStatus: oldDevice.returnStatus || 'UitDienst',
          },
          ...(oldDevice.linkedAsset && {
            oldAssetId: oldDevice.linkedAsset.id,
            oldAssetCode: oldDevice.linkedAsset.assetCode,
            oldAssetName: oldDevice.linkedAsset.assetName,
          }),
        });
      }
    });
  }

  // Add all configured items from unified WorkplaceConfigSection
  configItems.forEach((item) => {
    const requiresSerial = item.equipmentType === 'laptop' || item.equipmentType === 'desktop' || item.equipmentType === 'docking';

    if (item.mode === 'link' && item.linkedAsset) {
      // Linking existing asset from inventory
      plans.push({
        equipmentType: item.equipmentType,
        createNew: false,
        requiresSerialNumber: false,
        requiresQRCode: false,
        // Preserve original status for completed items, otherwise use 'pending'
        status: item.originalStatus || 'pending',
        brand: item.linkedAsset.brand,
        model: item.linkedAsset.model,
        metadata: {
          ...(item.linkedAsset.serialNumber && { serialNumber: item.linkedAsset.serialNumber }),
          ...item.metadata,
        },
        existingAssetId: item.linkedAsset.id,
        existingAssetCode: item.linkedAsset.assetCode,
        existingAssetName: item.linkedAsset.assetName,
      });
    } else if (item.mode === 'create') {
      // Creating new asset or configured for creation
      const brand = item.template?.brand || item.brand;
      const model = item.template?.model || item.model;

      if (brand || model || item.serialNumber) {
        plans.push({
          equipmentType: item.equipmentType,
          createNew: true,
          requiresSerialNumber: requiresSerial,
          requiresQRCode: true,
          // Preserve original status for completed items, otherwise use 'pending'
          status: item.originalStatus || 'pending',
          brand,
          model,
          metadata: {
            ...(item.serialNumber && { serialNumber: item.serialNumber }),
            ...item.metadata,
          },
        });
      }
    }
  });

  return plans;
}

/**
 * Check if any config items have a laptop type
 */
export function hasLaptopConfig(configItems: AssetConfigItem[]): boolean {
  return configItems.some((item) => item.equipmentType === 'laptop');
}

/**
 * Redesigned RolloutWorkplaceDialog - Neumorphic Djoppie Style
 *
 * Modern, professional dialog for configuring workplace rollouts
 * Features: Integrated QR scanning, tab-based navigation, compact design
 * Design: Neumorphic soft UI with Djoppie orange accent (#FF7700)
 *
 * Neumorphic design: Soft shadows, extruded elements, carved inputs
 */

import { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Chip,
  Stack,
  useTheme,
  Autocomplete,
  CircularProgress,
  Switch,
  Alert,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Snackbar,
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import PersonIcon from '@mui/icons-material/Person';
import ComputerIcon from '@mui/icons-material/Computer';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HistoryIcon from '@mui/icons-material/History';
import LaptopIcon from '@mui/icons-material/Laptop';
import InventoryIcon from '@mui/icons-material/Inventory';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useCreateRolloutWorkplace, useUpdateRolloutWorkplace } from '../../hooks/useRollout';
import { OldDeviceConfigSection, type OldDeviceConfig } from './OldDeviceConfigSection';
import { WorkplaceConfigSection, type AssetConfigItem } from './WorkplaceConfigSection';
import type { EquipmentType } from '../../types/rollout';
import { graphApi } from '../../api/graph.api';
import { intuneApi } from '../../api/intune.api';
import QRScanner from '../scanner/QRScanner';
import type { GraphUser, IntuneDevice } from '../../types/graph.types';
import type {
  RolloutWorkplace,
  CreateRolloutWorkplace,
  UpdateRolloutWorkplace,
  AssetPlan,
} from '../../types/rollout';
import { getAssetByCode, getAssetBySerialNumber, getAssetsByOwner } from '../../api/assets.api';
import type { Asset } from '../../types/asset.types';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import AddIcon from '@mui/icons-material/Add';
import { logger } from '../../utils/logger';
import { normalizeAssetCode, validateAssetCode } from '../../utils/validation';
import { ROLLOUT_TIMING } from '../../constants/rollout.constants';

interface RolloutWorkplaceDialogProps {
  open: boolean;
  onClose: () => void;
  dayId: number;
  workplace?: RolloutWorkplace;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

// Asset scan mode types - includes index for old device targeting and itemId for config items
type AssetScanMode =
  | 'new-device'
  | 'update-asset'
  | { type: 'old-device'; index: number }
  | { type: 'config-item'; itemId: string }
  | null;

const RolloutWorkplaceDialog = ({ open, onClose, dayId, workplace }: RolloutWorkplaceDialogProps) => {
  const isEditMode = Boolean(workplace);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // User info state
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [location, setLocation] = useState('');
  const [serviceId, setServiceId] = useState<number | undefined>();
  const [scheduledDate, setScheduledDate] = useState<string | undefined>();

  // Old devices state (multiple) - Regio 2: Swap/Inleveren
  const [oldDevices, setOldDevices] = useState<OldDeviceConfig[]>([]);

  // Unified workplace configuration - combines "Nieuw apparaat" and "Update assets"
  const [configItems, setConfigItems] = useState<AssetConfigItem[]>([]);

  // Toggle states
  const [returningOldDevice, setReturningOldDevice] = useState(false);

  // QR Scanning state
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [scanMode, setScanMode] = useState<AssetScanMode>(null);
  const [activeTab, setActiveTab] = useState(0); // 0: scan, 1: manual
  const [manualAssetCode, setManualAssetCode] = useState('');
  const [isLoadingAsset, setIsLoadingAsset] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState('');
  const isProcessingScanRef = useRef(false);

  const createMutation = useCreateRolloutWorkplace();
  const updateMutation = useUpdateRolloutWorkplace();

  // User search state
  const [userOptions, setUserOptions] = useState<GraphUser[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userDevices, setUserDevices] = useState<IntuneDevice[]>([]);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Owner assets from Djoppie DB
  const [ownerAssets, setOwnerAssets] = useState<Asset[]>([]);
  const [ownerAssetsLoading, setOwnerAssetsLoading] = useState(false);

  // Device menu state (for clicking Intune/Owner assets)
  const [deviceMenuAnchor, setDeviceMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedDevice, setSelectedDevice] = useState<{ type: 'intune' | 'owner'; data: IntuneDevice | Asset } | null>(null);

  const handleUserSearch = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setUserOptions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setUserSearchLoading(true);
      try {
        const users = await graphApi.searchUsers(query, 10);
        setUserOptions(users);
      } catch {
        setUserOptions([]);
      } finally {
        setUserSearchLoading(false);
      }
    }, 300);
  }, []);

  // Sync workplace data when editing
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  const currentKey = workplace ? `${workplace.id}-${workplace.updatedAt}` : null;

  if (open && currentKey && currentKey !== syncedKey) {
    setSyncedKey(currentKey);
    setUserDevices([]);
    setUserOptions([]);
    setOwnerAssets([]);

    setUserName(workplace!.userName);
    setUserEmail(workplace!.userEmail || '');
    setLocation(workplace!.location || '');
    setServiceId(workplace!.serviceId);
    setScheduledDate(workplace!.scheduledDate || undefined);

    if (workplace!.userEmail) {
      // Fetch Intune devices
      intuneApi.getDevicesByUser(workplace!.userEmail)
        .then(devices => setUserDevices(devices))
        .catch(() => setUserDevices([]));

      // Fetch owner assets from Djoppie DB
      setOwnerAssetsLoading(true);
      getAssetsByOwner(workplace!.userEmail)
        .then(assets => setOwnerAssets(assets))
        .catch(() => setOwnerAssets([]))
        .finally(() => setOwnerAssetsLoading(false));
    }

    const plans = workplace!.assetPlans || [];
    const oldDevicePlans = plans.filter(p => p.metadata?.isOldDevice === 'true');

    if (oldDevicePlans.length > 0) {
      setReturningOldDevice(true);
      setOldDevices(oldDevicePlans.map((p, idx) => ({
        id: `old-device-edit-${idx}`,
        serialNumber: p.metadata?.oldSerial || '',
        linkedAsset: p.oldAssetId ? {
          id: p.oldAssetId,
          assetCode: p.oldAssetCode || '',
          assetName: p.oldAssetName || '',
        } as Asset : null,
      })));
    } else {
      setReturningOldDevice(false);
      setOldDevices([]);
    }

    // Load device plans into unified configItems
    const devicePlans = plans.filter(p => p.metadata?.isOldDevice !== 'true');
    setConfigItems(devicePlans.map((p, idx) => ({
      id: `config-edit-${idx}`,
      equipmentType: p.equipmentType as EquipmentType,
      mode: p.existingAssetId ? 'link' : 'create',
      linkedAsset: p.existingAssetId ? {
        id: p.existingAssetId,
        assetCode: p.existingAssetCode || '',
        assetName: p.existingAssetName || '',
      } as Asset : null,
      template: p.brand ? { brand: p.brand, model: p.model } as AssetConfigItem['template'] : null,
      brand: p.brand,
      model: p.model,
      serialNumber: p.metadata?.serialNumber || '',
      metadata: p.metadata,
    })));
  }

  // Reset when opening new workplace
  if (open && !workplace && syncedKey !== 'new') {
    setSyncedKey('new');
    setUserName('');
    setUserEmail('');
    setLocation('');
    setServiceId(undefined);
    setScheduledDate(undefined);
    setUserDevices([]);
    setUserOptions([]);
    setOwnerAssets([]);
    setOldDevices([]);
    setConfigItems([]);
    setReturningOldDevice(false);
  }

  if (!open && syncedKey !== null) {
    setSyncedKey(null);
  }

  // Open scan dialog
  const handleOpenScanDialog = (mode: AssetScanMode) => {
    setScanMode(mode);
    setScanDialogOpen(true);
    setActiveTab(0);
    setManualAssetCode('');
    setScanError('');
    setScanSuccess('');
    isProcessingScanRef.current = false;
  };

  // Close scan dialog
  const handleCloseScanDialog = () => {
    setScanDialogOpen(false);
    setScanMode(null);
    setActiveTab(0);
    setManualAssetCode('');
    setScanError('');
    setScanSuccess('');
  };

  // Handle QR scan success
  const handleScanSuccess = async (assetCode: string) => {
    if (isProcessingScanRef.current) {
      logger.warn('[RolloutWorkplaceDialog] Already processing a scan');
      return;
    }

    try {
      isProcessingScanRef.current = true;
      setIsLoadingAsset(true);
      setScanError('');

      const normalizedCode = normalizeAssetCode(assetCode);
      logger.info('[RolloutWorkplaceDialog] Processing scanned asset code:', normalizedCode);

      const validation = validateAssetCode(normalizedCode);
      if (!validation.isValid) {
        setScanError(validation.errorMessage || 'Invalid asset code format');
        return;
      }

      const asset = await getAssetByCode(normalizedCode);

      if (asset) {
        // Link the asset based on scan mode
        if (scanMode && typeof scanMode === 'object' && scanMode.type === 'config-item') {
          // Update specific config item with the linked asset
          setConfigItems(configItems.map(item =>
            item.id === scanMode.itemId
              ? { ...item, mode: 'link' as const, linkedAsset: asset }
              : item
          ));
          setScanSuccess(`Asset gekoppeld: ${asset.assetCode}`);
        } else if (scanMode && typeof scanMode === 'object' && scanMode.type === 'old-device') {
          // Update specific old device at index
          const updatedOldDevices = [...oldDevices];
          updatedOldDevices[scanMode.index] = {
            ...updatedOldDevices[scanMode.index],
            linkedAsset: asset,
            serialNumber: asset.serialNumber || '',
          };
          setOldDevices(updatedOldDevices);
          setScanSuccess(`Gekoppeld: ${asset.assetCode} - ${asset.assetName}`);
        }

        // Close dialog after short delay
        setTimeout(() => {
          handleCloseScanDialog();
        }, 1500);
      } else {
        setScanError(`Asset "${normalizedCode}" not found in the system`);
      }
    } catch (error) {
      logger.error('[RolloutWorkplaceDialog] Error fetching asset:', error);
      const err = error as Error & { response?: { status?: number } };
      if (err?.response?.status === 404) {
        setScanError(`Asset not found`);
      } else {
        setScanError('Error processing scan');
      }
    } finally {
      setIsLoadingAsset(false);
      setTimeout(() => {
        isProcessingScanRef.current = false;
      }, ROLLOUT_TIMING.SCAN_SUCCESS_CLEAR_DELAY_MS);
    }
  };

  // Handle manual asset search
  const handleManualSearch = async () => {
    if (!manualAssetCode.trim()) return;

    setIsLoadingAsset(true);
    setScanError('');

    try {
      const normalizedCode = normalizeAssetCode(manualAssetCode);
      const validation = validateAssetCode(normalizedCode);

      if (!validation.isValid) {
        setScanError(validation.errorMessage || 'Invalid asset code format');
        return;
      }

      const asset = await getAssetByCode(normalizedCode);

      if (asset) {
        await handleScanSuccess(normalizedCode); // Reuse scan success logic
      } else {
        setScanError(`Asset "${normalizedCode}" not found`);
      }
    } catch {
      setScanError('Error searching for asset');
    } finally {
      setIsLoadingAsset(false);
    }
  };

  // Handle old device serial search
  const handleOldDeviceSerialSearch = async (index: number, serial: string) => {
    if (!serial.trim()) return;

    try {
      const asset = await getAssetBySerialNumber(serial);
      const updatedOldDevices = [...oldDevices];
      updatedOldDevices[index] = {
        ...updatedOldDevices[index],
        linkedAsset: asset,
      };
      setOldDevices(updatedOldDevices);
    } catch {
      // Keep the serial but clear any linked asset
      const updatedOldDevices = [...oldDevices];
      updatedOldDevices[index] = {
        ...updatedOldDevices[index],
        linkedAsset: null,
      };
      setOldDevices(updatedOldDevices);
    }
  };

  // Handle scan request from OldDeviceConfigSection
  const handleOldDeviceScanRequest = (index: number) => {
    handleOpenScanDialog({ type: 'old-device', index });
  };

  // Handle click on Intune device or owner asset
  const handleDeviceClick = (event: React.MouseEvent<HTMLElement>, type: 'intune' | 'owner', data: IntuneDevice | Asset) => {
    setDeviceMenuAnchor(event.currentTarget);
    setSelectedDevice({ type, data });
  };

  const handleDeviceMenuClose = () => {
    setDeviceMenuAnchor(null);
    setSelectedDevice(null);
  };

  // Add device as new device
  const handleAddAsNewDevice = async () => {
    if (!selectedDevice) return;

    let asset: Asset | null = null;

    if (selectedDevice.type === 'owner') {
      // Direct asset from Djoppie DB
      asset = selectedDevice.data as Asset;
    } else {
      // Intune device - try to find matching asset by serial number
      const intuneDevice = selectedDevice.data as IntuneDevice;
      if (intuneDevice.serialNumber) {
        try {
          asset = await getAssetBySerialNumber(intuneDevice.serialNumber);
        } catch {
          // No matching asset found, create placeholder
        }
      }
    }

    const serialNumber = selectedDevice.type === 'intune'
      ? (selectedDevice.data as IntuneDevice).serialNumber || ''
      : (selectedDevice.data as Asset).serialNumber || '';

    const newConfigItem: AssetConfigItem = {
      id: `config-${Date.now()}-${Math.random()}`,
      equipmentType: 'laptop',
      mode: asset ? 'link' : 'create',
      linkedAsset: asset,
      brand: asset?.brand,
      model: asset?.model,
      serialNumber,
    };

    setConfigItems([...configItems, newConfigItem]);
    setScanSuccess(asset
      ? `Toegevoegd als nieuw: ${asset.assetCode}`
      : `Toegevoegd als nieuw apparaat`);
    handleDeviceMenuClose();
  };

  // Add device as old device (to be returned)
  const handleAddAsOldDevice = async () => {
    if (!selectedDevice) return;

    let asset: Asset | null = null;

    if (selectedDevice.type === 'owner') {
      // Direct asset from Djoppie DB
      asset = selectedDevice.data as Asset;
    } else {
      // Intune device - try to find matching asset by serial number
      const intuneDevice = selectedDevice.data as IntuneDevice;
      if (intuneDevice.serialNumber) {
        try {
          asset = await getAssetBySerialNumber(intuneDevice.serialNumber);
        } catch {
          // No matching asset found
        }
      }
    }

    const oldDevice: OldDeviceConfig = {
      id: `old-device-${Date.now()}-${Math.random()}`,
      serialNumber: selectedDevice.type === 'intune'
        ? (selectedDevice.data as IntuneDevice).serialNumber || ''
        : (selectedDevice.data as Asset).serialNumber || '',
      linkedAsset: asset,
    };

    setOldDevices([...oldDevices, oldDevice]);
    setReturningOldDevice(true);
    setScanSuccess(asset
      ? `Toegevoegd als in te leveren: ${asset.assetCode}`
      : `Toegevoegd als in te leveren apparaat`);
    handleDeviceMenuClose();
  };

  const buildAssetPlans = (): AssetPlan[] => {
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
      const requiresSerial = item.equipmentType === 'laptop' || item.equipmentType === 'desktop';

      if (item.mode === 'link' && item.linkedAsset) {
        // Linking existing asset from inventory
        plans.push({
          equipmentType: item.equipmentType,
          createNew: false,
          requiresSerialNumber: false,
          requiresQRCode: false,
          status: 'pending',
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
            status: 'pending',
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
  };

  const handleSave = async () => {
    const assetPlans = buildAssetPlans();

    // Determine if this is a laptop setup based on configured devices
    const hasLaptop = configItems.some(item => item.equipmentType === 'laptop');

    if (isEditMode && workplace) {
      const updateData: UpdateRolloutWorkplace = {
        userName,
        userEmail: userEmail || null,
        location: location || null,
        scheduledDate: scheduledDate || null,
        serviceId: serviceId || null,
        isLaptopSetup: hasLaptop,
        assetPlans,
        status: workplace.status,
        notes: workplace.notes || null,
      };
      await updateMutation.mutateAsync({ workplaceId: workplace.id, data: updateData });
    } else {
      const createData: CreateRolloutWorkplace = {
        rolloutDayId: dayId,
        userName,
        userEmail: userEmail || undefined,
        location: location || undefined,
        scheduledDate: scheduledDate || undefined,
        serviceId,
        isLaptopSetup: hasLaptop,
        assetPlans,
      };
      await createMutation.mutateAsync({ dayId, data: createData });
    }

    handleClose();
  };

  const handleClose = () => {
    onClose();
  };

  // Check if any item needs a template but doesn't have one
  const devicesNeedTemplates = configItems.some(
    (item) => item.mode === 'create' && !item.linkedAsset && !item.template && !item.brand
  );

  const hasTemplateErrors = devicesNeedTemplates;
  const hasOldDeviceConfigured = returningOldDevice && oldDevices.some(d => d.serialNumber || d.linkedAsset);
  const hasConfigItemConfigured = configItems.some(item =>
    (item.mode === 'link' && item.linkedAsset) ||
    (item.mode === 'create' && (item.template || item.brand || item.serialNumber))
  );
  const hasDeviceConfigured = hasConfigItemConfigured || hasOldDeviceConfigured;
  const isFormValid = userName.trim() && !hasTemplateErrors;

  return (
    <>
      {/* Main Dialog - Neumorphic Style with Reduced Glow */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        disableRestoreFocus
        PaperProps={{
          sx: {
            borderRadius: 4,
            border: 'none',
            bgcolor: isDark ? 'rgba(30, 35, 40, 0.92)' : 'rgba(232, 238, 243, 0.92)',
            backdropFilter: 'blur(20px)',
            // Reduced glow with subtler shadows for professional look
            boxShadow: isDark
              ? '0px 8px 32px rgba(0, 0, 0, 0.5), 0px 2px 8px rgba(0, 0, 0, 0.3)'
              : '0px 8px 32px rgba(150, 155, 160, 0.3), 0px 2px 8px rgba(180, 185, 190, 0.2)',
            overflow: 'hidden',
            // 3D depth perception with transform
            transform: 'perspective(1000px) translateZ(0)',
            transformStyle: 'preserve-3d',
          },
        }}
      >
        {/* Header - Neumorphic with 3D Depth (Layer 1 - Front) */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
            bgcolor: isDark ? '#1e2328' : '#e8eef3',
            borderBottom: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            position: 'relative',
            zIndex: 3,
            transform: 'translateZ(20px)',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            {/* Neumorphic Icon Container with 3D depth */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: 3,
                bgcolor: isDark ? '#1e2328' : '#e8eef3',
                // 3D layered shadows for depth perception
                boxShadow: isDark
                  ? '8px 8px 16px #161a1d, -8px -8px 16px #262c33, inset 0 0 0 1px rgba(255, 119, 0, 0.3)'
                  : '8px 8px 16px #c5cad0, -8px -8px 16px #ffffff, inset 0 0 0 1px rgba(255, 119, 0, 0.2)',
                transition: 'all 0.3s ease',
                transform: 'translateZ(10px)',
              }}
            >
              <ComputerIcon sx={{ fontSize: '1.6rem', color: '#FF7700', filter: 'drop-shadow(0 2px 4px rgba(255, 119, 0, 0.3))' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight={800} sx={{
                color: '#FF7700',
                letterSpacing: '-0.02em',
                textShadow: isDark ? '0 2px 10px rgba(255, 119, 0, 0.3)' : 'none',
              }}>
                {isEditMode ? 'Werkplek Bewerken' : 'Nieuwe Werkplek'}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)' }}>
                {isEditMode ? 'Pas de werkplekconfiguratie aan' : 'Configureer een nieuwe werkplek voor rollout'}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <DialogContent sx={{
          p: 3,
          bgcolor: isDark ? '#1e2328' : '#e8eef3',
          position: 'relative',
          zIndex: 2,
          transform: 'translateZ(5px)',
        }}>
          {/* User Information Section - Neumorphic Card with 3D depth */}
          <Box
            sx={{
              mb: 3,
              p: 2.5,
              borderRadius: 3,
              bgcolor: isDark ? '#1e2328' : '#e8eef3',
              // Enhanced shadows for 3D depth perception
              boxShadow: isDark
                ? '8px 8px 16px #161a1d, -8px -8px 16px #262c33, 0 4px 12px rgba(0, 0, 0, 0.2)'
                : '8px 8px 16px #c5cad0, -8px -8px 16px #ffffff, 0 4px 12px rgba(150, 155, 160, 0.15)',
              transform: 'translateZ(12px)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateZ(15px)',
                boxShadow: isDark
                  ? '10px 10px 20px #161a1d, -10px -10px 20px #262c33, 0 6px 16px rgba(0, 0, 0, 0.25)'
                  : '10px 10px 20px #c5cad0, -10px -10px 20px #ffffff, 0 6px 16px rgba(150, 155, 160, 0.2)',
              },
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: isDark ? '#1e2328' : '#e8eef3',
                  boxShadow: isDark
                    ? '3px 3px 6px #161a1d, -3px -3px 6px #262c33'
                    : '3px 3px 6px #c5cad0, -3px -3px 6px #ffffff',
                }}
              >
                <PersonIcon sx={{ color: '#FF7700', fontSize: '1.2rem' }} />
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: isDark ? '#fff' : '#333' }}>
                Gebruiker Informatie
              </Typography>
            </Stack>

            <Stack spacing={2.5}>
              <Autocomplete
                freeSolo
                open={userDropdownOpen}
                onOpen={() => {
                  if (userName.length >= 2) setUserDropdownOpen(true);
                }}
                onClose={() => setUserDropdownOpen(false)}
                options={userOptions}
                getOptionLabel={(option) =>
                  typeof option === 'string' ? option : option.displayName || ''
                }
                filterOptions={(x) => x}
                inputValue={userName}
                onInputChange={(_, value, reason) => {
                  setUserName(value);
                  if (reason === 'input') {
                    handleUserSearch(value);
                    if (value.length >= 2) {
                      setUserDropdownOpen(true);
                    } else {
                      setUserDropdownOpen(false);
                    }
                  }
                }}
                onChange={(_, value) => {
                  setUserDropdownOpen(false);
                  if (value && typeof value !== 'string') {
                    setUserName(value.displayName || '');
                    const upn = value.mail || value.userPrincipalName || '';
                    setUserEmail(upn);
                    if (value.officeLocation) setLocation(value.officeLocation);
                    if (upn) {
                      // Fetch Intune devices
                      intuneApi.getDevicesByUser(upn)
                        .then(devices => setUserDevices(devices))
                        .catch(() => setUserDevices([]));

                      // Fetch owner assets from Djoppie DB
                      setOwnerAssetsLoading(true);
                      getAssetsByOwner(upn)
                        .then(assets => setOwnerAssets(assets))
                        .catch(() => setOwnerAssets([]))
                        .finally(() => setOwnerAssetsLoading(false));
                    }
                  }
                }}
                loading={userSearchLoading}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <li {...otherProps} key={key}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {option.displayName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.mail || option.userPrincipalName}
                          {option.department ? ` — ${option.department}` : ''}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Gebruikersnaam"
                    required
                    fullWidth
                    helperText="Typ minimaal 2 letters om te zoeken"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {userSearchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: isDark ? '#1e2328' : '#e8eef3',
                        borderRadius: 2,
                        boxShadow: isDark
                          ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
                          : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff',
                        '& fieldset': { border: 'none' },
                        '&:hover': {
                          boxShadow: isDark
                            ? 'inset 4px 4px 8px #161a1d, inset -4px -4px 8px #262c33, 0 0 0 2px rgba(255, 119, 0, 0.2)'
                            : 'inset 4px 4px 8px #c5cad0, inset -4px -4px 8px #ffffff, 0 0 0 2px rgba(255, 119, 0, 0.15)',
                        },
                        '&.Mui-focused': {
                          boxShadow: isDark
                            ? 'inset 4px 4px 8px #161a1d, inset -4px -4px 8px #262c33, 0 0 0 2px rgba(255, 119, 0, 0.4)'
                            : 'inset 4px 4px 8px #c5cad0, inset -4px -4px 8px #ffffff, 0 0 0 2px rgba(255, 119, 0, 0.3)',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                        '&.Mui-focused': { color: '#FF7700' },
                      },
                    }}
                  />
                )}
              />

              <TextField
                label="E-mailadres"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                fullWidth
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: isDark ? '#1e2328' : '#e8eef3',
                    borderRadius: 2,
                    boxShadow: isDark
                      ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
                      : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff',
                    '& fieldset': { border: 'none' },
                    '&:hover, &.Mui-focused': {
                      boxShadow: isDark
                        ? 'inset 4px 4px 8px #161a1d, inset -4px -4px 8px #262c33, 0 0 0 2px rgba(255, 119, 0, 0.3)'
                        : 'inset 4px 4px 8px #c5cad0, inset -4px -4px 8px #ffffff, 0 0 0 2px rgba(255, 119, 0, 0.2)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                    '&.Mui-focused': { color: '#FF7700' },
                  },
                }}
              />

              <TextField
                label="Locatie"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                fullWidth
                size="small"
                placeholder="Gebouw A - 2e verdieping - Kamer 205"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: isDark ? '#1e2328' : '#e8eef3',
                    borderRadius: 2,
                    boxShadow: isDark
                      ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
                      : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff',
                    '& fieldset': { border: 'none' },
                    '&:hover, &.Mui-focused': {
                      boxShadow: isDark
                        ? 'inset 4px 4px 8px #161a1d, inset -4px -4px 8px #262c33, 0 0 0 2px rgba(255, 119, 0, 0.3)'
                        : 'inset 4px 4px 8px #c5cad0, inset -4px -4px 8px #ffffff, 0 0 0 2px rgba(255, 119, 0, 0.2)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                    '&.Mui-focused': { color: '#FF7700' },
                  },
                }}
              />

              <TextField
                type="date"
                label="Geplande datum"
                value={scheduledDate ? scheduledDate.split('T')[0] : ''}
                onChange={(e) => setScheduledDate(e.target.value || undefined)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon sx={{ fontSize: '1rem', color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: isDark ? '#1e2328' : '#e8eef3',
                    borderRadius: 2,
                    boxShadow: isDark
                      ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
                      : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff',
                    '& fieldset': { border: 'none' },
                    '&:hover, &.Mui-focused': {
                      boxShadow: isDark
                        ? 'inset 4px 4px 8px #161a1d, inset -4px -4px 8px #262c33, 0 0 0 2px rgba(255, 119, 0, 0.3)'
                        : 'inset 4px 4px 8px #c5cad0, inset -4px -4px 8px #ffffff, 0 0 0 2px rgba(255, 119, 0, 0.2)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                    '&.Mui-focused': { color: '#FF7700' },
                  },
                }}
              />
            </Stack>
          </Box>

          {/* Intune Devices Display - Neumorphic Inset with depth, CLICKABLE */}
          {userDevices.length > 0 && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                borderRadius: 3,
                bgcolor: isDark ? '#1e2328' : '#e8eef3',
                boxShadow: isDark
                  ? 'inset 5px 5px 10px #161a1d, inset -5px -5px 10px #262c33'
                  : 'inset 5px 5px 10px #c5cad0, inset -5px -5px 10px #ffffff',
                transform: 'translateZ(6px)',
              }}
            >
              <Typography
                variant="caption"
                fontWeight={700}
                sx={{
                  mb: 1.5,
                  display: 'block',
                  color: '#2196F3',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                HUIDIGE APPARATEN (INTUNE) — Klik om toe te voegen
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {userDevices.map((device) => (
                  <Chip
                    key={device.id || device.serialNumber}
                    icon={<LaptopIcon sx={{ fontSize: '0.9rem !important' }} />}
                    label={`${device.deviceName || '?'} — ${device.serialNumber || ''}`}
                    size="small"
                    onClick={(e) => handleDeviceClick(e, 'intune', device)}
                    sx={{
                      bgcolor: isDark ? '#1e2328' : '#e8eef3',
                      color: '#2196F3',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: isDark
                        ? '2px 2px 4px #161a1d, -2px -2px 4px #262c33'
                        : '2px 2px 4px #c5cad0, -2px -2px 4px #ffffff',
                      transition: 'all 0.2s ease',
                      '& .MuiChip-icon': { color: '#2196F3' },
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: isDark
                          ? '4px 4px 8px #161a1d, -4px -4px 8px #262c33, 0 0 0 2px rgba(33, 150, 243, 0.4)'
                          : '4px 4px 8px #c5cad0, -4px -4px 8px #ffffff, 0 0 0 2px rgba(33, 150, 243, 0.3)',
                      },
                      '&:active': {
                        transform: 'translateY(0)',
                        boxShadow: isDark
                          ? 'inset 2px 2px 4px #161a1d, inset -2px -2px 4px #262c33'
                          : 'inset 2px 2px 4px #c5cad0, inset -2px -2px 4px #ffffff',
                      },
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Owner Assets from Djoppie DB - CLICKABLE */}
          {(ownerAssets.length > 0 || ownerAssetsLoading) && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                borderRadius: 3,
                bgcolor: isDark ? '#1e2328' : '#e8eef3',
                boxShadow: isDark
                  ? 'inset 5px 5px 10px #161a1d, inset -5px -5px 10px #262c33'
                  : 'inset 5px 5px 10px #c5cad0, inset -5px -5px 10px #ffffff',
                transform: 'translateZ(6px)',
              }}
            >
              <Typography
                variant="caption"
                fontWeight={700}
                sx={{
                  mb: 1.5,
                  display: 'block',
                  color: '#FF7700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                ASSETS IN DJOPPIE DB — Klik om toe te voegen
              </Typography>
              {ownerAssetsLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} sx={{ color: '#FF7700' }} />
                  <Typography variant="caption" color="text.secondary">
                    Assets laden...
                  </Typography>
                </Box>
              ) : (
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {ownerAssets.map((asset) => (
                    <Chip
                      key={asset.id}
                      icon={<ComputerIcon sx={{ fontSize: '0.9rem !important' }} />}
                      label={`${asset.assetCode} — ${asset.assetName || asset.alias || ''}`}
                      size="small"
                      onClick={(e) => handleDeviceClick(e, 'owner', asset)}
                      sx={{
                        bgcolor: isDark ? '#1e2328' : '#e8eef3',
                        color: '#FF7700',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: isDark
                          ? '2px 2px 4px #161a1d, -2px -2px 4px #262c33'
                          : '2px 2px 4px #c5cad0, -2px -2px 4px #ffffff',
                        transition: 'all 0.2s ease',
                        '& .MuiChip-icon': { color: '#FF7700' },
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: isDark
                            ? '4px 4px 8px #161a1d, -4px -4px 8px #262c33, 0 0 0 2px rgba(255, 119, 0, 0.4)'
                            : '4px 4px 8px #c5cad0, -4px -4px 8px #ffffff, 0 0 0 2px rgba(255, 119, 0, 0.3)',
                        },
                        '&:active': {
                          transform: 'translateY(0)',
                          boxShadow: isDark
                            ? 'inset 2px 2px 4px #161a1d, inset -2px -2px 4px #262c33'
                            : 'inset 2px 2px 4px #c5cad0, inset -2px -2px 4px #ffffff',
                        },
                      }}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          )}

          {/* Neumorphic Divider */}
          <Box
            sx={{
              my: 3,
              height: 2,
              borderRadius: 1,
              bgcolor: isDark ? '#1e2328' : '#e8eef3',
              boxShadow: isDark
                ? 'inset 1px 1px 2px #161a1d, inset -1px -1px 2px #262c33'
                : 'inset 1px 1px 2px #c5cad0, inset -1px -1px 2px #ffffff',
            }}
          />

          {/* Device Configuration Section */}
          {/* Unified Workplace Configuration Section */}
          <Box sx={{ mb: 2.5 }}>
            <WorkplaceConfigSection
              items={configItems}
              onChange={setConfigItems}
              onScanRequest={(itemId) => handleOpenScanDialog({ type: 'config-item', itemId })}
            />
          </Box>

          {/* Old Device Section - Neumorphic (Swap/Inleveren) */}
          <Box
            sx={{
              mb: 2.5,
              p: 2.5,
              borderRadius: 3,
              bgcolor: isDark ? '#1e2328' : '#e8eef3',
              boxShadow: returningOldDevice
                ? (isDark
                  ? '6px 6px 12px #161a1d, -6px -6px 12px #262c33, inset 0 0 0 2px rgba(255, 152, 0, 0.4)'
                  : '6px 6px 12px #c5cad0, -6px -6px 12px #ffffff, inset 0 0 0 2px rgba(255, 152, 0, 0.3)')
                : (isDark
                  ? '5px 5px 10px #161a1d, -5px -5px 10px #262c33'
                  : '5px 5px 10px #c5cad0, -5px -5px 10px #ffffff'),
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: returningOldDevice ? 2 : 0 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: isDark ? '#1e2328' : '#e8eef3',
                    boxShadow: returningOldDevice
                      ? (isDark
                        ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
                        : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff')
                      : (isDark
                        ? '3px 3px 6px #161a1d, -3px -3px 6px #262c33'
                        : '3px 3px 6px #c5cad0, -3px -3px 6px #ffffff'),
                    transition: 'all 0.3s ease',
                  }}
                >
                  <HistoryIcon sx={{
                    color: returningOldDevice ? 'warning.main' : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)'),
                    fontSize: '1.3rem',
                    transition: 'color 0.3s ease',
                  }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: isDark ? '#fff' : '#333' }}>
                    Toestellen inleveren
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}>
                    Registreer apparaten die worden ingeleverd
                  </Typography>
                </Box>
                {oldDevices.length > 0 && (
                  <Chip
                    label={`${oldDevices.length} ${oldDevices.length === 1 ? 'toestel' : 'toestellen'}`}
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      bgcolor: isDark ? '#1e2328' : '#e8eef3',
                      color: 'warning.main',
                      border: 'none',
                      boxShadow: isDark
                        ? '2px 2px 4px #161a1d, -2px -2px 4px #262c33'
                        : '2px 2px 4px #c5cad0, -2px -2px 4px #ffffff',
                    }}
                  />
                )}
              </Stack>
              <Switch
                checked={returningOldDevice}
                onChange={(e) => setReturningOldDevice(e.target.checked)}
                color="warning"
                sx={{
                  '& .MuiSwitch-track': {
                    borderRadius: 2,
                    bgcolor: isDark ? '#161a1d' : '#d0d5db',
                  },
                }}
              />
            </Stack>

            {returningOldDevice && (
              <Box sx={{ mt: 2, pt: 2 }}>
                <OldDeviceConfigSection
                  devices={oldDevices}
                  onChange={setOldDevices}
                  onScanRequest={handleOldDeviceScanRequest}
                  onSerialSearch={handleOldDeviceSerialSearch}
                />
              </Box>
            )}
          </Box>

          {/* Validation Warnings - Neumorphic */}
          {hasTemplateErrors && (
            <Alert
              severity="warning"
              sx={{
                mb: 2,
                borderRadius: 2,
                bgcolor: isDark ? '#1e2328' : '#e8eef3',
                boxShadow: isDark
                  ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
                  : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff',
                border: 'none',
              }}
            >
              Selecteer een template voor alle toegevoegde apparaten
            </Alert>
          )}
          {!hasDeviceConfigured && userName.trim() && (
            <Alert
              severity="info"
              sx={{
                mb: 2,
                borderRadius: 2,
                bgcolor: isDark ? '#1e2328' : '#e8eef3',
                boxShadow: isDark
                  ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
                  : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff',
                border: 'none',
              }}
            >
              Voeg minimaal één apparaat toe of selecteer een oud toestel
            </Alert>
          )}
        </DialogContent>

        {/* Actions - Neumorphic */}
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            bgcolor: isDark ? '#1e2328' : '#e8eef3',
            borderTop: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            gap: 2,
          }}
        >
          <Button
            onClick={handleClose}
            sx={{
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 2,
              bgcolor: isDark ? '#1e2328' : '#e8eef3',
              color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
              boxShadow: isDark
                ? '4px 4px 8px #161a1d, -4px -4px 8px #262c33'
                : '4px 4px 8px #c5cad0, -4px -4px 8px #ffffff',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: isDark ? '#1e2328' : '#e8eef3',
                boxShadow: isDark
                  ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
                  : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff',
              },
            }}
          >
            Annuleren
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isFormValid || createMutation.isPending || updateMutation.isPending}
            sx={{
              fontWeight: 700,
              px: 4,
              py: 1,
              borderRadius: 2,
              bgcolor: isDark ? '#1e2328' : '#e8eef3',
              color: '#FF7700',
              boxShadow: isDark
                ? '4px 4px 8px #161a1d, -4px -4px 8px #262c33, inset 0 0 0 2px rgba(255, 119, 0, 0.3)'
                : '4px 4px 8px #c5cad0, -4px -4px 8px #ffffff, inset 0 0 0 2px rgba(255, 119, 0, 0.2)',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: isDark ? '#1e2328' : '#e8eef3',
                boxShadow: isDark
                  ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33, inset 0 0 0 2px rgba(255, 119, 0, 0.5)'
                  : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff, inset 0 0 0 2px rgba(255, 119, 0, 0.4)',
              },
              '&.Mui-disabled': {
                color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)',
                boxShadow: isDark
                  ? 'inset 2px 2px 4px #161a1d, inset -2px -2px 4px #262c33'
                  : 'inset 2px 2px 4px #c5cad0, inset -2px -2px 4px #ffffff',
              },
            }}
          >
            {createMutation.isPending || updateMutation.isPending ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Scan Dialog - Neumorphic */}
      <Dialog
        open={scanDialogOpen}
        onClose={handleCloseScanDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            border: 'none',
            bgcolor: isDark ? 'rgba(30, 35, 40, 0.85)' : 'rgba(232, 238, 243, 0.85)',
            backdropFilter: 'blur(20px)',
            boxShadow: isDark
              ? '20px 20px 60px #161a1d, -20px -20px 60px #262c33'
              : '20px 20px 60px #c5cad0, -20px -20px 60px #ffffff',
            overflow: 'hidden',
          },
        }}
      >
        {/* Scan Dialog Header - Neumorphic */}
        <Box
          sx={{
            px: 3,
            py: 2,
            bgcolor: isDark ? '#1e2328' : '#e8eef3',
            borderBottom: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: 2.5,
                bgcolor: isDark ? '#1e2328' : '#e8eef3',
                boxShadow: isDark
                  ? '4px 4px 8px #161a1d, -4px -4px 8px #262c33, inset 0 0 0 1px rgba(255, 119, 0, 0.3)'
                  : '4px 4px 8px #c5cad0, -4px -4px 8px #ffffff, inset 0 0 0 1px rgba(255, 119, 0, 0.2)',
              }}
            >
              <QrCodeScannerIcon sx={{ color: '#FF7700', fontSize: '1.4rem', filter: 'drop-shadow(0 2px 4px rgba(255, 119, 0, 0.3))' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: '#FF7700', textShadow: isDark ? '0 2px 8px rgba(255, 119, 0, 0.3)' : 'none' }}>
                Scan Asset QR-code
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}>
                {scanMode === 'update-asset' ? 'Koppel bestaand asset uit inventaris' : scanMode === 'new-device' ? 'Link nieuw toestel' : 'Link oud toestel in te leveren'}
              </Typography>
            </Box>
          </Stack>
          <IconButton
            onClick={handleCloseScanDialog}
            size="small"
            sx={{
              bgcolor: isDark ? '#1e2328' : '#e8eef3',
              boxShadow: isDark
                ? '3px 3px 6px #161a1d, -3px -3px 6px #262c33'
                : '3px 3px 6px #c5cad0, -3px -3px 6px #ffffff',
              '&:hover': {
                bgcolor: isDark ? '#1e2328' : '#e8eef3',
                boxShadow: isDark
                  ? 'inset 2px 2px 4px #161a1d, inset -2px -2px 4px #262c33'
                  : 'inset 2px 2px 4px #c5cad0, inset -2px -2px 4px #ffffff',
              },
            }}
          >
            <CloseIcon sx={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)' }} />
          </IconButton>
        </Box>

        {/* Tabs - Neumorphic */}
        <Box sx={{ px: 2, py: 1.5, bgcolor: isDark ? '#1e2328' : '#e8eef3' }}>
          <Box
            sx={{
              borderRadius: 2,
              bgcolor: isDark ? '#1e2328' : '#e8eef3',
              boxShadow: isDark
                ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
                : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff',
              p: 0.5,
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="fullWidth"
              sx={{
                minHeight: 44,
                '& .MuiTabs-indicator': {
                  display: 'none',
                },
                '& .MuiTab-root': {
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  minHeight: 44,
                  borderRadius: 1.5,
                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                  transition: 'all 0.3s ease',
                },
                '& .Mui-selected': {
                  color: '#FF7700',
                  bgcolor: isDark ? '#1e2328' : '#e8eef3',
                  boxShadow: isDark
                    ? '3px 3px 6px #161a1d, -3px -3px 6px #262c33'
                    : '3px 3px 6px #c5cad0, -3px -3px 6px #ffffff',
                },
              }}
            >
              <Tab icon={<QrCodeScannerIcon />} label="QR Scanner" iconPosition="start" />
              <Tab icon={<KeyboardIcon />} label="Manual Entry" iconPosition="start" />
            </Tabs>
          </Box>
        </Box>

        <DialogContent sx={{ p: 3, bgcolor: isDark ? '#1e2328' : '#e8eef3' }}>
          {/* QR Scanner Tab */}
          <TabPanel value={activeTab} index={0}>
            <Box
              sx={{
                borderRadius: 3,
                bgcolor: isDark ? '#1e2328' : '#e8eef3',
                boxShadow: isDark
                  ? 'inset 4px 4px 8px #161a1d, inset -4px -4px 8px #262c33'
                  : 'inset 4px 4px 8px #c5cad0, inset -4px -4px 8px #ffffff',
                p: 2,
              }}
            >
              <QRScanner
                onScanSuccess={handleScanSuccess}
                onScanError={(error) => setScanError(error)}
              />
            </Box>
          </TabPanel>

          {/* Manual Entry Tab */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Asset Code"
                value={manualAssetCode}
                onChange={(e) => {
                  setManualAssetCode(e.target.value);
                  setScanError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleManualSearch();
                  }
                }}
                placeholder="bijv. LAPTOP001"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleManualSearch}
                        disabled={!manualAssetCode.trim() || isLoadingAsset}
                        sx={{
                          bgcolor: isDark ? '#1e2328' : '#e8eef3',
                          boxShadow: isDark
                            ? '2px 2px 4px #161a1d, -2px -2px 4px #262c33'
                            : '2px 2px 4px #c5cad0, -2px -2px 4px #ffffff',
                          '&:hover': {
                            bgcolor: isDark ? '#1e2328' : '#e8eef3',
                            boxShadow: isDark
                              ? 'inset 2px 2px 4px #161a1d, inset -2px -2px 4px #262c33'
                              : 'inset 2px 2px 4px #c5cad0, inset -2px -2px 4px #ffffff',
                          },
                        }}
                      >
                        {isLoadingAsset ? <CircularProgress size={20} /> : <SearchIcon sx={{ color: '#FF7700' }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: isDark ? '#1e2328' : '#e8eef3',
                    borderRadius: 2,
                    boxShadow: isDark
                      ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
                      : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff',
                    '& fieldset': { border: 'none' },
                    '&:hover, &.Mui-focused': {
                      boxShadow: isDark
                        ? 'inset 4px 4px 8px #161a1d, inset -4px -4px 8px #262c33, 0 0 0 2px rgba(255, 119, 0, 0.3)'
                        : 'inset 4px 4px 8px #c5cad0, inset -4px -4px 8px #ffffff, 0 0 0 2px rgba(255, 119, 0, 0.2)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                    '&.Mui-focused': { color: '#FF7700' },
                  },
                }}
              />
              <Button
                fullWidth
                onClick={handleManualSearch}
                disabled={!manualAssetCode.trim() || isLoadingAsset}
                sx={{
                  mt: 2,
                  py: 1.5,
                  borderRadius: 2,
                  bgcolor: isDark ? '#1e2328' : '#e8eef3',
                  color: '#FF7700',
                  fontWeight: 700,
                  boxShadow: isDark
                    ? '4px 4px 8px #161a1d, -4px -4px 8px #262c33, inset 0 0 0 2px rgba(255, 119, 0, 0.3)'
                    : '4px 4px 8px #c5cad0, -4px -4px 8px #ffffff, inset 0 0 0 2px rgba(255, 119, 0, 0.2)',
                  '&:hover': {
                    bgcolor: isDark ? '#1e2328' : '#e8eef3',
                    boxShadow: isDark
                      ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33, inset 0 0 0 2px rgba(255, 119, 0, 0.5)'
                      : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff, inset 0 0 0 2px rgba(255, 119, 0, 0.4)',
                  },
                  '&.Mui-disabled': {
                    color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)',
                    boxShadow: isDark
                      ? 'inset 2px 2px 4px #161a1d, inset -2px -2px 4px #262c33'
                      : 'inset 2px 2px 4px #c5cad0, inset -2px -2px 4px #ffffff',
                  },
                }}
              >
                {isLoadingAsset ? 'Zoeken...' : 'Zoek Asset'}
              </Button>
            </Box>
          </TabPanel>

          {isLoadingAsset && (
            <Alert
              severity="info"
              sx={{
                mt: 2,
                borderRadius: 2,
                bgcolor: isDark ? '#1e2328' : '#e8eef3',
                boxShadow: isDark
                  ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
                  : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff',
                border: 'none',
              }}
            >
              Searching for asset...
            </Alert>
          )}
        </DialogContent>
      </Dialog>

      {/* Scan Error Snackbar - Neumorphic */}
      <Snackbar
        open={!!scanError}
        autoHideDuration={4000}
        onClose={() => setScanError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="error"
          onClose={() => setScanError('')}
          sx={{
            fontWeight: 600,
            borderRadius: 2,
            bgcolor: isDark ? '#2a1f1f' : '#fef2f2',
            boxShadow: isDark
              ? '6px 6px 12px #161a1d, -6px -6px 12px #262c33'
              : '6px 6px 12px #c5cad0, -6px -6px 12px #ffffff',
            border: 'none',
          }}
        >
          {scanError}
        </Alert>
      </Snackbar>

      {/* Scan Success Snackbar - Neumorphic */}
      <Snackbar
        open={!!scanSuccess}
        autoHideDuration={ROLLOUT_TIMING.SNACKBAR_AUTO_HIDE_MS}
        onClose={() => setScanSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          onClose={() => setScanSuccess('')}
          sx={{
            fontWeight: 600,
            borderRadius: 2,
            bgcolor: isDark ? '#1f2a1f' : '#f0fdf4',
            boxShadow: isDark
              ? '6px 6px 12px #161a1d, -6px -6px 12px #262c33'
              : '6px 6px 12px #c5cad0, -6px -6px 12px #ffffff',
            border: 'none',
          }}
        >
          {scanSuccess}
        </Alert>
      </Snackbar>

      {/* Device Selection Menu - Neumorphic */}
      <Menu
        anchorEl={deviceMenuAnchor}
        open={Boolean(deviceMenuAnchor)}
        onClose={handleDeviceMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: isDark ? '#1e2328' : '#e8eef3',
            boxShadow: isDark
              ? '8px 8px 16px #161a1d, -8px -8px 16px #262c33'
              : '8px 8px 16px #c5cad0, -8px -8px 16px #ffffff',
            border: 'none',
            minWidth: 220,
            mt: 1,
          },
        }}
      >
        <MenuItem
          onClick={handleAddAsNewDevice}
          sx={{
            py: 1.5,
            px: 2,
            borderRadius: 1.5,
            mx: 1,
            my: 0.5,
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: isDark ? 'rgba(76, 175, 80, 0.15)' : 'rgba(76, 175, 80, 0.1)',
              boxShadow: isDark
                ? 'inset 2px 2px 4px #161a1d, inset -2px -2px 4px #262c33'
                : 'inset 2px 2px 4px #c5cad0, inset -2px -2px 4px #ffffff',
            },
          }}
        >
          <ListItemIcon>
            <AddIcon sx={{ color: '#4CAF50' }} />
          </ListItemIcon>
          <ListItemText
            primary="Toevoegen als nieuw apparaat"
            secondary="Wordt toegekend aan deze werkplek"
            primaryTypographyProps={{ fontWeight: 600, color: '#4CAF50', fontSize: '0.9rem' }}
            secondaryTypographyProps={{ fontSize: '0.75rem', color: 'text.secondary' }}
          />
        </MenuItem>
        <MenuItem
          onClick={handleAddAsOldDevice}
          sx={{
            py: 1.5,
            px: 2,
            borderRadius: 1.5,
            mx: 1,
            my: 0.5,
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: isDark ? 'rgba(255, 152, 0, 0.15)' : 'rgba(255, 152, 0, 0.1)',
              boxShadow: isDark
                ? 'inset 2px 2px 4px #161a1d, inset -2px -2px 4px #262c33'
                : 'inset 2px 2px 4px #c5cad0, inset -2px -2px 4px #ffffff',
            },
          }}
        >
          <ListItemIcon>
            <HistoryIcon sx={{ color: '#FF9800' }} />
          </ListItemIcon>
          <ListItemText
            primary="Toevoegen als oud apparaat"
            secondary="Wordt ingeleverd / vervangen"
            primaryTypographyProps={{ fontWeight: 600, color: '#FF9800', fontSize: '0.9rem' }}
            secondaryTypographyProps={{ fontSize: '0.75rem', color: 'text.secondary' }}
          />
        </MenuItem>
      </Menu>
    </>
  );
};

export default RolloutWorkplaceDialog;

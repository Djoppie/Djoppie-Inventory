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
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useCreateRolloutWorkplace, useUpdateRolloutWorkplace } from '../../hooks/useRollout';
import { MultiDeviceConfigSection, type DeviceConfig } from './MultiDeviceConfigSection';
import { OldDeviceConfigSection, type OldDeviceConfig } from './OldDeviceConfigSection';
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
import { getAssetByCode, getAssetBySerialNumber } from '../../api/assets.api';
import type { Asset } from '../../types/asset.types';
import { logger } from '../../utils/logger';
import { normalizeAssetCode, validateAssetCode } from '../../utils/validation';

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

// Asset scan mode types - includes index for old device targeting
type AssetScanMode = 'new-device' | { type: 'old-device'; index: number } | null;

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

  // Old devices state (multiple)
  const [oldDevices, setOldDevices] = useState<OldDeviceConfig[]>([]);

  // Multi-device configuration state
  const [newDevices, setNewDevices] = useState<DeviceConfig[]>([]);

  // Toggle states
  const [addingNewDevice, setAddingNewDevice] = useState(true);
  const [returningOldDevice, setReturningOldDevice] = useState(false);
  const [isRetroactive, setIsRetroactive] = useState(false);

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
    setIsRetroactive(false);

    setUserName(workplace!.userName);
    setUserEmail(workplace!.userEmail || '');
    setLocation(workplace!.location || '');
    setServiceId(workplace!.serviceId);
    setScheduledDate(workplace!.scheduledDate || undefined);

    if (workplace!.userEmail) {
      intuneApi.getDevicesByUser(workplace!.userEmail)
        .then(devices => setUserDevices(devices))
        .catch(() => setUserDevices([]));
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

    const devicePlans = plans.filter(p => p.metadata?.isOldDevice !== 'true');
    if (devicePlans.length > 0) {
      setAddingNewDevice(true);
      setNewDevices(devicePlans.map((p, idx) => ({
        id: `device-edit-${idx}`,
        type: p.equipmentType as DeviceConfig['type'],
        template: p.brand ? { brand: p.brand, model: p.model } as DeviceConfig['template'] : null,
        serialNumber: p.metadata?.serialNumber || '',
        linkedAsset: p.existingAssetId ? {
          id: p.existingAssetId,
          assetCode: p.existingAssetCode || '',
          assetName: p.existingAssetName || '',
        } as Asset : null,
      })));
    } else {
      setAddingNewDevice(true);
      setNewDevices([]);
    }

    setIsRetroactive(plans.some(p => p.existingAssetId && !p.createNew));
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
    setOldDevices([]);
    setNewDevices([]);
    setAddingNewDevice(true);
    setReturningOldDevice(false);
    setIsRetroactive(false);
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
        if (scanMode === 'new-device') {
          // Add as new device with linked asset
          const newDevice: DeviceConfig = {
            id: `device-${Date.now()}-${Math.random()}`,
            type: 'laptop', // Default, user can change
            template: asset.brand && asset.model
              ? { brand: asset.brand, model: asset.model } as DeviceConfig['template']
              : null,
            serialNumber: asset.serialNumber || '',
            linkedAsset: asset,
          };
          setNewDevices([...newDevices, newDevice]);
          setAddingNewDevice(true);
          setScanSuccess(`Toegevoegd: ${asset.assetCode} - ${asset.assetName}`);
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
      }, 1000);
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

  const buildAssetPlans = (): AssetPlan[] => {
    const plans: AssetPlan[] = [];

    // Add all old devices being returned
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

    if (addingNewDevice) {
      newDevices.forEach((device) => {
        if (device.template || device.linkedAsset) {
          const requiresSerial = device.type === 'laptop' || device.type === 'desktop';
          plans.push({
            equipmentType: device.type,
            createNew: !device.linkedAsset && !isRetroactive,
            requiresSerialNumber: requiresSerial,
            requiresQRCode: !device.linkedAsset && !isRetroactive,
            status: 'pending',
            brand: device.linkedAsset?.brand || device.template?.brand,
            model: device.linkedAsset?.model || device.template?.model,
            metadata: {
              ...(device.serialNumber && { serialNumber: device.serialNumber }),
              ...device.metadata,
            },
            ...(device.linkedAsset && {
              existingAssetId: device.linkedAsset.id,
              existingAssetCode: device.linkedAsset.assetCode,
              existingAssetName: device.linkedAsset.assetName,
            }),
          });
        }
      });
    }

    return plans;
  };

  const handleSave = async () => {
    const assetPlans = buildAssetPlans();

    // Determine if this is a laptop setup based on configured devices
    const hasLaptop = newDevices.some(d => d.type === 'laptop');

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

  const devicesNeedTemplates = addingNewDevice && newDevices.some(
    (device) => !device.linkedAsset && !device.template
  );

  const hasTemplateErrors = devicesNeedTemplates;
  const hasOldDeviceConfigured = returningOldDevice && oldDevices.some(d => d.serialNumber || d.linkedAsset);
  const hasNewDeviceConfigured = addingNewDevice && newDevices.some(d => d.template || d.linkedAsset);
  const hasDeviceConfigured = hasNewDeviceConfigured || hasOldDeviceConfigured;
  const isFormValid = userName.trim() && !hasTemplateErrors && hasDeviceConfigured;

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
          {/* Retroactive Mode Toggle - Neumorphic Inset with depth (Layer 2 - Middle) */}
          <Box
            sx={{
              mb: 3,
              p: 2.5,
              borderRadius: 3,
              bgcolor: isDark ? '#1e2328' : '#e8eef3',
              boxShadow: isRetroactive
                ? (isDark
                  ? 'inset 5px 5px 10px #161a1d, inset -5px -5px 10px #262c33, 0 0 0 2px rgba(255, 152, 0, 0.4)'
                  : 'inset 5px 5px 10px #c5cad0, inset -5px -5px 10px #ffffff, 0 0 0 2px rgba(255, 152, 0, 0.3)')
                : (isDark
                  ? '5px 5px 10px #161a1d, -5px -5px 10px #262c33'
                  : '5px 5px 10px #c5cad0, -5px -5px 10px #ffffff'),
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'translateZ(8px)',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: isDark ? '#1e2328' : '#e8eef3',
                  boxShadow: isDark
                    ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
                    : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff',
                }}
              >
                <HistoryIcon sx={{
                  color: isRetroactive ? 'warning.main' : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)'),
                  fontSize: '1.3rem',
                  transition: 'color 0.3s ease',
                }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: isDark ? '#fff' : '#333' }}>
                  Retroactieve registratie
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}>
                  Link bestaande assets via QR-scan — geen nieuwe assets aanmaken
                </Typography>
              </Box>
              <Switch
                checked={isRetroactive}
                onChange={(e) => setIsRetroactive(e.target.checked)}
                color="warning"
                sx={{
                  '& .MuiSwitch-track': {
                    borderRadius: 2,
                    bgcolor: isDark ? '#161a1d' : '#d0d5db',
                  },
                }}
              />
            </Stack>
          </Box>

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
                      intuneApi.getDevicesByUser(upn)
                        .then(devices => setUserDevices(devices))
                        .catch(() => setUserDevices([]));
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

          {/* Intune Devices Display - Neumorphic Inset with depth */}
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
                HUIDIGE APPARATEN (INTUNE)
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {userDevices.map((device) => (
                  <Chip
                    key={device.id || device.serialNumber}
                    icon={<LaptopIcon sx={{ fontSize: '0.9rem !important' }} />}
                    label={`${device.deviceName || '?'} — ${device.serialNumber || ''}`}
                    size="small"
                    sx={{
                      bgcolor: isDark ? '#1e2328' : '#e8eef3',
                      color: '#2196F3',
                      fontWeight: 600,
                      border: 'none',
                      boxShadow: isDark
                        ? '2px 2px 4px #161a1d, -2px -2px 4px #262c33'
                        : '2px 2px 4px #c5cad0, -2px -2px 4px #ffffff',
                      '& .MuiChip-icon': { color: '#2196F3' },
                    }}
                  />
                ))}
              </Stack>
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
          <Typography
            variant="overline"
            sx={{
              display: 'block',
              mb: 2.5,
              fontWeight: 700,
              color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
              letterSpacing: '0.1em',
            }}
          >
            Apparaat Configuratie
          </Typography>

          {/* Old Device Section - Neumorphic */}
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
                    Oude toestellen inleveren
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}>
                    Registreer apparaten die worden vervangen
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

          {/* New Device Section - Neumorphic */}
          <Box
            sx={{
              mb: 2.5,
              p: 2.5,
              borderRadius: 3,
              bgcolor: isDark ? '#1e2328' : '#e8eef3',
              boxShadow: addingNewDevice
                ? (isDark
                  ? '6px 6px 12px #161a1d, -6px -6px 12px #262c33, inset 0 0 0 2px rgba(76, 175, 80, 0.4)'
                  : '6px 6px 12px #c5cad0, -6px -6px 12px #ffffff, inset 0 0 0 2px rgba(76, 175, 80, 0.3)')
                : (isDark
                  ? '5px 5px 10px #161a1d, -5px -5px 10px #262c33'
                  : '5px 5px 10px #c5cad0, -5px -5px 10px #ffffff'),
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: addingNewDevice ? 2 : 0 }}>
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
                    boxShadow: addingNewDevice
                      ? (isDark
                        ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
                        : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff')
                      : (isDark
                        ? '3px 3px 6px #161a1d, -3px -3px 6px #262c33'
                        : '3px 3px 6px #c5cad0, -3px -3px 6px #ffffff'),
                    transition: 'all 0.3s ease',
                  }}
                >
                  <ComputerIcon sx={{
                    color: addingNewDevice ? 'success.main' : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)'),
                    fontSize: '1.3rem',
                    transition: 'color 0.3s ease',
                  }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: isDark ? '#fff' : '#333' }}>
                    Nieuw apparaat toevoegen
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}>
                    Configureer nieuwe apparaten voor deze werkplek
                  </Typography>
                </Box>
              </Stack>
              <Switch
                checked={addingNewDevice}
                onChange={(e) => setAddingNewDevice(e.target.checked)}
                color="success"
                sx={{
                  '& .MuiSwitch-track': {
                    borderRadius: 2,
                    bgcolor: isDark ? '#161a1d' : '#d0d5db',
                  },
                }}
              />
            </Stack>

            {addingNewDevice && (
              <Box sx={{ mt: 2, pt: 2 }}>
                {/* QR Scan Button - Djoppie Neumorphic Style */}
                <Button
                  fullWidth
                  startIcon={<QrCodeScannerIcon />}
                  onClick={() => handleOpenScanDialog('new-device')}
                  sx={{
                    mb: 2,
                    py: 1.5,
                    borderRadius: 2.5,
                    bgcolor: isDark ? '#1e2328' : '#e8eef3',
                    color: '#FF7700',
                    fontWeight: 700,
                    textTransform: 'none',
                    border: 'none',
                    // Djoppie neumorphic raised style
                    boxShadow: isDark
                      ? '5px 5px 10px #161a1d, -5px -5px 10px #262c33, inset 0 0 0 1px rgba(255, 119, 0, 0.2)'
                      : '5px 5px 10px #c5cad0, -5px -5px 10px #ffffff, inset 0 0 0 1px rgba(255, 119, 0, 0.15)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      bgcolor: isDark ? '#1e2328' : '#e8eef3',
                      transform: 'translateY(-2px)',
                      boxShadow: isDark
                        ? '7px 7px 14px #161a1d, -7px -7px 14px #262c33, 0 4px 12px rgba(255, 119, 0, 0.3), inset 0 0 0 2px rgba(255, 119, 0, 0.4)'
                        : '7px 7px 14px #c5cad0, -7px -7px 14px #ffffff, 0 4px 12px rgba(255, 119, 0, 0.2), inset 0 0 0 2px rgba(255, 119, 0, 0.3)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                      boxShadow: isDark
                        ? 'inset 4px 4px 8px #161a1d, inset -4px -4px 8px #262c33, inset 0 0 0 2px rgba(255, 119, 0, 0.5)'
                        : 'inset 4px 4px 8px #c5cad0, inset -4px -4px 8px #ffffff, inset 0 0 0 2px rgba(255, 119, 0, 0.4)',
                    },
                  }}
                >
                  Scan QR-code nieuw toestel
                </Button>

                {/* Multi-device configuration */}
                <MultiDeviceConfigSection
                  devices={newDevices}
                  onChange={setNewDevices}
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
                {scanMode === 'new-device' ? 'Link nieuw toestel' : 'Link oud toestel in te leveren'}
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
        autoHideDuration={2000}
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
    </>
  );
};

export default RolloutWorkplaceDialog;

/**
 * RolloutWorkplaceDialog - Refactored
 *
 * Modern, professional dialog for configuring workplace rollouts.
 * This component orchestrates the extracted sub-components and hooks.
 *
 * Design: Neumorphic soft UI with Djoppie orange accent (#FF7700)
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Stack,
  useTheme,
  Switch,
  Alert,
  Snackbar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Autocomplete,
  TextField,
  CircularProgress,
} from '@mui/material';
import ComputerIcon from '@mui/icons-material/Computer';
import HistoryIcon from '@mui/icons-material/History';
import AddIcon from '@mui/icons-material/Add';
import PlaceIcon from '@mui/icons-material/Place';
import ClearIcon from '@mui/icons-material/Clear';
import { useCreateRolloutWorkplace, useUpdateRolloutWorkplace } from '../../hooks/useRollout';
import { usePhysicalWorkplacesSummary } from '../../hooks/usePhysicalWorkplaces';
import { OldDeviceConfigSection, type OldDeviceConfig } from './OldDeviceConfigSection';
import { WorkplaceConfigSection, type AssetConfigItem } from './WorkplaceConfigSection';
import type { RolloutWorkplace, CreateRolloutWorkplace, UpdateRolloutWorkplace } from '../../types/rollout';
import type { PhysicalWorkplaceSummary } from '../../types/physicalWorkplace.types';
import type { Asset } from '../../types/asset.types';
import type { IntuneDevice } from '../../types/graph.types';
import { ROLLOUT_TIMING } from '../../constants/rollout.constants';

// Import extracted components and hooks
import {
  UserInfoSection,
  DeviceDisplaySection,
  ScanDialog,
  useWorkplaceForm,
  useUserSearch,
  useAssetScanner,
  buildAssetPlans,
  hasLaptopConfig,
} from './workplace-dialog';
import type { AssetScanMode } from './workplace-dialog';

interface RolloutWorkplaceDialogProps {
  open: boolean;
  onClose: () => void;
  dayId: number;
  workplace?: RolloutWorkplace;
}

const RolloutWorkplaceDialog = ({ open, onClose, dayId, workplace }: RolloutWorkplaceDialogProps) => {
  const isEditMode = Boolean(workplace);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Use extracted hooks
  const form = useWorkplaceForm();
  const userSearch = useUserSearch();
  const scanner = useAssetScanner();

  // Mutations
  const createMutation = useCreateRolloutWorkplace();
  const updateMutation = useUpdateRolloutWorkplace();

  // Physical workplaces for selector
  const { data: physicalWorkplaces, isLoading: physicalWorkplacesLoading } = usePhysicalWorkplacesSummary();

  // Find the currently selected physical workplace for display
  const selectedPhysicalWorkplace = physicalWorkplaces?.find(
    (pw) => pw.id === form.state.physicalWorkplaceId
  );

  // Device menu state
  const [deviceMenuAnchor, setDeviceMenuAnchor] = useState<HTMLElement | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<{ type: 'intune' | 'owner'; data: IntuneDevice | Asset } | null>(null);

  // Sync tracking ref (not state to avoid cascading renders)
  const syncedKeyRef = useRef<string | null>(null);

  // Sync workplace data when editing
  const currentKey = workplace ? `${workplace.id}-${workplace.updatedAt}` : null;

  useEffect(() => {
    if (open && currentKey && currentKey !== syncedKeyRef.current) {
      syncedKeyRef.current = currentKey;
      userSearch.clearDevices();
      form.syncFromWorkplace(workplace!);

      if (workplace!.userEmail) {
        userSearch.fetchUserDevices(workplace!.userEmail);
      }
    }
  }, [open, currentKey, workplace, form, userSearch]);

  // Reset when opening new workplace
  useEffect(() => {
    if (open && !workplace && syncedKeyRef.current !== 'new') {
      syncedKeyRef.current = 'new';
      form.resetForm();
      userSearch.clearDevices();
    }
  }, [open, workplace, form, userSearch]);

  // Reset sync key when dialog closes
  useEffect(() => {
    if (!open && syncedKeyRef.current !== null) {
      syncedKeyRef.current = null;
    }
  }, [open]);

  // Handle user selection from autocomplete
  const handleUserSelect = useCallback((user: { displayName?: string; mail?: string; userPrincipalName?: string; officeLocation?: string }) => {
    form.setUserName(user.displayName || '');
    const upn = user.mail || user.userPrincipalName || '';
    form.setUserEmail(upn);
    if (user.officeLocation) form.setLocation(user.officeLocation);

    if (upn) {
      userSearch.fetchUserDevices(upn);
    }
  }, [form, userSearch]);

  // Handle device menu
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
      asset = selectedDevice.data as Asset;
    } else {
      const intuneDevice = selectedDevice.data as IntuneDevice;
      if (intuneDevice.serialNumber) {
        asset = await scanner.handleSerialSearch(intuneDevice.serialNumber);
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

    form.setConfigItems([...form.state.configItems, newConfigItem]);
    scanner.setScanSuccess(asset
      ? `Toegevoegd als nieuw: ${asset.assetCode}`
      : `Toegevoegd als nieuw apparaat`);
    handleDeviceMenuClose();
  };

  // Add device as old device (to be returned)
  const handleAddAsOldDevice = async () => {
    if (!selectedDevice) return;

    let asset: Asset | null = null;

    if (selectedDevice.type === 'owner') {
      asset = selectedDevice.data as Asset;
    } else {
      const intuneDevice = selectedDevice.data as IntuneDevice;
      if (intuneDevice.serialNumber) {
        asset = await scanner.handleSerialSearch(intuneDevice.serialNumber);
      }
    }

    const oldDevice: OldDeviceConfig = {
      id: `old-device-${Date.now()}-${Math.random()}`,
      serialNumber: selectedDevice.type === 'intune'
        ? (selectedDevice.data as IntuneDevice).serialNumber || ''
        : (selectedDevice.data as Asset).serialNumber || '',
      linkedAsset: asset,
    };

    form.setOldDevices([...form.state.oldDevices, oldDevice]);
    form.setReturningOldDevice(true);
    scanner.setScanSuccess(asset
      ? `Toegevoegd als in te leveren: ${asset.assetCode}`
      : `Toegevoegd als in te leveren apparaat`);
    handleDeviceMenuClose();
  };

  // Handle scan dialog operations
  const handleOpenScanDialog = (mode: AssetScanMode) => {
    scanner.openScanDialog(mode);
  };

  const handleScanSuccess = async (assetCode: string) => {
    const result = await scanner.handleScanSuccess(assetCode);

    if (result.success && result.asset) {
      const currentScanMode = scanner.scanMode;

      // Link the asset based on scan mode
      if (currentScanMode && typeof currentScanMode === 'object' && currentScanMode.type === 'config-item') {
        const itemId = currentScanMode.itemId;
        form.setConfigItems(form.state.configItems.map(item =>
          item.id === itemId
            ? { ...item, mode: 'link' as const, linkedAsset: result.asset! }
            : item
        ));
      } else if (currentScanMode && typeof currentScanMode === 'object' && currentScanMode.type === 'old-device') {
        const index = currentScanMode.index;
        const updatedOldDevices = [...form.state.oldDevices];
        updatedOldDevices[index] = {
          ...updatedOldDevices[index],
          linkedAsset: result.asset,
          serialNumber: result.asset.serialNumber || '',
        };
        form.setOldDevices(updatedOldDevices);
      }

      // Close dialog after short delay
      setTimeout(() => {
        scanner.closeScanDialog();
      }, 1500);
    }
  };

  // Handle old device serial search
  const handleOldDeviceSerialSearch = async (index: number, serial: string) => {
    const asset = await scanner.handleSerialSearch(serial);
    const updatedOldDevices = [...form.state.oldDevices];
    updatedOldDevices[index] = {
      ...updatedOldDevices[index],
      linkedAsset: asset,
    };
    form.setOldDevices(updatedOldDevices);
  };

  // Handle save
  const handleSave = async () => {
    const assetPlans = buildAssetPlans({
      oldDevices: form.state.oldDevices,
      configItems: form.state.configItems,
      returningOldDevice: form.state.returningOldDevice,
    });

    const hasLaptop = hasLaptopConfig(form.state.configItems);

    if (isEditMode && workplace) {
      const updateData: UpdateRolloutWorkplace = {
        userName: form.state.userName,
        userEmail: form.state.userEmail || null,
        location: form.state.location || null,
        scheduledDate: form.state.scheduledDate || null,
        serviceId: form.state.serviceId || null,
        physicalWorkplaceId: form.state.physicalWorkplaceId || null,
        isLaptopSetup: hasLaptop,
        assetPlans,
        status: form.state.workplaceStatus,
        notes: workplace.notes || null,
      };
      await updateMutation.mutateAsync({ workplaceId: workplace.id, data: updateData });
    } else {
      const createData: CreateRolloutWorkplace = {
        rolloutDayId: dayId,
        userName: form.state.userName,
        userEmail: form.state.userEmail || undefined,
        location: form.state.location || undefined,
        scheduledDate: form.state.scheduledDate || undefined,
        serviceId: form.state.serviceId,
        physicalWorkplaceId: form.state.physicalWorkplaceId,
        isLaptopSetup: hasLaptop,
        assetPlans,
      };
      await createMutation.mutateAsync({ dayId, data: createData });
    }

    onClose();
  };

  return (
    <>
      {/* Main Dialog */}
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        disableRestoreFocus
        PaperProps={{
          sx: {
            borderRadius: 4,
            border: 'none',
            bgcolor: isDark ? 'rgba(30, 35, 40, 0.92)' : 'rgba(232, 238, 243, 0.92)',
            backdropFilter: 'blur(20px)',
            boxShadow: isDark
              ? '0px 8px 32px rgba(0, 0, 0, 0.5), 0px 2px 8px rgba(0, 0, 0, 0.3)'
              : '0px 8px 32px rgba(150, 155, 160, 0.3), 0px 2px 8px rgba(180, 185, 190, 0.2)',
            overflow: 'hidden',
            transform: 'perspective(1000px) translateZ(0)',
            transformStyle: 'preserve-3d',
          },
        }}
      >
        {/* Header */}
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
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: 3,
                bgcolor: isDark ? '#1e2328' : '#e8eef3',
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
          {/* Status Change Section - Only for completed/ready workplaces */}
          {isEditMode && workplace && (workplace.status === 'Completed' || workplace.status === 'Ready') && (
            <Alert
              severity={form.state.workplaceStatus === 'Completed' ? 'success' : form.state.workplaceStatus === 'Ready' ? 'info' : 'warning'}
              sx={{
                mb: 3,
                borderRadius: 2,
                '& .MuiAlert-message': { width: '100%' },
              }}
              action={
                <Stack direction="row" spacing={1}>
                  <Chip
                    label="In Afwachting"
                    size="small"
                    variant={form.state.workplaceStatus === 'Pending' ? 'filled' : 'outlined'}
                    color="warning"
                    onClick={() => form.setWorkplaceStatus('Pending')}
                    sx={{ cursor: 'pointer' }}
                  />
                  <Chip
                    label="Gereed"
                    size="small"
                    variant={form.state.workplaceStatus === 'Ready' ? 'filled' : 'outlined'}
                    color="info"
                    onClick={() => form.setWorkplaceStatus('Ready')}
                    sx={{ cursor: 'pointer' }}
                  />
                  <Chip
                    label="Voltooid"
                    size="small"
                    variant={form.state.workplaceStatus === 'Completed' ? 'filled' : 'outlined'}
                    color="success"
                    onClick={() => form.setWorkplaceStatus('Completed')}
                    sx={{ cursor: 'pointer' }}
                  />
                </Stack>
              }
            >
              <Typography variant="body2" fontWeight={600}>
                Status: {form.state.workplaceStatus === 'Completed' ? 'Voltooid' : form.state.workplaceStatus === 'Ready' ? 'Gereed' : 'In Afwachting'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Klik op een status om deze te wijzigen
              </Typography>
            </Alert>
          )}

          {/* User Information Section */}
          <UserInfoSection
            userName={form.state.userName}
            userEmail={form.state.userEmail}
            location={form.state.location}
            scheduledDate={form.state.scheduledDate}
            userOptions={userSearch.userOptions}
            userSearchLoading={userSearch.userSearchLoading}
            userDropdownOpen={userSearch.userDropdownOpen}
            onUserNameChange={form.setUserName}
            onUserEmailChange={form.setUserEmail}
            onLocationChange={form.setLocation}
            onScheduledDateChange={form.setScheduledDate}
            onUserSearch={userSearch.handleUserSearch}
            onUserSelect={handleUserSelect}
            onDropdownOpen={() => userSearch.setUserDropdownOpen(true)}
            onDropdownClose={() => userSearch.setUserDropdownOpen(false)}
          />

          {/* Device Display Section */}
          <DeviceDisplaySection
            userDevices={userSearch.userDevices}
            ownerAssets={userSearch.ownerAssets}
            ownerAssetsLoading={userSearch.ownerAssetsLoading}
            onDeviceClick={handleDeviceClick}
          />

          {/* Physical Workplace Selection Section */}
          <Box
            sx={{
              mt: 3,
              p: 2.5,
              borderRadius: 3,
              bgcolor: isDark ? '#1e2328' : '#e8eef3',
              boxShadow: selectedPhysicalWorkplace
                ? (isDark
                  ? '6px 6px 12px #161a1d, -6px -6px 12px #262c33, inset 0 0 0 2px rgba(255, 119, 0, 0.4)'
                  : '6px 6px 12px #c5cad0, -6px -6px 12px #ffffff, inset 0 0 0 2px rgba(255, 119, 0, 0.3)')
                : (isDark
                  ? '5px 5px 10px #161a1d, -5px -5px 10px #262c33'
                  : '5px 5px 10px #c5cad0, -5px -5px 10px #ffffff'),
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: isDark ? '#1e2328' : '#e8eef3',
                  boxShadow: selectedPhysicalWorkplace
                    ? (isDark
                      ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
                      : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff')
                    : (isDark
                      ? '3px 3px 6px #161a1d, -3px -3px 6px #262c33'
                      : '3px 3px 6px #c5cad0, -3px -3px 6px #ffffff'),
                  transition: 'all 0.3s ease',
                }}
              >
                <PlaceIcon sx={{
                  color: selectedPhysicalWorkplace ? '#FF7700' : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)'),
                  fontSize: '1.3rem',
                  transition: 'color 0.3s ease',
                }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: isDark ? '#fff' : '#333' }}>
                  Fysieke werkplek
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}>
                  Koppel aan een bestaande fysieke werkplek
                </Typography>
              </Box>
              {selectedPhysicalWorkplace && (
                <Chip
                  label={selectedPhysicalWorkplace.code}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    bgcolor: isDark ? '#1e2328' : '#e8eef3',
                    color: '#FF7700',
                    border: 'none',
                    boxShadow: isDark
                      ? '2px 2px 4px #161a1d, -2px -2px 4px #262c33'
                      : '2px 2px 4px #c5cad0, -2px -2px 4px #ffffff',
                  }}
                />
              )}
            </Stack>

            <Autocomplete
              options={physicalWorkplaces || []}
              getOptionLabel={(option: PhysicalWorkplaceSummary) => `${option.code} - ${option.name}`}
              value={selectedPhysicalWorkplace || null}
              onChange={(_, newValue) => {
                form.setPhysicalWorkplaceId(newValue?.id);
              }}
              loading={physicalWorkplacesLoading}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              renderOption={(props, option: PhysicalWorkplaceSummary) => (
                <Box component="li" {...props} key={option.id}>
                  <Stack>
                    <Typography variant="body2" fontWeight={600}>
                      {option.code} - {option.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.buildingName}
                      {option.currentOccupantName && ` • ${option.currentOccupantName}`}
                    </Typography>
                  </Stack>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Selecteer fysieke werkplek..."
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {physicalWorkplacesLoading ? <CircularProgress color="inherit" size={18} /> : null}
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
                      '&:hover fieldset': { border: 'none' },
                      '&.Mui-focused fieldset': { border: 'none' },
                    },
                    '& .MuiInputBase-input': {
                      color: isDark ? '#fff' : '#333',
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                      opacity: 1,
                    },
                  }}
                />
              )}
            />

            {selectedPhysicalWorkplace && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: isDark ? '#1e2328' : '#e8eef3',
                  boxShadow: isDark
                    ? 'inset 2px 2px 4px #161a1d, inset -2px -2px 4px #262c33'
                    : 'inset 2px 2px 4px #c5cad0, inset -2px -2px 4px #ffffff',
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack spacing={0.5}>
                    <Typography variant="body2" fontWeight={600} color="text.primary">
                      {selectedPhysicalWorkplace.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedPhysicalWorkplace.buildingName}
                      {selectedPhysicalWorkplace.serviceName && ` • ${selectedPhysicalWorkplace.serviceName}`}
                    </Typography>
                    {selectedPhysicalWorkplace.currentOccupantName && (
                      <Typography variant="caption" sx={{ color: 'warning.main' }}>
                        Huidige gebruiker: {selectedPhysicalWorkplace.currentOccupantName}
                      </Typography>
                    )}
                  </Stack>
                  <Button
                    size="small"
                    onClick={() => form.setPhysicalWorkplaceId(undefined)}
                    startIcon={<ClearIcon />}
                    sx={{
                      minWidth: 'auto',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1.5,
                      color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
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
                    Wissen
                  </Button>
                </Stack>
              </Box>
            )}
          </Box>

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

          {/* Unified Workplace Configuration Section */}
          <Box sx={{ mb: 2.5 }}>
            <WorkplaceConfigSection
              items={form.state.configItems}
              onChange={form.setConfigItems}
              onScanRequest={(itemId) => handleOpenScanDialog({ type: 'config-item', itemId })}
            />
          </Box>

          {/* Old Device Section */}
          <Box
            sx={{
              mb: 2.5,
              p: 2.5,
              borderRadius: 3,
              bgcolor: isDark ? '#1e2328' : '#e8eef3',
              boxShadow: form.state.returningOldDevice
                ? (isDark
                  ? '6px 6px 12px #161a1d, -6px -6px 12px #262c33, inset 0 0 0 2px rgba(255, 152, 0, 0.4)'
                  : '6px 6px 12px #c5cad0, -6px -6px 12px #ffffff, inset 0 0 0 2px rgba(255, 152, 0, 0.3)')
                : (isDark
                  ? '5px 5px 10px #161a1d, -5px -5px 10px #262c33'
                  : '5px 5px 10px #c5cad0, -5px -5px 10px #ffffff'),
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: form.state.returningOldDevice ? 2 : 0 }}>
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
                    boxShadow: form.state.returningOldDevice
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
                    color: form.state.returningOldDevice ? 'warning.main' : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)'),
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
                {form.state.oldDevices.length > 0 && (
                  <Chip
                    label={`${form.state.oldDevices.length} ${form.state.oldDevices.length === 1 ? 'toestel' : 'toestellen'}`}
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
                checked={form.state.returningOldDevice}
                onChange={(e) => form.setReturningOldDevice(e.target.checked)}
                color="warning"
                sx={{
                  '& .MuiSwitch-track': {
                    borderRadius: 2,
                    bgcolor: isDark ? '#161a1d' : '#d0d5db',
                  },
                }}
              />
            </Stack>

            {form.state.returningOldDevice && (
              <Box sx={{ mt: 2, pt: 2 }}>
                <OldDeviceConfigSection
                  devices={form.state.oldDevices}
                  onChange={form.setOldDevices}
                  onScanRequest={(index) => handleOpenScanDialog({ type: 'old-device', index })}
                  onSerialSearch={handleOldDeviceSerialSearch}
                />
              </Box>
            )}
          </Box>

          {/* Validation Warnings */}
          {form.hasTemplateErrors && (
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
          {!form.hasDeviceConfigured && form.state.userName.trim() && (
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

        {/* Actions */}
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
            onClick={onClose}
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
            disabled={!form.isFormValid || createMutation.isPending || updateMutation.isPending}
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

      {/* QR Scan Dialog */}
      <ScanDialog
        open={scanner.scanDialogOpen}
        scanMode={scanner.scanMode}
        activeTab={scanner.activeTab}
        manualAssetCode={scanner.manualAssetCode}
        isLoadingAsset={scanner.isLoadingAsset}
        scanError={scanner.scanError}
        onClose={scanner.closeScanDialog}
        onTabChange={scanner.setActiveTab}
        onManualAssetCodeChange={scanner.setManualAssetCode}
        onScanSuccess={handleScanSuccess}
        onScanError={scanner.setScanError}
        onManualSearch={async () => {
          const result = await scanner.handleManualSearch();
          if (result.success) {
            await handleScanSuccess(scanner.manualAssetCode);
          }
        }}
      />

      {/* Scan Error Snackbar */}
      <Snackbar
        open={!!scanner.scanError}
        autoHideDuration={4000}
        onClose={() => scanner.setScanError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="error"
          onClose={() => scanner.setScanError('')}
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
          {scanner.scanError}
        </Alert>
      </Snackbar>

      {/* Scan Success Snackbar */}
      <Snackbar
        open={!!scanner.scanSuccess}
        autoHideDuration={ROLLOUT_TIMING.SNACKBAR_AUTO_HIDE_MS}
        onClose={() => scanner.setScanSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          onClose={() => scanner.setScanSuccess('')}
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
          {scanner.scanSuccess}
        </Alert>
      </Snackbar>

      {/* Device Selection Menu */}
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

/**
 * DeviceAssignmentDialog
 *
 * Dialog for assigning a device (laptop/desktop) to:
 * 1. A user as their personal device (updates owner/employeeId)
 * 2. A workplace as a shared/fixed device (updates physicalWorkplaceId)
 *
 * Uses the deployment API for comprehensive tracking and audit trail.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Dialog,
  Box,
  Typography,
  Stack,
  IconButton,
  TextField,
  Autocomplete,
  CircularProgress,
  Alert,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import PlaceIcon from '@mui/icons-material/Place';
import LaptopIcon from '@mui/icons-material/Laptop';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useExecuteDeployment, useAvailableLaptops } from '../../hooks/useDeployment';
import { usePhysicalWorkplacesSummary } from '../../hooks/usePhysicalWorkplaces';
import { PhysicalWorkplace, PhysicalWorkplaceSummary } from '../../types/physicalWorkplace.types';
import { Asset } from '../../types/asset.types';
import { DeploymentMode } from '../../types/deployment.types';
import UserAutocomplete from '../common/UserAutocomplete';
import { GraphUser } from '../../types/graph.types';

type AssignmentType = 'user' | 'workplace';

interface DeviceAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  /** Pre-selected workplace (when opened from WorkplaceDetailPage) */
  workplace?: PhysicalWorkplace | null;
  /** Pre-selected asset (when opened from AssetDetailPage) */
  asset?: Asset | null;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const DeviceAssignmentDialog = ({
  open,
  onClose,
  workplace,
  asset,
  onSuccess,
  onError,
}: DeviceAssignmentDialogProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Assignment type state
  const [assignmentType, setAssignmentType] = useState<AssignmentType>(
    workplace ? 'workplace' : 'user'
  );

  // Form state
  const [selectedUser, setSelectedUser] = useState<GraphUser | null>(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [selectedWorkplace, setSelectedWorkplace] = useState<PhysicalWorkplaceSummary | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(asset || null);
  const [assetSearch, setAssetSearch] = useState('');

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setAssignmentType(workplace ? 'workplace' : 'user');
      setSelectedUser(null);
      setSelectedUserName('');
      setSelectedWorkplace(null);
      setSelectedAsset(asset || null);
      setAssetSearch('');
    }
  }, [open, workplace, asset]);

  // Handle user selection from autocomplete
  const handleUserChange = useCallback((displayName: string, user: GraphUser | null) => {
    setSelectedUserName(displayName);
    setSelectedUser(user);
  }, []);

  // Queries
  const { data: availableLaptops = [], isLoading: laptopsLoading } = useAvailableLaptops(assetSearch);
  const { data: workplaces = [], isLoading: workplacesLoading } = usePhysicalWorkplacesSummary(
    undefined,
    undefined,
    true
  );

  // Filter devices based on search
  const filteredDevices = useMemo(() => {
    if (!assetSearch) return availableLaptops;
    const query = assetSearch.toLowerCase();
    return availableLaptops.filter(
      (device) =>
        device.assetCode.toLowerCase().includes(query) ||
        device.serialNumber?.toLowerCase().includes(query) ||
        device.brand?.toLowerCase().includes(query) ||
        device.model?.toLowerCase().includes(query)
    );
  }, [availableLaptops, assetSearch]);

  // Deployment mutation
  const deploymentMutation = useExecuteDeployment();

  // Check if form is valid
  const isFormValid = useMemo(() => {
    if (!selectedAsset) return false;
    if (assignmentType === 'user' && !selectedUser) return false;
    if (assignmentType === 'workplace' && !selectedWorkplace && !workplace) return false;
    return true;
  }, [selectedAsset, assignmentType, selectedUser, selectedWorkplace, workplace]);

  // Handle assignment submission
  const handleSubmit = useCallback(async () => {
    if (!selectedAsset) return;

    const targetWorkplace = workplace || selectedWorkplace;

    try {
      if (assignmentType === 'user' && selectedUser) {
        // Assign device to user (Onboarding mode)
        await deploymentMutation.mutateAsync({
          request: {
            mode: DeploymentMode.Onboarding,
            newLaptopAssetId: selectedAsset.id,
            oldLaptopAssetId: null,
            newOwnerEntraId: selectedUser.id,
            newOwnerName: selectedUser.displayName,
            newOwnerEmail: selectedUser.mail || selectedUser.userPrincipalName,
            newOwnerJobTitle: selectedUser.jobTitle,
            newOwnerOfficeLocation: selectedUser.officeLocation,
            physicalWorkplaceId: null,
            updateEquipmentSlots: false,
            equipmentSlots: null,
            notes: t('deviceAssignment.assignedToUser'),
          },
        });
        onSuccess?.(t('deviceAssignment.successUser', {
          device: selectedAsset.assetCode,
          user: selectedUser.displayName
        }));
      } else if (assignmentType === 'workplace' && targetWorkplace) {
        // Assign device to workplace as shared device
        // Use forceOccupantUpdate to bypass occupant conflict check for shared devices
        await deploymentMutation.mutateAsync({
          request: {
            mode: DeploymentMode.Onboarding,
            newLaptopAssetId: selectedAsset.id,
            oldLaptopAssetId: null,
            // For shared device, we set the workplace code as owner indicator
            newOwnerEntraId: '',
            newOwnerName: `Gedeeld - ${targetWorkplace.code}`,
            newOwnerEmail: '',
            physicalWorkplaceId: targetWorkplace.id,
            updateEquipmentSlots: false,
            equipmentSlots: null,
            notes: t('deviceAssignment.assignedToWorkplace'),
          },
          forceOccupantUpdate: true, // Skip occupant conflict check for shared devices
        });
        onSuccess?.(t('deviceAssignment.successWorkplace', {
          device: selectedAsset.assetCode,
          workplace: targetWorkplace.code
        }));
      }

      onClose();
    } catch (error) {
      onError?.(t('deviceAssignment.error'));
    }
  }, [
    selectedAsset,
    assignmentType,
    selectedUser,
    workplace,
    selectedWorkplace,
    deploymentMutation,
    onSuccess,
    onError,
    onClose,
    t,
  ]);

  // Neumorphic styles
  const neomorphBoxShadow = isDark
    ? '6px 6px 12px #161a1d, -6px -6px 12px #262c33'
    : '6px 6px 12px #c5cad0, -6px -6px 12px #ffffff';

  const neomorphInsetShadow = isDark
    ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
    : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff';

  const bgColor = isDark ? '#1e2328' : '#e8eef3';
  const accentColor = '#FF7700';
  const tealColor = '#009688';

  const neomorphButtonSx = {
    backgroundColor: bgColor,
    boxShadow: neomorphBoxShadow,
    borderRadius: 2,
    border: 'none',
    color: isDark ? '#fff' : '#333',
    textTransform: 'none' as const,
    fontWeight: 600,
    transition: 'all 0.3s ease',
    px: 3,
    py: 1.5,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: bgColor,
      boxShadow: isDark
        ? '4px 4px 8px #161a1d, -4px -4px 8px #262c33'
        : '4px 4px 8px #c5cad0, -4px -4px 8px #ffffff',
      transform: 'translateY(-1px)',
    },
    '&:active': {
      boxShadow: neomorphInsetShadow,
      transform: 'translateY(0)',
    },
    '&.Mui-disabled': {
      backgroundColor: bgColor,
      opacity: 0.5,
    },
  };

  const neomorphPrimaryButtonSx = {
    ...neomorphButtonSx,
    backgroundColor: tealColor,
    color: '#fff',
    '&:hover': {
      backgroundColor: tealColor,
      boxShadow: isDark
        ? '4px 4px 8px #161a1d, -4px -4px 8px #262c33, 0 0 20px rgba(0, 150, 136, 0.4)'
        : '4px 4px 8px #c5cad0, -4px -4px 8px #ffffff, 0 0 20px rgba(0, 150, 136, 0.3)',
      transform: 'translateY(-1px)',
    },
    '&.Mui-disabled': {
      backgroundColor: tealColor,
      opacity: 0.5,
      color: '#fff',
    },
  };

  const neomorphIconButtonSx = {
    backgroundColor: bgColor,
    boxShadow: neomorphBoxShadow,
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: bgColor,
      boxShadow: neomorphInsetShadow,
    },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          boxShadow: neomorphBoxShadow,
          backgroundColor: bgColor,
          backgroundImage: 'none',
          border: 'none',
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          background: isDark
            ? `linear-gradient(135deg, ${bgColor} 0%, #252a30 100%)`
            : `linear-gradient(135deg, ${bgColor} 0%, #dde4eb 100%)`,
          borderBottom: `2px solid ${accentColor}`,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: bgColor,
                boxShadow: neomorphBoxShadow,
              }}
            >
              <LaptopIcon sx={{ color: accentColor, fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                {t('deviceAssignment.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {workplace
                  ? t('deviceAssignment.subtitleWorkplace', { code: workplace.code })
                  : asset
                    ? t('deviceAssignment.subtitleAsset', { code: asset.assetCode })
                    : t('deviceAssignment.subtitle')}
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} sx={neomorphIconButtonSx}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3 }}>
        {/* Assignment Type Toggle */}
        {!workplace && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: accentColor }}>
              {t('deviceAssignment.assignTo')}
            </Typography>
            <ToggleButtonGroup
              value={assignmentType}
              exclusive
              onChange={(_, value) => value && setAssignmentType(value)}
              fullWidth
              sx={{
                '& .MuiToggleButton-root': {
                  borderRadius: 2,
                  border: 'none',
                  bgcolor: bgColor,
                  boxShadow: neomorphBoxShadow,
                  py: 1.5,
                  transition: 'all 0.3s ease',
                  '&.Mui-selected': {
                    bgcolor: bgColor,
                    boxShadow: neomorphInsetShadow,
                    color: accentColor,
                    fontWeight: 700,
                    '&:hover': {
                      bgcolor: bgColor,
                    },
                  },
                  '&:hover': {
                    bgcolor: bgColor,
                  },
                },
              }}
            >
              <ToggleButton value="user">
                <PersonIcon sx={{ mr: 1 }} />
                {t('deviceAssignment.toUser')}
              </ToggleButton>
              <ToggleButton value="workplace">
                <PlaceIcon sx={{ mr: 1 }} />
                {t('deviceAssignment.toWorkplace')}
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        {/* Device Selection (if not pre-selected) */}
        {!asset && (
          <Box
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: bgColor,
              boxShadow: neomorphBoxShadow,
              mb: 3,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <LaptopIcon sx={{ color: accentColor }} />
              <Typography variant="subtitle1" fontWeight={600} sx={{ color: accentColor }}>
                {t('deviceAssignment.selectDevice')}
              </Typography>
            </Stack>
            <Autocomplete
              options={filteredDevices}
              value={selectedAsset}
              onChange={(_, value) => setSelectedAsset(value)}
              inputValue={assetSearch}
              onInputChange={(_, value) => setAssetSearch(value)}
              loading={laptopsLoading}
              getOptionLabel={(option) =>
                `${option.assetCode}${option.serialNumber ? ` - ${option.serialNumber}` : ''}`
              }
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Stack>
                    <Typography fontWeight={600} sx={{ color: accentColor }}>
                      {option.assetCode}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.brand} {option.model}
                      {option.serialNumber && ` | S/N: ${option.serialNumber}`}
                    </Typography>
                  </Stack>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={t('deviceAssignment.searchDevice')}
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      bgcolor: bgColor,
                      boxShadow: neomorphInsetShadow,
                      '& fieldset': { border: 'none' },
                    },
                  }}
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              noOptionsText={t('deviceAssignment.noDevices')}
            />
          </Box>
        )}

        {/* Selected Asset Display (if pre-selected) */}
        {asset && (
          <Box
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: bgColor,
              boxShadow: neomorphInsetShadow,
              mb: 3,
              borderLeft: `3px solid ${accentColor}`,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <LaptopIcon sx={{ color: accentColor, fontSize: 32 }} />
              <Box>
                <Typography fontWeight={700} sx={{ color: accentColor }}>
                  {asset.assetCode}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {asset.brand} {asset.model}
                  {asset.serialNumber && ` | S/N: ${asset.serialNumber}`}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}

        {/* User Selection (for user assignment) */}
        {assignmentType === 'user' && (
          <Box
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: bgColor,
              boxShadow: neomorphBoxShadow,
              mb: 3,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <PersonIcon sx={{ color: tealColor }} />
              <Typography variant="subtitle1" fontWeight={600} sx={{ color: tealColor }}>
                {t('deviceAssignment.selectUser')}
              </Typography>
            </Stack>
            <UserAutocomplete
              value={selectedUserName}
              onChange={handleUserChange}
              label={t('deviceAssignment.searchUser')}
            />
            {selectedUser && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: bgColor,
                  boxShadow: neomorphInsetShadow,
                  borderLeft: `3px solid ${tealColor}`,
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <CheckCircleIcon sx={{ color: 'success.main' }} />
                  <Box>
                    <Typography fontWeight={600}>{selectedUser.displayName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedUser.mail || selectedUser.userPrincipalName}
                      {selectedUser.jobTitle && ` | ${selectedUser.jobTitle}`}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
          </Box>
        )}

        {/* Workplace Selection (for workplace assignment, if not pre-selected) */}
        {assignmentType === 'workplace' && !workplace && (
          <Box
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: bgColor,
              boxShadow: neomorphBoxShadow,
              mb: 3,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <PlaceIcon sx={{ color: tealColor }} />
              <Typography variant="subtitle1" fontWeight={600} sx={{ color: tealColor }}>
                {t('deviceAssignment.selectWorkplace')}
              </Typography>
            </Stack>
            <Autocomplete
              options={workplaces}
              value={selectedWorkplace}
              onChange={(_, value) => setSelectedWorkplace(value)}
              loading={workplacesLoading}
              getOptionLabel={(option) => `${option.code} - ${option.name}`}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Stack>
                    <Typography fontWeight={600} sx={{ color: tealColor }}>
                      {option.code}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.name}
                      {option.buildingName && ` | ${option.buildingName}`}
                      {option.serviceName && ` | ${option.serviceName}`}
                    </Typography>
                  </Stack>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={t('deviceAssignment.searchWorkplace')}
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      bgcolor: bgColor,
                      boxShadow: neomorphInsetShadow,
                      '& fieldset': { border: 'none' },
                    },
                  }}
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              noOptionsText={t('deviceAssignment.noWorkplaces')}
            />
          </Box>
        )}

        {/* Pre-selected Workplace Display */}
        {assignmentType === 'workplace' && workplace && (
          <Box
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: bgColor,
              boxShadow: neomorphInsetShadow,
              mb: 3,
              borderLeft: `3px solid ${tealColor}`,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <PlaceIcon sx={{ color: tealColor, fontSize: 32 }} />
              <Box>
                <Typography fontWeight={700} sx={{ color: tealColor }}>
                  {workplace.code}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {workplace.name}
                  {workplace.buildingName && ` | ${workplace.buildingName}`}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}

        {/* Error Alert */}
        {deploymentMutation.isError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {t('deviceAssignment.error')}
          </Alert>
        )}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 3,
          borderTop: `1px solid ${isDark ? '#2a3038' : '#d0d7de'}`,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2,
        }}
      >
        <Box
          component="button"
          onClick={onClose}
          sx={neomorphButtonSx}
        >
          {t('common.cancel')}
        </Box>
        <Box
          component="button"
          onClick={handleSubmit}
          disabled={!isFormValid || deploymentMutation.isPending}
          sx={neomorphPrimaryButtonSx}
        >
          {deploymentMutation.isPending ? (
            <CircularProgress size={20} sx={{ color: '#fff' }} />
          ) : (
            t('deviceAssignment.assign')
          )}
        </Box>
      </Box>
    </Dialog>
  );
};

export default DeviceAssignmentDialog;

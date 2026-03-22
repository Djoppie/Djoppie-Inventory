/**
 * EquipmentSlotsSection
 *
 * Neumorphic component for managing dedicated equipment slots on a physical workplace.
 * Displays cards for docking station, monitors, keyboard, and mouse with asset search.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Stack,
  Autocomplete,
  TextField,
  IconButton,
  CircularProgress,
  useTheme,
  Tooltip,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import DockIcon from '@mui/icons-material/Dock';
import MonitorIcon from '@mui/icons-material/Monitor';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import ClearIcon from '@mui/icons-material/Clear';
import DevicesIcon from '@mui/icons-material/Devices';
import { useAssets } from '../../hooks/useAssets';
import type { Asset } from '../../types/asset.types';
import type { PhysicalWorkplace, UpdateEquipmentSlotsDto } from '../../types/physicalWorkplace.types';

interface EquipmentSlotsSectionProps {
  workplace: PhysicalWorkplace;
  onEquipmentChange: (data: UpdateEquipmentSlotsDto) => void;
  isLoading?: boolean;
}

interface EquipmentSlot {
  id: keyof UpdateEquipmentSlotsDto;
  label: string;
  icon: React.ReactNode;
  assetId: number | undefined;
  assetCode: string | undefined;
  serialNumber: string | undefined;
  assetTypes: string[]; // Asset type codes to filter by
  visible: boolean;
}

const EquipmentSlotsSection = ({
  workplace,
  onEquipmentChange,
  isLoading = false,
}: EquipmentSlotsSectionProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Fetch all assets for selection (Stock and Nieuw are available for assignment)
  const { data: stockAssets = [], isLoading: stockLoading } = useAssets('Stock');
  const { data: nieuwAssets = [], isLoading: nieuwLoading } = useAssets('Nieuw');

  // Combine available assets
  const allAssets = useMemo(() => [...stockAssets, ...nieuwAssets], [stockAssets, nieuwAssets]);
  const assetsLoading = stockLoading || nieuwLoading;

  // Local state for equipment slots
  const [equipmentData, setEquipmentData] = useState<UpdateEquipmentSlotsDto>({
    dockingStationAssetId: workplace.dockingStationAssetId ?? null,
    monitor1AssetId: workplace.monitor1AssetId ?? null,
    monitor2AssetId: workplace.monitor2AssetId ?? null,
    monitor3AssetId: workplace.monitor3AssetId ?? null,
    keyboardAssetId: workplace.keyboardAssetId ?? null,
    mouseAssetId: workplace.mouseAssetId ?? null,
  });

  // Define equipment slots based on workplace configuration
  const equipmentSlots: EquipmentSlot[] = useMemo(() => [
    {
      id: 'dockingStationAssetId',
      label: t('physicalWorkplaces.equipment.dockingStation'),
      icon: <DockIcon />,
      assetId: equipmentData.dockingStationAssetId ?? workplace.dockingStationAssetId,
      assetCode: workplace.dockingStationAssetCode,
      serialNumber: workplace.dockingStationSerialNumber,
      assetTypes: ['DOK', 'DOCK', 'DOCKING'],
      visible: workplace.hasDockingStation,
    },
    {
      id: 'monitor1AssetId',
      label: t('physicalWorkplaces.equipment.monitor1'),
      icon: <MonitorIcon />,
      assetId: equipmentData.monitor1AssetId ?? workplace.monitor1AssetId,
      assetCode: workplace.monitor1AssetCode,
      serialNumber: workplace.monitor1SerialNumber,
      assetTypes: ['MON', 'SCH', 'SCHERM', 'BEELDSCHERM', 'DISPLAY'],
      visible: workplace.monitorCount >= 1,
    },
    {
      id: 'monitor2AssetId',
      label: t('physicalWorkplaces.equipment.monitor2'),
      icon: <MonitorIcon />,
      assetId: equipmentData.monitor2AssetId ?? workplace.monitor2AssetId,
      assetCode: workplace.monitor2AssetCode,
      serialNumber: workplace.monitor2SerialNumber,
      assetTypes: ['MON', 'SCH', 'SCHERM', 'BEELDSCHERM', 'DISPLAY'],
      visible: workplace.monitorCount >= 2,
    },
    {
      id: 'monitor3AssetId',
      label: t('physicalWorkplaces.equipment.monitor3'),
      icon: <MonitorIcon />,
      assetId: equipmentData.monitor3AssetId ?? workplace.monitor3AssetId,
      assetCode: workplace.monitor3AssetCode,
      serialNumber: workplace.monitor3SerialNumber,
      assetTypes: ['MON', 'SCH', 'SCHERM', 'BEELDSCHERM', 'DISPLAY'],
      visible: workplace.monitorCount >= 3,
    },
    {
      id: 'keyboardAssetId',
      label: t('physicalWorkplaces.equipment.keyboard'),
      icon: <KeyboardIcon />,
      assetId: equipmentData.keyboardAssetId ?? workplace.keyboardAssetId,
      assetCode: workplace.keyboardAssetCode,
      serialNumber: workplace.keyboardSerialNumber,
      assetTypes: ['KEY', 'TOE', 'TOETSENBORD', 'KEYBOARD'],
      visible: true,
    },
    {
      id: 'mouseAssetId',
      label: t('physicalWorkplaces.equipment.mouse'),
      icon: <MouseIcon />,
      assetId: equipmentData.mouseAssetId ?? workplace.mouseAssetId,
      assetCode: workplace.mouseAssetCode,
      serialNumber: workplace.mouseSerialNumber,
      assetTypes: ['MUI', 'MOU', 'MUIS', 'MOUSE'],
      visible: true,
    },
  ], [workplace, equipmentData, t]);

  // Filter assets by type for each slot
  // Only show assets that have no owner OR are owned by the current occupant
  const getFilteredAssets = useCallback((assetTypes: string[]) => {
    return allAssets.filter(asset => {
      // Owner filter: only show assets without owner or owned by current occupant
      const hasNoOwner = !asset.owner || asset.owner.trim() === '';
      const isOwnedByOccupant = workplace.currentOccupantEmail &&
        asset.owner?.toLowerCase() === workplace.currentOccupantEmail.toLowerCase();

      if (!hasNoOwner && !isOwnedByOccupant) {
        return false;
      }

      // Check if asset type code or name contains any of the filter types
      const assetTypeCode = asset.assetType?.code?.toUpperCase() || '';
      const assetTypeName = asset.assetType?.name?.toUpperCase() || '';
      const assetCategory = asset.category?.toUpperCase() || '';
      const assetName = asset.assetName?.toUpperCase() || '';

      return assetTypes.some(type => {
        const upperType = type.toUpperCase();
        return (
          assetTypeCode.includes(upperType) ||
          assetTypeName.includes(upperType) ||
          assetCategory.includes(upperType) ||
          assetName.includes(upperType)
        );
      });
    });
  }, [allAssets, workplace.currentOccupantEmail]);

  // Get currently selected asset IDs to exclude from other slots
  const selectedAssetIds = useMemo(() => {
    return new Set(
      Object.values(equipmentData)
        .filter((id): id is number => id !== null && id !== undefined)
    );
  }, [equipmentData]);

  // Handle slot asset selection
  const handleSlotChange = useCallback((slotId: keyof UpdateEquipmentSlotsDto, asset: Asset | null) => {
    const newData = {
      ...equipmentData,
      [slotId]: asset?.id ?? null,
    };
    setEquipmentData(newData);
    onEquipmentChange(newData);
  }, [equipmentData, onEquipmentChange]);

  // Neumorphic style helpers
  const neomorphBoxShadow = isDark
    ? '6px 6px 12px #161a1d, -6px -6px 12px #262c33'
    : '6px 6px 12px #c5cad0, -6px -6px 12px #ffffff';

  const neomorphInsetShadow = isDark
    ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
    : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff';

  const bgColor = isDark ? '#1e2328' : '#e8eef3';

  const visibleSlots = equipmentSlots.filter(slot => slot.visible);

  return (
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
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: bgColor,
            boxShadow: neomorphInsetShadow,
          }}
        >
          <DevicesIcon sx={{ color: '#FF7700', fontSize: '1.3rem' }} />
        </Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ color: isDark ? '#fff' : '#333' }}>
          {t('physicalWorkplaces.equipment.title')}
        </Typography>
        {(isLoading || assetsLoading) && (
          <CircularProgress size={16} sx={{ ml: 1, color: '#FF7700' }} />
        )}
      </Stack>

      <Stack spacing={2}>
        {visibleSlots.map((slot) => {
          const filteredAssets = getFilteredAssets(slot.assetTypes);
          // Exclude already selected assets (but include current slot's selection)
          const availableAssets = filteredAssets.filter(
            asset => !selectedAssetIds.has(asset.id) || asset.id === slot.assetId
          );
          const selectedAsset = allAssets.find(a => a.id === slot.assetId) || null;

          return (
            <Box
              key={slot.id}
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: bgColor,
                boxShadow: slot.assetId
                  ? `${neomorphInsetShadow}, inset 0 0 0 2px rgba(255, 119, 0, 0.3)`
                  : neomorphBoxShadow,
                transition: 'all 0.3s ease',
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    bgcolor: bgColor,
                    boxShadow: neomorphInsetShadow,
                    color: slot.assetId ? '#FF7700' : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'),
                    flexShrink: 0,
                  }}
                >
                  {slot.icon}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                      fontWeight: 600,
                      mb: 0.5,
                      display: 'block',
                    }}
                  >
                    {slot.label}
                  </Typography>
                  <Autocomplete
                    size="small"
                    options={availableAssets}
                    value={selectedAsset}
                    onChange={(_, newValue) => handleSlotChange(slot.id, newValue)}
                    getOptionLabel={(option) =>
                      `${option.assetCode}${option.serialNumber ? ` - ${option.serialNumber}` : ''}`
                    }
                    renderOption={(props, option) => (
                      <li {...props} key={option.id}>
                        <Stack>
                          <Typography variant="body2" fontWeight={600}>
                            {option.assetCode}
                          </Typography>
                          {option.serialNumber && (
                            <Typography variant="caption" color="text.secondary">
                              S/N: {option.serialNumber}
                            </Typography>
                          )}
                          {option.brand && option.model && (
                            <Typography variant="caption" color="text.secondary">
                              {option.brand} {option.model}
                            </Typography>
                          )}
                        </Stack>
                      </li>
                    )}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    loading={assetsLoading}
                    disabled={isLoading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder={t('physicalWorkplaces.equipment.selectAsset')}
                        InputProps={{
                          ...params.InputProps,
                          sx: {
                            borderRadius: 1.5,
                            bgcolor: bgColor,
                            boxShadow: neomorphInsetShadow,
                            '& fieldset': { border: 'none' },
                            fontSize: '0.875rem',
                          },
                        }}
                      />
                    )}
                    sx={{
                      '& .MuiAutocomplete-endAdornment': {
                        right: 8,
                      },
                    }}
                  />
                </Box>
                {slot.assetId && (
                  <Tooltip title={t('common.clear')}>
                    <IconButton
                      size="small"
                      onClick={() => handleSlotChange(slot.id, null)}
                      sx={{
                        bgcolor: bgColor,
                        boxShadow: neomorphBoxShadow,
                        '&:hover': {
                          boxShadow: neomorphInsetShadow,
                        },
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Box>
          );
        })}

        {visibleSlots.length === 0 && (
          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
              py: 2,
            }}
          >
            {t('physicalWorkplaces.equipment.noSlotsConfigured')}
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

export default EquipmentSlotsSection;

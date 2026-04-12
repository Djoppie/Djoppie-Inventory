import { useState, useMemo, useCallback } from 'react';
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Stack,
  Autocomplete,
  useMediaQuery,
  useTheme,
  Button,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory';
import LinkIcon from '@mui/icons-material/Link';
import SaveIcon from '@mui/icons-material/Save';
import { useQuery } from '@tanstack/react-query';
import {
  usePhysicalWorkplaceAssets,
  useAssignAsset,
  useUnassignAsset,
  useUpdateEquipmentSlots,
} from '../../hooks/usePhysicalWorkplaces';
import { PhysicalWorkplace, WorkplaceFixedAsset, UpdateEquipmentSlotsDto } from '../../types/physicalWorkplace.types';
import { getAssets } from '../../api/assets.api';
import { Asset } from '../../types/asset.types';
import EquipmentSlotsSection from './EquipmentSlotsSection';

interface WorkplaceAssetsDialogProps {
  open: boolean;
  onClose: () => void;
  workplace: PhysicalWorkplace | null;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const WorkplaceAssetsDialog = ({
  open,
  onClose,
  workplace,
  onSuccess,
  onError,
}: WorkplaceAssetsDialogProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [equipmentChanges, setEquipmentChanges] = useState<UpdateEquipmentSlotsDto | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Neomorph styling constants
  const neomorphBoxShadow = isDark
    ? '6px 6px 12px #161a1d, -6px -6px 12px #262c33'
    : '6px 6px 12px #c5cad0, -6px -6px 12px #ffffff';
  const neomorphInsetShadow = isDark
    ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
    : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff';
  const bgColor = isDark ? '#1e2328' : '#e8eef3';
  const sectionBg = isDark ? '#1e2328' : '#e8eef3';
  const accentColor = '#FF7700';
  const tealColor = '#009688';

  // Fetch fixed assets for this workplace
  const {
    data: fixedAssets,
    isLoading: isLoadingAssets,
    error: assetsError,
  } = usePhysicalWorkplaceAssets(workplace?.id ?? 0);

  // Fetch all assets for the picker (only assets not assigned to a workplace)
  const { data: allAssets, isLoading: isLoadingAllAssets } = useQuery({
    queryKey: ['assets', 'unassigned'],
    queryFn: () => getAssets(),
    enabled: open,
  });

  // Filter assets that are not assigned to any workplace
  const availableAssets = useMemo(() => {
    if (!allAssets) return [];
    return allAssets.filter(
      (asset) =>
        !asset.physicalWorkplaceId &&
        asset.status !== 'UitDienst' &&
        asset.status !== 'Defect'
    );
  }, [allAssets]);

  // Filter available assets by search query
  const filteredAssets = useMemo(() => {
    if (!searchQuery) return availableAssets;
    const query = searchQuery.toLowerCase();
    return availableAssets.filter(
      (asset) =>
        asset.assetCode.toLowerCase().includes(query) ||
        asset.assetName.toLowerCase().includes(query) ||
        (asset.serialNumber && asset.serialNumber.toLowerCase().includes(query)) ||
        (asset.brand && asset.brand.toLowerCase().includes(query)) ||
        (asset.model && asset.model.toLowerCase().includes(query))
    );
  }, [availableAssets, searchQuery]);

  const assignMutation = useAssignAsset();
  const unassignMutation = useUnassignAsset();
  const updateEquipmentMutation = useUpdateEquipmentSlots();

  // Handle equipment slot changes from EquipmentSlotsSection
  const handleEquipmentChange = useCallback((data: UpdateEquipmentSlotsDto) => {
    setEquipmentChanges(data);
    setHasUnsavedChanges(true);
  }, []);

  // Save equipment slot changes
  const handleSaveEquipment = async () => {
    if (!workplace || !equipmentChanges) return;

    try {
      await updateEquipmentMutation.mutateAsync({
        id: workplace.id,
        data: equipmentChanges,
      });
      setHasUnsavedChanges(false);
      onSuccess?.(t('physicalWorkplaces.equipmentUpdated'));
    } catch {
      onError?.(t('physicalWorkplaces.equipmentUpdateError'));
    }
  };

  const handleAssignAsset = async () => {
    if (!workplace || !selectedAsset) return;

    try {
      await assignMutation.mutateAsync({
        workplaceId: workplace.id,
        assetId: selectedAsset.id,
      });
      setSelectedAsset(null);
      setSearchQuery('');
      onSuccess?.(t('physicalWorkplaces.assetAssigned', { asset: selectedAsset.assetCode }));
    } catch {
      onError?.(t('physicalWorkplaces.assignError'));
    }
  };

  const handleUnassignAsset = async (asset: WorkplaceFixedAsset) => {
    if (!workplace) return;

    try {
      await unassignMutation.mutateAsync({
        workplaceId: workplace.id,
        assetId: asset.id,
      });
      onSuccess?.(t('physicalWorkplaces.assetUnassigned', { asset: asset.assetCode }));
    } catch {
      onError?.(t('physicalWorkplaces.unassignError'));
    }
  };

  const handleClose = () => {
    setSelectedAsset(null);
    setSearchQuery('');
    setEquipmentChanges(null);
    setHasUnsavedChanges(false);
    onClose();
  };

  // Neomorph text field styling
  const neomorphTextFieldSx = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: bgColor,
      borderRadius: 2,
      boxShadow: neomorphInsetShadow,
      transition: 'all 0.3s ease',
      '& fieldset': {
        borderColor: 'transparent',
      },
      '&:hover fieldset': {
        borderColor: accentColor,
      },
      '&.Mui-focused fieldset': {
        borderColor: accentColor,
        borderWidth: 2,
      },
    },
  };

  // Neomorph button styling
  const neomorphButtonSx = {
    backgroundColor: bgColor,
    boxShadow: neomorphBoxShadow,
    borderRadius: 2,
    border: 'none',
    color: isDark ? '#fff' : '#333',
    textTransform: 'none' as const,
    fontWeight: 600,
    transition: 'all 0.3s ease',
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

  if (!workplace) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={isMobile}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 4,
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
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
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
              <InventoryIcon sx={{ color: accentColor, fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                {t('physicalWorkplaces.manageAssets')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {workplace.code} - {workplace.name}
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={handleClose} sx={neomorphIconButtonSx}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3, maxHeight: '60vh', overflowY: 'auto' }}>
        {/* Equipment Slots Section */}
        <EquipmentSlotsSection
          workplace={workplace}
          onEquipmentChange={handleEquipmentChange}
          isLoading={updateEquipmentMutation.isPending}
        />

        {/* Assigned Assets Section */}
        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            backgroundColor: sectionBg,
            boxShadow: neomorphBoxShadow,
            mb: 3,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <LinkIcon sx={{ color: accentColor }} />
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: accentColor }}>
              {t('physicalWorkplaces.assignedAssets')} ({fixedAssets?.length ?? 0})
            </Typography>
          </Stack>

          {isLoadingAssets ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} sx={{ color: accentColor }} />
            </Box>
          ) : assetsError ? (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {t('physicalWorkplaces.errorLoadingAssets')}
            </Alert>
          ) : fixedAssets && fixedAssets.length > 0 ? (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                borderRadius: 2,
                boxShadow: neomorphInsetShadow,
                backgroundColor: bgColor,
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: bgColor, fontWeight: 600 }}>
                      {t('assets.assetCode')}
                    </TableCell>
                    <TableCell sx={{ backgroundColor: bgColor, fontWeight: 600 }}>
                      {t('assets.type')}
                    </TableCell>
                    <TableCell sx={{ backgroundColor: bgColor, fontWeight: 600 }}>
                      {t('assets.brand')}
                    </TableCell>
                    <TableCell sx={{ backgroundColor: bgColor, fontWeight: 600 }}>
                      {t('assets.serialNumber')}
                    </TableCell>
                    <TableCell align="right" sx={{ backgroundColor: bgColor, fontWeight: 600 }}>
                      {t('common.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fixedAssets.map((asset) => (
                    <TableRow
                      key={asset.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: isDark
                            ? 'rgba(255, 119, 0, 0.05)'
                            : 'rgba(255, 119, 0, 0.03)',
                        },
                      }}
                    >
                      <TableCell>
                        <Typography fontWeight={600} sx={{ color: tealColor }}>
                          {asset.assetCode}
                        </Typography>
                      </TableCell>
                      <TableCell>{asset.assetType}</TableCell>
                      <TableCell>
                        {asset.brand}
                        {asset.model && ` ${asset.model}`}
                      </TableCell>
                      <TableCell>
                        {asset.serialNumber || (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleUnassignAsset(asset)}
                          disabled={unassignMutation.isPending}
                          sx={{
                            ...neomorphIconButtonSx,
                            color: theme.palette.error.main,
                            '&:hover': {
                              ...neomorphIconButtonSx['&:hover'],
                              color: theme.palette.error.dark,
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box
              sx={{
                p: 4,
                borderRadius: 2,
                boxShadow: neomorphInsetShadow,
                textAlign: 'center',
                backgroundColor: bgColor,
              }}
            >
              <InventoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {t('physicalWorkplaces.noAssetsAssigned')}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Add Asset Section */}
        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            backgroundColor: sectionBg,
            boxShadow: neomorphBoxShadow,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <AddIcon sx={{ color: accentColor }} />
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: accentColor }}>
              {t('physicalWorkplaces.addAsset')}
            </Typography>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
            <Autocomplete
              sx={{ flex: 1, minWidth: 300, ...neomorphTextFieldSx }}
              options={filteredAssets}
              loading={isLoadingAllAssets}
              value={selectedAsset}
              onChange={(_, newValue) => setSelectedAsset(newValue)}
              inputValue={searchQuery}
              onInputChange={(_, newInputValue) => setSearchQuery(newInputValue)}
              getOptionLabel={(option) =>
                `${option.assetCode} - ${option.assetName || option.category}`
              }
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography fontWeight={600} sx={{ color: accentColor }}>
                      {option.assetCode}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.category}
                      {option.brand && ` | ${option.brand}`}
                      {option.model && ` ${option.model}`}
                      {option.serialNumber && ` | S/N: ${option.serialNumber}`}
                    </Typography>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={t('physicalWorkplaces.searchAssetPlaceholder')}
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
              noOptionsText={t('physicalWorkplaces.noAvailableAssets')}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />

            <Box
              component="button"
              onClick={handleAssignAsset}
              disabled={!selectedAsset || assignMutation.isPending}
              sx={{
                ...neomorphPrimaryButtonSx,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 3,
                py: 1.5,
                cursor: 'pointer',
                minWidth: 120,
              }}
            >
              {assignMutation.isPending ? (
                <CircularProgress size={20} sx={{ color: '#fff' }} />
              ) : (
                <>
                  <AddIcon sx={{ fontSize: 20 }} />
                  {t('common.add')}
                </>
              )}
            </Box>
          </Stack>

          {availableAssets.length === 0 && !isLoadingAllAssets && (
            <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
              {t('physicalWorkplaces.allAssetsAssigned')}
            </Alert>
          )}
        </Box>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 3,
          borderTop: `1px solid ${isDark ? '#2a3038' : '#d0d7de'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {hasUnsavedChanges && (
          <Typography variant="body2" color="warning.main" sx={{ fontWeight: 500 }}>
            {t('common.unsavedChanges')}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
          {hasUnsavedChanges && (
            <Button
              variant="contained"
              startIcon={updateEquipmentMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={handleSaveEquipment}
              disabled={updateEquipmentMutation.isPending}
              sx={{
                bgcolor: tealColor,
                '&:hover': { bgcolor: '#00796b' },
              }}
            >
              {t('common.save')}
            </Button>
          )}
          <Box
            component="button"
            onClick={handleClose}
            sx={{
              ...neomorphButtonSx,
              px: 4,
              py: 1.5,
              cursor: 'pointer',
            }}
          >
            {t('common.close')}
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default WorkplaceAssetsDialog;

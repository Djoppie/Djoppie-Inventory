import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
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
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Autocomplete,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory';
import { useQuery } from '@tanstack/react-query';
import {
  usePhysicalWorkplaceAssets,
  useAssignAsset,
  useUnassignAsset,
} from '../../hooks/usePhysicalWorkplaces';
import { PhysicalWorkplace, WorkplaceFixedAsset } from '../../types/physicalWorkplace.types';
import { getAssets } from '../../api/assets.api';
import { Asset } from '../../types/asset.types';

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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
    } catch (err) {
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
    } catch (err) {
      onError?.(t('physicalWorkplaces.unassignError'));
    }
  };

  const handleClose = () => {
    setSelectedAsset(null);
    setSearchQuery('');
    onClose();
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
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: isMobile ? 0 : 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(255, 119, 0, 0.05)'
              : 'rgba(255, 119, 0, 0.02)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <InventoryIcon sx={{ color: 'primary.main' }} />
          <Box>
            <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
              {t('physicalWorkplaces.manageAssets')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'block' }}>
              {workplace.code} - {workplace.name}
            </Typography>
          </Box>
        </Stack>
        <IconButton size="small" onClick={handleClose} edge="end">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {/* Assigned Assets Section */}
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {t('physicalWorkplaces.assignedAssets')} ({fixedAssets?.length ?? 0})
        </Typography>

        {isLoadingAssets ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : assetsError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t('physicalWorkplaces.errorLoadingAssets')}
          </Alert>
        ) : fixedAssets && fixedAssets.length > 0 ? (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              mb: 3,
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 119, 0, 0.05)'
                        : 'rgba(255, 119, 0, 0.02)',
                  }}
                >
                  <TableCell sx={{ fontWeight: 600 }}>{t('assets.assetCode')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('assets.type')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('assets.brand')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('assets.serialNumber')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fixedAssets.map((asset) => (
                  <TableRow
                    key={asset.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(255, 119, 0, 0.05)'
                            : 'rgba(255, 119, 0, 0.02)',
                      },
                    }}
                  >
                    <TableCell>
                      <Typography fontWeight={600} color="primary.main">
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
                        color="error"
                        onClick={() => handleUnassignAsset(asset)}
                        disabled={unassignMutation.isPending}
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
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 1,
              textAlign: 'center',
              mb: 3,
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.02)'
                  : 'rgba(0, 0, 0, 0.01)',
            }}
          >
            <InventoryIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {t('physicalWorkplaces.noAssetsAssigned')}
            </Typography>
          </Paper>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Add Asset Section */}
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {t('physicalWorkplaces.addAsset')}
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
          <Autocomplete
            sx={{ flex: 1, minWidth: 300 }}
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
                  <Typography fontWeight={600} color="primary.main">
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
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            )}
            noOptionsText={t('physicalWorkplaces.noAvailableAssets')}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAssignAsset}
            disabled={!selectedAsset || assignMutation.isPending}
            sx={{ minWidth: 120 }}
          >
            {assignMutation.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t('common.add')
            )}
          </Button>
        </Stack>

        {availableAssets.length === 0 && !isLoadingAllAssets && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {t('physicalWorkplaces.allAssetsAssigned')}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={handleClose} variant="outlined">
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WorkplaceAssetsDialog;

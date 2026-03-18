import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  IconButton,
  Stack,
  Chip,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Select,
  MenuItem,
  InputLabel,
  Autocomplete,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import LaptopIcon from '@mui/icons-material/Laptop';
import HistoryIcon from '@mui/icons-material/History';
import PlaceIcon from '@mui/icons-material/Place';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { ROUTES } from '../constants/routes';
import UserAutocomplete from '../components/common/UserAutocomplete';
import { GraphUser, IntuneDevice } from '../types/graph.types';
import { Asset } from '../types/asset.types';
import { PhysicalWorkplace } from '../types/physicalWorkplace.types';
import { DeploymentMode, ExecuteDeploymentRequest, OccupantConflict } from '../types/deployment.types';
import {
  useExecuteDeployment,
  useCheckOccupantConflict,
  useAvailableLaptops,
  useIntuneDevicesByUser,
  useAssetBySerialNumber,
} from '../hooks/useDeployment';
import { usePhysicalWorkplaces } from '../hooks/usePhysicalWorkplaces';

// Scanner-style card wrapper - consistent with other pages
const scannerCardSx = {
  mb: 3,
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    borderColor: 'primary.main',
    boxShadow: (thm: { palette: { mode: string } }) =>
      thm.palette.mode === 'dark'
        ? '0 8px 32px rgba(255, 215, 0, 0.2), inset 0 0 24px rgba(255, 215, 0, 0.05)'
        : '0 4px 20px rgba(253, 185, 49, 0.3)',
  },
};

const iconButtonSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    borderColor: 'primary.main',
    boxShadow: (thm: { palette: { mode: string } }) =>
      thm.palette.mode === 'dark'
        ? '0 4px 16px rgba(255, 215, 0, 0.2)'
        : '0 2px 12px rgba(253, 185, 49, 0.3)',
  },
};

type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
};

const LaptopSwapPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Form state
  const [mode, setMode] = useState<DeploymentMode>(DeploymentMode.Swap);
  const [selectedUser, setSelectedUser] = useState<GraphUser | null>(null);
  const [selectedOldDevice, setSelectedOldDevice] = useState<IntuneDevice | null>(null);
  const [selectedNewAsset, setSelectedNewAsset] = useState<Asset | null>(null);
  const [oldAssetNewStatus, setOldAssetNewStatus] = useState<string>('Stock');
  const [selectedWorkplace, setSelectedWorkplace] = useState<PhysicalWorkplace | null>(null);
  const [newLaptopSearch, setNewLaptopSearch] = useState('');

  // Dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [occupantConflictDialogOpen, setOccupantConflictDialogOpen] = useState(false);
  const [occupantConflict, setOccupantConflict] = useState<OccupantConflict | null>(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Hooks
  const executeDeployment = useExecuteDeployment();
  const checkOccupantConflict = useCheckOccupantConflict();
  // Fetch user's devices from Intune using their email/UPN
  const { data: intuneDevices, isLoading: loadingIntuneDevices } = useIntuneDevicesByUser(
    selectedUser?.mail || selectedUser?.userPrincipalName || ''
  );
  const { data: availableLaptops, isLoading: loadingAvailableLaptops } = useAvailableLaptops(newLaptopSearch);
  const { data: workplaces, isLoading: loadingWorkplaces } = usePhysicalWorkplaces({});
  // Look up the local asset by serial number when an Intune device is selected
  const { data: oldAssetFromSerial } = useAssetBySerialNumber(
    selectedOldDevice?.serialNumber || ''
  );

  // Filter to show only Windows laptops from Intune devices
  const userLaptops = intuneDevices?.filter(d =>
    d.operatingSystem?.toLowerCase().includes('windows')
  ) || [];

  const handleUserChange = useCallback((_displayName: string, user: GraphUser | null) => {
    setSelectedUser(user);
    setSelectedOldDevice(null); // Reset old device when user changes
  }, []);

  const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMode(Number(event.target.value) as DeploymentMode);
    setSelectedOldDevice(null); // Reset old device when mode changes
  };

  const handleExecuteClick = async () => {
    // Validate required fields
    if (!selectedUser) {
      setSnackbar({ open: true, message: t('deployment.error.noUser'), severity: 'error' });
      return;
    }
    if (!selectedNewAsset) {
      setSnackbar({ open: true, message: t('deployment.error.noNewLaptop'), severity: 'error' });
      return;
    }
    if (mode === DeploymentMode.Swap && !selectedOldDevice) {
      setSnackbar({ open: true, message: t('deployment.error.noOldLaptop'), severity: 'error' });
      return;
    }

    // Check for occupant conflict if workplace is selected
    if (selectedWorkplace && selectedUser) {
      try {
        const conflict = await checkOccupantConflict.mutateAsync({
          physicalWorkplaceId: selectedWorkplace.id,
          ownerEntraId: selectedUser.id,
          ownerName: selectedUser.displayName,
          ownerEmail: selectedUser.mail || selectedUser.userPrincipalName,
        });

        if (conflict) {
          setOccupantConflict(conflict);
          setOccupantConflictDialogOpen(true);
          return;
        }
      } catch (error) {
        console.error('Error checking occupant conflict:', error);
      }
    }

    // Open confirmation dialog
    setConfirmDialogOpen(true);
  };

  const handleConfirmDeployment = async (forceOccupantUpdate = false) => {
    setConfirmDialogOpen(false);
    setOccupantConflictDialogOpen(false);

    if (!selectedUser || !selectedNewAsset) return;

    const request: ExecuteDeploymentRequest = {
      mode,
      newOwnerEntraId: selectedUser.id,
      newOwnerName: selectedUser.displayName,
      newOwnerEmail: selectedUser.mail || selectedUser.userPrincipalName,
      newOwnerJobTitle: selectedUser.jobTitle,
      newOwnerOfficeLocation: selectedUser.officeLocation,
      newLaptopAssetId: selectedNewAsset.id,
      // Use local asset ID from serial number lookup (if found)
      oldLaptopAssetId: mode === DeploymentMode.Swap ? oldAssetFromSerial?.id : undefined,
      physicalWorkplaceId: selectedWorkplace?.id,
      updateEquipmentSlots: false,
    };

    try {
      await executeDeployment.mutateAsync({ request, forceOccupantUpdate });

      const successMessage = mode === DeploymentMode.Swap
        ? t('deployment.success.swapComplete', { userName: selectedUser.displayName })
        : t('deployment.success.onboardingComplete', { userName: selectedUser.displayName });

      setSnackbar({ open: true, message: successMessage, severity: 'success' });

      // Reset form
      setSelectedUser(null);
      setSelectedOldDevice(null);
      setSelectedNewAsset(null);
      setSelectedWorkplace(null);
      setNewLaptopSearch('');
    } catch (error) {
      console.error('Deployment failed:', error);
      setSnackbar({
        open: true,
        message: t('deployment.error.generic'),
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const canExecute = Boolean(
    selectedUser &&
    selectedNewAsset &&
    (mode === DeploymentMode.Onboarding || selectedOldDevice)
  );

  return (
    <Box sx={{ pb: 10 }}>
      {/* Back Button & History Link */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Tooltip title={t('common.backToDashboard')}>
          <IconButton
            onClick={() => navigate('/')}
            sx={{
              ...iconButtonSx,
              color: 'text.secondary',
              '&:hover': {
                ...iconButtonSx['&:hover'],
                color: 'primary.main',
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Button
          startIcon={<HistoryIcon />}
          onClick={() => navigate(ROUTES.DEPLOYMENT_HISTORY)}
          variant="outlined"
          size="small"
        >
          {t('deployment.history.title')}
        </Button>
      </Stack>

      {/* Header */}
      <Card elevation={0} sx={scannerCardSx}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: (thm) =>
                  thm.palette.mode === 'dark'
                    ? 'rgba(255, 215, 0, 0.08)'
                    : 'rgba(253, 185, 49, 0.08)',
              }}
            >
              <SwapHorizIcon
                sx={{
                  fontSize: 28,
                  color: 'primary.main',
                  filter: (thm: { palette: { mode: string } }) =>
                    thm.palette.mode === 'dark'
                      ? 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))'
                      : 'none',
                }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" component="h1" fontWeight={700}>
                {t('deployment.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {t('deployment.subtitle')}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Mode Selection */}
      <Card elevation={0} sx={scannerCardSx}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {t('deployment.mode.label')}
          </Typography>
          <FormControl component="fieldset">
            <RadioGroup
              row={!isMobile}
              value={mode}
              onChange={handleModeChange}
            >
              <FormControlLabel
                value={DeploymentMode.Swap}
                control={<Radio />}
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <SwapHorizIcon color="primary" />
                    <Box>
                      <Typography fontWeight={500}>{t('deployment.mode.swap')}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('deployment.mode.swapDesc')}
                      </Typography>
                    </Box>
                  </Stack>
                }
              />
              <FormControlLabel
                value={DeploymentMode.Onboarding}
                control={<Radio />}
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PersonAddIcon color="success" />
                    <Box>
                      <Typography fontWeight={500}>{t('deployment.mode.onboarding')}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('deployment.mode.onboardingDesc')}
                      </Typography>
                    </Box>
                  </Stack>
                }
              />
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>

      {/* User Selection */}
      <Card elevation={0} sx={scannerCardSx}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" mb={2}>
            <PersonIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              {t('deployment.user.title')}
            </Typography>
          </Stack>
          <UserAutocomplete
            value={selectedUser?.displayName || ''}
            onChange={handleUserChange}
            label={t('deployment.user.search')}
            required
          />
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Chip
                icon={<PersonIcon />}
                label={selectedUser.displayName}
                color="success"
                sx={{ mr: 1 }}
              />
              {selectedUser.mail && (
                <Typography variant="caption" color="text.secondary">
                  {selectedUser.mail}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Old Device Selection (Swap mode only) */}
      {mode === DeploymentMode.Swap && (
        <Card elevation={0} sx={scannerCardSx}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <LaptopIcon color="warning" />
              <Typography variant="h6" fontWeight={600}>
                {t('deployment.oldLaptop.title')}
              </Typography>
            </Stack>

            {!selectedUser ? (
              <Typography color="text.secondary" fontStyle="italic">
                {t('deployment.user.noUserSelected')}
              </Typography>
            ) : loadingIntuneDevices ? (
              <CircularProgress size={24} />
            ) : userLaptops.length === 0 ? (
              <Typography color="text.secondary">
                {t('deployment.oldLaptop.noOldLaptop')}
              </Typography>
            ) : (
              <>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>{t('deployment.oldLaptop.select')}</InputLabel>
                  <Select
                    value={selectedOldDevice?.id || ''}
                    onChange={(e) => {
                      const device = userLaptops.find(d => d.id === e.target.value);
                      setSelectedOldDevice(device || null);
                    }}
                    label={t('deployment.oldLaptop.select')}
                  >
                    {userLaptops.map((device) => (
                      <MenuItem key={device.id} value={device.id}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <LaptopIcon fontSize="small" />
                          <Typography>{device.deviceName}</Typography>
                          {device.serialNumber && (
                            <Typography variant="caption" color="text.secondary">
                              ({device.serialNumber})
                            </Typography>
                          )}
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedOldDevice && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      {t('deployment.oldLaptop.newStatus')}
                    </Typography>
                    <FormControl fullWidth>
                      <Select
                        value={oldAssetNewStatus}
                        onChange={(e) => setOldAssetNewStatus(e.target.value)}
                      >
                        <MenuItem value="Stock">{t('deployment.oldLaptop.statusOptions.stock')}</MenuItem>
                        <MenuItem value="Defect">{t('deployment.oldLaptop.statusOptions.defect')}</MenuItem>
                        <MenuItem value="UitDienst">{t('deployment.oldLaptop.statusOptions.uitdienst')}</MenuItem>
                      </Select>
                    </FormControl>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* New Device Selection */}
      <Card elevation={0} sx={scannerCardSx}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" mb={2}>
            <LaptopIcon color="success" />
            <Typography variant="h6" fontWeight={600}>
              {t('deployment.newLaptop.title')}
            </Typography>
          </Stack>

          <Autocomplete
            options={availableLaptops || []}
            loading={loadingAvailableLaptops}
            value={selectedNewAsset}
            onChange={(_, value) => setSelectedNewAsset(value)}
            inputValue={newLaptopSearch}
            onInputChange={(_, value) => setNewLaptopSearch(value)}
            getOptionLabel={(option) => `${option.assetCode}${option.serialNumber ? ` (${option.serialNumber})` : ''}`}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('deployment.newLaptop.search')}
                helperText={t('deployment.newLaptop.searchHint')}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingAvailableLaptops && <CircularProgress size={20} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.id}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <LaptopIcon fontSize="small" color="success" />
                  <Box>
                    <Typography fontWeight={500}>{option.assetCode}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.brand} {option.model}
                      {option.serialNumber && ` - ${option.serialNumber}`}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
            noOptionsText={t('deployment.newLaptop.noNewLaptop')}
          />

          {selectedNewAsset && (
            <Box sx={{ mt: 2 }}>
              <Chip
                icon={<LaptopIcon />}
                label={`${selectedNewAsset.assetCode} (${selectedNewAsset.brand || ''} ${selectedNewAsset.model || ''})`}
                color="success"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Workplace Selection (Optional) */}
      <Card elevation={0} sx={scannerCardSx}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" mb={2}>
            <PlaceIcon color="info" />
            <Typography variant="h6" fontWeight={600}>
              {t('deployment.workplace.title')}
            </Typography>
          </Stack>

          <Autocomplete
            options={workplaces || []}
            loading={loadingWorkplaces}
            value={selectedWorkplace}
            onChange={(_, value) => setSelectedWorkplace(value)}
            getOptionLabel={(option) => `${option.code} - ${option.name}`}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('deployment.workplace.select')}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingWorkplaces && <CircularProgress size={20} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.id}>
                <Stack>
                  <Typography fontWeight={500}>{option.code} - {option.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.buildingName}
                    {option.floor && ` - ${option.floor}`}
                    {option.currentOccupantName && ` (${option.currentOccupantName})`}
                  </Typography>
                </Stack>
              </Box>
            )}
          />

          {selectedWorkplace && (
            <Box sx={{ mt: 2 }}>
              <Chip
                icon={<PlaceIcon />}
                label={`${selectedWorkplace.code} - ${selectedWorkplace.name}`}
                color="info"
                variant="outlined"
                sx={{ mr: 1 }}
              />
              {selectedWorkplace.currentOccupantName && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {t('deployment.workplace.currentOccupant')}: {selectedWorkplace.currentOccupantName}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Execute Button */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          border: '1px solid',
          borderColor: canExecute ? 'success.main' : 'divider',
          borderRadius: 2,
          textAlign: 'center',
        }}
      >
        <Button
          variant="contained"
          size="large"
          color="success"
          startIcon={executeDeployment.isPending ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
          onClick={handleExecuteClick}
          disabled={!canExecute || executeDeployment.isPending}
          sx={{ px: 4, py: 1.5 }}
        >
          {executeDeployment.isPending
            ? t('deployment.execute.executing')
            : t('deployment.execute.button')}
        </Button>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>{t('deployment.execute.confirmTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {mode === DeploymentMode.Swap
              ? t('deployment.execute.confirmSwap', { userName: selectedUser?.displayName })
              : t('deployment.execute.confirmOnboarding', { userName: selectedUser?.displayName })}
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            {mode === DeploymentMode.Swap && selectedOldDevice && (
              <Typography variant="body2">
                {t('deployment.execute.oldDevice', {
                  device: selectedOldDevice.deviceName || selectedOldDevice.serialNumber,
                  status: oldAssetNewStatus,
                })}
              </Typography>
            )}
            {selectedNewAsset && (
              <Typography variant="body2">
                {t('deployment.execute.newDevice', { device: selectedNewAsset.assetCode })}
              </Typography>
            )}
            {selectedWorkplace && (
              <Typography variant="body2">
                {t('deployment.execute.workplaceUpdate', { workplace: selectedWorkplace.name })}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={() => handleConfirmDeployment(false)} color="success" variant="contained">
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Occupant Conflict Dialog */}
      <Dialog open={occupantConflictDialogOpen} onClose={() => setOccupantConflictDialogOpen(false)}>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <WarningIcon color="warning" />
            <span>{t('deployment.occupantConflict.title')}</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('deployment.occupantConflict.message', {
              currentOccupant: occupantConflict?.currentOccupantName,
            })}
          </DialogContentText>
          <DialogContentText sx={{ mt: 1 }}>
            {t('deployment.occupantConflict.question', {
              newOccupant: selectedUser?.displayName,
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOccupantConflictDialogOpen(false)}>{t('deployment.occupantConflict.cancel')}</Button>
          <Button onClick={() => handleConfirmDeployment(true)} color="warning" variant="contained">
            {t('deployment.occupantConflict.confirmUpdate')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LaptopSwapPage;

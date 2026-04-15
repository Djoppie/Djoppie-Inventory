import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  AlertTitle,
  CircularProgress,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { intuneApi, ImportIntuneDevicesResult } from '../../../api/intune.api';
import { assetTypesApi } from '../../../api/admin.api';

interface Props {
  open: boolean;
  onClose: () => void;
}

const steps = ['Selecteer apparaten', 'Configureer import', 'Resultaat'];

const IntuneImportDialog = ({ open, onClose }: Props) => {
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [assetTypeId, setAssetTypeId] = useState<number>(0);
  const [status, setStatus] = useState('Stock');
  const [importResult, setImportResult] = useState<ImportIntuneDevicesResult | null>(null);

  // Fetch Intune devices
  const devicesQuery = useQuery({
    queryKey: ['intune-devices'],
    queryFn: intuneApi.getAllDevices,
    enabled: open,
  });

  // Fetch asset types
  const assetTypesQuery = useQuery({
    queryKey: ['asset-types'],
    queryFn: () => assetTypesApi.getAll(true),
    enabled: open,
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: intuneApi.importDevicesAsAssets,
    onSuccess: (data) => {
      setImportResult(data);
      setActiveStep(2);
      // Invalidate assets query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });

  // Reset state when dialog opens - intentional state reset triggered by prop change
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveStep(0);
      setSelectedDevices([]);
      setSearchTerm('');
      setAssetTypeId(0);
      setStatus('Stock');
      setImportResult(null);
    }
  }, [open]);

  // Set default asset type to first laptop type - one-time initialization when data loads
  useEffect(() => {
    if (assetTypesQuery.data && assetTypeId === 0) {
      const laptopType = assetTypesQuery.data.find(
        (t) => t.name.toLowerCase().includes('laptop')
      );
      if (laptopType) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAssetTypeId(laptopType.id);
      } else if (assetTypesQuery.data.length > 0) {
        setAssetTypeId(assetTypesQuery.data[0].id);
      }
    }
  }, [assetTypesQuery.data, assetTypeId]);

  const filteredDevices = (devicesQuery.data || []).filter((device) => {
    const search = searchTerm.toLowerCase();
    return (
      device.deviceName?.toLowerCase().includes(search) ||
      device.serialNumber?.toLowerCase().includes(search) ||
      device.model?.toLowerCase().includes(search) ||
      device.userPrincipalName?.toLowerCase().includes(search)
    );
  });

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedDevices(filteredDevices.map((d) => d.id || '').filter(Boolean));
    } else {
      setSelectedDevices([]);
    }
  };

  const handleSelectDevice = (deviceId: string) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const handleNext = () => {
    if (activeStep === 1) {
      // Start import
      importMutation.mutate({
        deviceIds: selectedDevices,
        assetTypeId,
        status,
      });
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const renderDeviceSelection = () => (
    <Box>
      <TextField
        fullWidth
        placeholder="Zoek op naam, serienummer, model of gebruiker..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      {devicesQuery.isLoading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : devicesQuery.isError ? (
        <Alert severity="error">
          <AlertTitle>Fout bij ophalen apparaten</AlertTitle>
          {devicesQuery.error instanceof Error
            ? devicesQuery.error.message
            : 'Kon Intune apparaten niet ophalen'}
        </Alert>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {selectedDevices.length} van {filteredDevices.length} apparaten geselecteerd
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selectedDevices.length > 0 &&
                        selectedDevices.length < filteredDevices.length
                      }
                      checked={
                        filteredDevices.length > 0 &&
                        selectedDevices.length === filteredDevices.length
                      }
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Apparaatnaam</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Serienummer</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Model</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Gebruiker</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>OS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDevices.map((device) => (
                  <TableRow
                    key={device.id}
                    hover
                    onClick={() => handleSelectDevice(device.id || '')}
                    selected={selectedDevices.includes(device.id || '')}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox checked={selectedDevices.includes(device.id || '')} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {device.deviceName || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {device.serialNumber || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>{device.model || '-'}</TableCell>
                    <TableCell>{device.userPrincipalName || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={device.operatingSystem || 'Unknown'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {filteredDevices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary" py={2}>
                        Geen apparaten gevonden
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );

  const renderConfiguration = () => (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Geselecteerde apparaten: {selectedDevices.length}</AlertTitle>
        Deze apparaten worden als nieuwe assets toegevoegd aan de inventaris.
      </Alert>

      <Stack spacing={3}>
        <FormControl fullWidth>
          <InputLabel>Asset Type</InputLabel>
          <Select
            value={assetTypeId}
            onChange={(e) => setAssetTypeId(Number(e.target.value))}
            label="Asset Type"
          >
            {assetTypesQuery.data?.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Initiële Status</InputLabel>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            label="Initiële Status"
          >
            <MenuItem value="Stock">Stock</MenuItem>
            <MenuItem value="Nieuw">Nieuw</MenuItem>
            <MenuItem value="InGebruik">In Gebruik</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Alert severity="warning" sx={{ mt: 3 }}>
        <Typography variant="body2">
          Apparaten met een serienummer dat al in de inventaris bestaat worden overgeslagen.
        </Typography>
      </Alert>
    </Box>
  );

  const renderResult = () => {
    if (!importResult) return null;

    return (
      <Box>
        <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 3 }}>
          <Chip
            icon={<CheckCircleIcon />}
            label={`${importResult.imported} Geimporteerd`}
            color="success"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
          <Chip
            icon={<WarningIcon />}
            label={`${importResult.skipped} Overgeslagen`}
            color="warning"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
          <Chip
            icon={<ErrorIcon />}
            label={`${importResult.failed} Mislukt`}
            color="error"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        </Stack>

        {importResult.importedDevices.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Geimporteerde apparaten
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Asset Code</TableCell>
                    <TableCell>Apparaatnaam</TableCell>
                    <TableCell>Serienummer</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importResult.importedDevices.map((device) => (
                    <TableRow
                      key={device.deviceId}
                      sx={{ bgcolor: (theme) => alpha(theme.palette.success.main, 0.05) }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {device.assetCode}
                        </Typography>
                      </TableCell>
                      <TableCell>{device.deviceName}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{device.serialNumber}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {importResult.skippedDevices.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Overgeslagen apparaten
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Apparaatnaam</TableCell>
                    <TableCell>Serienummer</TableCell>
                    <TableCell>Reden</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importResult.skippedDevices.map((device) => (
                    <TableRow
                      key={device.deviceId}
                      sx={{ bgcolor: (theme) => alpha(theme.palette.warning.main, 0.05) }}
                    >
                      <TableCell>{device.deviceName}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{device.serialNumber}</TableCell>
                      <TableCell>{device.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {importResult.failedDevices.length > 0 && (
          <Box>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Mislukte apparaten
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Apparaatnaam</TableCell>
                    <TableCell>Fout</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importResult.failedDevices.map((device) => (
                    <TableRow
                      key={device.deviceId}
                      sx={{ bgcolor: (theme) => alpha(theme.palette.error.main, 0.05) }}
                    >
                      <TableCell>{device.deviceName}</TableCell>
                      <TableCell color="error">{device.error}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={2} alignItems="center">
          <CloudDownloadIcon color="primary" />
          <Typography variant="h6">Intune Apparaten Importeren</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {importMutation.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>Import Mislukt</AlertTitle>
            {importMutation.error instanceof Error
              ? importMutation.error.message
              : 'Er is een fout opgetreden tijdens de import'}
          </Alert>
        )}

        {activeStep === 0 && renderDeviceSelection()}
        {activeStep === 1 && renderConfiguration()}
        {activeStep === 2 && renderResult()}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>
          {activeStep === 2 ? 'Sluiten' : 'Annuleren'}
        </Button>

        {activeStep > 0 && activeStep < 2 && (
          <Button onClick={handleBack} disabled={importMutation.isPending}>
            Vorige
          </Button>
        )}

        {activeStep < 2 && (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={
              (activeStep === 0 && selectedDevices.length === 0) ||
              (activeStep === 1 && assetTypeId === 0) ||
              importMutation.isPending
            }
            startIcon={
              importMutation.isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : activeStep === 1 ? (
                <CloudDownloadIcon />
              ) : undefined
            }
          >
            {activeStep === 1
              ? importMutation.isPending
                ? 'Importeren...'
                : 'Importeren'
              : 'Volgende'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default IntuneImportDialog;

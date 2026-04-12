import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  AlertTitle,
  CircularProgress,
  Stack,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse,
  alpha,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DevicesIcon from '@mui/icons-material/Devices';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { useMutation } from '@tanstack/react-query';
import { intuneApi, IntuneSyncResult } from '../../api/intune.api';
import IntuneImportDialog from '../devices/intune/IntuneImportDialog';

const IntuneSyncTab = () => {
  const [syncResult, setSyncResult] = useState<IntuneSyncResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const syncMutation = useMutation({
    mutationFn: () => intuneApi.syncIntuneDataToAssets(),
    onSuccess: (data) => {
      setSyncResult(data);
    },
  });

  const handleSync = () => {
    setSyncResult(null);
    syncMutation.mutate();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Success':
        return 'success';
      case 'NotFound':
        return 'warning';
      case 'Error':
        return 'error';
      case 'Skipped':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Success':
        return <CheckCircleIcon fontSize="small" />;
      case 'NotFound':
        return <WarningIcon fontSize="small" />;
      case 'Error':
        return <ErrorIcon fontSize="small" />;
      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Header Section */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: (theme) =>
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.info.main, 0.05)
              : alpha(theme.palette.info.main, 0.02),
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
              }}
            >
              <DevicesIcon sx={{ fontSize: 28, color: 'info.main' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={600}>
                Intune Data Synchronisatie
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Synchroniseer Intune gegevens (enrollment datum, laatste check-in, certificaat
                vervaldatum) naar alle laptops en desktops in de inventaris.
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={
                syncMutation.isPending ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <SyncIcon />
                )
              }
              onClick={handleSync}
              disabled={syncMutation.isPending}
              sx={{
                px: 4,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
              }}
            >
              {syncMutation.isPending ? 'Synchroniseren...' : 'Start Intune Sync'}
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              size="large"
              startIcon={<CloudDownloadIcon />}
              onClick={() => setImportDialogOpen(true)}
              sx={{
                px: 4,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
              }}
            >
              Apparaten Importeren
            </Button>

            {syncResult && (
              <Typography variant="body2" color="text.secondary">
                Laatste sync: {new Date(syncResult.completedAt).toLocaleString()}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {syncMutation.isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Synchronisatie Mislukt</AlertTitle>
          {syncMutation.error instanceof Error
            ? syncMutation.error.message
            : 'Er is een onbekende fout opgetreden'}
        </Alert>
      )}

      {/* Results Section */}
      {syncResult && (
        <Card
          elevation={0}
          sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Synchronisatie Resultaat
            </Typography>

            {/* Summary Stats */}
            <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 3 }}>
              <Chip
                icon={<CheckCircleIcon />}
                label={`${syncResult.successCount} Geslaagd`}
                color="success"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                icon={<WarningIcon />}
                label={`${syncResult.notFoundCount} Niet gevonden`}
                color="warning"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                icon={<ErrorIcon />}
                label={`${syncResult.errorCount} Fouten`}
                color="error"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                label={`${syncResult.skippedCount} Overgeslagen`}
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                label={`Totaal: ${syncResult.totalProcessed}`}
                color="primary"
                sx={{ fontWeight: 600 }}
              />
            </Stack>

            {/* Duration */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Duur: {syncResult.duration}
            </Typography>

            {/* Errors List */}
            {syncResult.errors.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <AlertTitle>Fouten tijdens synchronisatie</AlertTitle>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {syncResult.errors.slice(0, 5).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {syncResult.errors.length > 5 && (
                    <li>...en {syncResult.errors.length - 5} meer fouten</li>
                  )}
                </ul>
              </Alert>
            )}

            {/* Details Toggle */}
            <Button
              variant="text"
              onClick={() => setShowDetails(!showDetails)}
              endIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ mb: 1 }}
            >
              {showDetails ? 'Verberg details' : 'Toon details'} ({syncResult.items.length} items)
            </Button>

            {/* Details Table */}
            <Collapse in={showDetails}>
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ maxHeight: 400, mt: 1 }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Asset Code</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Serienummer</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Enrollment</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Laatste Check-in</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Certificaat Vervalt</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {syncResult.items.map((item) => (
                      <TableRow
                        key={item.assetId}
                        sx={{
                          bgcolor:
                            item.status === 'Error'
                              ? (theme) => alpha(theme.palette.error.main, 0.05)
                              : item.status === 'NotFound'
                                ? (theme) => alpha(theme.palette.warning.main, 0.05)
                                : 'inherit',
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {item.assetCode}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {item.serialNumber || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(item.status) || undefined}
                            label={item.status}
                            color={getStatusColor(item.status) as any}
                            size="small"
                            variant="outlined"
                          />
                          {item.errorMessage && (
                            <Typography
                              variant="caption"
                              color="error"
                              display="block"
                              sx={{ mt: 0.5 }}
                            >
                              {item.errorMessage}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.intuneEnrollmentDate
                            ? new Date(item.intuneEnrollmentDate).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {item.intuneLastCheckIn
                            ? new Date(item.intuneLastCheckIn).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {item.intuneCertificateExpiry
                            ? new Date(item.intuneCertificateExpiry).toLocaleDateString()
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Collapse>
          </CardContent>
        </Card>
      )}

      {/* Info Section */}
      {!syncResult && !syncMutation.isPending && (
        <Alert severity="info" icon={<DevicesIcon />}>
          <AlertTitle>Hoe werkt de Intune Sync?</AlertTitle>
          <Typography variant="body2">
            De synchronisatie haalt gegevens op van alle apparaten in Microsoft Intune en koppelt
            deze aan de assets in de inventaris op basis van serienummer. De volgende gegevens
            worden gesynchroniseerd:
          </Typography>
          <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
            <li>
              <strong>Enrollment datum</strong> - Wanneer het apparaat is ingeschreven in Intune
            </li>
            <li>
              <strong>Laatste check-in</strong> - Wanneer het apparaat voor het laatst heeft
              gesynchroniseerd met Intune
            </li>
            <li>
              <strong>Certificaat vervaldatum</strong> - Wanneer het management certificaat
              verloopt
            </li>
          </ul>
          <Typography variant="body2" color="text.secondary">
            Alleen laptops en desktops met een serienummer worden gesynchroniseerd.
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2">
            <strong>Apparaten Importeren:</strong> Gebruik de knop "Apparaten Importeren" om nieuwe
            Intune apparaten toe te voegen aan de inventaris als assets.
          </Typography>
        </Alert>
      )}

      {/* Import Dialog */}
      <IntuneImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
      />
    </Box>
  );
};

export default IntuneSyncTab;

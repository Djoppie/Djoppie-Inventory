import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useImportLeaseCsv } from '../../../hooks/reports';
import type { LeaseImportResult } from '../../../types/report.types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const LeaseImportDialog = ({ open, onClose }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<LeaseImportResult | null>(null);
  const importMutation = useImportLeaseCsv();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
  };

  const handleImport = async () => {
    if (!file) return;
    try {
      const r = await importMutation.mutateAsync(file);
      setResult(r);
    } catch (e) {
      // Error surfaced via mutation.error
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    importMutation.reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Leasing CSV importeren</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Upload het Excel/CSV-export bestand van de leverancier. Vereiste kolommen:
          <strong> Serial number</strong>, <strong>Lease schedule</strong>, <strong>Planned lease end</strong>.
          Optioneel: Asset class, Description, Contract status, Customer.
        </Typography>

        <Box
          sx={{
            border: '2px dashed',
            borderColor: file ? 'primary.main' : 'divider',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            mb: 2,
          }}
        >
          <UploadFileIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body2" sx={{ mb: 1 }}>
            {file ? file.name : 'Selecteer een .csv-bestand'}
          </Typography>
          <Button variant="outlined" component="label" size="small">
            {file ? 'Ander bestand kiezen' : 'Kies bestand'}
            <input type="file" accept=".csv,text/csv" hidden onChange={handleFileChange} />
          </Button>
        </Box>

        {importMutation.isPending && <LinearProgress sx={{ mb: 2 }} />}

        {importMutation.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Import mislukt: {(importMutation.error as Error).message}
          </Alert>
        )}

        {result && (
          <Box>
            <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
              Import voltooid.
            </Alert>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip label={`${result.contractsCreated} contracten aangemaakt`} color="success" />
              <Chip label={`${result.contractsUpdated} contracten bijgewerkt`} color="info" />
              <Chip label={`${result.assetsLinked} assets gekoppeld`} color="primary" />
              <Chip label={`${result.assetsUpdated} assets bijgewerkt`} variant="outlined" />
              {result.unmatchedSerials.length > 0 && (
                <Chip
                  icon={<WarningAmberIcon />}
                  label={`${result.unmatchedSerials.length} serials niet gevonden`}
                  color="warning"
                />
              )}
            </Box>

            {result.errors.length > 0 && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="error" sx={{ mb: 1 }}>
                  Fouten ({result.errors.length})
                </Typography>
                <List dense disablePadding sx={{ maxHeight: 150, overflow: 'auto', bgcolor: 'action.hover', borderRadius: 1, mb: 2 }}>
                  {result.errors.map((err, i) => (
                    <ListItem key={i}>
                      <ErrorOutlineIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
                      <ListItemText primary={err} />
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            {result.unmatchedSerials.length > 0 && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Niet-gevonden serienummers
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Deze serials staan in de CSV maar zijn niet in jullie inventaris terug te vinden.
                  Voeg de assets eerst toe (of corrigeer het serienummer) en herupload.
                </Typography>
                <List dense disablePadding sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'action.hover', borderRadius: 1 }}>
                  {result.unmatchedSerials.map((u, i) => (
                    <ListItem key={i}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
                              {u.serialNumber}
                            </Typography>
                            {u.leaseScheduleNumber && (
                              <Chip label={u.leaseScheduleNumber} size="small" variant="outlined" />
                            )}
                          </Box>
                        }
                        secondary={u.description}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{result ? 'Sluiten' : 'Annuleren'}</Button>
        {!result && (
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={!file || importMutation.isPending}
          >
            Importeren
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default LeaseImportDialog;

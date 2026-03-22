import { useState, useRef } from 'react';
import {
  Box,
  TextField,
  Fab,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  FormControlLabel,
  Switch,
  Divider,
  Button,
  MenuItem,
  Stack,
  Tooltip,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AdminDataTable, { Column } from './AdminDataTable';
import AdminFormDialog from './AdminFormDialog';
import {
  PhysicalWorkplace,
  WorkplaceType,
  WorkplaceTypeLabels,
  CreatePhysicalWorkplaceDto,
  UpdatePhysicalWorkplaceDto,
} from '../../types/physicalWorkplace.types';
import {
  usePhysicalWorkplaces,
  useCreatePhysicalWorkplace,
  useUpdatePhysicalWorkplace,
  useDeletePhysicalWorkplace,
  useDownloadWorkplaceTemplate,
  useExportWorkplacesCsv,
  useImportWorkplacesCsv,
} from '../../hooks/usePhysicalWorkplaces';
import { useBuildings } from '../../hooks/useBuildings';
import { useServices } from '../../hooks/useServices';
import Loading from '../common/Loading';
import { WorkplaceCsvImportResult } from '../../api/physicalWorkplaces.api';

interface FormData {
  code: string;
  name: string;
  description: string;
  buildingId: string;
  serviceId: string;
  floor: string;
  room: string;
  type: WorkplaceType;
  isActive: boolean;
}

const initialFormData: FormData = {
  code: '',
  name: '',
  description: '',
  buildingId: '',
  serviceId: '',
  floor: '',
  room: '',
  type: WorkplaceType.Laptop,
  isActive: true,
};

const PhysicalWorkplacesTab = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importResultDialogOpen, setImportResultDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<WorkplaceCsvImportResult | null>(null);
  const [editingItem, setEditingItem] = useState<PhysicalWorkplace | null>(null);
  const [deletingItem, setDeletingItem] = useState<PhysicalWorkplace | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data queries
  const { data: workplaces = [], isLoading } = usePhysicalWorkplaces();
  const { data: buildings = [] } = useBuildings();
  const { data: services = [] } = useServices();

  // Mutations
  const createMutation = useCreatePhysicalWorkplace();
  const updateMutation = useUpdatePhysicalWorkplace();
  const deleteMutation = useDeletePhysicalWorkplace();
  const downloadTemplateMutation = useDownloadWorkplaceTemplate();
  const exportCsvMutation = useExportWorkplacesCsv();
  const importCsvMutation = useImportWorkplacesCsv();

  const handleOpenDialog = (item?: PhysicalWorkplace) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        code: item.code,
        name: item.name,
        description: item.description || '',
        buildingId: String(item.buildingId),
        serviceId: item.serviceId ? String(item.serviceId) : '',
        floor: item.floor || '',
        room: item.room || '',
        type: item.type,
        isActive: item.isActive,
      });
    } else {
      setEditingItem(null);
      setFormData(initialFormData);
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const handleOpenDeleteDialog = (item: PhysicalWorkplace) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingItem(null);
  };

  const handleInputChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = event.target as HTMLInputElement;
    const value = field === 'isActive' ? target.checked : target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSelectChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.code.trim()) {
      errors.code = 'Code is verplicht';
    }
    if (!formData.name.trim()) {
      errors.name = 'Naam is verplicht';
    }
    if (!formData.buildingId) {
      errors.buildingId = 'Gebouw is verplicht';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingItem) {
        const dto: UpdatePhysicalWorkplaceDto = {
          code: formData.code.trim(),
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          buildingId: Number(formData.buildingId),
          serviceId: formData.serviceId ? Number(formData.serviceId) : undefined,
          floor: formData.floor.trim() || undefined,
          room: formData.room.trim() || undefined,
          type: formData.type,
          isActive: formData.isActive,
        };
        await updateMutation.mutateAsync({ id: editingItem.id, data: dto });
        setSnackbar({ open: true, message: 'Werkplek bijgewerkt', severity: 'success' });
      } else {
        const dto: CreatePhysicalWorkplaceDto = {
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          buildingId: Number(formData.buildingId),
          serviceId: formData.serviceId ? Number(formData.serviceId) : undefined,
          floor: formData.floor.trim() || undefined,
          room: formData.room.trim() || undefined,
          type: formData.type,
        };
        await createMutation.mutateAsync(dto);
        setSnackbar({ open: true, message: 'Werkplek aangemaakt', severity: 'success' });
      }
      handleCloseDialog();
    } catch {
      setSnackbar({ open: true, message: 'Fout bij opslaan werkplek', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteMutation.mutateAsync({ id: deletingItem.id });
      setSnackbar({ open: true, message: 'Werkplek verwijderd', severity: 'success' });
      handleCloseDeleteDialog();
    } catch {
      setSnackbar({ open: true, message: 'Fout bij verwijderen werkplek', severity: 'error' });
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplateMutation.mutateAsync();
      setSnackbar({ open: true, message: 'Template gedownload', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Fout bij downloaden template', severity: 'error' });
    }
  };

  const handleExportCsv = async () => {
    try {
      await exportCsvMutation.mutateAsync({});
      setSnackbar({ open: true, message: 'Werkplekken geëxporteerd', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Fout bij exporteren werkplekken', severity: 'error' });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await importCsvMutation.mutateAsync(file);
      setImportResult(result);
      setImportResultDialogOpen(true);
      if (result.isFullySuccessful) {
        setSnackbar({ open: true, message: `${result.successCount} werkplekken geïmporteerd`, severity: 'success' });
      } else if (result.successCount > 0) {
        setSnackbar({ open: true, message: `${result.successCount} van ${result.totalRows} werkplekken geïmporteerd`, severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Geen werkplekken geïmporteerd', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Fout bij importeren werkplekken', severity: 'error' });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const columns: Column<PhysicalWorkplace>[] = [
    {
      id: 'code',
      label: 'Code',
      minWidth: 100,
      format: (item) => (
        <Typography sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#009688' }}>
          {item.code}
        </Typography>
      ),
    },
    { id: 'name', label: 'Naam', minWidth: 150 },
    {
      id: 'type',
      label: 'Type',
      minWidth: 120,
      format: (item) => WorkplaceTypeLabels[item.type] || item.type,
    },
    {
      id: 'buildingName',
      label: 'Gebouw',
      minWidth: 120,
      format: (item) => item.buildingName || '-',
    },
    {
      id: 'serviceName',
      label: 'Dienst',
      minWidth: 120,
      format: (item) => item.serviceName || '-',
    },
    {
      id: 'floor',
      label: 'Verdieping',
      minWidth: 80,
      format: (item) => item.floor || '-',
    },
  ];

  if (isLoading) return <Loading message="Werkplekken laden..." />;

  const isAnyMutationPending = downloadTemplateMutation.isPending || exportCsvMutation.isPending || importCsvMutation.isPending;

  return (
    <Box>
      {/* Toolbar with Import/Export buttons */}
      <Stack
        direction="row"
        spacing={1}
        sx={{
          mb: 2,
          p: 1.5,
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 150, 136, 0.08)' : 'rgba(0, 150, 136, 0.05)',
          borderRadius: 2,
          border: '1px solid',
          borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 150, 136, 0.2)' : 'rgba(0, 150, 136, 0.15)',
        }}
      >
        <Tooltip title="Download CSV template voor import">
          <Button
            variant="outlined"
            size="small"
            startIcon={downloadTemplateMutation.isPending ? <CircularProgress size={16} /> : <FileDownloadIcon />}
            onClick={handleDownloadTemplate}
            disabled={isAnyMutationPending}
            sx={{
              borderColor: '#009688',
              color: '#009688',
              '&:hover': {
                borderColor: '#00796b',
                bgcolor: alpha('#009688', 0.08),
              },
            }}
          >
            Template
          </Button>
        </Tooltip>

        <Tooltip title="Exporteer alle werkplekken naar CSV">
          <Button
            variant="outlined"
            size="small"
            startIcon={exportCsvMutation.isPending ? <CircularProgress size={16} /> : <DownloadIcon />}
            onClick={handleExportCsv}
            disabled={isAnyMutationPending || workplaces.length === 0}
            sx={{
              borderColor: '#009688',
              color: '#009688',
              '&:hover': {
                borderColor: '#00796b',
                bgcolor: alpha('#009688', 0.08),
              },
            }}
          >
            Exporteer ({workplaces.length})
          </Button>
        </Tooltip>

        <Tooltip title="Importeer werkplekken vanuit CSV">
          <Button
            variant="contained"
            size="small"
            startIcon={importCsvMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
            onClick={handleImportClick}
            disabled={isAnyMutationPending}
            sx={{
              bgcolor: '#009688',
              '&:hover': {
                bgcolor: '#00796b',
              },
            }}
          >
            Importeer CSV
          </Button>
        </Tooltip>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv"
          style={{ display: 'none' }}
        />
      </Stack>

      <AdminDataTable
        data={workplaces}
        columns={columns}
        onEdit={handleOpenDialog}
        onDelete={handleOpenDeleteDialog}
        searchPlaceholder="Zoek werkplekken..."
        emptyMessage="Geen werkplekken gevonden. Klik op + om een werkplek toe te voegen."
        getItemId={(item) => item.id}
        showActiveStatus
      />

      {/* Add Button */}
      <Fab
        color="primary"
        aria-label="add workplace"
        onClick={() => handleOpenDialog()}
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 24,
          zIndex: 1100,
          bgcolor: '#009688',
          '&:hover': {
            bgcolor: '#00796b',
            transform: 'scale(1.1)',
          },
          boxShadow: '0 4px 20px rgba(0, 150, 136, 0.4)',
          transition: 'all 0.2s ease',
        }}
      >
        <AddIcon />
      </Fab>

      {/* Form Dialog */}
      <AdminFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        title={editingItem ? 'Werkplek Bewerken' : 'Werkplek Toevoegen'}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Code"
            value={formData.code}
            onChange={handleInputChange('code')}
            error={!!formErrors.code}
            helperText={formErrors.code || 'Unieke code (bijv. WP-001)'}
            required
            fullWidth
            disabled={!!editingItem}
            inputProps={{ style: { textTransform: 'uppercase' } }}
          />

          <TextField
            label="Naam"
            value={formData.name}
            onChange={handleInputChange('name')}
            error={!!formErrors.name}
            helperText={formErrors.name || 'Werkplek naam'}
            required
            fullWidth
          />

          <TextField
            select
            label="Type"
            value={formData.type}
            onChange={handleSelectChange('type')}
            fullWidth
          >
            {Object.entries(WorkplaceTypeLabels).map(([value, label]) => (
              <MenuItem key={value} value={Number(value)}>
                {label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Gebouw"
            value={formData.buildingId}
            onChange={handleSelectChange('buildingId')}
            error={!!formErrors.buildingId}
            helperText={formErrors.buildingId}
            required
            fullWidth
          >
            <MenuItem value="">
              <em>Selecteer gebouw</em>
            </MenuItem>
            {buildings.map((building) => (
              <MenuItem key={building.id} value={String(building.id)}>
                {building.code} - {building.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Dienst"
            value={formData.serviceId}
            onChange={handleSelectChange('serviceId')}
            fullWidth
          >
            <MenuItem value="">
              <em>Geen dienst</em>
            </MenuItem>
            {services.map((service) => (
              <MenuItem key={service.id} value={String(service.id)}>
                {service.code} - {service.name}
              </MenuItem>
            ))}
          </TextField>

          <Divider />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Verdieping"
              value={formData.floor}
              onChange={handleInputChange('floor')}
              helperText="Bijv. 0, 1, 2, K"
              sx={{ flex: 1 }}
            />
            <TextField
              label="Kamer"
              value={formData.room}
              onChange={handleInputChange('room')}
              helperText="Bijv. 101, A1"
              sx={{ flex: 1 }}
            />
          </Box>

          <TextField
            label="Beschrijving"
            value={formData.description}
            onChange={handleInputChange('description')}
            helperText="Optionele beschrijving"
            fullWidth
            multiline
            rows={2}
          />

          {editingItem && (
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={handleInputChange('isActive')}
                  color="primary"
                />
              }
              label="Actief"
            />
          )}
        </Box>
      </AdminFormDialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            border: '2px solid',
            borderColor: 'error.main',
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(244, 67, 54, 0.1)'
                : 'rgba(244, 67, 54, 0.05)',
            color: 'error.main',
            fontWeight: 700,
            borderBottom: '1px solid',
            borderColor: 'error.main',
          }}
        >
          Werkplek Verwijderen
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1">
            Weet je zeker dat je werkplek <strong>{deletingItem?.code} - {deletingItem?.name}</strong> wilt verwijderen?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Deze actie kan niet ongedaan worden gemaakt.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={handleCloseDeleteDialog} color="inherit">
            Annuleren
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Verwijderen...' : 'Verwijderen'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Result Dialog */}
      <Dialog
        open={importResultDialogOpen}
        onClose={() => setImportResultDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            border: '2px solid',
            borderColor: importResult?.isFullySuccessful ? 'success.main' : 'warning.main',
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: (theme) =>
              importResult?.isFullySuccessful
                ? theme.palette.mode === 'dark'
                  ? 'rgba(76, 175, 80, 0.1)'
                  : 'rgba(76, 175, 80, 0.05)'
                : theme.palette.mode === 'dark'
                  ? 'rgba(255, 152, 0, 0.1)'
                  : 'rgba(255, 152, 0, 0.05)',
            color: importResult?.isFullySuccessful ? 'success.main' : 'warning.main',
            fontWeight: 700,
            borderBottom: '1px solid',
            borderColor: importResult?.isFullySuccessful ? 'success.main' : 'warning.main',
          }}
        >
          Import Resultaat
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {importResult && (
            <>
              <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main" fontWeight={700}>
                    {importResult.successCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Geslaagd
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main" fontWeight={700}>
                    {importResult.errorCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Fouten
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="text.primary" fontWeight={700}>
                    {importResult.totalRows}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Totaal
                  </Typography>
                </Box>
              </Stack>

              {importResult.errorCount > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="error.main" sx={{ mb: 1 }}>
                    Fouten:
                  </Typography>
                  <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {importResult.results
                      .filter((r) => !r.success)
                      .map((r) => (
                        <ListItem key={r.rowNumber} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <ErrorIcon color="error" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={`Rij ${r.rowNumber}: ${r.code || 'onbekend'}`}
                            secondary={r.error}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                  </List>
                </>
              )}

              {importResult.successCount > 0 && importResult.successCount <= 10 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="success.main" sx={{ mb: 1 }}>
                    Aangemaakt:
                  </Typography>
                  <List dense sx={{ maxHeight: 150, overflow: 'auto' }}>
                    {importResult.results
                      .filter((r) => r.success)
                      .map((r) => (
                        <ListItem key={r.rowNumber} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircleIcon color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${r.code} - ${r.name}`}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                  </List>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setImportResultDialogOpen(false)} variant="contained" color="primary">
            Sluiten
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
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

export default PhysicalWorkplacesTab;

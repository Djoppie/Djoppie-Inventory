import { useState } from 'react';
import {
  Box,
  Button,
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
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AddIcon from '@mui/icons-material/Add';
import SyncIcon from '@mui/icons-material/Sync';
import AdminDataTable, { Column } from './AdminDataTable';
import AdminFormDialog from './AdminFormDialog';
import { Sector, CreateSectorDto, UpdateSectorDto } from '../../types/admin.types';
import { sectorsApi } from '../../api/admin.api';
import Loading from '../common/Loading';

interface FormData {
  code: string;
  name: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
}

const initialFormData: FormData = {
  code: '',
  name: '',
  description: '',
  sortOrder: '0',
  isActive: true,
};

const SectorsTab = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Sector | null>(null);
  const [deletingItem, setDeletingItem] = useState<Sector | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const { data: sectors = [], isLoading } = useQuery({
    queryKey: ['admin', 'sectors', 'active'],
    queryFn: () => sectorsApi.getAll(false), // Only active sectors
  });

  const createMutation = useMutation({
    mutationFn: sectorsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sectors'] });
      setSnackbar({ open: true, message: 'Sector created', severity: 'success' });
      handleCloseDialog();
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to create sector', severity: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSectorDto }) => sectorsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sectors'] });
      setSnackbar({ open: true, message: 'Sector updated', severity: 'success' });
      handleCloseDialog();
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to update sector', severity: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: sectorsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sectors'] });
      setSnackbar({ open: true, message: 'Sector deleted', severity: 'success' });
      handleCloseDeleteDialog();
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to delete sector', severity: 'error' });
    },
  });

  const syncMutation = useMutation({
    mutationFn: sectorsApi.syncFromEntra,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sectors'] });
      setSnackbar({
        open: true,
        message: `Sync: ${result.created} created, ${result.updated} updated`,
        severity: 'success',
      });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to sync from Entra', severity: 'error' });
    },
  });

  const handleOpenDialog = (item?: Sector) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        code: item.code,
        name: item.name,
        description: item.description || '',
        sortOrder: String(item.sortOrder),
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

  const handleOpenDeleteDialog = (item: Sector) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingItem(null);
  };

  const handleInputChange =
    (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        field === 'isActive' ? (event.target as HTMLInputElement).checked : event.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (formErrors[field]) {
        setFormErrors((prev) => ({ ...prev, [field]: '' }));
      }
    };

  const validateForm = (): boolean => {
    const errors: Partial<FormData> = {};
    if (!formData.code.trim()) errors.code = 'Code is required';
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.sortOrder || isNaN(Number(formData.sortOrder)))
      errors.sortOrder = 'Sort order must be a number';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    const sortOrder = Number(formData.sortOrder);

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          id: editingItem.id,
          data: {
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
            isActive: formData.isActive,
            sortOrder,
          },
        });
      } else {
        await createMutation.mutateAsync({
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          sortOrder,
        });
      }
    } catch {
      // Error handled by mutation callbacks
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    await deleteMutation.mutateAsync(deletingItem.id);
  };

  const columns: Column<Sector>[] = [
    {
      id: 'code',
      label: 'Code',
      minWidth: 80,
      format: (item) => (
        <Typography sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#FF7700', fontSize: '0.8rem' }}>
          {item.code}
        </Typography>
      ),
    },
    { id: 'name', label: 'Name', minWidth: 150 },
    { id: 'description', label: 'Description', minWidth: 180 },
    { id: 'sortOrder', label: 'Order', minWidth: 60, align: 'center' },
  ];

  if (isLoading) return <Loading message="Loading sectors..." />;

  return (
    <Box>
      <AdminDataTable
        data={sectors}
        columns={columns}
        onEdit={handleOpenDialog}
        onDelete={handleOpenDeleteDialog}
        searchPlaceholder="Search sectors..."
        emptyMessage="No sectors available"
        getItemId={(item) => item.id}
        showActiveStatus
      />

      {/* Sync FAB */}
      <Fab
        size="medium"
        color="secondary"
        onClick={() => syncMutation.mutate()}
        disabled={syncMutation.isPending}
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 80,
          zIndex: 1100,
        }}
      >
        <SyncIcon
          sx={{
            animation: syncMutation.isPending ? 'spin 1s linear infinite' : 'none',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
          }}
        />
      </Fab>

      {/* Add FAB */}
      <Fab
        size="medium"
        color="primary"
        onClick={() => handleOpenDialog()}
        sx={{ position: 'fixed', bottom: 80, right: 24, zIndex: 1100 }}
      >
        <AddIcon />
      </Fab>

      {/* Form Dialog */}
      <AdminFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        title={editingItem ? 'Edit Sector' : 'Add Sector'}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Code"
            size="small"
            value={formData.code}
            onChange={handleInputChange('code')}
            error={!!formErrors.code}
            helperText={formErrors.code}
            required
            fullWidth
            disabled={!!editingItem}
            inputProps={{ style: { textTransform: 'uppercase' } }}
          />
          <TextField
            label="Name"
            size="small"
            value={formData.name}
            onChange={handleInputChange('name')}
            error={!!formErrors.name}
            helperText={formErrors.name}
            required
            fullWidth
          />
          <TextField
            label="Description"
            size="small"
            value={formData.description}
            onChange={handleInputChange('description')}
            fullWidth
            multiline
            rows={2}
          />
          <Divider />
          <TextField
            label="Sort Order"
            size="small"
            type="number"
            value={formData.sortOrder}
            onChange={handleInputChange('sortOrder')}
            error={!!formErrors.sortOrder}
            helperText={formErrors.sortOrder}
            required
            fullWidth
          />
          {editingItem && (
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={handleInputChange('isActive')}
                  color="primary"
                  size="small"
                />
              }
              label="Active"
            />
          )}
        </Box>
      </AdminFormDialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: 'rgba(244, 67, 54, 0.1)', color: '#F44336', fontWeight: 600 }}>
          Delete Sector
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2">
            Delete <strong>{deletingItem?.name}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDeleteDialog} size="small">
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            size="small"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ fontSize: '0.85rem' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SectorsTab;

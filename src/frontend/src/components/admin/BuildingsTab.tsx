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
import AdminDataTable, { Column } from './AdminDataTable';
import AdminFormDialog from './AdminFormDialog';
import { Building, CreateBuildingDto, UpdateBuildingDto } from '../../types/admin.types';
import { buildingsApi } from '../../api/admin.api';
import Loading from '../common/Loading';

interface FormData {
  code: string;
  name: string;
  address: string;
  sortOrder: string;
  isActive: boolean;
}

const initialFormData: FormData = {
  code: '',
  name: '',
  address: '',
  sortOrder: '0',
  isActive: true,
};

const BuildingsTab = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Building | null>(null);
  const [deletingItem, setDeletingItem] = useState<Building | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const { data: buildings = [], isLoading } = useQuery({
    queryKey: ['buildings'],
    queryFn: buildingsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: buildingsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      setSnackbar({ open: true, message: 'Building created successfully', severity: 'success' });
      handleCloseDialog();
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to create building', severity: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBuildingDto }) =>
      buildingsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      setSnackbar({ open: true, message: 'Building updated successfully', severity: 'success' });
      handleCloseDialog();
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to update building', severity: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: buildingsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      setSnackbar({ open: true, message: 'Building deleted successfully', severity: 'success' });
      handleCloseDeleteDialog();
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to delete building', severity: 'error' });
    },
  });

  const handleOpenDialog = (item?: Building) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        code: item.code,
        name: item.name,
        address: item.address || '',
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

  const handleOpenDeleteDialog = (item: Building) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingItem(null);
  };

  const handleInputChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'isActive'
      ? (event.target as HTMLInputElement).checked
      : event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<FormData> = {};

    if (!formData.code.trim()) {
      errors.code = 'Code is required';
    }
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!formData.sortOrder || isNaN(Number(formData.sortOrder))) {
      errors.sortOrder = 'Sort order must be a number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const sortOrder = Number(formData.sortOrder);

    try {
      if (editingItem) {
        const dto: UpdateBuildingDto = {
          name: formData.name.trim(),
          address: formData.address.trim() || undefined,
          isActive: formData.isActive,
          sortOrder,
        };
        await updateMutation.mutateAsync({ id: editingItem.id, data: dto });
      } else {
        const dto: CreateBuildingDto = {
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          address: formData.address.trim() || undefined,
          sortOrder,
        };
        await createMutation.mutateAsync(dto);
      }
    } catch (error) {
      // Error handled by mutation callbacks
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    await deleteMutation.mutateAsync(deletingItem.id);
  };

  const columns: Column<Building>[] = [
    {
      id: 'code',
      label: 'Code',
      minWidth: 100,
      format: (item) => (
        <Typography sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>
          {item.code}
        </Typography>
      ),
    },
    { id: 'name', label: 'Name', minWidth: 150 },
    { id: 'address', label: 'Address', minWidth: 200 },
    { id: 'sortOrder', label: 'Sort Order', minWidth: 80, align: 'center' },
  ];

  if (isLoading) return <Loading message="Loading buildings..." />;

  return (
    <Box>
      <AdminDataTable
        data={buildings}
        columns={columns}
        onEdit={handleOpenDialog}
        onDelete={handleOpenDeleteDialog}
        searchPlaceholder="Search buildings..."
        emptyMessage="No buildings available. Click the + button to add one."
        getItemId={(item) => item.id}
        showActiveStatus
      />

      {/* Add Button */}
      <Fab
        color="primary"
        aria-label="add building"
        onClick={() => handleOpenDialog()}
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 24,
          zIndex: 1100,
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(255, 119, 0, 0.4)'
              : '0 4px 20px rgba(255, 119, 0, 0.3)',
          '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: (theme) =>
              theme.palette.mode === 'dark'
                ? '0 6px 24px rgba(255, 119, 0, 0.5)'
                : '0 6px 24px rgba(255, 119, 0, 0.4)',
          },
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
        title={editingItem ? 'Edit Building' : 'Add Building'}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Code"
            value={formData.code}
            onChange={handleInputChange('code')}
            error={!!formErrors.code}
            helperText={formErrors.code || 'Unique identifier (e.g., DBK, WZC)'}
            required
            fullWidth
            disabled={!!editingItem}
            inputProps={{ style: { textTransform: 'uppercase' } }}
          />

          <TextField
            label="Name"
            value={formData.name}
            onChange={handleInputChange('name')}
            error={!!formErrors.name}
            helperText={formErrors.name || 'Building name'}
            required
            fullWidth
          />

          <TextField
            label="Address"
            value={formData.address}
            onChange={handleInputChange('address')}
            helperText="Optional address"
            fullWidth
            multiline
            rows={2}
          />

          <Divider />

          <TextField
            label="Sort Order"
            type="number"
            value={formData.sortOrder}
            onChange={handleInputChange('sortOrder')}
            error={!!formErrors.sortOrder}
            helperText={formErrors.sortOrder || 'Display order in lists'}
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
                />
              }
              label="Active"
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
          Delete Building
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1">
            Are you sure you want to delete <strong>{deletingItem?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={handleCloseDeleteDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
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

export default BuildingsTab;

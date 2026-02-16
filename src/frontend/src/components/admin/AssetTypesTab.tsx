import { useState, useMemo } from 'react';
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
  MenuItem,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AddIcon from '@mui/icons-material/Add';
import AdminDataTable, { Column } from './AdminDataTable';
import AdminFormDialog from './AdminFormDialog';
import { AssetType, CreateAssetTypeDto, UpdateAssetTypeDto, Category } from '../../types/admin.types';
import { assetTypesApi, categoriesApi } from '../../api/admin.api';
import Loading from '../common/Loading';

interface FormData {
  code: string;
  name: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
  categoryId: string;
}

const initialFormData: FormData = {
  code: '',
  name: '',
  description: '',
  sortOrder: '0',
  isActive: true,
  categoryId: '',
};

const AssetTypesTab = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AssetType | null>(null);
  const [deletingItem, setDeletingItem] = useState<AssetType | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const { data: assetTypes = [], isLoading } = useQuery({
    queryKey: ['assetTypes'],
    queryFn: () => assetTypesApi.getAll(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(false),
  });

  const categoryMap = useMemo(() => {
    const map = new Map<number, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const createMutation = useMutation({
    mutationFn: assetTypesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetTypes'] });
      setSnackbar({ open: true, message: 'Asset type created successfully', severity: 'success' });
      handleCloseDialog();
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to create asset type', severity: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAssetTypeDto }) =>
      assetTypesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetTypes'] });
      setSnackbar({ open: true, message: 'Asset type updated successfully', severity: 'success' });
      handleCloseDialog();
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to update asset type', severity: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: assetTypesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetTypes'] });
      setSnackbar({ open: true, message: 'Asset type deleted successfully', severity: 'success' });
      handleCloseDeleteDialog();
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to delete asset type', severity: 'error' });
    },
  });

  const handleOpenDialog = (item?: AssetType) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        code: item.code,
        name: item.name,
        description: item.description || '',
        sortOrder: String(item.sortOrder),
        isActive: item.isActive,
        categoryId: item.categoryId ? String(item.categoryId) : '',
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

  const handleOpenDeleteDialog = (item: AssetType) => {
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
        const dto: UpdateAssetTypeDto = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          isActive: formData.isActive,
          sortOrder,
          categoryId: formData.categoryId ? Number(formData.categoryId) : undefined,
        };
        await updateMutation.mutateAsync({ id: editingItem.id, data: dto });
      } else {
        const dto: CreateAssetTypeDto = {
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          sortOrder,
          categoryId: formData.categoryId ? Number(formData.categoryId) : undefined,
        };
        await createMutation.mutateAsync(dto);
      }
    } catch {
      // Error handled by mutation callbacks
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    await deleteMutation.mutateAsync(deletingItem.id);
  };

  const columns: Column<AssetType>[] = [
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
    {
      id: 'categoryId',
      label: 'Category',
      minWidth: 120,
      format: (item) => {
        const cat = item.categoryId ? categoryMap.get(item.categoryId) : null;
        return cat ? cat.name : '-';
      },
    },
    { id: 'description', label: 'Description', minWidth: 200 },
    { id: 'sortOrder', label: 'Sort Order', minWidth: 80, align: 'center' },
  ];

  if (isLoading) return <Loading message="Loading asset types..." />;

  return (
    <Box>
      <AdminDataTable
        data={assetTypes}
        columns={columns}
        onEdit={handleOpenDialog}
        onDelete={handleOpenDeleteDialog}
        searchPlaceholder="Search asset types..."
        emptyMessage="No asset types available. Click the + button to add one."
        getItemId={(item) => item.id}
        showActiveStatus
      />

      {/* Add Button */}
      <Fab
        color="primary"
        aria-label="add asset type"
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
        title={editingItem ? 'Edit Asset Type' : 'Add Asset Type'}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Code Field - disabled when editing */}
          <TextField
            label="Code"
            value={formData.code}
            onChange={handleInputChange('code')}
            error={!!formErrors.code}
            helperText={formErrors.code || 'Unique identifier (e.g., LAP, DESK, MON)'}
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
            helperText={formErrors.name || 'Display name for this asset type'}
            required
            fullWidth
          />

          <TextField
            label="Category"
            select
            value={formData.categoryId}
            onChange={handleInputChange('categoryId')}
            helperText="Group this asset type under a category"
            fullWidth
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={String(cat.id)}>
                {cat.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Description"
            value={formData.description}
            onChange={handleInputChange('description')}
            helperText="Optional description"
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
          Delete Asset Type
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

export default AssetTypesTab;

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
  Chip,
} from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AddIcon from '@mui/icons-material/Add';
import NeumorphicDataGrid from './NeumorphicDataGrid';
import AdminFormDialog from './AdminFormDialog';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../../types/admin.types';
import { categoriesApi } from '../../api/admin.api';
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

const columns: GridColDef[] = [
  {
    field: 'code',
    headerName: 'Code',
    minWidth: 100,
    flex: 0.5,
    renderCell: (params: GridRenderCellParams) => (
      <Typography sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>
        {params.value}
      </Typography>
    ),
  },
  { field: 'name', headerName: 'Name', minWidth: 150, flex: 1 },
  { field: 'description', headerName: 'Description', minWidth: 200, flex: 1.5 },
  {
    field: 'assetTypeCount',
    headerName: 'Asset Types',
    minWidth: 100,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params: GridRenderCellParams) => (
      <Chip
        label={params.value ?? 0}
        size="small"
        color={params.value && params.value > 0 ? 'primary' : 'default'}
        variant="outlined"
        sx={{ fontWeight: 600 }}
      />
    ),
  },
  { field: 'sortOrder', headerName: 'Sort Order', minWidth: 80, align: 'center', headerAlign: 'center' },
];

const CategoriesTab = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Category | null>(null);
  const [deletingItem, setDeletingItem] = useState<Category | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(true),
  });

  const createMutation = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['assetTypes'] });
      setSnackbar({ open: true, message: 'Category created successfully', severity: 'success' });
      handleCloseDialog();
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to create category', severity: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategoryDto }) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['assetTypes'] });
      setSnackbar({ open: true, message: 'Category updated successfully', severity: 'success' });
      handleCloseDialog();
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to update category', severity: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['assetTypes'] });
      setSnackbar({ open: true, message: 'Category deleted successfully', severity: 'success' });
      handleCloseDeleteDialog();
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to delete category. Make sure no asset types are using it.', severity: 'error' });
    },
  });

  const handleOpenDialog = (item?: Category) => {
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

  const handleOpenDeleteDialog = (item: Category) => {
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
        const dto: UpdateCategoryDto = {
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          isActive: formData.isActive,
          sortOrder,
        };
        await updateMutation.mutateAsync({ id: editingItem.id, data: dto });
      } else {
        const dto: CreateCategoryDto = {
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          sortOrder,
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

  if (isLoading) return <Loading message="Loading categories..." />;

  return (
    <Box>
      <NeumorphicDataGrid<Category>
        rows={categories}
        columns={columns}
        onEdit={handleOpenDialog}
        onDelete={handleOpenDeleteDialog}
        showActiveStatus
      />

      {/* Add Button */}
      <Fab
        color="primary"
        aria-label="add category"
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
        title={editingItem ? 'Edit Category' : 'Add Category'}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Code"
            value={formData.code}
            onChange={handleInputChange('code')}
            error={!!formErrors.code}
            helperText={formErrors.code || 'Unique identifier (e.g., COMP, WERK, NET)'}
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
            helperText={formErrors.name || 'Display name for this category'}
            required
            fullWidth
          />

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
          Delete Category
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1">
            Are you sure you want to delete <strong>{deletingItem?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone. Asset types using this category will need to be reassigned.
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

export default CategoriesTab;

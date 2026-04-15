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
  Chip,
  Autocomplete,
} from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AddIcon from '@mui/icons-material/Add';
import SyncIcon from '@mui/icons-material/Sync';
import PersonIcon from '@mui/icons-material/Person';
import DevicesIcon from '@mui/icons-material/Devices';
import NeumorphicDataGrid from './NeumorphicDataGrid';
import AdminFormDialog from './AdminFormDialog';
import { Employee, UpdateEmployeeDto, Service } from '../../types/admin.types';
import { employeesApi, servicesApi } from '../../api/admin.api';
import Loading from '../common/Loading';
import { EMPLOYEE_COLOR } from '../../constants/filterColors';

interface FormData {
  entraId: string;
  userPrincipalName: string;
  displayName: string;
  email: string;
  department: string;
  jobTitle: string;
  officeLocation: string;
  mobilePhone: string;
  companyName: string;
  serviceId: number | null;
  sortOrder: string;
  isActive: boolean;
}

const initialFormData: FormData = {
  entraId: '',
  userPrincipalName: '',
  displayName: '',
  email: '',
  department: '',
  jobTitle: '',
  officeLocation: '',
  mobilePhone: '',
  companyName: '',
  serviceId: null,
  sortOrder: '0',
  isActive: true,
};

const EmployeesTab = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetsDialogOpen, setAssetsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Employee | null>(null);
  const [deletingItem, setDeletingItem] = useState<Employee | null>(null);
  const [viewingAssetsFor, setViewingAssetsFor] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['admin', 'employees', 'all'],
    queryFn: () => employeesApi.getAll(true),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['admin', 'services', 'all'],
    queryFn: () => servicesApi.getAll(false),
  });

  const { data: employeeAssets = [], isLoading: isLoadingAssets } = useQuery({
    queryKey: ['admin', 'employees', viewingAssetsFor?.id, 'assets'],
    queryFn: () => (viewingAssetsFor ? employeesApi.getAssets(viewingAssetsFor.id) : Promise.resolve([])),
    enabled: !!viewingAssetsFor,
  });

  const createMutation = useMutation({
    mutationFn: employeesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'employees'] });
      setSnackbar({ open: true, message: 'Employee created', severity: 'success' });
      handleCloseDialog();
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to create employee', severity: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEmployeeDto }) => employeesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'employees'] });
      setSnackbar({ open: true, message: 'Employee updated', severity: 'success' });
      handleCloseDialog();
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to update employee', severity: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: employeesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'employees'] });
      setSnackbar({ open: true, message: 'Employee deactivated', severity: 'success' });
      handleCloseDeleteDialog();
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to deactivate employee', severity: 'error' });
    },
  });

  const syncMutation = useMutation({
    mutationFn: employeesApi.syncFromEntra,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'employees'] });
      setSnackbar({
        open: true,
        message: `Sync: ${result.created} created, ${result.updated} updated, ${result.deactivated} deactivated`,
        severity: result.errors > 0 ? 'error' : 'success',
      });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to sync from Entra', severity: 'error' });
    },
  });

  const handleOpenDialog = (item?: Employee) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        entraId: item.entraId,
        userPrincipalName: item.userPrincipalName,
        displayName: item.displayName,
        email: item.email || '',
        department: item.department || '',
        jobTitle: item.jobTitle || '',
        officeLocation: item.officeLocation || '',
        mobilePhone: item.mobilePhone || '',
        companyName: item.companyName || '',
        serviceId: item.serviceId || null,
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

  const handleOpenDeleteDialog = (item: Employee) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingItem(null);
  };

  const handleOpenAssetsDialog = (item: Employee) => {
    setViewingAssetsFor(item);
    setAssetsDialogOpen(true);
  };

  const handleCloseAssetsDialog = () => {
    setAssetsDialogOpen(false);
    setViewingAssetsFor(null);
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
    const errors: Partial<Record<keyof FormData, string>> = {};
    if (!editingItem) {
      if (!formData.entraId.trim()) errors.entraId = 'Entra ID is required';
      if (!formData.userPrincipalName.trim()) errors.userPrincipalName = 'UPN is required';
    }
    if (!formData.displayName.trim()) errors.displayName = 'Display name is required';
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
            displayName: formData.displayName.trim(),
            email: formData.email.trim() || undefined,
            department: formData.department.trim() || undefined,
            jobTitle: formData.jobTitle.trim() || undefined,
            officeLocation: formData.officeLocation.trim() || undefined,
            mobilePhone: formData.mobilePhone.trim() || undefined,
            companyName: formData.companyName.trim() || undefined,
            serviceId: formData.serviceId || undefined,
            isActive: formData.isActive,
            sortOrder,
          },
        });
      } else {
        await createMutation.mutateAsync({
          entraId: formData.entraId.trim(),
          userPrincipalName: formData.userPrincipalName.trim(),
          displayName: formData.displayName.trim(),
          email: formData.email.trim() || undefined,
          department: formData.department.trim() || undefined,
          jobTitle: formData.jobTitle.trim() || undefined,
          officeLocation: formData.officeLocation.trim() || undefined,
          mobilePhone: formData.mobilePhone.trim() || undefined,
          companyName: formData.companyName.trim() || undefined,
          serviceId: formData.serviceId || undefined,
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

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'displayName',
        headerName: 'Name',
        minWidth: 180,
        flex: 1,
        renderCell: (params: GridRenderCellParams) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon sx={{ fontSize: 18, color: EMPLOYEE_COLOR }} />
            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
              {params.value}
            </Typography>
          </Box>
        ),
      },
      {
        field: 'email',
        headerName: 'Email',
        minWidth: 200,
        flex: 1,
        renderCell: (params: GridRenderCellParams) => (
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
            {params.value || '-'}
          </Typography>
        ),
      },
      {
        field: 'service',
        headerName: 'Service',
        minWidth: 120,
        flex: 0.5,
        valueGetter: (_value: unknown, row: Employee) => row.service?.code ?? '',
        renderCell: (params: GridRenderCellParams) => {
          const row = params.row as Employee;
          return row.service ? (
            <Chip
              label={row.service.code}
              size="small"
              sx={{
                bgcolor: 'rgba(255, 119, 0, 0.1)',
                color: '#FF7700',
                fontWeight: 600,
                fontSize: '0.7rem',
              }}
            />
          ) : (
            <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>-</Typography>
          );
        },
      },
      {
        field: 'jobTitle',
        headerName: 'Job Title',
        minWidth: 150,
        flex: 0.7,
        renderCell: (params: GridRenderCellParams) => (
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
            {params.value || '-'}
          </Typography>
        ),
      },
      {
        field: 'assetCount',
        headerName: 'Assets',
        minWidth: 80,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const count = params.value as number;
          const row = params.row as Employee;
          return (
            <Chip
              icon={<DevicesIcon sx={{ fontSize: 14 }} />}
              label={count}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                if (count > 0) handleOpenAssetsDialog(row);
              }}
              sx={{
                cursor: count > 0 ? 'pointer' : 'default',
                bgcolor: count > 0 ? 'rgba(33, 150, 243, 0.1)' : 'transparent',
                color: count > 0 ? '#2196F3' : 'text.disabled',
                fontWeight: 600,
                '&:hover': count > 0 ? { bgcolor: 'rgba(33, 150, 243, 0.2)' } : {},
              }}
            />
          );
        },
      },
      {
        field: 'sortOrder',
        headerName: 'Order',
        minWidth: 60,
        align: 'center',
        headerAlign: 'center',
      },
    ],
    [],
  );

  if (isLoading) return <Loading message="Loading employees..." />;

  return (
    <Box>
      <NeumorphicDataGrid<Employee>
        rows={employees}
        columns={columns}
        onEdit={handleOpenDialog}
        onDelete={handleOpenDeleteDialog}
        showActiveStatus
        accentColor={EMPLOYEE_COLOR}
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
        title="Sync from Entra ID"
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
        title="Add employee manually"
      >
        <AddIcon />
      </Fab>

      {/* Form Dialog */}
      <AdminFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        title={editingItem ? 'Edit Employee' : 'Add Employee'}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {!editingItem && (
            <>
              <TextField
                label="Entra ID (Object ID)"
                size="small"
                value={formData.entraId}
                onChange={handleInputChange('entraId')}
                error={!!formErrors.entraId}
                helperText={formErrors.entraId}
                required
                fullWidth
              />
              <TextField
                label="User Principal Name (Email)"
                size="small"
                value={formData.userPrincipalName}
                onChange={handleInputChange('userPrincipalName')}
                error={!!formErrors.userPrincipalName}
                helperText={formErrors.userPrincipalName}
                required
                fullWidth
              />
            </>
          )}
          <TextField
            label="Display Name"
            size="small"
            value={formData.displayName}
            onChange={handleInputChange('displayName')}
            error={!!formErrors.displayName}
            helperText={formErrors.displayName}
            required
            fullWidth
          />
          <TextField
            label="Email"
            size="small"
            value={formData.email}
            onChange={handleInputChange('email')}
            fullWidth
          />
          <Divider />
          <Autocomplete
            size="small"
            options={services}
            getOptionLabel={(option: Service) => `${option.code} - ${option.name}`}
            value={services.find((s) => s.id === formData.serviceId) || null}
            onChange={(_, value) => setFormData((prev) => ({ ...prev, serviceId: value?.id || null }))}
            renderInput={(params) => <TextField {...params} label="Service" />}
            fullWidth
          />
          <TextField
            label="Department"
            size="small"
            value={formData.department}
            onChange={handleInputChange('department')}
            fullWidth
          />
          <TextField
            label="Job Title"
            size="small"
            value={formData.jobTitle}
            onChange={handleInputChange('jobTitle')}
            fullWidth
          />
          <TextField
            label="Office Location"
            size="small"
            value={formData.officeLocation}
            onChange={handleInputChange('officeLocation')}
            fullWidth
          />
          <TextField
            label="Mobile Phone"
            size="small"
            value={formData.mobilePhone}
            onChange={handleInputChange('mobilePhone')}
            fullWidth
          />
          <TextField
            label="Company Name"
            size="small"
            value={formData.companyName}
            onChange={handleInputChange('companyName')}
            fullWidth
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
          Deactivate Employee
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2">
            Deactivate <strong>{deletingItem?.displayName}</strong>? This will mark the employee as inactive.
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
            {deleteMutation.isPending ? 'Deactivating...' : 'Deactivate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assets Dialog */}
      <Dialog open={assetsDialogOpen} onClose={handleCloseAssetsDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', color: '#2196F3', fontWeight: 600 }}>
          Assets for {viewingAssetsFor?.displayName}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {isLoadingAssets ? (
            <Loading message="Loading assets..." />
          ) : employeeAssets.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No assets assigned to this employee.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {employeeAssets.map((asset) => (
                <Box
                  key={asset.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {asset.assetCode}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      {asset.brand} {asset.model}
                    </Typography>
                  </Box>
                  <Chip
                    label={asset.status}
                    size="small"
                    sx={{ fontSize: '0.7rem' }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseAssetsDialog} size="small">
            Close
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

export default EmployeesTab;

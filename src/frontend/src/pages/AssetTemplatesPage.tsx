import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fab,
  Stack,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
  Divider,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  useAssetTemplates,
  useCreateAssetTemplate,
  useUpdateAssetTemplate,
  useDeleteAssetTemplate,
} from '../hooks/useAssetTemplates';
import {
  AssetTemplate,
  CreateAssetTemplateDto,
} from '../types/asset.types';
import Loading from '../components/common/Loading';
import ApiErrorDisplay from '../components/common/ApiErrorDisplay';
import AssetTypeSelect from '../components/common/AssetTypeSelect';
import ServiceSelect from '../components/common/ServiceSelect';
import CategoryIcon from '@mui/icons-material/Category';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import QrCodeIcon from '@mui/icons-material/QrCode';
import ComputerIcon from '@mui/icons-material/Computer';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BusinessIcon from '@mui/icons-material/Business';

interface FormData {
  templateName: string;
  assetName: string;
  assetTypeId: number | null;
  serviceId: number | null;
  installationLocation: string;
  status: string;
  brand: string;
  model: string;
  owner: string;
  purchaseDate: string;
  warrantyExpiry: string;
  installationDate: string;
}

const initialFormData: FormData = {
  templateName: '',
  assetName: '',
  assetTypeId: null,
  serviceId: null,
  installationLocation: '',
  status: '',
  brand: '',
  model: '',
  owner: '',
  purchaseDate: '',
  warrantyExpiry: '',
  installationDate: '',
};

type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
};

const AssetTemplatesPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AssetTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<AssetTemplate | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data: templates, isLoading, error, refetch } = useAssetTemplates();
  const createMutation = useCreateAssetTemplate();
  const updateMutation = useUpdateAssetTemplate();
  const deleteMutation = useDeleteAssetTemplate();

  const handleOpenDialog = (template?: AssetTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        templateName: template.templateName,
        assetName: template.assetName || '',
        assetTypeId: template.assetTypeId ?? null,
        serviceId: template.serviceId ?? null,
        installationLocation: template.installationLocation || '',
        status: template.status || '',
        brand: template.brand || '',
        model: template.model || '',
        owner: template.owner || '',
        purchaseDate: template.purchaseDate?.split('T')[0] || '',
        warrantyExpiry: template.warrantyExpiry?.split('T')[0] || '',
        installationDate: template.installationDate?.split('T')[0] || '',
      });
    } else {
      setEditingTemplate(null);
      setFormData(initialFormData);
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const handleOpenDeleteDialog = (template: AssetTemplate) => {
    setDeletingTemplate(template);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingTemplate(null);
  };

  const handleInputChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.templateName.trim()) {
      errors.templateName = t('templates.required');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const dto: CreateAssetTemplateDto = {
      templateName: formData.templateName.trim(),
      assetName: formData.assetName.trim() || undefined,
      assetTypeId: formData.assetTypeId ?? undefined,
      serviceId: formData.serviceId ?? undefined,
      installationLocation: formData.installationLocation.trim() || undefined,
      status: formData.status || undefined,
      brand: formData.brand.trim() || undefined,
      model: formData.model.trim() || undefined,
      owner: formData.owner.trim() || undefined,
      purchaseDate: formData.purchaseDate || undefined,
      warrantyExpiry: formData.warrantyExpiry || undefined,
      installationDate: formData.installationDate || undefined,
    };

    try {
      if (editingTemplate) {
        await updateMutation.mutateAsync({ id: editingTemplate.id, data: dto });
        setSnackbar({
          open: true,
          message: t('templates.updateSuccess'),
          severity: 'success',
        });
      } else {
        await createMutation.mutateAsync(dto);
        setSnackbar({
          open: true,
          message: t('templates.saveSuccess'),
          severity: 'success',
        });
      }
      handleCloseDialog();
    } catch {
      setSnackbar({
        open: true,
        message: t('templates.saveError'),
        severity: 'error',
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;

    try {
      await deleteMutation.mutateAsync(deletingTemplate.id);
      setSnackbar({
        open: true,
        message: t('templates.deleteSuccess'),
        severity: 'success',
      });
      handleCloseDeleteDialog();
    } catch {
      setSnackbar({
        open: true,
        message: t('templates.deleteError'),
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  if (isLoading) return <Loading message={t('templates.loading')} />;

  if (error) {
    const isNetworkError =
      error instanceof Error &&
      (error.message.includes('Network Error') ||
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('fetch'));

    if (isNetworkError) {
      return <ApiErrorDisplay onRetry={() => refetch()} />;
    }

    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="error">
          {t('templates.errorLoading')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error instanceof Error ? error.message : t('errors.unexpectedError')}
        </Typography>
      </Box>
    );
  }

  const templateCount = templates?.length || 0;

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header - Scanner style */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: (thm: { palette: { mode: string } }) =>
              thm.palette.mode === 'dark'
                ? '0 8px 32px rgba(255, 215, 0, 0.2), inset 0 0 24px rgba(255, 215, 0, 0.05)'
                : '0 4px 20px rgba(253, 185, 49, 0.3)',
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <CategoryIcon
              sx={{
                fontSize: 40,
                color: 'primary.main',
                filter: (thm: { palette: { mode: string } }) =>
                  thm.palette.mode === 'dark'
                    ? 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))'
                    : 'none',
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" component="h1" fontWeight={700}>
                {t('templates.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {t('templates.subtitle')}
              </Typography>
            </Box>
            <Chip
              icon={<CategoryIcon />}
              label={t('templates.templateCount', { count: templateCount })}
              sx={{ fontWeight: 600, fontSize: '0.9rem', px: 1 }}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Template List */}
      {templateCount === 0 ? (
        // Empty State
        <Paper
          elevation={0}
          sx={{
            p: 6,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <CategoryIcon
            sx={{
              fontSize: '4rem',
              color: 'text.disabled',
              mb: 2,
            }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('templates.noTemplates')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('templates.noTemplatesDesc')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            size="large"
          >
            {t('templates.addTemplate')}
          </Button>
        </Paper>
      ) : (
        <>
          {/* Mobile/Tablet: Card View */}
          {isTablet && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {templates?.map((template) => (
                <Card
                  key={template.id}
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: (theme) =>
                        theme.palette.mode === 'dark'
                          ? '0 8px 32px rgba(255, 215, 0, 0.2), inset 0 0 24px rgba(255, 215, 0, 0.05)'
                          : '0 4px 20px rgba(253, 185, 49, 0.3)',
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <CardContent sx={{ pb: 1, flex: 1, minWidth: 0 }}>
                      {/* Template Name */}
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          mb: 1,
                          color: 'primary.main',
                        }}
                      >
                        {template.templateName}
                      </Typography>

                      {/* Asset Name */}
                      {template.assetName && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>{t('templates.assetName')}:</strong> {template.assetName}
                        </Typography>
                      )}

                      {/* Asset Type */}
                      {template.assetType && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>{t('templates.assetType')}:</strong> {template.assetType.name}
                        </Typography>
                      )}

                      {/* Brand | Model */}
                      {(template.brand || template.model) && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>{t('templates.brand')}:</strong>{' '}
                          {[template.brand, template.model].filter(Boolean).join(' | ')}
                        </Typography>
                      )}

                      {/* Owner */}
                      {template.owner && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>{t('templates.owner')}:</strong> {template.owner}
                        </Typography>
                      )}

                      {/* Service */}
                      {template.service && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>{t('templates.service')}:</strong> {template.service.name}
                        </Typography>
                      )}

                      {/* Installation Location */}
                      {template.installationLocation && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>{t('templates.installationLocation')}:</strong> {template.installationLocation}
                        </Typography>
                      )}
                    </CardContent>

                    <Box sx={{ display: 'flex', alignItems: 'center', pr: 1, pt: 1.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(template)}
                        sx={{
                          color: 'primary.main',
                          '&:hover': {
                            backgroundColor: (theme) =>
                              theme.palette.mode === 'dark'
                                ? 'rgba(255, 119, 0, 0.1)'
                                : 'rgba(255, 119, 0, 0.05)',
                          },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDeleteDialog(template)}
                        sx={{
                          color: 'error.main',
                          '&:hover': {
                            backgroundColor: (theme) =>
                              theme.palette.mode === 'dark'
                                ? 'rgba(244, 67, 54, 0.1)'
                                : 'rgba(244, 67, 54, 0.05)',
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>
          )}

          {/* Desktop: Table View */}
          {!isTablet && (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(255, 119, 0, 0.05)'
                          : 'rgba(255, 119, 0, 0.02)',
                    }}
                  >
                    <TableCell sx={{ fontWeight: 700 }}>
                      {t('templates.templateName')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {t('templates.assetName')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {t('templates.assetType')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('templates.brand')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('templates.model')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('templates.owner')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('templates.service')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('templates.installationLocation')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {t('common.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {templates?.map((template) => (
                    <TableRow
                      key={template.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: (theme) =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(255, 119, 0, 0.05)'
                              : 'rgba(255, 119, 0, 0.02)',
                        },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {template.templateName}
                      </TableCell>
                      <TableCell>{template.assetName || '-'}</TableCell>
                      <TableCell>{template.assetType?.name || '-'}</TableCell>
                      <TableCell>{template.brand || '-'}</TableCell>
                      <TableCell>{template.model || '-'}</TableCell>
                      <TableCell>{template.owner || '-'}</TableCell>
                      <TableCell>{template.service?.name || '-'}</TableCell>
                      <TableCell>{template.installationLocation || '-'}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(template)}
                          sx={{
                            color: 'primary.main',
                            mr: 0.5,
                            '&:hover': {
                              backgroundColor: (theme) =>
                                theme.palette.mode === 'dark'
                                  ? 'rgba(255, 119, 0, 0.1)'
                                  : 'rgba(255, 119, 0, 0.05)',
                            },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDeleteDialog(template)}
                          sx={{
                            color: 'error.main',
                            '&:hover': {
                              backgroundColor: (theme) =>
                                theme.palette.mode === 'dark'
                                  ? 'rgba(244, 67, 54, 0.1)'
                                  : 'rgba(244, 67, 54, 0.05)',
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Floating Action Button */}
      {templateCount > 0 && (
        <Fab
          color="primary"
          aria-label="add template"
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
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: isMobile ? 0 : 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(255, 119, 0, 0.05)'
                : 'rgba(255, 119, 0, 0.02)',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
            {editingTemplate ? t('templates.editTemplate') : t('templates.addTemplate')}
          </Typography>
          <IconButton size="small" onClick={handleCloseDialog} edge="end">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Template Name - always required */}
            <TextField
              label={t('templates.templateName')}
              value={formData.templateName}
              onChange={handleInputChange('templateName')}
              error={!!formErrors.templateName}
              helperText={formErrors.templateName || t('templates.templateNameHint')}
              required
              fullWidth
              autoFocus
            />

            <Divider sx={{ my: 1 }} />

            {/* Identification Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                }}
              >
                <QrCodeIcon fontSize="small" />
              </Box>
              <Typography variant="subtitle1" fontWeight={600} color="primary">
                {t('assetForm.identificationSection')}
              </Typography>
            </Box>

            <TextField
              label={t('assetForm.alias')}
              value={formData.assetName}
              onChange={handleInputChange('assetName')}
              helperText={t('assetForm.aliasHelper') || t('assetForm.aliasHint')}
              fullWidth
            />

            <AssetTypeSelect
              value={formData.assetTypeId}
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, assetTypeId: value }));
              }}
              label={t('templates.assetType')}
            />

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 200px' }}>
                <ServiceSelect
                  value={formData.serviceId}
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, serviceId: value }));
                  }}
                  label={t('templates.service')}
                />
              </Box>
              <FormControl sx={{ flex: '1 1 200px' }}>
                <InputLabel>{t('templates.defaultStatus')}</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                  label={t('templates.defaultStatus')}
                >
                  <MenuItem value="">
                    <em>{t('assetForm.optional')}</em>
                  </MenuItem>
                  <MenuItem value="Stock">{t('statuses.stock')}</MenuItem>
                  <MenuItem value="InGebruik">{t('statuses.ingebruik')}</MenuItem>
                  <MenuItem value="Herstelling">{t('statuses.herstelling')}</MenuItem>
                  <MenuItem value="Defect">{t('statuses.defect')}</MenuItem>
                  <MenuItem value="UitDienst">{t('statuses.uitdienst')}</MenuItem>
                  <MenuItem value="Nieuw">{t('statuses.nieuw')}</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TextField
              label={t('assetForm.installationLocation')}
              value={formData.installationLocation}
              onChange={handleInputChange('installationLocation')}
              helperText={t('assetForm.installationLocationHint')}
              fullWidth
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                    <BusinessIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </Box>
                ),
              }}
            />

            <Divider sx={{ my: 1 }} />

            {/* Technical Details Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                }}
              >
                <ComputerIcon fontSize="small" />
              </Box>
              <Typography variant="subtitle1" fontWeight={600} color="primary">
                {t('assetForm.technicalSection')}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label={t('templates.brand')}
                value={formData.brand}
                onChange={handleInputChange('brand')}
                sx={{ flex: '1 1 200px' }}
              />

              <TextField
                label={t('templates.model')}
                value={formData.model}
                onChange={handleInputChange('model')}
                sx={{ flex: '1 1 200px' }}
              />
            </Box>

            <Divider sx={{ my: 1 }} />

            {/* Default Assignment Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                }}
              >
                <CategoryIcon fontSize="small" />
              </Box>
              <Typography variant="subtitle1" fontWeight={600} color="primary">
                {t('templates.defaultAssignment')}
              </Typography>
            </Box>

            <TextField
              label={t('templates.owner')}
              value={formData.owner}
              onChange={handleInputChange('owner')}
              fullWidth
              helperText={t('templates.ownerHint')}
            />

            <Divider sx={{ my: 1 }} />

            {/* Lifecycle Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                }}
              >
                <CalendarMonthIcon fontSize="small" />
              </Box>
              <Typography variant="subtitle1" fontWeight={600} color="primary">
                {t('assetForm.lifecycleSection')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ({t('assetForm.optional')})
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label={t('templates.purchaseDate')}
                type="date"
                value={formData.purchaseDate}
                onChange={handleInputChange('purchaseDate')}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: '1 1 160px' }}
              />
              <TextField
                label={t('templates.warrantyExpiry')}
                type="date"
                value={formData.warrantyExpiry}
                onChange={handleInputChange('warrantyExpiry')}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: '1 1 160px' }}
              />
              <TextField
                label={t('templates.installationDate')}
                type="date"
                value={formData.installationDate}
                onChange={handleInputChange('installationDate')}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: '1 1 160px' }}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={handleCloseDialog} color="inherit">
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? t('common.saving')
              : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

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
          {t('templates.deleteTemplate')}
        </DialogTitle>

        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1">
            {t('templates.deleteConfirm', {
              name: deletingTemplate?.templateName,
            })}
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={handleCloseDeleteDialog} color="inherit">
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? t('common.deleting') : t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
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
          sx={{
            width: '100%',
            boxShadow: (theme) =>
              theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.5)'
                : '0 4px 20px rgba(0, 0, 0, 0.2)',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AssetTemplatesPage;

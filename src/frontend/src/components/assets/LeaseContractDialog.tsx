import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  MenuItem,
  Typography,
  alpha,
  useTheme,
  IconButton,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import { LeaseContract, CreateLeaseContract, UpdateLeaseContract } from '../../api/leaseContracts.api';
import { format, parseISO } from 'date-fns';

interface LeaseContractDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateLeaseContract | UpdateLeaseContract) => Promise<void>;
  assetId: number;
  leaseContract?: LeaseContract | null;
  isEdit?: boolean;
}

const LeaseContractDialog = ({
  open,
  onClose,
  onSave,
  assetId,
  leaseContract,
  isEdit = false,
}: LeaseContractDialogProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [formData, setFormData] = useState({
    contractNumber: '',
    vendor: '',
    startDate: '',
    endDate: '',
    monthlyRate: '',
    totalValue: '',
    status: 'Active' as 'Active' | 'Expiring' | 'Expired' | 'Terminated' | 'Renewed',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (isEdit && leaseContract) {
        setFormData({
          contractNumber: leaseContract.contractNumber || '',
          vendor: leaseContract.vendor || '',
          startDate: leaseContract.startDate ? format(parseISO(leaseContract.startDate), 'yyyy-MM-dd') : '',
          endDate: leaseContract.endDate ? format(parseISO(leaseContract.endDate), 'yyyy-MM-dd') : '',
          monthlyRate: leaseContract.monthlyRate?.toString() || '',
          totalValue: leaseContract.totalValue?.toString() || '',
          status: leaseContract.status,
          notes: leaseContract.notes || '',
        });
      } else {
        setFormData({
          contractNumber: '',
          vendor: '',
          startDate: '',
          endDate: '',
          monthlyRate: '',
          totalValue: '',
          status: 'Active',
          notes: '',
        });
      }
      setErrors({});
    }
  }, [open, isEdit, leaseContract]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.startDate) {
      newErrors.startDate = t('lease.validation.startDateRequired');
    }

    if (!formData.endDate) {
      newErrors.endDate = t('lease.validation.endDateRequired');
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = t('lease.validation.endDateAfterStart');
      }
    }

    if (formData.monthlyRate && isNaN(parseFloat(formData.monthlyRate))) {
      newErrors.monthlyRate = t('lease.validation.invalidNumber');
    }

    if (formData.totalValue && isNaN(parseFloat(formData.totalValue))) {
      newErrors.totalValue = t('lease.validation.invalidNumber');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      const data = {
        ...(isEdit ? {} : { assetId }),
        contractNumber: formData.contractNumber || undefined,
        vendor: formData.vendor || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        monthlyRate: formData.monthlyRate ? parseFloat(formData.monthlyRate) : undefined,
        totalValue: formData.totalValue ? parseFloat(formData.totalValue) : undefined,
        ...(isEdit ? { status: formData.status } : {}),
        notes: formData.notes || undefined,
      };

      await onSave(data as CreateLeaseContract | UpdateLeaseContract);
      onClose();
    } catch (error) {
      console.error('Failed to save lease contract:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {isEdit ? t('lease.editContract') : t('lease.addContract')}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Contract Number */}
          <TextField
            label={t('lease.contractNumber')}
            value={formData.contractNumber}
            onChange={(e) => handleChange('contractNumber', e.target.value)}
            fullWidth
            placeholder={t('lease.contractNumberPlaceholder')}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: theme.palette.mode === 'light'
                  ? alpha(theme.palette.background.paper, 0.8)
                  : alpha(theme.palette.background.default, 0.4),
                boxShadow: theme.palette.mode === 'light'
                  ? 'inset 2px 2px 4px rgba(0, 0, 0, 0.05), inset -2px -2px 4px rgba(255, 255, 255, 0.8)'
                  : 'inset 3px 3px 6px rgba(0, 0, 0, 0.5), inset -2px -2px 4px rgba(255, 255, 255, 0.02)',
              },
            }}
          />

          {/* Vendor */}
          <TextField
            label={t('lease.vendor')}
            value={formData.vendor}
            onChange={(e) => handleChange('vendor', e.target.value)}
            fullWidth
            placeholder={t('lease.vendorPlaceholder')}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: theme.palette.mode === 'light'
                  ? alpha(theme.palette.background.paper, 0.8)
                  : alpha(theme.palette.background.default, 0.4),
                boxShadow: theme.palette.mode === 'light'
                  ? 'inset 2px 2px 4px rgba(0, 0, 0, 0.05), inset -2px -2px 4px rgba(255, 255, 255, 0.8)'
                  : 'inset 3px 3px 6px rgba(0, 0, 0, 0.5), inset -2px -2px 4px rgba(255, 255, 255, 0.02)',
              },
            }}
          />

          {/* Date Row */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label={t('lease.startDate')}
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              fullWidth
              required
              error={!!errors.startDate}
              helperText={errors.startDate}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  background: theme.palette.mode === 'light'
                    ? alpha(theme.palette.background.paper, 0.8)
                    : alpha(theme.palette.background.default, 0.4),
                  boxShadow: theme.palette.mode === 'light'
                    ? 'inset 2px 2px 4px rgba(0, 0, 0, 0.05), inset -2px -2px 4px rgba(255, 255, 255, 0.8)'
                    : 'inset 3px 3px 6px rgba(0, 0, 0, 0.5), inset -2px -2px 4px rgba(255, 255, 255, 0.02)',
                },
              }}
            />

            <TextField
              label={t('lease.endDate')}
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              fullWidth
              required
              error={!!errors.endDate}
              helperText={errors.endDate}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  background: theme.palette.mode === 'light'
                    ? alpha(theme.palette.background.paper, 0.8)
                    : alpha(theme.palette.background.default, 0.4),
                  boxShadow: theme.palette.mode === 'light'
                    ? 'inset 2px 2px 4px rgba(0, 0, 0, 0.05), inset -2px -2px 4px rgba(255, 255, 255, 0.8)'
                    : 'inset 3px 3px 6px rgba(0, 0, 0, 0.5), inset -2px -2px 4px rgba(255, 255, 255, 0.02)',
                },
              }}
            />
          </Box>

          {/* Financial Row */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label={t('lease.monthlyRate')}
              type="number"
              value={formData.monthlyRate}
              onChange={(e) => handleChange('monthlyRate', e.target.value)}
              fullWidth
              error={!!errors.monthlyRate}
              helperText={errors.monthlyRate}
              placeholder="0.00"
              inputProps={{ step: '0.01', min: '0' }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  background: theme.palette.mode === 'light'
                    ? alpha(theme.palette.background.paper, 0.8)
                    : alpha(theme.palette.background.default, 0.4),
                  boxShadow: theme.palette.mode === 'light'
                    ? 'inset 2px 2px 4px rgba(0, 0, 0, 0.05), inset -2px -2px 4px rgba(255, 255, 255, 0.8)'
                    : 'inset 3px 3px 6px rgba(0, 0, 0, 0.5), inset -2px -2px 4px rgba(255, 255, 255, 0.02)',
                },
              }}
            />

            <TextField
              label={t('lease.totalValue')}
              type="number"
              value={formData.totalValue}
              onChange={(e) => handleChange('totalValue', e.target.value)}
              fullWidth
              error={!!errors.totalValue}
              helperText={errors.totalValue}
              placeholder="0.00"
              inputProps={{ step: '0.01', min: '0' }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  background: theme.palette.mode === 'light'
                    ? alpha(theme.palette.background.paper, 0.8)
                    : alpha(theme.palette.background.default, 0.4),
                  boxShadow: theme.palette.mode === 'light'
                    ? 'inset 2px 2px 4px rgba(0, 0, 0, 0.05), inset -2px -2px 4px rgba(255, 255, 255, 0.8)'
                    : 'inset 3px 3px 6px rgba(0, 0, 0, 0.5), inset -2px -2px 4px rgba(255, 255, 255, 0.02)',
                },
              }}
            />
          </Box>

          {/* Status (only for edit) */}
          {isEdit && (
            <TextField
              label={t('lease.status.label')}
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              select
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  background: theme.palette.mode === 'light'
                    ? alpha(theme.palette.background.paper, 0.8)
                    : alpha(theme.palette.background.default, 0.4),
                  boxShadow: theme.palette.mode === 'light'
                    ? 'inset 2px 2px 4px rgba(0, 0, 0, 0.05), inset -2px -2px 4px rgba(255, 255, 255, 0.8)'
                    : 'inset 3px 3px 6px rgba(0, 0, 0, 0.5), inset -2px -2px 4px rgba(255, 255, 255, 0.02)',
                },
              }}
            >
              <MenuItem value="Active">{t('lease.status.active')}</MenuItem>
              <MenuItem value="Expiring">{t('lease.status.expiring')}</MenuItem>
              <MenuItem value="Expired">{t('lease.status.expired')}</MenuItem>
              <MenuItem value="Terminated">{t('lease.status.terminated')}</MenuItem>
              <MenuItem value="Renewed">{t('lease.status.renewed')}</MenuItem>
            </TextField>
          )}

          {/* Notes */}
          <TextField
            label={t('lease.notes')}
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder={t('lease.notesPlaceholder')}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: theme.palette.mode === 'light'
                  ? alpha(theme.palette.background.paper, 0.8)
                  : alpha(theme.palette.background.default, 0.4),
                boxShadow: theme.palette.mode === 'light'
                  ? 'inset 2px 2px 4px rgba(0, 0, 0, 0.05), inset -2px -2px 4px rgba(255, 255, 255, 0.8)'
                  : 'inset 3px 3px 6px rgba(0, 0, 0, 0.5), inset -2px -2px 4px rgba(255, 255, 255, 0.02)',
              },
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          onClick={onClose}
          disabled={isSaving}
          sx={{
            borderRadius: 2,
            px: 3,
            fontWeight: 600,
          }}
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSaving}
          sx={{
            borderRadius: 2,
            px: 3,
            fontWeight: 600,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            color: '#fff',
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
              boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
            },
            '&:disabled': {
              background: alpha(theme.palette.primary.main, 0.3),
            },
          }}
        >
          {isSaving ? t('common.saving') : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeaseContractDialog;

/**
 * EditPhysicalWorkplaceDialog
 *
 * Neumorphic dialog for creating/editing physical workplaces.
 * Design: Neumorphic soft UI with Djoppie orange accent (#FF7700)
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Stack,
  useTheme,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import PlaceIcon from '@mui/icons-material/Place';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import ComputerIcon from '@mui/icons-material/Computer';
import LaptopIcon from '@mui/icons-material/Laptop';
import DeskIcon from '@mui/icons-material/Desk';
import GroupsIcon from '@mui/icons-material/Groups';
import {
  useCreatePhysicalWorkplace,
  useUpdatePhysicalWorkplace,
} from '../../hooks/usePhysicalWorkplaces';
import {
  PhysicalWorkplace,
  CreatePhysicalWorkplaceDto,
  UpdatePhysicalWorkplaceDto,
  WorkplaceType,
  WorkplaceTypeLabels,
} from '../../types/physicalWorkplace.types';
import BuildingSelect from '../common/BuildingSelect';
import ServiceSelect from '../common/ServiceSelect';

interface EditPhysicalWorkplaceDialogProps {
  open: boolean;
  onClose: () => void;
  workplace?: PhysicalWorkplace | null;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

interface FormData {
  code: string;
  name: string;
  description: string;
  buildingId: number | null;
  serviceId: number | null;
  floor: string;
  room: string;
  type: WorkplaceType;
  monitorCount: number;
  hasDockingStation: boolean;
  isActive: boolean;
}

const initialFormData: FormData = {
  code: '',
  name: '',
  description: '',
  buildingId: null,
  serviceId: null,
  floor: '',
  room: '',
  type: WorkplaceType.Laptop,
  monitorCount: 2,
  hasDockingStation: true,
  isActive: true,
};

const getWorkplaceTypeIcon = (type: WorkplaceType) => {
  switch (type) {
    case WorkplaceType.Desktop:
      return <ComputerIcon fontSize="small" />;
    case WorkplaceType.Laptop:
      return <LaptopIcon fontSize="small" />;
    case WorkplaceType.HotDesk:
      return <DeskIcon fontSize="small" />;
    case WorkplaceType.MeetingRoom:
      return <GroupsIcon fontSize="small" />;
    default:
      return <DeskIcon fontSize="small" />;
  }
};

const EditPhysicalWorkplaceDialog = ({
  open,
  onClose,
  workplace,
  onSuccess,
  onError,
}: EditPhysicalWorkplaceDialogProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isEditMode = Boolean(workplace);

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const createMutation = useCreatePhysicalWorkplace();
  const updateMutation = useUpdatePhysicalWorkplace();

  // Sync form data when workplace changes
  useEffect(() => {
    if (open && workplace) {
      setFormData({
        code: workplace.code,
        name: workplace.name,
        description: workplace.description || '',
        buildingId: workplace.buildingId,
        serviceId: workplace.serviceId ?? null,
        floor: workplace.floor || '',
        room: workplace.room || '',
        type: workplace.type,
        monitorCount: workplace.monitorCount,
        hasDockingStation: workplace.hasDockingStation,
        isActive: workplace.isActive,
      });
      setFormErrors({});
    } else if (open && !workplace) {
      setFormData(initialFormData);
      setFormErrors({});
    }
  }, [open, workplace]);

  const handleInputChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.code.trim()) {
      errors.code = t('validation.required');
    }
    if (!formData.name.trim()) {
      errors.name = t('validation.required');
    }
    if (!formData.buildingId) {
      errors.buildingId = t('validation.required');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (isEditMode && workplace) {
        const dto: UpdatePhysicalWorkplaceDto = {
          code: formData.code.trim(),
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          buildingId: formData.buildingId ?? undefined,
          serviceId: formData.serviceId ?? undefined,
          floor: formData.floor.trim() || undefined,
          room: formData.room.trim() || undefined,
          type: formData.type,
          monitorCount: formData.monitorCount,
          hasDockingStation: formData.hasDockingStation,
          isActive: formData.isActive,
        };
        await updateMutation.mutateAsync({ id: workplace.id, data: dto });
        onSuccess?.(t('physicalWorkplaces.updateSuccess'));
      } else {
        const dto: CreatePhysicalWorkplaceDto = {
          code: formData.code.trim(),
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          buildingId: formData.buildingId!,
          serviceId: formData.serviceId ?? undefined,
          floor: formData.floor.trim() || undefined,
          room: formData.room.trim() || undefined,
          type: formData.type,
          monitorCount: formData.monitorCount,
          hasDockingStation: formData.hasDockingStation,
        };
        await createMutation.mutateAsync(dto);
        onSuccess?.(t('physicalWorkplaces.createSuccess'));
      }
      onClose();
    } catch {
      onError?.(t('physicalWorkplaces.saveError'));
    }
  };

  // Neumorphic style helpers
  const neomorphBoxShadow = isDark
    ? '6px 6px 12px #161a1d, -6px -6px 12px #262c33'
    : '6px 6px 12px #c5cad0, -6px -6px 12px #ffffff';

  const neomorphInsetShadow = isDark
    ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
    : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff';

  const bgColor = isDark ? '#1e2328' : '#e8eef3';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          border: 'none',
          bgcolor: isDark ? 'rgba(30, 35, 40, 0.95)' : 'rgba(232, 238, 243, 0.95)',
          backdropFilter: 'blur(20px)',
          boxShadow: isDark
            ? '0px 8px 32px rgba(0, 0, 0, 0.5), 0px 2px 8px rgba(0, 0, 0, 0.3)'
            : '0px 8px 32px rgba(150, 155, 160, 0.3), 0px 2px 8px rgba(180, 185, 190, 0.2)',
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          bgcolor: bgColor,
          borderBottom: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 3,
              bgcolor: bgColor,
              boxShadow: isDark
                ? '8px 8px 16px #161a1d, -8px -8px 16px #262c33, inset 0 0 0 1px rgba(255, 119, 0, 0.3)'
                : '8px 8px 16px #c5cad0, -8px -8px 16px #ffffff, inset 0 0 0 1px rgba(255, 119, 0, 0.2)',
              transition: 'all 0.3s ease',
            }}
          >
            <PlaceIcon
              sx={{
                fontSize: '1.6rem',
                color: '#FF7700',
                filter: 'drop-shadow(0 2px 4px rgba(255, 119, 0, 0.3))',
              }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h5"
              fontWeight={800}
              sx={{
                color: '#FF7700',
                letterSpacing: '-0.02em',
                textShadow: isDark ? '0 2px 10px rgba(255, 119, 0, 0.3)' : 'none',
              }}
            >
              {isEditMode ? t('physicalWorkplaces.editWorkplace') : t('physicalWorkplaces.addWorkplace')}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
              }}
            >
              {isEditMode
                ? t('physicalWorkplaces.editWorkplaceDesc')
                : t('physicalWorkplaces.addWorkplaceDesc')}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <DialogContent sx={{ p: 3, bgcolor: bgColor }}>
        {/* Identification Section */}
        <Box
          sx={{
            p: 2.5,
            borderRadius: 3,
            bgcolor: bgColor,
            boxShadow: neomorphBoxShadow,
            mb: 3,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: bgColor,
                boxShadow: neomorphInsetShadow,
              }}
            >
              <PlaceIcon sx={{ color: '#FF7700', fontSize: '1.3rem' }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: isDark ? '#fff' : '#333' }}>
              {t('physicalWorkplaces.identification')}
            </Typography>
          </Stack>

          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('physicalWorkplaces.code')}
                value={formData.code}
                onChange={handleInputChange('code')}
                error={!!formErrors.code}
                helperText={formErrors.code || t('physicalWorkplaces.codeHint')}
                required
                size="small"
                sx={{ flex: 1 }}
                InputProps={{
                  sx: {
                    borderRadius: 2,
                    bgcolor: bgColor,
                    boxShadow: neomorphInsetShadow,
                    '& fieldset': { border: 'none' },
                  },
                }}
              />
              <TextField
                label={t('physicalWorkplaces.name')}
                value={formData.name}
                onChange={handleInputChange('name')}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
                size="small"
                sx={{ flex: 2 }}
                InputProps={{
                  sx: {
                    borderRadius: 2,
                    bgcolor: bgColor,
                    boxShadow: neomorphInsetShadow,
                    '& fieldset': { border: 'none' },
                  },
                }}
              />
            </Stack>

            <TextField
              label={t('physicalWorkplaces.description')}
              value={formData.description}
              onChange={handleInputChange('description')}
              multiline
              rows={2}
              size="small"
              fullWidth
              InputProps={{
                sx: {
                  borderRadius: 2,
                  bgcolor: bgColor,
                  boxShadow: neomorphInsetShadow,
                  '& fieldset': { border: 'none' },
                },
              }}
            />
          </Stack>
        </Box>

        {/* Location Section */}
        <Box
          sx={{
            p: 2.5,
            borderRadius: 3,
            bgcolor: bgColor,
            boxShadow: neomorphBoxShadow,
            mb: 3,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: bgColor,
                boxShadow: neomorphInsetShadow,
              }}
            >
              <MeetingRoomIcon sx={{ color: '#FF7700', fontSize: '1.3rem' }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: isDark ? '#fff' : '#333' }}>
              {t('physicalWorkplaces.location')}
            </Typography>
          </Stack>

          <Stack spacing={2}>
            <BuildingSelect
              value={formData.buildingId}
              onChange={(value) => setFormData((prev) => ({ ...prev, buildingId: value }))}
              label={t('physicalWorkplaces.building')}
              required
              error={!!formErrors.buildingId}
            />

            <ServiceSelect
              value={formData.serviceId}
              onChange={(value) => setFormData((prev) => ({ ...prev, serviceId: value }))}
              label={t('physicalWorkplaces.service')}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('physicalWorkplaces.floor')}
                value={formData.floor}
                onChange={handleInputChange('floor')}
                size="small"
                sx={{ flex: 1 }}
                InputProps={{
                  sx: {
                    borderRadius: 2,
                    bgcolor: bgColor,
                    boxShadow: neomorphInsetShadow,
                    '& fieldset': { border: 'none' },
                  },
                }}
              />
              <TextField
                label={t('physicalWorkplaces.room')}
                value={formData.room}
                onChange={handleInputChange('room')}
                size="small"
                sx={{ flex: 1 }}
                InputProps={{
                  sx: {
                    borderRadius: 2,
                    bgcolor: bgColor,
                    boxShadow: neomorphInsetShadow,
                    '& fieldset': { border: 'none' },
                  },
                }}
              />
            </Stack>
          </Stack>
        </Box>

        {/* Configuration Section */}
        <Box
          sx={{
            p: 2.5,
            borderRadius: 3,
            bgcolor: bgColor,
            boxShadow: neomorphBoxShadow,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: bgColor,
                boxShadow: neomorphInsetShadow,
              }}
            >
              <ComputerIcon sx={{ color: '#FF7700', fontSize: '1.3rem' }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: isDark ? '#fff' : '#333' }}>
              {t('physicalWorkplaces.configuration')}
            </Typography>
          </Stack>

          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('physicalWorkplaces.type')}</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as WorkplaceType }))}
                label={t('physicalWorkplaces.type')}
                sx={{
                  borderRadius: 2,
                  bgcolor: bgColor,
                  boxShadow: neomorphInsetShadow,
                  '& fieldset': { border: 'none' },
                }}
              >
                {Object.entries(WorkplaceTypeLabels).map(([value, label]) => (
                  <MenuItem key={value} value={Number(value)}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {getWorkplaceTypeIcon(Number(value) as WorkplaceType)}
                      <span>{label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField
                label={t('physicalWorkplaces.monitorCount')}
                type="number"
                value={formData.monitorCount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, monitorCount: parseInt(e.target.value) || 0 }))
                }
                inputProps={{ min: 0, max: 6 }}
                size="small"
                sx={{ flex: 1 }}
                InputProps={{
                  sx: {
                    borderRadius: 2,
                    bgcolor: bgColor,
                    boxShadow: neomorphInsetShadow,
                    '& fieldset': { border: 'none' },
                  },
                }}
              />
              <Box
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: bgColor,
                  boxShadow: formData.hasDockingStation
                    ? `${neomorphInsetShadow}, inset 0 0 0 2px rgba(255, 119, 0, 0.3)`
                    : neomorphBoxShadow,
                  transition: 'all 0.3s ease',
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.hasDockingStation}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, hasDockingStation: e.target.checked }))
                      }
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#FF7700',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#FF7700',
                        },
                      }}
                    />
                  }
                  label={t('physicalWorkplaces.hasDockingStation')}
                  sx={{ m: 0 }}
                />
              </Box>
            </Stack>

            {isEditMode && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: bgColor,
                  boxShadow: formData.isActive
                    ? `${neomorphBoxShadow}, inset 0 0 0 2px rgba(76, 175, 80, 0.3)`
                    : `${neomorphInsetShadow}, inset 0 0 0 2px rgba(244, 67, 54, 0.3)`,
                  transition: 'all 0.3s ease',
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                        }
                        color="success"
                      />
                    }
                    label={t('physicalWorkplaces.isActive')}
                    sx={{ m: 0 }}
                  />
                  <Chip
                    label={formData.isActive ? t('physicalWorkplaces.active') : t('physicalWorkplaces.inactive')}
                    size="small"
                    color={formData.isActive ? 'success' : 'error'}
                    sx={{
                      fontWeight: 600,
                      boxShadow: isDark
                        ? '2px 2px 4px #161a1d, -2px -2px 4px #262c33'
                        : '2px 2px 4px #c5cad0, -2px -2px 4px #ffffff',
                    }}
                  />
                </Stack>
              </Box>
            )}
          </Stack>
        </Box>
      </DialogContent>

      {/* Actions */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          bgcolor: bgColor,
          borderTop: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          gap: 2,
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            fontWeight: 600,
            px: 3,
            py: 1,
            borderRadius: 2,
            bgcolor: bgColor,
            color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
            boxShadow: isDark
              ? '4px 4px 8px #161a1d, -4px -4px 8px #262c33'
              : '4px 4px 8px #c5cad0, -4px -4px 8px #ffffff',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: bgColor,
              boxShadow: neomorphInsetShadow,
            },
          }}
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={createMutation.isPending || updateMutation.isPending}
          sx={{
            fontWeight: 700,
            px: 4,
            py: 1,
            borderRadius: 2,
            bgcolor: bgColor,
            color: '#FF7700',
            boxShadow: isDark
              ? '4px 4px 8px #161a1d, -4px -4px 8px #262c33, inset 0 0 0 2px rgba(255, 119, 0, 0.3)'
              : '4px 4px 8px #c5cad0, -4px -4px 8px #ffffff, inset 0 0 0 2px rgba(255, 119, 0, 0.2)',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: bgColor,
              boxShadow: isDark
                ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33, inset 0 0 0 2px rgba(255, 119, 0, 0.5)'
                : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff, inset 0 0 0 2px rgba(255, 119, 0, 0.4)',
            },
            '&.Mui-disabled': {
              color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)',
              boxShadow: neomorphInsetShadow,
            },
          }}
        >
          {createMutation.isPending || updateMutation.isPending
            ? t('common.saving')
            : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditPhysicalWorkplaceDialog;

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Stack,
  useTheme,
  Popover,
  InputAdornment,
  IconButton,
  Collapse,
  Chip,
  alpha,
} from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CheckIcon from '@mui/icons-material/Check';
import BusinessIcon from '@mui/icons-material/Business';
import { useQuery } from '@tanstack/react-query';
import { useCreateRolloutDay, useUpdateRolloutDay } from '../../../hooks/useRollout';
import { servicesApi } from '../../../api/admin.api';
import type { Service } from '../../../types/admin.types';
import type { RolloutDay, CreateRolloutDay, UpdateRolloutDay } from '../../../types/rollout';
import { ASSET_COLOR } from '../../../constants/filterColors';

interface RolloutDayDialogProps {
  open: boolean;
  onClose: () => void;
  sessionId: number;
  day?: RolloutDay;
  dayNumber?: number;
  defaultDate?: string;
}

const RolloutDayDialog = ({ open, onClose, sessionId, day, dayNumber, defaultDate }: RolloutDayDialogProps) => {
  const isEditMode = Boolean(day);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<number | ''>('');
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: services } = useQuery({
    queryKey: ['admin', 'services'],
    queryFn: () => servicesApi.getAll(false),
    enabled: open,
  });

  const createMutation = useCreateRolloutDay();
  const updateMutation = useUpdateRolloutDay();

  // Group services by sector (stable ordering: sortOrder then name)
  const servicesBySector = useMemo(() => {
    const byName = new Map<string, { sortOrder: number; services: Service[] }>();
    (services || []).forEach((service) => {
      const sectorName = service.sector?.name || 'Overig';
      const sortOrder = service.sector?.sortOrder ?? Number.MAX_SAFE_INTEGER;
      if (!byName.has(sectorName)) byName.set(sectorName, { sortOrder, services: [] });
      byName.get(sectorName)!.services.push(service);
    });
    return Array.from(byName.entries())
      .map(([name, { sortOrder, services: svcs }]) => ({
        name,
        sortOrder,
        services: svcs.slice().sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }, [services]);

  // Service picker state
  const [pickerAnchor, setPickerAnchor] = useState<HTMLDivElement | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set());
  const [pickerSearch, setPickerSearch] = useState('');

  const selectedService = useMemo(
    () => (services || []).find((s) => s.id === selectedServiceId),
    [services, selectedServiceId],
  );

  // Filter sectors by search — match either sector name or service name
  const filteredSectors = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return servicesBySector;
    return servicesBySector
      .map((group) => ({
        ...group,
        services: group.name.toLowerCase().includes(q)
          ? group.services
          : group.services.filter((s) => s.name.toLowerCase().includes(q)),
      }))
      .filter((group) => group.services.length > 0);
  }, [servicesBySector, pickerSearch]);

  // When searching, auto-expand all matching sectors so results are visible.
  // Intentional state sync on search change.
  useEffect(() => {
    if (pickerSearch.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedSectors(new Set(filteredSectors.map((g) => g.name)));
    }
  }, [pickerSearch, filteredSectors]);

  // Auto-expand the sector of the selected service when the picker opens.
  useEffect(() => {
    if (pickerOpen && selectedService?.sector?.name) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedSectors((prev) => {
        if (prev.has(selectedService.sector!.name)) return prev;
        const next = new Set(prev);
        next.add(selectedService.sector!.name);
        return next;
      });
    }
  }, [pickerOpen, selectedService]);

  const toggleSectorExpand = (sectorName: string) => {
    setExpandedSectors((prev) => {
      const next = new Set(prev);
      if (next.has(sectorName)) next.delete(sectorName);
      else next.add(sectorName);
      return next;
    });
  };

  const selectService = (id: number | '') => {
    setSelectedServiceId(id);
    if (id) {
      const svc = (services || []).find((s) => s.id === id);
      if (svc) {
        const sectorLabel = svc.sector?.name ? ` (${svc.sector.name})` : '';
        setName(`${svc.name}${sectorLabel}`);
      }
    }
    setPickerOpen(false);
    setPickerSearch('');
  };

  // State-tracking pattern: sync form state from props during render
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  const currentKey = day ? `day-${day.id}-${day.updatedAt}` : (open ? 'new' : null);

  if (open && currentKey && currentKey !== syncedKey) {
    setSyncedKey(currentKey);
    if (day) {
      setDate(day.date.split('T')[0]);
      setName(day.name || '');
      setSelectedServiceId(day.scheduledServiceIds?.[0] || '');
    } else {
      setDate(defaultDate || '');
      setName('');
      setSelectedServiceId('');
    }
  }

  if (!open && syncedKey !== null) {
    setSyncedKey(null);
  }

  const handleSave = async () => {
    setSaveError(null);
    try {
      const serviceIds = selectedServiceId ? [selectedServiceId] : [];

      if (isEditMode && day) {
        const updateData: UpdateRolloutDay = {
          date,
          name: name || undefined,
          dayNumber: day.dayNumber,
          scheduledServiceIds: serviceIds,
        };
        await updateMutation.mutateAsync({ dayId: day.id, data: updateData });
      } else {
        const createData: CreateRolloutDay = {
          rolloutSessionId: sessionId,
          date,
          name: name || undefined,
          dayNumber: dayNumber || 1,
          scheduledServiceIds: serviceIds,
        };
        await createMutation.mutateAsync({ sessionId, data: createData });
      }

      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Er is een fout opgetreden bij het opslaan';
      setSaveError(message);
    }
  };

  const handleClose = () => {
    setDate('');
    setName('');
    setSelectedServiceId('');
    setSaveError(null);
    onClose();
  };

  const isFormValid = date.trim();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableRestoreFocus
      PaperProps={{
        sx: {
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      {/* Clean header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 1.5,
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              color: 'text.primary',
            }}
          >
            <CalendarTodayIcon sx={{ fontSize: '1.2rem' }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {isEditMode ? 'Planning Bewerken' : 'Nieuwe Planning'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isEditMode ? 'Pas de planning aan (datum kan worden verzet)' : 'Configureer een nieuwe planning batch'}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {saveError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>
            {saveError}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Geplande Datum"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            helperText="Selecteer de datum voor deze planning (kan later worden verzet)"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: ASSET_COLOR,
                },
                '&.Mui-focused fieldset': {
                  borderColor: ASSET_COLOR,
                },
              },
            }}
          />
          {/* Service picker trigger — custom so we can render collapsible sector groups */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 0.5,
                color: 'text.secondary',
                fontWeight: 500,
              }}
            >
              Dienst
            </Typography>
            <Box
              ref={setPickerAnchor}
              role="combobox"
              aria-expanded={pickerOpen}
              aria-haspopup="listbox"
              tabIndex={0}
              onClick={() => setPickerOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  setPickerOpen(true);
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 1,
                minHeight: 40,
                borderRadius: 1,
                border: '1px solid',
                borderColor: pickerOpen ? ASSET_COLOR : 'divider',
                bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                boxShadow: pickerOpen ? `0 0 0 3px ${alpha(ASSET_COLOR, 0.15)}` : 'none',
                '&:hover': {
                  borderColor: pickerOpen ? ASSET_COLOR : 'text.secondary',
                },
                '&:focus-visible': {
                  outline: 'none',
                  borderColor: ASSET_COLOR,
                  boxShadow: `0 0 0 3px ${alpha(ASSET_COLOR, 0.2)}`,
                },
              }}
            >
              <BusinessIcon sx={{ fontSize: '1.1rem', color: 'text.secondary' }} />
              {selectedService ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                    {selectedService.name}
                  </Typography>
                  {selectedService.sector?.name && (
                    <Chip
                      label={selectedService.sector.name}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        bgcolor: alpha(ASSET_COLOR, 0.12),
                        color: ASSET_COLOR,
                        border: `1px solid ${alpha(ASSET_COLOR, 0.25)}`,
                      }}
                    />
                  )}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ flex: 1, color: 'text.secondary' }}>
                  Geen dienst geselecteerd
                </Typography>
              )}
              {selectedService && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectService('');
                  }}
                  sx={{ p: 0.25 }}
                  aria-label="Selectie wissen"
                >
                  <ClearIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              )}
              <KeyboardArrowDownIcon
                sx={{
                  fontSize: '1.2rem',
                  color: 'text.secondary',
                  transition: 'transform 0.2s ease',
                  transform: pickerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </Box>
          </Box>

          <Popover
            open={pickerOpen}
            anchorEl={pickerAnchor}
            onClose={() => {
              setPickerOpen(false);
              setPickerSearch('');
            }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            slotProps={{
              paper: {
                sx: {
                  mt: 0.5,
                  width: pickerAnchor?.offsetWidth,
                  maxHeight: 440,
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: isDark
                    ? '0 8px 24px rgba(0,0,0,0.5)'
                    : '0 8px 24px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                },
              },
            }}
          >
            {/* Search box */}
            <Box sx={{ p: 1.25, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
              <TextField
                autoFocus
                fullWidth
                size="small"
                placeholder="Zoek dienst of sector..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: '1.1rem', color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: pickerSearch ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setPickerSearch('')}
                        sx={{ p: 0.25 }}
                        aria-label="Zoekveld wissen"
                      >
                        <ClearIcon sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: ASSET_COLOR },
                    '&.Mui-focused fieldset': { borderColor: ASSET_COLOR },
                  },
                }}
              />
            </Box>

            {/* Scrollable sector list */}
            <Box sx={{ flex: 1, overflow: 'auto', py: 0.5 }}>
              {/* "No service" clear option */}
              <Box
                role="option"
                aria-selected={!selectedServiceId}
                onClick={() => selectService('')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1,
                  cursor: 'pointer',
                  bgcolor: !selectedServiceId ? alpha(ASSET_COLOR, 0.1) : 'transparent',
                  '&:hover': {
                    bgcolor: !selectedServiceId
                      ? alpha(ASSET_COLOR, 0.15)
                      : isDark
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(0,0,0,0.03)',
                  },
                }}
              >
                {!selectedServiceId && <CheckIcon sx={{ fontSize: '1rem', color: ASSET_COLOR }} />}
                <Typography
                  variant="body2"
                  sx={{
                    fontStyle: 'italic',
                    color: !selectedServiceId ? ASSET_COLOR : 'text.secondary',
                    fontWeight: !selectedServiceId ? 600 : 400,
                  }}
                >
                  Geen dienst
                </Typography>
              </Box>

              {filteredSectors.length === 0 && (
                <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Geen resultaten voor "{pickerSearch}"
                  </Typography>
                </Box>
              )}

              {filteredSectors.map((group) => {
                const isExpanded = expandedSectors.has(group.name);
                const selectedInGroup = group.services.some((s) => s.id === selectedServiceId);
                return (
                  <Box key={group.name}>
                    {/* Sector header — click to collapse/expand */}
                    <Box
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleSectorExpand(group.name)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleSectorExpand(group.name);
                        }
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 2,
                        py: 0.75,
                        cursor: 'pointer',
                        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)',
                        borderTop: '1px solid',
                        borderBottom: isExpanded ? '1px solid' : 'none',
                        borderColor: 'divider',
                        userSelect: 'none',
                        '&:hover': {
                          bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                        },
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: selectedInGroup ? ASSET_COLOR : 'text.secondary',
                          flex: 1,
                        }}
                      >
                        {group.name}
                      </Typography>
                      <Chip
                        label={group.services.length}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          minWidth: 22,
                          bgcolor: selectedInGroup ? ASSET_COLOR : alpha(ASSET_COLOR, 0.12),
                          color: selectedInGroup ? '#fff' : ASSET_COLOR,
                          '& .MuiChip-label': { px: 0.75 },
                        }}
                      />
                      {isExpanded ? (
                        <ExpandLessIcon sx={{ fontSize: '1.2rem', color: 'text.secondary' }} />
                      ) : (
                        <ExpandMoreIcon sx={{ fontSize: '1.2rem', color: 'text.secondary' }} />
                      )}
                    </Box>

                    {/* Services in this sector */}
                    <Collapse in={isExpanded} timeout={180} unmountOnExit>
                      <Box>
                        {group.services.map((service) => {
                          const isSelected = selectedServiceId === service.id;
                          return (
                            <Box
                              key={service.id}
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => selectService(service.id)}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                pl: 4,
                                pr: 2,
                                py: 0.9,
                                cursor: 'pointer',
                                bgcolor: isSelected ? alpha(ASSET_COLOR, 0.12) : 'transparent',
                                borderLeft: '3px solid',
                                borderLeftColor: isSelected ? ASSET_COLOR : 'transparent',
                                transition: 'background-color 0.1s ease',
                                '&:hover': {
                                  bgcolor: isSelected
                                    ? alpha(ASSET_COLOR, 0.18)
                                    : isDark
                                      ? 'rgba(255,255,255,0.05)'
                                      : 'rgba(0,0,0,0.04)',
                                },
                              }}
                            >
                              {isSelected ? (
                                <CheckIcon sx={{ fontSize: '1rem', color: ASSET_COLOR }} />
                              ) : (
                                <Box sx={{ width: '1rem' }} />
                              )}
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: isSelected ? 600 : 400,
                                  color: isSelected ? ASSET_COLOR : 'text.primary',
                                }}
                              >
                                {service.name}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    </Collapse>
                  </Box>
                );
              })}
            </Box>
          </Popover>
          <TextField
            label="Planning Naam (optioneel)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            size="small"
            helperText="Bijv. 'Batch 1 - Week 12' of 'IT Afdeling Planning'"
          />

          {!isEditMode && (
            <Alert
              severity="info"
              icon={<CloudDownloadIcon />}
              sx={{
                mt: 2,
                '& .MuiAlert-icon': {
                  color: ASSET_COLOR,
                },
              }}
            >
              <Typography variant="body2">
                Na het aanmaken kun je werkplekken importeren uit <strong>Azure AD</strong> of handmatig toevoegen.
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={handleClose} size="small">
          Annuleren
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          size="small"
          disabled={
            !isFormValid ||
            createMutation.isPending ||
            updateMutation.isPending
          }
        >
          {createMutation.isPending || updateMutation.isPending
            ? 'Opslaan...'
            : 'Opslaan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RolloutDayDialog;

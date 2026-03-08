import { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ToggleButtonGroup,
  ToggleButton,
  Slider,
  FormControlLabel,
  Checkbox,
  Chip,
  Stack,
  useTheme,
  Autocomplete,
  CircularProgress,
  Switch,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LaptopIcon from '@mui/icons-material/Laptop';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import LinkIcon from '@mui/icons-material/Link';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PersonIcon from '@mui/icons-material/Person';
import ComputerIcon from '@mui/icons-material/Computer';
import DockIcon from '@mui/icons-material/Dock';
import MonitorIcon from '@mui/icons-material/Monitor';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { useCreateRolloutWorkplace, useUpdateRolloutWorkplace } from '../../hooks/useRollout';
import { useAssetTemplates } from '../../hooks/useAssetTemplates';
import { SerialSearchField } from './SerialSearchField';
import { TemplateSelector } from './TemplateSelector';
import { graphApi } from '../../api/graph.api';
import { intuneApi } from '../../api/intune.api';
import type { GraphUser, IntuneDevice } from '../../types/graph.types';
import type {
  RolloutWorkplace,
  CreateRolloutWorkplace,
  UpdateRolloutWorkplace,
  AssetPlan,
} from '../../types/rollout';
import { getAssetByCode } from '../../api/assets.api';
import type { Asset, AssetTemplate } from '../../types/asset.types';

interface RolloutWorkplaceDialogProps {
  open: boolean;
  onClose: () => void;
  dayId: number;
  workplace?: RolloutWorkplace;
}

interface MonitorConfig {
  templateId?: number;
  template?: AssetTemplate | null;
  position: 'left' | 'center' | 'right';
  hasCamera: boolean;
  serial?: string;
  linkedAsset?: Asset | null;
  assetCode?: string;
}

const LinkedAssetChip = ({ workplace, equipmentType, index, variant: chipVariant = 'new' }: {
  workplace?: RolloutWorkplace;
  equipmentType: string;
  index?: number;
  variant?: 'new' | 'old';
}) => {
  const plans = workplace?.assetPlans || [];
  const plan = index !== undefined
    ? plans.filter(p => p.equipmentType === equipmentType)[index]
    : plans.find(p => p.equipmentType === equipmentType);
  if (!plan) return null;
  const code = chipVariant === 'old' ? plan.oldAssetCode : plan.existingAssetCode;
  const name = chipVariant === 'old' ? plan.oldAssetName : plan.existingAssetName;
  if (!code) return null;
  return (
    <Chip
      icon={<LinkIcon />}
      label={`${chipVariant === 'old' ? 'Oud: ' : ''}${code}${name ? ` — ${name}` : ''}`}
      size="small"
      color={chipVariant === 'old' ? 'warning' : 'success'}
      variant="outlined"
      sx={{ mt: 1 }}
    />
  );
};

const AssetCodeSearchField = ({ label, value, onChange, onAssetLinked, linkedAsset, helperText }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onAssetLinked: (asset: Asset | null) => void;
  linkedAsset?: Asset | null;
  helperText?: string;
}) => {
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!value.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const asset = await getAssetByCode(value.trim().toUpperCase());
      onAssetLinked(asset);
    } catch {
      onAssetLinked(null);
      setError('Asset niet gevonden met deze code');
    } finally {
      setSearching(false);
    }
  };

  return (
    <Box>
      <TextField
        fullWidth
        label={label}
        value={value}
        onChange={(e) => { onChange(e.target.value); onAssetLinked(null); setError(null); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
        helperText={error || helperText}
        error={!!error}
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <QrCodeScannerIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={handleSearch} disabled={!value.trim() || searching} edge="end" size="small">
                {searching ? <CircularProgress size={18} /> : <SearchIcon />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      {linkedAsset && (
        <Alert severity="success" sx={{ mt: 1 }}>
          <strong>Gekoppeld:</strong> {linkedAsset.assetCode} — {linkedAsset.assetName}
          {linkedAsset.brand && linkedAsset.model && <span> ({linkedAsset.brand} {linkedAsset.model})</span>}
        </Alert>
      )}
    </Box>
  );
};

const RolloutWorkplaceDialog = ({ open, onClose, dayId, workplace }: RolloutWorkplaceDialogProps) => {
  const isEditMode = Boolean(workplace);

  // User info state
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [location, setLocation] = useState('');
  const [serviceId, setServiceId] = useState<number | undefined>();

  // Computer state
  const [computerType, setComputerType] = useState<'laptop' | 'desktop'>('laptop');
  const [oldComputerSerial, setOldComputerSerial] = useState('');
  const [oldComputerAsset, setOldComputerAsset] = useState<Asset | null>(null);
  const [newComputerSerial, setNewComputerSerial] = useState('');
  const [newComputerAsset, setNewComputerAsset] = useState<Asset | null>(null);

  // Docking state
  const [dockingTemplate, setDockingTemplate] = useState<AssetTemplate | null>(null);
  const [dockingSerial, setDockingSerial] = useState('');

  // Monitors state
  const [monitorCount, setMonitorCount] = useState(2);
  const [monitorConfigs, setMonitorConfigs] = useState<MonitorConfig[]>([
    { position: 'left', hasCamera: false, template: null },
    { position: 'right', hasCamera: false, template: null },
  ]);

  // Peripherals state
  const [keyboardTemplate, setKeyboardTemplate] = useState<AssetTemplate | null>(null);
  const [mouseTemplate, setMouseTemplate] = useState<AssetTemplate | null>(null);

  // Retroactive registration state
  const [isRetroactive, setIsRetroactive] = useState(false);
  const [dockingAssetCode, setDockingAssetCode] = useState('');
  const [dockingLinkedAsset, setDockingLinkedAsset] = useState<Asset | null>(null);
  const [keyboardAssetCode, setKeyboardAssetCode] = useState('');
  const [keyboardLinkedAsset, setKeyboardLinkedAsset] = useState<Asset | null>(null);
  const [mouseAssetCode, setMouseAssetCode] = useState('');
  const [mouseLinkedAsset, setMouseLinkedAsset] = useState<Asset | null>(null);

  const createMutation = useCreateRolloutWorkplace();
  const updateMutation = useUpdateRolloutWorkplace();
  const { data: allTemplates } = useAssetTemplates();

  // User search state for autocomplete
  const [userOptions, setUserOptions] = useState<GraphUser[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userDevices, setUserDevices] = useState<IntuneDevice[]>([]);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUserSearch = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setUserOptions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setUserSearchLoading(true);
      try {
        const users = await graphApi.searchUsers(query, 10);
        setUserOptions(users);
      } catch {
        setUserOptions([]);
      } finally {
        setUserSearchLoading(false);
      }
    }, 300);
  }, []);

  // Track which workplace/templates we've synced to avoid re-syncing
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  const currentKey = workplace ? `${workplace.id}-${workplace.updatedAt}-${allTemplates?.length ?? 0}` : null;

  if (open && currentKey && currentKey !== syncedKey) {
    setSyncedKey(currentKey);

    // Reset retroactive states (will be populated from plan data below if applicable)
    setIsRetroactive(false);
    setDockingAssetCode('');
    setDockingLinkedAsset(null);
    setKeyboardAssetCode('');
    setKeyboardLinkedAsset(null);
    setMouseAssetCode('');
    setMouseLinkedAsset(null);

    const findTpl = (brand?: string, model?: string): AssetTemplate | null => {
      if (!allTemplates || !brand) return null;
      return allTemplates.find(t =>
        t.brand?.toLowerCase() === brand.toLowerCase() &&
        (!model || t.model?.toLowerCase() === model.toLowerCase())
      ) || null;
    };

    setUserName(workplace!.userName);
    setUserEmail(workplace!.userEmail || '');
    setLocation(workplace!.location || '');
    setServiceId(workplace!.serviceId);

    const plans = workplace!.assetPlans || [];

    const computerPlan = plans.find(p => p.equipmentType === 'laptop' || p.equipmentType === 'desktop');
    if (computerPlan) {
      setComputerType(computerPlan.equipmentType as 'laptop' | 'desktop');
      setNewComputerSerial(computerPlan.metadata?.serialNumber || '');
      if (computerPlan.existingAssetId) {
        setNewComputerAsset({
          id: computerPlan.existingAssetId,
          assetCode: computerPlan.existingAssetCode || '',
          assetName: computerPlan.existingAssetName || '',
        } as Asset);
      }
      if (computerPlan.oldAssetId) {
        setOldComputerSerial(computerPlan.metadata?.oldSerial || '');
        setOldComputerAsset({
          id: computerPlan.oldAssetId,
          assetCode: computerPlan.oldAssetCode || '',
          assetName: computerPlan.oldAssetName || '',
        } as Asset);
      }
    }

    const dockingPlan = plans.find(p => p.equipmentType === 'docking');
    if (dockingPlan) {
      setDockingSerial(dockingPlan.metadata?.serialNumber || '');
      setDockingTemplate(findTpl(dockingPlan.brand, dockingPlan.model));
      if (dockingPlan.existingAssetId) {
        setDockingAssetCode(dockingPlan.existingAssetCode || '');
        setDockingLinkedAsset({ id: dockingPlan.existingAssetId, assetCode: dockingPlan.existingAssetCode || '', assetName: dockingPlan.existingAssetName || '' } as Asset);
      }
    }

    const monitorPlans = plans.filter(p => p.equipmentType === 'monitor');
    if (monitorPlans.length > 0) {
      setMonitorCount(monitorPlans.length);
      setMonitorConfigs(monitorPlans.map(p => ({
        position: (p.metadata?.position || 'left') as 'left' | 'center' | 'right',
        hasCamera: p.metadata?.hasCamera === 'true',
        serial: p.metadata?.serialNumber,
        template: findTpl(p.brand, p.model),
        linkedAsset: p.existingAssetId ? { id: p.existingAssetId, assetCode: p.existingAssetCode || '', assetName: p.existingAssetName || '' } as Asset : null,
        assetCode: p.existingAssetCode || '',
      })));
    }

    const keyboardPlan = plans.find(p => p.equipmentType === 'keyboard');
    if (keyboardPlan) {
      setKeyboardTemplate(findTpl(keyboardPlan.brand, keyboardPlan.model));
      if (keyboardPlan.existingAssetId) {
        setKeyboardAssetCode(keyboardPlan.existingAssetCode || '');
        setKeyboardLinkedAsset({ id: keyboardPlan.existingAssetId, assetCode: keyboardPlan.existingAssetCode || '', assetName: keyboardPlan.existingAssetName || '' } as Asset);
      }
    }

    const mousePlan = plans.find(p => p.equipmentType === 'mouse');
    if (mousePlan) {
      setMouseTemplate(findTpl(mousePlan.brand, mousePlan.model));
      if (mousePlan.existingAssetId) {
        setMouseAssetCode(mousePlan.existingAssetCode || '');
        setMouseLinkedAsset({ id: mousePlan.existingAssetId, assetCode: mousePlan.existingAssetCode || '', assetName: mousePlan.existingAssetName || '' } as Asset);
      }
    }

    // Detect retroactive mode: non-computer plans with linked assets
    const nonComputerPlans = plans.filter(p => p.equipmentType !== 'laptop' && p.equipmentType !== 'desktop');
    setIsRetroactive(nonComputerPlans.some(p => p.existingAssetId && !p.createNew));
  }

  // Reset when dialog opens without a workplace (new mode)
  if (open && !workplace && syncedKey !== 'new') {
    setSyncedKey('new');
    setUserName('');
    setUserEmail('');
    setLocation('');
    setServiceId(undefined);
    setComputerType('laptop');
    setOldComputerSerial('');
    setOldComputerAsset(null);
    setNewComputerSerial('');
    setNewComputerAsset(null);
    setDockingTemplate(null);
    setDockingSerial('');
    setMonitorCount(2);
    setMonitorConfigs([
      { position: 'left', hasCamera: false, template: null },
      { position: 'right', hasCamera: false, template: null },
    ]);
    setKeyboardTemplate(null);
    setMouseTemplate(null);
    setIsRetroactive(false);
    setDockingAssetCode('');
    setDockingLinkedAsset(null);
    setKeyboardAssetCode('');
    setKeyboardLinkedAsset(null);
    setMouseAssetCode('');
    setMouseLinkedAsset(null);
  }

  // Reset synced key when dialog closes
  if (!open && syncedKey !== null) {
    setSyncedKey(null);
  }

  const updateMonitorConfig = (index: number, field: keyof MonitorConfig, value: MonitorConfig[keyof MonitorConfig]) => {
    const updated = [...monitorConfigs];
    updated[index] = { ...updated[index], [field]: value };
    setMonitorConfigs(updated);
  };

  const handleMonitorCountChange = (_: Event, value: number | number[]) => {
    const count = value as number;
    setMonitorCount(count);

    // Adjust configs array
    const newConfigs: MonitorConfig[] = [];
    const positions: Array<'left' | 'center' | 'right'> = count === 1 ? ['center'] : count === 2 ? ['left', 'right'] : ['left', 'center', 'right'];

    for (let i = 0; i < count; i++) {
      newConfigs.push(monitorConfigs[i] || { position: positions[i], hasCamera: false, template: null });
    }
    setMonitorConfigs(newConfigs);
  };

  const buildAssetPlans = (): AssetPlan[] => {
    const plans: AssetPlan[] = [];

    // Computer plan
    plans.push({
      equipmentType: computerType,
      createNew: !newComputerAsset, // Create new if not found
      requiresSerialNumber: true,
      requiresQRCode: false, // Existing or found asset
      status: 'pending',
      metadata: {
        serialNumber: newComputerSerial,
        oldSerial: oldComputerSerial,
      },
      ...(newComputerAsset && {
        existingAssetId: newComputerAsset.id,
        existingAssetCode: newComputerAsset.assetCode,
        existingAssetName: newComputerAsset.assetName,
      }),
      ...(oldComputerAsset && {
        oldAssetId: oldComputerAsset.id,
        oldAssetCode: oldComputerAsset.assetCode,
        oldAssetName: oldComputerAsset.assetName,
      }),
    });

    // Docking plan
    if (dockingTemplate || dockingSerial || dockingLinkedAsset) {
      plans.push({
        equipmentType: 'docking',
        createNew: !dockingLinkedAsset && !isRetroactive,
        requiresSerialNumber: !isRetroactive,
        requiresQRCode: !dockingLinkedAsset && !isRetroactive,
        status: 'pending',
        brand: dockingLinkedAsset?.brand || dockingTemplate?.brand,
        model: dockingLinkedAsset?.model || dockingTemplate?.model,
        metadata: {
          serialNumber: dockingSerial,
        },
        ...(dockingLinkedAsset && {
          existingAssetId: dockingLinkedAsset.id,
          existingAssetCode: dockingLinkedAsset.assetCode,
          existingAssetName: dockingLinkedAsset.assetName,
        }),
      });
    }

    // Monitor plans
    monitorConfigs.forEach((config, index) => {
      plans.push({
        equipmentType: 'monitor',
        createNew: !config.linkedAsset && !isRetroactive,
        requiresSerialNumber: false,
        requiresQRCode: !config.linkedAsset && !isRetroactive,
        status: 'pending',
        brand: config.linkedAsset?.brand || config.template?.brand,
        model: config.linkedAsset?.model || config.template?.model,
        metadata: {
          position: config.position,
          hasCamera: config.hasCamera.toString(),
          index: index.toString(),
        },
        ...(config.linkedAsset && {
          existingAssetId: config.linkedAsset.id,
          existingAssetCode: config.linkedAsset.assetCode,
          existingAssetName: config.linkedAsset.assetName,
        }),
      });
    });

    // Keyboard plan
    if (keyboardTemplate || keyboardLinkedAsset) {
      plans.push({
        equipmentType: 'keyboard',
        createNew: !keyboardLinkedAsset && !isRetroactive,
        requiresSerialNumber: false,
        requiresQRCode: !keyboardLinkedAsset && !isRetroactive,
        status: 'pending',
        brand: keyboardLinkedAsset?.brand || keyboardTemplate?.brand,
        model: keyboardLinkedAsset?.model || keyboardTemplate?.model,
        metadata: {},
        ...(keyboardLinkedAsset && {
          existingAssetId: keyboardLinkedAsset.id,
          existingAssetCode: keyboardLinkedAsset.assetCode,
          existingAssetName: keyboardLinkedAsset.assetName,
        }),
      });
    }

    // Mouse plan
    if (mouseTemplate || mouseLinkedAsset) {
      plans.push({
        equipmentType: 'mouse',
        createNew: !mouseLinkedAsset && !isRetroactive,
        requiresSerialNumber: false,
        requiresQRCode: !mouseLinkedAsset && !isRetroactive,
        status: 'pending',
        brand: mouseLinkedAsset?.brand || mouseTemplate?.brand,
        model: mouseLinkedAsset?.model || mouseTemplate?.model,
        metadata: {},
        ...(mouseLinkedAsset && {
          existingAssetId: mouseLinkedAsset.id,
          existingAssetCode: mouseLinkedAsset.assetCode,
          existingAssetName: mouseLinkedAsset.assetName,
        }),
      });
    }

    return plans;
  };

  const handleSave = async () => {
    const assetPlans = buildAssetPlans();

    if (isEditMode && workplace) {
      const updateData: UpdateRolloutWorkplace = {
        userName,
        userEmail: userEmail || null,
        location: location || null,
        serviceId: serviceId || null,
        isLaptopSetup: computerType === 'laptop',
        assetPlans,
        status: workplace.status,
        notes: workplace.notes || null,
      };
      await updateMutation.mutateAsync({ workplaceId: workplace.id, data: updateData });
    } else {
      const createData: CreateRolloutWorkplace = {
        rolloutDayId: dayId,
        userName,
        userEmail: userEmail || undefined,
        location: location || undefined,
        serviceId,
        isLaptopSetup: computerType === 'laptop',
        assetPlans,
      };
      await createMutation.mutateAsync({ dayId, data: createData });
    }

    handleClose();
  };

  const handleClose = () => {
    onClose();
  };

  const isFormValid = userName.trim() && newComputerSerial.trim();

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const sectionIconSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 1.5,
    bgcolor: isDark ? 'rgba(255, 146, 51, 0.12)' : 'rgba(255, 119, 0, 0.08)',
    color: 'primary.main',
    transition: 'all 0.3s ease',
    '& .MuiSvgIcon-root': { fontSize: '1.1rem' },
  };

  const accordionSx = {
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: '12px !important',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&::before': { display: 'none' },
    '&.Mui-expanded': {
      borderColor: 'primary.main',
      boxShadow: isDark
        ? '0 4px 16px rgba(255, 146, 51, 0.1)'
        : '0 4px 16px rgba(255, 119, 0, 0.12)',
    },
  };

  const monitorCardSx = {
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 3,
    p: 2.5,
    bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
    transition: 'all 0.25s ease',
    '&:hover': {
      borderColor: 'primary.light',
      bgcolor: isDark ? 'rgba(255, 146, 51, 0.04)' : 'rgba(255, 119, 0, 0.03)',
    },
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableRestoreFocus
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
        },
      }}
    >
      {/* Styled header with gradient accent */}
      <Box
        sx={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(255, 146, 51, 0.15), rgba(204, 0, 0, 0.08))'
            : 'linear-gradient(135deg, rgba(255, 119, 0, 0.08), rgba(255, 146, 51, 0.04))',
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: 3,
          py: 2.5,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 2,
              background: isDark
                ? 'linear-gradient(145deg, #FF9233, #FF7700)'
                : 'linear-gradient(145deg, #FF9233, #FF7700)',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(255, 119, 0, 0.3)',
            }}
          >
            <ComputerIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              {isEditMode ? 'Werkplek Bewerken' : 'Nieuwe Werkplek'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isEditMode ? 'Pas de werkplekconfiguratie aan' : 'Configureer een nieuwe werkplek'}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Retroactive registration toggle */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 2,
              borderRadius: 3,
              border: '1px solid',
              borderColor: isRetroactive ? 'warning.main' : 'divider',
              bgcolor: isRetroactive
                ? (isDark ? 'rgba(255, 152, 0, 0.08)' : 'rgba(255, 152, 0, 0.04)')
                : 'transparent',
              transition: 'all 0.3s ease',
            }}
          >
            <HistoryIcon sx={{ color: isRetroactive ? 'warning.main' : 'text.secondary', fontSize: '1.3rem' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                Retroactieve registratie
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Link bestaande assets (scan QR-code) — geen nieuwe assets of QR-codes aanmaken
              </Typography>
            </Box>
            <Switch
              checked={isRetroactive}
              onChange={(e) => setIsRetroactive(e.target.checked)}
              color="warning"
              size="small"
            />
          </Box>

          {/* Section 1: User Information */}
          <Accordion defaultExpanded sx={accordionSx}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ '&.Mui-expanded': { minHeight: 48 } }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={sectionIconSx}><PersonIcon /></Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Gebruiker Informatie
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Autocomplete
                  freeSolo
                  open={userDropdownOpen}
                  onOpen={() => {
                    if (userName.length >= 2) setUserDropdownOpen(true);
                  }}
                  onClose={() => setUserDropdownOpen(false)}
                  options={userOptions}
                  getOptionLabel={(option) =>
                    typeof option === 'string' ? option : option.displayName || ''
                  }
                  filterOptions={(x) => x}
                  inputValue={userName}
                  onInputChange={(_, value, reason) => {
                    setUserName(value);
                    if (reason === 'input') {
                      handleUserSearch(value);
                      if (value.length >= 2) {
                        setUserDropdownOpen(true);
                      } else {
                        setUserDropdownOpen(false);
                      }
                    }
                  }}
                  onChange={(_, value) => {
                    setUserDropdownOpen(false);
                    if (value && typeof value !== 'string') {
                      setUserName(value.displayName || '');
                      const upn = value.mail || value.userPrincipalName || '';
                      setUserEmail(upn);
                      if (value.officeLocation) setLocation(value.officeLocation);
                      // Fetch Intune devices for this user
                      if (upn) {
                        intuneApi.getDevicesByUser(upn)
                          .then(devices => setUserDevices(devices))
                          .catch(() => setUserDevices([]));
                      }
                    }
                  }}
                  loading={userSearchLoading}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {option.displayName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.mail || option.userPrincipalName}
                          {option.department ? ` — ${option.department}` : ''}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Gebruikersnaam"
                      required
                      fullWidth
                      helperText="Typ minimaal 2 letters om gebruikers te zoeken"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {userSearchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
                <TextField
                  label="E-mailadres"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  fullWidth
                  helperText="Optioneel"
                />
                <TextField
                  label="Locatie"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  fullWidth
                  helperText="Bijv. 'Gebouw A - 2e verdieping - Kamer 205'"
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Section 2: Computer (Laptop/Desktop) */}
          <Accordion sx={accordionSx}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ '&.Mui-expanded': { minHeight: 48 } }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={sectionIconSx}><ComputerIcon /></Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Computer (Laptop/Desktop)
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Type computer
                  </Typography>
                  <ToggleButtonGroup
                    value={computerType}
                    exclusive
                    onChange={(_, value) => value && setComputerType(value)}
                    fullWidth
                    sx={{
                      '& .MuiToggleButton-root': {
                        borderRadius: 2,
                        py: 1.2,
                        fontWeight: 600,
                        '&.Mui-selected': {
                          bgcolor: isDark ? 'rgba(255, 146, 51, 0.15)' : 'rgba(255, 119, 0, 0.1)',
                          color: 'primary.main',
                          borderColor: 'primary.main',
                          '&:hover': {
                            bgcolor: isDark ? 'rgba(255, 146, 51, 0.2)' : 'rgba(255, 119, 0, 0.15)',
                          },
                        },
                      },
                    }}
                  >
                    <ToggleButton value="laptop">
                      <LaptopIcon sx={{ mr: 1 }} />
                      Laptop
                    </ToggleButton>
                    <ToggleButton value="desktop">
                      <DesktopWindowsIcon sx={{ mr: 1 }} />
                      Desktop
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                {/* Oud apparaat subsection */}
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255, 146, 51, 0.2)' : 'rgba(255, 119, 0, 0.15)',
                    borderRadius: 3,
                    p: 2.5,
                    bgcolor: isDark ? 'rgba(255, 146, 51, 0.04)' : 'rgba(255, 119, 0, 0.02)',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'warning.main',
                      }}
                    />
                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
                      Huidig Apparaat (oud)
                    </Typography>
                  </Stack>

                  {userDevices.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Intune-apparaten van deze gebruiker — klik om te selecteren
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {userDevices.map((device) => {
                          const isSelected = oldComputerSerial === device.serialNumber;
                          return (
                            <Chip
                              key={device.id || device.serialNumber}
                              icon={<LaptopIcon sx={{ fontSize: '0.9rem !important' }} />}
                              label={
                                <Box component="span">
                                  <Box component="span" sx={{ fontWeight: 700 }}>{device.serialNumber || '?'}</Box>
                                  <Box component="span" sx={{ opacity: 0.7 }}> — {device.deviceName || ''}</Box>
                                </Box>
                              }
                              size="small"
                              onClick={() => setOldComputerSerial(device.serialNumber || '')}
                              sx={{
                                cursor: 'pointer',
                                fontWeight: 500,
                                borderWidth: isSelected ? 2 : 1,
                                borderStyle: 'solid',
                                borderColor: isSelected ? '#FF7700' : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'),
                                bgcolor: isSelected
                                  ? (isDark ? 'rgba(255, 119, 0, 0.15)' : 'rgba(255, 119, 0, 0.08)')
                                  : 'transparent',
                                color: isSelected ? '#FF7700' : 'text.primary',
                                '&:hover': {
                                  bgcolor: isDark ? 'rgba(255, 119, 0, 0.12)' : 'rgba(255, 119, 0, 0.06)',
                                  borderColor: '#FF7700',
                                },
                                transition: 'all 0.2s ease',
                              }}
                            />
                          );
                        })}
                      </Stack>
                    </Box>
                  )}

                  <SerialSearchField
                    label="Oude Computer Serienummer"
                    value={oldComputerSerial}
                    onChange={setOldComputerSerial}
                    onAssetFound={setOldComputerAsset}
                    helperText={userDevices.length > 0
                      ? 'Geselecteerd via Intune of zoek handmatig'
                      : 'Zoek bestaand asset dat wordt vervangen'
                    }
                  />
                  <LinkedAssetChip workplace={workplace} equipmentType={computerType} variant="old" />
                </Box>

                {/* Nieuw apparaat subsection */}
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(76, 175, 80, 0.25)' : 'rgba(76, 175, 80, 0.2)',
                    borderRadius: 3,
                    p: 2.5,
                    bgcolor: isDark ? 'rgba(76, 175, 80, 0.04)' : 'rgba(76, 175, 80, 0.02)',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'success.main',
                      }}
                    />
                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
                      Nieuw Apparaat
                    </Typography>
                  </Stack>

                  <SerialSearchField
                    label="Nieuwe Computer Serienummer"
                    value={newComputerSerial}
                    onChange={setNewComputerSerial}
                    onAssetFound={setNewComputerAsset}
                    onCreate={(serial) => {
                      setNewComputerSerial(serial);
                      setNewComputerAsset(null);
                    }}
                    required
                    helperText="Zoek bestaand asset of maak nieuw aan"
                  />
                  <LinkedAssetChip workplace={workplace} equipmentType={computerType} />
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Section 3: Docking Station */}
          <Accordion sx={accordionSx}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ '&.Mui-expanded': { minHeight: 48 } }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={sectionIconSx}><DockIcon /></Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Docking Station
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {isRetroactive ? (
                  <AssetCodeSearchField
                    label="AssetCode docking station"
                    value={dockingAssetCode}
                    onChange={setDockingAssetCode}
                    onAssetLinked={setDockingLinkedAsset}
                    linkedAsset={dockingLinkedAsset}
                    helperText="Scan of typ de assetcode van het bestaande docking station"
                  />
                ) : (
                  <>
                    <TemplateSelector
                      equipmentType="docking"
                      value={dockingTemplate}
                      onChange={setDockingTemplate}
                      required
                    />
                    <TextField
                      label="Serienummer"
                      value={dockingSerial}
                      onChange={(e) => setDockingSerial(e.target.value)}
                      required
                      fullWidth
                      helperText="Serienummer van het docking station"
                    />
                  </>
                )}
                <LinkedAssetChip workplace={workplace} equipmentType="docking" />
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Section 4: Monitors */}
          <Accordion sx={accordionSx}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ '&.Mui-expanded': { minHeight: 48 } }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={sectionIconSx}><MonitorIcon /></Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Monitors
                </Typography>
                <Chip
                  label={monitorCount}
                  size="small"
                  color="primary"
                  sx={{ ml: 0.5, fontWeight: 700, minWidth: 28, height: 24 }}
                />
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ px: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Aantal monitors
                  </Typography>
                  <Slider
                    value={monitorCount}
                    min={1}
                    max={3}
                    marks={[
                      { value: 1, label: '1' },
                      { value: 2, label: '2' },
                      { value: 3, label: '3' },
                    ]}
                    step={1}
                    valueLabelDisplay="auto"
                    onChange={handleMonitorCountChange}
                  />
                </Box>

                {monitorConfigs.map((config, index) => (
                  <Box key={index} sx={monitorCardSx}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <MonitorIcon sx={{ color: 'primary.main', fontSize: '1.1rem' }} />
                      <Typography variant="subtitle2" fontWeight={600}>
                        Monitor {index + 1}
                      </Typography>
                    </Stack>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {isRetroactive ? (
                        <AssetCodeSearchField
                          label={`AssetCode monitor ${index + 1}`}
                          value={config.assetCode || ''}
                          onChange={(v) => updateMonitorConfig(index, 'assetCode', v)}
                          onAssetLinked={(asset) => updateMonitorConfig(index, 'linkedAsset', asset)}
                          linkedAsset={config.linkedAsset}
                          helperText="Scan of typ de assetcode van de bestaande monitor"
                        />
                      ) : (
                        <TemplateSelector
                          equipmentType="monitor"
                          value={config.template}
                          onChange={(template) => updateMonitorConfig(index, 'template', template)}
                        />
                      )}

                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Positie
                        </Typography>
                        <ToggleButtonGroup
                          value={config.position}
                          exclusive
                          onChange={(_, value) => value && updateMonitorConfig(index, 'position', value)}
                          fullWidth
                          size="small"
                          sx={{
                            '& .MuiToggleButton-root': {
                              borderRadius: 1.5,
                              '&.Mui-selected': {
                                bgcolor: isDark ? 'rgba(255, 146, 51, 0.15)' : 'rgba(255, 119, 0, 0.1)',
                                color: 'primary.main',
                                borderColor: 'primary.main',
                              },
                            },
                          }}
                        >
                          <ToggleButton value="left">Links</ToggleButton>
                          <ToggleButton value="center">Midden</ToggleButton>
                          <ToggleButton value="right">Rechts</ToggleButton>
                        </ToggleButtonGroup>
                      </Box>

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={config.hasCamera}
                            onChange={(e) => updateMonitorConfig(index, 'hasCamera', e.target.checked)}
                            sx={{
                              '&.Mui-checked': { color: 'primary.main' },
                            }}
                          />
                        }
                        label={
                          <Typography variant="body2">Heeft camera</Typography>
                        }
                      />
                      <LinkedAssetChip workplace={workplace} equipmentType="monitor" index={index} />
                    </Box>
                  </Box>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Section 5: Keyboard & Mouse */}
          <Accordion sx={accordionSx}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ '&.Mui-expanded': { minHeight: 48 } }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={sectionIconSx}><KeyboardIcon /></Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Toetsenbord &amp; Muis
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {isRetroactive ? (
                  <AssetCodeSearchField
                    label="AssetCode toetsenbord"
                    value={keyboardAssetCode}
                    onChange={setKeyboardAssetCode}
                    onAssetLinked={setKeyboardLinkedAsset}
                    linkedAsset={keyboardLinkedAsset}
                    helperText="Scan of typ de assetcode van het bestaande toetsenbord"
                  />
                ) : (
                  <TemplateSelector
                    equipmentType="keyboard"
                    value={keyboardTemplate}
                    onChange={setKeyboardTemplate}
                  />
                )}
                <LinkedAssetChip workplace={workplace} equipmentType="keyboard" />

                {isRetroactive ? (
                  <AssetCodeSearchField
                    label="AssetCode muis"
                    value={mouseAssetCode}
                    onChange={setMouseAssetCode}
                    onAssetLinked={setMouseLinkedAsset}
                    linkedAsset={mouseLinkedAsset}
                    helperText="Scan of typ de assetcode van de bestaande muis"
                  />
                ) : (
                  <TemplateSelector
                    equipmentType="mouse"
                    value={mouseTemplate}
                    onChange={setMouseTemplate}
                  />
                )}
                <LinkedAssetChip workplace={workplace} equipmentType="mouse" />
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      </DialogContent>

      {/* Styled actions with separator */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
          gap: 1,
        }}
      >
        <Button onClick={handleClose} variant="outlined" sx={{ px: 3 }}>
          Annuleren
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!isFormValid || createMutation.isPending || updateMutation.isPending}
          sx={{ px: 4 }}
        >
          {createMutation.isPending || updateMutation.isPending ? 'Opslaan...' : 'Opslaan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RolloutWorkplaceDialog;

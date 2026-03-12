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
import VideocamIcon from '@mui/icons-material/Videocam';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
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
}

// Helper to generate asset code preview with Nov/Dec rule
const generateAssetCodePreview = (template: AssetTemplate | null, equipmentType: string): string => {
  if (!template?.brand) return '';

  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  // Apply Nov/Dec rule: if month >= 11, use next year
  const displayYear = month >= 11 ? year + 1 : year;
  const yearCode = displayYear.toString().slice(-2);

  const typePrefix = equipmentType === 'monitor' ? 'MON' : equipmentType === 'keyboard' ? 'KEY' : 'MOU';
  const brand = template.brand.toUpperCase();

  return `${typePrefix}-${yearCode}-${brand}-?????`;
};

// Visual monitor layout diagram component
const MonitorLayoutDiagram = ({ configs, selectedIndex }: {
  configs: MonitorConfig[];
  selectedIndex: number;
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const renderMonitor = (config: MonitorConfig, index: number, position: 'left' | 'center' | 'right') => {
    const isSelected = index === selectedIndex;
    const monitorExists = configs.length > index;

    if (!monitorExists) {
      return (
        <Box
          key={position}
          sx={{
            width: 60,
            height: 40,
            borderRadius: 1,
            border: '2px dashed',
            borderColor: 'divider',
            opacity: 0.3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MonitorIcon sx={{ fontSize: '1rem', color: 'text.disabled' }} />
        </Box>
      );
    }

    return (
      <Box
        key={position}
        sx={{
          position: 'relative',
          width: 60,
          height: 40,
          borderRadius: 1,
          border: '2px solid',
          borderColor: isSelected ? 'primary.main' : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)'),
          bgcolor: isSelected ? (isDark ? 'rgba(255, 146, 51, 0.15)' : 'rgba(255, 119, 0, 0.1)') : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.25s ease',
          boxShadow: isSelected ? (isDark ? '0 0 12px rgba(255, 146, 51, 0.3)' : '0 0 12px rgba(255, 119, 0, 0.2)') : 'none',
        }}
      >
        <MonitorIcon sx={{ fontSize: '1.5rem', color: isSelected ? 'primary.main' : 'text.secondary' }} />
        {config.hasCamera && (
          <VideocamIcon
            sx={{
              position: 'absolute',
              top: 2,
              right: 2,
              fontSize: '0.8rem',
              color: 'primary.main',
              bgcolor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.9)',
              borderRadius: '50%',
              p: 0.25,
            }}
          />
        )}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        p: 2,
        borderRadius: 2,
        bgcolor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Monitors */}
      <Stack direction="row" spacing={1.5} alignItems="flex-end">
        {renderMonitor(configs[0], 0, 'left')}
        {renderMonitor(configs[1], 1, 'center')}
        {renderMonitor(configs[2], 2, 'right')}
      </Stack>

      {/* Desk representation */}
      <Box
        sx={{
          width: '100%',
          height: 4,
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
          borderRadius: 1,
          mt: 0.5,
        }}
      />

      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        Bureaublad weergave
      </Typography>
    </Box>
  );
};

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
  const [laptopTemplate, setLaptopTemplate] = useState<AssetTemplate | null>(null);

  // Docking state
  const [dockingTemplate, setDockingTemplate] = useState<AssetTemplate | null>(null);
  const [dockingSerial, setDockingSerial] = useState('');

  // Monitors state
  const [monitorCount, setMonitorCount] = useState(2);
  const [monitorConfigs, setMonitorConfigs] = useState<MonitorConfig[]>([
    { position: 'left', hasCamera: false, template: null },
    { position: 'right', hasCamera: false, template: null },
  ]);
  const [hoveredMonitorIndex, setHoveredMonitorIndex] = useState<number | null>(null);

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

  // Separate state for monitor asset codes to prevent focus loss during typing
  const [monitorAssetCodes, setMonitorAssetCodes] = useState<string[]>(['', '']);
  const [monitorLinkedAssets, setMonitorLinkedAssets] = useState<(Asset | null)[]>([null, null]);

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

    // Reset user search state
    setUserDevices([]);
    setUserOptions([]);

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

    // Fetch Intune devices for this user if email is available
    if (workplace!.userEmail) {
      intuneApi.getDevicesByUser(workplace!.userEmail)
        .then(devices => setUserDevices(devices))
        .catch(() => setUserDevices([]));
    }

    const plans = workplace!.assetPlans || [];

    const computerPlan = plans.find(p => p.equipmentType === 'laptop' || p.equipmentType === 'desktop');
    if (computerPlan) {
      setComputerType(computerPlan.equipmentType as 'laptop' | 'desktop');
      setNewComputerSerial(computerPlan.metadata?.serialNumber || '');
      // Restore laptop template if available
      if (computerPlan.equipmentType === 'laptop' && computerPlan.brand) {
        setLaptopTemplate(findTpl(computerPlan.brand, computerPlan.model));
      } else {
        setLaptopTemplate(null);
      }
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
      })));
      setMonitorAssetCodes(monitorPlans.map(p => p.existingAssetCode || ''));
      setMonitorLinkedAssets(monitorPlans.map(p =>
        p.existingAssetId ? { id: p.existingAssetId, assetCode: p.existingAssetCode || '', assetName: p.existingAssetName || '' } as Asset : null
      ));
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
    setUserDevices([]);
    setUserOptions([]);
    setComputerType('laptop');
    setOldComputerSerial('');
    setOldComputerAsset(null);
    setNewComputerSerial('');
    setNewComputerAsset(null);
    setLaptopTemplate(null);
    setDockingTemplate(null);
    setDockingSerial('');
    setMonitorCount(2);
    setMonitorConfigs([
      { position: 'left', hasCamera: false, template: null },
      { position: 'right', hasCamera: false, template: null },
    ]);
    setMonitorAssetCodes(['', '']);
    setMonitorLinkedAssets([null, null]);
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

    // Adjust asset code arrays
    const newCodes = Array.from({ length: count }, (_, i) => monitorAssetCodes[i] || '');
    const newLinked = Array.from({ length: count }, (_, i) => monitorLinkedAssets[i] || null);
    setMonitorAssetCodes(newCodes);
    setMonitorLinkedAssets(newLinked);
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
      // Include laptop template info if selected (for laptops only)
      ...(computerType === 'laptop' && laptopTemplate && {
        brand: laptopTemplate.brand,
        model: laptopTemplate.model,
      }),
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

    // Docking plan (only for laptops, not desktops)
    if (computerType !== 'desktop' && (dockingTemplate || dockingSerial || dockingLinkedAsset)) {
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
      const linked = monitorLinkedAssets[index];
      const hasBrand = !!(linked?.brand || config.template?.brand);
      // Only create new asset if brand is known (no XXXX codes allowed for monitors)
      const canCreateNew = !linked && !isRetroactive && hasBrand;
      plans.push({
        equipmentType: 'monitor',
        createNew: canCreateNew,
        requiresSerialNumber: false,
        requiresQRCode: canCreateNew,
        status: 'pending',
        brand: linked?.brand || config.template?.brand,
        model: linked?.model || config.template?.model,
        metadata: {
          position: config.position,
          hasCamera: config.hasCamera.toString(),
          index: index.toString(),
          brandPending: (!hasBrand && !linked).toString(), // Flag to indicate brand needs to be set at execution
        },
        ...(linked && {
          existingAssetId: linked.id,
          existingAssetCode: linked.assetCode,
          existingAssetName: linked.assetName,
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

  // Validate that templates are selected when creating new assets (to prevent XXXX codes)
  const computerNeedsTemplate = !newComputerAsset && computerType === 'laptop' && !laptopTemplate;
  const dockingNeedsTemplate = computerType !== 'desktop' && !dockingLinkedAsset && !isRetroactive && !dockingTemplate;
  const monitorsNeedTemplate = !isRetroactive && monitorConfigs.some((config, idx) => !monitorLinkedAssets[idx] && !config.template);
  const keyboardNeedsTemplate = !keyboardLinkedAsset && !isRetroactive && !keyboardTemplate;
  const mouseNeedsTemplate = !mouseLinkedAsset && !isRetroactive && !mouseTemplate;

  const hasTemplateErrors = computerNeedsTemplate || dockingNeedsTemplate || monitorsNeedTemplate || keyboardNeedsTemplate || mouseNeedsTemplate;
  const isFormValid = userName.trim() && newComputerSerial.trim() && !hasTemplateErrors;

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const sectionIconSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 1,
    bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    color: 'text.primary',
    '& .MuiSvgIcon-root': { fontSize: '1rem' },
  };

  const accordionSx = {
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: '8px !important',
    overflow: 'hidden',
    '&::before': { display: 'none' },
    '&.Mui-expanded': {
      borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
    },
  };

  const monitorCardSx = {
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 2,
    p: 2,
    bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
    transition: 'all 0.2s ease',
    '&:hover': {
      borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
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
            <ComputerIcon sx={{ fontSize: '1.2rem' }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={600}>
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

                  {/* Laptop template selector - only for laptops */}
                  {computerType === 'laptop' && (
                    <Box sx={{ mb: 2 }}>
                      <TemplateSelector
                        equipmentType="laptop"
                        value={laptopTemplate}
                        onChange={setLaptopTemplate}
                        label="Laptop type"
                        error={computerNeedsTemplate}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        Bijv. PRO 16, PRO MAX — helpt bij het toewijzen van het juiste model
                      </Typography>
                    </Box>
                  )}

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

          {/* Section 3: Docking Station (only for laptops) */}
          {computerType !== 'desktop' && <Accordion sx={accordionSx}>
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
                      error={dockingNeedsTemplate}
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
          </Accordion>}

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
                {/* Monitor count slider */}
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

                {/* Visual layout diagram */}
                <MonitorLayoutDiagram
                  configs={monitorConfigs}
                  selectedIndex={hoveredMonitorIndex ?? 0}
                />

                {/* Monitor configuration cards */}
                {monitorConfigs.map((config, index) => {
                  const assetCodePreview = generateAssetCodePreview(config.template ?? null, 'monitor');
                  const positionLabels = { left: 'Links', center: 'Midden', right: 'Rechts' };

                  return (
                    <Box
                      key={index}
                      sx={{
                        ...monitorCardSx,
                        borderColor: hoveredMonitorIndex === index ? 'primary.main' : 'divider',
                      }}
                      onMouseEnter={() => setHoveredMonitorIndex(index)}
                      onMouseLeave={() => setHoveredMonitorIndex(null)}
                    >
                      {/* Monitor card header */}
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 36,
                            height: 36,
                            borderRadius: 1.5,
                            bgcolor: isDark ? 'rgba(255, 146, 51, 0.1)' : 'rgba(255, 119, 0, 0.08)',
                            color: 'primary.main',
                          }}
                        >
                          <MonitorIcon sx={{ fontSize: '1.2rem' }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" fontWeight={700}>
                            Monitor {index + 1}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              label={positionLabels[config.position]}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                color: 'text.primary',
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            />
                            {config.hasCamera && (
                              <Chip
                                icon={<VideocamIcon sx={{ fontSize: '0.7rem !important', color: 'text.secondary' }} />}
                                label="Camera"
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                  color: 'text.primary',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                }}
                              />
                            )}
                          </Stack>
                        </Box>
                      </Stack>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {isRetroactive ? (
                          <AssetCodeSearchField
                            label={`AssetCode monitor ${index + 1}`}
                            value={monitorAssetCodes[index] || ''}
                            onChange={(v) => {
                              setMonitorAssetCodes(prev => { const next = [...prev]; next[index] = v; return next; });
                            }}
                            onAssetLinked={(asset) => {
                              setMonitorLinkedAssets(prev => { const next = [...prev]; next[index] = asset; return next; });
                            }}
                            linkedAsset={monitorLinkedAssets[index]}
                            helperText="Scan of typ de assetcode van de bestaande monitor"
                          />
                        ) : (
                          <>
                            <TemplateSelector
                              equipmentType="monitor"
                              value={config.template}
                              onChange={(template) => updateMonitorConfig(index, 'template', template)}
                              error={!monitorLinkedAssets[index] && !config.template}
                            />

                            {/* Asset code preview or brand pending warning */}
                            {config.template ? (
                              <Box
                                sx={{
                                  p: 1.5,
                                  borderRadius: 2,
                                  bgcolor: isDark ? 'rgba(76, 175, 80, 0.08)' : 'rgba(76, 175, 80, 0.05)',
                                  border: '1px solid',
                                  borderColor: isDark ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.2)',
                                }}
                              >
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <InfoOutlinedIcon sx={{ fontSize: '1rem', color: 'success.main' }} />
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                                      Asset code formaat:
                                    </Typography>
                                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace', color: 'success.main' }}>
                                      {assetCodePreview}
                                    </Typography>
                                  </Box>
                                </Stack>
                                {config.template.model && (
                                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                    {config.template.brand} {config.template.model}
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <Alert severity="warning" sx={{ py: 0.5 }}>
                                <Typography variant="caption">
                                  <strong>Let op:</strong> Merk onbekend — bij uitvoering moet het merk gekend zijn voor registratie.
                                </Typography>
                              </Alert>
                            )}
                          </>
                        )}

                        {/* Position selector */}
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Positie op bureau
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
                                fontWeight: 600,
                                py: 1,
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

                        {/* Camera checkbox */}
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: config.hasCamera ? 'info.main' : 'divider',
                            bgcolor: config.hasCamera
                              ? (isDark ? 'rgba(33, 150, 243, 0.08)' : 'rgba(33, 150, 243, 0.05)')
                              : 'transparent',
                            transition: 'all 0.25s ease',
                          }}
                        >
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={config.hasCamera}
                                onChange={(e) => updateMonitorConfig(index, 'hasCamera', e.target.checked)}
                                sx={{
                                  '&.Mui-checked': { color: 'info.main' },
                                }}
                              />
                            }
                            label={
                              <Stack direction="row" spacing={1} alignItems="center">
                                <VideocamIcon sx={{ fontSize: '1rem', color: config.hasCamera ? 'info.main' : 'text.secondary' }} />
                                <Typography variant="body2" fontWeight={config.hasCamera ? 600 : 400}>
                                  Heeft ingebouwde camera
                                </Typography>
                              </Stack>
                            }
                          />
                        </Box>

                        <LinkedAssetChip workplace={workplace} equipmentType="monitor" index={index} />
                      </Box>
                    </Box>
                  );
                })}
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
                    error={keyboardNeedsTemplate}
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
                    error={mouseNeedsTemplate}
                  />
                )}
                <LinkedAssetChip workplace={workplace} equipmentType="mouse" />
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      </DialogContent>

      {/* Template validation warning */}
      {hasTemplateErrors && (
        <Alert severity="warning" sx={{ mx: 3, mb: 0 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Selecteer templates om door te gaan:
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {computerNeedsTemplate && <li>Laptop template</li>}
            {dockingNeedsTemplate && <li>Docking station template</li>}
            {monitorsNeedTemplate && <li>Monitor template(s)</li>}
            {keyboardNeedsTemplate && <li>Toetsenbord template</li>}
            {mouseNeedsTemplate && <li>Muis template</li>}
          </Box>
        </Alert>
      )}

      {/* Styled actions with separator */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          gap: 1,
        }}
      >
        <Button onClick={handleClose} size="small">
          Annuleren
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!isFormValid || createMutation.isPending || updateMutation.isPending}
          size="small"
        >
          {createMutation.isPending || updateMutation.isPending ? 'Opslaan...' : 'Opslaan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RolloutWorkplaceDialog;

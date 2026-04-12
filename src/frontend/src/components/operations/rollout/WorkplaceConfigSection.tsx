/**
 * Unified Workplace Configuration Section
 *
 * Combines "Nieuw Apparaat" and "Update Werkplek Assets" into a single
 * unified configuration interface that shows all planned equipment.
 *
 * Features:
 * - Shows all planned asset items from bulk creation
 * - For each item: link existing asset OR create new
 * - Visual status indicators
 * - QR scanning support
 *
 * Design: Neumorphic soft UI with Djoppie orange accent (#FF7700)
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
  useTheme,
  IconButton,
  Tooltip,
  Collapse,
  TextField,
  InputAdornment,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import LinkIcon from '@mui/icons-material/Link';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InventoryIcon from '@mui/icons-material/Inventory';
import SearchIcon from '@mui/icons-material/Search';
import LaptopIcon from '@mui/icons-material/Laptop';
import ComputerIcon from '@mui/icons-material/Computer';
import DockIcon from '@mui/icons-material/Dock';
import MonitorIcon from '@mui/icons-material/Monitor';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import VideocamIcon from '@mui/icons-material/Videocam';
import PersonIcon from '@mui/icons-material/Person';
import PlaceIcon from '@mui/icons-material/Place';
import type { Asset, AssetTemplate } from '../../../types/asset.types';
import type { EquipmentType, AssetPlanStatus } from '../../../types/rollout';
import { getAssets } from '../../../api/assets.api';
import { EQUIPMENT_LABELS } from '../../../constants/rollout.constants';
import { TemplateSelector } from './TemplateSelector';
import { ASSET_COLOR, SERVICE_COLOR, BUILDING_COLOR } from '../../../constants/filterColors';

// Configuration mode for each item
type ConfigMode = 'link' | 'create';

// Asset configuration item
export interface AssetConfigItem {
  id: string;
  equipmentType: EquipmentType;
  mode: ConfigMode;
  // For linking existing assets
  linkedAsset?: Asset | null;
  // For creating new assets
  template?: AssetTemplate | null;
  brand?: string;
  model?: string;
  serialNumber?: string;
  // Metadata
  metadata?: Record<string, string>;
  // Preserve original status for completed items
  originalStatus?: AssetPlanStatus;
}

// Assignment type: user-assigned (goes to employee) or workplace-fixed (stays at physical workplace)
type AssignmentType = 'user' | 'workplace';

// Equipment types that are assigned to the user (employee takes it with them)
const USER_ASSIGNED_EQUIPMENT: EquipmentType[] = ['laptop', 'desktop'];

// Get assignment type for equipment
const getAssignmentType = (equipmentType: EquipmentType): AssignmentType => {
  return USER_ASSIGNED_EQUIPMENT.includes(equipmentType) ? 'user' : 'workplace';
};

interface WorkplaceConfigSectionProps {
  items: AssetConfigItem[];
  onChange: (items: AssetConfigItem[]) => void;
  onScanRequest: (itemId: string) => void;
  /** Name of the user/employee to assign user-assigned assets to */
  userName?: string;
  /** Name of the physical workplace to assign workplace-fixed assets to */
  physicalWorkplaceName?: string;
}

// Equipment type icons
const EQUIPMENT_ICONS: Record<EquipmentType, React.ReactElement> = {
  laptop: <LaptopIcon />,
  desktop: <ComputerIcon />,
  docking: <DockIcon />,
  monitor: <MonitorIcon />,
  keyboard: <KeyboardIcon />,
  mouse: <MouseIcon />,
};

// Equipment type mapping to asset type/category names for filtering
const EQUIPMENT_TYPE_MAPPING: Record<EquipmentType, string[]> = {
  laptop: ['Laptop', 'laptop', 'LT'],
  desktop: ['Desktop', 'desktop', 'PC', 'DT'],
  docking: ['Docking Station', 'Docking', 'docking', 'DS'],
  monitor: ['Monitor', 'monitor', 'Screen', 'Beeldscherm', 'MO'],
  keyboard: ['Keyboard', 'keyboard', 'Toetsenbord', 'KB'],
  mouse: ['Mouse', 'mouse', 'Muis', 'MS'],
};

// Status badge component
const StatusBadge = ({
  configured,
  mode,
  isDark,
}: {
  configured: boolean;
  mode: ConfigMode;
  isDark: boolean;
}) => {
  if (configured) {
    return (
      <Chip
        icon={<CheckCircleIcon sx={{ fontSize: '0.9rem !important' }} />}
        label={mode === 'link' ? 'Gekoppeld' : 'Geconfigureerd'}
        size="small"
        sx={{
          height: 22,
          fontSize: '0.65rem',
          fontWeight: 700,
          bgcolor: mode === 'link' ? 'rgba(33, 150, 243, 0.15)' : 'rgba(76, 175, 80, 0.15)',
          color: mode === 'link' ? '#2196F3' : '#4CAF50',
          border: 'none',
          '& .MuiChip-icon': {
            color: mode === 'link' ? '#2196F3' : '#4CAF50',
          },
        }}
      />
    );
  }

  return (
    <Chip
      icon={<WarningIcon sx={{ fontSize: '0.9rem !important' }} />}
      label="Niet geconfigureerd"
      size="small"
      sx={{
        height: 22,
        fontSize: '0.65rem',
        fontWeight: 700,
        bgcolor: isDark ? 'rgba(255, 152, 0, 0.15)' : 'rgba(255, 152, 0, 0.1)',
        color: 'warning.main',
        border: 'none',
        '& .MuiChip-icon': {
          color: 'warning.main',
        },
      }}
    />
  );
};

// Assignment badge component - shows where the asset will be assigned
const AssignmentBadge = ({
  assignmentType,
  targetName,
}: {
  assignmentType: AssignmentType;
  targetName?: string;
}) => {
  const isUserAssigned = assignmentType === 'user';
  const isWorkplaceWithoutTarget = !isUserAssigned && !targetName;

  // Determine colors based on assignment state
  const getColors = () => {
    if (isUserAssigned) {
      return {
        bg: 'rgba(156, 39, 176, 0.12)',
        color: '#9c27b0',
        border: 'rgba(156, 39, 176, 0.3)',
      };
    }
    if (isWorkplaceWithoutTarget) {
      // Warning state - no workplace selected
      return {
        bg: 'rgba(255, 152, 0, 0.12)',
        color: BUILDING_COLOR,
        border: 'rgba(255, 152, 0, 0.3)',
      };
    }
    // Normal workplace state
    return {
      bg: 'rgba(0, 150, 136, 0.12)',
      color: SERVICE_COLOR,
      border: 'rgba(0, 150, 136, 0.3)',
    };
  };

  const colors = getColors();

  return (
    <Tooltip
      title={isUserAssigned
        ? `Dit apparaat wordt toegewezen aan de werknemer${targetName ? ` (${targetName})` : ''}`
        : isWorkplaceWithoutTarget
          ? 'Selecteer een fysieke werkplek om dit apparaat toe te wijzen'
          : `Dit apparaat wordt toegewezen aan de fysieke werkplek (${targetName})`
      }
    >
      <Chip
        icon={isUserAssigned
          ? <PersonIcon sx={{ fontSize: '0.85rem !important' }} />
          : <PlaceIcon sx={{ fontSize: '0.85rem !important' }} />
        }
        label={isUserAssigned
          ? (targetName || 'Werknemer')
          : (targetName || 'Geen werkplek')
        }
        size="small"
        sx={{
          height: 20,
          maxWidth: 120,
          fontSize: '0.6rem',
          fontWeight: 600,
          bgcolor: colors.bg,
          color: colors.color,
          border: `1px solid ${colors.border}`,
          '& .MuiChip-icon': {
            color: colors.color,
            marginLeft: '4px',
          },
          '& .MuiChip-label': {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            paddingRight: '6px',
          },
        }}
      />
    </Tooltip>
  );
};

// Single asset config item component
const AssetConfigItemCard = ({
  item,
  onUpdate,
  onRemove,
  onScanRequest,
  availableAssets,
  isLoadingAssets,
  userName,
  physicalWorkplaceName,
}: {
  item: AssetConfigItem;
  onUpdate: (updates: Partial<AssetConfigItem>) => void;
  onRemove: () => void;
  onScanRequest: () => void;
  availableAssets: Asset[];
  isLoadingAssets: boolean;
  userName?: string;
  physicalWorkplaceName?: string;
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Neumorphic colors
  const neuBg = isDark ? '#1e2328' : '#e8eef3';
  const neuShadowDark = isDark ? '#161a1d' : '#c5cad0';
  const neuShadowLight = isDark ? '#262c33' : '#ffffff';

  // Filter assets by equipment type
  const filteredByTypeAssets = useMemo(() => {
    const typeNames = EQUIPMENT_TYPE_MAPPING[item.equipmentType] || [];
    return availableAssets.filter(asset => {
      const assetTypeName = asset.assetType?.name || asset.assetType?.code || asset.category || '';
      return typeNames.some(name =>
        assetTypeName.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(assetTypeName.toLowerCase())
      );
    });
  }, [availableAssets, item.equipmentType]);

  const isConfigured = item.mode === 'link'
    ? !!item.linkedAsset
    : !!(item.template || (item.brand && item.model));

  const hasCamera = item.metadata?.hasCamera === 'true';

  // Determine assignment type for border color
  const assignmentType = getAssignmentType(item.equipmentType);
  const isUserAssigned = assignmentType === 'user';

  // Assignment type colors
  const assignmentBgColor = isUserAssigned
    ? (isDark ? 'rgba(156, 39, 176, 0.08)' : 'rgba(156, 39, 176, 0.06)')
    : (isDark ? 'rgba(0, 150, 136, 0.08)' : 'rgba(0, 150, 136, 0.06)');
  const assignmentBorderColor = isUserAssigned
    ? (isDark ? 'rgba(156, 39, 176, 0.5)' : 'rgba(156, 39, 176, 0.4)')
    : (isDark ? 'rgba(0, 150, 136, 0.5)' : 'rgba(0, 150, 136, 0.4)');
  const assignmentGlow = isUserAssigned
    ? '0 0 12px rgba(156, 39, 176, 0.25)'
    : '0 0 12px rgba(0, 150, 136, 0.25)';

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2.5,
        bgcolor: assignmentBgColor,
        boxShadow: isConfigured
          ? `4px 4px 8px ${neuShadowDark}, -4px -4px 8px ${neuShadowLight}, ${assignmentGlow}`
          : `4px 4px 8px ${neuShadowDark}, -4px -4px 8px ${neuShadowLight}`,
        transition: 'all 0.2s ease',
        // Border based on assignment type
        border: `2px solid ${assignmentBorderColor}`,
        // Left accent border for assignment type (thicker)
        borderLeft: `4px solid ${isUserAssigned ? '#9c27b0' : SERVICE_COLOR}`,
      }}
    >
      {/* Header: Type + Status + Delete */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: neuBg,
              boxShadow: `inset 2px 2px 4px ${neuShadowDark}, inset -2px -2px 4px ${neuShadowLight}`,
              color: ASSET_COLOR,
              '& svg': { fontSize: '1.1rem' },
            }}
          >
            {EQUIPMENT_ICONS[item.equipmentType]}
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: isDark ? '#fff' : '#333' }}>
              {EQUIPMENT_LABELS[item.equipmentType] || item.equipmentType}
              {hasCamera && (
                <VideocamIcon sx={{ fontSize: '0.9rem', ml: 0.5, color: '#2196F3', verticalAlign: 'middle' }} />
              )}
            </Typography>
            {item.template && (
              <Typography variant="caption" color="text.secondary">
                {item.template.brand} {item.template.model}
              </Typography>
            )}
            {item.brand && !item.template && (
              <Typography variant="caption" color="text.secondary">
                {item.brand} {item.model}
              </Typography>
            )}
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={0.75}>
          <AssignmentBadge
            assignmentType={getAssignmentType(item.equipmentType)}
            targetName={getAssignmentType(item.equipmentType) === 'user' ? userName : physicalWorkplaceName}
          />
          <StatusBadge configured={isConfigured} mode={item.mode} isDark={isDark} />
          <Tooltip title="Verwijderen">
            <IconButton
              size="small"
              onClick={onRemove}
              sx={{
                width: 28,
                height: 28,
                bgcolor: neuBg,
                boxShadow: `2px 2px 4px ${neuShadowDark}, -2px -2px 4px ${neuShadowLight}`,
                color: 'error.main',
                '&:hover': {
                  boxShadow: `inset 2px 2px 4px ${neuShadowDark}, inset -2px -2px 4px ${neuShadowLight}`,
                },
              }}
            >
              <DeleteOutlineIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Mode Toggle: Link vs Create */}
      <ToggleButtonGroup
        value={item.mode}
        exclusive
        onChange={(_, newMode) => {
          if (newMode) {
            onUpdate({ mode: newMode, linkedAsset: null });
          }
        }}
        size="small"
        fullWidth
        sx={{
          mb: 2,
          '& .MuiToggleButton-root': {
            flex: 1,
            py: 0.75,
            fontSize: '0.75rem',
            fontWeight: 600,
            borderRadius: '8px !important',
            border: 'none',
            bgcolor: neuBg,
            boxShadow: `inset 2px 2px 4px ${neuShadowDark}, inset -2px -2px 4px ${neuShadowLight}`,
            color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
            '&.Mui-selected': {
              bgcolor: neuBg,
              boxShadow: `4px 4px 8px ${neuShadowDark}, -4px -4px 8px ${neuShadowLight}`,
            },
            '&.Mui-selected[value="link"]': {
              color: '#2196F3',
            },
            '&.Mui-selected[value="create"]': {
              color: '#4CAF50',
            },
          },
        }}
      >
        <ToggleButton value="link">
          <LinkIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
          Koppel bestaand
        </ToggleButton>
        <ToggleButton value="create">
          <AddCircleOutlineIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
          Nieuw aanmaken
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Link Mode: Search existing asset */}
      {item.mode === 'link' && (
        <Box>
          {item.linkedAsset ? (
            <Chip
              icon={<InventoryIcon sx={{ fontSize: '0.9rem !important' }} />}
              label={`${item.linkedAsset.assetCode} — ${item.linkedAsset.serialNumber || 'Geen S/N'} — ${item.linkedAsset.status}${item.linkedAsset.assetName ? ` (${item.linkedAsset.assetName})` : ''}`}
              onDelete={() => onUpdate({ linkedAsset: null })}
              sx={{
                width: '100%',
                justifyContent: 'flex-start',
                height: 36,
                fontSize: '0.8rem',
                fontWeight: 600,
                bgcolor: neuBg,
                color: '#2196F3',
                boxShadow: `2px 2px 4px ${neuShadowDark}, -2px -2px 4px ${neuShadowLight}, 0 0 0 2px rgba(33, 150, 243, 0.3)`,
                '& .MuiChip-icon': { color: '#2196F3' },
                '& .MuiChip-deleteIcon': { color: 'error.main' },
              }}
            />
          ) : (
            <Stack spacing={1.5}>
              <Button
                fullWidth
                size="small"
                startIcon={<QrCodeScannerIcon />}
                onClick={onScanRequest}
                sx={{
                  borderRadius: 2,
                  bgcolor: neuBg,
                  color: ASSET_COLOR,
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  py: 1,
                  boxShadow: `4px 4px 8px ${neuShadowDark}, -4px -4px 8px ${neuShadowLight}`,
                  '&:hover': {
                    boxShadow: `inset 2px 2px 4px ${neuShadowDark}, inset -2px -2px 4px ${neuShadowLight}`,
                  },
                }}
              >
                Scan QR-code
              </Button>
              <Autocomplete
                options={filteredByTypeAssets}
                getOptionLabel={(option) => `${option.assetCode} — ${option.assetName || ''}`}
                loading={isLoadingAssets}
                noOptionsText={`Geen ${EQUIPMENT_LABELS[item.equipmentType] || item.equipmentType} beschikbaar`}
                onChange={(_, asset) => {
                  if (asset) onUpdate({ linkedAsset: asset });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Zoek asset..."
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: neuBg,
                        borderRadius: 2,
                        boxShadow: `inset 2px 2px 4px ${neuShadowDark}, inset -2px -2px 4px ${neuShadowLight}`,
                        '& fieldset': { border: 'none' },
                      },
                    }}
                  />
                )}
              />
            </Stack>
          )}
        </Box>
      )}

      {/* Create Mode: Template or manual entry */}
      {item.mode === 'create' && (
        <Stack spacing={1.5}>
          <TemplateSelector
            equipmentType={item.equipmentType}
            value={item.template || null}
            onChange={(template) => onUpdate({
              template,
              brand: template?.brand || item.brand,
              model: template?.model || item.model,
            })}
            label="Sjabloon (optioneel)"
          />
          <TextField
            size="small"
            label="Serienummer"
            value={item.serialNumber || ''}
            onChange={(e) => onUpdate({ serialNumber: e.target.value })}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: neuBg,
                borderRadius: 2,
                boxShadow: `inset 2px 2px 4px ${neuShadowDark}, inset -2px -2px 4px ${neuShadowLight}`,
                '& fieldset': { border: 'none' },
              },
            }}
          />
        </Stack>
      )}
    </Box>
  );
};

export const WorkplaceConfigSection = ({
  items,
  onChange,
  onScanRequest,
  userName,
  physicalWorkplaceName,
}: WorkplaceConfigSectionProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Neumorphic colors
  const neuBg = isDark ? '#1e2328' : '#e8eef3';
  const neuShadowDark = isDark ? '#161a1d' : '#c5cad0';
  const neuShadowLight = isDark ? '#262c33' : '#ffffff';

  // Available assets (status: Nieuw) for linking
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);

  // Load available assets on mount
  useState(() => {
    setIsLoadingAssets(true);
    getAssets('Nieuw')
      .then(setAvailableAssets)
      .catch(() => setAvailableAssets([]))
      .finally(() => setIsLoadingAssets(false));
  });

  // Equipment type selection for adding new items
  const [showAddMenu, setShowAddMenu] = useState(false);

  const updateItem = useCallback((itemId: string, updates: Partial<AssetConfigItem>) => {
    onChange(items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    ));
  }, [items, onChange]);

  const removeItem = useCallback((itemId: string) => {
    onChange(items.filter(item => item.id !== itemId));
  }, [items, onChange]);

  const addItem = useCallback((equipmentType: EquipmentType) => {
    const newItem: AssetConfigItem = {
      id: `config-${Date.now()}-${Math.random()}`,
      equipmentType,
      mode: 'create',
    };
    onChange([...items, newItem]);
    setShowAddMenu(false);
  }, [items, onChange]);

  // Count configured items
  const configuredCount = items.filter(item =>
    item.mode === 'link' ? !!item.linkedAsset : !!(item.template || (item.brand && item.model))
  ).length;

  // Filter available assets to exclude already linked ones
  const filteredAssets = useMemo(() => {
    const linkedIds = new Set(items.filter(i => i.linkedAsset).map(i => i.linkedAsset!.id));
    return availableAssets.filter(a => !linkedIds.has(a.id));
  }, [availableAssets, items]);

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 3,
        bgcolor: neuBg,
        boxShadow: `8px 8px 16px ${neuShadowDark}, -8px -8px 16px ${neuShadowLight}`,
      }}
    >
      {/* Section Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: neuBg,
              boxShadow: `3px 3px 6px ${neuShadowDark}, -3px -3px 6px ${neuShadowLight}`,
            }}
          >
            <InventoryIcon sx={{ color: ASSET_COLOR, fontSize: '1.2rem' }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: isDark ? '#fff' : '#333' }}>
              Werkplek Configuratie
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {configuredCount} van {items.length} items geconfigureerd
            </Typography>
          </Box>
        </Stack>

        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setShowAddMenu(!showAddMenu)}
          sx={{
            borderRadius: 2,
            bgcolor: neuBg,
            color: ASSET_COLOR,
            fontWeight: 600,
            boxShadow: `3px 3px 6px ${neuShadowDark}, -3px -3px 6px ${neuShadowLight}`,
            '&:hover': {
              boxShadow: `inset 2px 2px 4px ${neuShadowDark}, inset -2px -2px 4px ${neuShadowLight}`,
            },
          }}
        >
          Toevoegen
        </Button>
      </Stack>

      {/* Add Menu */}
      <Collapse in={showAddMenu}>
        <Box
          sx={{
            mb: 2.5,
            p: 2,
            borderRadius: 2,
            bgcolor: neuBg,
            boxShadow: `inset 3px 3px 6px ${neuShadowDark}, inset -3px -3px 6px ${neuShadowLight}`,
          }}
        >
          <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
            Selecteer apparaattype
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {Object.entries(EQUIPMENT_LABELS).map(([type, label]) => (
              <Chip
                key={type}
                icon={EQUIPMENT_ICONS[type as EquipmentType]}
                label={label}
                onClick={() => addItem(type as EquipmentType)}
                sx={{
                  bgcolor: neuBg,
                  boxShadow: `2px 2px 4px ${neuShadowDark}, -2px -2px 4px ${neuShadowLight}`,
                  '&:hover': {
                    boxShadow: `inset 2px 2px 4px ${neuShadowDark}, inset -2px -2px 4px ${neuShadowLight}`,
                  },
                  '& .MuiChip-icon': { color: ASSET_COLOR },
                }}
              />
            ))}
          </Stack>
        </Box>
      </Collapse>

      {/* Asset Config Items */}
      {items.length === 0 ? (
        <Box
          sx={{
            p: 3,
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: neuBg,
            boxShadow: `inset 3px 3px 6px ${neuShadowDark}, inset -3px -3px 6px ${neuShadowLight}`,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Geen apparaten geconfigureerd. Klik op "Toevoegen" om te beginnen.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {items.map((item) => (
            <AssetConfigItemCard
              key={item.id}
              item={item}
              onUpdate={(updates) => updateItem(item.id, updates)}
              onRemove={() => removeItem(item.id)}
              onScanRequest={() => onScanRequest(item.id)}
              availableAssets={filteredAssets}
              isLoadingAssets={isLoadingAssets}
              userName={userName}
              physicalWorkplaceName={physicalWorkplaceName}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default WorkplaceConfigSection;

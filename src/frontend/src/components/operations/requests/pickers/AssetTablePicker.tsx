import { useMemo, useState } from 'react';
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import MonitorIcon from '@mui/icons-material/Monitor';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import CableIcon from '@mui/icons-material/Cable';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { type Asset, AssetStatus } from '../../../../types/asset.types';
import {
  getNeumorph,
  getNeumorphColors,
  getNeumorphInset,
} from '../../../../utils/neumorphicStyles';

const STATUS_META: Record<AssetStatus, { color: string; label: string }> = {
  [AssetStatus.Nieuw]: { color: '#9C27B0', label: 'Nieuw' },
  [AssetStatus.Stock]: { color: '#1976D2', label: 'Stock' },
  [AssetStatus.InGebruik]: { color: '#43A047', label: 'In gebruik' },
  [AssetStatus.Herstelling]: { color: '#F57C00', label: 'Herstelling' },
  [AssetStatus.Defect]: { color: '#E53935', label: 'Defect' },
  [AssetStatus.UitDienst]: { color: '#757575', label: 'Uit dienst' },
};

function pickAssetIcon(typeName?: string) {
  const t = (typeName ?? '').toLowerCase();
  if (t.includes('laptop')) return LaptopMacIcon;
  if (t.includes('monitor')) return MonitorIcon;
  if (t.includes('keyboard') || t.includes('toetsenbord')) return KeyboardIcon;
  if (t.includes('mouse') || t.includes('muis')) return MouseIcon;
  if (t.includes('headset') || t.includes('koptelefoon')) return HeadsetMicIcon;
  if (t.includes('docking') || t.includes('dock')) return CableIcon;
  return DevicesOtherIcon;
}

export interface AssetTablePickerParams {
  options: Asset[];
  value: Asset | null;
  onChange: (asset: Asset | null) => void;
  filterByAssetTypeId?: number;
  allowedStatuses?: AssetStatus[];
  assignedToEmployeeId?: number;
  assignedToWorkplaceId?: number;
}

export interface AssetTablePickerState {
  expanded: boolean;
  setExpanded: (next: boolean) => void;
  search: string;
  setSearch: (next: string) => void;
  filtered: Asset[];
  totalAvailable: number;
  value: Asset | null;
  select: (a: Asset | null) => void;
}

/**
 * Stateful hook driving an inline expanding asset selector.
 * Filtering combines: asset-type, allowed statuses, current assignment,
 * the visible search query, and always includes the currently-selected
 * asset so a re-render can never drop the active value out of view.
 */
export function useAssetTablePicker({
  options,
  value,
  onChange,
  filterByAssetTypeId,
  allowedStatuses,
  assignedToEmployeeId,
  assignedToWorkplaceId,
}: AssetTablePickerParams): AssetTablePickerState {
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = options;
    if (filterByAssetTypeId) {
      list = list.filter((a) => a.assetTypeId === filterByAssetTypeId);
    }
    if (allowedStatuses && allowedStatuses.length > 0) {
      list = list.filter((a) => allowedStatuses.includes(a.status));
    }
    if (assignedToEmployeeId !== undefined || assignedToWorkplaceId !== undefined) {
      list = list.filter(
        (a) =>
          (assignedToEmployeeId !== undefined && a.employeeId === assignedToEmployeeId) ||
          (assignedToWorkplaceId !== undefined &&
            a.physicalWorkplaceId === assignedToWorkplaceId),
      );
    }
    const totalAfterScope = list.length;

    const q = search.trim().toLowerCase();
    if (q.length > 0) {
      list = list.filter((a) =>
        [
          a.assetCode,
          a.assetName,
          a.brand,
          a.model,
          a.serialNumber,
          a.owner,
          a.employee?.displayName,
        ]
          .filter(Boolean)
          .some((s) => (s as string).toLowerCase().includes(q)),
      );
    }

    if (value && !list.some((a) => a.id === value.id)) {
      list = [value, ...list];
    }

    return Object.assign(list, { totalAfterScope });
  }, [
    options,
    filterByAssetTypeId,
    allowedStatuses,
    assignedToEmployeeId,
    assignedToWorkplaceId,
    search,
    value,
  ]);

  return {
    expanded,
    setExpanded,
    search,
    setSearch,
    filtered,
    totalAvailable:
      (filtered as Asset[] & { totalAfterScope: number }).totalAfterScope ?? 0,
    value,
    select: (a) => {
      onChange(a);
      setExpanded(false);
      setSearch('');
    },
  };
}

interface TriggerProps {
  state: AssetTablePickerState;
  label: string;
  disabled?: boolean;
  helperText?: string;
}

/**
 * The inline trigger button — sits in line with the other field controls.
 * Visually mirrors a Select so it doesn't break the row's rhythm.
 */
export function AssetTablePickerTrigger({
  state,
  label,
  disabled,
  helperText,
}: TriggerProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const accent = '#1976D2';
  const { value, expanded, setExpanded } = state;

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        component="button"
        type="button"
        onClick={() => !disabled && setExpanded(!expanded)}
        disabled={disabled}
        sx={{
          width: '100%',
          minHeight: 40,
          px: 1.5,
          borderRadius: 1,
          border: '1px solid',
          borderColor: expanded
            ? accent
            : isDark
              ? 'rgba(255,255,255,0.15)'
              : 'rgba(0,0,0,0.2)',
          bgcolor: 'transparent',
          color: 'text.primary',
          fontFamily: 'inherit',
          fontSize: '0.85rem',
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.15s ease',
          position: 'relative',
          boxShadow: expanded ? `0 0 0 3px ${alpha(accent, 0.15)}` : 'none',
          '&:hover': disabled
            ? undefined
            : {
                borderColor: accent,
              },
        }}
      >
        {/* Floating label */}
        <Typography
          component="span"
          sx={{
            position: 'absolute',
            top: -8,
            left: 8,
            px: 0.5,
            fontSize: '0.7rem',
            fontWeight: 500,
            color: expanded ? accent : 'text.secondary',
            bgcolor: getNeumorphColors(isDark).bgSurface,
            transition: 'color 0.15s ease',
            pointerEvents: 'none',
            lineHeight: 1,
          }}
        >
          {label}
        </Typography>

        {/* Selection display */}
        <Box sx={{ flex: 1, minWidth: 0, py: 0.5 }}>
          {value ? (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  fontFamily:
                    '"SF Mono", "Roboto Mono", "Cascadia Code", Consolas, monospace',
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {value.assetCode}
              </Typography>
              {value.assetName && (
                <Typography
                  sx={{
                    fontSize: '0.72rem',
                    color: 'text.secondary',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    minWidth: 0,
                  }}
                >
                  · {value.assetName}
                </Typography>
              )}
            </Stack>
          ) : (
            <Typography
              sx={{ color: 'text.secondary', fontStyle: 'italic', fontSize: '0.8rem' }}
            >
              Selecteer asset…
            </Typography>
          )}
        </Box>

        <KeyboardArrowDownIcon
          sx={{
            fontSize: 20,
            color: 'text.secondary',
            transition: 'transform 0.2s ease',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        />
      </Stack>

      {helperText && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 0.5,
            color: 'text.secondary',
            fontSize: '0.68rem',
          }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
}

interface PanelProps {
  state: AssetTablePickerState;
  /** Optional copy shown above the table when no rows match filters. */
  emptyMessage?: string;
  /** Optional copy shown above the table when no rows match the search. */
  noSearchResultsMessage?: string;
}

/**
 * The expanding panel rendered below the line row. Designed to be placed
 * inside an AssetLineRow's `bottomPanel` slot so the visual surface matches
 * the parent neumorphic card.
 */
export function AssetTablePickerPanel({
  state,
  emptyMessage = 'Geen assets beschikbaar voor deze selectie.',
  noSearchResultsMessage = 'Geen resultaten voor deze zoekterm.',
}: PanelProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const accent = '#1976D2';
  const { expanded, search, setSearch, filtered, totalAvailable, value, select } = state;
  const hasResults = filtered.length > 0;

  return (
    <Collapse in={expanded} unmountOnExit>
      <Box
        sx={{
          mt: 1.5,
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: getNeumorphInset(isDark),
          border: '1px solid',
          borderColor: alpha(accent, isDark ? 0.25 : 0.15),
        }}
      >
        {/* Search bar */}
        <Box
          sx={{
            px: 1.5,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: alpha(accent, isDark ? 0.08 : 0.04),
          }}
        >
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op code, naam, serienummer of eigenaar…"
            size="small"
            fullWidth
            autoFocus={expanded}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')}>
                    <ClearIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
              sx: { fontSize: '0.82rem' },
            }}
          />
          <Chip
            size="small"
            label={`${filtered.length}${
              search && totalAvailable !== filtered.length ? ` / ${totalAvailable}` : ''
            }`}
            variant="outlined"
            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
          />
        </Box>

        {/* Table */}
        {hasResults ? (
          <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="none" sx={tableHeadCellSx} />
                  <TableCell sx={tableHeadCellSx}>Code</TableCell>
                  <TableCell sx={tableHeadCellSx}>Naam · merk / model</TableCell>
                  <TableCell sx={tableHeadCellSx}>Serienummer</TableCell>
                  <TableCell sx={tableHeadCellSx}>Eigenaar</TableCell>
                  <TableCell sx={tableHeadCellSx}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((asset) => {
                  const Icon = pickAssetIcon(asset.assetType?.name);
                  const meta = STATUS_META[asset.status];
                  const isSelected = value?.id === asset.id;
                  const ownerName =
                    asset.employee?.displayName ?? asset.owner ?? null;
                  const brandModel = [asset.brand, asset.model]
                    .filter(Boolean)
                    .join(' ');
                  return (
                    <TableRow
                      key={asset.id}
                      hover
                      onClick={() => select(asset)}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: isSelected
                          ? alpha(accent, isDark ? 0.16 : 0.08)
                          : undefined,
                        '&:hover': {
                          bgcolor: alpha(accent, isDark ? 0.12 : 0.06),
                        },
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <TableCell padding="checkbox" sx={tableBodyCellSx}>
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(meta.color, isDark ? 0.18 : 0.12),
                            color: meta.color,
                            ml: 1,
                          }}
                        >
                          <Icon sx={{ fontSize: 16 }} />
                        </Box>
                      </TableCell>
                      <TableCell sx={tableBodyCellSx}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          {isSelected && (
                            <CheckCircleIcon
                              sx={{ fontSize: 14, color: accent }}
                            />
                          )}
                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              fontFamily:
                                '"SF Mono", "Roboto Mono", "Cascadia Code", Consolas, monospace',
                              letterSpacing: '0.02em',
                            }}
                          >
                            {asset.assetCode}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={tableBodyCellSx}>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 500 }}>
                          {asset.assetName || '—'}
                        </Typography>
                        {brandModel && (
                          <Typography
                            sx={{
                              fontSize: '0.7rem',
                              color: 'text.secondary',
                              lineHeight: 1.3,
                            }}
                          >
                            {brandModel}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={tableBodyCellSx}>
                        {asset.serialNumber ? (
                          <Tooltip title={asset.serialNumber} arrow>
                            <Typography
                              sx={{
                                fontFamily:
                                  '"SF Mono", "Roboto Mono", "Cascadia Code", Consolas, monospace',
                                fontSize: '0.7rem',
                                color: 'text.secondary',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: 130,
                              }}
                            >
                              {asset.serialNumber}
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={tableBodyCellSx}>
                        <Typography
                          sx={{
                            fontSize: '0.72rem',
                            color: ownerName ? 'text.primary' : 'text.disabled',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: 160,
                          }}
                        >
                          {ownerName ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={tableBodyCellSx}>
                        <Chip
                          size="small"
                          label={meta.label}
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            bgcolor: meta.color,
                            color: '#fff',
                            '& .MuiChip-label': { px: 1 },
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        ) : (
          <Box
            sx={{
              py: 4,
              px: 2,
              textAlign: 'center',
              boxShadow: getNeumorph(isDark, 'soft'),
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontStyle: 'italic' }}
            >
              {search ? noSearchResultsMessage : emptyMessage}
            </Typography>
          </Box>
        )}
      </Box>
    </Collapse>
  );
}

const tableHeadCellSx = {
  py: 0.75,
  fontSize: '0.65rem',
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  color: 'text.secondary',
};

const tableBodyCellSx = {
  py: 0.75,
};

import { Autocomplete, Chip, TextField, alpha, Box, useTheme } from '@mui/material';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import MonitorIcon from '@mui/icons-material/Monitor';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import CableIcon from '@mui/icons-material/Cable';
import { RichOption, getRichAutocompleteSlotProps } from './RichOption';
import type { Asset } from '../../../../types/asset.types';

type AssetStatus = Asset['status'];

const STATUS_COLORS: Record<AssetStatus, { bg: string; fg: string }> = {
  Nieuw: { bg: '#9C27B0', fg: '#fff' },
  Stock: { bg: '#1976D2', fg: '#fff' },
  InGebruik: { bg: '#43A047', fg: '#fff' },
  Herstelling: { bg: '#F57C00', fg: '#fff' },
  Defect: { bg: '#E53935', fg: '#fff' },
  UitDienst: { bg: '#757575', fg: '#fff' },
};

const STATUS_LABELS: Record<AssetStatus, string> = {
  Nieuw: 'Nieuw',
  Stock: 'Stock',
  InGebruik: 'In gebruik',
  Herstelling: 'Herstelling',
  Defect: 'Defect',
  UitDienst: 'Uit dienst',
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

interface Props {
  options: Asset[];
  value: Asset | null;
  onChange: (asset: Asset | null) => void;
  label: string;
  disabled?: boolean;
  /** Optional: restrict to a specific asset type id (e.g. matched line type). */
  filterByAssetTypeId?: number;
}

export function AssetPicker({
  options,
  value,
  onChange,
  label,
  disabled,
  filterByAssetTypeId,
}: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const filtered = filterByAssetTypeId
    ? options.filter((a) => a.assetTypeId === filterByAssetTypeId)
    : options;

  return (
    <Autocomplete<Asset>
      size="small"
      options={filtered}
      value={value}
      onChange={(_, selected) => onChange(selected)}
      disabled={disabled}
      getOptionLabel={(a) => `${a.assetCode} — ${a.assetName ?? ''}`}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      slotProps={getRichAutocompleteSlotProps(isDark)}
      renderInput={(params) => <TextField {...params} label={label} />}
      renderOption={(props, asset, { selected }) => {
        const Icon = pickAssetIcon(asset.assetType?.name);
        const status = STATUS_COLORS[asset.status];
        const ownerName =
          asset.employee?.displayName ?? asset.owner ?? null;
        const subtitleParts = [
          [asset.brand, asset.model].filter(Boolean).join(' '),
          asset.serialNumber ? `SN: ${asset.serialNumber}` : null,
          ownerName ? `→ ${ownerName}` : null,
        ].filter(Boolean);
        return (
          <RichOption
            {...props}
            key={asset.id}
            selected={selected}
            primaryMono
            primary={asset.assetCode}
            secondary={
              <>
                <strong style={{ fontWeight: 500 }}>
                  {asset.assetName || '—'}
                </strong>
                {subtitleParts.length > 0 && (
                  <span> · {subtitleParts.join(' · ')}</span>
                )}
              </>
            }
            leading={
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: (theme) =>
                    alpha(
                      status.bg,
                      theme.palette.mode === 'dark' ? 0.18 : 0.12,
                    ),
                  color: status.bg,
                }}
              >
                <Icon sx={{ fontSize: 18 }} />
              </Box>
            }
            trailing={
              <Chip
                size="small"
                label={STATUS_LABELS[asset.status]}
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  bgcolor: status.bg,
                  color: status.fg,
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            }
          />
        );
      }}
    />
  );
}

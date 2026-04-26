import { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Popover,
  TextField,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Stack,
  Chip,
  Divider,
  IconButton,
  alpha,
  useTheme,
  type SxProps,
  type Theme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CloseIcon from '@mui/icons-material/Close';
import type { AssetType, Service, Sector, Building } from '../../types/admin.types';
import { AssetStatus } from '../../types/asset.types';

const FACET_COLORS = {
  status: '#FF9800',
  assetType: '#2196F3',
  service: '#4CAF50',
  building: '#9C27B0',
} as const;

type FacetKey = keyof typeof FACET_COLORS;

const STATUS_OPTIONS: { value: AssetStatus; label: string; color: string }[] = [
  { value: AssetStatus.Nieuw, label: 'Nieuw', color: '#8B5CF6' },
  { value: AssetStatus.InGebruik, label: 'In Gebruik', color: '#22c55e' },
  { value: AssetStatus.Stock, label: 'Stock', color: '#3B82F6' },
  { value: AssetStatus.Herstelling, label: 'Herstelling', color: '#eab308' },
  { value: AssetStatus.Defect, label: 'Defect', color: '#EF4444' },
  { value: AssetStatus.UitDienst, label: 'Uit Dienst', color: '#9CA3AF' },
];

export interface AssetFilterBarProps {
  searchText: string;
  onSearchChange: (text: string) => void;

  selectedStatuses: Set<AssetStatus>;
  onStatusesChange: (next: Set<AssetStatus>) => void;

  selectedAssetTypeIds: Set<number>;
  onAssetTypesChange: (next: Set<number>) => void;
  assetTypes: AssetType[];

  selectedServiceIds: Set<number>;
  onServicesChange: (next: Set<number>) => void;
  services: Service[];
  sectors: Sector[];

  selectedBuildingIds: Set<number>;
  onBuildingsChange: (next: Set<number>) => void;
  buildings: Building[];

  onClearAll: () => void;
  /** Optional sx applied to the outer Paper wrapper. */
  sx?: SxProps<Theme>;
}

/**
 * Horizontal multi-select filter bar with a search input above and four facet
 * dropdowns (Status, Asset Type, Dienst, Gebouw). Each facet opens a Popover
 * with a checkbox list. The Dienst popover groups services by sector.
 */
const AssetFilterBar: React.FC<AssetFilterBarProps> = ({
  searchText,
  onSearchChange,
  selectedStatuses,
  onStatusesChange,
  selectedAssetTypeIds,
  onAssetTypesChange,
  assetTypes,
  selectedServiceIds,
  onServicesChange,
  services,
  sectors,
  selectedBuildingIds,
  onBuildingsChange,
  buildings,
  onClearAll,
  sx,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [openFacet, setOpenFacet] = useState<FacetKey | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleOpenFacet = (facet: FacetKey) => (event: React.MouseEvent<HTMLElement>) => {
    setOpenFacet(facet);
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setOpenFacet(null);
    setAnchorEl(null);
  };

  // Group services by sector for the Dienst popover
  const servicesBySector = useMemo(() => {
    const sectorMap = new Map<number, { sector: Sector; services: Service[] }>();
    sectors.forEach((s) => sectorMap.set(s.id, { sector: s, services: [] }));
    services.forEach((svc) => {
      if (svc.sectorId !== undefined && sectorMap.has(svc.sectorId)) {
        sectorMap.get(svc.sectorId)!.services.push(svc);
      }
    });
    return Array.from(sectorMap.values())
      .filter((g) => g.services.length > 0)
      .sort((a, b) => a.sector.sortOrder - b.sector.sortOrder);
  }, [services, sectors]);

  const totalSelected =
    selectedStatuses.size +
    selectedAssetTypeIds.size +
    selectedServiceIds.size +
    selectedBuildingIds.size;

  // ---------------------------------------------------------------- Helpers
  const toggleInSet = <T,>(set: Set<T>, value: T): Set<T> => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  // -------------------------------------------------------------- Facet UIs

  const renderStatusOptions = () => (
    <Box sx={{ p: 1.5, minWidth: 220 }}>
      <Stack spacing={0.25}>
        {STATUS_OPTIONS.map((opt) => (
          <FormControlLabel
            key={opt.value}
            control={
              <Checkbox
                size="small"
                checked={selectedStatuses.has(opt.value)}
                onChange={() => onStatusesChange(toggleInSet(selectedStatuses, opt.value))}
                sx={{
                  p: 0.5,
                  color: alpha(opt.color, 0.5),
                  '&.Mui-checked': { color: opt.color },
                }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: opt.color,
                  }}
                />
                <Typography variant="body2">{opt.label}</Typography>
              </Box>
            }
            sx={{ m: 0 }}
          />
        ))}
      </Stack>
    </Box>
  );

  const renderAssetTypeOptions = () => (
    <Box sx={{ p: 1.5, minWidth: 240, maxHeight: 360, overflowY: 'auto' }}>
      {assetTypes.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          Geen asset types beschikbaar.
        </Typography>
      ) : (
        <Stack spacing={0.25}>
          {assetTypes.map((at) => (
            <FormControlLabel
              key={at.id}
              control={
                <Checkbox
                  size="small"
                  checked={selectedAssetTypeIds.has(at.id)}
                  onChange={() =>
                    onAssetTypesChange(toggleInSet(selectedAssetTypeIds, at.id))
                  }
                  sx={{
                    p: 0.5,
                    color: alpha(FACET_COLORS.assetType, 0.5),
                    '&.Mui-checked': { color: FACET_COLORS.assetType },
                  }}
                />
              }
              label={<Typography variant="body2">{at.name}</Typography>}
              sx={{ m: 0 }}
            />
          ))}
        </Stack>
      )}
    </Box>
  );

  const renderServiceOptions = () => (
    <Box sx={{ p: 1.5, minWidth: 320, maxHeight: 380, overflowY: 'auto' }}>
      {servicesBySector.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          Geen diensten beschikbaar.
        </Typography>
      ) : (
        servicesBySector.map(({ sector, services: sectorServices }) => {
          const selectedInSector = sectorServices.filter((s) =>
            selectedServiceIds.has(s.id),
          ).length;
          const allSelected =
            selectedInSector > 0 && selectedInSector === sectorServices.length;
          const someSelected = selectedInSector > 0 && !allSelected;

          const handleSectorToggle = () => {
            const next = new Set(selectedServiceIds);
            if (allSelected) {
              sectorServices.forEach((s) => next.delete(s.id));
            } else {
              sectorServices.forEach((s) => next.add(s.id));
            }
            onServicesChange(next);
          };

          return (
            <Box key={sector.id} sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                <Checkbox
                  size="small"
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={handleSectorToggle}
                  sx={{
                    p: 0.5,
                    color: alpha(FACET_COLORS.service, 0.4),
                    '&.Mui-checked, &.MuiCheckbox-indeterminate': {
                      color: FACET_COLORS.service,
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    fontSize: '0.65rem',
                    color: 'text.secondary',
                  }}
                >
                  {sector.name}
                </Typography>
              </Box>
              <Stack spacing={0} sx={{ pl: 3.5 }}>
                {sectorServices.map((svc) => (
                  <FormControlLabel
                    key={svc.id}
                    control={
                      <Checkbox
                        size="small"
                        checked={selectedServiceIds.has(svc.id)}
                        onChange={() =>
                          onServicesChange(toggleInSet(selectedServiceIds, svc.id))
                        }
                        sx={{
                          p: 0.4,
                          color: alpha(FACET_COLORS.service, 0.5),
                          '&.Mui-checked': { color: FACET_COLORS.service },
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>
                        {svc.name}
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                ))}
              </Stack>
            </Box>
          );
        })
      )}
    </Box>
  );

  const renderBuildingOptions = () => (
    <Box sx={{ p: 1.5, minWidth: 240, maxHeight: 360, overflowY: 'auto' }}>
      {buildings.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          Geen gebouwen beschikbaar.
        </Typography>
      ) : (
        <Stack spacing={0.25}>
          {buildings.map((b) => (
            <FormControlLabel
              key={b.id}
              control={
                <Checkbox
                  size="small"
                  checked={selectedBuildingIds.has(b.id)}
                  onChange={() =>
                    onBuildingsChange(toggleInSet(selectedBuildingIds, b.id))
                  }
                  sx={{
                    p: 0.5,
                    color: alpha(FACET_COLORS.building, 0.5),
                    '&.Mui-checked': { color: FACET_COLORS.building },
                  }}
                />
              }
              label={
                <Box>
                  <Typography variant="body2">{b.name}</Typography>
                  {b.code && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      {b.code}
                    </Typography>
                  )}
                </Box>
              }
              sx={{ m: 0 }}
            />
          ))}
        </Stack>
      )}
    </Box>
  );

  // ----------------------------------------------------------------- Buttons

  const facetButton = (
    facet: FacetKey,
    label: string,
    selectedCount: number,
  ) => {
    const color = FACET_COLORS[facet];
    const isActive = selectedCount > 0;
    return (
      <Button
        onClick={handleOpenFacet(facet)}
        endIcon={<KeyboardArrowDownIcon />}
        sx={{
          textTransform: 'none',
          justifyContent: 'space-between',
          flex: 1,
          minWidth: { xs: '45%', sm: 0 },
          px: 1.5,
          py: 1,
          borderRadius: 1.5,
          bgcolor: isActive ? alpha(color, 0.12) : 'transparent',
          border: '1px solid',
          borderColor: isActive ? alpha(color, 0.4) : 'divider',
          color: isActive ? color : 'text.primary',
          fontWeight: isActive ? 700 : 500,
          '&:hover': {
            bgcolor: alpha(color, 0.16),
            borderColor: color,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'inherit' }}>
            {label}
          </Typography>
          {selectedCount > 0 && (
            <Chip
              label={selectedCount}
              size="small"
              sx={{
                height: 18,
                minWidth: 18,
                fontSize: '0.65rem',
                fontWeight: 700,
                bgcolor: color,
                color: 'white',
                '& .MuiChip-label': { px: 0.6 },
              }}
            />
          )}
        </Box>
      </Button>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: isDark ? 'var(--dark-bg-elevated)' : 'background.paper',
        boxShadow: isDark ? 'var(--neu-shadow-dark-sm)' : 'var(--neu-shadow-light-sm)',
        ...sx,
      }}
    >
      <Box sx={{ p: 1.5 }}>
        {/* Search */}
        <TextField
          size="small"
          fullWidth
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Zoeken op code, naam, serienummer…"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: searchText ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onSearchChange('')}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 1.5,
            },
          }}
        />

        <Divider sx={{ my: 1.5 }} />

        {/* Facet buttons */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {facetButton('status', 'Status', selectedStatuses.size)}
          {facetButton('assetType', 'Asset Type', selectedAssetTypeIds.size)}
          {facetButton('service', 'Dienst', selectedServiceIds.size)}
          {facetButton('building', 'Gebouw', selectedBuildingIds.size)}

          {totalSelected > 0 && (
            <Button
              size="small"
              variant="text"
              onClick={onClearAll}
              sx={{ textTransform: 'none', color: 'text.secondary', flexShrink: 0 }}
            >
              Wis alle filters ({totalSelected})
            </Button>
          )}
        </Box>
      </Box>

      <Popover
        open={openFacet !== null}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              borderRadius: 1.5,
              boxShadow: isDark
                ? '0 8px 24px rgba(0,0,0,0.5)'
                : '0 8px 24px rgba(0,0,0,0.15)',
            },
          },
        }}
      >
        {openFacet === 'status' && renderStatusOptions()}
        {openFacet === 'assetType' && renderAssetTypeOptions()}
        {openFacet === 'service' && renderServiceOptions()}
        {openFacet === 'building' && renderBuildingOptions()}
      </Popover>
    </Paper>
  );
};

export default AssetFilterBar;

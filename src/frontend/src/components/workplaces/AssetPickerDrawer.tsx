import React, { useMemo, useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Button,
  CircularProgress,
  alpha,
  useTheme,
  IconButton,
  Alert,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import LinkIcon from '@mui/icons-material/Link';
import { useTranslation } from 'react-i18next';
import { useAssets, useAssignAssetToWorkplace } from '../../hooks/useAssets';
import { getNeumorph, getNeumorphColors } from '../../utils/neumorphicStyles';
import type { Asset } from '../../types/asset.types';

const EQUIPMENT_COLOR = '#FF7700';

interface AssetPickerDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Workplace that receives the linked asset */
  workplaceId: number;
  /** Only show assets whose assetTypeId matches (optional — when undefined shows all Nieuw) */
  assetTypeFilter?: number[];
  /** Human-readable label for the slot being filled, e.g. "Docking Station" */
  slotLabel: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const AssetPickerDrawer: React.FC<AssetPickerDrawerProps> = ({
  open,
  onClose,
  workplaceId,
  assetTypeFilter,
  slotLabel,
  onSuccess,
  onError,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  const [search, setSearch] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  const { data: allNieuw = [], isLoading } = useAssets('Nieuw');
  const assignMutation = useAssignAssetToWorkplace();

  const filtered = useMemo(() => {
    let list = allNieuw.filter((a) => !a.isDummy);
    if (assetTypeFilter && assetTypeFilter.length > 0) {
      list = list.filter(
        (a) => a.assetTypeId !== undefined && assetTypeFilter.includes(a.assetTypeId),
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.assetCode.toLowerCase().includes(q) ||
          (a.assetName?.toLowerCase() ?? '').includes(q) ||
          (a.serialNumber?.toLowerCase() ?? '').includes(q) ||
          (a.brand?.toLowerCase() ?? '').includes(q) ||
          (a.model?.toLowerCase() ?? '').includes(q),
      );
    }
    return list.slice(0, 50);
  }, [allNieuw, assetTypeFilter, search]);

  const handleLink = async () => {
    if (!selectedAsset) return;
    setLinkError(null);
    try {
      await assignMutation.mutateAsync({
        assetId: selectedAsset.id,
        data: {
          physicalWorkplaceId: workplaceId,
          installationDate: new Date().toISOString().split('T')[0],
        },
      });
      onSuccess(
        t(
          'workplaceDetail.linkAsset.success',
          `${selectedAsset.assetCode} gekoppeld aan werkplek.`,
        ),
      );
      handleClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : t('workplaceDetail.linkAsset.error', 'Koppeling mislukt. Probeer het opnieuw.');
      setLinkError(msg);
      onError(msg);
    }
  };

  const handleClose = () => {
    setSearch('');
    setSelectedAsset(null);
    setLinkError(null);
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420 },
          bgcolor: bgSurface,
          boxShadow: getNeumorph(isDark, 'strong'),
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box
          sx={{
            px: 2.5,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(EQUIPMENT_COLOR, 0.12),
              flexShrink: 0,
            }}
          >
            <LinkIcon sx={{ fontSize: 20, color: EQUIPMENT_COLOR }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              {t('workplaceDetail.linkAsset.title', 'Koppel asset')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('workplaceDetail.linkAsset.slot', 'Slot')}: <strong>{slotLabel}</strong>
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Info banner */}
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            bgcolor: isDark ? alpha(EQUIPMENT_COLOR, 0.07) : alpha(EQUIPMENT_COLOR, 0.05),
            borderBottom: '1px solid',
            borderColor: alpha(EQUIPMENT_COLOR, 0.15),
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {t(
              'workplaceDetail.linkAsset.info',
              'Alleen activa met status Nieuw worden getoond. Kies een actief om het te koppelen aan dit slot.',
            )}
          </Typography>
        </Box>

        {/* Search */}
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            size="small"
            fullWidth
            placeholder={t('workplaceDetail.linkAsset.search', 'Zoek op code, serienummer, merk...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Error */}
        {linkError && (
          <Box sx={{ px: 2.5, pt: 1 }}>
            <Alert severity="error" sx={{ borderRadius: 1.5 }}>
              {linkError}
            </Alert>
          </Box>
        )}

        {/* Asset list */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={28} sx={{ color: EQUIPMENT_COLOR }} />
            </Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {search
                  ? t('workplaceDetail.linkAsset.noResults', 'Geen activa gevonden voor deze zoekopdracht.')
                  : t(
                      'workplaceDetail.linkAsset.noNieuw',
                      'Geen activa met status Nieuw beschikbaar voor dit slot.',
                    )}
              </Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {filtered.map((asset) => {
                const isSelected = selectedAsset?.id === asset.id;
                return (
                  <React.Fragment key={asset.id}>
                    <ListItemButton
                      selected={isSelected}
                      onClick={() => setSelectedAsset(isSelected ? null : asset)}
                      sx={{
                        px: 2.5,
                        py: 1.25,
                        transition: 'all 0.15s ease',
                        bgcolor: isSelected
                          ? alpha(EQUIPMENT_COLOR, 0.1)
                          : undefined,
                        '&.Mui-selected': {
                          bgcolor: alpha(EQUIPMENT_COLOR, 0.1),
                          '&:hover': {
                            bgcolor: alpha(EQUIPMENT_COLOR, 0.15),
                          },
                        },
                        '&:hover': {
                          bgcolor: alpha(EQUIPMENT_COLOR, 0.05),
                        },
                        borderLeft: isSelected ? `3px solid ${EQUIPMENT_COLOR}` : '3px solid transparent',
                      }}
                    >
                      <ListItemText
                        primaryTypographyProps={{ component: 'div' }}
                        secondaryTypographyProps={{ component: 'div' }}
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              sx={{ fontFamily: 'monospace', color: isSelected ? EQUIPMENT_COLOR : undefined }}
                            >
                              {asset.assetCode}
                            </Typography>
                            {asset.serialNumber ? (
                              <Typography
                                variant="caption"
                                sx={{
                                  fontFamily: 'monospace',
                                  color: 'text.secondary',
                                  bgcolor: (theme) => alpha(theme.palette.text.primary, 0.06),
                                  px: 0.75,
                                  py: 0.125,
                                  borderRadius: 0.75,
                                  letterSpacing: 0.2,
                                }}
                                title={`Serienummer: ${asset.serialNumber}`}
                              >
                                S/N {asset.serialNumber}
                              </Typography>
                            ) : (
                              <Typography
                                variant="caption"
                                sx={{ color: 'text.disabled', fontStyle: 'italic' }}
                              >
                                geen serienummer
                              </Typography>
                            )}
                            {asset.assetType?.name && (
                              <Chip
                                label={asset.assetType.name}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.6rem',
                                  fontWeight: 600,
                                  bgcolor: alpha(EQUIPMENT_COLOR, 0.1),
                                  color: EQUIPMENT_COLOR,
                                  '& .MuiChip-label': { px: 0.75 },
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          asset.brand || asset.model ? (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.25 }}>
                              <Typography variant="caption" color="text.secondary">
                                {asset.brand} {asset.model}
                              </Typography>
                            </Box>
                          ) : null
                        }
                      />
                    </ListItemButton>
                    <Divider />
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Box>

        {/* Footer actions */}
        <Box
          sx={{
            px: 2.5,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            gap: 1.5,
            alignItems: 'center',
          }}
        >
          {selectedAsset && (
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
              Geselecteerd:{' '}
              <strong style={{ color: EQUIPMENT_COLOR }}>{selectedAsset.assetCode}</strong>
            </Typography>
          )}
          <Button onClick={handleClose} color="inherit" size="small" sx={{ ml: 'auto' }}>
            {t('common.cancel', 'Annuleren')}
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={!selectedAsset || assignMutation.isPending}
            onClick={handleLink}
            startIcon={
              assignMutation.isPending ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <LinkIcon />
              )
            }
            sx={{
              bgcolor: EQUIPMENT_COLOR,
              color: '#fff',
              fontWeight: 600,
              borderRadius: 1.5,
              '&:hover': { bgcolor: alpha(EQUIPMENT_COLOR, 0.85) },
              '&.Mui-disabled': { bgcolor: alpha(EQUIPMENT_COLOR, 0.3), color: '#fff' },
            }}
          >
            {assignMutation.isPending
              ? t('common.saving', 'Koppelen...')
              : t('workplaceDetail.linkAsset.link', 'Koppelen')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default AssetPickerDrawer;

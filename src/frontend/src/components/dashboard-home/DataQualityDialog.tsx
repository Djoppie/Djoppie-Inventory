import { useMemo, useState } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Stack,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  alpha,
  useTheme,
  Divider,
  Tooltip,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocationOffIcon from '@mui/icons-material/LocationOff';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import {
  getDataQualitySummary,
  backfillAssetEmployees,
  backfillAssetWorkplaces,
  type BackfillResult,
} from '../../api/dataQuality.api';
import { categoriesApi } from '../../api/admin.api';
import type { Category } from '../../types/admin.types';

type BackfillKind = 'employees' | 'workplaces';

interface DataQualityDialogProps {
  open: boolean;
  onClose: () => void;
}

const COMPUTING_CATEGORY_NAMES = ['computing', 'pcs', 'computers'];
const BRAND_TOP_LIMIT = 6;

/**
 * Pop-over dialog containing the asset data-quality overview, a category
 * multiselect (default: Computing) and one-click backfill controls.
 */
const DataQualityDialog: React.FC<DataQualityDialogProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const qc = useQueryClient();

  // ---------------------------------------------------------------- Categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories', 'all'],
    queryFn: () => categoriesApi.getAll(false),
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  // We track the user's explicit selection separately from the default. While
  // `userOverride` is null we apply the "Computing" default; once the user
  // toggles or clears, their choice wins.
  const [userOverride, setUserOverride] = useState<number[] | null>(null);

  const computingDefaultIds = useMemo<number[]>(() => {
    const computing = categories.find((c) =>
      COMPUTING_CATEGORY_NAMES.includes(c.name.trim().toLowerCase()),
    );
    return computing ? [computing.id] : [];
  }, [categories]);

  const selectedCategoryIds = userOverride ?? computingDefaultIds;

  const sortedCategoryIds = useMemo(
    () => [...selectedCategoryIds].sort((a, b) => a - b),
    [selectedCategoryIds],
  );

  const toggleCategory = (id: number) => {
    const current = selectedCategoryIds;
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    setUserOverride(next);
  };

  const clearCategoryFilter = () => setUserOverride([]);

  // -------------------------------------------------------------- Summary data
  const { data, isLoading, error } = useQuery({
    queryKey: ['data-quality', 'summary', sortedCategoryIds],
    queryFn: () => getDataQualitySummary(sortedCategoryIds),
    staleTime: 2 * 60 * 1000,
    enabled: open,
  });

  // ---------------------------------------------------------- Backfill mutation
  const [backfillKind, setBackfillKind] = useState<BackfillKind | null>(null);
  const [preview, setPreview] = useState<BackfillResult | null>(null);

  const runMutation = useMutation({
    mutationFn: async ({ kind, dryRun }: { kind: BackfillKind; dryRun: boolean }) =>
      kind === 'employees' ? backfillAssetEmployees(dryRun) : backfillAssetWorkplaces(dryRun),
    onSuccess: (result, vars) => {
      setPreview(result);
      if (!vars.dryRun) {
        qc.invalidateQueries({ queryKey: ['data-quality'] });
        qc.invalidateQueries({ queryKey: ['reports'] });
      }
    },
  });

  const startBackfill = (kind: BackfillKind) => {
    setBackfillKind(kind);
    setPreview(null);
    runMutation.mutate({ kind, dryRun: true });
  };

  const cancelBackfill = () => {
    setBackfillKind(null);
    setPreview(null);
    runMutation.reset();
  };

  const commitBackfill = () => {
    if (!backfillKind) return;
    runMutation.mutate({ kind: backfillKind, dryRun: false });
  };

  const handleClose = () => {
    cancelBackfill();
    setUserOverride(null);
    onClose();
  };

  // ------------------------------------------------------------------- Derived
  const hasIssues =
    !!data && (data.inUseAssetsWithoutWorkplace > 0 || data.inUseAssetsWithoutEmployee > 0);

  // Show the top N brands; rest is rolled up into an "Other" row.
  const brands = data?.brands;
  const brandRows = useMemo(() => {
    type BrandRow = {
      brand: string;
      inUseTotal: number;
      withoutWorkplace: number;
      withoutEmployee: number;
    };
    if (!brands || brands.length === 0) {
      return { top: [] as BrandRow[], other: null as BrandRow | null };
    }
    const top: BrandRow[] = brands.slice(0, BRAND_TOP_LIMIT);
    const rest = brands.slice(BRAND_TOP_LIMIT);
    if (rest.length === 0) return { top, other: null as BrandRow | null };
    const other: BrandRow = rest.reduce<BrandRow>(
      (acc, b) => ({
        brand: `Andere (${rest.length})`,
        inUseTotal: acc.inUseTotal + b.inUseTotal,
        withoutWorkplace: acc.withoutWorkplace + b.withoutWorkplace,
        withoutEmployee: acc.withoutEmployee + b.withoutEmployee,
      }),
      { brand: '', inUseTotal: 0, withoutWorkplace: 0, withoutEmployee: 0 },
    );
    return { top, other };
  }, [brands]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          {hasIssues ? (
            <WarningAmberIcon sx={{ color: '#FF9800' }} />
          ) : (
            <CheckCircleIcon sx={{ color: '#4CAF50' }} />
          )}
          <Typography component="span" variant="h6" sx={{ fontWeight: 700 }}>
            Data kwaliteit assets
          </Typography>
        </Stack>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {!backfillKind && (
          <>
            {/* Category multiselect */}
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  color: 'text.secondary',
                  display: 'block',
                  mb: 1,
                }}
              >
                Filter op categorie
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {categories.length === 0 && (
                  <Typography variant="caption" color="text.secondary">
                    Categorieën laden…
                  </Typography>
                )}
                {categories.map((c) => {
                  const selected = selectedCategoryIds.includes(c.id);
                  return (
                    <Chip
                      key={c.id}
                      label={c.name}
                      size="small"
                      clickable
                      onClick={() => toggleCategory(c.id)}
                      sx={{
                        height: 26,
                        fontSize: '0.72rem',
                        fontWeight: selected ? 700 : 500,
                        bgcolor: selected ? alpha('#FF7700', 0.18) : 'transparent',
                        border: '1px solid',
                        borderColor: selected ? alpha('#FF7700', 0.4) : 'divider',
                        color: selected ? '#FF7700' : 'text.primary',
                        '&:hover': {
                          bgcolor: alpha('#FF7700', 0.1),
                        },
                      }}
                    />
                  );
                })}
                {selectedCategoryIds.length > 0 && (
                  <Chip
                    label="Wis filter"
                    size="small"
                    variant="outlined"
                    onClick={clearCategoryFilter}
                    sx={{ height: 26, fontSize: '0.7rem' }}
                  />
                )}
              </Stack>
              {selectedCategoryIds.length === 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Geen filter actief — alle categorieën worden getoond.
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 1.5 }} />

            {error && <Alert severity="error">Kon data-quality overzicht niet laden.</Alert>}

            {(isLoading || !data) && !error && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">Bezig met laden…</Typography>
              </Stack>
            )}

            {data && (
              <>
                {/* Headline counts */}
                <Stack spacing={1.25} sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color:
                        data.inUseAssetsWithoutWorkplace > 0 ? '#FF9800' : 'text.secondary',
                    }}
                  >
                    <LocationOffIcon sx={{ fontSize: 20 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {data.inUseAssetsWithoutWorkplace}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      in-gebruik assets zonder werkplek
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color:
                        data.inUseAssetsWithoutEmployee > 0 ? '#F44336' : 'text.secondary',
                    }}
                  >
                    <PersonOffIcon sx={{ fontSize: 20 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {data.inUseAssetsWithoutEmployee}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      zonder gekoppelde medewerker
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    (van {data.inUseAssetsTotal} in gebruik totaal binnen filter)
                  </Typography>
                </Stack>

                {/* Brand breakdown table */}
                {data.brands.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        color: 'text.secondary',
                        display: 'block',
                        mb: 0.5,
                      }}
                    >
                      Verdeling per merk
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: alpha(theme.palette.background.default, isDark ? 0.4 : 0.6),
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Merk</TableCell>
                            <TableCell align="right">In gebruik</TableCell>
                            <TableCell align="right">
                              <Tooltip title="In-gebruik assets zonder werkplek">
                                <span>Geen werkplek</span>
                              </Tooltip>
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="In-gebruik assets zonder gekoppelde medewerker">
                                <span>Geen medewerker</span>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {brandRows.top.map((b) => (
                            <TableRow key={b.brand}>
                              <TableCell sx={{ fontWeight: 600 }}>{b.brand}</TableCell>
                              <TableCell align="right">{b.inUseTotal}</TableCell>
                              <TableCell
                                align="right"
                                sx={{ color: b.withoutWorkplace > 0 ? '#FF9800' : 'text.secondary' }}
                              >
                                {b.withoutWorkplace}
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{ color: b.withoutEmployee > 0 ? '#F44336' : 'text.secondary' }}
                              >
                                {b.withoutEmployee}
                              </TableCell>
                            </TableRow>
                          ))}
                          {brandRows.other && (
                            <TableRow>
                              <TableCell sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                                {brandRows.other.brand}
                              </TableCell>
                              <TableCell align="right">{brandRows.other.inUseTotal}</TableCell>
                              <TableCell align="right">{brandRows.other.withoutWorkplace}</TableCell>
                              <TableCell align="right">{brandRows.other.withoutEmployee}</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Box>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    color: 'text.secondary',
                    display: 'block',
                    mb: 1,
                  }}
                >
                  Automatische koppelingen
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button
                    variant="outlined"
                    startIcon={<AutoFixHighIcon />}
                    disabled={data.employeeBackfillCandidates === 0}
                    onClick={() => startBackfill('employees')}
                    sx={{ textTransform: 'none' }}
                  >
                    Link medewerkers ({data.employeeBackfillCandidates})
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AutoFixHighIcon />}
                    disabled={data.workplaceBackfillCandidates === 0}
                    onClick={() => startBackfill('workplaces')}
                    sx={{ textTransform: 'none' }}
                  >
                    Link werkplekken ({data.workplaceBackfillCandidates})
                  </Button>
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 1 }}
                >
                  Backfills lopen op alle categorieën — de filter hierboven beïnvloedt enkel de
                  weergegeven cijfers.
                </Typography>
              </>
            )}
          </>
        )}

        {backfillKind && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
              Backfill —{' '}
              {backfillKind === 'employees'
                ? 'Asset ↔ Medewerker'
                : 'Asset ↔ Werkplek'}{' '}
              koppelingen
            </Typography>

            {runMutation.isPending && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <CircularProgress size={18} />
                <Typography variant="body2">Bezig…</Typography>
              </Stack>
            )}
            {runMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {(runMutation.error as Error).message || 'Kon backfill niet uitvoeren.'}
              </Alert>
            )}
            {preview && (
              <>
                <Alert severity={preview.dryRun ? 'info' : 'success'} sx={{ mb: 2 }}>
                  {preview.dryRun
                    ? `Dry-run: ${preview.matched} van ${preview.scanned} assets kunnen gekoppeld worden (${preview.unmatched} geen match).`
                    : `Klaar: ${preview.matched} assets bijgewerkt (${preview.unmatched} konden niet worden gematched).`}
                </Alert>
                {preview.samples.length > 0 && (
                  <Box
                    sx={{
                      maxHeight: 360,
                      overflow: 'auto',
                      bgcolor: alpha(theme.palette.background.default, isDark ? 0.4 : 0.6),
                      borderRadius: 1,
                    }}
                  >
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Asset Code</TableCell>
                          {backfillKind === 'employees' && (
                            <TableCell>Owner (ruwe string)</TableCell>
                          )}
                          {backfillKind === 'employees' ? (
                            <TableCell>→ Medewerker</TableCell>
                          ) : (
                            <TableCell>→ Werkplek</TableCell>
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {preview.samples.map((s) => (
                          <TableRow key={s.assetId}>
                            <TableCell sx={{ fontFamily: 'monospace' }}>{s.assetCode}</TableCell>
                            {backfillKind === 'employees' && (
                              <TableCell sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                                {s.currentOwner || '—'}
                              </TableCell>
                            )}
                            <TableCell>
                              {backfillKind === 'employees'
                                ? s.matchedEmployeeName || '—'
                                : s.matchedWorkplaceCode || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
                {preview.samples.length === 0 && preview.matched > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    (Geen preview-voorbeelden beschikbaar.)
                  </Typography>
                )}
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {backfillKind ? (
          <>
            <Button onClick={cancelBackfill}>Terug</Button>
            <Button
              variant="contained"
              color="warning"
              disabled={
                !preview || !preview.dryRun || preview.matched === 0 || runMutation.isPending
              }
              onClick={commitBackfill}
            >
              Uitvoeren ({preview?.matched ?? 0} assets)
            </Button>
          </>
        ) : (
          <Button onClick={handleClose}>Sluiten</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DataQualityDialog;

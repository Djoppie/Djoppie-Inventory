import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Stack,
  Divider,
  Collapse,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  alpha,
  Tooltip,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { formatDistanceToNow } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import {
  useWorkplaceGapAnalysis,
  useAutoCreateMissingWorkplaces,
} from '../../hooks/usePhysicalWorkplaces';
import { useBuildings } from '../../hooks/useBuildings';
import { WorkplaceType, AutoCreateWorkplacesResult } from '../../types/physicalWorkplace.types';
import GapStatsHeader from './gap/GapStatsHeader';
import GapByServiceChips from './gap/GapByServiceChips';
import GapOrphanTable from './gap/GapOrphanTable';

const TEAL = '#009688';

const WorkplaceGapAnalysisSection = () => {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const dateFnsLocale = i18n.language.startsWith('nl') ? nl : enUS;
  const [expanded, setExpanded] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [createResult, setCreateResult] = useState<AutoCreateWorkplacesResult | null>(null);
  const [bulkBuildingId, setBulkBuildingId] = useState<string>('');
  const [maxToCreate, setMaxToCreate] = useState<number>(25);

  // Remembered building for per-row create dialog — shared across rows
  const [lastUsedBuildingId, setLastUsedBuildingId] = useState<number | null>(null);

  const { data: gapAnalysis, isLoading, refetch, dataUpdatedAt } = useWorkplaceGapAnalysis(undefined, 100);
  const { data: buildings = [] } = useBuildings();
  const autoCreateMutation = useAutoCreateMissingWorkplaces();

  const handleBulkCreate = async () => {
    if (!bulkBuildingId) return;
    try {
      const result = await autoCreateMutation.mutateAsync({
        defaultBuildingId: Number(bulkBuildingId),
        maxToCreate,
        workplaceType: WorkplaceType.Laptop,
        monitorCount: 2,
        hasDockingStation: true,
      });
      setCreateResult(result);
      setBulkDialogOpen(false);
      setResultDialogOpen(true);
    } catch (err) {
      console.error('Bulk auto-create failed:', err);
    }
  };

  if (isLoading) {
    return (
      <Card
        elevation={0}
        sx={{ mb: 3, bgcolor: 'transparent', border: '1px solid', borderColor: 'divider' }}
      >
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <CircularProgress size={20} sx={{ color: TEAL }} />
            <Typography color="text.secondary" variant="body2">
              Werkplek analyse laden...
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (!gapAnalysis) return null;

  const hasGap = gapAnalysis.ownersWithoutWorkplace > 0;

  const refreshedLabel =
    dataUpdatedAt > 0
      ? formatDistanceToNow(new Date(dataUpdatedAt), { addSuffix: true, locale: dateFnsLocale })
      : null;

  return (
    <>
      <Card
        elevation={0}
        sx={{
          mb: 3,
          bgcolor: 'transparent',
          border: '2px solid',
          borderColor: hasGap ? alpha(TEAL, 0.45) : 'divider',
          borderRadius: 2,
          // Keep overflow hidden on the card itself so rounded corners work — but NOT on children
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ pb: expanded ? 1 : 2 }}>
          {/* ── Header bar ── */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  bgcolor: alpha(TEAL, 0.1),
                  flexShrink: 0,
                }}
              >
                <PersonSearchIcon sx={{ color: TEAL, fontSize: '1.1rem' }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                  Werkplek Gap Analyse
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Laptop &amp; desktop eigenaren zonder werkplek
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={0.5} alignItems="center">
              {refreshedLabel && (
                <Typography
                  variant="caption"
                  color="text.disabled"
                  sx={{ display: { xs: 'none', sm: 'block' } }}
                >
                  Bijgewerkt {refreshedLabel}
                </Typography>
              )}
              <Tooltip title="Analyse vernieuwen">
                <IconButton size="small" onClick={() => refetch()}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={expanded ? 'Inklappen' : 'Uitklappen'}>
                <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                  {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          {/* ── Stats row ── */}
          <GapStatsHeader data={gapAnalysis} />
        </CardContent>

        {/* ── Bulk create action — demoted, with explanation ── */}
        {hasGap && (
          <CardActions
            sx={{
              px: 2,
              pb: 2,
              pt: 0,
              gap: 1,
              flexWrap: 'wrap',
              alignItems: 'flex-start',
            }}
          >
            <Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AutoFixHighIcon />}
                onClick={() => setBulkDialogOpen(true)}
                sx={{
                  color: TEAL,
                  borderColor: alpha(TEAL, 0.5),
                  '&:hover': {
                    borderColor: TEAL,
                    bgcolor: alpha(TEAL, 0.05),
                  },
                  fontSize: '0.8rem',
                }}
              >
                Bulk: alle {gapAnalysis.ownersWithoutWorkplace} werkplekken automatisch aanmaken
              </Button>
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                <InfoOutlinedIcon sx={{ fontSize: '0.75rem', color: 'text.disabled' }} />
                <Typography variant="caption" color="text.disabled">
                  Maakt voor elke eigenaar één werkplek aan met automatisch gegenereerde code en
                  jouw default-instellingen. Gebruik de acties in de tabel voor individuele controle.
                </Typography>
              </Stack>
            </Box>
          </CardActions>
        )}

        {/* ── Expanded details ── */}
        <Collapse in={expanded}>
          <Divider />
          <CardContent
            sx={{
              // Allow inner table to scroll without the card clip interfering.
              // We use a Box wrapper with controlled overflow instead of relying on the card.
              overflow: 'visible',
            }}
          >
            {gapAnalysis.gapsByService.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <GapByServiceChips gaps={gapAnalysis.gapsByService} />
              </Box>
            )}

            <GapOrphanTable
              orphans={gapAnalysis.orphanOwners}
              defaultBuildingId={lastUsedBuildingId}
              onDefaultBuildingChange={setLastUsedBuildingId}
            />
          </CardContent>
        </Collapse>
      </Card>

      {/* ─── Bulk auto-create dialog ─── */}
      <Dialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: TEAL }}>
          Bulk werkplekken aanmaken
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2.5 }}>
            Er worden werkplekken aangemaakt voor{' '}
            <strong>{gapAnalysis.ownersWithoutWorkplace}</strong> eigenaren (laptop of desktop) die
            momenteel geen werkplek hebben. De eigenaar wordt automatisch als bewoner ingesteld.
          </Alert>

          <TextField
            select
            fullWidth
            label="Standaard gebouw"
            value={bulkBuildingId}
            onChange={(e) => setBulkBuildingId(e.target.value)}
            helperText="Alle nieuwe werkplekken worden aan dit gebouw toegevoegd"
            size="small"
            sx={{ mb: 2 }}
          >
            <MenuItem value="">
              <em>Selecteer gebouw</em>
            </MenuItem>
            {buildings.map((b) => (
              <MenuItem key={b.id} value={String(b.id)}>
                {b.code} – {b.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            type="number"
            fullWidth
            label="Maximum aantal"
            value={maxToCreate}
            onChange={(e) =>
              setMaxToCreate(Math.min(100, Math.max(1, Number(e.target.value))))
            }
            helperText="Max. 100 werkplekken in één keer"
            size="small"
            inputProps={{ min: 1, max: 100 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBulkDialogOpen(false)} color="inherit" size="small">
            Annuleren
          </Button>
          <Button
            onClick={handleBulkCreate}
            variant="contained"
            size="small"
            disabled={!bulkBuildingId || autoCreateMutation.isPending}
            startIcon={
              autoCreateMutation.isPending ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <AutoFixHighIcon />
              )
            }
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#00796b' } }}
          >
            {autoCreateMutation.isPending ? 'Aanmaken...' : 'Werkplekken aanmaken'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Bulk result dialog ─── */}
      <Dialog
        open={resultDialogOpen}
        onClose={() => setResultDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color:
              createResult?.errorCount === 0 ? theme.palette.success.main : theme.palette.warning.main,
          }}
        >
          Werkplekken aangemaakt
        </DialogTitle>
        <DialogContent>
          {createResult && (
            <>
              <Stack direction="row" spacing={4} sx={{ mb: 3 }}>
                <StatResult
                  value={createResult.successCount}
                  label="Geslaagd"
                  color={theme.palette.success.main}
                />
                <StatResult
                  value={createResult.errorCount}
                  label="Fouten"
                  color={theme.palette.error.main}
                />
                <StatResult
                  value={createResult.totalProcessed}
                  label="Totaal"
                  color={theme.palette.text.primary}
                />
              </Stack>

              {createResult.successCount > 0 && createResult.successCount <= 15 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="success.main" sx={{ mb: 0.5 }}>
                    Aangemaakt:
                  </Typography>
                  <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {createResult.results
                      .filter((r) => r.success)
                      .map((r) => (
                        <ListItem key={r.workplaceId} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <CheckCircleIcon color="success" sx={{ fontSize: '1rem' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${r.workplaceCode} – ${r.ownerName ?? r.ownerEmail}`}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                  </List>
                </>
              )}

              {createResult.errorCount > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="error.main" sx={{ mb: 0.5 }}>
                    Fouten:
                  </Typography>
                  <List dense sx={{ maxHeight: 150, overflow: 'auto' }}>
                    {createResult.results
                      .filter((r) => !r.success)
                      .map((r, idx) => (
                        <ListItem key={idx} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <ErrorIcon color="error" sx={{ fontSize: '1rem' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={r.ownerEmail}
                            secondary={r.errorMessage}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                  </List>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setResultDialogOpen(false)}
            variant="contained"
            size="small"
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#00796b' } }}
          >
            Sluiten
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const StatResult = ({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) => (
  <Box sx={{ textAlign: 'center' }}>
    <Typography variant="h4" fontWeight={700} sx={{ color }}>
      {value}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
  </Box>
);

export default WorkplaceGapAnalysisSection;

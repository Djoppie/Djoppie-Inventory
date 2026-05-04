import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack,
  Divider,
  LinearProgress,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  alpha,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import LaptopIcon from '@mui/icons-material/Laptop';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import WorkIcon from '@mui/icons-material/Work';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  useWorkplaceGapAnalysis,
  useAutoCreateMissingWorkplaces,
} from '../../hooks/usePhysicalWorkplaces';
import { useBuildings } from '../../hooks/useBuildings';
import { WorkplaceType, AutoCreateWorkplacesResult } from '../../types/physicalWorkplace.types';

const WorkplaceGapAnalysisSection = () => {
  const [expanded, setExpanded] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [createResult, setCreateResult] = useState<AutoCreateWorkplacesResult | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [maxToCreate, setMaxToCreate] = useState<number>(25);

  // Data queries
  const { data: gapAnalysis, isLoading, refetch } = useWorkplaceGapAnalysis(undefined, 100);
  const { data: buildings = [] } = useBuildings();
  const autoCreateMutation = useAutoCreateMissingWorkplaces();

  const handleAutoCreate = async () => {
    if (!selectedBuildingId) return;

    try {
      const result = await autoCreateMutation.mutateAsync({
        defaultBuildingId: Number(selectedBuildingId),
        maxToCreate,
        workplaceType: WorkplaceType.Laptop,
        monitorCount: 2,
        hasDockingStation: true,
      });
      setCreateResult(result);
      setCreateDialogOpen(false);
      setResultDialogOpen(true);
    } catch (error) {
      console.error('Failed to auto-create workplaces:', error);
    }
  };

  if (isLoading) {
    return (
      <Card sx={{ mb: 3, bgcolor: 'transparent', border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <CircularProgress size={24} color="inherit" />
            <Typography color="text.secondary">Werkplek analyse laden...</Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (!gapAnalysis) return null;

  const gapPercentage = gapAnalysis.gapPercentage;
  const hasGap = gapAnalysis.ownersWithoutWorkplace > 0;
  const severityColor = gapPercentage > 50 ? 'error' : gapPercentage > 20 ? 'warning' : 'success';

  return (
    <>
      <Card
        sx={{
          mb: 3,
          bgcolor: 'transparent',
          border: '2px solid',
          borderColor: hasGap ? alpha('#009688', 0.5) : 'divider',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ pb: 1 }}>
          {/* Header */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: alpha('#009688', 0.1),
                }}
              >
                <PersonSearchIcon sx={{ color: '#009688' }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Werkplek Gap Analyse
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Laptop & desktop eigenaren zonder werkplek
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton size="small" onClick={() => refetch()} title="Vernieuwen">
                <RefreshIcon />
              </IconButton>
              <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Stack>
          </Stack>

          {/* Summary Stats */}
          <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="primary">
                {gapAnalysis.totalDeviceOwnersInUse}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Toestellen in gebruik
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {gapAnalysis.ownersWithWorkplace}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Met werkplek
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color={hasGap ? 'warning.main' : 'success.main'}>
                {gapAnalysis.ownersWithoutWorkplace}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Zonder werkplek
              </Typography>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: '100%' }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Dekking
                  </Typography>
                  <Typography variant="caption" fontWeight={600} color={severityColor + '.main'}>
                    {(100 - gapPercentage).toFixed(1)}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={100 - gapPercentage}
                  color={severityColor}
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>
            </Box>
          </Stack>

        </CardContent>

        {/* Actions */}
        {hasGap && (
          <CardActions sx={{ px: 2, pb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AutoFixHighIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{
                bgcolor: '#009688',
                '&:hover': { bgcolor: '#00796b' },
              }}
            >
              Ontbrekende werkplekken aanmaken
            </Button>
          </CardActions>
        )}

        {/* Expanded Details */}
        <Collapse in={expanded}>
          <Divider />
          <CardContent>
            {/* Gap by Service */}
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Gap per Dienst
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
              {gapAnalysis.gapsByService.map((gap) => (
                <Chip
                  key={gap.serviceId ?? 'none'}
                  icon={<WorkIcon />}
                  label={`${gap.serviceName}: ${gap.ownersWithoutWorkplace}/${gap.totalDeviceOwners}`}
                  size="small"
                  variant="outlined"
                  color={gap.ownersWithoutWorkplace > 0 ? 'warning' : 'success'}
                />
              ))}
            </Stack>

            {/* Orphan Owners Table */}
            {gapAnalysis.orphanOwners.length > 0 && (
              <>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                  Eigenaren zonder werkplek ({gapAnalysis.orphanOwners.length})
                </Typography>
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    maxHeight: 300,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow
                        sx={{
                          '& th': {
                            bgcolor: (theme) =>
                              theme.palette.mode === 'dark'
                                ? alpha('#009688', 0.15)
                                : alpha('#009688', 0.08),
                            borderBottom: '2px solid #009688',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            py: 1.5,
                          },
                        }}
                      >
                        <TableCell>Eigenaar</TableCell>
                        <TableCell>Dienst</TableCell>
                        <TableCell>Toestel</TableCell>
                        <TableCell>Merk/Model</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {gapAnalysis.orphanOwners.map((orphan, index) => {
                        const isDesktop = orphan.deviceType === 'desktop';
                        return (
                        <TableRow
                          key={orphan.deviceAssetId}
                          sx={{
                            bgcolor: (theme) =>
                              index % 2 === 1
                                ? theme.palette.mode === 'dark'
                                  ? 'rgba(255, 255, 255, 0.02)'
                                  : 'rgba(0, 0, 0, 0.02)'
                                : 'transparent',
                            '&:hover': {
                              bgcolor: (theme) =>
                                theme.palette.mode === 'dark'
                                  ? alpha('#009688', 0.08)
                                  : alpha('#009688', 0.04),
                            },
                          }}
                        >
                          <TableCell sx={{ py: 1, fontSize: '0.85rem' }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box>
                                <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.85rem' }}>
                                  {orphan.ownerName || orphan.ownerEmail}
                                </Typography>
                                {orphan.ownerName && (
                                  <Typography variant="caption" color="text.secondary">
                                    {orphan.ownerEmail}
                                  </Typography>
                                )}
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ py: 1, fontSize: '0.85rem' }}>
                            <Typography sx={{ fontSize: '0.85rem' }}>{orphan.serviceName || '-'}</Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Stack direction="row" spacing={0.75} alignItems="center">
                              {isDesktop ? (
                                <DesktopWindowsIcon fontSize="small" sx={{ color: '#009688' }} />
                              ) : (
                                <LaptopIcon fontSize="small" sx={{ color: '#009688' }} />
                              )}
                              <Typography fontFamily="monospace" sx={{ fontSize: '0.8rem', color: '#009688', fontWeight: 600 }}>
                                {orphan.deviceAssetCode}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ py: 1, fontSize: '0.85rem' }}>
                            <Typography sx={{ fontSize: '0.85rem' }}>
                              {orphan.deviceBrand} {orphan.deviceModel}
                            </Typography>
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </CardContent>
        </Collapse>
      </Card>

      {/* Auto-Create Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#009688' }}>
          Ontbrekende Werkplekken Aanmaken
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Er worden werkplekken aangemaakt voor {gapAnalysis.ownersWithoutWorkplace} eigenaren
            (laptop of desktop) die momenteel geen werkplek hebben. De eigenaar wordt automatisch als occupant ingesteld.
          </Alert>

          <TextField
            select
            fullWidth
            label="Standaard Gebouw"
            value={selectedBuildingId}
            onChange={(e) => setSelectedBuildingId(e.target.value)}
            helperText="Alle nieuwe werkplekken worden aan dit gebouw toegevoegd"
            sx={{ mb: 2, mt: 1 }}
          >
            <MenuItem value="">
              <em>Selecteer gebouw</em>
            </MenuItem>
            {buildings.map((building) => (
              <MenuItem key={building.id} value={String(building.id)}>
                {building.code} - {building.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            type="number"
            fullWidth
            label="Maximum aantal"
            value={maxToCreate}
            onChange={(e) => setMaxToCreate(Math.min(100, Math.max(1, Number(e.target.value))))}
            helperText="Maximum aantal werkplekken om in één keer aan te maken (max 100)"
            inputProps={{ min: 1, max: 100 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)} color="inherit">
            Annuleren
          </Button>
          <Button
            onClick={handleAutoCreate}
            variant="contained"
            disabled={!selectedBuildingId || autoCreateMutation.isPending}
            startIcon={autoCreateMutation.isPending ? <CircularProgress size={16} /> : <AutoFixHighIcon />}
            sx={{ bgcolor: '#009688', '&:hover': { bgcolor: '#00796b' } }}
          >
            {autoCreateMutation.isPending ? 'Aanmaken...' : 'Werkplekken Aanmaken'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Result Dialog */}
      <Dialog
        open={resultDialogOpen}
        onClose={() => setResultDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: createResult?.errorCount === 0 ? 'success.main' : 'warning.main',
          }}
        >
          Werkplekken Aangemaakt
        </DialogTitle>
        <DialogContent>
          {createResult && (
            <>
              <Stack direction="row" spacing={3} sx={{ mb: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main" fontWeight={700}>
                    {createResult.successCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Geslaagd
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main" fontWeight={700}>
                    {createResult.errorCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Fouten
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="text.primary" fontWeight={700}>
                    {createResult.totalProcessed}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Totaal
                  </Typography>
                </Box>
              </Stack>

              {createResult.successCount > 0 && createResult.successCount <= 15 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="success.main" sx={{ mb: 1 }}>
                    Aangemaakt:
                  </Typography>
                  <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {createResult.results
                      .filter((r) => r.success)
                      .map((r) => (
                        <ListItem key={r.workplaceId} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircleIcon color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${r.workplaceCode} - ${r.ownerName || r.ownerEmail}`}
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
                  <Typography variant="subtitle2" color="error.main" sx={{ mb: 1 }}>
                    Fouten:
                  </Typography>
                  <List dense sx={{ maxHeight: 150, overflow: 'auto' }}>
                    {createResult.results
                      .filter((r) => !r.success)
                      .map((r, idx) => (
                        <ListItem key={idx} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <ErrorIcon color="error" fontSize="small" />
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
          <Button onClick={() => setResultDialogOpen(false)} variant="contained">
            Sluiten
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default WorkplaceGapAnalysisSection;

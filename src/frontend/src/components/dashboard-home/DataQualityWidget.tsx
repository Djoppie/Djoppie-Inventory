import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell, TableHead, TableRow,
  Alert, CircularProgress, alpha, useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LocationOffIcon from '@mui/icons-material/LocationOff';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  getDataQualitySummary,
  backfillAssetEmployees,
  backfillAssetWorkplaces,
  type BackfillResult,
} from '../../api/dataQuality.api';

type BackfillKind = 'employees' | 'workplaces';

/**
 * Dashboard card summarising Asset data-quality gaps and offering one-click
 * backfill with a dry-run preview.
 */
const DataQualityWidget = () => {
  const theme = useTheme();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['data-quality', 'summary'],
    queryFn: getDataQualitySummary,
    staleTime: 2 * 60 * 1000,
  });

  const [dialogKind, setDialogKind] = useState<BackfillKind | null>(null);
  const [preview, setPreview] = useState<BackfillResult | null>(null);

  const runMutation = useMutation({
    mutationFn: async ({ kind, dryRun }: { kind: BackfillKind; dryRun: boolean }) =>
      kind === 'employees'
        ? backfillAssetEmployees(dryRun)
        : backfillAssetWorkplaces(dryRun),
    onSuccess: (result, vars) => {
      setPreview(result);
      if (!vars.dryRun) {
        qc.invalidateQueries({ queryKey: ['data-quality'] });
        qc.invalidateQueries({ queryKey: ['reports'] });
      }
    },
  });

  const openDialog = (kind: BackfillKind) => {
    setDialogKind(kind);
    setPreview(null);
    runMutation.mutate({ kind, dryRun: true });
  };

  const closeDialog = () => {
    setDialogKind(null);
    setPreview(null);
    runMutation.reset();
  };

  const commit = () => {
    if (!dialogKind) return;
    runMutation.mutate({ kind: dialogKind, dryRun: false });
  };

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">Kon data-quality overzicht niet laden.</Alert>
        </CardContent>
      </Card>
    );
  }

  const hasIssues = !!data && (data.inUseAssetsWithoutWorkplace > 0 || data.inUseAssetsWithoutEmployee > 0);

  return (
    <>
      <Card sx={{ borderLeft: `3px solid ${hasIssues ? '#FF9800' : '#4CAF50'}` }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            {hasIssues
              ? <WarningAmberIcon sx={{ color: '#FF9800', fontSize: 20 }} />
              : <CheckCircleIcon sx={{ color: '#4CAF50', fontSize: 20 }} />}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Data kwaliteit assets
            </Typography>
          </Stack>

          {isLoading || !data ? (
            <CircularProgress size={20} />
          ) : (
            <>
              <Stack spacing={0.75} sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: data.inUseAssetsWithoutWorkplace > 0 ? '#FF9800' : 'text.secondary' }}>
                  <LocationOffIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {data.inUseAssetsWithoutWorkplace}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    in-gebruik assets zonder werkplek
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: data.inUseAssetsWithoutEmployee > 0 ? '#F44336' : 'text.secondary' }}>
                  <PersonOffIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {data.inUseAssetsWithoutEmployee}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    zonder gekoppelde medewerker
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  (van {data.inUseAssetsTotal} in gebruik totaal)
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AutoFixHighIcon />}
                  disabled={data.employeeBackfillCandidates === 0}
                  onClick={() => openDialog('employees')}
                  sx={{ textTransform: 'none' }}
                >
                  Link medewerkers ({data.employeeBackfillCandidates})
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AutoFixHighIcon />}
                  disabled={data.workplaceBackfillCandidates === 0}
                  onClick={() => openDialog('workplaces')}
                  sx={{ textTransform: 'none' }}
                >
                  Link werkplekken ({data.workplaceBackfillCandidates})
                </Button>
              </Stack>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogKind !== null} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Backfill — {dialogKind === 'employees' ? 'Asset ↔ Medewerker' : 'Asset ↔ Werkplek'} koppelingen
        </DialogTitle>
        <DialogContent dividers>
          {runMutation.isPending && (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={18} /> <Typography variant="body2">Bezig…</Typography>
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
                <Box sx={{ maxHeight: 360, overflow: 'auto', bgcolor: alpha(theme.palette.background.default, 0.4) }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Asset Code</TableCell>
                        {dialogKind === 'employees' && <TableCell>Owner (ruwe string)</TableCell>}
                        {dialogKind === 'employees'
                          ? <TableCell>→ Medewerker</TableCell>
                          : <TableCell>→ Werkplek</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {preview.samples.map(s => (
                        <TableRow key={s.assetId}>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{s.assetCode}</TableCell>
                          {dialogKind === 'employees' && (
                            <TableCell sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>{s.currentOwner || '—'}</TableCell>
                          )}
                          <TableCell>
                            {dialogKind === 'employees'
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
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Sluiten</Button>
          <Button
            variant="contained"
            color="warning"
            disabled={!preview || !preview.dryRun || preview.matched === 0 || runMutation.isPending}
            onClick={commit}
          >
            Uitvoeren ({preview?.matched ?? 0} assets)
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DataQualityWidget;

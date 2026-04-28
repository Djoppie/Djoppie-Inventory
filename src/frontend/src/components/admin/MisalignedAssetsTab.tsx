import { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper,
  alpha,
  CircularProgress,
} from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RefreshIcon from '@mui/icons-material/Refresh';

import NeumorphicDataGrid from './NeumorphicDataGrid';
import {
  scanMisalignedWorkplaceAssets,
  fixMisalignedWorkplaceAssets,
  scanUserAssetsOnWorkplace,
  type MisalignedAssetRow,
  type MisalignedAssetResult,
  type UserAssetOnWorkplaceRow,
} from '../../api/dataQuality.api';

const ACCENT = '#FB8C00';

interface MisalignedRow extends MisalignedAssetRow {
  id: number;
}

interface UserAssetRow extends UserAssetOnWorkplaceRow {
  id: number;
}

const MisalignedAssetsTab = () => {
  const qc = useQueryClient();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lastResult, setLastResult] = useState<MisalignedAssetResult | null>(null);

  const scanQuery = useQuery({
    queryKey: ['data-quality', 'misaligned-workplace-assets'],
    queryFn: scanMisalignedWorkplaceAssets,
    staleTime: 60 * 1000,
  });

  const userAssetsQuery = useQuery({
    queryKey: ['data-quality', 'user-assets-on-workplace'],
    queryFn: scanUserAssetsOnWorkplace,
    staleTime: 60 * 1000,
  });

  const fixMutation = useMutation({
    mutationFn: fixMisalignedWorkplaceAssets,
    onSuccess: (result) => {
      setLastResult(result);
      qc.invalidateQueries({ queryKey: ['data-quality'] });
      qc.invalidateQueries({ queryKey: ['assets'] });
    },
  });

  const dryRows: MisalignedRow[] = useMemo(
    () => (scanQuery.data?.rows ?? []).map((r) => ({ ...r, id: r.assetId })),
    [scanQuery.data],
  );

  const userAssetRows: UserAssetRow[] = useMemo(
    () => (userAssetsQuery.data?.rows ?? []).map((r) => ({ ...r, id: r.assetId })),
    [userAssetsQuery.data],
  );

  const fixableCount = scanQuery.data?.moved ?? 0;
  const skippedCount = scanQuery.data?.skipped ?? 0;
  const scannedCount = scanQuery.data?.scanned ?? 0;

  const misalignedColumns: GridColDef<MisalignedRow>[] = [
    {
      field: 'action',
      headerName: 'Actie',
      width: 130,
      renderCell: (params: GridRenderCellParams<MisalignedRow>) => {
        const isMove = params.row.action === 'move';
        return (
          <Chip
            label={isMove ? 'Verplaatsen' : 'Overslaan'}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.7rem',
              bgcolor: isMove ? alpha('#4CAF50', 0.15) : alpha('#9E9E9E', 0.15),
              color: isMove ? '#388E3C' : '#616161',
              border: `1px solid ${isMove ? alpha('#4CAF50', 0.3) : alpha('#9E9E9E', 0.3)}`,
            }}
          />
        );
      },
    },
    {
      field: 'assetCode',
      headerName: 'Asset code',
      width: 130,
      renderCell: (p: GridRenderCellParams<MisalignedRow>) => (
        <Typography variant="body2" fontFamily="monospace" sx={{ color: '#FF7700', fontWeight: 600 }}>
          {p.value}
        </Typography>
      ),
    },
    {
      field: 'assetTypeName',
      headerName: 'Type',
      width: 140,
      renderCell: (p: GridRenderCellParams<MisalignedRow>) => (
        <Typography variant="body2">{p.value || '—'}</Typography>
      ),
    },
    {
      field: 'assetName',
      headerName: 'Toestel',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'employeeName',
      headerName: 'Huidige medewerker',
      width: 200,
      renderCell: (p: GridRenderCellParams<MisalignedRow>) => (
        <Typography variant="body2">{p.value || '—'}</Typography>
      ),
    },
    {
      field: 'targetWorkplaceCode',
      headerName: 'Doel werkplek',
      width: 160,
      renderCell: (p: GridRenderCellParams<MisalignedRow>) => {
        const code = p.value as string | undefined;
        return code ? (
          <Typography variant="body2" fontFamily="monospace" fontWeight={600} sx={{ color: ACCENT }}>
            {code}
          </Typography>
        ) : (
          <Typography variant="caption" color="text.secondary" fontStyle="italic">
            geen werkplek bekend
          </Typography>
        );
      },
    },
  ];

  const userAssetColumns: GridColDef<UserAssetRow>[] = [
    {
      field: 'assetCode',
      headerName: 'Asset code',
      width: 130,
      renderCell: (p) => (
        <Typography variant="body2" fontFamily="monospace" sx={{ color: '#FF7700', fontWeight: 600 }}>
          {p.value}
        </Typography>
      ),
    },
    {
      field: 'assetTypeName',
      headerName: 'Type',
      width: 140,
      renderCell: (p) => <Typography variant="body2">{p.value || '—'}</Typography>,
    },
    {
      field: 'assetName',
      headerName: 'Toestel',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'employeeName',
      headerName: 'Medewerker (FK)',
      width: 200,
      renderCell: (p) => <Typography variant="body2">{p.value || '—'}</Typography>,
    },
    {
      field: 'physicalWorkplaceCode',
      headerName: 'Werkplek (FK)',
      width: 160,
      renderCell: (p) => (
        <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
          {p.value}
        </Typography>
      ),
    },
    {
      field: 'currentOccupantName',
      headerName: 'Huidige bewoner',
      width: 200,
      renderCell: (p: GridRenderCellParams<UserAssetRow>) => (
        <Typography variant="body2">{p.value || '—'}</Typography>
      ),
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Misaligned workplace-fixed assets */}
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Werkplek-vaste assets gekoppeld aan medewerker
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Monitors, dockings, toetsenborden enz. die foutief aan een medewerker hangen i.p.v. aan een werkplek.
              De fix verzet ze naar de huidige werkplek van die medewerker.
            </Typography>
          </Box>
          <Button
            variant="text"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={() => {
              scanQuery.refetch();
              setLastResult(null);
            }}
          >
            Vernieuw
          </Button>
        </Stack>

        {scanQuery.isLoading && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2">Bezig met scannen…</Typography>
          </Stack>
        )}

        {scanQuery.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Kon scan niet uitvoeren: {(scanQuery.error as Error).message}
          </Alert>
        )}

        {scanQuery.data && (
          <>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              <Chip
                icon={<WarningAmberIcon />}
                label={`${scannedCount} verkeerd gekoppeld`}
                color={scannedCount > 0 ? 'warning' : 'default'}
                sx={{ fontWeight: 700 }}
              />
              <Chip label={`${fixableCount} kan auto-fixen`} color="success" variant="outlined" />
              <Chip label={`${skippedCount} overgeslagen`} variant="outlined" />
            </Stack>

            {lastResult && !lastResult.dryRun && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Fix uitgevoerd: {lastResult.moved} assets verplaatst, {lastResult.skipped} overgeslagen.
              </Alert>
            )}

            {fixableCount > 0 && (
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<AutoFixHighIcon />}
                  disabled={fixMutation.isPending || fixableCount === 0}
                  onClick={() => setConfirmOpen(true)}
                  sx={{ textTransform: 'none' }}
                >
                  Pas fix toe ({fixableCount} assets)
                </Button>
              </Stack>
            )}

            {scannedCount === 0 ? (
              <Alert severity="success">
                Geen werkplek-vaste assets gevonden die aan een medewerker hangen — alles netjes.
              </Alert>
            ) : (
              <NeumorphicDataGrid
                rows={dryRows}
                columns={misalignedColumns as GridColDef[]}
                accentColor={ACCENT}
                loading={scanQuery.isFetching}
                initialPageSize={25}
              />
            )}
          </>
        )}
      </Paper>

      {/* User-assigned assets on workplace (report only) */}
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            Gebruiker-assets foutief op werkplek
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Laptops / desktops / pc's die op een werkplek vastgepind staan. Geen automatische fix omdat de juiste medewerker niet
            zonder context te bepalen is — corrigeer manueel via de asset-detailpagina.
          </Typography>
        </Box>

        {userAssetsQuery.isLoading && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 2 }}>
            <CircularProgress size={18} />
            <Typography variant="body2">Bezig met scannen…</Typography>
          </Stack>
        )}

        {userAssetsQuery.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Kon scan niet uitvoeren: {(userAssetsQuery.error as Error).message}
          </Alert>
        )}

        {userAssetsQuery.data && (
          <>
            {userAssetsQuery.data.total === 0 ? (
              <Alert severity="success">Geen laptops/desktops gevonden die op een werkplek vastgepind zijn.</Alert>
            ) : (
              <>
                <Chip
                  label={`${userAssetsQuery.data.total} gevonden`}
                  color="warning"
                  variant="outlined"
                  sx={{ fontWeight: 700, mb: 2 }}
                />
                <NeumorphicDataGrid
                  rows={userAssetRows}
                  columns={userAssetColumns as GridColDef[]}
                  accentColor={ACCENT}
                  loading={userAssetsQuery.isFetching}
                  initialPageSize={25}
                />
              </>
            )}
          </>
        )}
      </Paper>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Fix toepassen?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>{fixableCount}</strong> werkplek-vaste assets worden verplaatst van hun gekoppelde medewerker
            naar de huidige werkplek van die medewerker. <strong>{skippedCount}</strong> assets blijven ongewijzigd
            omdat de medewerker geen huidige werkplek heeft.
          </DialogContentText>
          <DialogContentText sx={{ mt: 1, fontSize: '0.8rem' }}>
            De wijziging wordt geaudit als <em>OwnerChanged</em> event op elke asset.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Annuleren</Button>
          <Button
            variant="contained"
            color="warning"
            disabled={fixMutation.isPending}
            onClick={async () => {
              await fixMutation.mutateAsync();
              setConfirmOpen(false);
              scanQuery.refetch();
            }}
          >
            {fixMutation.isPending ? 'Bezig…' : `Verplaats ${fixableCount}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MisalignedAssetsTab;

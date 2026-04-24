import { useState, useMemo } from 'react';
import { Box, Chip, alpha, Drawer, Typography, Skeleton, Button } from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import PlaceIcon from '@mui/icons-material/Place';
import LaptopIcon from '@mui/icons-material/Laptop';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import { useEmployeesReport, useEmployeeTimeline } from '../../../hooks/reports';
import NeumorphicDataGrid from '../../admin/NeumorphicDataGrid';
import { ReportErrorState } from '../shared';
import type { EmployeeReportItem } from '../../../types/report.types';

// NeumorphicDataGrid requires T extends { id: number | string }.
// EmployeeReportItem uses `employeeId`, so we extend with an `id` alias.
type EmployeeRow = EmployeeReportItem & { id: number };

const WerkplekkenEmployeeView = () => {
  const { data = [], isLoading, error, refetch } = useEmployeesReport();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Map rows to include `id` for MUI X DataGrid
  const rows: EmployeeRow[] = useMemo(
    () => data.map(e => ({ ...e, id: e.employeeId })),
    [data],
  );

  const columns: GridColDef[] = useMemo(() => [
    { field: 'displayName', headerName: 'Naam', width: 200, flex: 1 },
    {
      field: 'jobTitle',
      headerName: 'Functie',
      width: 160,
      valueGetter: (v: unknown) => v || '-',
    },
    {
      field: 'serviceName',
      headerName: 'Dienst',
      width: 140,
      valueGetter: (v: unknown) => v || '-',
    },
    {
      field: 'workplaceCode',
      headerName: 'Werkplek',
      width: 140,
      renderCell: (p: GridRenderCellParams) =>
        p.value ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#9C27B0', fontWeight: 600, fontSize: '0.8rem' }}>
            <PlaceIcon sx={{ fontSize: 14 }} />
            {p.value}
          </Box>
        ) : (
          <span style={{ color: '#999', fontSize: '0.75rem' }}>—</span>
        ),
    },
    {
      field: 'primaryLaptopCode',
      headerName: 'Laptop',
      width: 210,
      renderCell: (p: GridRenderCellParams<EmployeeRow>) =>
        p.value ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, py: 0.25 }}>
            <LaptopIcon sx={{ fontSize: 16, color: '#2196F3', flexShrink: 0 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, minWidth: 0 }}>
              <Box sx={{ color: '#2196F3', fontWeight: 600, fontSize: '0.78rem', fontFamily: 'monospace' }}>
                {p.row.primaryLaptopSerial || '—'}
              </Box>
              <Box sx={{ fontSize: '0.62rem', color: 'text.secondary', fontFamily: 'monospace', mt: 0.1 }}>
                {p.value}
              </Box>
            </Box>
          </Box>
        ) : (
          <span style={{ color: '#999', fontSize: '0.75rem' }}>—</span>
        ),
    },
    {
      field: 'primaryDesktopCode',
      headerName: 'Desktop',
      width: 210,
      renderCell: (p: GridRenderCellParams<EmployeeRow>) =>
        p.value ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, py: 0.25 }}>
            <DesktopWindowsIcon sx={{ fontSize: 16, color: '#4CAF50', flexShrink: 0 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, minWidth: 0 }}>
              <Box sx={{ color: '#4CAF50', fontWeight: 600, fontSize: '0.78rem', fontFamily: 'monospace' }}>
                {p.row.primaryDesktopSerial || '—'}
              </Box>
              <Box sx={{ fontSize: '0.62rem', color: 'text.secondary', fontFamily: 'monospace', mt: 0.1 }}>
                {p.value}
              </Box>
            </Box>
          </Box>
        ) : (
          <span style={{ color: '#999', fontSize: '0.75rem' }}>—</span>
        ),
    },
    {
      field: 'assetCount',
      headerName: '# Assets',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (p: GridRenderCellParams) => (
        <Chip
          label={p.value}
          size="small"
          sx={{ bgcolor: alpha('#FF7700', 0.1), color: '#FF7700', fontWeight: 700 }}
        />
      ),
    },
    {
      field: 'intuneCompliant',
      headerName: 'Intune ✓',
      width: 100,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'intuneNonCompliant',
      headerName: 'Intune ✗',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (p: GridRenderCellParams) =>
        p.value > 0 ? (
          <Chip label={p.value} size="small" sx={{ bgcolor: alpha('#F44336', 0.1), color: '#F44336' }} />
        ) : (
          <span>-</span>
        ),
    },
    {
      field: 'lastEventDate',
      headerName: 'Laatste event',
      width: 130,
      valueGetter: (v: unknown) => (v ? new Date(v as string).toLocaleDateString('nl-NL') : '-'),
    },
  ], []);

  if (error) return <ReportErrorState onRetry={() => refetch()} message={(error as Error).message} />;

  return (
    <>
      <NeumorphicDataGrid
        rows={rows}
        columns={columns}
        loading={isLoading}
        accentColor="#9C27B0"
        onRowClick={(r: EmployeeRow) => setSelectedId(r.employeeId)}
        initialPageSize={25}
      />
      <EmployeeDetailDrawer employeeId={selectedId} onClose={() => setSelectedId(null)} />
    </>
  );
};

interface DrawerProps { employeeId: number | null; onClose: () => void; }

const EmployeeDetailDrawer = ({ employeeId, onClose }: DrawerProps) => {
  const { data = [], isLoading } = useEmployeeTimeline(employeeId);
  if (!employeeId) return null;
  return (
    <Drawer anchor="right" open={!!employeeId} onClose={onClose}>
      <Box sx={{ width: 420, p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Medewerker timeline</Typography>
        {isLoading ? (
          <Skeleton variant="rounded" height={80} />
        ) : data.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Geen events</Typography>
        ) : (
          data.map(ev => (
            <Box key={ev.eventId} sx={{ borderLeft: `3px solid #9C27B0`, pl: 1, mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {new Date(ev.eventDate).toLocaleString('nl-NL')}
              </Typography>
              <Typography variant="body2">
                [{ev.assetCode}] {ev.description}
              </Typography>
            </Box>
          ))
        )}
        <Button onClick={onClose} fullWidth variant="outlined" sx={{ mt: 2 }}>
          Sluiten
        </Button>
      </Box>
    </Drawer>
  );
};

export default WerkplekkenEmployeeView;

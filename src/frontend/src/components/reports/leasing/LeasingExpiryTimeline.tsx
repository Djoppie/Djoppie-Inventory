import { Paper, Typography, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { LeaseReportRow } from '../../../types/report.types';

interface Props {
  rows: LeaseReportRow[];
}

const LeasingExpiryTimeline = ({ rows }: Props) => {
  const byMonth = new Map<string, number>();
  const now = new Date();

  // 18-month rolling window so users see end dates beyond a year
  for (let i = 0; i < 18; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    byMonth.set(key, 0);
  }

  rows.forEach(row => {
    if (row.leaseStatus !== 'InLease') return;
    const d = new Date(row.plannedLeaseEnd);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (byMonth.has(key)) {
      byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
    }
  });

  const data = Array.from(byMonth.entries()).map(([key, count]) => ({ month: key, count }));

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        Verloop-tijdlijn — komende 18 maanden (# actieve assets)
      </Typography>
      <Box sx={{ width: '100%', height: 200 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={10} />
            <YAxis fontSize={10} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#FB8C00" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default LeasingExpiryTimeline;

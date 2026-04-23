import { Paper, Typography, Box, useTheme } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ActivityTrendPoint } from '../../../types/report.types';

const COLORS = {
  onboarding: '#4CAF50',
  offboarding: '#F44336',
  swap: '#FF7700',
  other: '#9E9E9E',
};

const ActivityTrendChart = ({ data }: { data: ActivityTrendPoint[] }) => {
  const theme = useTheme();
  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        Activiteit — laatste 30 dagen
      </Typography>
      <Box sx={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <AreaChart data={data.map(p => ({ ...p, label: new Date(p.date).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit' }) }))}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis dataKey="label" fontSize={10} />
            <YAxis fontSize={10} allowDecimals={false} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="onboarding"  stackId="1" stroke={COLORS.onboarding}  fill={COLORS.onboarding}  fillOpacity={0.6} name="Onboarding" />
            <Area type="monotone" dataKey="offboarding" stackId="1" stroke={COLORS.offboarding} fill={COLORS.offboarding} fillOpacity={0.6} name="Offboarding" />
            <Area type="monotone" dataKey="swap"        stackId="1" stroke={COLORS.swap}        fill={COLORS.swap}        fillOpacity={0.6} name="Swap" />
            <Area type="monotone" dataKey="other"       stackId="1" stroke={COLORS.other}       fill={COLORS.other}       fillOpacity={0.4} name="Overig" />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default ActivityTrendChart;

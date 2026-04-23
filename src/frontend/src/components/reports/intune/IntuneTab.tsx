import { Box, Grid, Paper, Typography, Button, Skeleton, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useIntuneSummary } from '../../../hooks/reports';
import { ReportErrorState } from '../shared';
import { StatisticsCard } from '../../common';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CloudOffIcon from '@mui/icons-material/CloudOff';

const IntuneTab = () => {
  const { data, isLoading, error, refetch } = useIntuneSummary();

  if (error) return <ReportErrorState onRetry={() => refetch()} message={(error as Error).message} />;
  if (isLoading || !data) return <Stack spacing={1}><Skeleton variant="rounded" height={100} /></Stack>;

  return (
    <Box>
      <Grid container spacing={1}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatisticsCard icon={CheckCircleIcon} label="Compliant" value={data.compliant} color="#4CAF50" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatisticsCard icon={ErrorIcon} label="Non-compliant" value={data.nonCompliant} color="#F44336" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatisticsCard icon={ScheduleIcon} label="Stale (>30d)" value={data.stale} color="#FFC107" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatisticsCard icon={CloudOffIcon} label="Unenrolled" value={data.unenrolled} color="#9E9E9E" />
        </Grid>
      </Grid>
      <Paper sx={{ mt: 2, p: 3, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Uitgebreide Intune-analyses komen binnenkort
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          OS-versie-verdeling, hardware-age analyse, compliance-trend en reconciliatie worden in een volgende fase toegevoegd.
        </Typography>
        <Button component={RouterLink} to="/devices/intune" variant="contained">
          Open bestaand Intune Dashboard
        </Button>
      </Paper>
    </Box>
  );
};

export default IntuneTab;

import { Box, Skeleton, Stack } from '@mui/material';
import { useReportsOverview } from '../../../hooks/reports';
import { ReportErrorState } from '../shared';
import OverviewKpiGrid from './OverviewKpiGrid';
import ActivityTrendChart from './ActivityTrendChart';
import AttentionList from './AttentionList';

const OverviewTab = () => {
  const { data, isLoading, error, refetch } = useReportsOverview();

  if (error) return <ReportErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (isLoading || !data) return (
    <Stack spacing={1}>
      <Skeleton variant="rounded" height={100} />
      <Skeleton variant="rounded" height={240} />
      <Skeleton variant="rounded" height={180} />
    </Stack>
  );

  return (
    <Box>
      <OverviewKpiGrid data={data} />
      <ActivityTrendChart data={data.trend} />
      <AttentionList items={data.attention} />
    </Box>
  );
};

export default OverviewTab;

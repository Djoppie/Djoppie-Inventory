import { Box, Typography, Skeleton, Chip, alpha } from '@mui/material';
import { useAssetTimeline } from '../../../hooks/reports';

const eventColor = (type: string): string => {
  if (type.toLowerCase().includes('status')) return '#2196F3';
  if (type.toLowerCase().includes('owner')) return '#9C27B0';
  if (type.toLowerCase().includes('location')) return '#FF9800';
  if (type.toLowerCase().includes('onboarded')) return '#4CAF50';
  if (type.toLowerCase().includes('offboarded')) return '#F44336';
  return '#757575';
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('nl-NL', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
});

interface Props {
  assetId: number;
  enabled: boolean;
}

const AssetTimelineInline = ({ assetId, enabled }: Props) => {
  const { data = [], isLoading, error } = useAssetTimeline(assetId, enabled);

  if (!enabled) return null;
  if (isLoading) return <Skeleton variant="rounded" height={80} />;
  if (error) return <Typography color="error" variant="caption">Kon timeline niet laden</Typography>;
  if (data.length === 0) return <Typography variant="caption" color="text.secondary">Geen events</Typography>;

  return (
    <Box sx={{ pl: 2, py: 1 }}>
      {data.map(ev => {
        const color = eventColor(ev.eventType);
        return (
          <Box
            key={ev.id}
            sx={{
              borderLeft: `3px solid ${color}`,
              pl: 1,
              mb: 0.5,
              py: 0.25,
              bgcolor: () => alpha(color, 0.05),
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {formatDate(ev.eventDate)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip size="small" label={ev.eventTypeDisplay} sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(color, 0.15), color }} />
              <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                {ev.description}
                {ev.oldValue && ev.newValue && <span style={{ opacity: 0.7 }}> ({ev.oldValue} → {ev.newValue})</span>}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default AssetTimelineInline;

import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { OverviewKpi } from '../../../types/report.types';
import InventoryIcon from '@mui/icons-material/Inventory2';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import BusinessIcon from '@mui/icons-material/Business';
import DescriptionIcon from '@mui/icons-material/Description';
import CloudIcon from '@mui/icons-material/Cloud';
import TimelineIcon from '@mui/icons-material/Timeline';

interface TileProps {
  icon: React.ElementType;
  label: string;
  primary: string;
  secondary?: string;
  color: string;
  onClick?: () => void;
}

const Tile = ({ icon: Icon, label, primary, secondary, color, onClick }: TileProps) => (
  <Card
    role={onClick ? 'button' : undefined}
    aria-label={onClick ? `${label} — klik om te openen` : undefined}
    tabIndex={onClick ? 0 : undefined}
    onClick={onClick}
    onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(); } }}
    sx={{
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      borderLeft: `3px solid ${color}`,
      '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: 3 } : undefined,
    }}
  >
    <CardContent sx={{ pb: '12px !important' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Icon sx={{ fontSize: 18, color }} />
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color }}>
          {label}
        </Typography>
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1 }}>{primary}</Typography>
      {secondary && (
        <Typography variant="caption" color="text.secondary">{secondary}</Typography>
      )}
    </CardContent>
  </Card>
);

const OverviewKpiGrid = ({ data }: { data: OverviewKpi }) => {
  const nav = useNavigate();
  return (
    <Grid container spacing={1}>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <Tile icon={InventoryIcon} label="Assets" color="#FF7700"
          primary={`${data.assets.total}`}
          secondary={`${data.assets.inUsePercentage}% in gebruik · ${data.assets.defect} defect`}
          onClick={() => nav('/reports?tab=assets&view=nu')} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <Tile icon={RocketLaunchIcon} label="Rollouts" color="#F44336"
          primary={`${data.rollouts.activeSessions} actief`}
          secondary={`${data.rollouts.averageCompletionPercentage}% voltooid`}
          onClick={() => nav('/reports?tab=rollouts')} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <Tile icon={BusinessIcon} label="Werkplekken" color="#9C27B0"
          primary={`${data.workplaces.total}`}
          secondary={`${data.workplaces.occupancyPercentage}% bezet`}
          onClick={() => nav('/reports?tab=werkplekken')} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <Tile icon={DescriptionIcon} label="Leasing" color="#FF9800"
          primary={`${data.leasing.activeContracts} lopend`}
          secondary={`${data.leasing.expiringWithin60Days} verlopen <60d`}
          onClick={() => nav('/reports?tab=leasing')} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <Tile icon={CloudIcon} label="Intune" color="#2196F3"
          primary={`${data.intune.enrolled} enrolled`}
          secondary={`${data.intune.stale} stale`}
          onClick={() => nav('/reports?tab=intune')} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <Tile icon={TimelineIcon} label="Activiteit" color="#4CAF50"
          primary={`${data.activity.eventsLast7Days}`}
          secondary="events, 7 dagen"
          onClick={() => nav('/reports?tab=assets&view=history&dateRange=7d')} />
      </Grid>
    </Grid>
  );
};

export default OverviewKpiGrid;

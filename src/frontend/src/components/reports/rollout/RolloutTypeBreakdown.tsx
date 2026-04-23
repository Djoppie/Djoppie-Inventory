import { Grid } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { StatisticsCard } from '../../common';
import type { RolloutMovementType } from '../../../types/report.types';

interface Props {
  counts: Record<RolloutMovementType, number>;
  selected: RolloutMovementType[];
  onToggle: (type: RolloutMovementType) => void;
}

const RolloutTypeBreakdown = ({ counts, selected, onToggle }: Props) => (
  <Grid container spacing={0.75} sx={{ mb: 1 }}>
    <Grid size={{ xs: 6, md: 3 }}>
      <StatisticsCard
        icon={PersonAddIcon}
        label="Onboarding"
        value={counts.Onboarding}
        color="#4CAF50"
        onClick={() => onToggle('Onboarding')}
        isSelected={selected.includes('Onboarding')}
      />
    </Grid>
    <Grid size={{ xs: 6, md: 3 }}>
      <StatisticsCard
        icon={PersonRemoveIcon}
        label="Offboarding"
        value={counts.Offboarding}
        color="#F44336"
        onClick={() => onToggle('Offboarding')}
        isSelected={selected.includes('Offboarding')}
      />
    </Grid>
    <Grid size={{ xs: 6, md: 3 }}>
      <StatisticsCard
        icon={SwapHorizIcon}
        label="Swap"
        value={counts.Swap}
        color="#FF7700"
        onClick={() => onToggle('Swap')}
        isSelected={selected.includes('Swap')}
      />
    </Grid>
    <Grid size={{ xs: 6, md: 3 }}>
      <StatisticsCard
        icon={MoreHorizIcon}
        label="Overig"
        value={counts.Other}
        color="#9E9E9E"
        onClick={() => onToggle('Other')}
        isSelected={selected.includes('Other')}
      />
    </Grid>
  </Grid>
);

export default RolloutTypeBreakdown;

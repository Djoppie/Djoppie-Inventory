import { Grid } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import DevicesIcon from '@mui/icons-material/Devices';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckIcon from '@mui/icons-material/Check';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import { StatisticsCard } from '../../common/StatisticsCard';

const ROLLOUT_COLOR = '#FF7700';
const SUCCESS_COLOR = '#4CAF50';
const ERROR_COLOR = '#F44336';
const INFO_COLOR = '#2196F3';

interface RolloutOverview {
  totalWorkplaces: number;
  completedWorkplaces: number;
  installedAssets: number;
  completionPercentage: number;
  missingQrCodes: number;
}

interface RolloutKpiBarProps {
  overview: RolloutOverview;
}

const RolloutKpiBar: React.FC<RolloutKpiBarProps> = ({ overview }) => (
  <Grid container spacing={0.75} sx={{ mb: 1.25 }}>
    <Grid size={{ xs: 6, sm: 3, md: 2 }}>
      <StatisticsCard
        icon={PeopleIcon}
        value={overview.totalWorkplaces}
        label="Werkplekken"
        color={ROLLOUT_COLOR}
      />
    </Grid>
    <Grid size={{ xs: 6, sm: 3, md: 2 }}>
      <StatisticsCard
        icon={CheckCircleIcon}
        value={overview.completedWorkplaces}
        label="Voltooid"
        color={SUCCESS_COLOR}
      />
    </Grid>
    <Grid size={{ xs: 6, sm: 3, md: 2 }}>
      <StatisticsCard
        icon={DevicesIcon}
        value={overview.installedAssets}
        label="Geïnstalleerd"
        color={SUCCESS_COLOR}
      />
    </Grid>
    <Grid size={{ xs: 6, sm: 3, md: 2 }}>
      <StatisticsCard
        icon={PlayArrowIcon}
        value={`${overview.completionPercentage}%`}
        label="Voortgang"
        color={INFO_COLOR}
        subtitle="Compleet"
      />
    </Grid>
    <Grid size={{ xs: 6, sm: 3, md: 2 }}>
      <StatisticsCard
        icon={overview.missingQrCodes > 0 ? WarningAmberIcon : CheckIcon}
        value={overview.missingQrCodes}
        label="Ontbrekend"
        color={overview.missingQrCodes > 0 ? ERROR_COLOR : SUCCESS_COLOR}
      />
    </Grid>
  </Grid>
);

export default RolloutKpiBar;

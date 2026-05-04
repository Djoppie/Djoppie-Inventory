import { Box, Typography, LinearProgress, useTheme } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { WorkplaceGapAnalysis } from '../../../types/physicalWorkplace.types';

interface GapStatsHeaderProps {
  data: WorkplaceGapAnalysis;
}

const GapStatsHeader = ({ data }: GapStatsHeaderProps) => {
  const theme = useTheme();
  const { totalDeviceOwnersInUse, ownersWithWorkplace, ownersWithoutWorkplace, gapPercentage } =
    data;
  const coveragePercent = 100 - gapPercentage;
  const hasGap = ownersWithoutWorkplace > 0;

  const progressColor =
    gapPercentage > 50 ? '#f44336' : gapPercentage > 20 ? '#FF7700' : '#009688';

  if (!hasGap) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 0.5,
          py: 1,
          color: theme.palette.success.main,
        }}
      >
        <CheckCircleOutlineIcon fontSize="small" />
        <Typography variant="body2" fontWeight={600}>
          Alle {totalDeviceOwnersInUse} eigenaren hebben een werkplek
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 2,
        alignItems: 'end',
      }}
    >
      <StatBlock
        value={totalDeviceOwnersInUse}
        label="Toestellen in gebruik"
        color={theme.palette.text.primary}
      />
      <StatBlock
        value={ownersWithWorkplace}
        label="Met werkplek"
        color={theme.palette.success.main}
      />
      <StatBlock
        value={ownersWithoutWorkplace}
        label="Zonder werkplek"
        color={hasGap ? '#FF7700' : theme.palette.success.main}
      />

      {/* Coverage progress — spans remaining columns on wide screens */}
      <Box sx={{ gridColumn: 'span 1', minWidth: 120 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 0.5,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Dekking
          </Typography>
          <Typography
            variant="caption"
            fontWeight={700}
            sx={{ color: progressColor }}
          >
            {coveragePercent.toFixed(1)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={coveragePercent}
          sx={{
            height: 7,
            borderRadius: 4,
            bgcolor: theme.palette.action.hover,
            '& .MuiLinearProgress-bar': {
              bgcolor: progressColor,
              borderRadius: 4,
            },
          }}
        />
      </Box>
    </Box>
  );
};

const StatBlock = ({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) => (
  <Box>
    <Typography
      variant="h5"
      fontWeight={700}
      lineHeight={1}
      sx={{ color, mb: 0.25 }}
    >
      {value}
    </Typography>
    <Typography variant="caption" color="text.secondary" display="block">
      {label}
    </Typography>
  </Box>
);

export default GapStatsHeader;

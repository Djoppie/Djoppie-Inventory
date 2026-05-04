import { useState } from 'react';
import { Box, Chip, Typography, Button, alpha, useTheme } from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { WorkplaceGapByService } from '../../../types/physicalWorkplace.types';

const MAX_VISIBLE = 8;

interface GapByServiceChipsProps {
  gaps: WorkplaceGapByService[];
}

const GapByServiceChips = ({ gaps }: GapByServiceChipsProps) => {
  const theme = useTheme();
  const [showAll, setShowAll] = useState(false);

  // Sort by gap count descending so the worst offenders are first
  const sorted = [...gaps].sort(
    (a, b) => b.ownersWithoutWorkplace - a.ownersWithoutWorkplace
  );

  const visible = showAll ? sorted : sorted.slice(0, MAX_VISIBLE);
  const remaining = sorted.length - MAX_VISIBLE;

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
        Gap per Dienst
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {visible.map((gap) => {
          const hasGap = gap.ownersWithoutWorkplace > 0;
          return (
            <Chip
              key={gap.serviceId ?? 'none'}
              icon={
                <WorkIcon
                  sx={{
                    fontSize: '0.85rem !important',
                    color: hasGap ? '#FF7700 !important' : undefined,
                  }}
                />
              }
              label={
                <span>
                  <strong>{gap.serviceName ?? 'Geen dienst'}</strong>
                  {' — '}
                  <span
                    style={{
                      color: hasGap
                        ? '#FF7700'
                        : theme.palette.success.main,
                      fontWeight: hasGap ? 700 : 400,
                    }}
                  >
                    {gap.ownersWithoutWorkplace}
                  </span>
                  <span style={{ color: theme.palette.text.secondary }}>
                    /{gap.totalDeviceOwners}
                  </span>
                </span>
              }
              size="small"
              variant="outlined"
              sx={{
                height: 26,
                fontSize: '0.72rem',
                borderColor: hasGap
                  ? alpha('#FF7700', 0.35)
                  : theme.palette.divider,
                bgcolor: hasGap
                  ? alpha('#FF7700', 0.06)
                  : 'transparent',
                '& .MuiChip-label': { px: 1 },
              }}
            />
          );
        })}

        {!showAll && remaining > 0 && (
          <Button
            size="small"
            variant="text"
            endIcon={<ExpandMoreIcon sx={{ fontSize: '0.85rem' }} />}
            onClick={() => setShowAll(true)}
            sx={{
              fontSize: '0.72rem',
              height: 26,
              px: 1,
              color: 'text.secondary',
              minWidth: 0,
            }}
          >
            +{remaining} meer
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default GapByServiceChips;

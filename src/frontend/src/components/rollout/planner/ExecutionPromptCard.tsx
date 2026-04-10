import { Box, Card, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import type { RolloutSession, RolloutDay } from '../../../types/rollout';
import { ASSET_COLOR } from '../../../constants/filterColors';
import { buildRoute } from '../../../constants/routes';

interface ExecutionPromptCardProps {
  session: RolloutSession;
  days: RolloutDay[];
}

export default function ExecutionPromptCard({ session, days }: ExecutionPromptCardProps) {
  const navigate = useNavigate();

  // Only show when session can be executed
  if (session.status !== 'Ready' && session.status !== 'Planning') {
    return null;
  }

  if (!days || days.length === 0) {
    return null;
  }

  const totalWorkplaces = days.reduce((sum, d) => sum + d.totalWorkplaces, 0);
  const completedWorkplaces = days.reduce((sum, d) => sum + d.completedWorkplaces, 0);

  const getMessage = () => {
    if (completedWorkplaces > 0) {
      return `${completedWorkplaces} van ${totalWorkplaces} werkplekken voltooid. Ga door met de uitvoering.`;
    }
    return `${totalWorkplaces} werkplek${totalWorkplaces !== 1 ? 'ken' : ''} gepland over ${days.length} planning${days.length !== 1 ? 's' : ''}. Start de uitvoering wanneer je klaar bent.`;
  };

  return (
    <Card
      elevation={0}
      sx={{
        mb: 3,
        p: 3,
        border: '2px solid ${ASSET_COLOR}',
        borderRadius: 3,
        background: 'linear-gradient(135deg, rgba(255, 119, 0, 0.08) 0%, rgba(255, 119, 0, 0.02) 100%)',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 2,
      }}
    >
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h6" fontWeight={700} sx={{ color: ASSET_COLOR, mb: 0.5 }}>
          Klaar om te starten?
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {getMessage()}
        </Typography>
      </Box>
      <Button
        variant="contained"
        size="large"
        startIcon={<PlayArrowIcon />}
        onClick={() => navigate(buildRoute.rolloutExecute(session.id))}
        sx={{
          bgcolor: ASSET_COLOR,
          px: 4,
          py: 1.5,
          fontSize: '1rem',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          '&:hover': { bgcolor: '#e66a00' },
        }}
      >
        Start Uitvoering
      </Button>
    </Card>
  );
}

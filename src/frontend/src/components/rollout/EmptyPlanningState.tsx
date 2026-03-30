import { Box, Paper, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { ASSET_COLOR } from '../../constants/filterColors';

interface EmptyPlanningStateProps {
  onAddPlanning: () => void;
  disabled?: boolean;
}

/**
 * Empty state component for rollout planning page
 */
const EmptyPlanningState = ({ onAddPlanning, disabled }: EmptyPlanningStateProps) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 6,
        textAlign: 'center',
        border: '2px dashed',
        borderColor: 'rgba(255, 119, 0, 0.3)',
        borderRadius: 3,
        bgcolor: 'rgba(255, 119, 0, 0.02)',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: 'rgba(255, 119, 0, 0.5)',
          bgcolor: 'rgba(255, 119, 0, 0.04)',
        },
      }}
    >
      {/* Icon */}
      <Box
        sx={{
          width: 80,
          height: 80,
          mx: 'auto',
          mb: 3,
          borderRadius: '50%',
          bgcolor: 'rgba(255, 119, 0, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: '2px solid',
            borderColor: 'rgba(255, 119, 0, 0.2)',
            animation: 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          },
          '@keyframes pulse-ring': {
            '0%': {
              transform: 'scale(1)',
              opacity: 1,
            },
            '100%': {
              transform: 'scale(1.5)',
              opacity: 0,
            },
          },
        }}
      >
        <CalendarTodayIcon
          sx={{
            fontSize: 40,
            color: ASSET_COLOR,
          }}
        />
      </Box>

      {/* Message */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: 'text.primary',
          mb: 1,
        }}
      >
        Nog geen planningen
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          mb: 3,
          maxWidth: 400,
          mx: 'auto',
        }}
      >
        Begin met het toevoegen van planning batches voor deze rollout sessie.
        Elke planning kan meerdere werkplekken bevatten en kan worden verzet indien nodig.
      </Typography>

      {/* Action Button */}
      <Button
        variant="contained"
        size="large"
        startIcon={<AddIcon />}
        onClick={onAddPlanning}
        disabled={disabled}
        sx={{
          bgcolor: ASSET_COLOR,
          px: 4,
          py: 1.5,
          fontSize: '1rem',
          fontWeight: 700,
          boxShadow: '0 4px 14px rgba(255, 119, 0, 0.3)',
          '&:hover': {
            bgcolor: '#e66a00',
            boxShadow: '0 6px 20px rgba(255, 119, 0, 0.4)',
          },
          '&:disabled': {
            bgcolor: 'rgba(255, 119, 0, 0.3)',
            boxShadow: 'none',
          },
          transition: 'all 0.3s ease',
        }}
      >
        Eerste Planning Toevoegen
      </Button>

      {/* Helper Text */}
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mt: 2,
          color: 'text.secondary',
          fontStyle: 'italic',
        }}
      >
        Tip: Je kunt later ook werkplekken importeren vanuit Azure AD
      </Typography>
    </Paper>
  );
};

export default EmptyPlanningState;

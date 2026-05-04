import {
  Box,
  Button,
  Chip,
  Stack,
  Slide,
  alpha,
  useTheme,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';

interface WorkplacesBulkActionBarProps {
  count: number;
  onBulkEdit: () => void;
  onBulkDelete: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onClear: () => void;
  isDeleting: boolean;
}

/**
 * Floating action region that appears at the top of the viewport when workplaces are selected.
 * Position: fixed (truly floating, detached from page flow). Slides in from above.
 */
const WorkplacesBulkActionBar = ({
  count,
  onBulkEdit,
  onBulkDelete,
  onActivate,
  onDeactivate,
  onClear,
  isDeleting,
}: WorkplacesBulkActionBarProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Slide direction="down" in={count > 0} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          top: { xs: 80, sm: 96 },
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1300,
          width: 'auto',
          maxWidth: 'calc(100vw - 32px)',
          borderRadius: 999,
          py: 1,
          px: 2,
          bgcolor: isDark ? alpha('#0f1f1e', 0.96) : alpha('#ffffff', 0.98),
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '2px solid',
          borderColor: '#009688',
          boxShadow: isDark
            ? '0 12px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,150,136,0.25)'
            : '0 12px 40px rgba(0,150,136,0.35), 0 4px 12px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          flexWrap: 'wrap',
        }}
      >
        {/* Count Badge */}
        <Chip
          label={`${count} geselecteerd`}
          size="small"
          sx={{
            fontWeight: 700,
            bgcolor: alpha('#009688', 0.15),
            color: '#009688',
            border: '1px solid',
            borderColor: alpha('#009688', 0.3),
            height: 28,
          }}
        />

        <Box sx={{ flex: 1 }} />

        <Stack direction="row" spacing={1} flexWrap="wrap">
          {/* Bulk Edit */}
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditIcon sx={{ fontSize: 16 }} />}
            onClick={onBulkEdit}
            sx={{
              borderColor: '#009688',
              color: '#009688',
              fontWeight: 600,
              fontSize: '0.78rem',
              height: 32,
              px: 1.5,
              '&:hover': {
                bgcolor: alpha('#009688', 0.08),
                borderColor: '#009688',
              },
            }}
          >
            Bewerken
          </Button>

          {/* Activate */}
          <Button
            size="small"
            variant="outlined"
            startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
            onClick={onActivate}
            sx={{
              borderColor: '#4CAF50',
              color: '#4CAF50',
              fontWeight: 600,
              fontSize: '0.78rem',
              height: 32,
              px: 1.5,
              '&:hover': {
                bgcolor: alpha('#4CAF50', 0.08),
                borderColor: '#4CAF50',
              },
            }}
          >
            Activeren
          </Button>

          {/* Deactivate */}
          <Button
            size="small"
            variant="outlined"
            startIcon={<CancelIcon sx={{ fontSize: 16 }} />}
            onClick={onDeactivate}
            sx={{
              borderColor: '#FF5722',
              color: '#FF5722',
              fontWeight: 600,
              fontSize: '0.78rem',
              height: 32,
              px: 1.5,
              '&:hover': {
                bgcolor: alpha('#FF5722', 0.08),
                borderColor: '#FF5722',
              },
            }}
          >
            Deactiveren
          </Button>

          {/* Delete */}
          <Button
            size="small"
            variant="contained"
            startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
            onClick={onBulkDelete}
            disabled={isDeleting}
            sx={{
              bgcolor: '#EF5350',
              fontWeight: 600,
              fontSize: '0.78rem',
              height: 32,
              px: 1.5,
              '&:hover': { bgcolor: '#d32f2f' },
            }}
          >
            {isDeleting ? 'Verwijderen...' : 'Verwijderen'}
          </Button>

          {/* Clear selection */}
          <Button
            size="small"
            variant="text"
            startIcon={<CloseIcon sx={{ fontSize: 14 }} />}
            onClick={onClear}
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              fontSize: '0.78rem',
              height: 32,
              px: 1,
              minWidth: 0,
            }}
          >
            Selectie wissen
          </Button>
        </Stack>
      </Box>
    </Slide>
  );
};

export default WorkplacesBulkActionBar;

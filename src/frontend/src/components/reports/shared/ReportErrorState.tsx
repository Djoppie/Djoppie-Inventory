import { Box, Typography, Button, Stack, alpha } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';
import { Link as RouterLink } from 'react-router-dom';

interface ReportErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  homeHref?: string;
}

const trim = (s: string, n = 200) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

const ReportErrorState = ({
  title = 'Kon rapport niet laden',
  message = '',
  onRetry,
  homeHref = '/reports?tab=overview',
}: ReportErrorStateProps) => (
  <Box
    sx={{
      p: 4,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      bgcolor: (theme) => alpha(theme.palette.error.main, 0.03),
      border: '1px dashed',
      borderColor: (theme) => alpha(theme.palette.error.main, 0.3),
      borderRadius: 2,
      textAlign: 'center',
    }}
  >
    <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main' }} />
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {trim(message)}
        </Typography>
      )}
    </Box>
    <Stack direction="row" spacing={1}>
      {onRetry && (
        <Button variant="contained" color="error" startIcon={<RefreshIcon />} onClick={onRetry}>
          Opnieuw proberen
        </Button>
      )}
      <Button component={RouterLink} to={homeHref} variant="outlined" startIcon={<HomeIcon />}>
        Overzicht
      </Button>
    </Stack>
  </Box>
);

export default ReportErrorState;

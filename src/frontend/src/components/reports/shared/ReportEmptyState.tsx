import { Box, Typography, Button, alpha } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

interface ReportEmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const ReportEmptyState = ({
  title = 'Geen resultaten',
  message = 'Geen data gevonden met de huidige filters.',
  actionLabel,
  onAction,
}: ReportEmptyStateProps) => (
  <Box
    sx={{
      p: 4,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      bgcolor: (theme) => alpha(theme.palette.info.main, 0.03),
      border: '1px dashed',
      borderColor: (theme) => alpha(theme.palette.info.main, 0.25),
      borderRadius: 2,
      textAlign: 'center',
    }}
  >
    <InboxIcon sx={{ fontSize: 48, color: 'info.main' }} />
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {message}
      </Typography>
    </Box>
    {actionLabel && onAction && (
      <Button variant="outlined" color="info" onClick={onAction}>{actionLabel}</Button>
    )}
  </Box>
);

export default ReportEmptyState;

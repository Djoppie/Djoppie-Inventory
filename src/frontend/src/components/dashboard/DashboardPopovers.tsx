import { Box, Popover, Typography, TextField, IconButton, Tooltip, alpha, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CommentIcon from '@mui/icons-material/Comment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ClearIcon from '@mui/icons-material/Clear';
interface DashboardPopoversProps {
  // Notes popover
  notesAnchor: HTMLElement | null;
  onNotesClose: () => void;
  discussionText: string;
  onDiscussionTextChange: (text: string) => void;
  // Alarms popover
  alarmsAnchor: HTMLElement | null;
  onAlarmsClose: () => void;
}

export default function DashboardPopovers({
  notesAnchor,
  onNotesClose,
  discussionText,
  onDiscussionTextChange,
  alarmsAnchor,
  onAlarmsClose,
}: DashboardPopoversProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const popoverPaperSx = {
    mt: 1,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 2,
    boxShadow: theme.palette.mode === 'dark'
      ? '0 8px 32px rgba(0,0,0,0.5)'
      : '0 8px 32px rgba(0,0,0,0.12)',
  };

  return (
    <>
      {/* Discussion & Notes Popover */}
      <Popover
        open={Boolean(notesAnchor)}
        anchorEl={notesAnchor}
        onClose={onNotesClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              ...popoverPaperSx,
              width: { xs: 340, sm: 400 },
            },
          },
        }}
      >
        <Box sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CommentIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight={700} color="primary.main">
              Discussion & Notes
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            Add notes or observations about the current inventory status. Stored locally in your browser.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={5}
            placeholder="Enter your notes here..."
            value={discussionText}
            onChange={(e) => onDiscussionTextChange(e.target.value)}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: 'primary.main' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main' },
              },
            }}
          />
          {discussionText && (
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {discussionText.length} characters
              </Typography>
              <Tooltip title="Clear all notes">
                <IconButton
                  size="small"
                  onClick={() => onDiscussionTextChange('')}
                  sx={{ color: 'error.main' }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      </Popover>

      {/* Alarms & Requests Popover */}
      <Popover
        open={Boolean(alarmsAnchor)}
        anchorEl={alarmsAnchor}
        onClose={onAlarmsClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              ...popoverPaperSx,
              width: { xs: 300, sm: 360 },
            },
          },
        }}
      >
        <Box sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <NotificationsIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight={700} color="primary.main">
              {t('dashboard.alarms', { defaultValue: 'Alarms & Requests' })}
            </Typography>
          </Box>
          <Box
            sx={{
              py: 4,
              textAlign: 'center',
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: alpha(theme.palette.background.default, 0.5),
            }}
          >
            <NotificationsIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {t('dashboard.noAlarms', { defaultValue: 'No upcoming alarms or requests' })}
            </Typography>
          </Box>
        </Box>
      </Popover>
    </>
  );
}

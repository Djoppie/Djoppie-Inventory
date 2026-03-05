import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface AdminFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  children: React.ReactNode;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const AdminFormDialog = ({
  open,
  onClose,
  onSubmit,
  title,
  children,
  isSubmitting = false,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  maxWidth = 'sm',
}: AdminFormDialogProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: {
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: isMobile ? 0 : 2,
          boxShadow:
            theme.palette.mode === 'light'
              ? '10px 10px 20px rgba(0, 0, 0, 0.18), -10px -10px 20px rgba(255, 255, 255, 0.95)'
              : '14px 14px 28px rgba(0, 0, 0, 0.85), -7px -7px 16px rgba(255, 255, 255, 0.07)',
        },
      }}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor:
              theme.palette.mode === 'dark'
                ? 'rgba(255, 119, 0, 0.05)'
                : 'rgba(255, 119, 0, 0.02)',
            borderBottom: '1px solid',
            borderColor: 'divider',
            background:
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(255, 119, 0, 0.08) 0%, transparent 100%)'
                : 'linear-gradient(135deg, rgba(255, 119, 0, 0.06) 0%, transparent 100%)',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              letterSpacing: '0.02em',
            }}
          >
            {title}
          </Typography>
          <IconButton
            size="small"
            onClick={onClose}
            edge="end"
            sx={{
              color: 'text.secondary',
              transition: 'all 0.2s ease',
              '&:hover': {
                color: 'primary.main',
                transform: 'rotate(90deg)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ mt: 2, pb: 2 }}>{children}</DialogContent>

        <DialogActions
          sx={{
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            background:
              theme.palette.mode === 'dark'
                ? 'rgba(0, 0, 0, 0.2)'
                : 'rgba(0, 0, 0, 0.02)',
          }}
        >
          <Button
            onClick={onClose}
            color="inherit"
            sx={{
              fontWeight: 600,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={{
              fontWeight: 600,
              background: 'linear-gradient(145deg, #FF9233, #FF7700)',
              boxShadow:
                theme.palette.mode === 'light'
                  ? '6px 6px 12px rgba(0, 0, 0, 0.15), -6px -6px 12px rgba(255, 255, 255, 0.95)'
                  : '8px 8px 18px rgba(0, 0, 0, 0.75), -5px -5px 12px rgba(255, 255, 255, 0.06)',
              '&:hover': {
                background: 'linear-gradient(145deg, #FFAD66, #FF9233)',
                boxShadow:
                  theme.palette.mode === 'light'
                    ? '10px 10px 20px rgba(0, 0, 0, 0.18), -10px -10px 20px rgba(255, 255, 255, 0.95), 0 8px 24px rgba(255, 119, 0, 0.4)'
                    : '0 20px 40px rgba(0, 0, 0, 0.9), 0 10px 20px rgba(0, 0, 0, 0.75), -6px -6px 15px rgba(255, 255, 255, 0.05)',
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
              },
            }}
          >
            {isSubmitting ? 'Saving...' : submitLabel}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default AdminFormDialog;

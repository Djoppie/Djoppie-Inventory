import { ReactNode, useMemo } from 'react';
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Stack,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonOffIcon from '@mui/icons-material/PersonOff';

type DialogVariant = 'delete' | 'warning' | 'info';

interface NeomorphConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  warning?: string;
  confirmText: string;
  cancelText: string;
  isLoading?: boolean;
  variant?: DialogVariant;
  icon?: 'delete' | 'person-off' | 'warning';
}

const NeomorphConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  warning,
  confirmText,
  cancelText,
  isLoading = false,
  variant = 'delete',
  icon = 'warning',
}: NeomorphConfirmDialogProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Neomorph styling constants
  const neomorphBoxShadow = isDark
    ? '6px 6px 12px #161a1d, -6px -6px 12px #262c33'
    : '6px 6px 12px #c5cad0, -6px -6px 12px #ffffff';
  const neomorphInsetShadow = isDark
    ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
    : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff';
  const bgColor = isDark ? '#1e2328' : '#e8eef3';

  // Variant-specific colors
  const variantColors = {
    delete: {
      accent: theme.palette.error.main,
      accentDark: theme.palette.error.dark,
      headerBg: isDark ? 'rgba(244, 67, 54, 0.15)' : 'rgba(244, 67, 54, 0.08)',
    },
    warning: {
      accent: theme.palette.warning.main,
      accentDark: theme.palette.warning.dark,
      headerBg: isDark ? 'rgba(255, 152, 0, 0.15)' : 'rgba(255, 152, 0, 0.08)',
    },
    info: {
      accent: '#FF7700',
      accentDark: '#e66a00',
      headerBg: isDark ? 'rgba(255, 119, 0, 0.15)' : 'rgba(255, 119, 0, 0.08)',
    },
  };

  const colors = variantColors[variant];

  // Icon element based on type - using useMemo to avoid recreating on every render
  const iconElement = useMemo(() => {
    switch (icon) {
      case 'delete':
        return <DeleteIcon sx={{ color: colors.accent, fontSize: 28 }} />;
      case 'person-off':
        return <PersonOffIcon sx={{ color: colors.accent, fontSize: 28 }} />;
      default:
        return <WarningAmberIcon sx={{ color: colors.accent, fontSize: 28 }} />;
    }
  }, [icon, colors.accent]);

  // Neomorph button styling
  const neomorphButtonSx = {
    backgroundColor: bgColor,
    boxShadow: neomorphBoxShadow,
    borderRadius: 2,
    border: 'none',
    color: isDark ? '#fff' : '#333',
    textTransform: 'none' as const,
    fontWeight: 600,
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: bgColor,
      boxShadow: isDark
        ? '4px 4px 8px #161a1d, -4px -4px 8px #262c33'
        : '4px 4px 8px #c5cad0, -4px -4px 8px #ffffff',
      transform: 'translateY(-1px)',
    },
    '&:active': {
      boxShadow: neomorphInsetShadow,
      transform: 'translateY(0)',
    },
  };

  const neomorphConfirmButtonSx = {
    ...neomorphButtonSx,
    backgroundColor: colors.accent,
    color: '#fff',
    '&:hover': {
      backgroundColor: colors.accentDark,
      boxShadow: isDark
        ? `4px 4px 8px #161a1d, -4px -4px 8px #262c33, 0 0 20px ${colors.accent}66`
        : `4px 4px 8px #c5cad0, -4px -4px 8px #ffffff, 0 0 20px ${colors.accent}4d`,
      transform: 'translateY(-1px)',
    },
    '&.Mui-disabled': {
      backgroundColor: colors.accent,
      opacity: 0.6,
      color: '#fff',
    },
  };

  const neomorphIconButtonSx = {
    backgroundColor: bgColor,
    boxShadow: neomorphBoxShadow,
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: bgColor,
      boxShadow: neomorphInsetShadow,
    },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          boxShadow: neomorphBoxShadow,
          backgroundColor: bgColor,
          backgroundImage: 'none',
          border: 'none',
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          background: isDark
            ? `linear-gradient(135deg, ${bgColor} 0%, #252a30 100%)`
            : `linear-gradient(135deg, ${bgColor} 0%, #dde4eb 100%)`,
          borderBottom: `2px solid ${colors.accent}`,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.headerBg,
                boxShadow: neomorphBoxShadow,
              }}
            >
              {iconElement}
            </Box>
            <Typography variant="h6" fontWeight={700} color="text.primary">
              {title}
            </Typography>
          </Stack>
          <IconButton onClick={onClose} size="small" sx={neomorphIconButtonSx}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            backgroundColor: bgColor,
            boxShadow: neomorphInsetShadow,
          }}
        >
          {typeof message === 'string' ? (
            <Typography variant="body1" color="text.primary">
              {message}
            </Typography>
          ) : (
            message
          )}

          {warning && (
            <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
              {warning}
            </Alert>
          )}
        </Box>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 3,
          pt: 0,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2,
        }}
      >
        <Box
          component="button"
          onClick={onClose}
          disabled={isLoading}
          sx={{
            ...neomorphButtonSx,
            px: 3,
            py: 1.5,
            cursor: 'pointer',
          }}
        >
          {cancelText}
        </Box>
        <Box
          component="button"
          onClick={onConfirm}
          disabled={isLoading}
          sx={{
            ...neomorphConfirmButtonSx,
            px: 3,
            py: 1.5,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {isLoading && <CircularProgress size={16} sx={{ color: '#fff' }} />}
          {confirmText}
        </Box>
      </Box>
    </Dialog>
  );
};

export default NeomorphConfirmDialog;

import { Box, Typography, Paper, Button, List, ListItem, ListItemIcon, ListItemText, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import CodeIcon from '@mui/icons-material/Code';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

interface ApiErrorDisplayProps {
  onRetry?: () => void;
}

const ApiErrorDisplay = ({ onRetry }: ApiErrorDisplayProps) => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        p: 3,
      }}
    >
      <Paper
        sx={{
          p: 4,
          maxWidth: 700,
          width: '100%',
          border: '2px solid',
          borderColor: 'error.main',
          bgcolor: 'background.paper',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          {/* Error Icon */}
          <ErrorOutlineIcon
            sx={{
              fontSize: 64,
              color: 'error.main',
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.6 },
              },
            }}
          />

          {/* Error Title */}
          <Typography
            variant="h5"
            sx={{
              color: 'error.main',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textAlign: 'center',
            }}
          >
            {t('errors.apiNotRunning')}
          </Typography>

          {/* Error Description */}
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ textAlign: 'center', mb: 2 }}
          >
            {t('errors.apiNotRunningDesc')}
          </Typography>

          {/* Instructions */}
          <Box sx={{ width: '100%', mt: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, mb: 2, color: 'warning.main' }}
            >
              {t('errors.startBackend')}
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
              {t('errors.startBackendSteps')}
            </Alert>

            <List dense sx={{ bgcolor: 'background.default', borderRadius: 1, p: 2 }}>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 20, color: 'success.main' }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2">
                      {t('errors.step1')}
                    </Typography>
                  }
                />
              </ListItem>

              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 20, color: 'success.main' }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2">
                      {t('errors.step2')}
                    </Typography>
                  }
                />
              </ListItem>

              <ListItem sx={{ py: 0.5, pl: 5 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1,
                    bgcolor: 'background.paper',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    width: '100%',
                  }}
                >
                  <CodeIcon sx={{ fontSize: 14, mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
                  cd src/backend
                </Paper>
              </ListItem>

              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 20, color: 'success.main' }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2">
                      {t('errors.step3')}
                    </Typography>
                  }
                />
              </ListItem>

              <ListItem sx={{ py: 0.5, pl: 5 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1,
                    bgcolor: 'background.paper',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    width: '100%',
                  }}
                >
                  <PlayArrowIcon sx={{ fontSize: 14, mr: 1, verticalAlign: 'middle', color: 'success.main' }} />
                  dotnet run --project DjoppieInventory.API
                </Paper>
              </ListItem>

              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 20, color: 'success.main' }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2">
                      {t('errors.step4')}
                    </Typography>
                  }
                />
              </ListItem>

              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 20, color: 'success.main' }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2">
                      {t('errors.step5')}
                    </Typography>
                  }
                />
              </ListItem>
            </List>
          </Box>

          {/* Retry Button */}
          {onRetry && (
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
              size="large"
              sx={{ mt: 2 }}
            >
              {t('common.tryAgain')}
            </Button>
          )}

          {/* Alternative Note */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 2,
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              textAlign: 'center',
            }}
          >
            {t('errors.alternative')}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default ApiErrorDisplay;

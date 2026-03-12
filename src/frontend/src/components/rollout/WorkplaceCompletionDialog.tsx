import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Alert,
  Chip,
  Divider,
  Fade,
  Grow,
  LinearProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LaptopIcon from '@mui/icons-material/Laptop';
import type { RolloutWorkplace } from '../../types/rollout';

interface WorkplaceCompletionDialogProps {
  open: boolean;
  workplace: RolloutWorkplace;
  onClose: () => void;
  onComplete: (notes?: string) => Promise<void>;
  isCompleting: boolean;
}

/**
 * Enhanced Workplace Completion Dialog
 *
 * Design Features:
 * - Swap visualization showing old → new equipment flow
 * - Status-aware styling with gradient backgrounds
 * - Micro-animations for completion celebration
 * - Clear action summary for reporting
 */
const WorkplaceCompletionDialog = ({
  open,
  workplace,
  onClose,
  onComplete,
  isCompleting,
}: WorkplaceCompletionDialogProps) => {
  const [notes, setNotes] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);

  const handleComplete = async () => {
    await onComplete(notes || undefined);
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
      setNotes('');
    }, 2000);
  };

  // Extract swap information
  const swapItems = workplace.assetPlans.filter((p) => p.oldAssetId && p.existingAssetId);
  const newItems = workplace.assetPlans.filter((p) => p.existingAssetId && !p.oldAssetId);
  const hasSwaps = swapItems.length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableRestoreFocus
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          border: '2px solid',
          borderColor: 'success.main',
          background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.02) 0%, transparent 100%)',
        },
      }}
    >
      {/* Celebration Overlay */}
      {showCelebration && (
        <Fade in timeout={400}>
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(22, 163, 74, 0.95)',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <Grow in timeout={600}>
              <CheckCircleIcon
                sx={{
                  fontSize: 120,
                  color: '#fff',
                  filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.5))',
                }}
              />
            </Grow>
            <Typography
              variant="h4"
              sx={{
                color: '#fff',
                fontWeight: 700,
                textShadow: '0 2px 12px rgba(0, 0, 0, 0.3)',
              }}
            >
              Werkplek Voltooid!
            </Typography>
          </Box>
        </Fade>
      )}

      {/* Dialog Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          pb: 2,
          borderBottom: '2px solid',
          borderColor: 'divider',
          background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.08) 0%, transparent 100%)',
        }}
      >
        <DoneAllIcon sx={{ fontSize: 32, color: 'success.main' }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" fontWeight={700} sx={{ color: 'text.primary' }}>
            Werkplek Voltooien
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bevestig de voltooiing en bekijk de uitgevoerde acties
          </Typography>
        </Box>
        <Chip
          label="Laatste Stap"
          size="small"
          sx={{
            bgcolor: 'success.main',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.7rem',
            letterSpacing: '0.05em',
          }}
        />
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* User Information Card */}
        <Box
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'rgba(0, 0, 0, 0.02)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <PersonIcon sx={{ fontSize: 28, color: 'primary.main', mt: 0.5 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                {workplace.userName}
              </Typography>
              {workplace.userEmail && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {workplace.userEmail}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
                {workplace.location && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {workplace.location}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    Vandaag {new Date().toLocaleDateString('nl-NL')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LaptopIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {workplace.totalItems} items geconfigureerd
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Actions Summary Alert */}
        <Alert
          severity="info"
          icon={<SwapHorizIcon />}
          sx={{
            mb: 3,
            border: '1px solid',
            borderColor: 'info.main',
            borderRadius: 2,
            '& .MuiAlert-message': { width: '100%' },
          }}
        >
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            De volgende acties worden uitgevoerd:
          </Typography>
          <Box component="ul" sx={{ m: '8px 0 0', pl: '20px', fontSize: '0.875rem' }}>
            <li>
              <strong>{newItems.length + swapItems.length}</strong> nieuwe asset(s) worden{' '}
              <Chip
                label="InGebruik"
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  bgcolor: 'success.main',
                  color: '#fff',
                  mx: 0.5,
                }}
              />{' '}
              gezet
            </li>
            <li>
              Eigenaar wordt ingesteld op <strong>{workplace.userName}</strong>
            </li>
            <li>
              Installatiedatum wordt ingesteld op{' '}
              <strong>{new Date().toLocaleDateString('nl-NL')}</strong>
            </li>
            {hasSwaps && (
              <li>
                <strong>{swapItems.length}</strong> oude asset(s) worden{' '}
                <Chip
                  label="UitDienst"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    bgcolor: 'warning.main',
                    color: '#fff',
                    mx: 0.5,
                  }}
                />{' '}
                gezet
              </li>
            )}
          </Box>
        </Alert>

        {/* Swap Visualization - Only if there are swaps */}
        {hasSwaps && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                fontWeight: 700,
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'text.secondary',
                mb: 1.5,
              }}
            >
              Equipment Swaps ({swapItems.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {swapItems.map((swap, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
                    },
                  }}
                >
                  {/* Old Asset */}
                  <Box
                    sx={{
                      flex: 1,
                      p: 1.5,
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: 'warning.light',
                      bgcolor: 'rgba(251, 146, 60, 0.08)',
                    }}
                  >
                    <Typography variant="caption" color="warning.main" fontWeight={700} sx={{ display: 'block', mb: 0.5, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Oud ({swap.equipmentType})
                    </Typography>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {swap.oldAssetCode}
                    </Typography>
                    {swap.oldAssetName && (
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {swap.oldAssetName}
                      </Typography>
                    )}
                  </Box>

                  {/* Arrow */}
                  <ArrowForwardIcon
                    sx={{
                      fontSize: 28,
                      color: 'primary.main',
                      flexShrink: 0,
                    }}
                  />

                  {/* New Asset */}
                  <Box
                    sx={{
                      flex: 1,
                      p: 1.5,
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: 'success.light',
                      bgcolor: 'rgba(34, 197, 94, 0.08)',
                    }}
                  >
                    <Typography variant="caption" color="success.main" fontWeight={700} sx={{ display: 'block', mb: 0.5, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Nieuw ({swap.equipmentType})
                    </Typography>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {swap.existingAssetCode}
                    </Typography>
                    {swap.existingAssetName && (
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {swap.existingAssetName}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* New Assets - Only if there are items without swaps */}
        {newItems.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                fontWeight: 700,
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'text.secondary',
                mb: 1.5,
              }}
            >
              Nieuwe Assets ({newItems.length})
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                gap: 1.5,
              }}
            >
              {newItems.map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'success.light',
                    bgcolor: 'rgba(34, 197, 94, 0.05)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'rgba(34, 197, 94, 0.08)',
                    },
                  }}
                >
                  <Typography variant="caption" color="success.main" fontWeight={700} sx={{ display: 'block', mb: 0.5, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {item.equipmentType}
                  </Typography>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {item.existingAssetCode}
                  </Typography>
                  {item.existingAssetName && (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {item.existingAssetName}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Notes Field */}
        <TextField
          fullWidth
          label="Opmerkingen (optioneel)"
          multiline
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Eventuele bijzonderheden of notities voor rapportage..."
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />

        {/* Progress indicator when completing */}
        {isCompleting && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'rgba(22, 163, 74, 0.1)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'success.main',
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
              Assets worden bijgewerkt...
            </Typography>
          </Box>
        )}
      </DialogContent>

      {/* Dialog Actions */}
      <DialogActions
        sx={{
          px: 3,
          py: 2.5,
          gap: 1.5,
          borderTop: '2px solid',
          borderColor: 'divider',
          bgcolor: 'rgba(0, 0, 0, 0.01)',
        }}
      >
        <Button
          onClick={onClose}
          disabled={isCompleting}
          sx={{
            fontWeight: 600,
            px: 3,
          }}
        >
          Annuleren
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleComplete}
          disabled={isCompleting}
          startIcon={<CheckCircleIcon />}
          sx={{
            fontWeight: 700,
            px: 4,
            py: 1,
            fontSize: '0.95rem',
            boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
            '&:hover': {
              boxShadow: '0 6px 20px rgba(22, 163, 74, 0.4)',
            },
          }}
        >
          {isCompleting ? 'Voltooien...' : 'Bevestigen & Voltooien'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WorkplaceCompletionDialog;

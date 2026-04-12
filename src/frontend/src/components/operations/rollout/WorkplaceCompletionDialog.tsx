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
  useTheme,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LaptopIcon from '@mui/icons-material/Laptop';
import DeskIcon from '@mui/icons-material/Desk';
import type { RolloutWorkplace } from '../../../types/rollout';
import { ROLLOUT_TIMING } from '../../../constants/rollout.constants';
import { SERVICE_COLOR } from '../../../constants/filterColors';

interface WorkplaceCompletionDialogProps {
  open: boolean;
  workplace: RolloutWorkplace;
  onClose: () => void;
  onComplete: (notes?: string) => Promise<void>;
  isCompleting: boolean;
}

// Assignment type constants - match RolloutExecutionPage
const USER_ASSIGNED_EQUIPMENT: string[] = ['laptop', 'desktop'];

// Assignment colors
const ASSIGNMENT_COLORS = {
  user: '#9c27b0',      // Purple - assigned to user
  workplace: SERVICE_COLOR, // Teal - assigned to physical workplace
};

/**
 * Enhanced Workplace Completion Dialog
 *
 * Design Features:
 * - Neumorphic styling consistent with other dialogs
 * - Assignment type colors (purple for user, teal for workplace)
 * - Swap visualization showing old → new equipment flow
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
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [notes, setNotes] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);

  // Neumorphic styling
  const neumorphicBg = isDark ? '#1e2328' : '#e8eef3';
  const neumorphicShadow = isDark
    ? '8px 8px 16px #0d0f11, -4px -4px 12px #2f373f'
    : '8px 8px 16px #c8cdd2, -4px -4px 12px #f8fcff';
  const neumorphicInset = isDark
    ? 'inset 2px 2px 4px #161a1d, inset -2px -2px 4px #262c33'
    : 'inset 2px 2px 4px #d1d6db, inset -2px -2px 4px #f5f9fc';

  const handleComplete = async () => {
    await onComplete(notes || undefined);
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
      setNotes('');
    }, ROLLOUT_TIMING.COMPLETION_DIALOG_CLOSE_DELAY_MS);
  };

  // Get assignment type for equipment
  const getAssignmentType = (equipmentType: string): 'user' | 'workplace' => {
    return USER_ASSIGNED_EQUIPMENT.includes(equipmentType.toLowerCase()) ? 'user' : 'workplace';
  };

  // Extract swap information
  const swapItems = workplace.assetPlans.filter((p) => p.oldAssetId && p.existingAssetId);
  const newItems = workplace.assetPlans.filter((p) => p.existingAssetId && !p.oldAssetId);
  const hasSwaps = swapItems.length > 0;

  // Check if physical workplace is linked
  const hasPhysicalWorkplace = !!workplace.physicalWorkplaceId;

  // Count fixed assets (monitors, keyboard, mouse, docking) for physical workplace update
  const fixedAssetTypes = ['monitor', 'keyboard', 'mouse', 'docking'];
  const fixedAssetCount = workplace.assetPlans.filter(
    (p) => p.existingAssetId && fixedAssetTypes.includes(p.equipmentType.toLowerCase())
  ).length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableRestoreFocus
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      }}
      PaperProps={{
        sx: {
          bgcolor: neumorphicBg,
          borderRadius: 3,
          boxShadow: neumorphicShadow,
          overflow: 'hidden',
          position: 'relative',
          border: '2px solid rgba(76, 175, 80, 0.4)',
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
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          background: isDark
            ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, transparent 100%)'
            : 'linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, transparent 100%)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: 2,
            bgcolor: 'rgba(76, 175, 80, 0.15)',
            boxShadow: isDark
              ? '2px 2px 4px #161a1d, -2px -2px 4px #262c33'
              : '2px 2px 4px #d1d6db, -2px -2px 4px #f5f9fc',
          }}
        >
          <DoneAllIcon sx={{ fontSize: 26, color: '#4caf50' }} />
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" fontWeight={700} sx={{ color: isDark ? '#fff' : '#333' }}>
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
            bgcolor: '#4caf50',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.7rem',
            letterSpacing: '0.05em',
            boxShadow: isDark
              ? '2px 2px 4px #161a1d, -2px -2px 4px #262c33'
              : '2px 2px 4px #d1d6db, -2px -2px 4px #f5f9fc',
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
            bgcolor: isDark ? '#252a30' : '#dde3e8',
            boxShadow: neumorphicInset,
            border: `1px solid ${ASSIGNMENT_COLORS.user}40`,
            borderLeft: `4px solid ${ASSIGNMENT_COLORS.user}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'rgba(156, 39, 176, 0.15)',
                flexShrink: 0,
              }}
            >
              <PersonIcon sx={{ fontSize: 24, color: ASSIGNMENT_COLORS.user }} />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="h6" fontWeight={700} sx={{ color: isDark ? '#fff' : '#333' }}>
                  {workplace.userName}
                </Typography>
                <Chip
                  label="Gebruiker"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    bgcolor: 'rgba(156, 39, 176, 0.12)',
                    color: ASSIGNMENT_COLORS.user,
                    border: `1px solid ${ASSIGNMENT_COLORS.user}50`,
                  }}
                />
              </Box>
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

        {/* Physical Workplace Card - Only if linked */}
        {hasPhysicalWorkplace && (
          <Box
            sx={{
              p: 2.5,
              mb: 3,
              borderRadius: 2,
              bgcolor: isDark ? '#252a30' : '#dde3e8',
              boxShadow: neumorphicInset,
              border: `1px solid ${ASSIGNMENT_COLORS.workplace}40`,
              borderLeft: `4px solid ${ASSIGNMENT_COLORS.workplace}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: 'rgba(0, 150, 136, 0.15)',
                  flexShrink: 0,
                }}
              >
                <DeskIcon sx={{ fontSize: 24, color: ASSIGNMENT_COLORS.workplace }} />
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ color: isDark ? '#fff' : '#333' }}>
                    {workplace.physicalWorkplaceCode || workplace.physicalWorkplaceName}
                  </Typography>
                  <Chip
                    label="Fysieke Werkplek"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      bgcolor: 'rgba(0, 150, 136, 0.12)',
                      color: ASSIGNMENT_COLORS.workplace,
                      border: `1px solid ${ASSIGNMENT_COLORS.workplace}50`,
                    }}
                  />
                </Box>
                {workplace.physicalWorkplaceName && workplace.physicalWorkplaceCode && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {workplace.physicalWorkplaceName}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ mt: 1, color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>
                  Wordt bijgewerkt met:
                </Typography>
                <Box component="ul" sx={{ m: '4px 0 0', pl: '20px', fontSize: '0.85rem' }}>
                  <li>
                    <Typography variant="body2" component="span">
                      Bewoner: <strong>{workplace.userName}</strong>
                    </Typography>
                  </li>
                  {fixedAssetCount > 0 && (
                    <li>
                      <Typography variant="body2" component="span">
                        Vaste apparatuur: <strong>{fixedAssetCount}</strong> items
                      </Typography>
                    </li>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* Actions Summary Alert */}
        <Alert
          severity="info"
          icon={<SwapHorizIcon />}
          sx={{
            mb: 3,
            bgcolor: isDark ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.08)',
            border: '1px solid rgba(33, 150, 243, 0.3)',
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
              {swapItems.map((swap, index) => {
                const assignmentType = getAssignmentType(swap.equipmentType);
                const assignmentColor = ASSIGNMENT_COLORS[assignmentType];
                return (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: isDark ? '#252a30' : '#dde3e8',
                      boxShadow: neumorphicInset,
                      border: `1px solid ${assignmentColor}30`,
                      borderLeft: `4px solid ${assignmentColor}`,
                      transition: 'all 0.2s ease',
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
                        bgcolor: isDark ? 'rgba(251, 146, 60, 0.1)' : 'rgba(251, 146, 60, 0.08)',
                      }}
                    >
                      <Typography variant="caption" color="warning.main" fontWeight={700} sx={{ display: 'block', mb: 0.5, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Oud ({swap.equipmentType})
                      </Typography>
                      <Typography variant="body2" fontWeight={600} noWrap sx={{ color: isDark ? '#fff' : '#333' }}>
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
                        color: assignmentColor,
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
                        bgcolor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.08)',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <Typography variant="caption" color="success.main" fontWeight={700} sx={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Nieuw ({swap.equipmentType})
                        </Typography>
                        <Chip
                          label={assignmentType === 'user' ? 'Gebruiker' : 'Werkplek'}
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: '0.55rem',
                            fontWeight: 700,
                            bgcolor: `${assignmentColor}20`,
                            color: assignmentColor,
                            border: `1px solid ${assignmentColor}50`,
                          }}
                        />
                      </Box>
                      <Typography variant="body2" fontWeight={600} noWrap sx={{ color: isDark ? '#fff' : '#333' }}>
                        {swap.existingAssetCode}
                      </Typography>
                      {swap.existingAssetName && (
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {swap.existingAssetName}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
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
              {newItems.map((item, index) => {
                const assignmentType = getAssignmentType(item.equipmentType);
                const assignmentColor = ASSIGNMENT_COLORS[assignmentType];
                return (
                  <Box
                    key={index}
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      bgcolor: isDark ? '#252a30' : '#dde3e8',
                      boxShadow: neumorphicInset,
                      border: `1px solid ${assignmentColor}30`,
                      borderLeft: `4px solid ${assignmentColor}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: isDark
                          ? `inset 2px 2px 4px #161a1d, inset -2px -2px 4px #262c33, 0 0 0 2px ${assignmentColor}30`
                          : `inset 2px 2px 4px #d1d6db, inset -2px -2px 4px #f5f9fc, 0 0 0 2px ${assignmentColor}20`,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        sx={{
                          fontSize: '0.65rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: assignmentColor,
                        }}
                      >
                        {item.equipmentType}
                      </Typography>
                      <Chip
                        label={assignmentType === 'user' ? 'Gebruiker' : 'Werkplek'}
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: '0.55rem',
                          fontWeight: 700,
                          bgcolor: `${assignmentColor}20`,
                          color: assignmentColor,
                          border: `1px solid ${assignmentColor}50`,
                        }}
                      />
                    </Box>
                    <Typography variant="body2" fontWeight={600} noWrap sx={{ color: isDark ? '#fff' : '#333' }}>
                      {item.existingAssetCode}
                    </Typography>
                    {item.existingAssetName && (
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {item.existingAssetName}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 3, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />

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
              bgcolor: isDark ? '#1e2328' : '#e8eef3',
              borderRadius: 2,
              boxShadow: neumorphicInset,
              '& fieldset': { border: 'none' },
              '&:hover, &.Mui-focused': {
                boxShadow: isDark
                  ? 'inset 2px 2px 5px #161a1d, inset -2px -2px 5px #262c33, 0 0 0 2px rgba(76, 175, 80, 0.3)'
                  : 'inset 2px 2px 5px #d1d6db, inset -2px -2px 5px #f5f9fc, 0 0 0 2px rgba(76, 175, 80, 0.25)',
              },
            },
            '& .MuiInputLabel-root': {
              color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
              '&.Mui-focused': { color: '#4caf50' },
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
                bgcolor: isDark ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: '#4caf50',
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
          borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        }}
      >
        <Button
          onClick={onClose}
          disabled={isCompleting}
          sx={{
            bgcolor: isDark ? '#1e2328' : '#e8eef3',
            color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
            fontWeight: 600,
            px: 3,
            boxShadow: isDark
              ? '2px 2px 4px #161a1d, -2px -2px 4px #262c33'
              : '2px 2px 4px #d1d6db, -2px -2px 4px #f5f9fc',
            '&:hover': {
              bgcolor: isDark ? '#252a30' : '#dde3e8',
              boxShadow: isDark
                ? '3px 3px 6px #161a1d, -3px -3px 6px #262c33'
                : '3px 3px 6px #d1d6db, -3px -3px 6px #f5f9fc',
            },
          }}
        >
          Annuleren
        </Button>
        <Button
          onClick={handleComplete}
          disabled={isCompleting}
          startIcon={<CheckCircleIcon />}
          sx={{
            bgcolor: '#4caf50',
            color: 'white',
            fontWeight: 700,
            px: 4,
            py: 1,
            fontSize: '0.95rem',
            boxShadow: isDark
              ? '2px 2px 4px #161a1d, -2px -2px 4px #262c33'
              : '2px 2px 4px #d1d6db, -2px -2px 4px #f5f9fc',
            '&:hover': {
              bgcolor: '#43a047',
              boxShadow: isDark
                ? '3px 3px 6px #161a1d, -3px -3px 6px #262c33, 0 0 8px rgba(76, 175, 80, 0.3)'
                : '3px 3px 6px #d1d6db, -3px -3px 6px #f5f9fc, 0 0 8px rgba(76, 175, 80, 0.2)',
            },
            '&:disabled': {
              bgcolor: isDark ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.4)',
              color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.7)',
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

import { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  Divider,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import NoteIcon from '@mui/icons-material/Note';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import type { RolloutWorkplace } from '../../types/rollout';

interface CompletedWorkplaceSummaryProps {
  workplace: RolloutWorkplace;
  defaultExpanded?: boolean;
}

/**
 * Completed Workplace Summary Card
 *
 * Design Features:
 * - Success-themed styling with green accents
 * - Completion timestamp and user attribution
 * - Expandable asset swap details
 * - Reporting-ready status indicator
 * - Clean, scannable layout
 */
const CompletedWorkplaceSummary = ({
  workplace,
  defaultExpanded = false,
}: CompletedWorkplaceSummaryProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Extract completion data
  const completedDate = workplace.completedAt
    ? new Date(workplace.completedAt)
    : new Date();
  const completedBy = workplace.completedBy || 'Onbekend';

  // Extract swap and asset information
  const swapItems = workplace.assetPlans.filter((p) => p.oldAssetId && p.existingAssetId);
  const newItems = workplace.assetPlans.filter((p) => p.existingAssetId && !p.oldAssetId);
  const installedAssets = workplace.assetPlans.filter((p) => p.status === 'installed');
  const skippedItems = workplace.assetPlans.filter((p) => p.status === 'skipped');

  return (
    <Card
      elevation={0}
      sx={{
        position: 'relative',
        border: '2px solid',
        borderColor: 'success.main',
        borderRadius: 2,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.05) 0%, rgba(22, 163, 74, 0.01) 100%)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: '0 4px 20px rgba(22, 163, 74, 0.15)',
        },
        // Success accent bar
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 5,
          bgcolor: 'success.main',
          boxShadow: '0 0 12px rgba(22, 163, 74, 0.4)',
        },
      }}
    >
      {/* Card Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'rgba(22, 163, 74, 0.03)',
          },
          transition: 'background-color 0.2s ease',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Success Icon */}
        <CheckCircleIcon
          sx={{
            fontSize: 32,
            color: 'success.main',
            flexShrink: 0,
            filter: 'drop-shadow(0 2px 8px rgba(22, 163, 74, 0.3))',
          }}
        />

        {/* User Info */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: '1.05rem',
                color: 'text.primary',
              }}
            >
              {workplace.userName}
            </Typography>

            {/* Status Badge */}
            <Chip
              label="Voltooid"
              size="small"
              icon={<AssignmentTurnedInIcon sx={{ fontSize: 16 }} />}
              sx={{
                bgcolor: 'success.main',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.7rem',
                height: 24,
              }}
            />

            {/* Reporting Ready Indicator */}
            <Tooltip title="Klaar voor rapportage">
              <Chip
                label="📊 Rapport"
                size="small"
                variant="outlined"
                sx={{
                  borderColor: 'success.main',
                  color: 'success.main',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 24,
                }}
              />
            </Tooltip>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {/* Email */}
            {workplace.userEmail && (
              <Typography variant="body2" color="text.secondary" noWrap>
                {workplace.userEmail}
              </Typography>
            )}

            {/* Location */}
            {workplace.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOnIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {workplace.location}
                </Typography>
              </Box>
            )}

            {/* Completion Date */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {completedDate.toLocaleDateString('nl-NL', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </Typography>
            </Box>

            {/* Completion Time */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {completedDate.toLocaleTimeString('nl-NL', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Stats Summary */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1,
            borderRadius: 2,
            bgcolor: 'rgba(22, 163, 74, 0.12)',
            border: '1px solid',
            borderColor: 'rgba(22, 163, 74, 0.3)',
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={700} sx={{ color: 'success.main', lineHeight: 1 }}>
              {installedAssets.length}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              Assets
            </Typography>
          </Box>
          {swapItems.length > 0 && (
            <>
              <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(22, 163, 74, 0.3)' }} />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight={700} sx={{ color: 'warning.main', lineHeight: 1 }}>
                  {swapItems.length}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Swaps
                </Typography>
              </Box>
            </>
          )}
        </Box>

        {/* Expand Toggle */}
        <IconButton
          size="small"
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
            color: 'success.main',
          }}
        >
          <ExpandMoreIcon />
        </IconButton>
      </Box>

      {/* Expandable Details */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider sx={{ borderColor: 'rgba(22, 163, 74, 0.2)' }} />
        <Box sx={{ p: 2.5, bgcolor: 'rgba(22, 163, 74, 0.02)' }}>
          {/* Completion Attribution */}
          <Box
            sx={{
              mb: 2.5,
              p: 1.5,
              borderRadius: 2,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Voltooid door
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {completedBy}
            </Typography>
            {workplace.completedByEmail && (
              <Typography variant="caption" color="text.secondary">
                {workplace.completedByEmail}
              </Typography>
            )}
          </Box>

          {/* Equipment Swaps */}
          {swapItems.length > 0 && (
            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <SwapHorizIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'text.secondary',
                  }}
                >
                  Equipment Swaps ({swapItems.length})
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {swapItems.map((swap, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'text.secondary',
                        mb: 1,
                      }}
                    >
                      {swap.equipmentType}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {/* Old Asset */}
                      <Box sx={{ flex: 1 }}>
                        <Chip
                          label="UitDienst"
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            bgcolor: 'warning.main',
                            color: '#fff',
                            mb: 0.5,
                          }}
                        />
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {swap.oldAssetCode}
                        </Typography>
                      </Box>

                      <Typography variant="body2" color="text.secondary">
                        →
                      </Typography>

                      {/* New Asset */}
                      <Box sx={{ flex: 1 }}>
                        <Chip
                          label="InGebruik"
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            bgcolor: 'success.main',
                            color: '#fff',
                            mb: 0.5,
                          }}
                        />
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {swap.existingAssetCode}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* New Assets (no swap) */}
          {newItems.length > 0 && (
            <Box sx={{ mb: 2.5 }}>
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
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'success.light',
                      bgcolor: 'rgba(22, 163, 74, 0.05)',
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="success.main"
                      fontWeight={700}
                      sx={{
                        display: 'block',
                        mb: 0.5,
                        fontSize: '0.65rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {item.equipmentType}
                    </Typography>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {item.existingAssetCode}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Skipped Items */}
          {skippedItems.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2.5, fontSize: '0.85rem' }}>
              <strong>{skippedItems.length}</strong> item(s) overgeslagen:{' '}
              {skippedItems.map((i) => i.equipmentType).join(', ')}
            </Alert>
          )}

          {/* Notes */}
          {workplace.notes && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <NoteIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'text.secondary',
                  }}
                >
                  Opmerkingen
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                {workplace.notes}
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Card>
  );
};

export default CompletedWorkplaceSummary;

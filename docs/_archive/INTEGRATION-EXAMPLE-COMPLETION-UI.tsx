/**
 * INTEGRATION EXAMPLE: Enhanced Rollout Execution Page
 *
 * This file shows how to integrate the new completion UI components
 * into the existing RolloutExecutionPage.tsx
 *
 * Changes to make:
 * 1. Import new components
 * 2. Replace old completion dialog with WorkplaceCompletionDialog
 * 3. Show completed workplaces using CompletedWorkplaceSummary
 * 4. Separate completed from active workplaces
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// ... other imports ...

// ADD THESE IMPORTS:
import WorkplaceCompletionDialog from '../components/rollout/WorkplaceCompletionDialog';
import CompletedWorkplaceSummary from '../components/rollout/CompletedWorkplaceSummary';

/**
 * Modified RolloutExecutionPage component
 */
const RolloutExecutionPageEnhanced = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sessionId = Number(id);

  // ... existing state ...

  const { data: workplaces, isLoading: workplacesLoading } = useRolloutWorkplaces(
    selectedDay?.id || 0
  );

  // CHANGE 1: Separate completed from active workplaces
  const { completedWorkplaces, activeWorkplaces } = useMemo(() => {
    if (!workplaces) return { completedWorkplaces: [], activeWorkplaces: [] };

    return {
      completedWorkplaces: workplaces.filter(w => w.status === 'Completed'),
      activeWorkplaces: workplaces.filter(w => w.status !== 'Completed'),
    };
  }, [workplaces]);

  // ... existing code ...

  return (
    <Container maxWidth="md" sx={{ mt: 2, mb: 4, px: { xs: 1, sm: 3 } }}>
      {/* Header */}
      {/* ... existing header code ... */}

      {/* Overall Progress */}
      {/* ... existing progress code ... */}

      {/* Day Tabs */}
      {/* ... existing day tabs code ... */}

      {/* Workplace Lists */}
      {selectedDay && (
        <>
          {workplacesLoading ? (
            <Loading />
          ) : !workplaces || workplaces.length === 0 ? (
            <Alert severity="info">
              Geen werkplekken gevonden voor deze planning.
            </Alert>
          ) : (
            <>
              {/* CHANGE 2: Show completed workplaces first (for reporting) */}
              {completedWorkplaces.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'success.main',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <CheckCircleIcon sx={{ fontSize: 18 }} />
                      Voltooide Werkplekken ({completedWorkplaces.length})
                    </Typography>

                    {/* Optional: Add "Expand All" toggle */}
                    <Chip
                      label="📊 Klaar voor Rapportage"
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: 'success.main',
                        color: 'success.main',
                        fontWeight: 600,
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {completedWorkplaces.map((workplace) => (
                      <CompletedWorkplaceSummary
                        key={workplace.id}
                        workplace={workplace}
                        defaultExpanded={false}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* CHANGE 3: Active workplaces section */}
              {activeWorkplaces.length > 0 && (
                <Box>
                  {completedWorkplaces.length > 0 && (
                    <Divider sx={{ my: 3 }}>
                      <Chip
                        label="Actieve Werkplekken"
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </Divider>
                  )}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {activeWorkplaces.map((workplace) => (
                      <WorkplaceCard
                        key={workplace.id}
                        workplace={workplace}
                        expanded={effectiveExpanded === workplace.id}
                        onToggle={() => handleToggleWorkplace(workplace.id)}
                        onSnackbar={showSnackbar}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </>
          )}
        </>
      )}

      {/* Snackbar */}
      {/* ... existing snackbar code ... */}
    </Container>
  );
};

/**
 * CHANGE 4: Modified WorkplaceCard component
 * Update the completion dialog section
 */
const WorkplaceCardEnhanced = ({ workplace, expanded, onToggle, onSnackbar }: WorkplaceCardProps) => {
  // ... existing state ...

  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  // REMOVE: const [completeNotes, setCompleteNotes] = useState('');

  // ... existing mutations ...

  // CHANGE 5: Simplified handleComplete (notes handled in dialog)
  const handleComplete = async (notes?: string) => {
    try {
      await completeMutation.mutateAsync({
        workplaceId: workplace.id,
        data: { notes },
      });
      setCompleteDialogOpen(false);
      onSnackbar(`Werkplek "${workplace.userName}" voltooid! Assets zijn bijgewerkt.`);
    } catch {
      onSnackbar('Fout bij voltooien werkplek', 'error');
    }
  };

  // ... rest of component ...

  return (
    <>
      <Card
        elevation={0}
        sx={{
          // For completed workplaces, show CompletedWorkplaceSummary instead
          // This card is only for active workplaces now
          // ... existing styles ...
        }}
      >
        {/* ... existing card content ... */}

        {/* Complete button */}
        {isInProgress && allItemsDone && (
          <Button
            variant="contained"
            color="success"
            fullWidth
            startIcon={<DoneAllIcon />}
            onClick={() => setCompleteDialogOpen(true)} // Open enhanced dialog
            disabled={completeMutation.isPending}
            sx={{ mt: 2 }}
          >
            {completeMutation.isPending ? 'Voltooien...' : 'Werkplek Voltooien'}
          </Button>
        )}

        {/* ... rest of card ... */}
      </Card>

      {/* Item Configuration Dialog */}
      {/* ... existing item dialog ... */}

      {/* CHANGE 6: Replace old completion dialog with enhanced version */}
      <WorkplaceCompletionDialog
        open={completeDialogOpen}
        workplace={workplace}
        onClose={() => setCompleteDialogOpen(false)}
        onComplete={handleComplete}
        isCompleting={completeMutation.isPending}
      />

      {/* Reopen Dialog */}
      {/* ... keep existing reopen dialog ... */}
    </>
  );
};

/**
 * VISUAL FLOW DIAGRAM
 *
 * Before Completion:
 * ┌─────────────────────────────────────┐
 * │ 👤 User Name        [Bezig] 2/5     │
 * │ ▼ Details                           │
 * │   ✓ Laptop (configured)             │
 * │   ✓ Monitor (configured)            │
 * │   [ Werkplek Voltooien ] button     │ ← Click to start completion
 * └─────────────────────────────────────┘
 *
 * During Completion:
 * ┌─────────────────────────────────────┐
 * │ 🏆 Werkplek Voltooien               │
 * │                                     │
 * │ 👤 User Info Card                   │
 * │ ℹ️  Actions Summary                 │
 * │ 🔄 Swap Visualization               │
 * │   OLD-001 → NEW-001                 │
 * │ 📝 Notes field                      │
 * │                                     │
 * │ [Annuleren] [✓ Voltooien]          │ ← Confirm completion
 * └─────────────────────────────────────┘
 *
 * After Completion:
 * ┌─────────────────────────────────────┐
 * │ ✅ Voltooide Werkplekken (1)        │
 * │                                     │
 * │ █ ✓ User Name [Voltooid] [📊]      │ █ = green accent
 * │ █   email • location • date         │
 * │ █   ▼ Details (expandable)          │
 * │ █     🔄 Equipment Swaps            │
 * │ █     📦 Nieuwe Assets              │
 * │ █     📝 Opmerkingen                │
 * └─────────────────────────────────────┘
 *
 * ─────────────────────────────────────
 *
 * ┌─────────────────────────────────────┐
 * │ Actieve Werkplekken                 │
 * │                                     │
 * │ (remaining in-progress cards)       │
 * └─────────────────────────────────────┘
 */

/**
 * ADDITIONAL FEATURES TO CONSIDER
 *
 * 1. Filter Toggle:
 *    Add toggle to show/hide completed workplaces
 *    Useful when list gets long
 *
 * 2. Bulk Export:
 *    "Export Completed to CSV" button
 *    Generates report for the day
 *
 * 3. Print Summary:
 *    Print-friendly version of completed list
 *    For physical records
 *
 * 4. Completion Notification:
 *    Show toast when all workplaces completed
 *    "All workplaces completed! 🎉"
 *
 * 5. Undo Completion:
 *    Quick undo button (< 5 min)
 *    Reopen without confirmation
 */

export default RolloutExecutionPageEnhanced;

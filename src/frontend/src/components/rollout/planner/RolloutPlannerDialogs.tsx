import RolloutDayDialog from '../RolloutDayDialog';
import RolloutWorkplaceDialog from '../RolloutWorkplaceDialog';
import BulkPrintLabelDialog from '../../print/BulkPrintLabelDialog';
import BulkImportFromGraphDialog from '../BulkImportFromGraphDialog';
import RescheduleWorkplaceDialog from '../RescheduleWorkplaceDialog';
import type { DialogState } from '../../../hooks/rollout-planner';
import type { RolloutDay } from '../../../types/rollout';
import type { Asset } from '../../../types/asset.types';

interface RolloutPlannerDialogsProps {
  sessionId: number;
  dialogs: DialogState;
  days: RolloutDay[] | undefined;
  bulkPrintAssets: Asset[] | undefined;
  onCloseDayDialog: () => void;
  onCloseWorkplaceDialog: () => void;
  onCloseBulkPrintDialog: () => void;
  onCloseImportGraphDialog: () => void;
  onCloseRescheduleDialog: () => void;
}

export default function RolloutPlannerDialogs({
  sessionId,
  dialogs,
  days,
  bulkPrintAssets,
  onCloseDayDialog,
  onCloseWorkplaceDialog,
  onCloseBulkPrintDialog,
  onCloseImportGraphDialog,
  onCloseRescheduleDialog,
}: RolloutPlannerDialogsProps) {
  // Filter assets for bulk print if specific IDs are selected
  const filteredBulkPrintAssets = dialogs.bulkPrintAssetIds
    ? (bulkPrintAssets || []).filter(a => dialogs.bulkPrintAssetIds!.has(a.id))
    : (bulkPrintAssets || []);

  return (
    <>
      <RolloutDayDialog
        open={dialogs.dayDialogOpen}
        onClose={onCloseDayDialog}
        sessionId={sessionId}
        day={dialogs.selectedDay}
        dayNumber={(days?.length || 0) + 1}
        defaultDate={dialogs.defaultDate}
      />

      <RolloutWorkplaceDialog
        open={dialogs.workplaceDialogOpen}
        onClose={onCloseWorkplaceDialog}
        dayId={dialogs.activeWorkplaceDayId || 0}
        workplace={dialogs.selectedWorkplace}
      />

      <BulkPrintLabelDialog
        open={dialogs.bulkPrintDialogOpen}
        onClose={onCloseBulkPrintDialog}
        assets={filteredBulkPrintAssets}
      />

      {dialogs.importGraphDayId && (
        <BulkImportFromGraphDialog
          open={dialogs.importGraphDialogOpen}
          onClose={onCloseImportGraphDialog}
          dayId={dialogs.importGraphDayId}
          serviceId={dialogs.importGraphServiceId ?? 0}
          serviceName={dialogs.importGraphServiceName}
        />
      )}

      <RescheduleWorkplaceDialog
        open={dialogs.rescheduleDialogOpen}
        onClose={onCloseRescheduleDialog}
        workplace={dialogs.rescheduleWorkplace}
        dayId={dialogs.rescheduleDayId}
        originalDate={dialogs.rescheduleOriginalDate}
      />
    </>
  );
}

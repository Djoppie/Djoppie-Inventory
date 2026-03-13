/**
 * Integration Example: Using the Redesigned RolloutWorkplaceDialog
 *
 * This example shows how to integrate the redesigned dialog into your
 * rollout planner page with QR scanning capabilities.
 */

import { useState } from 'react';
import { Button, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RolloutWorkplaceDialog from '../components/rollout/RolloutWorkplaceDialog.redesigned';
import type { RolloutWorkplace } from '../types/rollout';

/**
 * Example: Using the dialog in a rollout planner page
 */
export const RolloutPlannerExample = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWorkplace, setSelectedWorkplace] = useState<RolloutWorkplace | undefined>();
  const [selectedDayId, setSelectedDayId] = useState<number>(1);

  // Open dialog for creating new workplace
  const handleCreateWorkplace = (dayId: number) => {
    setSelectedDayId(dayId);
    setSelectedWorkplace(undefined);
    setDialogOpen(true);
  };

  // Open dialog for editing existing workplace
  const handleEditWorkplace = (workplace: RolloutWorkplace) => {
    setSelectedDayId(workplace.rolloutDayId);
    setSelectedWorkplace(workplace);
    setDialogOpen(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedWorkplace(undefined);
  };

  return (
    <Box>
      {/* Example: Add workplace button */}
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => handleCreateWorkplace(1)}
        sx={{
          bgcolor: '#FF7700',
          '&:hover': {
            bgcolor: '#E66900',
          },
        }}
      >
        Nieuwe Werkplek
      </Button>

      {/* The redesigned dialog */}
      <RolloutWorkplaceDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        dayId={selectedDayId}
        workplace={selectedWorkplace}
      />
    </Box>
  );
};

/**
 * Key Features of Redesigned Dialog:
 *
 * 1. QR SCANNING FOR NEW DEVICES
 *    - Click "Scan QR-code nieuw toestel" button
 *    - Choose QR Scanner or Manual Entry tab
 *    - Scan/search for asset
 *    - Asset automatically linked to new device config
 *
 * 2. QR SCANNING FOR OLD DEVICES
 *    - Toggle "Oud toestel inleveren" ON
 *    - Click "Scan QR-code oud toestel" button
 *    - Choose QR Scanner or Manual Entry tab
 *    - Scan/search for asset
 *    - Asset automatically linked as old device
 *
 * 3. RETROACTIVE MODE
 *    - Toggle "Retroactieve registratie" ON
 *    - All scanned assets link to existing records
 *    - No new assets or QR codes created
 *    - Useful for registering already-deployed devices
 *
 * 4. VALIDATION
 *    - User name required
 *    - At least one device (new or old) required
 *    - Templates required for new devices (unless linked)
 *    - Clear warnings displayed when validation fails
 *
 * 5. USER SEARCH
 *    - Autocomplete with Microsoft Graph API
 *    - Type minimum 2 characters to search
 *    - Auto-populate email and location
 *    - Fetch Intune devices for user
 *
 * 6. INTUNE INTEGRATION
 *    - Display current user devices
 *    - Quick-select serial numbers
 *    - Visual device chips
 */

/**
 * Migration from Old Component:
 *
 * 1. Backup existing component:
 *    mv RolloutWorkplaceDialog.tsx RolloutWorkplaceDialog.old.tsx
 *
 * 2. Rename redesigned component:
 *    mv RolloutWorkplaceDialog.redesigned.tsx RolloutWorkplaceDialog.tsx
 *
 * 3. No changes needed to parent components - API is identical
 *
 * 4. Test the new features:
 *    - QR scanning workflow
 *    - Retroactive mode
 *    - Validation messages
 *    - Asset linking
 */

/**
 * Customization Options:
 *
 * 1. COLORS
 *    Change the orange accent by replacing all instances of:
 *    - '#FF7700' (primary orange)
 *    - '#E66900' (hover orange)
 *    - 'rgba(255, 119, 0, ...)' (orange with opacity)
 *
 * 2. SCAN DIALOG SIZE
 *    Adjust maxWidth prop on scan dialog:
 *    maxWidth="sm"  -> "xs", "md", "lg", etc.
 *
 * 3. AUTO-CLOSE TIMING
 *    Modify the timeout in handleScanSuccess:
 *    setTimeout(() => handleCloseScanDialog(), 1500); // 1.5 seconds
 *
 * 4. DEFAULT TAB
 *    Change initial scan tab:
 *    setActiveTab(0); // 0: QR Scanner, 1: Manual Entry
 *
 * 5. VALIDATION RULES
 *    Modify isFormValid constant to adjust requirements
 */

/**
 * Troubleshooting:
 *
 * Q: QR scanner not starting?
 * A: Check browser camera permissions and HTTPS requirement
 *
 * Q: Assets not linking?
 * A: Verify asset exists in database with correct code format
 *
 * Q: Dialog too large on mobile?
 * A: Dialog is already responsive with fullWidth prop
 *
 * Q: Want to disable retroactive mode?
 * A: Remove the retroactive toggle section from the component
 *
 * Q: Need to add more device types?
 * A: Update DEVICE_TYPES in MultiDeviceConfigSection.tsx
 */

export default RolloutPlannerExample;

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useCreateRolloutWorkplace, useUpdateRolloutWorkplace } from '../../hooks/useRollout';
import type { RolloutWorkplace, CreateRolloutWorkplace, UpdateRolloutWorkplace, AssetPlan, EquipmentType } from '../../types/rollout';

interface RolloutWorkplaceDialogProps {
  open: boolean;
  onClose: () => void;
  dayId: number;
  workplace?: RolloutWorkplace;
}

const EQUIPMENT_TYPES: Array<{ value: EquipmentType; label: string }> = [
  { value: 'laptop', label: 'Laptop' },
  { value: 'docking', label: 'Docking Station' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'keyboard', label: 'Toetsenbord' },
  { value: 'mouse', label: 'Muis' },
];

const RolloutWorkplaceDialog = ({ open, onClose, dayId, workplace }: RolloutWorkplaceDialogProps) => {
  const isEditMode = Boolean(workplace);

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [location, setLocation] = useState('');
  const [isLaptopSetup, setIsLaptopSetup] = useState(true);
  const [assetPlans, setAssetPlans] = useState<AssetPlan[]>([]);

  const createMutation = useCreateRolloutWorkplace();
  const updateMutation = useUpdateRolloutWorkplace();

  useEffect(() => {
    if (workplace) {
      setUserName(workplace.userName);
      setUserEmail(workplace.userEmail || '');
      setLocation(workplace.location || '');
      setIsLaptopSetup(workplace.isLaptopSetup);
      setAssetPlans(workplace.assetPlans || []);
    } else {
      resetForm();
    }
  }, [workplace, open]);

  const resetForm = () => {
    setUserName('');
    setUserEmail('');
    setLocation('');
    setIsLaptopSetup(true);
    setAssetPlans([]);
  };

  const handleAddAssetPlan = () => {
    const newPlan: AssetPlan = {
      equipmentType: 'laptop',
      createNew: true,
      metadata: {},
      status: 'pending',
      requiresSerialNumber: true,
      requiresQRCode: false,
    };
    setAssetPlans([...assetPlans, newPlan]);
  };

  const handleRemoveAssetPlan = (index: number) => {
    setAssetPlans(assetPlans.filter((_, i) => i !== index));
  };

  const handleUpdateAssetPlan = (index: number, updates: Partial<AssetPlan>) => {
    const updated = [...assetPlans];
    updated[index] = { ...updated[index], ...updates };
    setAssetPlans(updated);
  };

  const handleSave = async () => {
    if (isEditMode && workplace) {
      const updateData: UpdateRolloutWorkplace = {
        userName,
        userEmail: userEmail || undefined,
        location: location || undefined,
        isLaptopSetup,
        assetPlans,
        status: workplace.status,
      };
      await updateMutation.mutateAsync({ workplaceId: workplace.id, data: updateData });
    } else {
      const createData: CreateRolloutWorkplace = {
        rolloutDayId: dayId,
        userName,
        userEmail: userEmail || undefined,
        location: location || undefined,
        isLaptopSetup,
        assetPlans,
      };
      await createMutation.mutateAsync({ dayId, data: createData });
    }

    handleClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isFormValid = userName.trim();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditMode ? 'Werkplek Bewerken' : 'Nieuwe Werkplek Toevoegen'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {/* User Info */}
          <Typography variant="subtitle2" color="text.secondary">
            Gebruikersinformatie
          </Typography>
          <TextField
            label="Gebruikersnaam"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
            fullWidth
            helperText="Naam van de gebruiker voor deze werkplek"
          />
          <TextField
            label="E-mailadres"
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            fullWidth
            helperText="Optioneel"
          />
          <TextField
            label="Locatie"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            fullWidth
            helperText="Bijv. 'Gebouw A - 2e verdieping - Kamer 205'"
          />
          <FormControlLabel
            control={
              <Switch
                checked={isLaptopSetup}
                onChange={(e) => setIsLaptopSetup(e.target.checked)}
              />
            }
            label="Laptop setup (anders desktop)"
          />

          <Divider sx={{ my: 2 }} />

          {/* Asset Planning */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" color="text.secondary">
              Asset Planning ({assetPlans.length})
            </Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddAssetPlan}
            >
              Asset Toevoegen
            </Button>
          </Box>

          {assetPlans.length === 0 ? (
            <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 1, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Geen assets gepland. Klik op "Asset Toevoegen" om te beginnen.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {assetPlans.map((plan, index) => (
                <Accordion key={index}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Chip
                        label={EQUIPMENT_TYPES.find(t => t.value === plan.equipmentType)?.label || plan.equipmentType}
                        size="small"
                        color="primary"
                      />
                      {plan.brand && (
                        <Typography variant="body2" color="text.secondary">
                          {plan.brand} {plan.model}
                        </Typography>
                      )}
                      <Box sx={{ flexGrow: 1 }} />
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveAssetPlan(index);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        select
                        label="Apparaattype"
                        value={plan.equipmentType}
                        onChange={(e) => handleUpdateAssetPlan(index, { equipmentType: e.target.value as EquipmentType })}
                        fullWidth
                        SelectProps={{ native: true }}
                      >
                        {EQUIPMENT_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </TextField>
                      <TextField
                        label="Merk"
                        value={plan.brand || ''}
                        onChange={(e) => handleUpdateAssetPlan(index, { brand: e.target.value })}
                        fullWidth
                      />
                      <TextField
                        label="Model"
                        value={plan.model || ''}
                        onChange={(e) => handleUpdateAssetPlan(index, { model: e.target.value })}
                        fullWidth
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={plan.createNew}
                            onChange={(e) => handleUpdateAssetPlan(index, { createNew: e.target.checked })}
                          />
                        }
                        label="Nieuw asset aanmaken tijdens rollout"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={plan.requiresSerialNumber}
                            onChange={(e) => handleUpdateAssetPlan(index, { requiresSerialNumber: e.target.checked })}
                          />
                        }
                        label="Serienummer vereist"
                      />
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          Annuleren
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!isFormValid || createMutation.isPending || updateMutation.isPending}
        >
          {createMutation.isPending || updateMutation.isPending ? 'Opslaan...' : 'Opslaan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RolloutWorkplaceDialog;

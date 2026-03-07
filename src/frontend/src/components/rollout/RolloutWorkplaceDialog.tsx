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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ToggleButtonGroup,
  ToggleButton,
  Slider,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LaptopIcon from '@mui/icons-material/Laptop';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import { useCreateRolloutWorkplace, useUpdateRolloutWorkplace } from '../../hooks/useRollout';
import { SerialSearchField } from './SerialSearchField';
import { TemplateSelector } from './TemplateSelector';
import type {
  RolloutWorkplace,
  CreateRolloutWorkplace,
  UpdateRolloutWorkplace,
  AssetPlan,
} from '../../types/rollout';
import type { Asset, AssetTemplate } from '../../types/asset.types';

interface RolloutWorkplaceDialogProps {
  open: boolean;
  onClose: () => void;
  dayId: number;
  workplace?: RolloutWorkplace;
}

interface MonitorConfig {
  templateId?: number;
  template?: AssetTemplate | null;
  position: 'left' | 'center' | 'right';
  hasCamera: boolean;
  serial?: string;
}

const RolloutWorkplaceDialog = ({ open, onClose, dayId, workplace }: RolloutWorkplaceDialogProps) => {
  const isEditMode = Boolean(workplace);

  // User info state
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [location, setLocation] = useState('');
  const [serviceId, setServiceId] = useState<number | undefined>();

  // Computer state
  const [computerType, setComputerType] = useState<'laptop' | 'desktop'>('laptop');
  const [oldComputerSerial, setOldComputerSerial] = useState('');
  const [oldComputerAsset, setOldComputerAsset] = useState<Asset | null>(null);
  const [newComputerSerial, setNewComputerSerial] = useState('');
  const [newComputerAsset, setNewComputerAsset] = useState<Asset | null>(null);

  // Docking state
  const [dockingTemplate, setDockingTemplate] = useState<AssetTemplate | null>(null);
  const [dockingSerial, setDockingSerial] = useState('');

  // Monitors state
  const [monitorCount, setMonitorCount] = useState(2);
  const [monitorConfigs, setMonitorConfigs] = useState<MonitorConfig[]>([
    { position: 'left', hasCamera: false },
    { position: 'right', hasCamera: false },
  ]);

  // Peripherals state
  const [keyboardTemplate, setKeyboardTemplate] = useState<AssetTemplate | null>(null);
  const [mouseTemplate, setMouseTemplate] = useState<AssetTemplate | null>(null);

  const createMutation = useCreateRolloutWorkplace();
  const updateMutation = useUpdateRolloutWorkplace();

  useEffect(() => {
    if (workplace) {
      setUserName(workplace.userName);
      setUserEmail(workplace.userEmail || '');
      setLocation(workplace.location || '');
      setServiceId(workplace.serviceId);

      // Parse asset plans to populate fields
      const plans = workplace.assetPlans || [];

      const computerPlan = plans.find(p => p.equipmentType === 'laptop' || p.equipmentType === 'desktop');
      if (computerPlan) {
        setComputerType(computerPlan.equipmentType as 'laptop' | 'desktop');
        setNewComputerSerial(computerPlan.metadata?.serialNumber || '');
        if (computerPlan.oldAssetId) {
          setOldComputerSerial(computerPlan.metadata?.oldSerial || '');
        }
      }

      const dockingPlan = plans.find(p => p.equipmentType === 'docking');
      if (dockingPlan) {
        setDockingSerial(dockingPlan.metadata?.serialNumber || '');
      }

      const monitorPlans = plans.filter(p => p.equipmentType === 'monitor');
      if (monitorPlans.length > 0) {
        setMonitorCount(monitorPlans.length);
        setMonitorConfigs(monitorPlans.map(p => ({
          position: (p.metadata?.position || 'left') as 'left' | 'center' | 'right',
          hasCamera: p.metadata?.hasCamera === 'true',
          serial: p.metadata?.serialNumber,
        })));
      }
    } else {
      resetForm();
    }
  }, [workplace, open]);

  const resetForm = () => {
    setUserName('');
    setUserEmail('');
    setLocation('');
    setServiceId(undefined);
    setComputerType('laptop');
    setOldComputerSerial('');
    setOldComputerAsset(null);
    setNewComputerSerial('');
    setNewComputerAsset(null);
    setDockingTemplate(null);
    setDockingSerial('');
    setMonitorCount(2);
    setMonitorConfigs([
      { position: 'left', hasCamera: false },
      { position: 'right', hasCamera: false },
    ]);
    setKeyboardTemplate(null);
    setMouseTemplate(null);
  };

  const updateMonitorConfig = (index: number, field: keyof MonitorConfig, value: any) => {
    const updated = [...monitorConfigs];
    updated[index] = { ...updated[index], [field]: value };
    setMonitorConfigs(updated);
  };

  const handleMonitorCountChange = (_: Event, value: number | number[]) => {
    const count = value as number;
    setMonitorCount(count);

    // Adjust configs array
    const newConfigs: MonitorConfig[] = [];
    const positions: Array<'left' | 'center' | 'right'> = count === 1 ? ['center'] : count === 2 ? ['left', 'right'] : ['left', 'center', 'right'];

    for (let i = 0; i < count; i++) {
      newConfigs.push(monitorConfigs[i] || { position: positions[i], hasCamera: false });
    }
    setMonitorConfigs(newConfigs);
  };

  const buildAssetPlans = (): AssetPlan[] => {
    const plans: AssetPlan[] = [];

    // Computer plan
    plans.push({
      equipmentType: computerType,
      createNew: !newComputerAsset, // Create new if not found
      requiresSerialNumber: true,
      requiresQRCode: false, // Existing or found asset
      status: 'pending',
      metadata: {
        serialNumber: newComputerSerial,
        oldSerial: oldComputerSerial,
      },
      ...(newComputerAsset && {
        existingAssetId: newComputerAsset.id,
        existingAssetCode: newComputerAsset.assetCode,
        existingAssetName: newComputerAsset.assetName,
      }),
      ...(oldComputerAsset && {
        oldAssetId: oldComputerAsset.id,
        oldAssetCode: oldComputerAsset.assetCode,
        oldAssetName: oldComputerAsset.assetName,
      }),
    });

    // Docking plan
    if (dockingTemplate || dockingSerial) {
      plans.push({
        equipmentType: 'docking',
        createNew: true,
        requiresSerialNumber: true,
        requiresQRCode: true,
        status: 'pending',
        brand: dockingTemplate?.brand,
        model: dockingTemplate?.model,
        metadata: {
          serialNumber: dockingSerial,
        },
      });
    }

    // Monitor plans
    monitorConfigs.forEach((config, index) => {
      plans.push({
        equipmentType: 'monitor',
        createNew: true,
        requiresSerialNumber: false,
        requiresQRCode: true,
        status: 'pending',
        brand: config.template?.brand,
        model: config.template?.model,
        metadata: {
          position: config.position,
          hasCamera: config.hasCamera.toString(),
          index: index.toString(),
        },
      });
    });

    // Keyboard plan
    if (keyboardTemplate) {
      plans.push({
        equipmentType: 'keyboard',
        createNew: true,
        requiresSerialNumber: false,
        requiresQRCode: false,
        status: 'pending',
        brand: keyboardTemplate.brand,
        model: keyboardTemplate.model,
        metadata: {},
      });
    }

    // Mouse plan
    if (mouseTemplate) {
      plans.push({
        equipmentType: 'mouse',
        createNew: true,
        requiresSerialNumber: false,
        requiresQRCode: false,
        status: 'pending',
        brand: mouseTemplate.brand,
        model: mouseTemplate.model,
        metadata: {},
      });
    }

    return plans;
  };

  const handleSave = async () => {
    const assetPlans = buildAssetPlans();

    if (isEditMode && workplace) {
      const updateData: UpdateRolloutWorkplace = {
        userName,
        userEmail: userEmail || null,
        location: location || null,
        serviceId: serviceId || null,
        isLaptopSetup: computerType === 'laptop',
        assetPlans,
        status: workplace.status,
        notes: workplace.notes || null,
      };
      await updateMutation.mutateAsync({ workplaceId: workplace.id, data: updateData });
    } else {
      const createData: CreateRolloutWorkplace = {
        rolloutDayId: dayId,
        userName,
        userEmail: userEmail || undefined,
        location: location || undefined,
        serviceId,
        isLaptopSetup: computerType === 'laptop',
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

  const isFormValid = userName.trim() && newComputerSerial.trim();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditMode ? 'Werkplek Bewerken' : 'Nieuwe Werkplek Toevoegen'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
          {/* Section 1: User Information */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight="medium">
                Gebruiker Informatie
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Section 2: Computer (Laptop/Desktop) */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight="medium">
                Computer (Laptop/Desktop)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Type computer
                  </Typography>
                  <ToggleButtonGroup
                    value={computerType}
                    exclusive
                    onChange={(_, value) => value && setComputerType(value)}
                    fullWidth
                  >
                    <ToggleButton value="laptop">
                      <LaptopIcon sx={{ mr: 1 }} />
                      Laptop
                    </ToggleButton>
                    <ToggleButton value="desktop">
                      <DesktopWindowsIcon sx={{ mr: 1 }} />
                      Desktop
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <SerialSearchField
                  label="Oude Computer Serienummer"
                  value={oldComputerSerial}
                  onChange={setOldComputerSerial}
                  onAssetFound={setOldComputerAsset}
                  helperText="Zoek bestaand asset dat wordt vervangen"
                />

                <SerialSearchField
                  label="Nieuwe Computer Serienummer"
                  value={newComputerSerial}
                  onChange={setNewComputerSerial}
                  onAssetFound={setNewComputerAsset}
                  onCreate={(serial) => {
                    // Mark as new asset to be created
                    setNewComputerSerial(serial);
                    setNewComputerAsset(null);
                  }}
                  required
                  helperText="Zoek bestaand asset of maak nieuw aan"
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Section 3: Docking Station */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight="medium">
                Docking Station
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TemplateSelector
                  equipmentType="docking"
                  value={dockingTemplate}
                  onChange={setDockingTemplate}
                  required
                />
                <TextField
                  label="Serienummer"
                  value={dockingSerial}
                  onChange={(e) => setDockingSerial(e.target.value)}
                  required
                  fullWidth
                  helperText="Serienummer van het docking station"
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Section 4: Monitors */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight="medium">
                Monitors ({monitorCount})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Aantal monitors
                  </Typography>
                  <Slider
                    value={monitorCount}
                    min={1}
                    max={3}
                    marks={[
                      { value: 1, label: '1' },
                      { value: 2, label: '2' },
                      { value: 3, label: '3' },
                    ]}
                    step={1}
                    valueLabelDisplay="auto"
                    onChange={handleMonitorCountChange}
                  />
                </Box>

                {monitorConfigs.map((config, index) => (
                  <Box
                    key={index}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 2,
                      backgroundColor: 'background.paper',
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Monitor {index + 1}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                      <TemplateSelector
                        equipmentType="monitor"
                        value={config.template}
                        onChange={(template) => updateMonitorConfig(index, 'template', template)}
                      />

                      <Box>
                        <Typography variant="body2" gutterBottom>
                          Positie
                        </Typography>
                        <ToggleButtonGroup
                          value={config.position}
                          exclusive
                          onChange={(_, value) => value && updateMonitorConfig(index, 'position', value)}
                          fullWidth
                          size="small"
                        >
                          <ToggleButton value="left">Links</ToggleButton>
                          <ToggleButton value="center">Midden</ToggleButton>
                          <ToggleButton value="right">Rechts</ToggleButton>
                        </ToggleButtonGroup>
                      </Box>

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={config.hasCamera}
                            onChange={(e) => updateMonitorConfig(index, 'hasCamera', e.target.checked)}
                          />
                        }
                        label="Heeft camera"
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Section 5: Keyboard & Mouse */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight="medium">
                Toetsenbord &amp; Muis
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TemplateSelector
                  equipmentType="keyboard"
                  value={keyboardTemplate}
                  onChange={setKeyboardTemplate}
                />

                <TemplateSelector
                  equipmentType="mouse"
                  value={mouseTemplate}
                  onChange={setMouseTemplate}
                />
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Annuleren</Button>
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

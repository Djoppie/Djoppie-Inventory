import { useState } from 'react';
import {
  Dialog,
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
  Chip,
  Stack,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LaptopIcon from '@mui/icons-material/Laptop';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import LinkIcon from '@mui/icons-material/Link';
import PersonIcon from '@mui/icons-material/Person';
import ComputerIcon from '@mui/icons-material/Computer';
import DockIcon from '@mui/icons-material/Dock';
import MonitorIcon from '@mui/icons-material/Monitor';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { useCreateRolloutWorkplace, useUpdateRolloutWorkplace } from '../../hooks/useRollout';
import { useAssetTemplates } from '../../hooks/useAssetTemplates';
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

const LinkedAssetChip = ({ workplace, equipmentType, index, variant: chipVariant = 'new' }: {
  workplace?: RolloutWorkplace;
  equipmentType: string;
  index?: number;
  variant?: 'new' | 'old';
}) => {
  const plans = workplace?.assetPlans || [];
  const plan = index !== undefined
    ? plans.filter(p => p.equipmentType === equipmentType)[index]
    : plans.find(p => p.equipmentType === equipmentType);
  if (!plan) return null;
  const code = chipVariant === 'old' ? plan.oldAssetCode : plan.existingAssetCode;
  const name = chipVariant === 'old' ? plan.oldAssetName : plan.existingAssetName;
  if (!code) return null;
  return (
    <Chip
      icon={<LinkIcon />}
      label={`${chipVariant === 'old' ? 'Oud: ' : ''}${code}${name ? ` — ${name}` : ''}`}
      size="small"
      color={chipVariant === 'old' ? 'warning' : 'success'}
      variant="outlined"
      sx={{ mt: 1 }}
    />
  );
};

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
    { position: 'left', hasCamera: false, template: null },
    { position: 'right', hasCamera: false, template: null },
  ]);

  // Peripherals state
  const [keyboardTemplate, setKeyboardTemplate] = useState<AssetTemplate | null>(null);
  const [mouseTemplate, setMouseTemplate] = useState<AssetTemplate | null>(null);

  const createMutation = useCreateRolloutWorkplace();
  const updateMutation = useUpdateRolloutWorkplace();
  const { data: allTemplates } = useAssetTemplates();

  // Track which workplace/templates we've synced to avoid re-syncing
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  const currentKey = workplace ? `${workplace.id}-${workplace.updatedAt}-${allTemplates?.length ?? 0}` : null;

  if (open && currentKey && currentKey !== syncedKey) {
    setSyncedKey(currentKey);

    const findTpl = (brand?: string, model?: string): AssetTemplate | null => {
      if (!allTemplates || !brand) return null;
      return allTemplates.find(t =>
        t.brand?.toLowerCase() === brand.toLowerCase() &&
        (!model || t.model?.toLowerCase() === model.toLowerCase())
      ) || null;
    };

    setUserName(workplace!.userName);
    setUserEmail(workplace!.userEmail || '');
    setLocation(workplace!.location || '');
    setServiceId(workplace!.serviceId);

    const plans = workplace!.assetPlans || [];

    const computerPlan = plans.find(p => p.equipmentType === 'laptop' || p.equipmentType === 'desktop');
    if (computerPlan) {
      setComputerType(computerPlan.equipmentType as 'laptop' | 'desktop');
      setNewComputerSerial(computerPlan.metadata?.serialNumber || '');
      if (computerPlan.existingAssetId) {
        setNewComputerAsset({
          id: computerPlan.existingAssetId,
          assetCode: computerPlan.existingAssetCode || '',
          assetName: computerPlan.existingAssetName || '',
        } as Asset);
      }
      if (computerPlan.oldAssetId) {
        setOldComputerSerial(computerPlan.metadata?.oldSerial || '');
        setOldComputerAsset({
          id: computerPlan.oldAssetId,
          assetCode: computerPlan.oldAssetCode || '',
          assetName: computerPlan.oldAssetName || '',
        } as Asset);
      }
    }

    const dockingPlan = plans.find(p => p.equipmentType === 'docking');
    if (dockingPlan) {
      setDockingSerial(dockingPlan.metadata?.serialNumber || '');
      setDockingTemplate(findTpl(dockingPlan.brand, dockingPlan.model));
    }

    const monitorPlans = plans.filter(p => p.equipmentType === 'monitor');
    if (monitorPlans.length > 0) {
      setMonitorCount(monitorPlans.length);
      setMonitorConfigs(monitorPlans.map(p => ({
        position: (p.metadata?.position || 'left') as 'left' | 'center' | 'right',
        hasCamera: p.metadata?.hasCamera === 'true',
        serial: p.metadata?.serialNumber,
        template: findTpl(p.brand, p.model),
      })));
    }

    const keyboardPlan = plans.find(p => p.equipmentType === 'keyboard');
    if (keyboardPlan) {
      setKeyboardTemplate(findTpl(keyboardPlan.brand, keyboardPlan.model));
    }

    const mousePlan = plans.find(p => p.equipmentType === 'mouse');
    if (mousePlan) {
      setMouseTemplate(findTpl(mousePlan.brand, mousePlan.model));
    }
  }

  // Reset when dialog opens without a workplace (new mode)
  if (open && !workplace && syncedKey !== 'new') {
    setSyncedKey('new');
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
      { position: 'left', hasCamera: false, template: null },
      { position: 'right', hasCamera: false, template: null },
    ]);
    setKeyboardTemplate(null);
    setMouseTemplate(null);
  }

  // Reset synced key when dialog closes
  if (!open && syncedKey !== null) {
    setSyncedKey(null);
  }

  const updateMonitorConfig = (index: number, field: keyof MonitorConfig, value: MonitorConfig[keyof MonitorConfig]) => {
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
      newConfigs.push(monitorConfigs[i] || { position: positions[i], hasCamera: false, template: null });
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
    onClose();
  };

  const isFormValid = userName.trim() && newComputerSerial.trim();

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const sectionIconSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 1.5,
    bgcolor: isDark ? 'rgba(255, 146, 51, 0.12)' : 'rgba(255, 119, 0, 0.08)',
    color: 'primary.main',
    transition: 'all 0.3s ease',
    '& .MuiSvgIcon-root': { fontSize: '1.1rem' },
  };

  const accordionSx = {
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: '12px !important',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&::before': { display: 'none' },
    '&.Mui-expanded': {
      borderColor: 'primary.main',
      boxShadow: isDark
        ? '0 4px 16px rgba(255, 146, 51, 0.1)'
        : '0 4px 16px rgba(255, 119, 0, 0.12)',
    },
  };

  const monitorCardSx = {
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 3,
    p: 2.5,
    bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
    transition: 'all 0.25s ease',
    '&:hover': {
      borderColor: 'primary.light',
      bgcolor: isDark ? 'rgba(255, 146, 51, 0.04)' : 'rgba(255, 119, 0, 0.03)',
    },
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableRestoreFocus
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
        },
      }}
    >
      {/* Styled header with gradient accent */}
      <Box
        sx={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(255, 146, 51, 0.15), rgba(204, 0, 0, 0.08))'
            : 'linear-gradient(135deg, rgba(255, 119, 0, 0.08), rgba(255, 146, 51, 0.04))',
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: 3,
          py: 2.5,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 2,
              background: isDark
                ? 'linear-gradient(145deg, #FF9233, #FF7700)'
                : 'linear-gradient(145deg, #FF9233, #FF7700)',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(255, 119, 0, 0.3)',
            }}
          >
            <ComputerIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              {isEditMode ? 'Werkplek Bewerken' : 'Nieuwe Werkplek'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isEditMode ? 'Pas de werkplekconfiguratie aan' : 'Configureer een nieuwe werkplek'}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Section 1: User Information */}
          <Accordion defaultExpanded sx={accordionSx}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ '&.Mui-expanded': { minHeight: 48 } }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={sectionIconSx}><PersonIcon /></Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Gebruiker Informatie
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0.5 }}>
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
          <Accordion sx={accordionSx}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ '&.Mui-expanded': { minHeight: 48 } }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={sectionIconSx}><ComputerIcon /></Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Computer (Laptop/Desktop)
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Type computer
                  </Typography>
                  <ToggleButtonGroup
                    value={computerType}
                    exclusive
                    onChange={(_, value) => value && setComputerType(value)}
                    fullWidth
                    sx={{
                      '& .MuiToggleButton-root': {
                        borderRadius: 2,
                        py: 1.2,
                        fontWeight: 600,
                        '&.Mui-selected': {
                          bgcolor: isDark ? 'rgba(255, 146, 51, 0.15)' : 'rgba(255, 119, 0, 0.1)',
                          color: 'primary.main',
                          borderColor: 'primary.main',
                          '&:hover': {
                            bgcolor: isDark ? 'rgba(255, 146, 51, 0.2)' : 'rgba(255, 119, 0, 0.15)',
                          },
                        },
                      },
                    }}
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
                <LinkedAssetChip workplace={workplace} equipmentType={computerType} variant="old" />

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
                <LinkedAssetChip workplace={workplace} equipmentType={computerType} />
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Section 3: Docking Station */}
          <Accordion sx={accordionSx}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ '&.Mui-expanded': { minHeight: 48 } }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={sectionIconSx}><DockIcon /></Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Docking Station
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0.5 }}>
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
                <LinkedAssetChip workplace={workplace} equipmentType="docking" />
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Section 4: Monitors */}
          <Accordion sx={accordionSx}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ '&.Mui-expanded': { minHeight: 48 } }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={sectionIconSx}><MonitorIcon /></Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Monitors
                </Typography>
                <Chip
                  label={monitorCount}
                  size="small"
                  color="primary"
                  sx={{ ml: 0.5, fontWeight: 700, minWidth: 28, height: 24 }}
                />
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ px: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
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
                  <Box key={index} sx={monitorCardSx}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <MonitorIcon sx={{ color: 'primary.main', fontSize: '1.1rem' }} />
                      <Typography variant="subtitle2" fontWeight={600}>
                        Monitor {index + 1}
                      </Typography>
                    </Stack>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TemplateSelector
                        equipmentType="monitor"
                        value={config.template}
                        onChange={(template) => updateMonitorConfig(index, 'template', template)}
                      />

                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Positie
                        </Typography>
                        <ToggleButtonGroup
                          value={config.position}
                          exclusive
                          onChange={(_, value) => value && updateMonitorConfig(index, 'position', value)}
                          fullWidth
                          size="small"
                          sx={{
                            '& .MuiToggleButton-root': {
                              borderRadius: 1.5,
                              '&.Mui-selected': {
                                bgcolor: isDark ? 'rgba(255, 146, 51, 0.15)' : 'rgba(255, 119, 0, 0.1)',
                                color: 'primary.main',
                                borderColor: 'primary.main',
                              },
                            },
                          }}
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
                            sx={{
                              '&.Mui-checked': { color: 'primary.main' },
                            }}
                          />
                        }
                        label={
                          <Typography variant="body2">Heeft camera</Typography>
                        }
                      />
                      <LinkedAssetChip workplace={workplace} equipmentType="monitor" index={index} />
                    </Box>
                  </Box>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Section 5: Keyboard & Mouse */}
          <Accordion sx={accordionSx}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ '&.Mui-expanded': { minHeight: 48 } }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={sectionIconSx}><KeyboardIcon /></Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Toetsenbord &amp; Muis
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TemplateSelector
                  equipmentType="keyboard"
                  value={keyboardTemplate}
                  onChange={setKeyboardTemplate}
                />
                <LinkedAssetChip workplace={workplace} equipmentType="keyboard" />

                <TemplateSelector
                  equipmentType="mouse"
                  value={mouseTemplate}
                  onChange={setMouseTemplate}
                />
                <LinkedAssetChip workplace={workplace} equipmentType="mouse" />
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      </DialogContent>

      {/* Styled actions with separator */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
          gap: 1,
        }}
      >
        <Button onClick={handleClose} variant="outlined" sx={{ px: 3 }}>
          Annuleren
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!isFormValid || createMutation.isPending || updateMutation.isPending}
          sx={{ px: 4 }}
        >
          {createMutation.isPending || updateMutation.isPending ? 'Opslaan...' : 'Opslaan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RolloutWorkplaceDialog;

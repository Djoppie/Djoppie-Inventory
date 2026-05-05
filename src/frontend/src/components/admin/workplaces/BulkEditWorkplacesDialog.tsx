import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  MenuItem,
  Stack,
  Chip,
  Alert,
  Divider,
  FormControlLabel,
  Switch,
  Tooltip,
  alpha,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { PhysicalWorkplace, WorkplaceType, WorkplaceTypeLabels } from '../../../types/physicalWorkplace.types';
import { useBulkUpdateWorkplaces } from '../../../hooks/usePhysicalWorkplaces';
import { useBuildings } from '../../../hooks/useBuildings';
import { useServices } from '../../../hooks/useServices';

interface BulkEditWorkplacesDialogProps {
  open: boolean;
  onClose: () => void;
  selectedWorkplaces: PhysicalWorkplace[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

// Sentinel value for "keep existing / do not change"
const NO_CHANGE = '__no_change__';

// Counter placeholder syntax: `{n}`, `{n+1}`, `{n:02}`, `{n+1:02}`
// Captures: 1 = optional offset, 2 = optional zero-pad width
const TEMPLATE_REGEX = /\{n(?:\+(\d+))?(?::(\d+))?\}/g;
const TEMPLATE_DETECT = /\{n(?:\+\d+)?(?::\d+)?\}/;

/** Substitutes counter placeholders in `template` using a 0-indexed row position. */
const expandTemplate = (template: string, zeroBasedIndex: number): string =>
  template.replace(TEMPLATE_REGEX, (_m, offsetStr: string | undefined, padStr: string | undefined) => {
    const offset = offsetStr ? Number(offsetStr) : 0;
    const value = String(zeroBasedIndex + offset);
    return padStr ? value.padStart(Number(padStr), '0') : value;
  });

const templateHasPlaceholder = (template: string): boolean => TEMPLATE_DETECT.test(template);

interface PatchForm {
  buildingId: string;
  serviceId: string;
  type: string;
  isActive: string; // 'true' | 'false' | NO_CHANGE
  floor: string;
}

const initialForm: PatchForm = {
  buildingId: NO_CHANGE,
  serviceId: NO_CHANGE,
  type: NO_CHANGE,
  isActive: NO_CHANGE,
  floor: NO_CHANGE,
};

const TEAL = '#009688';

const BulkEditWorkplacesDialog = ({
  open,
  onClose,
  selectedWorkplaces,
  onSuccess,
  onError,
}: BulkEditWorkplacesDialogProps) => {
  const [form, setForm] = useState<PatchForm>(initialForm);
  const [floorEnabled, setFloorEnabled] = useState(false);

  // New per-id-template fields and bulk Room
  const [codeEnabled, setCodeEnabled] = useState(false);
  const [codeTemplate, setCodeTemplate] = useState('');
  const [nameEnabled, setNameEnabled] = useState(false);
  const [nameTemplate, setNameTemplate] = useState('');
  const [roomEnabled, setRoomEnabled] = useState(false);
  const [room, setRoom] = useState('');

  const bulkUpdateMutation = useBulkUpdateWorkplaces();
  const { data: buildings = [] } = useBuildings();
  const { data: services = [] } = useServices();

  const handleClose = () => {
    setForm(initialForm);
    setFloorEnabled(false);
    setCodeEnabled(false);
    setCodeTemplate('');
    setNameEnabled(false);
    setNameTemplate('');
    setRoomEnabled(false);
    setRoom('');
    onClose();
  };

  // ── Template expansion + validation ───────────────────────────────────────
  const codeMissingPlaceholder =
    codeEnabled && codeTemplate.length > 0 && !templateHasPlaceholder(codeTemplate);

  const expansions = useMemo(() => {
    return selectedWorkplaces.map((wp, idx) => {
      const newCode = codeEnabled && codeTemplate ? expandTemplate(codeTemplate, idx) : null;
      const newName = nameEnabled && nameTemplate ? expandTemplate(nameTemplate, idx) : null;
      return {
        id: wp.id,
        currentCode: wp.code,
        currentName: wp.name,
        currentBuildingId: wp.buildingId,
        newCode,
        newName,
        codeChanged: newCode !== null && newCode.trim() !== '' && newCode !== wp.code,
        nameChanged: newName !== null && newName !== wp.name,
      };
    });
  }, [selectedWorkplaces, codeEnabled, codeTemplate, nameEnabled, nameTemplate]);

  // Detect intra-batch code collisions per (effective building, code).
  // Use the dto.buildingId override if set; otherwise the row's existing buildingId.
  const effectiveBuildingFor = (currentBuildingId: number) =>
    form.buildingId !== NO_CHANGE ? Number(form.buildingId) : currentBuildingId;

  const codeCollisions = useMemo(() => {
    if (!codeEnabled || !codeTemplate || codeMissingPlaceholder) return new Set<number>();
    const seen = new Map<string, number[]>();
    for (const e of expansions) {
      if (e.newCode === null || e.newCode.trim() === '') continue;
      const key = `${effectiveBuildingFor(e.currentBuildingId)}::${e.newCode.trim().toLowerCase()}`;
      const arr = seen.get(key) ?? [];
      arr.push(e.id);
      seen.set(key, arr);
    }
    const dupes = new Set<number>();
    for (const arr of seen.values()) {
      if (arr.length > 1) arr.forEach((id) => dupes.add(id));
    }
    return dupes;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeEnabled, codeTemplate, codeMissingPlaceholder, expansions, form.buildingId]);

  const changesCount =
    [
      form.buildingId !== NO_CHANGE,
      form.serviceId !== NO_CHANGE,
      form.type !== NO_CHANGE,
      form.isActive !== NO_CHANGE,
      floorEnabled,
      roomEnabled,
      codeEnabled && codeTemplate.length > 0,
      nameEnabled && nameTemplate.length > 0,
    ].filter(Boolean).length;

  const blockingError =
    (codeEnabled && codeTemplate.length > 0 && codeMissingPlaceholder) ||
    codeCollisions.size > 0;

  const handleSubmit = async () => {
    if (changesCount === 0) {
      onError('Selecteer minstens 1 veld om te wijzigen');
      return;
    }
    if (blockingError) {
      onError('Los eerst de validatie-fouten op (zie onderaan).');
      return;
    }

    const dto: Parameters<typeof bulkUpdateMutation.mutateAsync>[0] = {
      ids: selectedWorkplaces.map((w) => w.id),
    };

    if (form.buildingId !== NO_CHANGE) dto.buildingId = Number(form.buildingId);
    if (form.serviceId !== NO_CHANGE) dto.serviceId = Number(form.serviceId);
    if (form.type !== NO_CHANGE) dto.type = form.type;
    if (form.isActive !== NO_CHANGE) dto.isActive = form.isActive === 'true';
    if (floorEnabled) dto.floor = form.floor;
    if (roomEnabled) dto.room = room;

    if (codeEnabled && codeTemplate) {
      const codes: Record<number, string> = {};
      for (const e of expansions) {
        if (e.codeChanged && e.newCode !== null) codes[e.id] = e.newCode;
      }
      if (Object.keys(codes).length > 0) dto.codes = codes;
    }
    if (nameEnabled && nameTemplate) {
      const names: Record<number, string> = {};
      for (const e of expansions) {
        if (e.nameChanged && e.newName !== null) names[e.id] = e.newName;
      }
      if (Object.keys(names).length > 0) dto.names = names;
    }

    try {
      const result = await bulkUpdateMutation.mutateAsync(dto);
      const msg =
        result.errors.length > 0
          ? `${result.updated} werkplekken bijgewerkt, ${result.skipped} overgeslagen`
          : `${result.updated} werkplekken bijgewerkt`;
      onSuccess(msg);
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fout bij bulk bewerken';
      onError(message);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          border: '2px solid',
          borderColor: TEAL,
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark' ? alpha(TEAL, 0.1) : alpha(TEAL, 0.05),
          color: TEAL,
          fontWeight: 700,
          borderBottom: '1px solid',
          borderColor: alpha(TEAL, 0.3),
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <EditIcon />
        Werkplekken Bulk Bewerken
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {/* Summary chips */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }} flexWrap="wrap">
          <Chip
            label={`${selectedWorkplaces.length} werkplekken geselecteerd`}
            size="small"
            sx={{
              bgcolor: alpha(TEAL, 0.12),
              color: TEAL,
              fontWeight: 700,
              border: '1px solid',
              borderColor: alpha(TEAL, 0.3),
            }}
          />
          {changesCount > 0 && (
            <Chip
              label={`${changesCount} veld${changesCount === 1 ? '' : 'en'} te wijzigen`}
              size="small"
              color="primary"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Stack>

        <Alert severity="info" sx={{ mb: 2, fontSize: '0.8rem' }}>
          Lege velden (Geen wijziging) worden niet aangepast. Vul alleen de velden in die je wil wijzigen.
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* ─────────────── Identifiers — Code (template) ─────────────── */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={codeEnabled}
                  onChange={(e) => {
                    setCodeEnabled(e.target.checked);
                    if (!e.target.checked) setCodeTemplate('');
                  }}
                  color="primary"
                  size="small"
                />
              }
              label={
                <Typography variant="body2" fontWeight={600}>
                  Code wijzigen (template met teller)
                </Typography>
              }
            />
            {codeEnabled && (
              <Box sx={{ mt: 1 }}>
                <TextField
                  label="Code template"
                  placeholder="bv. PG-RO-FO-{n+1:02}"
                  value={codeTemplate}
                  onChange={(e) => setCodeTemplate(e.target.value)}
                  fullWidth
                  size="small"
                  error={codeMissingPlaceholder}
                  helperText={
                    codeMissingPlaceholder
                      ? 'Codes moeten uniek zijn — voeg een teller toe (bv. {n+1:02}).'
                      : 'Placeholders: {n} (0-based), {n+1} (1-based), {n+1:02} (01,02,03…). Meerdere mag.'
                  }
                />
              </Box>
            )}
          </Box>

          {/* ─────────────── Identifiers — Name (template) ─────────────── */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={nameEnabled}
                  onChange={(e) => {
                    setNameEnabled(e.target.checked);
                    if (!e.target.checked) setNameTemplate('');
                  }}
                  color="primary"
                  size="small"
                />
              }
              label={
                <Typography variant="body2" fontWeight={600}>
                  Naam wijzigen (template, optionele teller)
                </Typography>
              }
            />
            {nameEnabled && (
              <TextField
                label="Naam template"
                placeholder="bv. Ruimte - FrontOffice - {n+1:02}"
                value={nameTemplate}
                onChange={(e) => setNameTemplate(e.target.value)}
                fullWidth
                size="small"
                helperText="Een vaste naam (zonder teller) is toegestaan — alle rijen krijgen dezelfde naam."
                sx={{ mt: 1 }}
              />
            )}
          </Box>

          <Divider />

          {/* Building */}
          <TextField
            select
            label="Gebouw"
            value={form.buildingId}
            onChange={(e) => setForm((p) => ({ ...p, buildingId: e.target.value }))}
            fullWidth
            size="small"
          >
            <MenuItem value={NO_CHANGE}>
              <em>Geen wijziging</em>
            </MenuItem>
            {buildings.map((b) => (
              <MenuItem key={b.id} value={String(b.id)}>
                {b.code} - {b.name}
              </MenuItem>
            ))}
          </TextField>

          {/* Service */}
          <TextField
            select
            label="Dienst"
            value={form.serviceId}
            onChange={(e) => setForm((p) => ({ ...p, serviceId: e.target.value }))}
            fullWidth
            size="small"
          >
            <MenuItem value={NO_CHANGE}>
              <em>Geen wijziging</em>
            </MenuItem>
            {services.map((s) => (
              <MenuItem key={s.id} value={String(s.id)}>
                {s.code} - {s.name}
              </MenuItem>
            ))}
          </TextField>

          {/* Type */}
          <TextField
            select
            label="Type"
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            fullWidth
            size="small"
          >
            <MenuItem value={NO_CHANGE}>
              <em>Geen wijziging</em>
            </MenuItem>
            {Object.entries(WorkplaceTypeLabels).map(([value, label]) => (
              <MenuItem key={value} value={value as WorkplaceType}>
                {label}
              </MenuItem>
            ))}
          </TextField>

          {/* Status (active/inactive) */}
          <TextField
            select
            label="Status"
            value={form.isActive}
            onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.value }))}
            fullWidth
            size="small"
          >
            <MenuItem value={NO_CHANGE}>
              <em>Geen wijziging</em>
            </MenuItem>
            <MenuItem value="true">Actief</MenuItem>
            <MenuItem value="false">Inactief</MenuItem>
          </TextField>

          <Divider />

          {/* ─────────────── Verdieping — bulk plain ─────────────── */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={floorEnabled}
                  onChange={(e) => {
                    setFloorEnabled(e.target.checked);
                    if (!e.target.checked) setForm((p) => ({ ...p, floor: NO_CHANGE }));
                  }}
                  color="primary"
                  size="small"
                />
              }
              label={
                <Typography variant="body2" fontWeight={600}>
                  Verdieping wijzigen
                </Typography>
              }
            />
            {floorEnabled && (
              <TextField
                label="Verdieping"
                value={form.floor === NO_CHANGE ? '' : form.floor}
                onChange={(e) => setForm((p) => ({ ...p, floor: e.target.value }))}
                helperText="Laat leeg om verdieping te wissen"
                fullWidth
                size="small"
                sx={{ mt: 1 }}
              />
            )}
          </Box>

          {/* ─────────────── Kamer — bulk plain ─────────────── */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={roomEnabled}
                  onChange={(e) => {
                    setRoomEnabled(e.target.checked);
                    if (!e.target.checked) setRoom('');
                  }}
                  color="primary"
                  size="small"
                />
              }
              label={
                <Typography variant="body2" fontWeight={600}>
                  Kamer wijzigen (zelfde waarde voor alle rijen)
                </Typography>
              }
            />
            {roomEnabled && (
              <TextField
                label="Kamer"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                helperText="Laat leeg om kamer te wissen"
                fullWidth
                size="small"
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        </Box>

        {/* ─────────────── Live preview ─────────────── */}
        {(codeEnabled || nameEnabled) && expansions.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
              <InfoOutlinedIcon sx={{ fontSize: 16, color: TEAL }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: TEAL }}>
                Voorbeeld
              </Typography>
              {codeCollisions.size > 0 && (
                <Chip
                  label={`${codeCollisions.size} botsing${codeCollisions.size === 1 ? '' : 'en'}`}
                  size="small"
                  color="error"
                  sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                />
              )}
            </Box>
            <Box
              sx={{
                maxHeight: 220,
                overflowY: 'auto',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
                fontSize: '0.72rem',
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(80px, auto) 1fr 1fr',
                  gap: 0.5,
                  px: 1,
                  py: 0.5,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontSize: '0.6rem',
                  color: 'text.secondary',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  position: 'sticky',
                  top: 0,
                  bgcolor: 'background.paper',
                  zIndex: 1,
                }}
              >
                <Box>Rij</Box>
                <Box>Code</Box>
                <Box>Naam</Box>
              </Box>
              {expansions.map((e, idx) => {
                const collides = codeCollisions.has(e.id);
                return (
                  <Box
                    key={e.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(80px, auto) 1fr 1fr',
                      gap: 0.5,
                      px: 1,
                      py: 0.5,
                      borderBottom: idx === expansions.length - 1 ? 'none' : '1px solid',
                      borderColor: 'divider',
                      bgcolor: collides ? alpha('#f44336', 0.08) : 'transparent',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Chip label={`#${idx + 1}`} size="small" sx={{ height: 16, fontSize: '0.6rem' }} />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                      {e.codeChanged ? (
                        <>
                          <Box component="span" sx={{ color: 'text.secondary', textDecoration: 'line-through' }}>
                            {e.currentCode}
                          </Box>
                          <Box component="span" sx={{ color: 'text.secondary' }}>→</Box>
                          <Box
                            component="span"
                            sx={{
                              fontWeight: 700,
                              color: collides ? '#f44336' : TEAL,
                              fontFamily: 'monospace',
                            }}
                          >
                            {e.newCode}
                          </Box>
                          {collides && (
                            <Tooltip title="Deze code komt meermaals voor in dit gebouw — pas de template aan.">
                              <Chip label="dupe" size="small" color="error" sx={{ height: 14, fontSize: '0.55rem' }} />
                            </Tooltip>
                          )}
                        </>
                      ) : (
                        <Box component="span" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                          {e.currentCode}
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                      {e.nameChanged ? (
                        <>
                          <Box component="span" sx={{ color: 'text.secondary', textDecoration: 'line-through' }}>
                            {e.currentName}
                          </Box>
                          <Box component="span" sx={{ color: 'text.secondary' }}>→</Box>
                          <Box component="span" sx={{ fontWeight: 600, color: TEAL }}>
                            {e.newName}
                          </Box>
                        </>
                      ) : (
                        <Box component="span" sx={{ color: 'text.secondary' }}>
                          {e.currentName}
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </>
        )}

        {/* Selected list (compact, only for small selections) */}
        {!codeEnabled && !nameEnabled && selectedWorkplaces.length > 0 && selectedWorkplaces.length <= 5 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Geselecteerde werkplekken:
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
              {selectedWorkplaces.map((w) => (
                <Chip
                  key={w.id}
                  label={`${w.code} - ${w.name}`}
                  size="small"
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              ))}
            </Stack>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
        <Button onClick={handleClose} color="inherit">
          Annuleren
        </Button>
        <Tooltip
          title={
            blockingError
              ? codeCollisions.size > 0
                ? 'Code-botsingen detecteerd — pas de template aan.'
                : 'Code template moet een teller bevatten ({n+1:02}).'
              : ''
          }
          placement="top"
        >
          <span>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={bulkUpdateMutation.isPending || changesCount === 0 || blockingError}
              sx={{
                bgcolor: TEAL,
                '&:hover': { bgcolor: '#00796b' },
              }}
            >
              {bulkUpdateMutation.isPending
                ? 'Opslaan...'
                : `Wijzig ${selectedWorkplaces.length} werkplekken`}
            </Button>
          </span>
        </Tooltip>
      </DialogActions>
    </Dialog>
  );
};

export default BulkEditWorkplacesDialog;

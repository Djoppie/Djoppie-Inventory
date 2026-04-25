import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  TextField,
  Divider,
  CircularProgress,
  alpha,
  useTheme,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useTranslation } from 'react-i18next';
import { Asset } from '../../../types/asset.types';
import EmployeeAutocomplete from '../../common/EmployeeAutocomplete';
import { useAssignAssetToEmployee } from '../../../hooks/useAssets';
import { getNeumorph, getNeumorphColors } from '../../../utils/neumorphicStyles';

const EMPLOYEE_COLOR = '#7b1fa2';

interface BulkAssignEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  assets: Asset[];
  onSuccess?: () => void;
}

interface AssignResult {
  asset: Asset;
  success: boolean;
  error?: string;
}

const BulkAssignEmployeeDialog = ({
  open,
  onClose,
  assets,
  onSuccess,
}: BulkAssignEmployeeDialogProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  const [step, setStep] = useState<'pick' | 'running' | 'done'>('pick');
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [installationDate, setInstallationDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AssignResult[]>([]);
  const [progress, setProgress] = useState(0);

  const assignMutation = useAssignAssetToEmployee();

  const handleClose = () => {
    if (step === 'running') return;
    setStep('pick');
    setEmployeeId(null);
    setInstallationDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setError(null);
    setResults([]);
    setProgress(0);
    onClose();
    if (step === 'done') onSuccess?.();
  };

  const handleSubmit = async () => {
    if (!employeeId) {
      setError(t('assetDetail.assignment.employeeRequired', 'Selecteer een medewerker.'));
      return;
    }
    setError(null);
    setStep('running');
    const newResults: AssignResult[] = [];

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      try {
        await assignMutation.mutateAsync({
          assetId: asset.id,
          data: {
            employeeId,
            installationDate: installationDate || undefined,
            notes: notes || undefined,
          },
        });
        newResults.push({ asset, success: true });
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : t('assetsPage.bulkActions.assignFailed', 'Toewijzing mislukt.');
        newResults.push({ asset, success: false, error: message });
      }
      setProgress(Math.round(((i + 1) / assets.length) * 100));
      setResults([...newResults]);
    }

    setStep('done');
  };

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableRestoreFocus
      PaperProps={{
        sx: {
          borderRadius: 2.5,
          bgcolor: bgSurface,
          boxShadow: getNeumorph(isDark, 'strong'),
          border: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          pb: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(EMPLOYEE_COLOR, 0.1),
            border: `1px solid ${alpha(EMPLOYEE_COLOR, 0.2)}`,
            flexShrink: 0,
          }}
        >
          <PersonAddIcon sx={{ fontSize: 20, color: EMPLOYEE_COLOR }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
            {t('assetsPage.bulkActions.assignEmployee', 'Toewijzen aan medewerker')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {assets.length}{' '}
            {t('assetsPage.bulkActions.selectedAssets', 'geselecteerde activa')}
          </Typography>
        </Box>
        <Button
          size="small"
          onClick={handleClose}
          disabled={step === 'running'}
          sx={{ minWidth: 'auto', p: 0.5, color: 'text.secondary' }}
        >
          <CloseIcon fontSize="small" />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5 }}>
        {/* Step: pick */}
        {step === 'pick' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: 1.5 }}>
                {error}
              </Alert>
            )}

            {/* Assets to assign summary */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: isDark ? alpha(EMPLOYEE_COLOR, 0.06) : alpha(EMPLOYEE_COLOR, 0.04),
                border: `1px solid ${alpha(EMPLOYEE_COLOR, 0.15)}`,
              }}
            >
              <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={1}>
                {t('assetsPage.bulkActions.assetsToAssign', 'Te koppelen activa')}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {assets.slice(0, 8).map((asset) => (
                  <Chip
                    key={asset.id}
                    label={asset.assetCode}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      bgcolor: alpha(EMPLOYEE_COLOR, 0.1),
                      color: EMPLOYEE_COLOR,
                    }}
                  />
                ))}
                {assets.length > 8 && (
                  <Chip
                    label={`+${assets.length - 8}`}
                    size="small"
                    sx={{ height: 22, fontSize: '0.7rem', color: 'text.secondary' }}
                  />
                )}
              </Box>
            </Box>

            {/* Employee picker */}
            <Box>
              <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.75}>
                {t('assetDetail.assignment.employee', 'Medewerker')} *
              </Typography>
              <EmployeeAutocomplete
                value={employeeId}
                onChange={(id) => {
                  setEmployeeId(id);
                  setError(null);
                }}
                label={t('assetDetail.assignment.searchEmployee', 'Zoek medewerker')}
                placeholder={t('assetDetail.assignment.searchPlaceholder', 'Typ naam of dienst...')}
                size="small"
              />
            </Box>

            <Divider />

            {/* Installation date */}
            <Box>
              <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.75}>
                {t('assetDetail.assignment.installationDate', 'Installatiedatum')} ({t('common.optional', 'optioneel')})
              </Typography>
              <TextField
                type="date"
                size="small"
                fullWidth
                value={installationDate}
                onChange={(e) => setInstallationDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            {/* Notes */}
            <Box>
              <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.75}>
                {t('assetDetail.assignment.notes', 'Notities')} ({t('common.optional', 'optioneel')})
              </Typography>
              <TextField
                multiline
                rows={2}
                size="small"
                fullWidth
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t(
                  'assetDetail.assignment.notesPlaceholder',
                  'Bijv. tijdelijke toewijzing tijdens renovatie...',
                )}
              />
            </Box>
          </Box>
        )}

        {/* Step: running */}
        {step === 'running' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <CircularProgress size={20} sx={{ color: EMPLOYEE_COLOR }} />
              <Typography variant="body2" fontWeight={600}>
                {t('assetsPage.bulkActions.assigning', 'Bezig met toewijzen...')} {results.length}/{assets.length}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                borderRadius: 1,
                bgcolor: alpha(EMPLOYEE_COLOR, 0.15),
                '& .MuiLinearProgress-bar': { bgcolor: EMPLOYEE_COLOR, borderRadius: 1 },
              }}
            />
            <List dense disablePadding sx={{ maxHeight: 200, overflow: 'auto' }}>
              {results.map((r) => (
                <ListItem key={r.asset.id} sx={{ px: 0, py: 0.25 }}>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    {r.success ? (
                      <CheckCircleIcon sx={{ fontSize: 16, color: '#4CAF50' }} />
                    ) : (
                      <ErrorOutlineIcon sx={{ fontSize: 16, color: '#f44336' }} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={r.asset.assetCode}
                    secondary={r.error}
                    primaryTypographyProps={{ variant: 'caption', fontFamily: 'monospace', fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'caption', color: 'error' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Step: done */}
        {step === 'done' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: alpha('#4CAF50', 0.08),
                  border: `1px solid ${alpha('#4CAF50', 0.2)}`,
                  textAlign: 'center',
                }}
              >
                <Typography variant="h5" fontWeight={800} color="#4CAF50">
                  {successCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('assetsPage.bulkActions.succeeded', 'Geslaagd')}
                </Typography>
              </Box>
              {failCount > 0 && (
                <Box
                  sx={{
                    flex: 1,
                    p: 1.5,
                    borderRadius: 1.5,
                    bgcolor: alpha('#f44336', 0.08),
                    border: `1px solid ${alpha('#f44336', 0.2)}`,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h5" fontWeight={800} color="#f44336">
                    {failCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('assetsPage.bulkActions.failed', 'Mislukt')}
                  </Typography>
                </Box>
              )}
            </Box>

            {failCount > 0 && (
              <List dense disablePadding sx={{ maxHeight: 180, overflow: 'auto' }}>
                {results
                  .filter((r) => !r.success)
                  .map((r) => (
                    <ListItem key={r.asset.id} sx={{ px: 0, py: 0.25 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <ErrorOutlineIcon sx={{ fontSize: 16, color: '#f44336' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={r.asset.assetCode}
                        secondary={r.error}
                        primaryTypographyProps={{ variant: 'caption', fontFamily: 'monospace', fontWeight: 600 }}
                        secondaryTypographyProps={{ variant: 'caption', color: 'error' }}
                      />
                    </ListItem>
                  ))}
              </List>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1, borderTop: '1px solid', borderColor: 'divider' }}
      >
        {step === 'done' ? (
          <Button
            variant="contained"
            onClick={handleClose}
            sx={{
              bgcolor: EMPLOYEE_COLOR,
              color: '#fff',
              fontWeight: 600,
              borderRadius: 2,
              '&:hover': { bgcolor: alpha(EMPLOYEE_COLOR, 0.85) },
            }}
          >
            {t('common.close', 'Sluiten')}
          </Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={step === 'running'} color="inherit">
              {t('common.cancel', 'Annuleren')}
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!employeeId || step === 'running'}
              startIcon={
                step === 'running' ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <PersonAddIcon />
                )
              }
              sx={{
                bgcolor: EMPLOYEE_COLOR,
                color: '#fff',
                fontWeight: 600,
                borderRadius: 2,
                '&:hover': { bgcolor: alpha(EMPLOYEE_COLOR, 0.85) },
                '&.Mui-disabled': { bgcolor: alpha(EMPLOYEE_COLOR, 0.3), color: '#fff' },
              }}
            >
              {step === 'running'
                ? t('common.saving', 'Opslaan...')
                : t('assetsPage.bulkActions.assignEmployee', 'Toewijzen aan medewerker')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BulkAssignEmployeeDialog;

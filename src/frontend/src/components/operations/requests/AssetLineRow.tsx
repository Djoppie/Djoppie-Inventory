import {
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Box,
  useTheme,
  alpha,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useTranslation } from 'react-i18next';
import type {
  AssetRequestLineDto,
  AssetRequestLineSourceType,
  AssetRequestType,
  AssetReturnAction,
  CreateAssetRequestLineDto,
} from '../../../types/assetRequest.types';
import { LineStatusBadge } from './LineStatusBadge';
import {
  getNeumorph,
  getNeumorphInset,
  getNeumorphColors,
  getNeumorphTextField,
  getNeumorphIconButton,
} from '../../../utils/neumorphicStyles';

export type EditableLine = AssetRequestLineDto | (CreateAssetRequestLineDto & { id?: number });

interface Props {
  line: EditableLine;
  requestType: AssetRequestType;
  assetTypes: { id: number; name: string }[];
  onChange: (next: EditableLine) => void;
  onSkipToggle?: () => void;
  onDelete: () => void;
  /** Controls passed in from parent for asset/template pickers — kept dumb on purpose */
  assetPicker: React.ReactNode;
  templatePicker: React.ReactNode;
  /**
   * Optional full-width region rendered below the inline fields. Used by the
   * inline-expanding asset table picker to slide its results into the card
   * without breaking the line's horizontal rhythm.
   */
  bottomPanel?: React.ReactNode;
  readOnly?: boolean;
}

const SOURCE_TYPES: AssetRequestLineSourceType[] = [
  'ToBeAssigned',
  'ExistingInventory',
  'NewFromTemplate',
];

const RETURN_ACTIONS: AssetReturnAction[] = ['ReturnToStock', 'Decommission', 'Reassign'];

export function AssetLineRow({
  line,
  requestType,
  assetTypes,
  onChange,
  onSkipToggle,
  onDelete,
  assetPicker,
  templatePicker,
  bottomPanel,
  readOnly,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  const sourceType = (line as AssetRequestLineDto).sourceType ?? 'ToBeAssigned';
  const status = (line as AssetRequestLineDto).status;

  // Neumorphic styles
  const inputSx = getNeumorphTextField(isDark, '#1976D2');
  const isSkipped = status === 'Skipped';

  return (
    <Box
      sx={{
        borderRadius: 2,
        p: 2,
        bgcolor: bgSurface,
        boxShadow: getNeumorph(isDark, 'soft'),
        border: '1px solid',
        borderColor: isSkipped ? alpha('#FF9800', 0.3) : 'divider',
        opacity: isSkipped ? 0.65 : 1,
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: getNeumorph(isDark, 'medium'),
          borderColor: isSkipped ? alpha('#FF9800', 0.5) : alpha('#1976D2', 0.3),
        },
      }}
    >
      {/* Main fields row — wraps on small screens */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'stretch', sm: 'flex-start' }}
        flexWrap="wrap"
        useFlexGap
      >
        <FormControl size="small" sx={{ minWidth: 160, ...inputSx }}>
          <InputLabel>{t('requests.lines.assetType')}</InputLabel>
          <Select
            value={line.assetTypeId ?? ''}
            label={t('requests.lines.assetType')}
            onChange={(e) => onChange({ ...line, assetTypeId: Number(e.target.value) })}
            disabled={readOnly}
          >
            {assetTypes.map((at) => (
              <MenuItem key={at.id} value={at.id}>
                {at.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 180, ...inputSx }}>
          <InputLabel>{t('requests.lines.source')}</InputLabel>
          <Select
            value={sourceType}
            label={t('requests.lines.source')}
            onChange={(e) =>
              onChange({ ...line, sourceType: e.target.value as AssetRequestLineSourceType })
            }
            disabled={readOnly}
          >
            {SOURCE_TYPES.map((s) => (
              <MenuItem key={s} value={s}>
                {t(`requests.sourceType.${s}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {sourceType === 'ExistingInventory' && (
          <Box sx={{ flex: 1, minWidth: 220 }}>{assetPicker}</Box>
        )}
        {sourceType === 'NewFromTemplate' && (
          <Box sx={{ flex: 1, minWidth: 220 }}>{templatePicker}</Box>
        )}

        {requestType === 'offboarding' && (
          <FormControl size="small" sx={{ minWidth: 160, ...inputSx }}>
            <InputLabel>{t('requests.lines.returnAction')}</InputLabel>
            <Select
              value={line.returnAction ?? ''}
              label={t('requests.lines.returnAction')}
              onChange={(e) =>
                onChange({ ...line, returnAction: e.target.value as AssetReturnAction })
              }
              disabled={readOnly}
            >
              {RETURN_ACTIONS.map((a) => (
                <MenuItem key={a} value={a}>
                  {t(`requests.returnAction.${a}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <TextField
          size="small"
          label={t('requests.lines.notes')}
          value={line.notes ?? ''}
          onChange={(e) => onChange({ ...line, notes: e.target.value })}
          sx={{ flex: 2, minWidth: 200, ...inputSx }}
          disabled={readOnly}
        />
      </Stack>

      {/* Inline-expanding panel (asset table picker) */}
      {bottomPanel}

      {/* Trailing toolbar — status badge + action icons */}
      <Stack
        direction="row"
        spacing={0.5}
        alignItems="center"
        justifyContent="flex-end"
        mt={1.5}
        sx={{
          pt: 1.5,
          borderTop: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          boxShadow: `inset 0 1px 0 ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`,
        }}
      >
        {status && <LineStatusBadge status={status} />}

        {onSkipToggle && (
          <Tooltip title={t('requests.lineStatus.Skipped')}>
            <IconButton
              onClick={onSkipToggle}
              size="small"
              disabled={readOnly}
              sx={{
                ...getNeumorphIconButton(isDark, '#FF9800'),
                width: 32,
                height: 32,
                borderRadius: 1,
                ...(isSkipped && {
                  bgcolor: alpha('#FF9800', 0.15),
                  color: '#FF9800',
                  boxShadow: getNeumorphInset(isDark),
                }),
              }}
            >
              <VisibilityOffIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title={t('requests.actions.delete')}>
          <IconButton
            onClick={onDelete}
            size="small"
            disabled={readOnly}
            sx={{
              ...getNeumorphIconButton(isDark, theme.palette.error.main),
              width: 32,
              height: 32,
              borderRadius: 1,
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
}

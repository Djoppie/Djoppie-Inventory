import {
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
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
  readOnly,
}: Props) {
  const { t } = useTranslation();
  const sourceType = (line as AssetRequestLineDto).sourceType ?? 'ToBeAssigned';
  const status = (line as AssetRequestLineDto).status;

  return (
    <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ width: '100%' }}>
      <FormControl size="small" sx={{ minWidth: 160 }}>
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

      <FormControl size="small" sx={{ minWidth: 180 }}>
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
        <div style={{ flex: 1, minWidth: 220 }}>{assetPicker}</div>
      )}
      {sourceType === 'NewFromTemplate' && (
        <div style={{ flex: 1, minWidth: 220 }}>{templatePicker}</div>
      )}

      {requestType === 'offboarding' && (
        <FormControl size="small" sx={{ minWidth: 160 }}>
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
        sx={{ flex: 2, minWidth: 200 }}
        disabled={readOnly}
      />

      {status && <LineStatusBadge status={status} />}

      {onSkipToggle && (
        <Tooltip title={t('requests.lineStatus.Skipped')}>
          <IconButton onClick={onSkipToggle} size="small" disabled={readOnly}>
            <VisibilityOffIcon />
          </IconButton>
        </Tooltip>
      )}

      <Tooltip title={t('requests.actions.delete')}>
        <IconButton onClick={onDelete} size="small" color="error" disabled={readOnly}>
          <DeleteIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

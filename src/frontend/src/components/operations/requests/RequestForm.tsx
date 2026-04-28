import { Stack, TextField, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { EmployeePickerWithFallback } from './EmployeePickerWithFallback';
import { WorkplacePicker } from './pickers/WorkplacePicker';
import { physicalWorkplacesApi } from '../../../api/physicalWorkplaces.api';
import { searchEmployees } from '../../../api/organization.api';
import { getNeumorphTextField } from '../../../utils/neumorphicStyles';

// Accent color shared with the requests feature.
const REQUESTS_COLOR = '#1976D2';

export interface RequestFormState {
  requestedFor: string;
  employeeId?: number;
  requestedDate: string; // ISO
  physicalWorkplaceId?: number;
  notes?: string;
}

interface Props {
  value: RequestFormState;
  onChange: (next: RequestFormState) => void;
  readOnly?: boolean;
}

export function RequestForm({ value, onChange, readOnly }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const inputSx = getNeumorphTextField(isDark, REQUESTS_COLOR);

  const { data: workplaces = [] } = useQuery({
    queryKey: ['physical-workplaces-for-picker'],
    queryFn: () => physicalWorkplacesApi.getAll(),
  });

  return (
    <Stack spacing={2}>
      <EmployeePickerWithFallback
        required
        value={{ requestedFor: value.requestedFor, employeeId: value.employeeId }}
        onChange={(next) => onChange({ ...value, ...next })}
        fetchEmployees={searchEmployees}
      />

      <TextField
        type="date"
        label={t('requests.form.requestedDate')}
        value={value.requestedDate.substring(0, 10)}
        onChange={(e) =>
          onChange({ ...value, requestedDate: new Date(e.target.value).toISOString() })
        }
        InputLabelProps={{ shrink: true }}
        disabled={readOnly}
        required
        sx={inputSx}
      />

      <WorkplacePicker
        options={workplaces}
        value={workplaces.find((w) => w.id === value.physicalWorkplaceId) ?? null}
        onChange={(selected) =>
          onChange({ ...value, physicalWorkplaceId: selected?.id })
        }
        label={t('requests.form.physicalWorkplace')}
        disabled={readOnly}
      />

      <TextField
        label={t('requests.form.notes')}
        value={value.notes ?? ''}
        onChange={(e) => onChange({ ...value, notes: e.target.value })}
        multiline
        rows={3}
        disabled={readOnly}
        sx={inputSx}
      />
    </Stack>
  );
}

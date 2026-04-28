import { Stack, TextField, Autocomplete } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { EmployeePickerWithFallback } from './EmployeePickerWithFallback';
import { physicalWorkplacesApi } from '../../../api/physicalWorkplaces.api';
import { searchEmployees } from '../../../api/organization.api';

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
      />

      <Autocomplete
        options={workplaces}
        getOptionLabel={(w) => `${w.code} — ${w.name}`}
        value={workplaces.find((w) => w.id === value.physicalWorkplaceId) ?? null}
        onChange={(_, selected) =>
          onChange({ ...value, physicalWorkplaceId: selected?.id })
        }
        renderInput={(params) => (
          <TextField {...params} label={t('requests.form.physicalWorkplace')} />
        )}
        disabled={readOnly}
      />

      <TextField
        label={t('requests.form.notes')}
        value={value.notes ?? ''}
        onChange={(e) => onChange({ ...value, notes: e.target.value })}
        multiline
        rows={3}
        disabled={readOnly}
      />
    </Stack>
  );
}

import { useState } from 'react';
import { TextField, Stack, Switch, FormControlLabel, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { EmployeePicker, type EmployeePickerOption } from './pickers/EmployeePicker';

interface Props {
  value: { requestedFor: string; employeeId?: number };
  onChange: (next: { requestedFor: string; employeeId?: number }) => void;
  fetchEmployees: (query: string) => Promise<EmployeePickerOption[]>;
  required?: boolean;
}

export function EmployeePickerWithFallback({ value, onChange, fetchEmployees, required }: Props) {
  const { t } = useTranslation();
  const [useFreeText, setUseFreeText] = useState<boolean>(value.employeeId === undefined);
  const [query, setQuery] = useState<string>('');

  const { data: options = [], isFetching } = useQuery({
    queryKey: ['employee-search', query],
    queryFn: () => fetchEmployees(query),
    enabled: !useFreeText && query.length >= 2,
  });

  return (
    <Stack spacing={1}>
      <FormControlLabel
        control={
          <Switch
            checked={useFreeText}
            onChange={(e) => setUseFreeText(e.target.checked)}
          />
        }
        label={t('requests.form.requestedForHelper')}
      />
      {useFreeText ? (
        <TextField
          required={required}
          label={t('requests.form.requestedFor')}
          value={value.requestedFor}
          onChange={(e) => onChange({ requestedFor: e.target.value, employeeId: undefined })}
        />
      ) : (
        <EmployeePicker
          options={options}
          value={options.find((o) => o.id === value.employeeId) ?? null}
          onChange={(selected) =>
            onChange(
              selected
                ? { requestedFor: selected.userPrincipalName, employeeId: selected.id }
                : { requestedFor: '', employeeId: undefined }
            )
          }
          onInputChange={setQuery}
          label={t('requests.form.requestedFor')}
          required={required}
          loading={isFetching}
        />
      )}
      {!useFreeText && value.employeeId && (
        <Typography variant="caption" color="success.main">
          {t('requests.form.linkedEmployee')}
        </Typography>
      )}
    </Stack>
  );
}

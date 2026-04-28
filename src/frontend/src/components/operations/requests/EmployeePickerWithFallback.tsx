import { useState } from 'react';
import { Autocomplete, TextField, Stack, Switch, FormControlLabel, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

interface EmployeeOption {
  id: number;
  displayName: string;
  userPrincipalName: string;
}

interface Props {
  value: { requestedFor: string; employeeId?: number };
  onChange: (next: { requestedFor: string; employeeId?: number }) => void;
  fetchEmployees: (query: string) => Promise<EmployeeOption[]>;
  required?: boolean;
}

export function EmployeePickerWithFallback({ value, onChange, fetchEmployees, required }: Props) {
  const { t } = useTranslation();
  const [useFreeText, setUseFreeText] = useState<boolean>(value.employeeId === undefined);
  const [query, setQuery] = useState<string>('');

  const { data: options = [] } = useQuery({
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
        <Autocomplete<EmployeeOption>
          options={options}
          getOptionLabel={(o) => `${o.displayName} (${o.userPrincipalName})`}
          onInputChange={(_, v) => setQuery(v)}
          value={options.find((o) => o.id === value.employeeId) ?? null}
          onChange={(_, selected) =>
            onChange(
              selected
                ? { requestedFor: selected.userPrincipalName, employeeId: selected.id }
                : { requestedFor: '', employeeId: undefined }
            )
          }
          renderInput={(params) => (
            <TextField {...params} required={required} label={t('requests.form.requestedFor')} />
          )}
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

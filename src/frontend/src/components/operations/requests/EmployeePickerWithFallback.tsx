import { useState, useEffect } from 'react';
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

  /**
   * Two separate state pieces to fix the "input resets after 2 chars" bug:
   *
   * - `displayText` mirrors what the user sees in the text box (controlled).
   *   It is updated on every MUI onInputChange event, including 'reset'.
   *
   * - `searchQuery` drives the React Query fetch and is only updated from
   *   genuine user keystrokes (reason === 'input' | 'clear') so that a MUI
   *   'reset' event (fired when the option list changes) cannot overwrite the
   *   query while a search result is still loading.
   *
   * A 250 ms debounce on searchQuery prevents a network call per keystroke.
   */
  const [displayText, setDisplayText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: options = [], isFetching } = useQuery({
    queryKey: ['employee-search', debouncedQuery],
    queryFn: () => fetchEmployees(debouncedQuery),
    enabled: !useFreeText && debouncedQuery.length >= 2,
  });

  return (
    <Stack spacing={1}>
      <FormControlLabel
        control={
          <Switch
            checked={useFreeText}
            onChange={(e) => {
              setUseFreeText(e.target.checked);
              // Reset picker state when toggling modes
              setDisplayText('');
              setSearchQuery('');
            }}
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
          onChange={(selected) => {
            // When an option is selected, show the display name in the input
            setDisplayText(selected ? selected.displayName : '');
            onChange(
              selected
                ? { requestedFor: selected.userPrincipalName, employeeId: selected.id }
                : { requestedFor: '', employeeId: undefined }
            );
          }}
          onInputChange={setSearchQuery}
          inputValue={displayText}
          onDisplayChange={setDisplayText}
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

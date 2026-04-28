import { Autocomplete, Avatar, Chip, TextField, useTheme } from '@mui/material';
import { RichOption, getRichAutocompleteSlotProps } from './RichOption';

export interface EmployeePickerOption {
  id: number;
  displayName: string;
  userPrincipalName: string;
  email?: string;
  jobTitle?: string;
  department?: string;
  serviceName?: string;
}

interface Props {
  options: EmployeePickerOption[];
  value: EmployeePickerOption | null;
  onChange: (employee: EmployeePickerOption | null) => void;
  /**
   * Called only on genuine user input (reason === 'input' or 'clear').
   * 'reset' events triggered by MUI when the option list changes are ignored
   * so the search query is not overwritten while results arrive.
   */
  onInputChange: (query: string) => void;
  /** Controlled display value of the input box (separate from the search query). */
  inputValue: string;
  /** Called on every input change so the display can stay controlled. */
  onDisplayChange: (text: string) => void;
  label: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_PALETTE = [
  '#1976D2',
  '#43A047',
  '#FF7700',
  '#9C27B0',
  '#E53935',
  '#00897B',
  '#5E35B1',
  '#F4511E',
];

function avatarColorFor(id: number): string {
  return AVATAR_PALETTE[id % AVATAR_PALETTE.length];
}

export function EmployeePicker({
  options,
  value,
  onChange,
  onInputChange,
  inputValue,
  onDisplayChange,
  label,
  required,
  disabled,
  loading,
}: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Autocomplete<EmployeePickerOption>
      size="small"
      options={options}
      value={value}
      inputValue={inputValue}
      onChange={(_, selected) => onChange(selected)}
      onInputChange={(_, v, reason) => {
        // Always keep the displayed text in sync.
        onDisplayChange(v);
        // Only fire the search query update on genuine user gestures.
        // 'reset' fires when MUI updates the input after the option list
        // changes — it would overwrite the typed query with the option label
        // while results are still arriving, causing the input to appear to
        // clear itself after two characters.
        if (reason === 'input') {
          onInputChange(v);
        } else if (reason === 'clear') {
          onInputChange('');
        }
        // reason === 'reset' → do not touch the search query
      }}
      disabled={disabled}
      loading={loading}
      clearOnBlur={false}
      getOptionLabel={(o) => `${o.displayName} (${o.userPrincipalName})`}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      slotProps={getRichAutocompleteSlotProps(isDark)}
      renderInput={(params) => (
        <TextField {...params} label={label} required={required} />
      )}
      renderOption={(props, employee, { selected }) => {
        const subtitleParts = [
          employee.email ?? employee.userPrincipalName,
          employee.jobTitle,
        ].filter(Boolean);
        return (
          <RichOption
            {...props}
            key={employee.id}
            selected={selected}
            primary={employee.displayName}
            secondary={subtitleParts.join(' · ') || undefined}
            leading={
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  bgcolor: avatarColorFor(employee.id),
                }}
              >
                {initialsOf(employee.displayName)}
              </Avatar>
            }
            trailing={
              employee.serviceName || employee.department ? (
                <Chip
                  size="small"
                  variant="outlined"
                  label={employee.serviceName ?? employee.department}
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    maxWidth: 140,
                    '& .MuiChip-label': {
                      px: 1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                  }}
                />
              ) : undefined
            }
          />
        );
      }}
    />
  );
}

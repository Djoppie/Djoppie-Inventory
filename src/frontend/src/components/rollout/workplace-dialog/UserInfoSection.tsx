/**
 * UserInfoSection - User information form fields
 *
 * Displays user name autocomplete, email, physical workplace, and scheduled date fields
 * with neumorphic styling.
 */

import {
  Box,
  Stack,
  Typography,
  TextField,
  Autocomplete,
  CircularProgress,
  InputAdornment,
  Chip,
  useTheme,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PlaceIcon from '@mui/icons-material/Place';
import type { GraphUser } from '../../../types/graph.types';
import type { PhysicalWorkplaceSummary } from '../../../types/physicalWorkplace.types';

interface UserInfoSectionProps {
  userName: string;
  userEmail: string;
  scheduledDate: string | undefined;
  // Physical workplace props
  physicalWorkplaces: PhysicalWorkplaceSummary[];
  physicalWorkplacesLoading: boolean;
  selectedPhysicalWorkplace: PhysicalWorkplaceSummary | null;
  onPhysicalWorkplaceChange: (workplace: PhysicalWorkplaceSummary | null) => void;
  // User search props
  userOptions: GraphUser[];
  userSearchLoading: boolean;
  userDropdownOpen: boolean;
  onUserNameChange: (value: string) => void;
  onUserEmailChange: (value: string) => void;
  onScheduledDateChange: (value: string | undefined) => void;
  onUserSearch: (query: string) => void;
  onUserSelect: (user: GraphUser) => void;
  onDropdownOpen: () => void;
  onDropdownClose: () => void;
}

export function UserInfoSection({
  userName,
  userEmail,
  scheduledDate,
  physicalWorkplaces,
  physicalWorkplacesLoading,
  selectedPhysicalWorkplace,
  onPhysicalWorkplaceChange,
  userOptions,
  userSearchLoading,
  userDropdownOpen,
  onUserNameChange,
  onUserEmailChange,
  onScheduledDateChange,
  onUserSearch,
  onUserSelect,
  onDropdownOpen,
  onDropdownClose,
}: UserInfoSectionProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // User-assigned input styling (purple tint)
  const userInputSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: isDark ? 'rgba(156, 39, 176, 0.08)' : 'rgba(156, 39, 176, 0.06)',
      borderRadius: 2,
      border: isDark ? '1px solid rgba(156, 39, 176, 0.3)' : '1px solid rgba(156, 39, 176, 0.25)',
      boxShadow: isDark
        ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
        : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff',
      '& fieldset': { border: 'none' },
      '&:hover, &.Mui-focused': {
        boxShadow: isDark
          ? 'inset 4px 4px 8px #161a1d, inset -4px -4px 8px #262c33, 0 0 0 2px rgba(156, 39, 176, 0.4)'
          : 'inset 4px 4px 8px #c5cad0, inset -4px -4px 8px #ffffff, 0 0 0 2px rgba(156, 39, 176, 0.3)',
      },
    },
    '& .MuiInputLabel-root': {
      color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
      '&.Mui-focused': { color: '#9c27b0' },
    },
  };

  // Workplace-assigned input styling (teal tint)
  const workplaceInputSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: isDark ? 'rgba(0, 150, 136, 0.08)' : 'rgba(0, 150, 136, 0.06)',
      borderRadius: 2,
      border: isDark ? '1px solid rgba(0, 150, 136, 0.3)' : '1px solid rgba(0, 150, 136, 0.25)',
      boxShadow: isDark
        ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
        : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff',
      '& fieldset': { border: 'none' },
      '&:hover, &.Mui-focused': {
        boxShadow: isDark
          ? 'inset 4px 4px 8px #161a1d, inset -4px -4px 8px #262c33, 0 0 0 2px rgba(0, 150, 136, 0.4)'
          : 'inset 4px 4px 8px #c5cad0, inset -4px -4px 8px #ffffff, 0 0 0 2px rgba(0, 150, 136, 0.3)',
      },
    },
    '& .MuiInputLabel-root': {
      color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
      '&.Mui-focused': { color: '#009688' },
    },
  };

  // Neutral input styling (for date field)
  const neutralInputSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: isDark ? '#1e2328' : '#e8eef3',
      borderRadius: 2,
      boxShadow: isDark
        ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
        : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff',
      '& fieldset': { border: 'none' },
      '&:hover, &.Mui-focused': {
        boxShadow: isDark
          ? 'inset 4px 4px 8px #161a1d, inset -4px -4px 8px #262c33, 0 0 0 2px rgba(255, 119, 0, 0.3)'
          : 'inset 4px 4px 8px #c5cad0, inset -4px -4px 8px #ffffff, 0 0 0 2px rgba(255, 119, 0, 0.2)',
      },
    },
    '& .MuiInputLabel-root': {
      color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
      '&.Mui-focused': { color: '#FF7700' },
    },
  };

  return (
    <Box
      sx={{
        mb: 3,
        p: 2.5,
        borderRadius: 3,
        bgcolor: isDark ? '#1e2328' : '#e8eef3',
        boxShadow: isDark
          ? '8px 8px 16px #161a1d, -8px -8px 16px #262c33, 0 4px 12px rgba(0, 0, 0, 0.2)'
          : '8px 8px 16px #c5cad0, -8px -8px 16px #ffffff, 0 4px 12px rgba(150, 155, 160, 0.15)',
        transform: 'translateZ(12px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateZ(15px)',
          boxShadow: isDark
            ? '10px 10px 20px #161a1d, -10px -10px 20px #262c33, 0 6px 16px rgba(0, 0, 0, 0.25)'
            : '10px 10px 20px #c5cad0, -10px -10px 20px #ffffff, 0 6px 16px rgba(150, 155, 160, 0.2)',
        },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: isDark ? '#1e2328' : '#e8eef3',
            boxShadow: isDark
              ? '3px 3px 6px #161a1d, -3px -3px 6px #262c33'
              : '3px 3px 6px #c5cad0, -3px -3px 6px #ffffff',
          }}
        >
          <PersonIcon sx={{ color: '#FF7700', fontSize: '1.2rem' }} />
        </Box>
        <Typography variant="h6" fontWeight={700} sx={{ color: isDark ? '#fff' : '#333' }}>
          Gebruiker Informatie
        </Typography>
      </Stack>

      <Stack spacing={2.5}>
        <Autocomplete
          freeSolo
          open={userDropdownOpen}
          onOpen={() => {
            if (userName.length >= 2) onDropdownOpen();
          }}
          onClose={onDropdownClose}
          options={userOptions}
          getOptionLabel={(option) =>
            typeof option === 'string' ? option : option.displayName || ''
          }
          filterOptions={(x) => x}
          inputValue={userName}
          onInputChange={(_, value, reason) => {
            onUserNameChange(value);
            if (reason === 'input') {
              onUserSearch(value);
              if (value.length >= 2) {
                onDropdownOpen();
              } else {
                onDropdownClose();
              }
            }
          }}
          onChange={(_, value) => {
            onDropdownClose();
            if (value && typeof value !== 'string') {
              onUserSelect(value);
            }
          }}
          loading={userSearchLoading}
          slotProps={{
            listbox: {
              sx: {
                '& .MuiAutocomplete-option': {
                  '&:hover': {
                    bgcolor: 'rgba(156, 39, 176, 0.08)',
                  },
                  '&[aria-selected="true"]': {
                    bgcolor: 'rgba(156, 39, 176, 0.15) !important',
                    borderLeft: '3px solid #9c27b0',
                  },
                  '&[aria-selected="true"]:hover': {
                    bgcolor: 'rgba(156, 39, 176, 0.2) !important',
                  },
                  '&.Mui-focused': {
                    bgcolor: 'rgba(156, 39, 176, 0.1)',
                  },
                },
              },
            },
          }}
          renderOption={(props, option) => {
            const { key, ...otherProps } = props;
            return (
              <li {...otherProps} key={key}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {option.displayName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.mail || option.userPrincipalName}
                    {option.department ? ` — ${option.department}` : ''}
                  </Typography>
                </Box>
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Gebruikersnaam"
              required
              fullWidth
              helperText="Typ minimaal 2 letters om te zoeken"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {userSearchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
              sx={userInputSx}
            />
          )}
        />

        <TextField
          label="E-mailadres"
          type="email"
          value={userEmail}
          onChange={(e) => onUserEmailChange(e.target.value)}
          fullWidth
          size="small"
          sx={userInputSx}
        />

        {/* Physical Workplace Selector */}
        <Autocomplete
          options={physicalWorkplaces}
          getOptionLabel={(option: PhysicalWorkplaceSummary) => `${option.code} - ${option.name}`}
          value={selectedPhysicalWorkplace}
          onChange={(_, newValue) => onPhysicalWorkplaceChange(newValue)}
          loading={physicalWorkplacesLoading}
          slotProps={{
            listbox: {
              sx: {
                '& .MuiAutocomplete-option': {
                  '&:hover': {
                    bgcolor: 'rgba(0, 150, 136, 0.08)',
                  },
                  '&[aria-selected="true"]': {
                    bgcolor: 'rgba(0, 150, 136, 0.15) !important',
                    borderLeft: '3px solid #009688',
                  },
                  '&[aria-selected="true"]:hover': {
                    bgcolor: 'rgba(0, 150, 136, 0.2) !important',
                  },
                  '&.Mui-focused': {
                    bgcolor: 'rgba(0, 150, 136, 0.1)',
                  },
                },
              },
            },
          }}
          renderOption={(props, option: PhysicalWorkplaceSummary) => {
            const { key, ...otherProps } = props;
            return (
              <li {...otherProps} key={key}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                  <PlaceIcon sx={{ color: '#009688', fontSize: '1.1rem' }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {option.code}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.name}
                      {option.buildingName && ` • ${option.buildingName}`}
                    </Typography>
                  </Box>
                </Box>
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Fysieke Werkplek"
              placeholder="Selecteer een werkplek..."
              size="small"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <PlaceIcon
                        sx={{
                          fontSize: '1.1rem',
                          color: selectedPhysicalWorkplace ? '#009688' : (isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)'),
                        }}
                      />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
                endAdornment: (
                  <>
                    {physicalWorkplacesLoading ? <CircularProgress color="inherit" size={18} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
              sx={{
                ...workplaceInputSx,
                '& .MuiOutlinedInput-root': {
                  ...workplaceInputSx['& .MuiOutlinedInput-root'],
                  ...(selectedPhysicalWorkplace && {
                    boxShadow: isDark
                      ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33, 0 0 0 2px rgba(0, 150, 136, 0.5)'
                      : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff, 0 0 0 2px rgba(0, 150, 136, 0.4)',
                  }),
                },
              }}
            />
          )}
        />
        {/* Show selected workplace details */}
        {selectedPhysicalWorkplace && (
          <Box
            sx={{
              mt: -1,
              ml: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Chip
              icon={<PlaceIcon sx={{ fontSize: '14px !important' }} />}
              label={selectedPhysicalWorkplace.code}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 700,
                bgcolor: 'rgba(0, 150, 136, 0.15)',
                color: '#009688',
                border: '1px solid rgba(0, 150, 136, 0.4)',
                '& .MuiChip-icon': { color: '#009688' },
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {selectedPhysicalWorkplace.buildingName}
              {selectedPhysicalWorkplace.serviceName && ` • ${selectedPhysicalWorkplace.serviceName}`}
            </Typography>
          </Box>
        )}

        <TextField
          type="date"
          label="Geplande datum"
          value={scheduledDate ? scheduledDate.split('T')[0] : ''}
          onChange={(e) => onScheduledDateChange(e.target.value || undefined)}
          fullWidth
          size="small"
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CalendarTodayIcon
                  sx={{
                    fontSize: '1rem',
                    color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
                  }}
                />
              </InputAdornment>
            ),
          }}
          sx={neutralInputSx}
        />
      </Stack>
    </Box>
  );
}

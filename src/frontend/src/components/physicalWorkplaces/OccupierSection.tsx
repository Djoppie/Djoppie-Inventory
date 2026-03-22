/**
 * OccupierSection
 *
 * Neumorphic component for managing the main occupier of a physical workplace.
 * Provides Microsoft Entra AD user search and displays current occupier info.
 */

import { useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Stack,
  Autocomplete,
  TextField,
  IconButton,
  CircularProgress,
  Avatar,
  useTheme,
  Tooltip,
  Chip,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import PersonIcon from '@mui/icons-material/Person';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import ClearIcon from '@mui/icons-material/Clear';
import EmailIcon from '@mui/icons-material/Email';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { graphApi } from '../../api/graph.api';
import type { GraphUser } from '../../types/graph.types';
import type { PhysicalWorkplace, UpdateOccupantDto } from '../../types/physicalWorkplace.types';

interface OccupierSectionProps {
  workplace: PhysicalWorkplace;
  onOccupierChange: (data: UpdateOccupantDto) => void;
  isLoading?: boolean;
}

const OccupierSection = ({
  workplace,
  onOccupierChange,
  isLoading = false,
}: OccupierSectionProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // User search state
  const [userOptions, setUserOptions] = useState<GraphUser[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userInputValue, setUserInputValue] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Current occupier state (for display when clearing)
  const [currentOccupier, setCurrentOccupier] = useState<{
    id: string | null;
    name: string | null;
    email: string | null;
  }>({
    id: workplace.currentOccupantEntraId ?? null,
    name: workplace.currentOccupantName ?? null,
    email: workplace.currentOccupantEmail ?? null,
  });

  // Handle user search with debounce
  const handleUserSearch = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setUserOptions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setUserSearchLoading(true);
      try {
        const users = await graphApi.searchUsers(query, 10);
        setUserOptions(users);
      } catch {
        setUserOptions([]);
      } finally {
        setUserSearchLoading(false);
      }
    }, 300);
  }, []);

  // Handle user selection
  const handleUserSelect = useCallback((user: GraphUser | null) => {
    if (user) {
      const data: UpdateOccupantDto = {
        occupantEntraId: user.id,
        occupantName: user.displayName,
        occupantEmail: user.mail || user.userPrincipalName,
      };
      setCurrentOccupier({
        id: user.id,
        name: user.displayName,
        email: user.mail || user.userPrincipalName,
      });
      onOccupierChange(data);
    } else {
      // Clear occupier
      const data: UpdateOccupantDto = {
        occupantEntraId: undefined,
        occupantName: undefined,
        occupantEmail: undefined,
      };
      setCurrentOccupier({ id: null, name: null, email: null });
      onOccupierChange(data);
    }
    setUserInputValue('');
    setUserOptions([]);
  }, [onOccupierChange]);

  // Handle clear
  const handleClear = useCallback(() => {
    handleUserSelect(null);
  }, [handleUserSelect]);

  // Neumorphic style helpers
  const neomorphBoxShadow = isDark
    ? '6px 6px 12px #161a1d, -6px -6px 12px #262c33'
    : '6px 6px 12px #c5cad0, -6px -6px 12px #ffffff';

  const neomorphInsetShadow = isDark
    ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
    : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff';

  const bgColor = isDark ? '#1e2328' : '#e8eef3';

  const hasOccupier = Boolean(currentOccupier.id);

  // Format occupied since date
  const formatOccupiedSince = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return null;
    }
  };

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 3,
        bgcolor: bgColor,
        boxShadow: neomorphBoxShadow,
        mb: 3,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: bgColor,
            boxShadow: neomorphInsetShadow,
          }}
        >
          <PersonSearchIcon sx={{ color: '#FF7700', fontSize: '1.3rem' }} />
        </Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ color: isDark ? '#fff' : '#333' }}>
          {t('physicalWorkplaces.occupier.title')}
        </Typography>
        {isLoading && (
          <CircularProgress size={16} sx={{ ml: 1, color: '#FF7700' }} />
        )}
      </Stack>

      {/* Current Occupier Display */}
      {hasOccupier ? (
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: bgColor,
            boxShadow: `${neomorphInsetShadow}, inset 0 0 0 2px rgba(255, 119, 0, 0.3)`,
            mb: 2,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: '#FF7700',
                boxShadow: neomorphBoxShadow,
              }}
            >
              {currentOccupier.name?.[0]?.toUpperCase() || <PersonIcon />}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{
                  color: isDark ? '#fff' : '#333',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentOccupier.name}
              </Typography>
              {currentOccupier.email && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <EmailIcon sx={{ fontSize: 14, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }} />
                  <Typography
                    variant="caption"
                    sx={{
                      color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {currentOccupier.email}
                  </Typography>
                </Stack>
              )}
              {workplace.occupiedSince && (
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                  <AccessTimeIcon sx={{ fontSize: 14, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }} />
                  <Typography
                    variant="caption"
                    sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }}
                  >
                    {t('physicalWorkplaces.occupier.since')} {formatOccupiedSince(workplace.occupiedSince)}
                  </Typography>
                </Stack>
              )}
            </Box>
            <Tooltip title={t('physicalWorkplaces.occupier.clearOccupier')}>
              <span>
                <IconButton
                  size="small"
                  onClick={handleClear}
                  disabled={isLoading}
                  sx={{
                    bgcolor: bgColor,
                    boxShadow: neomorphBoxShadow,
                    '&:hover': {
                      boxShadow: neomorphInsetShadow,
                    },
                  }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Box>
      ) : (
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: bgColor,
            boxShadow: neomorphInsetShadow,
            mb: 2,
            textAlign: 'center',
          }}
        >
          <PersonIcon
            sx={{
              fontSize: 40,
              color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
              mb: 1,
            }}
          />
          <Typography
            variant="body2"
            sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }}
          >
            {t('physicalWorkplaces.occupier.noOccupier')}
          </Typography>
        </Box>
      )}

      {/* User Search */}
      <Box>
        <Typography
          variant="caption"
          sx={{
            color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
            fontWeight: 600,
            mb: 1,
            display: 'block',
          }}
        >
          {hasOccupier
            ? t('physicalWorkplaces.occupier.changeOccupier')
            : t('physicalWorkplaces.occupier.assignOccupier')}
        </Typography>
        <Autocomplete
          size="small"
          options={userOptions}
          inputValue={userInputValue}
          onInputChange={(_, newValue, reason) => {
            setUserInputValue(newValue);
            if (reason === 'input') {
              handleUserSearch(newValue);
            }
          }}
          onChange={(_, newValue) => handleUserSelect(newValue)}
          getOptionLabel={(option) => option.displayName}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: '#FF7700',
                    fontSize: '0.875rem',
                  }}
                >
                  {option.displayName[0]?.toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {option.displayName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {option.mail || option.userPrincipalName}
                  </Typography>
                </Box>
                {option.department && (
                  <Chip
                    label={option.department}
                    size="small"
                    sx={{
                      fontSize: '0.65rem',
                      height: 20,
                      bgcolor: isDark ? 'rgba(255,119,0,0.2)' : 'rgba(255,119,0,0.1)',
                      color: '#FF7700',
                    }}
                  />
                )}
              </Stack>
            </li>
          )}
          loading={userSearchLoading}
          disabled={isLoading}
          filterOptions={(x) => x} // Disable client-side filtering, we use server search
          noOptionsText={
            userInputValue.length < 2
              ? t('physicalWorkplaces.occupier.typeToSearch')
              : t('physicalWorkplaces.occupier.noUsersFound')
          }
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={t('physicalWorkplaces.occupier.searchPlaceholder')}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <PersonSearchIcon
                    sx={{
                      ml: 1,
                      mr: 0.5,
                      color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
                      fontSize: 20,
                    }}
                  />
                ),
                endAdornment: (
                  <>
                    {userSearchLoading && (
                      <CircularProgress size={16} sx={{ color: '#FF7700' }} />
                    )}
                    {params.InputProps.endAdornment}
                  </>
                ),
                sx: {
                  borderRadius: 2,
                  bgcolor: bgColor,
                  boxShadow: neomorphInsetShadow,
                  '& fieldset': { border: 'none' },
                },
              }}
            />
          )}
        />
      </Box>
    </Box>
  );
};

export default OccupierSection;

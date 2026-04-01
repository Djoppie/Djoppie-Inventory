import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  InputAdornment,
  Paper,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory2';
import BusinessIcon from '@mui/icons-material/Business';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { getAssets } from '../../api/assets.api';
import { physicalWorkplacesApi } from '../../api/physicalWorkplaces.api';
import { getRolloutSessions } from '../../api/rollout.api';
import { buildRoute } from '../../constants/routes';
import type { Asset } from '../../types/asset.types';
import type { PhysicalWorkplace } from '../../types/physicalWorkplace.types';
import type { RolloutSession } from '../../types/rollout';
import { debounce } from '../../utils/debounce';

interface SearchResult {
  id: string;
  type: 'asset' | 'workplace' | 'rollout';
  title: string;
  subtitle: string;
  path: string;
}

interface SearchBarProps {
  isMobile?: boolean;
}

const SearchBar = ({ isMobile = false }: SearchBarProps) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);

  // Fetch data for search
  const { data: assets = [] } = useQuery({
    queryKey: ['assets-search'],
    queryFn: () => getAssets(),
    staleTime: 60000,
  });

  const { data: workplaces = [] } = useQuery({
    queryKey: ['workplaces-search'],
    queryFn: () => physicalWorkplacesApi.getAll(),
    staleTime: 60000,
  });

  const { data: rollouts = [] } = useQuery({
    queryKey: ['rollouts-search'],
    queryFn: () => getRolloutSessions(),
    staleTime: 60000,
  });

  // Build search results
  const searchResults = useMemo((): SearchResult[] => {
    if (!inputValue || inputValue.length < 2) return [];

    const query = inputValue.toLowerCase();
    const results: SearchResult[] = [];

    // Search assets
    (assets as Asset[])
      .filter(
        (asset) =>
          asset.assetCode?.toLowerCase().includes(query) ||
          asset.serialNumber?.toLowerCase().includes(query) ||
          asset.assetName?.toLowerCase().includes(query) ||
          asset.owner?.toLowerCase().includes(query)
      )
      .slice(0, 5)
      .forEach((asset) => {
        results.push({
          id: `asset-${asset.id}`,
          type: 'asset',
          title: asset.assetCode || `Asset #${asset.id}`,
          subtitle: [asset.assetType?.name, asset.serialNumber, asset.owner]
            .filter(Boolean)
            .join(' • '),
          path: buildRoute.assetDetail(asset.id),
        });
      });

    // Search workplaces
    (workplaces as PhysicalWorkplace[])
      .filter(
        (wp) =>
          wp.name?.toLowerCase().includes(query) ||
          wp.room?.toLowerCase().includes(query) ||
          wp.currentOccupantName?.toLowerCase().includes(query)
      )
      .slice(0, 3)
      .forEach((wp) => {
        results.push({
          id: `workplace-${wp.id}`,
          type: 'workplace',
          title: wp.name || `Werkplek #${wp.id}`,
          subtitle: [wp.room, wp.buildingName, wp.currentOccupantName]
            .filter(Boolean)
            .join(' • '),
          path: buildRoute.workplaceDetail(wp.id),
        });
      });

    // Search rollouts
    (rollouts as RolloutSession[])
      .filter((r) => r.sessionName?.toLowerCase().includes(query))
      .slice(0, 2)
      .forEach((r) => {
        results.push({
          id: `rollout-${r.id}`,
          type: 'rollout',
          title: r.sessionName || `Rollout #${r.id}`,
          subtitle: r.status,
          path: buildRoute.rolloutEdit(r.id),
        });
      });

    return results;
  }, [inputValue, assets, workplaces, rollouts]);

  // Handle selection
  const handleSelect = useCallback(
    (_event: React.SyntheticEvent, value: string | SearchResult | null) => {
      if (value && typeof value !== 'string') {
        navigate(value.path);
        setInputValue('');
        setOpen(false);
      }
    },
    [navigate]
  );

  // Debounced input change
  const debouncedSetInput = useMemo(
    () => debounce((value: string) => setInputValue(value), 200),
    []
  );

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'asset':
        return <InventoryIcon sx={{ fontSize: 18, color: '#FF7700' }} />;
      case 'workplace':
        return <BusinessIcon sx={{ fontSize: 18, color: '#26A69A' }} />;
      case 'rollout':
        return <RocketLaunchIcon sx={{ fontSize: 18, color: '#7E57C2' }} />;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'asset':
        return 'Asset';
      case 'workplace':
        return 'Werkplek';
      case 'rollout':
        return 'Rollout';
    }
  };

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'asset':
        return '#FF7700';
      case 'workplace':
        return '#26A69A';
      case 'rollout':
        return '#7E57C2';
    }
  };

  return (
    <Autocomplete
      freeSolo
      open={open && searchResults.length > 0}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={searchResults}
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : option.title
      }
      filterOptions={(x) => x} // Disable built-in filtering
      onChange={handleSelect}
      onInputChange={(_event, newValue) => debouncedSetInput(newValue)}
      noOptionsText="Geen resultaten"
      sx={{
        width: isMobile ? '100%' : { xs: 200, sm: 250, md: 300 },
      }}
      PaperComponent={(props) => (
        <Paper
          {...props}
          sx={{
            mt: 1,
            borderRadius: 2,
            boxShadow: isDark
              ? '0 8px 32px rgba(0,0,0,0.4)'
              : '0 8px 32px rgba(0,0,0,0.15)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        />
      )}
      renderOption={(props, option) => {
        const { key, ...otherProps } = props;
        return (
          <Box
            key={key}
            component="li"
            {...otherProps}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              py: 1.5,
              px: 2,
              cursor: 'pointer',
              '&:hover': {
                bgcolor: alpha(getTypeColor(option.type), 0.08),
              },
            }}
          >
            {getTypeIcon(option.type)}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {option.title}
              </Typography>
              {option.subtitle && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {option.subtitle}
                </Typography>
              )}
            </Box>
            <Chip
              label={getTypeLabel(option.type)}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 600,
                bgcolor: alpha(getTypeColor(option.type), 0.12),
                color: getTypeColor(option.type),
              }}
            />
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Zoeken..."
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: isDark
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(0,0,0,0.03)',
              transition: 'all 0.2s ease',
              '& fieldset': {
                borderColor: 'divider',
              },
              '&:hover': {
                bgcolor: isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.05)',
                '& fieldset': {
                  borderColor: '#FF7700',
                },
              },
              '&.Mui-focused': {
                bgcolor: isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(255,255,255,1)',
                '& fieldset': {
                  borderColor: '#FF7700',
                  borderWidth: 2,
                },
              },
            },
            '& .MuiInputBase-input': {
              fontSize: '0.875rem',
              '&::placeholder': {
                color: 'text.secondary',
                opacity: 0.7,
              },
            },
          }}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon
                  sx={{
                    fontSize: 20,
                    color: 'text.secondary',
                    ml: 0.5,
                  }}
                />
              </InputAdornment>
            ),
          }}
        />
      )}
    />
  );
};

export default SearchBar;

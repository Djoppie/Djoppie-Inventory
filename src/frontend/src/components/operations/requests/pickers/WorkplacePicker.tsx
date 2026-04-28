import { Autocomplete, Box, Chip, TextField, alpha } from '@mui/material';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import LaptopIcon from '@mui/icons-material/Laptop';
import GroupsIcon from '@mui/icons-material/Groups';
import HotelIcon from '@mui/icons-material/Hotel';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { RichOption, richAutocompleteSlotProps } from './RichOption';
import {
  type PhysicalWorkplace,
  WorkplaceType,
  WorkplaceTypeLabels,
} from '../../../../types/physicalWorkplace.types';

const TYPE_ICONS: Record<WorkplaceType, typeof LocationOnIcon> = {
  [WorkplaceType.Desktop]: DesktopWindowsIcon,
  [WorkplaceType.Laptop]: LaptopIcon,
  [WorkplaceType.HotDesk]: HotelIcon,
  [WorkplaceType.MeetingRoom]: GroupsIcon,
};

interface Props {
  options: PhysicalWorkplace[];
  value: PhysicalWorkplace | null;
  onChange: (workplace: PhysicalWorkplace | null) => void;
  label: string;
  disabled?: boolean;
}

export function WorkplacePicker({ options, value, onChange, label, disabled }: Props) {
  return (
    <Autocomplete<PhysicalWorkplace>
      size="small"
      options={options}
      value={value}
      onChange={(_, selected) => onChange(selected)}
      disabled={disabled}
      getOptionLabel={(w) => `${w.code} — ${w.name}`}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      slotProps={richAutocompleteSlotProps}
      renderInput={(params) => <TextField {...params} label={label} />}
      renderOption={(props, w, { selected }) => {
        const Icon = TYPE_ICONS[w.type] ?? LocationOnIcon;
        const subtitleParts = [
          w.serviceName,
          w.buildingName,
          [w.floor, w.room].filter(Boolean).join(' · '),
        ].filter(Boolean);
        return (
          <RichOption
            {...props}
            key={w.id}
            selected={selected}
            primaryMono
            primary={
              <>
                {w.code}
                <span
                  style={{
                    fontFamily: 'inherit',
                    color: 'var(--mui-palette-text-secondary, #999)',
                    fontWeight: 400,
                    marginLeft: 8,
                  }}
                >
                  {w.name}
                </span>
              </>
            }
            secondary={
              subtitleParts.length > 0
                ? subtitleParts.join(' · ')
                : w.currentOccupantName
                  ? `Bezet door ${w.currentOccupantName}`
                  : undefined
            }
            leading={
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: (theme) =>
                    alpha('#1976D2', theme.palette.mode === 'dark' ? 0.18 : 0.12),
                  color: '#1976D2',
                }}
              >
                <Icon sx={{ fontSize: 18 }} />
              </Box>
            }
            trailing={
              <Chip
                size="small"
                label={WorkplaceTypeLabels[w.type] ?? w.type}
                variant="outlined"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            }
          />
        );
      }}
    />
  );
}

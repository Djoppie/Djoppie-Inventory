import { Box, Stack, Typography, alpha, useTheme } from '@mui/material';
import type { ReactNode, HTMLAttributes } from 'react';
import { getNeumorph, getNeumorphColors } from '../../../../utils/neumorphicStyles';

export interface RichOptionProps extends HTMLAttributes<HTMLLIElement> {
  /** Optional leading visual (icon, avatar, or letter badge). Reserve ~36px width. */
  leading?: ReactNode;
  /** Bold primary line — use mono font for codes. */
  primary: ReactNode;
  /** Faded secondary line — descriptive context (1 line, ellipsised). */
  secondary?: ReactNode;
  /** Optional trailing chips/badges (status, type, owner, etc.). Render as nodes. */
  trailing?: ReactNode;
  /** When true, primary text uses a monospace stack to emphasise codes. */
  primaryMono?: boolean;
  /** Selected state — adds an orange left border. */
  selected?: boolean;
}

/**
 * Compact two-line option row used inside Autocomplete listboxes throughout
 * the requests feature. The wrapper li receives all DOM props from MUI so the
 * component can be passed straight from `renderOption`.
 */
export function RichOption({
  leading,
  primary,
  secondary,
  trailing,
  primaryMono,
  selected,
  style,
  ...liProps
}: RichOptionProps) {
  const theme = useTheme();
  const accent = '#FF7700';

  return (
    <li
      {...liProps}
      style={{
        ...style,
        padding: 0,
        listStyle: 'none',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{
          width: '100%',
          minHeight: 52,
          px: 1.5,
          py: 0.75,
          borderRadius: 1,
          borderLeft: '3px solid',
          borderLeftColor: selected ? accent : 'transparent',
          transition: 'background-color 0.12s ease, border-color 0.12s ease',
          '&:hover': {
            backgroundColor: alpha(accent, theme.palette.mode === 'dark' ? 0.12 : 0.08),
          },
        }}
      >
        {leading && (
          <Box
            sx={{
              flexShrink: 0,
              width: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {leading}
          </Box>
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              fontSize: '0.85rem',
              fontFamily: primaryMono
                ? '"SF Mono", "Roboto Mono", "Cascadia Code", Consolas, monospace'
                : undefined,
              letterSpacing: primaryMono ? '0.02em' : undefined,
              color: 'text.primary',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {primary}
          </Typography>
          {secondary && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'text.secondary',
                fontSize: '0.7rem',
                lineHeight: 1.35,
                mt: 0.25,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {secondary}
            </Typography>
          )}
        </Box>

        {trailing && (
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            sx={{ flexShrink: 0, ml: 1 }}
          >
            {trailing}
          </Stack>
        )}
      </Stack>
    </li>
  );
}

/**
 * Shared slotProps factory for `Autocomplete` to give all rich pickers a
 * consistent neumorphic dropdown surface (raised card, accent border on hover,
 * max-height with scroll, padding).
 *
 * @param isDark - theme mode so the shadow values are correct
 */
export function getRichAutocompleteSlotProps(isDark: boolean) {
  const { bgSurface } = getNeumorphColors(isDark);
  return {
    paper: {
      sx: {
        borderRadius: 2,
        mt: 0.5,
        bgcolor: bgSurface,
        boxShadow: getNeumorph(isDark, 'medium'),
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      },
    },
    listbox: {
      sx: {
        maxHeight: 360,
        py: 0.5,
        '& .MuiAutocomplete-option': {
          padding: 0,
          minHeight: 'auto',
        },
        '& .MuiAutocomplete-option[aria-selected="true"]': {
          backgroundColor: 'transparent',
        },
        '& .MuiAutocomplete-option.Mui-focused': {
          backgroundColor: 'transparent',
        },
      },
    },
  } as const;
}

/**
 * @deprecated Use `getRichAutocompleteSlotProps(isDark)` for theme-aware
 * neumorphic dropdown surface. This static export is kept for backward
 * compatibility during migration.
 */
export const richAutocompleteSlotProps = getRichAutocompleteSlotProps(false);

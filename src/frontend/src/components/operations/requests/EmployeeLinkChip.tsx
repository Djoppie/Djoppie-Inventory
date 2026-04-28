import { Avatar, Box, Stack, Tooltip, Typography, alpha, useTheme } from '@mui/material';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTranslation } from 'react-i18next';

interface Props {
  employeeDisplayName?: string;
  /** Optional UPN/email shown as a faint tooltip (and used to derive a stable color). */
  employeeUpn?: string;
  onRelink?: () => void;
  /** Compact variant — used inside dense table rows. */
  dense?: boolean;
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

function avatarColorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function EmployeeLinkChip({
  employeeDisplayName,
  employeeUpn,
  onRelink,
  dense,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (employeeDisplayName) {
    const seed = employeeUpn ?? employeeDisplayName;
    const accent = avatarColorFor(seed);
    return (
      <Tooltip
        title={
          employeeUpn
            ? `${t('requests.form.linkedEmployee')} · ${employeeUpn}`
            : t('requests.form.linkedEmployee')
        }
        arrow
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.75}
          sx={{
            display: 'inline-flex',
            pl: 0.5,
            pr: 1.25,
            py: 0.25,
            borderRadius: 999,
            bgcolor: alpha(accent, isDark ? 0.18 : 0.1),
            border: '1px solid',
            borderColor: alpha(accent, isDark ? 0.32 : 0.22),
            transition: 'all 0.15s ease',
            cursor: 'default',
            maxWidth: dense ? 220 : 280,
            '&:hover': {
              bgcolor: alpha(accent, isDark ? 0.24 : 0.14),
              borderColor: alpha(accent, isDark ? 0.45 : 0.32),
            },
          }}
        >
          <Avatar
            sx={{
              width: dense ? 20 : 22,
              height: dense ? 20 : 22,
              fontSize: '0.65rem',
              fontWeight: 700,
              bgcolor: accent,
              color: '#fff',
            }}
          >
            {initialsOf(employeeDisplayName)}
          </Avatar>
          <Typography
            sx={{
              fontSize: dense ? '0.72rem' : '0.78rem',
              fontWeight: 600,
              color: accent,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
            }}
          >
            {employeeDisplayName}
          </Typography>
          <CheckCircleIcon
            sx={{
              fontSize: dense ? 12 : 13,
              color: accent,
              opacity: 0.75,
              flexShrink: 0,
            }}
          />
        </Stack>
      </Tooltip>
    );
  }

  // Not linked
  const mutedColor = '#FF9800';
  return (
    <Tooltip title={t('requests.form.notLinked')} arrow>
      <Box
        component={onRelink ? 'button' : 'span'}
        onClick={onRelink}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1.25,
          py: 0.4,
          borderRadius: 999,
          border: '1px dashed',
          borderColor: alpha(mutedColor, isDark ? 0.45 : 0.4),
          bgcolor: alpha(mutedColor, isDark ? 0.1 : 0.06),
          color: mutedColor,
          fontSize: dense ? '0.7rem' : '0.75rem',
          fontWeight: 600,
          cursor: onRelink ? 'pointer' : 'default',
          transition: 'all 0.15s ease',
          fontFamily: 'inherit',
          '&:hover': onRelink
            ? {
                bgcolor: alpha(mutedColor, isDark ? 0.18 : 0.12),
                borderStyle: 'solid',
              }
            : undefined,
        }}
      >
        <LinkOffIcon sx={{ fontSize: dense ? 12 : 13 }} />
        {t('requests.form.notLinked')}
      </Box>
    </Tooltip>
  );
}

import React, { ReactNode, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Avatar,
  Box,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

/**
 * Generic row item displayed in a KPI report. Each section maps its own data
 * to this shape so the dialog stays reusable and compact.
 */
export interface KPIReportItem {
  id: string | number;
  /** Short text shown as a colored chip in the avatar slot — e.g. "2" or "JD" */
  avatarText?: string;
  /** Icon shown in the avatar slot when no avatarText is provided */
  avatarIcon?: ReactNode;
  /** Main row title — will be bolded */
  primary: string;
  /** Optional secondary line under the title (meta info) */
  secondary?: ReactNode;
  /** Optional small tag rendered on the right of the row (e.g. status) */
  tag?: {
    label: string;
    color: string;
  };
  /** Additional compact chips rendered next to the title */
  chips?: Array<{ label: string; color?: string; tone?: 'solid' | 'soft' }>;
  /** Optional click handler — when set, the row becomes clickable + shows a chevron */
  onClick?: () => void;
  /** Text used for filtering when the search box is enabled */
  searchText?: string;
}

export interface KPIReportGroup {
  id: string | number;
  label: string;
  items: KPIReportItem[];
  /** Optional tag shown on the group header (e.g. count, status) */
  headerTag?: { label: string; color: string };
}

interface KPIReportDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  color: string;
  /** Flat list of items (used when groups is not provided) */
  items?: KPIReportItem[];
  /** Grouped items (used instead of items when set) */
  groups?: KPIReportGroup[];
  /** When true, show a search box filtering items by searchText/primary/secondary */
  searchable?: boolean;
  /** Shown when there's nothing to display */
  emptyState?: {
    icon?: ReactNode;
    title: string;
    subtitle?: string;
  };
  /** Optional footer content (e.g. "View all" link) */
  footer?: ReactNode;
}

const KPIReportDialog: React.FC<KPIReportDialogProps> = ({
  open,
  onClose,
  title,
  subtitle,
  icon,
  color,
  items,
  groups,
  searchable = true,
  emptyState,
  footer,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [search, setSearch] = useState('');

  const itemMatchesSearch = (item: KPIReportItem, q: string) => {
    if (!q) return true;
    const needle = q.toLowerCase();
    const hay = [
      item.primary,
      item.searchText ?? '',
      typeof item.secondary === 'string' ? item.secondary : '',
      ...(item.chips?.map((c) => c.label) ?? []),
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(needle);
  };

  const filteredFlatItems = useMemo(() => {
    if (!items) return [];
    if (!search.trim()) return items;
    return items.filter((i) => itemMatchesSearch(i, search));
  }, [items, search]);

  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    if (!search.trim()) return groups;
    return groups
      .map((g) => ({ ...g, items: g.items.filter((i) => itemMatchesSearch(i, search)) }))
      .filter((g) => g.items.length > 0);
  }, [groups, search]);

  const totalVisible = groups
    ? filteredGroups.reduce((sum, g) => sum + g.items.length, 0)
    : filteredFlatItems.length;

  const totalOriginal = groups
    ? groups.reduce((sum, g) => sum + g.items.length, 0)
    : items?.length ?? 0;

  const nothingToShow = totalOriginal === 0;

  const renderRow = (item: KPIReportItem, isLast: boolean) => {
    const clickable = typeof item.onClick === 'function';
    return (
      <Box
        key={item.id}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={item.onClick}
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  item.onClick?.();
                }
              }
            : undefined
        }
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2.5,
          py: 1.25,
          borderBottom: isLast ? 'none' : '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
          cursor: clickable ? 'pointer' : 'default',
          transition: 'background-color 0.15s ease',
          '&:hover': clickable
            ? {
                bgcolor: isDark ? alpha('#ffffff', 0.03) : alpha('#000000', 0.025),
                '& .row-chevron': { opacity: 1, transform: 'translateX(2px)' },
              }
            : {},
        }}
      >
        <Avatar
          sx={{
            width: 34,
            height: 34,
            bgcolor: alpha(color, 0.15),
            color: color,
            fontSize: '0.75rem',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {item.avatarText ?? item.avatarIcon}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: item.secondary ? 0.25 : 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                fontSize: '0.82rem',
                color: isDark ? '#fff' : '#1a1a2e',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.primary}
            </Typography>
            {item.chips?.map((chip, idx) => {
              const chipColor = chip.color ?? color;
              const solid = chip.tone === 'solid';
              return (
                <Chip
                  key={idx}
                  label={chip.label}
                  size="small"
                  sx={{
                    height: 17,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    bgcolor: solid ? chipColor : alpha(chipColor, 0.14),
                    color: solid ? '#fff' : chipColor,
                    border: solid ? 'none' : `1px solid ${alpha(chipColor, 0.3)}`,
                    '& .MuiChip-label': { px: 0.65 },
                  }}
                />
              );
            })}
          </Stack>
          {item.secondary && (
            <Box
              sx={{
                fontSize: '0.7rem',
                color: isDark ? alpha('#fff', 0.55) : alpha('#000', 0.55),
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                '& > *': { verticalAlign: 'middle' },
              }}
            >
              {item.secondary}
            </Box>
          )}
        </Box>
        {item.tag && (
          <Chip
            label={item.tag.label}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.62rem',
              fontWeight: 600,
              bgcolor: alpha(item.tag.color, 0.15),
              color: item.tag.color,
              '& .MuiChip-label': { px: 0.85 },
              flexShrink: 0,
            }}
          />
        )}
        {clickable && (
          <ChevronRightIcon
            className="row-chevron"
            sx={{
              fontSize: '1rem',
              color: alpha(color, 0.6),
              opacity: 0.35,
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
          />
        )}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: { sx: { backdropFilter: 'blur(4px)', bgcolor: 'rgba(0,0,0,0.4)' } },
      }}
      PaperProps={{
        sx: {
          maxHeight: '80vh',
          borderRadius: 3,
          border: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          overflow: 'hidden',
          bgcolor: theme.palette.background.paper,
          backgroundImage: 'none',
          // Thin colored top accent instead of a translucent gradient background
          borderTop: `3px solid ${color}`,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          pb: 1.75,
          pt: 2,
          px: 2.5,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            sx={{
              width: 42,
              height: 42,
              bgcolor: alpha(color, 0.15),
              color: color,
            }}
          >
            {icon}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                sx={{
                  color: isDark ? alpha('#fff', 0.55) : alpha('#000', 0.55),
                  fontSize: '0.75rem',
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small" aria-label="Sluiten">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {searchable && !nothingToShow && (
        <Box
          sx={{
            px: 2.5,
            py: 1.25,
            borderBottom: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Filter in deze lijst..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: '1.05rem', color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: color },
                '&.Mui-focused fieldset': { borderColor: color },
              },
            }}
          />
          {search && (
            <Typography
              variant="caption"
              sx={{
                mt: 0.75,
                display: 'block',
                fontSize: '0.68rem',
                color: 'text.secondary',
              }}
            >
              {totalVisible} van {totalOriginal}
            </Typography>
          )}
        </Box>
      )}

      <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
        {nothingToShow ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            {emptyState?.icon && (
              <Box sx={{ fontSize: 48, color, mb: 1.5, display: 'flex', justifyContent: 'center' }}>
                {emptyState.icon}
              </Box>
            )}
            <Typography variant="subtitle1" fontWeight={600}>
              {emptyState?.title ?? 'Geen gegevens'}
            </Typography>
            {emptyState?.subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {emptyState.subtitle}
              </Typography>
            )}
          </Box>
        ) : totalVisible === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Geen resultaten voor "{search}"
            </Typography>
          </Box>
        ) : groups ? (
          <Box>
            {filteredGroups.map((group) => (
              <Box key={group.id}>
                <Box
                  sx={{
                    px: 2.5,
                    py: 0.85,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: isDark ? alpha(color, 0.08) : alpha(color, 0.06),
                    borderTop: '1px solid',
                    borderBottom: '1px solid',
                    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: color,
                      flex: 1,
                    }}
                  >
                    {group.label}
                  </Typography>
                  {group.headerTag && (
                    <Chip
                      label={group.headerTag.label}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        bgcolor: alpha(group.headerTag.color, 0.15),
                        color: group.headerTag.color,
                        '& .MuiChip-label': { px: 0.75 },
                      }}
                    />
                  )}
                </Box>
                {group.items.map((item, idx) => renderRow(item, idx === group.items.length - 1))}
              </Box>
            ))}
          </Box>
        ) : (
          <Box>
            {filteredFlatItems.map((item, idx) => renderRow(item, idx === filteredFlatItems.length - 1))}
          </Box>
        )}
      </DialogContent>

      {footer && (
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            borderTop: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          {footer}
        </Box>
      )}
    </Dialog>
  );
};

export default KPIReportDialog;

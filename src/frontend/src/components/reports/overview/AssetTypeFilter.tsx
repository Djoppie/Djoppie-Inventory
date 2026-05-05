/**
 * AssetTypeFilter
 *
 * Compact, neumorphic multiselect for narrowing the Reports → Overview KPIs
 * by asset type. Modeled on the Service/Sector filter pattern documented in
 * CLAUDE.md, but flat (no sector hierarchy): asset types are grouped by their
 * Category for scanability when there are many.
 *
 * Visual contract:
 * - Always-visible header bar with FilterListIcon + title + "X geselecteerd"
 *   chip (with clear) + expand arrow.
 * - Expanded panel: optional search box + collapsible category groups, each
 *   containing clickable Chip controls per asset type.
 * - Orange Djoppie accent (#FF7700), smooth transitions, dark-mode aware.
 */

import { useMemo, useState } from 'react';
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import type { AssetType } from '../../../types/admin.types';
import {
  getNeumorph,
  getNeumorphColors,
  getNeumorphInset,
} from '../../../utils/neumorphicStyles';

const ACCENT = '#FF7700';

interface AssetTypeFilterProps {
  /** Currently-selected asset-type IDs. Treat as a controlled value. */
  value: number[];
  /** Called whenever the selection changes. New array (no in-place mutation). */
  onChange: (next: number[]) => void;
  /** All asset types available for filtering. Inactive ones are dropped. */
  assetTypes: AssetType[];
  /** Skeleton state while asset types are being fetched. */
  loading?: boolean;
}

interface CategoryGroup {
  /** Category id, or `null` for "Geen categorie". */
  id: number | null;
  name: string;
  types: AssetType[];
}

const buildGroups = (assetTypes: AssetType[]): CategoryGroup[] => {
  const grouped = new Map<number | null, CategoryGroup>();
  for (const at of assetTypes) {
    if (!at.isActive) continue;
    const key = at.categoryId ?? null;
    const existing = grouped.get(key);
    if (existing) {
      existing.types.push(at);
    } else {
      grouped.set(key, {
        id: key,
        name: at.category?.name ?? (key === null ? 'Geen categorie' : `Categorie ${key}`),
        types: [at],
      });
    }
  }
  // Sort: named categories first (by name), then "Geen categorie" last.
  // Within each group, asset types sort by sortOrder then name.
  const groups = Array.from(grouped.values()).sort((a, b) => {
    if (a.id === null) return 1;
    if (b.id === null) return -1;
    return a.name.localeCompare(b.name);
  });
  for (const g of groups) {
    g.types.sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name));
  }
  return groups;
};

const AssetTypeFilter = ({ value, onChange, assetTypes, loading }: AssetTypeFilterProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgBase, bgSurface } = getNeumorphColors(isDark);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<number | null>>(() => new Set());

  const groups = useMemo(() => buildGroups(assetTypes), [assetTypes]);
  const selectedSet = useMemo(() => new Set(value), [value]);
  const selectedCount = selectedSet.size;

  // Filter groups by search term (matches name OR code, case-insensitive).
  const visibleGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        types: g.types.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            (t.code ?? '').toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.types.length > 0);
  }, [groups, search]);

  const toggleType = (id: number) => {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  };

  const toggleCategory = (groupId: number | null, types: AssetType[]) => {
    const allSelected = types.every((t) => selectedSet.has(t.id));
    const next = new Set(selectedSet);
    if (allSelected) {
      types.forEach((t) => next.delete(t.id));
    } else {
      types.forEach((t) => next.add(t.id));
    }
    onChange(Array.from(next));
    // Auto-expand on first interaction so the user sees what changed.
    if (!expandedCategories.has(groupId)) {
      setExpandedCategories((prev) => {
        const ns = new Set(prev);
        ns.add(groupId);
        return ns;
      });
    }
  };

  const toggleCategoryExpand = (groupId: number | null) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const clearAll = () => onChange([]);

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: bgSurface,
        boxShadow: getNeumorph(isDark, 'soft'),
        borderRadius: 1.25,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: alpha(isDark ? '#fff' : '#000', 0.06),
        borderLeft: `3px solid ${selectedCount > 0 ? ACCENT : alpha(ACCENT, 0.35)}`,
        transition: 'border-color 0.2s ease',
      }}
    >
      {/* Header bar — always visible, click anywhere to toggle */}
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 0.75,
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'background-color 0.15s ease',
          '&:hover': { bgcolor: alpha(ACCENT, 0.04) },
        }}
        aria-expanded={open}
        aria-controls="asset-type-filter-panel"
        role="button"
      >
        <FilterListIcon sx={{ fontSize: 18, color: selectedCount > 0 ? ACCENT : 'text.secondary' }} />
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            fontSize: '0.78rem',
            color: selectedCount > 0 ? ACCENT : 'text.primary',
            flex: 1,
          }}
        >
          Asset type filter
          {selectedCount === 0 && (
            <Typography
              component="span"
              variant="caption"
              sx={{ ml: 1, fontWeight: 400, color: 'text.secondary', opacity: 0.7 }}
            >
              alle types
            </Typography>
          )}
        </Typography>

        {selectedCount > 0 && (
          <Chip
            label={`${selectedCount} geselecteerd`}
            size="small"
            onDelete={(e) => {
              (e as unknown as React.MouseEvent).stopPropagation?.();
              clearAll();
            }}
            onClick={(e) => e.stopPropagation()}
            sx={{
              height: 22,
              fontSize: '0.7rem',
              fontWeight: 600,
              bgcolor: alpha(ACCENT, 0.15),
              color: ACCENT,
              border: '1px solid',
              borderColor: alpha(ACCENT, 0.3),
              '& .MuiChip-deleteIcon': { fontSize: 14, color: alpha(ACCENT, 0.7) },
            }}
          />
        )}

        <IconButton
          size="small"
          aria-label={open ? 'Filter inklappen' : 'Filter uitklappen'}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          sx={{
            p: 0.25,
            color: selectedCount > 0 ? ACCENT : 'text.secondary',
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <ExpandMoreIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Expanded body */}
      <Collapse in={open} timeout={250} unmountOnExit>
        <Box
          id="asset-type-filter-panel"
          sx={{
            p: 1.25,
            bgcolor: bgBase,
            boxShadow: getNeumorphInset(isDark),
          }}
        >
          {/* Search + clear-all toolbar */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
            <TextField
              size="small"
              placeholder="Zoek type of code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 16, color: alpha(ACCENT, 0.6) }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.78rem',
                  bgcolor: bgSurface,
                  '& fieldset': { borderColor: alpha(isDark ? '#fff' : '#000', 0.08) },
                  '&:hover fieldset': { borderColor: alpha(ACCENT, 0.4) },
                  '&.Mui-focused fieldset': { borderColor: ACCENT },
                },
              }}
            />
            {selectedCount > 0 && (
              <Tooltip title="Alle selecties wissen">
                <IconButton
                  size="small"
                  onClick={clearAll}
                  sx={{
                    color: ACCENT,
                    bgcolor: alpha(ACCENT, 0.08),
                    '&:hover': { bgcolor: alpha(ACCENT, 0.15) },
                  }}
                  aria-label="Alle filters wissen"
                >
                  <ClearAllIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* Category groups */}
          {loading ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" width={90} height={24} />
              ))}
            </Box>
          ) : visibleGroups.length === 0 ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', py: 1 }}>
              Geen asset types gevonden voor "{search}".
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {visibleGroups.map((g, idx) => {
                const types = g.types;
                const selectedInGroup = types.filter((t) => selectedSet.has(t.id)).length;
                const allSelected = selectedInGroup === types.length && types.length > 0;
                // Auto-expand when searching or group has selections; otherwise honor user toggle.
                const isExpanded =
                  search.trim().length > 0 ||
                  expandedCategories.has(g.id) ||
                  selectedInGroup > 0;

                return (
                  <Box
                    key={g.id ?? 'none'}
                    sx={{
                      borderRadius: 1.25,
                      border: '1px solid',
                      borderColor:
                        selectedInGroup > 0
                          ? alpha(ACCENT, 0.25)
                          : alpha(isDark ? '#fff' : '#000', 0.06),
                      bgcolor: selectedInGroup > 0 ? alpha(ACCENT, 0.03) : 'transparent',
                      transition: 'all 0.2s ease',
                      opacity: 0,
                      animation: `atfFadeIn 0.2s ease forwards ${idx * 0.04}s`,
                      '@keyframes atfFadeIn': {
                        from: { opacity: 0, transform: 'translateY(2px)' },
                        to: { opacity: 1, transform: 'translateY(0)' },
                      },
                    }}
                  >
                    <Box
                      onClick={() => toggleCategoryExpand(g.id)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1.25,
                        py: 0.5,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: alpha(isDark ? '#fff' : '#000', 0.02) },
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          flex: 1,
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          color: selectedInGroup > 0 ? ACCENT : 'text.primary',
                        }}
                      >
                        {g.name}{' '}
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ fontWeight: 500, color: 'text.secondary', fontSize: '0.65rem' }}
                        >
                          ({types.length})
                        </Typography>
                      </Typography>
                      {selectedInGroup > 0 && (
                        <Chip
                          label={`${selectedInGroup}/${types.length}`}
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            bgcolor: ACCENT,
                            color: 'white',
                            '& .MuiChip-label': { px: 0.6 },
                          }}
                        />
                      )}
                      <Tooltip title={allSelected ? 'Niets in deze categorie' : 'Alles in deze categorie'}>
                        <IconButton
                          size="small"
                          aria-label={allSelected ? 'Niets selecteren' : 'Alles selecteren'}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCategory(g.id, types);
                          }}
                          sx={{
                            p: 0.25,
                            color: allSelected ? ACCENT : alpha(ACCENT, 0.5),
                            fontSize: '0.6rem',
                            fontWeight: 700,
                          }}
                        >
                          <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 700 }}>
                            {allSelected ? 'WIS' : 'ALLES'}
                          </Typography>
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="small"
                        sx={{ p: 0 }}
                        aria-label={isExpanded ? 'Inklappen' : 'Uitklappen'}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategoryExpand(g.id);
                        }}
                      >
                        {isExpanded ? (
                          <ExpandLessIcon sx={{ fontSize: 14 }} />
                        ) : (
                          <ExpandMoreIcon sx={{ fontSize: 14 }} />
                        )}
                      </IconButton>
                    </Box>
                    <Collapse in={isExpanded}>
                      <Box sx={{ px: 1, pb: 0.75, pt: 0.25 }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {types.map((t) => {
                            const selected = selectedSet.has(t.id);
                            return (
                              <Chip
                                key={t.id}
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <span>{t.name}</span>
                                    {t.code && (
                                      <Box
                                        component="span"
                                        sx={{
                                          fontSize: '0.6rem',
                                          fontWeight: 700,
                                          opacity: 0.7,
                                          fontFamily: 'monospace',
                                        }}
                                      >
                                        {t.code}
                                      </Box>
                                    )}
                                  </Box>
                                }
                                size="small"
                                onClick={() => toggleType(t.id)}
                                sx={{
                                  height: 24,
                                  fontSize: '0.7rem',
                                  fontWeight: selected ? 600 : 500,
                                  cursor: 'pointer',
                                  bgcolor: selected
                                    ? alpha(ACCENT, 0.15)
                                    : alpha(isDark ? '#fff' : '#000', 0.04),
                                  color: selected ? ACCENT : 'text.secondary',
                                  border: '1px solid',
                                  borderColor: selected ? alpha(ACCENT, 0.3) : 'transparent',
                                  transition: 'all 0.15s ease',
                                  '&:hover': {
                                    bgcolor: selected ? alpha(ACCENT, 0.22) : alpha(ACCENT, 0.08),
                                    borderColor: alpha(ACCENT, 0.3),
                                  },
                                }}
                              />
                            );
                          })}
                        </Box>
                      </Box>
                    </Collapse>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default AssetTypeFilter;

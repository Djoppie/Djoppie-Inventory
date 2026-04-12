/**
 * PlanningListView - List view alternative to calendar for planning days
 *
 * Features:
 * - Sortable table/list of rollout days
 * - Filter by status, service, date range
 * - Search functionality
 * - Click to view day details
 * - Progress indicators per day
 */

import { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  LinearProgress,
  Tooltip,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  SelectChangeEvent,
  alpha,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import type { RolloutDay, RolloutDayStatus, PlanningListFilters, PlanningListSort } from '../../../../types/rollout';
import { ASSET_COLOR } from '../../../../constants/filterColors';

interface PlanningListViewProps {
  days: RolloutDay[];
  onDayClick?: (day: RolloutDay) => void;
  onDateClick?: (date: string) => void;
}

/**
 * Format date for display in Dutch locale
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Get status chip props
 */
const getStatusChipProps = (status: RolloutDayStatus) => {
  switch (status) {
    case 'Completed':
      return {
        label: 'Voltooid',
        color: 'success' as const,
        icon: <CheckCircleOutlineIcon sx={{ fontSize: '1rem' }} />,
      };
    case 'Ready':
      return {
        label: 'Gereed',
        color: 'info' as const,
        icon: <ScheduleIcon sx={{ fontSize: '1rem' }} />,
      };
    case 'Planning':
    default:
      return {
        label: 'Planning',
        color: 'default' as const,
        icon: <CalendarTodayIcon sx={{ fontSize: '1rem' }} />,
      };
  }
};

const PlanningListView = ({ days, onDayClick, onDateClick }: PlanningListViewProps) => {
  // Filter state
  const [filters, setFilters] = useState<PlanningListFilters>({
    status: 'all',
    searchQuery: '',
  });

  // Sort state
  const [sort, setSort] = useState<PlanningListSort>({
    field: 'date',
    direction: 'asc',
  });

  // Handle search change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, searchQuery: event.target.value }));
  };

  // Handle status filter change
  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    setFilters((prev) => ({
      ...prev,
      status: event.target.value as RolloutDayStatus | 'all',
    }));
  };

  // Handle sort change
  const handleSortChange = (field: PlanningListSort['field']) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Filter and sort days
  const filteredDays = useMemo(() => {
    let result = [...days];

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      result = result.filter((day) => day.status === filters.status);
    }

    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (day) =>
          day.name?.toLowerCase().includes(query) ||
          formatDate(day.date).toLowerCase().includes(query) ||
          `dag ${day.dayNumber}`.includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sort.field) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'name':
          comparison = (a.name || `Dag ${a.dayNumber}`).localeCompare(
            b.name || `Dag ${b.dayNumber}`
          );
          break;
        case 'workplaces':
          comparison = a.totalWorkplaces - b.totalWorkplaces;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'completion': {
          const aPercentage =
            a.totalWorkplaces > 0
              ? (a.completedWorkplaces / a.totalWorkplaces) * 100
              : 0;
          const bPercentage =
            b.totalWorkplaces > 0
              ? (b.completedWorkplaces / b.totalWorkplaces) * 100
              : 0;
          comparison = aPercentage - bPercentage;
          break;
        }
      }
      return sort.direction === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [days, filters, sort]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalDays = days.length;
    const completedDays = days.filter((d) => d.status === 'Completed').length;
    const totalWorkplaces = days.reduce((sum, d) => sum + d.totalWorkplaces, 0);
    const completedWorkplaces = days.reduce((sum, d) => sum + d.completedWorkplaces, 0);
    return {
      totalDays,
      completedDays,
      totalWorkplaces,
      completedWorkplaces,
      completionPercentage:
        totalWorkplaces > 0
          ? Math.round((completedWorkplaces / totalWorkplaces) * 100)
          : 0,
    };
  }, [days]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      {/* Header with stats */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Chip
            icon={<CalendarTodayIcon />}
            label={`${stats.completedDays}/${stats.totalDays} dagen`}
            variant="outlined"
            size="small"
            sx={{
              borderColor: ASSET_COLOR,
              color: ASSET_COLOR,
              '& .MuiChip-icon': { color: ASSET_COLOR },
            }}
          />
          <Chip
            icon={<PeopleIcon />}
            label={`${stats.completedWorkplaces}/${stats.totalWorkplaces} werkplekken`}
            variant="outlined"
            size="small"
            sx={{
              borderColor: '#3B82F6',
              color: '#3B82F6',
              '& .MuiChip-icon': { color: '#3B82F6' },
            }}
          />
          <Chip
            label={`${stats.completionPercentage}% voltooid`}
            variant="filled"
            size="small"
            sx={{
              bgcolor:
                stats.completionPercentage === 100
                  ? 'rgba(34, 197, 94, 0.15)'
                  : 'rgba(255, 119, 0, 0.15)',
              color: stats.completionPercentage === 100 ? '#16a34a' : ASSET_COLOR,
              fontWeight: 600,
              border: `1px solid ${stats.completionPercentage === 100 ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255, 119, 0, 0.4)'}`,
            }}
          />
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {/* Search */}
          <TextField
            size="small"
            placeholder="Zoeken..."
            value={filters.searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                </InputAdornment>
              ),
              endAdornment: filters.searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                  >
                    <ClearIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />

          {/* Status filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status || 'all'}
              label="Status"
              onChange={handleStatusChange}
            >
              <MenuItem value="all">Alle</MenuItem>
              <MenuItem value="Planning">Planning</MenuItem>
              <MenuItem value="Ready">Gereed</MenuItem>
              <MenuItem value="Completed">Voltooid</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer
        sx={{
          maxHeight: 500,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow
              sx={{
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? alpha(ASSET_COLOR, 0.08)
                    : alpha(ASSET_COLOR, 0.04),
                '& th': {
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? alpha(ASSET_COLOR, 0.08)
                      : alpha(ASSET_COLOR, 0.04),
                  borderBottom: '2px solid',
                  borderColor: ASSET_COLOR,
                },
              }}
            >
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5 }}>
                <TableSortLabel
                  active={sort.field === 'date'}
                  direction={sort.field === 'date' ? sort.direction : 'asc'}
                  onClick={() => handleSortChange('date')}
                  sx={{
                    '&.Mui-active': { color: ASSET_COLOR },
                    '& .MuiTableSortLabel-icon': { color: `${ASSET_COLOR} !important` },
                  }}
                >
                  Datum
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5 }}>
                <TableSortLabel
                  active={sort.field === 'name'}
                  direction={sort.field === 'name' ? sort.direction : 'asc'}
                  onClick={() => handleSortChange('name')}
                  sx={{
                    '&.Mui-active': { color: ASSET_COLOR },
                    '& .MuiTableSortLabel-icon': { color: `${ASSET_COLOR} !important` },
                  }}
                >
                  Naam
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5 }}>
                <TableSortLabel
                  active={sort.field === 'status'}
                  direction={sort.field === 'status' ? sort.direction : 'asc'}
                  onClick={() => handleSortChange('status')}
                  sx={{
                    '&.Mui-active': { color: ASSET_COLOR },
                    '& .MuiTableSortLabel-icon': { color: `${ASSET_COLOR} !important` },
                  }}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5 }}>
                <TableSortLabel
                  active={sort.field === 'workplaces'}
                  direction={sort.field === 'workplaces' ? sort.direction : 'asc'}
                  onClick={() => handleSortChange('workplaces')}
                  sx={{
                    '&.Mui-active': { color: ASSET_COLOR },
                    '& .MuiTableSortLabel-icon': { color: `${ASSET_COLOR} !important` },
                  }}
                >
                  Werkplekken
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5 }}>
                <TableSortLabel
                  active={sort.field === 'completion'}
                  direction={sort.field === 'completion' ? sort.direction : 'asc'}
                  onClick={() => handleSortChange('completion')}
                  sx={{
                    '&.Mui-active': { color: ASSET_COLOR },
                    '& .MuiTableSortLabel-icon': { color: `${ASSET_COLOR} !important` },
                  }}
                >
                  Voortgang
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDays.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {filters.searchQuery || filters.status !== 'all'
                      ? 'Geen planningen gevonden met deze filters.'
                      : 'Nog geen planningen toegevoegd.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredDays.map((day, index) => {
                const completionPercentage =
                  day.totalWorkplaces > 0
                    ? Math.round((day.completedWorkplaces / day.totalWorkplaces) * 100)
                    : 0;
                const statusProps = getStatusChipProps(day.status);
                const isComplete = day.status === 'Completed';

                return (
                  <TableRow
                    key={day.id}
                    hover
                    onClick={() => {
                      onDayClick?.(day);
                      onDateClick?.(day.date.split('T')[0]);
                    }}
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      bgcolor: (theme) =>
                        index % 2 === 1
                          ? theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.02)'
                            : 'rgba(0, 0, 0, 0.02)'
                          : 'transparent',
                      '&:hover': {
                        bgcolor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? alpha(ASSET_COLOR, 0.08)
                            : alpha(ASSET_COLOR, 0.04),
                      },
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarTodayIcon
                          sx={{
                            fontSize: '1rem',
                            color: isComplete ? '#16a34a' : ASSET_COLOR,
                          }}
                        />
                        <Typography variant="body2" fontWeight="medium">
                          {formatDate(day.date)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={day.name ? 600 : 400}>
                        {day.name || `Dag ${day.dayNumber}`}
                      </Typography>
                      {day.notes && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 200,
                          }}
                        >
                          {day.notes}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={statusProps.icon}
                        label={statusProps.label}
                        color={statusProps.color}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 500, fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip
                        title={`${day.completedWorkplaces} van ${day.totalWorkplaces} voltooid`}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <PeopleIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                          <Typography variant="body2" fontWeight="medium">
                            {day.completedWorkplaces}/{day.totalWorkplaces}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ minWidth: 150 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={completionPercentage}
                          sx={{
                            flexGrow: 1,
                            height: 6,
                            borderRadius: 3,
                            bgcolor: 'rgba(0, 0, 0, 0.08)',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              bgcolor: isComplete ? '#16a34a' : ASSET_COLOR,
                            },
                          }}
                        />
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          sx={{
                            minWidth: 35,
                            color: isComplete ? '#16a34a' : ASSET_COLOR,
                          }}
                        >
                          {completionPercentage}%
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default PlanningListView;

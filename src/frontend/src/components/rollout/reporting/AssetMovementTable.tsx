/**
 * AssetMovementTable - Professional table showing asset deployments/decommissions
 *
 * Features:
 * - Status transition visualization (Previous -> New)
 * - Sortable columns
 * - Filterable by movement type, equipment type, date
 * - Export to CSV functionality
 * - Djoppie-neomorph styling
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Chip,
  Tooltip,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  CircularProgress,
  Alert,
  SelectChangeEvent,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import InventoryIcon from '@mui/icons-material/Inventory';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import type {
  AssetMovement,
  AssetMovementFilters,
  AssetMovementSort,
} from '../../../types/report.types';
import type { EquipmentType } from '../../../types/rollout';
import {
  formatReportDate,
  formatReportDateTime,
  getEquipmentTypeLabel,
  getMovementStatusColor,
} from '../../../hooks/rollout';
import { ASSET_COLOR } from '../../../constants/filterColors';

interface AssetMovementTableProps {
  movements: AssetMovement[];
  isLoading?: boolean;
  error?: Error | null;
  onExport?: () => void;
  isExporting?: boolean;
  sessionName?: string;
  showFilters?: boolean;
  maxHeight?: number | string;
}

/**
 * Get icon for movement type
 */
const getMovementIcon = (type: string) => {
  switch (type) {
    case 'deployment':
      return <CheckCircleIcon sx={{ fontSize: '1rem', color: 'success.main' }} />;
    case 'decommission':
      return <RemoveCircleIcon sx={{ fontSize: '1rem', color: 'error.main' }} />;
    case 'transfer':
      return <SwapHorizIcon sx={{ fontSize: '1rem', color: 'info.main' }} />;
    default:
      return null;
  }
};

const AssetMovementTable = ({
  movements,
  isLoading = false,
  error = null,
  onExport,
  isExporting = false,
  sessionName,
  showFilters = true,
  maxHeight = 500,
}: AssetMovementTableProps) => {
  // Filter state
  const [filters, setFilters] = useState<AssetMovementFilters>({
    movementType: 'all',
    equipmentType: 'all',
    searchQuery: '',
  });

  // Sort state
  const [sort, setSort] = useState<AssetMovementSort>({
    field: 'date',
    direction: 'desc',
  });

  // Handle search change
  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFilters((prev) => ({ ...prev, searchQuery: event.target.value }));
    },
    []
  );

  // Handle filter changes
  const handleMovementTypeChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      setFilters((prev) => ({
        ...prev,
        movementType: event.target.value as AssetMovementFilters['movementType'],
      }));
    },
    []
  );

  const handleEquipmentTypeChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      setFilters((prev) => ({
        ...prev,
        equipmentType: event.target.value as EquipmentType | 'all',
      }));
    },
    []
  );

  // Handle sort change
  const handleSortChange = useCallback((field: AssetMovementSort['field']) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setFilters({
      movementType: 'all',
      equipmentType: 'all',
      searchQuery: '',
    });
  }, []);

  // Filter and sort movements
  const filteredMovements = useMemo(() => {
    let result = [...movements];

    // Apply movement type filter
    if (filters.movementType && filters.movementType !== 'all') {
      result = result.filter((m) => m.movementType === filters.movementType);
    }

    // Apply equipment type filter
    if (filters.equipmentType && filters.equipmentType !== 'all') {
      result = result.filter((m) => m.equipmentType === filters.equipmentType);
    }

    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.assetCode.toLowerCase().includes(query) ||
          m.assetName?.toLowerCase().includes(query) ||
          m.serialNumber?.toLowerCase().includes(query) ||
          m.userName.toLowerCase().includes(query) ||
          m.location?.toLowerCase().includes(query) ||
          m.serviceName?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sort.field) {
        case 'assetCode':
          comparison = a.assetCode.localeCompare(b.assetCode);
          break;
        case 'equipmentType':
          comparison = a.equipmentType.localeCompare(b.equipmentType);
          break;
        case 'userName':
          comparison = a.userName.localeCompare(b.userName);
          break;
        case 'serviceName':
          comparison = (a.serviceName || '').localeCompare(b.serviceName || '');
          break;
        case 'executedBy':
          comparison = a.executedBy.localeCompare(b.executedBy);
          break;
        case 'date':
          comparison = new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime();
          break;
      }
      return sort.direction === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [movements, filters, sort]);

  // Calculate statistics
  const stats = useMemo(() => {
    const deployments = movements.filter((m) => m.movementType === 'deployment').length;
    const decommissions = movements.filter((m) => m.movementType === 'decommission').length;
    const transfers = movements.filter((m) => m.movementType === 'transfer').length;
    return { deployments, decommissions, transfers, total: movements.length };
  }, [movements]);

  const hasActiveFilters =
    filters.movementType !== 'all' ||
    filters.equipmentType !== 'all' ||
    !!filters.searchQuery;

  // Loading state
  if (isLoading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <CircularProgress size={40} />
        </Box>
      </Paper>
    );
  }

  // Error state
  if (error) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Alert severity="error">
          Fout bij het laden van asset wijzigingen: {error.message}
        </Alert>
      </Paper>
    );
  }

  // Empty state
  if (movements.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Asset Bewegingen
        </Typography>
        <Alert severity="info">
          Nog geen asset bewegingen geregistreerd. Asset wijzigingen worden geregistreerd wanneer
          werkplekken worden voltooid.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Asset Bewegingen
            {sessionName && (
              <Typography
                component="span"
                variant="body2"
                sx={{ ml: 1, color: 'text.secondary', fontWeight: 400 }}
              >
                - {sessionName}
              </Typography>
            )}
          </Typography>

          {/* Statistics chips */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<CheckCircleIcon />}
              label={`${stats.deployments} In Gebruik`}
              size="small"
              variant="outlined"
              sx={{
                borderColor: 'success.main',
                color: 'success.main',
                '& .MuiChip-icon': { color: 'success.main' },
              }}
            />
            <Chip
              icon={<RemoveCircleIcon />}
              label={`${stats.decommissions} Uit Dienst`}
              size="small"
              variant="outlined"
              sx={{
                borderColor: 'error.main',
                color: 'error.main',
                '& .MuiChip-icon': { color: 'error.main' },
              }}
            />
            {stats.transfers > 0 && (
              <Chip
                icon={<SwapHorizIcon />}
                label={`${stats.transfers} Overdracht`}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: 'info.main',
                  color: 'info.main',
                  '& .MuiChip-icon': { color: 'info.main' },
                }}
              />
            )}
          </Box>
        </Box>

        {/* Export button */}
        {onExport && (
          <Button
            variant="outlined"
            startIcon={isExporting ? <CircularProgress size={16} /> : <DownloadIcon />}
            onClick={onExport}
            disabled={isExporting}
            size="small"
            sx={{
              borderColor: ASSET_COLOR,
              color: ASSET_COLOR,
              '&:hover': {
                borderColor: ASSET_COLOR,
                bgcolor: 'rgba(255, 119, 0, 0.08)',
              },
            }}
          >
            {isExporting ? 'Exporteren...' : 'Export CSV'}
          </Button>
        )}
      </Box>

      {/* Filters */}
      {showFilters && (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          {/* Search */}
          <TextField
            size="small"
            placeholder="Zoek asset, gebruiker, locatie..."
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
            sx={{ minWidth: 250, flexGrow: 1, maxWidth: 350 }}
          />

          {/* Movement type filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={filters.movementType || 'all'}
              label="Type"
              onChange={handleMovementTypeChange}
            >
              <MenuItem value="all">Alle</MenuItem>
              <MenuItem value="deployment">In Gebruik</MenuItem>
              <MenuItem value="decommission">Uit Dienst</MenuItem>
              <MenuItem value="transfer">Overdracht</MenuItem>
            </Select>
          </FormControl>

          {/* Equipment type filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Apparaat</InputLabel>
            <Select
              value={filters.equipmentType || 'all'}
              label="Apparaat"
              onChange={handleEquipmentTypeChange}
            >
              <MenuItem value="all">Alle</MenuItem>
              <MenuItem value="laptop">Laptop</MenuItem>
              <MenuItem value="desktop">Desktop</MenuItem>
              <MenuItem value="docking">Docking</MenuItem>
              <MenuItem value="monitor">Monitor</MenuItem>
              <MenuItem value="keyboard">Toetsenbord</MenuItem>
              <MenuItem value="mouse">Muis</MenuItem>
            </Select>
          </FormControl>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              size="small"
              variant="text"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              sx={{ color: 'text.secondary' }}
            >
              Wissen
            </Button>
          )}
        </Box>
      )}

      {/* Results count */}
      {hasActiveFilters && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {filteredMovements.length} van {movements.length} bewegingen
        </Typography>
      )}

      {/* Table */}
      <TableContainer sx={{ maxHeight }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>
                <TableSortLabel
                  active={sort.field === 'assetCode'}
                  direction={sort.field === 'assetCode' ? sort.direction : 'asc'}
                  onClick={() => handleSortChange('assetCode')}
                >
                  Asset
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                <TableSortLabel
                  active={sort.field === 'equipmentType'}
                  direction={sort.field === 'equipmentType' ? sort.direction : 'asc'}
                  onClick={() => handleSortChange('equipmentType')}
                >
                  Type
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status Wijziging</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                <TableSortLabel
                  active={sort.field === 'userName'}
                  direction={sort.field === 'userName' ? sort.direction : 'asc'}
                  onClick={() => handleSortChange('userName')}
                >
                  Gebruiker
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                <TableSortLabel
                  active={sort.field === 'serviceName'}
                  direction={sort.field === 'serviceName' ? sort.direction : 'asc'}
                  onClick={() => handleSortChange('serviceName')}
                >
                  Dienst/Locatie
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                <TableSortLabel
                  active={sort.field === 'executedBy'}
                  direction={sort.field === 'executedBy' ? sort.direction : 'asc'}
                  onClick={() => handleSortChange('executedBy')}
                >
                  Uitgevoerd door
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                <TableSortLabel
                  active={sort.field === 'date'}
                  direction={sort.field === 'date' ? sort.direction : 'asc'}
                  onClick={() => handleSortChange('date')}
                >
                  Datum
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMovements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Geen bewegingen gevonden met deze filters.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredMovements.map((movement, index) => {
                const statusColor = getMovementStatusColor(movement.movementType);

                return (
                  <TableRow
                    key={`${movement.assetId}-${movement.workplaceId}-${index}`}
                    hover
                    sx={{
                      '&:hover': {
                        bgcolor: 'rgba(255, 119, 0, 0.04)',
                      },
                    }}
                  >
                    {/* Asset */}
                    <TableCell>
                      <Tooltip title={movement.assetName || movement.assetCode}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <InventoryIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {movement.assetCode}
                            </Typography>
                            {movement.serialNumber && (
                              <Typography variant="caption" color="text.secondary">
                                S/N: {movement.serialNumber}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Tooltip>
                    </TableCell>

                    {/* Equipment Type */}
                    <TableCell>
                      <Typography variant="body2">
                        {getEquipmentTypeLabel(movement.equipmentType)}
                      </Typography>
                      {movement.brand && movement.model && (
                        <Typography variant="caption" color="text.secondary">
                          {movement.brand} {movement.model}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Status Transition */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {getMovementIcon(movement.movementType)}
                        <Chip
                          size="small"
                          label={movement.previousStatus}
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 22 }}
                        />
                        <ArrowForwardIcon
                          sx={{ fontSize: '0.9rem', color: 'text.secondary', mx: 0.5 }}
                        />
                        <Chip
                          size="small"
                          label={movement.newStatus}
                          color={statusColor}
                          sx={{ fontSize: '0.7rem', height: 22 }}
                        />
                      </Box>
                    </TableCell>

                    {/* User */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2">{movement.userName}</Typography>
                          {movement.userEmail && (
                            <Typography variant="caption" color="text.secondary">
                              {movement.userEmail}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Service/Location */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <LocationOnIcon sx={{ fontSize: '1rem', color: 'text.secondary', mt: 0.25 }} />
                        <Box>
                          <Typography variant="body2">
                            {movement.serviceName || '-'}
                          </Typography>
                          {movement.location && (
                            <Typography variant="caption" color="text.secondary">
                              {movement.location}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Executed By */}
                    <TableCell>
                      <Typography variant="body2">{movement.executedBy}</Typography>
                    </TableCell>

                    {/* Date */}
                    <TableCell>
                      <Tooltip title={formatReportDate(movement.date)}>
                        <Typography variant="body2">
                          {formatReportDateTime(movement.executedAt)}
                        </Typography>
                      </Tooltip>
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

export default AssetMovementTable;

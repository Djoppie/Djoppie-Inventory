/**
 * AssetStatusReportSection - Shows asset status changes for a rollout session
 *
 * Displays:
 * - Summary statistics (deployed, decommissioned, workplaces)
 * - Filterable table of asset changes
 * - CSV export functionality
 */

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Tooltip,
  TableSortLabel,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import InventoryIcon from '@mui/icons-material/Inventory';
import PersonIcon from '@mui/icons-material/Person';
import { useRolloutAssetReport, useExportAssetReport } from '../../hooks/rollout';
import type { RolloutAssetChange } from '../../types/rollout';

interface AssetStatusReportSectionProps {
  sessionId: number;
  sessionName: string;
}

type TabValue = 'all' | 'deployed' | 'decommissioned';
type SortField = 'assetCode' | 'equipmentType' | 'userName' | 'date' | 'completedBy';
type SortOrder = 'asc' | 'desc';

/**
 * Get equipment label in Dutch
 */
const getEquipmentLabel = (type: string): string => {
  const labels: Record<string, string> = {
    laptop: 'Laptop',
    desktop: 'Desktop',
    docking: 'Docking Station',
    monitor: 'Monitor',
    keyboard: 'Toetsenbord',
    mouse: 'Muis',
  };
  return labels[type.toLowerCase()] || type;
};

/**
 * Format date for display
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format datetime for display
 */
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('nl-NL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const AssetStatusReportSection = ({ sessionId, sessionName }: AssetStatusReportSectionProps) => {
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const { data: report, isLoading, error } = useRolloutAssetReport(sessionId);
  const exportMutation = useExportAssetReport();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabValue) => {
    setActiveTab(newValue);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleExport = () => {
    exportMutation.mutate({ sessionId, sessionName });
  };

  // Filter changes based on active tab
  const getFilteredChanges = (): RolloutAssetChange[] => {
    if (!report?.assetChanges) return [];

    let filtered = [...report.assetChanges];

    if (activeTab === 'deployed') {
      filtered = filtered.filter((change) => change.changeType === 'InGebruik');
    } else if (activeTab === 'decommissioned') {
      filtered = filtered.filter((change) => change.changeType === 'UitDienst');
    }

    // Sort the results
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'assetCode':
          comparison = a.assetCode.localeCompare(b.assetCode);
          break;
        case 'equipmentType':
          comparison = a.equipmentType.localeCompare(b.equipmentType);
          break;
        case 'userName':
          comparison = a.userName.localeCompare(b.userName);
          break;
        case 'date':
          comparison = new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
          break;
        case 'completedBy':
          comparison = a.completedBy.localeCompare(b.completedBy);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  if (isLoading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <CircularProgress size={40} />
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error">
          Fout bij het laden van asset wijzigingen: {error.message}
        </Alert>
      </Paper>
    );
  }

  if (!report || report.assetChanges.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Asset Wijzigingen
        </Typography>
        <Alert severity="info">
          Nog geen asset wijzigingen geregistreerd voor deze rollout sessie.
          Asset wijzigingen worden geregistreerd wanneer werkplekken worden voltooid.
        </Alert>
      </Paper>
    );
  }

  const filteredChanges = getFilteredChanges();
  const deployedCount = report.assetChanges.filter((c) => c.changeType === 'InGebruik').length;
  const decommissionedCount = report.assetChanges.filter((c) => c.changeType === 'UitDienst').length;

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      {/* Header with Export Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Asset Wijzigingen</Typography>
        <Button
          variant="outlined"
          startIcon={exportMutation.isPending ? <CircularProgress size={16} /> : <DownloadIcon />}
          onClick={handleExport}
          disabled={exportMutation.isPending}
          size="small"
        >
          {exportMutation.isPending ? 'Exporteren...' : 'Export CSV'}
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(3, 1fr)',
          },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard
          icon={<CheckCircleIcon sx={{ color: 'success.main' }} />}
          label="In Gebruik Gezet"
          value={deployedCount}
          description="Assets van Nieuw naar InGebruik"
          color="success"
        />
        <StatCard
          icon={<RemoveCircleIcon sx={{ color: 'error.main' }} />}
          label="Uit Dienst Gezet"
          value={decommissionedCount}
          description="Assets naar UitDienst"
          color="error"
        />
        <StatCard
          icon={<PersonIcon sx={{ color: 'info.main' }} />}
          label="Werkplekken Voltooid"
          value={report.totalWorkplacesCompleted}
          description="Met asset wijzigingen"
          color="info"
        />
      </Box>

      {/* Filter Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab
            label={`Alle (${report.assetChanges.length})`}
            value="all"
          />
          <Tab
            label={`In Gebruik (${deployedCount})`}
            value="deployed"
            sx={{ color: 'success.main' }}
          />
          <Tab
            label={`Uit Dienst (${decommissionedCount})`}
            value="decommissioned"
            sx={{ color: 'error.main' }}
          />
        </Tabs>
      </Box>

      {/* Changes Table */}
      <TableContainer sx={{ maxHeight: 400 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'assetCode'}
                  direction={sortField === 'assetCode' ? sortOrder : 'asc'}
                  onClick={() => handleSort('assetCode')}
                >
                  Asset
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'equipmentType'}
                  direction={sortField === 'equipmentType' ? sortOrder : 'asc'}
                  onClick={() => handleSort('equipmentType')}
                >
                  Type
                </TableSortLabel>
              </TableCell>
              <TableCell>Status Wijziging</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'userName'}
                  direction={sortField === 'userName' ? sortOrder : 'asc'}
                  onClick={() => handleSort('userName')}
                >
                  Gebruiker
                </TableSortLabel>
              </TableCell>
              <TableCell>Locatie</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'completedBy'}
                  direction={sortField === 'completedBy' ? sortOrder : 'asc'}
                  onClick={() => handleSort('completedBy')}
                >
                  Uitgevoerd door
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'date'}
                  direction={sortField === 'date' ? sortOrder : 'asc'}
                  onClick={() => handleSort('date')}
                >
                  Datum
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredChanges.map((change, index) => (
              <TableRow key={`${change.assetId}-${change.workplaceId}-${index}`} hover>
                <TableCell>
                  <Tooltip title={change.assetName || change.assetCode}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <InventoryIcon fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {change.assetCode}
                        </Typography>
                        {change.serialNumber && (
                          <Typography variant="caption" color="text.secondary">
                            S/N: {change.serialNumber}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {getEquipmentLabel(change.equipmentType)}
                  </Typography>
                  {change.brand && change.model && (
                    <Typography variant="caption" color="text.secondary">
                      {change.brand} {change.model}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chip
                      size="small"
                      label={change.oldStatus}
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      →
                    </Typography>
                    <Chip
                      size="small"
                      label={change.newStatus}
                      color={change.changeType === 'InGebruik' ? 'success' : 'error'}
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{change.userName}</Typography>
                  {change.userEmail && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {change.userEmail}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{change.location || '-'}</Typography>
                  {change.serviceName && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {change.serviceName}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{change.completedBy}</Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title={formatDate(change.date)}>
                    <Typography variant="body2">{formatDateTime(change.completedAt)}</Typography>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredChanges.length === 0 && (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Geen asset wijzigingen gevonden voor dit filter.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

/**
 * Stat Card Component - Shows a statistic with icon and description
 */
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
  color: 'success' | 'error' | 'info';
}

const StatCard = ({ icon, label, value, description, color }: StatCardProps) => (
  <Card variant="outlined" sx={{ borderColor: `${color}.main`, borderWidth: 1 }}>
    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 1,
            bgcolor: `${color}.50`,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" fontWeight="bold" color={`${color}.main`}>
            {value}
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default AssetStatusReportSection;

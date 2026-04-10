import { useState, useMemo, useCallback } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { getNeumorphColors, getNeumorph } from '../utils/neumorphicStyles';
import { useIntuneDevices } from '../hooks/useIntuneDeviceDashboard';
import type { IntuneDevice } from '../types/graph.types';
import type { DashboardFilter } from '../types/intune-dashboard.types';
import DeviceOverviewStats from '../components/intune-dashboard/DeviceOverviewStats';
import DeviceSearchFilter from '../components/intune-dashboard/DeviceSearchFilter';
import DeviceListItem from '../components/intune-dashboard/DeviceListItem';

const LAPTOP_KEYWORDS = ['laptop', 'book', 'elitebook', 'latitude', 'thinkpad', 'surface', 'probook', 'zbook', 'inspiron'];

const isLaptopDevice = (device: IntuneDevice): boolean => {
  const model = device.model?.toLowerCase() ?? '';
  return LAPTOP_KEYWORDS.some((kw) => model.includes(kw));
};

const isSyncStale = (device: IntuneDevice): boolean => {
  if (!device.lastSyncDateTime) return true;
  try {
    const diffDays = (Date.now() - new Date(device.lastSyncDateTime).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 7;
  } catch {
    return false;
  }
};

const isCompliant = (device: IntuneDevice): boolean => {
  const state = device.complianceState?.toLowerCase();
  return state === 'compliant';
};

const isNonCompliant = (device: IntuneDevice): boolean => {
  const state = device.complianceState?.toLowerCase();
  return state === 'noncompliant' || state === 'error' || state === 'conflict';
};

interface IntuneDeviceDashboardPageProps {
  embedded?: boolean;
}

const IntuneDeviceDashboardPage = ({ embedded = false }: IntuneDeviceDashboardPageProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgBase } = getNeumorphColors(isDark);

  const { data: devices, isLoading } = useIntuneDevices();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<DashboardFilter[]>([]);
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null);

  const handleFilterToggle = useCallback((filter: DashboardFilter) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  }, []);

  const handleDeviceToggle = useCallback((deviceId: string) => {
    setExpandedDeviceId((prev) => (prev === deviceId ? null : deviceId));
  }, []);

  // Compute stats
  const stats = useMemo(() => {
    if (!devices) return { total: undefined, compliant: undefined, nonCompliant: undefined, syncStale: undefined };
    const total = devices.length;
    const compliant = devices.filter(isCompliant).length;
    const nonCompliant = devices.filter(isNonCompliant).length;
    const syncStale = devices.filter(isSyncStale).length;
    return { total, compliant, nonCompliant, syncStale };
  }, [devices]);

  // Client-side search + filter
  const filteredDevices = useMemo(() => {
    if (!devices) return [];
    let result = devices;

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (d) =>
          (d.deviceName?.toLowerCase().includes(q)) ||
          (d.userPrincipalName?.toLowerCase().includes(q)) ||
          (d.serialNumber?.toLowerCase().includes(q)) ||
          (d.model?.toLowerCase().includes(q))
      );
    }

    // Filters (AND logic)
    for (const filter of activeFilters) {
      switch (filter) {
        case 'nonCompliant':
          result = result.filter(isNonCompliant);
          break;
        case 'syncStale':
          result = result.filter(isSyncStale);
          break;
        case 'laptops':
          result = result.filter(isLaptopDevice);
          break;
        case 'desktops':
          result = result.filter((d) => !isLaptopDevice(d));
          break;
        case 'certIssues':
          // Cert issues filter requires batch cert loading (future optimization)
          // For now, no-op — doesn't filter client-side
          break;
      }
    }

    return result;
  }, [devices, searchQuery, activeFilters]);

  const content = (
    <>
      {/* Stats Bar */}
      <Box sx={{ px: { xs: 1.5, sm: 2 }, pt: embedded ? 1.5 : 0, mb: 1.5 }}>
        <DeviceOverviewStats
          totalDevices={stats.total}
          compliantCount={stats.compliant}
          nonCompliantCount={stats.nonCompliant}
          certIssueCount={undefined}
          syncStaleCount={stats.syncStale}
          loading={isLoading}
          certLoading={false}
        />
      </Box>

      {/* Search / Filter Bar */}
      <Box sx={{ px: { xs: 1.5, sm: 2 }, mb: 1.5 }}>
        <DeviceSearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilters={activeFilters}
          onFilterToggle={handleFilterToggle}
        />
      </Box>

      {/* Device Count */}
      <Box sx={{ px: { xs: 1.5, sm: 2 }, mb: 1 }}>
        <Typography
          variant="caption"
          sx={{
            color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
            fontSize: '0.7rem',
          }}
        >
          {isLoading
            ? 'Loading devices...'
            : `${filteredDevices.length} device${filteredDevices.length !== 1 ? 's' : ''}`}
        </Typography>
      </Box>

      {/* Device List */}
      <Box sx={{ px: { xs: 1, sm: 1.5 }, pb: 2 }}>
        {filteredDevices.map((device) => (
          <DeviceListItem
            key={device.id ?? device.serialNumber ?? device.deviceName}
            device={device}
            expanded={expandedDeviceId === (device.id ?? '')}
            onToggle={() => handleDeviceToggle(device.id ?? '')}
          />
        ))}
        {!isLoading && filteredDevices.length === 0 && (
          <Typography
            variant="body2"
            sx={{
              color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              textAlign: 'center',
              py: 4,
              fontSize: '0.82rem',
            }}
          >
            {devices?.length ? 'No devices match your search or filters.' : 'No devices found.'}
          </Typography>
        )}
      </Box>
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <Box
      sx={{
        bgcolor: bgBase,
        borderRadius: 3,
        boxShadow: getNeumorph(isDark, 'medium'),
        overflow: 'hidden',
      }}
    >
      {/* Header — only shown in standalone mode */}
      <Box sx={{ px: { xs: 1.5, sm: 2 }, pt: { xs: 1.5, sm: 2 }, pb: 0 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)',
            mb: 0.35,
            letterSpacing: '-0.02em',
            fontSize: { xs: '1.35rem', sm: '1.6rem', md: '1.85rem' },
          }}
        >
          Intune Device Dashboard
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
            mb: 1.5,
            fontSize: '0.8rem',
          }}
        >
          Microsoft Intune managed device overview and diagnostics
        </Typography>
      </Box>
      {content}
    </Box>
  );
};

export default IntuneDeviceDashboardPage;

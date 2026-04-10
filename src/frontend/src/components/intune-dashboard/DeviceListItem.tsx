import { useState } from 'react';
import {
  Box,
  Typography,
  useTheme,
  Chip,
  Tabs,
  Tab,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  Laptop as LaptopIcon,
  DesktopWindows as DesktopIcon,
  ExpandMore as ExpandMoreIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getNeumorphColors, getNeumorphInset } from '../../utils/neumorphicStyles';
import { DANGER_COLOR, ASSET_COLOR } from '../../constants/filterColors';
import { useDeviceHealth, useDeviceGroups, useDeviceConfigStatus, useDeviceEvents } from '../../hooks/useIntuneDeviceDashboard';
import { getAssetBySerialNumber } from '../../api/assets.api';
import { buildRoute } from '../../constants/routes';
import type { IntuneDevice } from '../../types/graph.types';
import DeviceInfoTab from './DeviceInfoTab';
import DeviceGroupsTab from './DeviceGroupsTab';
import DeviceCertificatesTab from './DeviceCertificatesTab';
import DeviceEventsTab from './DeviceEventsTab';

const AMBER_COLOR = '#FF9800';

interface DeviceListItemProps {
  device: IntuneDevice;
  expanded: boolean;
  onToggle: () => void;
}

const LAPTOP_KEYWORDS = ['laptop', 'book', 'elitebook', 'latitude', 'thinkpad', 'surface', 'probook', 'zbook', 'inspiron'];

const isLaptop = (model: string | undefined): boolean => {
  if (!model) return true; // default to laptop icon
  const lower = model.toLowerCase();
  return LAPTOP_KEYWORDS.some((kw) => lower.includes(kw));
};

const getRelativeTime = (dateStr: string | undefined): string => {
  if (!dateStr) return '-';
  try {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths}mo ago`;
  } catch {
    return dateStr;
  }
};

const isSyncStale = (dateStr: string | undefined): boolean => {
  if (!dateStr) return true;
  try {
    const diffDays = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 7;
  } catch {
    return false;
  }
};

type DetailTab = 'info' | 'groups' | 'certificates' | 'events';

const DeviceListItem = ({ device, expanded, onToggle }: DeviceListItemProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<DetailTab>('info');

  const laptop = isLaptop(device.model);
  const state = device.complianceState?.toLowerCase();
  const nonCompliant = state === 'noncompliant' || state === 'error' || state === 'conflict';
  const staleSync = isSyncStale(device.lastSyncDateTime);

  // Look up linked asset by serial number (only when expanded)
  const assetQuery = useQuery({
    queryKey: ['asset-by-serial', device.serialNumber],
    queryFn: () => getAssetBySerialNumber(device.serialNumber!),
    enabled: expanded && !!device.serialNumber,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Lazy-fetch hooks: only fetch when expanded and on the right tab
  const healthQuery = useDeviceHealth(device.serialNumber, expanded && activeTab === 'info');
  const groupsQuery = useDeviceGroups(device.id, expanded && activeTab === 'groups');
  const configQuery = useDeviceConfigStatus(device.id, expanded && activeTab === 'certificates');
  const eventsQuery = useDeviceEvents(device.id, expanded && activeTab === 'events');

  return (
    <Box
      sx={{
        bgcolor: bgSurface,
        borderRadius: 2,
        overflow: 'hidden',
        mb: 0.75,
      }}
    >
      {/* Summary Row */}
      <Box
        onClick={onToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 1.5 },
          px: { xs: 1.25, sm: 1.75 },
          py: 1,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
          },
        }}
      >
        {/* Device Icon */}
        <Box sx={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)', display: 'flex' }}>
          {laptop ? <LaptopIcon fontSize="small" /> : <DesktopIcon fontSize="small" />}
        </Box>

        {/* Device Name */}
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            fontSize: '0.8rem',
            color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
            minWidth: 80,
          }}
        >
          {device.deviceName ?? '-'}
        </Typography>

        {/* User */}
        <Typography
          variant="caption"
          sx={{
            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            fontSize: '0.72rem',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {device.userPrincipalName ?? '-'}
        </Typography>

        {/* Model (hidden on xs) */}
        <Typography
          variant="caption"
          sx={{
            color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
            fontSize: '0.7rem',
            display: { xs: 'none', sm: 'block' },
            minWidth: 100,
            maxWidth: 180,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {device.model ?? ''}
        </Typography>

        {/* Non-Compliant chip (only when not compliant) */}
        {nonCompliant && (
          <Chip
            label="Non-Compliant"
            size="small"
            sx={{
              height: 20,
              fontSize: '0.6rem',
              fontWeight: 600,
              bgcolor: `${DANGER_COLOR}18`,
              color: DANGER_COLOR,
              border: `1px solid ${DANGER_COLOR}30`,
            }}
          />
        )}

        {/* Last Sync */}
        <Tooltip title={device.lastSyncDateTime ? new Date(device.lastSyncDateTime).toLocaleString('nl-BE') : 'Unknown'} arrow>
          <Typography
            variant="caption"
            sx={{
              color: staleSync ? AMBER_COLOR : (isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)'),
              fontSize: '0.65rem',
              whiteSpace: 'nowrap',
              cursor: 'default',
            }}
          >
            {getRelativeTime(device.lastSyncDateTime)}
          </Typography>
        </Tooltip>

        {/* Expand Icon */}
        <ExpandMoreIcon
          fontSize="small"
          sx={{
            color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </Box>

      {/* Expanded Detail Panel */}
      <Collapse in={expanded}>
        <Box
          sx={{
            mx: 1.5,
            mb: 1.5,
            p: 1.5,
            borderRadius: 1.5,
            boxShadow: getNeumorphInset(isDark),
            bgcolor: isDark ? '#1a1f2e' : '#f0f2f5',
          }}
        >
          {/* Asset deeplink */}
          {assetQuery.data && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                mb: 1,
                cursor: 'pointer',
                '&:hover': { opacity: 0.8 },
              }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(buildRoute.assetDetail(assetQuery.data.id));
              }}
            >
              <OpenInNewIcon sx={{ fontSize: 14, color: ASSET_COLOR }} />
              <Typography
                variant="caption"
                sx={{ color: ASSET_COLOR, fontWeight: 600, fontSize: '0.72rem' }}
              >
                Open in Inventory — {assetQuery.data.assetCode}
              </Typography>
            </Box>
          )}

          <Tabs
            value={activeTab}
            onChange={(_e, v: DetailTab) => setActiveTab(v)}
            sx={{
              minHeight: 32,
              mb: 1.5,
              '& .MuiTabs-indicator': {
                backgroundColor: ASSET_COLOR,
                height: 2,
                borderRadius: '2px 2px 0 0',
              },
              '& .MuiTab-root': {
                minHeight: 32,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.72rem',
                px: 1.5,
                color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                '&.Mui-selected': {
                  color: ASSET_COLOR,
                },
              },
            }}
          >
            <Tab label="Info" value="info" />
            <Tab label="Groups" value="groups" />
            <Tab label="Certificates" value="certificates" />
            <Tab label="Events" value="events" />
          </Tabs>

          {activeTab === 'info' && (
            <DeviceInfoTab health={healthQuery.data} loading={healthQuery.isLoading} />
          )}
          {activeTab === 'groups' && (
            <DeviceGroupsTab data={groupsQuery.data} loading={groupsQuery.isLoading} />
          )}
          {activeTab === 'certificates' && (
            <DeviceCertificatesTab data={configQuery.data} loading={configQuery.isLoading} />
          )}
          {activeTab === 'events' && (
            <DeviceEventsTab data={eventsQuery.data} loading={eventsQuery.isLoading} />
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default DeviceListItem;

import React, { useMemo, useState } from 'react';
import { Box, Typography, useTheme, alpha, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InboxIcon from '@mui/icons-material/Inbox';
import { EMPLOYEE_COLOR } from '../../../constants/filterColors';
import { ROUTES } from '../../../constants/routes';
import DashboardSection from './DashboardSection';
import SectionKPICard from './SectionKPICard';
import KPIReportDialog, { KPIReportItem } from '../KPIReportDialog';
import type { AssetRequestDto } from '../../../types/assetRequest.types';
import type { AssetType } from '../../../types/admin.types';

interface RequestsSectionProps {
  requests?: AssetRequestDto[];
  delay?: number;
  selectedCategoryIds?: Set<number>;
  selectedAssetTypeIds?: Set<number>;
  assetTypes?: AssetType[];
}

const RequestsSection: React.FC<RequestsSectionProps> = ({
  requests = [],
  delay = 0,
  selectedCategoryIds,
  selectedAssetTypeIds,
  assetTypes = [],
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const [openReport, setOpenReport] = useState<'pending' | 'onboarding' | 'offboarding' | 'completed' | null>(null);

  const hasCatFilter = (selectedCategoryIds?.size ?? 0) > 0;
  const hasTypeFilter = (selectedAssetTypeIds?.size ?? 0) > 0;
  const filterActive = hasCatFilter || hasTypeFilter;

  // Look up an AssetType by free-text match on the request.assetType string.
  // AssetRequestDto.assetType is a plain string (e.g. "Laptop", "Desktop", "Monitor")
  // — match case-insensitively against AssetType.name or AssetType.code.
  const assetTypeByName = useMemo(() => {
    const map = new Map<string, AssetType>();
    assetTypes.forEach((t) => {
      map.set(t.name.toLowerCase(), t);
      map.set(t.code.toLowerCase(), t);
    });
    return map;
  }, [assetTypes]);

  // Apply filter to requests. A request matches when its assetType resolves to
  // an AssetType whose id/categoryId is in the selected set.
  const filteredRequests = useMemo(() => {
    if (!filterActive) return requests;
    return requests.filter((r) => {
      const key = r.assetType?.toLowerCase();
      if (!key) return false;
      const resolved = assetTypeByName.get(key);
      if (!resolved) return false;
      if (hasTypeFilter) return selectedAssetTypeIds!.has(resolved.id);
      if (hasCatFilter) {
        return resolved.categoryId !== undefined && selectedCategoryIds!.has(resolved.categoryId);
      }
      return true;
    });
  }, [requests, filterActive, hasTypeFilter, hasCatFilter, selectedAssetTypeIds, selectedCategoryIds, assetTypeByName]);

  const kpis = useMemo(() => {
    const source = filteredRequests;
    const pending = source.filter((r) => r.status === 'Pending' || r.status === 'InProgress').length;
    const onboarding = source.filter((r) => r.requestType === 'onboarding' && (r.status === 'Pending' || r.status === 'InProgress')).length;
    const offboarding = source.filter((r) => r.requestType === 'offboarding' && (r.status === 'Pending' || r.status === 'InProgress')).length;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const completedThisWeek = source.filter((r) => {
      if (r.status !== 'Completed' || !r.createdAt) return false;
      return new Date(r.createdAt) >= weekAgo;
    }).length;

    return { pending, onboarding, offboarding, completedThisWeek };
  }, [filteredRequests]);

  const recentRequests = useMemo(() => {
    return [...filteredRequests]
      .filter((r) => r.status === 'Pending' || r.status === 'InProgress')
      .sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 3);
  }, [filteredRequests]);

  const getTypeIcon = (requestType: string) => {
    switch (requestType) {
      case 'onboarding': return <PersonAddIcon sx={{ fontSize: 12 }} />;
      case 'offboarding': return <PersonRemoveIcon sx={{ fontSize: 12 }} />;
      default: return <AssignmentIcon sx={{ fontSize: 12 }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#FF9800';
      case 'InProgress': return '#2196F3';
      case 'Completed': return '#4CAF50';
      case 'Cancelled': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  return (
    <DashboardSection
      title="Requests"
      icon={<AssignmentIcon />}
      accentColor={EMPLOYEE_COLOR}
      route={ROUTES.REQUESTS}
      delay={delay}
      filterActive={filterActive}
    >
      {/* KPI Cards Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 1.5,
          mb: 2,
        }}
      >
        <SectionKPICard
          label="Openstaand"
          value={kpis.pending}
          color={EMPLOYEE_COLOR}
          icon={<PendingActionsIcon />}
          pulse={kpis.pending > 0}
          onClick={() => setOpenReport('pending')}
        />
        <SectionKPICard
          label="Onboarding"
          value={kpis.onboarding}
          color="#4CAF50"
          icon={<PersonAddIcon />}
          onClick={() => setOpenReport('onboarding')}
        />
        <SectionKPICard
          label="Offboarding"
          value={kpis.offboarding}
          color="#f44336"
          icon={<PersonRemoveIcon />}
          onClick={() => setOpenReport('offboarding')}
        />
        <SectionKPICard
          label="Voltooid (7d)"
          value={kpis.completedThisWeek}
          color="#2196F3"
          icon={<CheckCircleIcon />}
          onClick={() => setOpenReport('completed')}
        />
      </Box>

      {/* Recent requests */}
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: isDark ? alpha('#1a1f2e', 0.4) : alpha('#f8f8f8', 0.8),
          border: '1px solid',
          borderColor: filterActive
            ? alpha(EMPLOYEE_COLOR, 0.3)
            : isDark
              ? 'rgba(255,255,255,0.04)'
              : 'rgba(0,0,0,0.04)',
          transition: 'border-color 0.2s ease',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: isDark ? alpha('#fff', 0.5) : alpha('#000', 0.5),
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Recente Requests
          </Typography>
          {filterActive && (
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.6rem',
                fontWeight: 700,
                color: EMPLOYEE_COLOR,
              }}
            >
              {filteredRequests.length} van {requests.length}
            </Typography>
          )}
        </Box>
        {recentRequests.length === 0 ? (
          <Typography variant="caption" sx={{ color: isDark ? alpha('#fff', 0.4) : alpha('#000', 0.4), fontStyle: 'italic' }}>
            {filterActive && requests.length > 0
              ? 'Geen requests in de gekozen categorie(ën)'
              : 'Geen openstaande requests'}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {recentRequests.map((request) => (
              <Box
                key={request.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1 }}>
                  <Box sx={{ color: EMPLOYEE_COLOR, display: 'flex' }}>
                    {getTypeIcon(request.requestType)}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.65rem',
                      color: isDark ? alpha('#fff', 0.85) : alpha('#000', 0.85),
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: 500,
                    }}
                  >
                    {request.employeeName || `Request #${request.id}`}
                  </Typography>
                  {request.assetType && (
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.58rem',
                        color: isDark ? alpha('#fff', 0.45) : alpha('#000', 0.45),
                        bgcolor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05),
                        px: 0.5,
                        borderRadius: 0.5,
                        flexShrink: 0,
                      }}
                    >
                      {request.assetType}
                    </Typography>
                  )}
                </Box>
                <Chip
                  label={request.status === 'Pending' ? 'Wacht' : 'Bezig'}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.55rem',
                    fontWeight: 600,
                    bgcolor: alpha(getStatusColor(request.status), 0.15),
                    color: getStatusColor(request.status),
                    '& .MuiChip-label': { px: 0.75 },
                    flexShrink: 0,
                  }}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {openReport && (() => {
        const buildItems = (filterFn: (r: AssetRequestDto) => boolean): KPIReportItem[] =>
          filteredRequests
            .filter(filterFn)
            .sort((a, b) => {
              const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return tb - ta;
            })
            .map((r) => {
              const initials = (r.employeeName || 'X').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
              const typeColor = r.requestType === 'onboarding' ? '#4CAF50' : '#f44336';
              const typeLabel = r.requestType === 'onboarding' ? 'Onboarding' : 'Offboarding';
              const date = r.requestedDate ? new Date(r.requestedDate).toLocaleDateString('nl-BE') : null;
              return {
                id: r.id,
                avatarText: initials,
                primary: r.employeeName || `Request #${r.id}`,
                secondary: [r.assetType, date ? `gevraagd ${date}` : null, r.notes ?? null].filter(Boolean).join(' · '),
                chips: [
                  { label: typeLabel, color: typeColor },
                  ...(r.assetType ? [{ label: r.assetType, color: EMPLOYEE_COLOR }] : []),
                ],
                tag: { label: r.status, color: getStatusColor(r.status) },
                onClick: () => {
                  const route = r.requestType === 'onboarding' ? ROUTES.REQUESTS_ONBOARDING : ROUTES.REQUESTS_OFFBOARDING;
                  navigate(route);
                },
                searchText: [r.employeeName, r.assetType, r.notes].filter(Boolean).join(' '),
              };
            });

        const cfg = (() => {
          switch (openReport) {
            case 'pending':
              return {
                title: 'Openstaande requests',
                subtitle: `${kpis.pending} wachtend op verwerking`,
                icon: <PendingActionsIcon />,
                color: EMPLOYEE_COLOR,
                items: buildItems((r) => r.status === 'Pending' || r.status === 'InProgress'),
                emptyState: {
                  icon: <InboxIcon sx={{ fontSize: 48 }} />,
                  title: 'Geen openstaande requests',
                },
              };
            case 'onboarding':
              return {
                title: 'Onboarding requests',
                subtitle: `${kpis.onboarding} actief`,
                icon: <PersonAddIcon />,
                color: '#4CAF50',
                items: buildItems((r) => r.requestType === 'onboarding' && (r.status === 'Pending' || r.status === 'InProgress')),
                emptyState: { title: 'Geen openstaande onboarding requests' },
              };
            case 'offboarding':
              return {
                title: 'Offboarding requests',
                subtitle: `${kpis.offboarding} actief`,
                icon: <PersonRemoveIcon />,
                color: '#f44336',
                items: buildItems((r) => r.requestType === 'offboarding' && (r.status === 'Pending' || r.status === 'InProgress')),
                emptyState: { title: 'Geen openstaande offboarding requests' },
              };
            case 'completed': {
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return {
                title: 'Voltooid (laatste 7 dagen)',
                subtitle: `${kpis.completedThisWeek} requests afgerond`,
                icon: <CheckCircleIcon />,
                color: '#2196F3',
                items: buildItems(
                  (r) => r.status === 'Completed' && !!r.createdAt && new Date(r.createdAt) >= weekAgo,
                ),
                emptyState: { title: 'Geen voltooide requests in de afgelopen 7 dagen' },
              };
            }
          }
        })();

        return (
          <KPIReportDialog
            open
            onClose={() => setOpenReport(null)}
            {...cfg}
          />
        );
      })()}
    </DashboardSection>
  );
};

export default RequestsSection;

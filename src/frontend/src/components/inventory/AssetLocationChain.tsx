import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  alpha,
  Tooltip,
  useTheme,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PlaceIcon from '@mui/icons-material/Place';
import BusinessIcon from '@mui/icons-material/Business';
import InventoryIcon from '@mui/icons-material/Inventory';
import BuildIcon from '@mui/icons-material/Build';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import BlockIcon from '@mui/icons-material/Block';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { useTranslation } from 'react-i18next';
import { Asset, AssetStatus, LocationChainKind } from '../../types/asset.types';
import { EMPLOYEE_COLOR, WORKPLACE_COLOR, BUILDING_COLOR } from '../../constants/filterColors';

export interface AssetLocationChainProps {
  asset: Asset;
  variant: 'full' | 'compact' | 'minimal';
  onAssignWorkplace?: () => void;
  onAssignEmployee?: () => void;
  onChangeAssignment?: () => void;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Dot separator between chain segments. */
const Dot = () => (
  <Typography
    component="span"
    sx={{
      mx: 0.75,
      color: 'text.disabled',
      fontSize: '0.75rem',
      userSelect: 'none',
    }}
  >
    ·
  </Typography>
);

/** A small navigable chip-like link. */
const ChainLink = ({
  to,
  label,
  icon,
  color,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}) => (
  <Box
    component={Link}
    to={to}
    onClick={(e: React.MouseEvent) => e.stopPropagation()}
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.4,
      color,
      fontWeight: 600,
      fontSize: '0.8125rem',
      textDecoration: 'none',
      borderRadius: 1,
      px: 0.5,
      py: 0.15,
      transition: 'all 0.15s ease',
      '&:hover': {
        textDecoration: 'underline',
        bgcolor: alpha(color, 0.08),
      },
    }}
  >
    {icon}
    <span>{label}</span>
  </Box>
);

/** Check if the asset's location is employee-bound. */
const isEmployeeBound = (asset: Asset): boolean => {
  const kind = asset.effectiveLocation?.kind;
  if (kind === LocationChainKind.Employee) return true;
  // Fallback: check relational employee field
  return !!asset.employee;
};

// ---------------------------------------------------------------------------
// Compact variant — one line, used in table cells
// ---------------------------------------------------------------------------

const AssetLocationChainCompact = ({ asset, onAssignWorkplace, onAssignEmployee }: AssetLocationChainProps) => {
  const { t } = useTranslation();
  const loc = asset.effectiveLocation;

  // Unassigned / Nieuw / Stock
  if (
    asset.status === AssetStatus.Nieuw ||
    asset.status === AssetStatus.Stock ||
    loc?.kind === LocationChainKind.None ||
    (!loc && !asset.employee && !asset.physicalWorkplace)
  ) {
    if (asset.status === AssetStatus.Nieuw && (onAssignWorkplace || onAssignEmployee)) {
      return (
        <Tooltip
          title={t('assetLocationChain.compact.assignTooltip', 'Klik om toe te wijzen')}
          arrow
          placement="top"
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LinkOffIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
            <Typography
              variant="caption"
              sx={{ color: 'text.disabled', fontStyle: 'italic', fontSize: '0.75rem' }}
            >
              {t('assetLocationChain.notAssigned', 'Niet toegewezen')}
            </Typography>
          </Box>
        </Tooltip>
      );
    }
    return (
      <Typography
        variant="caption"
        sx={{ color: 'text.disabled', fontStyle: 'italic', fontSize: '0.75rem' }}
      >
        —
      </Typography>
    );
  }

  // Employee chain
  if (loc?.kind === LocationChainKind.Employee || isEmployeeBound(asset)) {
    const name = loc?.employeeName || asset.employee?.displayName || '';
    const service = loc?.serviceName || asset.employee?.serviceName || '';
    const empId = loc?.employeeId || asset.employee?.id;
    const wpCode = loc?.physicalWorkplaceCode || asset.physicalWorkplace?.code || '';
    const wpId = loc?.physicalWorkplaceId || asset.physicalWorkplace?.id;
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'nowrap' }}>
        <PersonIcon sx={{ fontSize: 13, color: EMPLOYEE_COLOR, flexShrink: 0 }} />
        {empId ? (
          <Box
            component={Link}
            to={`/admin?tab=employees`}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            sx={{
              ml: 0.4,
              color: EMPLOYEE_COLOR,
              fontWeight: 600,
              fontSize: '0.8125rem',
              textDecoration: 'none',
              maxWidth: 110,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {name}
          </Box>
        ) : (
          <Typography
            variant="caption"
            sx={{ ml: 0.4, color: EMPLOYEE_COLOR, fontWeight: 600, whiteSpace: 'nowrap', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {name}
          </Typography>
        )}
        {wpCode && (
          <>
            <Dot />
            <PlaceIcon sx={{ fontSize: 12, color: WORKPLACE_COLOR, flexShrink: 0 }} />
            {wpId ? (
              <Box
                component={Link}
                to={`/workplaces/${wpId}`}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                sx={{
                  ml: 0.3,
                  color: WORKPLACE_COLOR,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {wpCode}
              </Box>
            ) : (
              <Typography
                variant="caption"
                sx={{ ml: 0.3, color: WORKPLACE_COLOR, fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                {wpCode}
              </Typography>
            )}
          </>
        )}
        {service && (
          <>
            <Dot />
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
              {service}
            </Typography>
          </>
        )}
      </Box>
    );
  }

  // Workplace chain
  if (loc?.kind === LocationChainKind.Workplace || asset.physicalWorkplace) {
    const code = loc?.physicalWorkplaceCode || asset.physicalWorkplace?.code || '';
    const building = loc?.buildingName || asset.physicalWorkplace?.buildingName || '';
    const wpId = loc?.physicalWorkplaceId || asset.physicalWorkplace?.id;
    // Surface the workplace's current occupant so user-bound devices (laptops/
    // desktops sitting on a workplace without their own Asset.EmployeeId FK)
    // still show who is using them.
    const occupantName = asset.physicalWorkplace?.currentOccupantName || '';
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'nowrap' }}>
        {occupantName && (
          <>
            <PersonIcon sx={{ fontSize: 13, color: EMPLOYEE_COLOR, flexShrink: 0 }} />
            <Typography
              variant="caption"
              sx={{
                ml: 0.4,
                color: EMPLOYEE_COLOR,
                fontWeight: 600,
                fontSize: '0.8125rem',
                whiteSpace: 'nowrap',
                maxWidth: 110,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {occupantName}
            </Typography>
            <Dot />
          </>
        )}
        <PlaceIcon sx={{ fontSize: 13, color: WORKPLACE_COLOR, flexShrink: 0 }} />
        {wpId ? (
          <Box
            component={Link}
            to={`/workplaces/${wpId}`}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            sx={{
              ml: 0.4,
              color: WORKPLACE_COLOR,
              fontWeight: 600,
              fontSize: '0.8125rem',
              textDecoration: 'none',
              maxWidth: 90,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {code}
          </Box>
        ) : (
          <Typography variant="caption" sx={{ ml: 0.4, color: WORKPLACE_COLOR, fontWeight: 600 }}>
            {code}
          </Typography>
        )}
        {building && (
          <>
            <Dot />
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
              {building}
            </Typography>
          </>
        )}
      </Box>
    );
  }

  // Herstelling / Defect / UitDienst
  const statusLabel: Record<string, { icon: React.ReactNode; color: string; text: string }> = {
    Herstelling: { icon: <BuildIcon sx={{ fontSize: 13 }} />, color: '#92400E', text: t('assetLocationChain.inRepair', 'Herstelling') },
    Defect: { icon: <ErrorOutlineIcon sx={{ fontSize: 13 }} />, color: '#991B1B', text: t('assetLocationChain.defect', 'Defect') },
    UitDienst: { icon: <BlockIcon sx={{ fontSize: 13 }} />, color: '#374151', text: t('assetLocationChain.decommissioned', 'Buiten dienst') },
  };
  const s = statusLabel[asset.status];
  if (s) {
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, color: s.color }}>
        {s.icon}
        <Typography variant="caption" sx={{ color: s.color, fontWeight: 500 }}>{s.text}</Typography>
      </Box>
    );
  }

  return <Typography variant="caption" color="text.disabled">—</Typography>;
};

// ---------------------------------------------------------------------------
// Minimal variant — just an icon + short text, for dashboard panels
// ---------------------------------------------------------------------------

const AssetLocationChainMinimal = ({ asset }: AssetLocationChainProps) => {
  const { t } = useTranslation();
  const loc = asset.effectiveLocation;

  if (!loc || loc.kind === LocationChainKind.None) {
    return (
      <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
        {t('assetLocationChain.notAssigned', 'Niet toegewezen')}
      </Typography>
    );
  }
  if (loc.kind === LocationChainKind.Employee) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <PersonIcon sx={{ fontSize: 14, color: EMPLOYEE_COLOR }} />
        <Typography variant="caption" sx={{ color: EMPLOYEE_COLOR, fontWeight: 600 }}>
          {loc.employeeName || '—'}
        </Typography>
      </Box>
    );
  }
  if (loc.kind === LocationChainKind.Workplace) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <PlaceIcon sx={{ fontSize: 14, color: WORKPLACE_COLOR }} />
        <Typography variant="caption" sx={{ color: WORKPLACE_COLOR, fontWeight: 600 }}>
          {loc.physicalWorkplaceCode || '—'}
        </Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <InventoryIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
      <Typography variant="caption" color="text.secondary">
        {t('assetLocationChain.stock', 'Stock')}
      </Typography>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Full variant — status-adaptive panel for AssetDetailPage
// ---------------------------------------------------------------------------

const AssetLocationChainFull = ({
  asset,
  onAssignWorkplace,
  onAssignEmployee,
  onChangeAssignment,
}: AssetLocationChainProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const loc = asset.effectiveLocation;

  // ---- Nieuw: empty state with two primary CTAs ----
  if (asset.status === AssetStatus.Nieuw || loc?.kind === LocationChainKind.None || !loc) {
    return (
      <Box
        component="section"
        aria-label={t('assetLocationChain.ariaNotAssigned', 'Dit asset heeft nog geen locatie. Gebruik de knoppen hieronder om toe te wijzen.')}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 4,
          px: 3,
          borderRadius: 2,
          border: '2px dashed',
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
          bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
          textAlign: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            mb: 0.5,
          }}
        >
          <LinkOffIcon sx={{ fontSize: 28, color: 'text.disabled' }} />
        </Box>

        <Typography variant="subtitle1" fontWeight={700} color="text.primary">
          {t('assetLocationChain.notAssignedTitle', 'Nog niet toegewezen')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
          {t(
            'assetLocationChain.notAssignedDesc',
            'Dit asset wacht op koppeling aan een werkplek of medewerker. Gebruik een rollout-sessie voor bulktoewijzing, of wijs individueel toe.',
          )}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            mt: 1,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {onAssignWorkplace && (
            <Button
              variant="contained"
              startIcon={<PlaceIcon />}
              onClick={onAssignWorkplace}
              aria-label={t('assetLocationChain.assignToWorkplaceAria', {
                code: asset.assetCode,
                defaultValue: `Wijs asset ${asset.assetCode} toe aan een werkplek`,
              })}
              sx={{
                bgcolor: '#FF7700',
                color: '#fff',
                fontWeight: 600,
                borderRadius: 2,
                px: 2.5,
                py: 1,
                '&:hover': {
                  bgcolor: '#E66A00',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(255,119,0,0.4)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              {t('assetLocationChain.assignToWorkplace', 'Toewijzen aan werkplek')}
            </Button>
          )}
          {onAssignEmployee && (
            <Button
              variant="contained"
              startIcon={<PersonIcon />}
              onClick={onAssignEmployee}
              aria-label={t('assetLocationChain.assignToEmployeeAria', {
                code: asset.assetCode,
                defaultValue: `Wijs asset ${asset.assetCode} toe aan een medewerker`,
              })}
              sx={{
                bgcolor: EMPLOYEE_COLOR,
                color: '#fff',
                fontWeight: 600,
                borderRadius: 2,
                px: 2.5,
                py: 1,
                '&:hover': {
                  bgcolor: alpha(EMPLOYEE_COLOR, 0.85),
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 12px ${alpha(EMPLOYEE_COLOR, 0.4)}`,
                },
                transition: 'all 0.2s ease',
              }}
            >
              {t('assetLocationChain.assignToEmployee', 'Toewijzen aan medewerker')}
            </Button>
          )}
        </Box>
      </Box>
    );
  }

  // ---- Stock: in-stock state ----
  if (asset.status === AssetStatus.Stock || loc.kind === LocationChainKind.Stock) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha('#1D4ED8', 0.1),
              border: `1px solid ${alpha('#1D4ED8', 0.2)}`,
            }}
          >
            <InventoryIcon sx={{ fontSize: 20, color: '#1D4ED8' }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} color="#1D4ED8">
              {t('assetLocationChain.stockTitle', 'Op voorraad')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {loc.installationLocation || t('assetLocationChain.stockDesc', 'Beschikbaar voor toewijzing')}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {onAssignWorkplace && (
            <Button variant="outlined" size="small" startIcon={<PlaceIcon />} onClick={onAssignWorkplace}
              sx={{ borderColor: '#FF7700', color: '#FF7700', fontWeight: 600, '&:hover': { bgcolor: alpha('#FF7700', 0.08) } }}>
              {t('assetLocationChain.assignToWorkplace', 'Toewijzen aan werkplek')}
            </Button>
          )}
          {onAssignEmployee && (
            <Button variant="outlined" size="small" startIcon={<PersonIcon />} onClick={onAssignEmployee}
              sx={{ borderColor: EMPLOYEE_COLOR, color: EMPLOYEE_COLOR, fontWeight: 600, '&:hover': { bgcolor: alpha(EMPLOYEE_COLOR, 0.08) } }}>
              {t('assetLocationChain.assignToEmployee', 'Toewijzen aan medewerker')}
            </Button>
          )}
        </Box>
      </Box>
    );
  }

  // ---- InGebruik — Employee chain ----
  if (loc.kind === LocationChainKind.Employee) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {/* Chain breadcrumb */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
          <ChainLink
            to="/admin?tab=employees"
            label={loc.employeeName || '—'}
            icon={<PersonIcon sx={{ fontSize: 16 }} />}
            color={EMPLOYEE_COLOR}
          />
          {loc.serviceName && (
            <>
              <Dot />
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {loc.serviceName}
              </Typography>
            </>
          )}
          {loc.sectorName && (
            <>
              <Dot />
              <Typography variant="body2" color="text.secondary">
                {loc.sectorName}
              </Typography>
            </>
          )}
          {loc.buildingName && (
            <>
              <Dot />
              <ChainLink
                to={loc.physicalWorkplaceId ? `/workplaces/${loc.physicalWorkplaceId}` : '/admin?tab=buildings'}
                label={loc.buildingName}
                icon={<BusinessIcon sx={{ fontSize: 16 }} />}
                color={BUILDING_COLOR}
              />
            </>
          )}
        </Box>

        {/* Workplace link if present */}
        {loc.physicalWorkplaceCode && loc.physicalWorkplaceId && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PlaceIcon sx={{ fontSize: 15, color: WORKPLACE_COLOR }} />
            <Box
              component={Link}
              to={`/workplaces/${loc.physicalWorkplaceId}`}
              sx={{
                color: WORKPLACE_COLOR,
                fontSize: '0.8125rem',
                fontWeight: 600,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {loc.physicalWorkplaceCode}
            </Box>
          </Box>
        )}

        {/* Installation date */}
        {asset.installationDate && (
          <Typography variant="caption" color="text.secondary">
            {t('assetLocationChain.installedOn', 'Geïnstalleerd')}:{' '}
            {new Date(asset.installationDate).toLocaleDateString('nl-BE')}
          </Typography>
        )}

        {onChangeAssignment && (
          <Button
            variant="outlined"
            size="small"
            onClick={onChangeAssignment}
            sx={{
              borderColor: 'divider',
              color: 'text.secondary',
              fontWeight: 600,
              alignSelf: 'flex-start',
              '&:hover': { borderColor: '#FF7700', color: '#FF7700' },
            }}
          >
            {t('assetLocationChain.changeAssignment', 'Toewijzing wijzigen')}
          </Button>
        )}
      </Box>
    );
  }

  // ---- InGebruik — Workplace chain ----
  if (loc.kind === LocationChainKind.Workplace) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {/* Chain breadcrumb */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
          {loc.physicalWorkplaceId ? (
            <ChainLink
              to={`/workplaces/${loc.physicalWorkplaceId}`}
              label={`${loc.physicalWorkplaceCode}${loc.physicalWorkplaceName ? ` – ${loc.physicalWorkplaceName}` : ''}`}
              icon={<PlaceIcon sx={{ fontSize: 16 }} />}
              color={WORKPLACE_COLOR}
            />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <PlaceIcon sx={{ fontSize: 16, color: WORKPLACE_COLOR }} />
              <Typography variant="body2" sx={{ color: WORKPLACE_COLOR, fontWeight: 600 }}>
                {loc.physicalWorkplaceCode || '—'}
              </Typography>
            </Box>
          )}
          {loc.serviceName && (
            <>
              <Dot />
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {loc.serviceName}
              </Typography>
            </>
          )}
          {loc.buildingName && (
            <>
              <Dot />
              <ChainLink
                to="/admin?tab=buildings"
                label={loc.buildingName}
                icon={<BusinessIcon sx={{ fontSize: 16 }} />}
                color={BUILDING_COLOR}
              />
            </>
          )}
        </Box>

        {/* Floor / location details */}
        {loc.installationLocation && (
          <Typography variant="caption" color="text.secondary">
            {loc.installationLocation}
          </Typography>
        )}

        {/* Installation date */}
        {asset.installationDate && (
          <Typography variant="caption" color="text.secondary">
            {t('assetLocationChain.installedOn', 'Geïnstalleerd')}:{' '}
            {new Date(asset.installationDate).toLocaleDateString('nl-BE')}
          </Typography>
        )}

        {onChangeAssignment && (
          <Button
            variant="outlined"
            size="small"
            onClick={onChangeAssignment}
            sx={{
              borderColor: 'divider',
              color: 'text.secondary',
              fontWeight: 600,
              alignSelf: 'flex-start',
              '&:hover': { borderColor: '#FF7700', color: '#FF7700' },
            }}
          >
            {t('assetLocationChain.changeWorkplace', 'Werkplek wijzigen')}
          </Button>
        )}
      </Box>
    );
  }

  // ---- Herstelling / Defect / UitDienst ----
  const terminalConfig: Partial<Record<AssetStatus, { icon: React.ReactNode; color: string; title: string; desc: string }>> = {
    [AssetStatus.Herstelling]: {
      icon: <BuildIcon sx={{ fontSize: 20 }} />,
      color: '#92400E',
      title: t('assetLocationChain.inRepairTitle', 'In herstelling'),
      desc: t('assetLocationChain.inRepairDesc', 'Dit asset wordt momenteel gerepareerd.'),
    },
    [AssetStatus.Defect]: {
      icon: <ErrorOutlineIcon sx={{ fontSize: 20 }} />,
      color: '#991B1B',
      title: t('assetLocationChain.defectTitle', 'Defect'),
      desc: t('assetLocationChain.defectDesc', 'Dit asset is defect en niet bruikbaar.'),
    },
    [AssetStatus.UitDienst]: {
      icon: <BlockIcon sx={{ fontSize: 20 }} />,
      color: '#374151',
      title: t('assetLocationChain.decommissionedTitle', 'Buiten dienst'),
      desc: t('assetLocationChain.decommissionedDesc', 'Dit asset is buiten dienst gesteld.'),
    },
  };

  const cfg = terminalConfig[asset.status];
  if (cfg) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
          p: 2,
          borderRadius: 2,
          bgcolor: alpha(cfg.color, 0.06),
          border: `1px solid ${alpha(cfg.color, 0.18)}`,
        }}
      >
        <Box sx={{ color: cfg.color, mt: 0.2, flexShrink: 0 }}>{cfg.icon}</Box>
        <Box>
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: cfg.color }}>
            {cfg.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {cfg.desc}
          </Typography>
          {asset.installationDate && (
            <Typography variant="caption" display="block" color="text.secondary">
              {t('assetLocationChain.lastUsed', 'Laatst in gebruik')}:{' '}
              {new Date(asset.installationDate).toLocaleDateString('nl-BE')}
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  return null;
};

// ---------------------------------------------------------------------------
// Public component — dispatches to the right variant
// ---------------------------------------------------------------------------

const AssetLocationChain: React.FC<AssetLocationChainProps> = (props) => {
  if (props.variant === 'compact') return <AssetLocationChainCompact {...props} />;
  if (props.variant === 'minimal') return <AssetLocationChainMinimal {...props} />;
  return <AssetLocationChainFull {...props} />;
};

export default AssetLocationChain;

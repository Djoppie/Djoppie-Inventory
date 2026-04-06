import { useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  GridColDef,
  GridRenderCellParams,
  GridColumnVisibilityModel,
} from '@mui/x-data-grid';
import { Asset } from '../../types/asset.types';
import StatusBadge from '../common/StatusBadge';
import NeumorphicDataGrid from '../admin/NeumorphicDataGrid';
import { ASSET_COLOR, SERVICE_COLOR } from '../../constants/filterColors';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AppsIcon from '@mui/icons-material/Apps';
import DevicesIcon from '@mui/icons-material/Devices';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';

interface AssetTableViewProps {
  assets: Asset[];
  selectable?: boolean;
  selectedAssetIds?: Set<number>;
  onSelectionChange?: (assetId: number, selected: boolean) => void;
}

// Helper to check if asset is a laptop/notebook (user-assigned)
const isUserAssignedAsset = (asset: Asset): boolean => {
  const category = asset.category?.toLowerCase() || '';
  const assetTypeName = asset.assetType?.name?.toLowerCase() || '';
  const assetTypeCode = asset.assetType?.code?.toLowerCase() || '';

  const laptopKeywords = ['laptop', 'notebook', 'not', 'lap'];
  return laptopKeywords.some(keyword =>
    category.includes(keyword) ||
    assetTypeName.includes(keyword) ||
    assetTypeCode.includes(keyword)
  );
};

// Helper to shorten asset code for compact display
// Format: DOCK-26-DELL-00004 → D-00004 (first letter + last segment)
const shortenAssetCode = (code: string): string => {
  if (!code) return '-';
  const parts = code.split('-');
  if (parts.length < 2) return code;
  // Get first letter of type and last number segment
  const prefix = parts[0]?.[0] || '';
  const number = parts[parts.length - 1] || '';
  return `${prefix}-${number}`;
};

const AssetTableView = ({
  assets,
  selectable = false,
  selectedAssetIds = new Set(),
  onSelectionChange,
}: AssetTableViewProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleRowClick = (assetId: number) => {
    navigate(`/assets/${assetId}`);
  };

  // Column visibility model for responsive columns
  const columnVisibilityModel: GridColumnVisibilityModel = useMemo(
    () => ({
      assetType: !isMobile, // hidden on xs, visible from sm up
      serialNumber: !isMobile, // hidden on xs, visible from sm up
      model: !isMobile && !theme.breakpoints.down('lg'), // hidden on xs/sm/md, visible from lg up
      purchaseDate: !isMobile && !theme.breakpoints.down('md'), // hidden on xs/sm, visible from md up
    }),
    [isMobile, theme.breakpoints]
  );

  // Convert selection Set to array of IDs for DataGrid
  const rowSelectionModel: number[] = useMemo(
    () => Array.from(selectedAssetIds),
    [selectedAssetIds]
  );

  // Handle selection changes from DataGrid
  const handleSelectionModelChange = useCallback(
    (newSelection: any) => {
      if (!selectable || !onSelectionChange) return;

      // Ensure newSelection is an array
      const selectionArray = Array.isArray(newSelection) ? newSelection : [];

      // Determine which rows were added or removed
      const newSet = new Set(selectionArray);
      const oldSet = selectedAssetIds;

      // Find added rows
      newSet.forEach((id) => {
        if (!oldSet.has(id as number)) {
          onSelectionChange(id as number, true);
        }
      });

      // Find removed rows
      oldSet.forEach((id) => {
        if (!newSet.has(id)) {
          onSelectionChange(id, false);
        }
      });
    },
    [selectable, onSelectionChange, selectedAssetIds]
  );

  // Column definitions with advanced MUI X DataGrid features
  const columns: GridColDef<Asset>[] = useMemo(
    () => [
      // Asset Code - Shortened with tooltip for full code
      {
        field: 'assetCode',
        headerName: isMobile ? 'Code' : 'Asset Code',
        width: 120,
        sortable: true,
        renderCell: (params: GridRenderCellParams<Asset>) => (
          <Tooltip title={params.value} arrow placement="top">
            <Box
              component="span"
              sx={{
                fontFamily: '"SF Mono", "Monaco", "Consolas", monospace',
                fontWeight: 600,
                fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                color: ASSET_COLOR,
                letterSpacing: '0.01em',
                cursor: 'default',
              }}
            >
              {shortenAssetCode(params.value)}
            </Box>
          </Tooltip>
        ),
      },

      // Status
      {
        field: 'status',
        headerName: 'Status',
        width: 130,
        sortable: true,
        renderCell: (params: GridRenderCellParams<Asset>) => (
          <StatusBadge status={params.value} size="small" />
        ),
      },

      // Asset Type (hidden on xs, visible from sm up)
      {
        field: 'assetType',
        headerName: 'Type',
        width: 140,
        sortable: true,
        valueGetter: (_value, row) => row.assetType?.name || '-',
        renderCell: (params: GridRenderCellParams<Asset>) => (
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.8125rem' },
              color: 'text.secondary',
            }}
          >
            {params.row.assetType?.name || '-'}
          </Typography>
        ),
      },

      // Serial Number (hidden on xs, visible from sm up)
      {
        field: 'serialNumber',
        headerName: 'Serial',
        width: 180,
        sortable: true,
        renderCell: (params: GridRenderCellParams<Asset>) => (
          <Typography
            variant="body2"
            sx={{
              fontFamily: '"SF Mono", "Monaco", "Consolas", monospace',
              fontWeight: 500,
              fontSize: { xs: '0.75rem', sm: '0.8125rem' },
              maxWidth: 180,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {params.value || '-'}
          </Typography>
        ),
      },

      // Model (hidden on xs/sm/md, visible from lg up)
      {
        field: 'model',
        headerName: 'Model',
        width: 160,
        sortable: true,
        renderCell: (params: GridRenderCellParams<Asset>) => (
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.8125rem' },
              maxWidth: 160,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {params.value || '-'}
          </Typography>
        ),
      },

      // Assignment/Toewijzing - Complex conditional logic
      {
        field: 'assignment',
        headerName: isMobile ? 'Toew.' : 'Toewijzing',
        width: 200,
        flex: 1,
        sortable: true,
        valueGetter: (_value, row) => {
          // For sorting: employee name for user-assigned assets, workplace code for fixed assets
          if (isUserAssignedAsset(row)) {
            return row.employee?.displayName || row.owner || '';
          } else {
            return row.physicalWorkplace?.code || '';
          }
        },
        renderCell: (params: GridRenderCellParams<Asset>) => {
          const asset = params.row;

          if (isUserAssignedAsset(asset)) {
            // Laptop/Notebook: Show employee name with workplace link
            if (asset.employee) {
              return (
                <Tooltip
                  title={
                    <Box sx={{ p: 0.5 }}>
                      <Box sx={{ display: 'flex', gap: 0.5, mb: 0.3 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          Hoofdgebruiker:
                        </Typography>
                        <Typography variant="caption">{asset.employee.displayName}</Typography>
                      </Box>
                      {asset.employee.email && (
                        <Box sx={{ display: 'flex', gap: 0.5, mb: 0.3 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            Email:
                          </Typography>
                          <Typography variant="caption">{asset.employee.email}</Typography>
                        </Box>
                      )}
                      {asset.physicalWorkplace && (
                        <Box sx={{ display: 'flex', gap: 0.5, mb: 0.3 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            Werkplek:
                          </Typography>
                          <Typography variant="caption">{asset.physicalWorkplace.code}</Typography>
                        </Box>
                      )}
                      {asset.installationDate && (
                        <Box sx={{ display: 'flex', gap: 0.5, mb: 0.3 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            In gebruik sinds:
                          </Typography>
                          <Typography variant="caption">
                            {new Date(asset.installationDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      )}
                      {asset.employee.jobTitle && (
                        <Box sx={{ display: 'flex', gap: 0.5, mb: 0.3 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            Functie:
                          </Typography>
                          <Typography variant="caption">{asset.employee.jobTitle}</Typography>
                        </Box>
                      )}
                      {asset.employee.serviceName && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            Dienst:
                          </Typography>
                          <Typography variant="caption">{asset.employee.serviceName}</Typography>
                        </Box>
                      )}
                    </Box>
                  }
                  arrow
                  placement="top"
                >
                  <Box sx={{ fontWeight: 500, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    <Link
                      to={
                        asset.physicalWorkplace
                          ? `/workplaces/${asset.physicalWorkplace.id}`
                          : asset.employee.physicalWorkplaceId
                            ? `/workplaces/${asset.employee.physicalWorkplaceId}`
                            : '/workplaces'
                      }
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        color: '#7B1FA2',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      <PersonIcon sx={{ fontSize: 14, color: '#7B1FA2' }} />
                      <span
                        style={{
                          maxWidth: 100,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {asset.employee.displayName}
                      </span>
                    </Link>
                    {asset.employee.serviceName && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.65rem',
                          fontWeight: 400,
                          pl: 2.25,
                        }}
                      >
                        {asset.employee.serviceName}
                      </Typography>
                    )}
                  </Box>
                </Tooltip>
              );
            } else if (asset.owner) {
              // Fallback: Legacy owner field
              return (
                <Tooltip
                  title={
                    <Box sx={{ p: 0.5 }}>
                      <Box sx={{ display: 'flex', gap: 0.5, mb: 0.3 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          Hoofdgebruiker:
                        </Typography>
                        <Typography variant="caption">{asset.owner}</Typography>
                      </Box>
                      {asset.physicalWorkplace && (
                        <Box sx={{ display: 'flex', gap: 0.5, mb: 0.3 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            Werkplek:
                          </Typography>
                          <Typography variant="caption">{asset.physicalWorkplace.code}</Typography>
                        </Box>
                      )}
                      {asset.installationDate && (
                        <Box sx={{ display: 'flex', gap: 0.5, mb: 0.3 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            In gebruik sinds:
                          </Typography>
                          <Typography variant="caption">
                            {new Date(asset.installationDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      )}
                      {asset.jobTitle && (
                        <Box sx={{ display: 'flex', gap: 0.5, mb: 0.3 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            Functie:
                          </Typography>
                          <Typography variant="caption">{asset.jobTitle}</Typography>
                        </Box>
                      )}
                      {asset.officeLocation && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            Locatie:
                          </Typography>
                          <Typography variant="caption">{asset.officeLocation}</Typography>
                        </Box>
                      )}
                    </Box>
                  }
                  arrow
                  placement="top"
                >
                  <Box sx={{ fontWeight: 500, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    <Link
                      to={
                        asset.physicalWorkplace ? `/workplaces/${asset.physicalWorkplace.id}` : '/workplaces'
                      }
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        color: '#7B1FA2',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      <PersonIcon sx={{ fontSize: 14, color: '#7B1FA2' }} />
                      <span
                        style={{
                          maxWidth: 100,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {asset.owner}
                      </span>
                    </Link>
                    {asset.service?.name && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.65rem',
                          fontWeight: 400,
                          pl: 2.25,
                        }}
                      >
                        {asset.service.name}
                      </Typography>
                    )}
                  </Box>
                </Tooltip>
              );
            } else {
              return (
                <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                  -
                </Typography>
              );
            }
          } else {
            // Fixed asset (desktop, monitor, docking, etc.): Show workplace with occupant/service
            if (asset.physicalWorkplace) {
              return (
                <Tooltip
                  title={
                    <Box sx={{ p: 0.5 }}>
                      <Box sx={{ display: 'flex', gap: 0.5, mb: 0.3 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          Werkplek:
                        </Typography>
                        <Typography variant="caption">{asset.physicalWorkplace.code}</Typography>
                      </Box>
                      {asset.physicalWorkplace.currentOccupantName && (
                        <Box sx={{ display: 'flex', gap: 0.5, mb: 0.3 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            Gebruiker:
                          </Typography>
                          <Typography variant="caption">
                            {asset.physicalWorkplace.currentOccupantName}
                          </Typography>
                        </Box>
                      )}
                      {(asset.physicalWorkplace.serviceName || asset.physicalWorkplace.sectorName) && (
                        <Box sx={{ display: 'flex', gap: 0.5, mb: 0.3 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            Dienst:
                          </Typography>
                          <Typography variant="caption">
                            {asset.physicalWorkplace.serviceName}
                            {asset.physicalWorkplace.sectorName &&
                              ` (${asset.physicalWorkplace.sectorName})`}
                          </Typography>
                        </Box>
                      )}
                      {asset.physicalWorkplace.buildingName && (
                        <Box sx={{ display: 'flex', gap: 0.5, mb: 0.3 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            Gebouw:
                          </Typography>
                          <Typography variant="caption">{asset.physicalWorkplace.buildingName}</Typography>
                        </Box>
                      )}
                      {asset.physicalWorkplace.floor && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            Verdieping:
                          </Typography>
                          <Typography variant="caption">{asset.physicalWorkplace.floor}</Typography>
                        </Box>
                      )}
                    </Box>
                  }
                  arrow
                  placement="top"
                >
                  <Box sx={{ fontWeight: 500, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    <Link
                      to={`/workplaces/${asset.physicalWorkplace.id}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        color: SERVICE_COLOR,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      <BusinessIcon sx={{ fontSize: 14, color: SERVICE_COLOR }} />
                      <span
                        style={{
                          maxWidth: 100,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {asset.physicalWorkplace.currentOccupantName || asset.physicalWorkplace.code}
                      </span>
                    </Link>
                    {asset.physicalWorkplace.serviceName && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.65rem',
                          fontWeight: 400,
                          pl: 2.25,
                        }}
                      >
                        {asset.physicalWorkplace.serviceName}
                      </Typography>
                    )}
                  </Box>
                </Tooltip>
              );
            } else {
              return (
                <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                  -
                </Typography>
              );
            }
          }
        },
      },

      // Purchase Date with age calculation and Intune data tooltip (hidden on xs/sm, visible from md up)
      {
        field: 'purchaseDate',
        headerName: 'Aankoop',
        width: 130,
        sortable: true,
        renderCell: (params: GridRenderCellParams<Asset>) => {
          const asset = params.row;
          if (!params.value) return '-';

          const purchaseDate = new Date(params.value);
          const ageInYears =
            (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
          const isMonitor = asset.category === 'Monitor';
          const isLaptopOrDesktop = asset.category === 'Laptop' || asset.category === 'Desktop';

          // Different thresholds for monitors vs other assets
          const color = isMonitor
            ? ageInYears < 4
              ? '#4CAF50' // green: 0-4 years
              : ageInYears < 7
                ? '#FFA726' // yellow/orange: 4-7 years
                : '#EF5350' // light red: 7+ years
            : ageInYears < 3
              ? '#4CAF50' // green: 0-3 years
              : ageInYears < 4
                ? '#FFA726' // yellow/orange: 3-4 years
                : '#EF5350'; // light red: 4+ years

          const ageDisplay =
            ageInYears < 1
              ? `${Math.round(ageInYears * 12)} maanden`
              : `${ageInYears.toFixed(1)} jaar`;

          // Build enhanced tooltip content
          const tooltipContent = (
            <Box sx={{ p: 0.5, minWidth: 180 }}>
              <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Aankoopdatum:
                </Typography>
                <Typography variant="caption">{purchaseDate.toLocaleDateString()}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Ouderdom:
                </Typography>
                <Typography variant="caption" sx={{ color }}>
                  {ageDisplay}
                </Typography>
              </Box>
              {isLaptopOrDesktop && (
                <>
                  <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.2)', my: 0.5 }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.3 }}>
                    Intune Data:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 0.3 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Enrollment:
                    </Typography>
                    <Typography variant="caption">
                      {asset.intuneEnrollmentDate
                        ? new Date(asset.intuneEnrollmentDate).toLocaleDateString()
                        : '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 0.3 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Laatste check-in:
                    </Typography>
                    <Typography variant="caption">
                      {asset.intuneLastCheckIn
                        ? new Date(asset.intuneLastCheckIn).toLocaleDateString()
                        : '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Certificaat vervalt:
                    </Typography>
                    <Typography variant="caption">
                      {asset.intuneCertificateExpiry
                        ? new Date(asset.intuneCertificateExpiry).toLocaleDateString()
                        : '-'}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          );

          return (
            <Tooltip title={tooltipContent} arrow placement="top">
              <Box
                component="span"
                sx={{
                  color,
                  fontWeight: 500,
                  cursor: 'default',
                }}
              >
                {purchaseDate.toLocaleDateString()}
              </Box>
            </Tooltip>
          );
        },
      },

      // Actions - Conditional action icons based on asset type
      {
        field: 'actions',
        headerName: 'Actions',
        width: 100,
        sortable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams<Asset>) => {
          const asset = params.row;
          return (
            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', alignItems: 'center' }}>
              {/* Software Icon - Laptops/Desktops Only */}
              {(asset.category === 'Laptop' || asset.category === 'Desktop') && (
                <Tooltip title="View Software" arrow placement="top">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/assets/${asset.id}/software`);
                    }}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 0.75,
                      padding: 0,
                      color: '#1976D2',
                      bgcolor: 'transparent',
                      border: '1px solid',
                      borderColor: 'rgba(25, 118, 210, 0.35)',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: 'rgba(25, 118, 210, 0.08)',
                        borderColor: '#1976D2',
                      },
                    }}
                  >
                    <AppsIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              )}

              {/* Intune/Device Management Icon - Laptops/Desktops with Serial Number */}
              {(asset.category === 'Laptop' || asset.category === 'Desktop') && asset.serialNumber && (
                <Tooltip title={t('intune.pageTitle', 'Device Management')} arrow placement="top">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/assets/${asset.id}/intune`);
                    }}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 0.75,
                      padding: 0,
                      color: '#388E3C',
                      bgcolor: 'transparent',
                      border: '1px solid',
                      borderColor: 'rgba(56, 142, 60, 0.35)',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: 'rgba(56, 142, 60, 0.08)',
                        borderColor: '#388E3C',
                      },
                    }}
                  >
                    <DevicesIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              )}

              {/* View Details Icon - Always Present */}
              <Tooltip title="View Details" arrow placement="top">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRowClick(asset.id);
                  }}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 0.75,
                    padding: 0,
                    color: ASSET_COLOR,
                    bgcolor: 'transparent',
                    border: '1px solid',
                    borderColor: 'rgba(255, 119, 0, 0.35)',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255, 119, 0, 0.08)',
                      borderColor: ASSET_COLOR,
                    },
                  }}
                >
                  <VisibilityIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
    ],
    [isMobile, navigate, t]
  );

  if (assets.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          No assets found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create your first asset to get started
        </Typography>
      </Box>
    );
  }

  return (
    <NeumorphicDataGrid
      rows={assets}
      columns={columns}
      checkboxSelection={selectable}
      rowSelectionModel={rowSelectionModel}
      onRowSelectionModelChange={handleSelectionModelChange}
      onRowClick={(row) => handleRowClick(row.id)}
      columnVisibilityModel={columnVisibilityModel}
      accentColor={ASSET_COLOR}
      initialPageSize={10}
      autoHeight
    />
  );
};

export default AssetTableView;

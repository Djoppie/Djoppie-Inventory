import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Slider,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
  InputAdornment,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Skeleton,
  Badge,
} from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import PersonIcon from '@mui/icons-material/Person';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import BusinessIcon from '@mui/icons-material/Business';
import SearchIcon from '@mui/icons-material/Search';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import LaptopIcon from '@mui/icons-material/Laptop';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import GroupIcon from '@mui/icons-material/Group';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FolderIcon from '@mui/icons-material/Folder';
import {
  getGraphServiceGroups,
  getGraphSectorGroups,
  getGraphSectorServices,
  getGraphGroupMembers,
  bulkCreateWorkplacesFromGraph,
} from '../../api/rollout.api';
import { rolloutKeys } from '../../hooks/useRollout';
import type { StandardAssetPlanConfig, BulkCreateFromGraphResult, GraphGroup } from '../../types/rollout';
import { ROLLOUT_TIMING } from '../../constants/rollout.constants';

interface BulkImportFromGraphDialogProps {
  open: boolean;
  onClose: () => void;
  dayId: number;
  serviceId: number;
  serviceName?: string;
}

// Helper to get role badge based on job title
function getRoleBadge(jobTitle?: string): { icon: React.ReactNode; color: string; tooltip: string } | null {
  if (!jobTitle) return null;
  const title = jobTitle.toLowerCase();

  if (title.includes('sectormanager') || title.includes('sector manager')) {
    return {
      icon: '👑',
      color: '#FFD700', // Gold
      tooltip: 'Sectormanager',
    };
  }

  if (title.includes('teamcoördinator') || title.includes('team coördinator') || title.includes('teamcoordinator')) {
    return {
      icon: <SupervisorAccountIcon sx={{ fontSize: 12, color: '#1976d2' }} />,
      color: '#1976d2', // Blue
      tooltip: 'Teamcoördinator',
    };
  }

  return null;
}

// Component to display services within a sector
function SectorServices({
  sectorId,
  selectedGroup,
  onSelectGroup,
}: {
  sectorId: string;
  selectedGroup: GraphGroup | null;
  onSelectGroup: (group: GraphGroup) => void;
}) {
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['graph', 'sector-services', sectorId],
    queryFn: () => getGraphSectorServices(sectorId),
    staleTime: ROLLOUT_TIMING.GRAPH_CACHE_STALE_TIME_MS,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" width={100} height={32} />
        ))}
      </Box>
    );
  }

  if (services.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        Geen diensten in deze sector
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {services.map((service) => (
        <Chip
          key={service.id}
          icon={<GroupIcon fontSize="small" />}
          label={service.serviceName}
          onClick={() => onSelectGroup(service)}
          variant={selectedGroup?.id === service.id ? 'filled' : 'outlined'}
          sx={{
            cursor: 'pointer',
            borderColor: selectedGroup?.id === service.id ? '#FF7700' : 'divider',
            bgcolor: selectedGroup?.id === service.id ? '#FF7700' : 'transparent',
            color: selectedGroup?.id === service.id ? 'white' : 'text.primary',
            '&:hover': {
              borderColor: '#FF7700',
              bgcolor: selectedGroup?.id === service.id ? '#e66a00' : 'rgba(255, 119, 0, 0.08)',
            },
            '& .MuiChip-icon': {
              color: selectedGroup?.id === service.id ? 'white' : 'inherit',
            },
          }}
        />
      ))}
    </Box>
  );
}

export default function BulkImportFromGraphDialog({
  open,
  onClose,
  dayId,
  serviceId,
  serviceName,
}: BulkImportFromGraphDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // State
  const [selectedGroup, setSelectedGroup] = useState<GraphGroup | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLaptopSetup, setIsLaptopSetup] = useState(true);
  const [monitorCount, setMonitorCount] = useState(2);
  const [result, setResult] = useState<BulkCreateFromGraphResult | null>(null);
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set());
  const [showFilter, setShowFilter] = useState(true);

  // Asset plan config
  const assetPlanConfig: StandardAssetPlanConfig = useMemo(() => ({
    includeLaptop: isLaptopSetup,
    includeDesktop: !isLaptopSetup,
    includeDocking: true,
    monitorCount,
    includeKeyboard: true,
    includeMouse: true,
  }), [isLaptopSetup, monitorCount]);

  // Fetch sector groups (MG-SECTOR-*)
  const { data: sectorGroups = [], isLoading: loadingSectors } = useQuery({
    queryKey: ['graph', 'sector-groups'],
    queryFn: getGraphSectorGroups,
    enabled: open,
    staleTime: ROLLOUT_TIMING.GRAPH_CACHE_STALE_TIME_MS,
  });

  // Track if we've already auto-selected for this dialog session
  const autoSelectAttempted = useRef(false);

  // Reset auto-select tracking when dialog opens with new serviceName
  useEffect(() => {
    if (open) {
      autoSelectAttempted.current = false;
    }
  }, [open, serviceName]);

  // Fetch all service groups (MG-*) - for "Other services" section
  const { data: allServiceGroups = [], isLoading: loadingServices } = useQuery({
    queryKey: ['graph', 'service-groups'],
    queryFn: getGraphServiceGroups,
    enabled: open,
    staleTime: ROLLOUT_TIMING.GRAPH_CACHE_STALE_TIME_MS,
  });

  // Auto-select matching group when data is loaded
  useEffect(() => {
    if (!open || !serviceName || autoSelectAttempted.current || allServiceGroups.length === 0) {
      return;
    }

    autoSelectAttempted.current = true;

    // Normalize the service name for matching:
    // - Remove "Dienst " prefix (e.g., "Dienst IT" → "IT")
    // - Remove "MG-" prefix if present
    // - Convert to uppercase for case-insensitive matching
    const normalizedName = serviceName
      .toUpperCase()
      .replace(/^DIENST\s+/i, '')
      .replace(/^MG-/i, '')
      .trim();

    const matchingGroup = allServiceGroups.find((group) => {
      const groupServiceName = group.serviceName?.toUpperCase() || '';
      return groupServiceName === normalizedName;
    });

    if (matchingGroup) {
      // Use queueMicrotask to avoid lint warning about setState in effect
      queueMicrotask(() => {
        setSelectedGroup(matchingGroup);
        setShowFilter(false);
      });
    }
  }, [open, serviceName, allServiceGroups]);

  // Fetch users when group is selected
  const { data: users = [], isLoading: loadingUsers, error: usersError } = useQuery({
    queryKey: ['graph', 'group-members', selectedGroup?.id],
    queryFn: () => getGraphGroupMembers(selectedGroup!.id),
    enabled: open && !!selectedGroup?.id,
  });

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.displayName?.toLowerCase().includes(query) ||
        user.userPrincipalName?.toLowerCase().includes(query) ||
        user.mail?.toLowerCase().includes(query) ||
        user.jobTitle?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Mutation for bulk creation
  const createMutation = useMutation({
    mutationFn: () =>
      bulkCreateWorkplacesFromGraph(dayId, {
        groupId: selectedGroup?.id,
        serviceId,
        selectedUserIds: selectedUserIds.size > 0 ? Array.from(selectedUserIds) : undefined,
        assetPlanConfig,
      }),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: rolloutKeys.day(dayId) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.workplaces(dayId) });
      // Also invalidate the days list so workplace counts update immediately
      queryClient.invalidateQueries({ queryKey: [...rolloutKeys.all, 'days'] });
    },
  });

  // Handlers
  const handleSelectAll = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const handleToggleUser = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleClose = () => {
    setSelectedGroup(null);
    setSelectedUserIds(new Set());
    setSearchQuery('');
    setResult(null);
    setExpandedSectors(new Set());
    onClose();
  };

  const handleCreate = () => {
    createMutation.mutate();
  };

  const handleSelectGroup = (group: GraphGroup) => {
    setSelectedGroup(group);
    setSelectedUserIds(new Set());
    setSearchQuery('');
    setShowFilter(false);
  };

  const handleToggleSector = (sectorId: string) => {
    const newExpanded = new Set(expandedSectors);
    if (newExpanded.has(sectorId)) {
      newExpanded.delete(sectorId);
    } else {
      newExpanded.add(sectorId);
    }
    setExpandedSectors(newExpanded);
  };

  const allSelected = filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.length;
  const isLoading = loadingSectors || loadingServices;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 1.5,
            bgcolor: 'action.hover',
            color: 'text.primary',
          }}
        >
          <CloudDownloadIcon sx={{ fontSize: '1.2rem' }} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {t('rollout.bulkImport.title', 'Importeren vanuit Azure AD')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Selecteer gebruikers om te importeren
          </Typography>
        </Box>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {result ? (
          // Show result
          <Box sx={{ py: 2 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {t('rollout.bulkImport.success', '{{count}} werkplekken aangemaakt', { count: result.created })}
              </Typography>
              {result.skipped > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {t('rollout.bulkImport.skipped', '{{count}} gebruikers overgeslagen (reeds toegevoegd)', { count: result.skipped })}
                </Typography>
              )}
            </Alert>

            {result.skippedUsers.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('rollout.bulkImport.skippedUsers', 'Overgeslagen gebruikers:')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {result.skippedUsers.map((name) => (
                    <Chip key={name} label={name} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          // Show form
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {/* Service info */}
            {serviceName && (
              <Alert severity="info" icon={<BusinessIcon />}>
                {t('rollout.bulkImport.forService', 'Werkplekken worden toegevoegd aan dienst: {{service}}', { service: serviceName })}
              </Alert>
            )}

            {/* Collapsible Group Filter Section */}
            <Box>
              <Box
                onClick={() => setShowFilter(!showFilter)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  py: 1,
                  px: 2,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'action.selected' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GroupIcon sx={{ color: '#FF7700' }} />
                  <Typography variant="subtitle1" fontWeight={600}>
                    {t('rollout.bulkImport.selectGroup', 'Selecteer groep')}
                  </Typography>
                  {selectedGroup && (
                    <Chip
                      label={selectedGroup.serviceName}
                      size="small"
                      sx={{ bgcolor: '#FF7700', color: 'white' }}
                    />
                  )}
                </Box>
                <ExpandMoreIcon
                  sx={{
                    transform: showFilter ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s',
                  }}
                />
              </Box>

              <Collapse in={showFilter}>
                <Box sx={{ pt: 2 }}>
                  {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={40} sx={{ color: '#FF7700' }} />
                    </Box>
                  ) : (
                    <>
                      {/* Sectors with nested services */}
                      {sectorGroups.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          {sectorGroups.map((sector) => (
                            <Accordion
                              key={sector.id}
                              expanded={expandedSectors.has(sector.id)}
                              onChange={() => handleToggleSector(sector.id)}
                              sx={{
                                border: '1px solid',
                                borderColor: selectedGroup?.id === sector.id ? '#FF7700' : 'divider',
                                bgcolor: selectedGroup?.id === sector.id ? 'rgba(255, 119, 0, 0.05)' : 'background.paper',
                                '&:before': { display: 'none' },
                                mb: 1,
                              }}
                            >
                              <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                sx={{
                                  minHeight: 48,
                                  '& .MuiAccordionSummary-content': {
                                    alignItems: 'center',
                                    gap: 1,
                                  },
                                }}
                              >
                                <FolderIcon sx={{ color: '#FF7700' }} fontSize="small" />
                                <Typography fontWeight={600}>{sector.serviceName}</Typography>
                                <Tooltip title={t('rollout.bulkImport.selectSector', 'Selecteer deze sector')}>
                                  <Chip
                                    size="small"
                                    label={t('rollout.bulkImport.selectSector', 'Selecteer')}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectGroup(sector);
                                    }}
                                    variant={selectedGroup?.id === sector.id ? 'filled' : 'outlined'}
                                    sx={{
                                      ml: 'auto',
                                      mr: 1,
                                      borderColor: selectedGroup?.id === sector.id ? '#FF7700' : 'divider',
                                      bgcolor: selectedGroup?.id === sector.id ? '#FF7700' : 'transparent',
                                      color: selectedGroup?.id === sector.id ? 'white' : 'text.secondary',
                                      '&:hover': {
                                        borderColor: '#FF7700',
                                        bgcolor: selectedGroup?.id === sector.id ? '#e66a00' : 'rgba(255, 119, 0, 0.08)',
                                      },
                                    }}
                                  />
                                </Tooltip>
                              </AccordionSummary>
                              <AccordionDetails>
                                <Typography
                                  variant="overline"
                                  sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1 }}
                                >
                                  {t('rollout.bulkImport.services', 'Diensten')}
                                </Typography>
                                <SectorServices
                                  sectorId={sector.id}
                                  selectedGroup={selectedGroup}
                                  onSelectGroup={handleSelectGroup}
                                />
                              </AccordionDetails>
                            </Accordion>
                          ))}
                        </Box>
                      )}

                      {/* All services as fallback (if no sectors or for services not in sectors) */}
                      <Accordion
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:before': { display: 'none' },
                        }}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <GroupIcon sx={{ color: 'text.secondary', mr: 1 }} fontSize="small" />
                          <Typography fontWeight={500} color="text.secondary">
                            {t('rollout.bulkImport.allServices', 'Alle diensten')}
                          </Typography>
                          <Chip
                            size="small"
                            label={allServiceGroups.length}
                            sx={{ ml: 1 }}
                          />
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box
                            sx={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 1,
                              maxHeight: 200,
                              overflow: 'auto',
                            }}
                          >
                            {allServiceGroups.map((service) => (
                              <Chip
                                key={service.id}
                                icon={<GroupIcon fontSize="small" />}
                                label={service.serviceName}
                                onClick={() => handleSelectGroup(service)}
                                variant={selectedGroup?.id === service.id ? 'filled' : 'outlined'}
                                sx={{
                                  cursor: 'pointer',
                                  borderColor: selectedGroup?.id === service.id ? '#FF7700' : 'divider',
                                  bgcolor: selectedGroup?.id === service.id ? '#FF7700' : 'transparent',
                                  color: selectedGroup?.id === service.id ? 'white' : 'text.primary',
                                  '&:hover': {
                                    borderColor: '#FF7700',
                                    bgcolor: selectedGroup?.id === service.id ? '#e66a00' : 'rgba(255, 119, 0, 0.08)',
                                  },
                                  '& .MuiChip-icon': {
                                    color: selectedGroup?.id === service.id ? 'white' : 'inherit',
                                  },
                                }}
                              />
                            ))}
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    </>
                  )}
                </Box>
              </Collapse>
            </Box>

            {/* Users list */}
            {selectedGroup && (
              <>
                <Divider />

                {/* Search and select all */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    size="small"
                    placeholder={t('rollout.bulkImport.searchUsers', 'Zoek gebruikers...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ flexGrow: 1 }}
                  />
                  <Tooltip title={allSelected ? t('common.deselectAll', 'Alles deselecteren') : t('common.selectAll', 'Alles selecteren')}>
                    <span>
                      <IconButton
                        onClick={handleSelectAll}
                        disabled={filteredUsers.length === 0}
                        sx={{
                          '&:disabled': { opacity: 0.5 },
                        }}
                      >
                        {allSelected ? <CheckBoxIcon sx={{ color: '#FF7700' }} /> : <CheckBoxOutlineBlankIcon />}
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Typography variant="body2" color="text.secondary">
                    {selectedUserIds.size} / {filteredUsers.length}
                  </Typography>
                </Box>

                {/* Users list */}
                {loadingUsers ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={40} sx={{ color: '#FF7700' }} />
                  </Box>
                ) : usersError ? (
                  <Alert severity="error">
                    {t('rollout.bulkImport.errorLoadingUsers', 'Fout bij laden gebruikers')}
                  </Alert>
                ) : filteredUsers.length === 0 ? (
                  <Alert severity="info">
                    {searchQuery
                      ? t('rollout.bulkImport.noUsersFound', 'Geen gebruikers gevonden')
                      : t('rollout.bulkImport.noUsersInGroup', 'Geen gebruikers in deze groep')}
                  </Alert>
                ) : (
                  <List
                    dense
                    sx={{
                      maxHeight: 300,
                      overflow: 'auto',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    {filteredUsers.map((user) => (
                      <ListItem
                        key={user.id}
                        component="div"
                        onClick={() => handleToggleUser(user.id)}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: selectedUserIds.has(user.id) ? 'rgba(255, 119, 0, 0.08)' : 'transparent',
                          '&:hover': {
                            bgcolor: selectedUserIds.has(user.id) ? 'rgba(255, 119, 0, 0.12)' : 'action.hover',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Checkbox
                            edge="start"
                            checked={selectedUserIds.has(user.id)}
                            tabIndex={-1}
                            disableRipple
                            sx={{
                              color: 'rgba(255, 119, 0, 0.5)',
                              '&.Mui-checked': { color: '#FF7700' },
                            }}
                          />
                        </ListItemIcon>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {(() => {
                            const roleBadge = getRoleBadge(user.jobTitle);
                            if (roleBadge) {
                              return (
                                <Tooltip title={roleBadge.tooltip} arrow>
                                  <Badge
                                    badgeContent={roleBadge.icon}
                                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                                    sx={{
                                      '& .MuiBadge-badge': {
                                        fontSize: '10px',
                                        minWidth: 14,
                                        height: 14,
                                        padding: 0,
                                        bgcolor: 'transparent',
                                      },
                                    }}
                                  >
                                    <PersonIcon fontSize="small" />
                                  </Badge>
                                </Tooltip>
                              );
                            }
                            return <PersonIcon fontSize="small" />;
                          })()}
                        </ListItemIcon>
                        <ListItemText
                          primary={user.displayName}
                          secondary={
                            <Box component="span" sx={{ display: 'flex', flexDirection: 'column' }}>
                              <span>{user.userPrincipalName || user.mail}</span>
                              {user.jobTitle && (
                                <span style={{ fontSize: '0.75rem', color: 'gray' }}>{user.jobTitle}</span>
                              )}
                            </Box>
                          }
                        />
                        {user.officeLocation && (
                          <ListItemSecondaryAction>
                            <Chip label={user.officeLocation} size="small" variant="outlined" />
                          </ListItemSecondaryAction>
                        )}
                      </ListItem>
                    ))}
                  </List>
                )}

                <Divider />

                {/* Asset plan configuration */}
                <Typography variant="subtitle2" color="text.secondary">
                  {t('rollout.bulkImport.assetConfig', 'Asset configuratie')}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isLaptopSetup}
                        onChange={(e) => setIsLaptopSetup(e.target.checked)}
                        sx={{
                          '& .Mui-checked': { color: '#FF7700' },
                          '& .Mui-checked + .MuiSwitch-track': { backgroundColor: '#FF7700' },
                        }}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {isLaptopSetup ? <LaptopIcon fontSize="small" /> : <DesktopWindowsIcon fontSize="small" />}
                        {isLaptopSetup ? t('rollout.equipment.laptop', 'Laptop') : t('rollout.equipment.desktop', 'Desktop')}
                      </Box>
                    }
                  />
                </Box>

                <Box sx={{ px: 1 }}>
                  <Typography variant="body2" gutterBottom>
                    {t('rollout.bulkImport.monitorCount', 'Aantal monitors')}: {monitorCount}
                  </Typography>
                  <Slider
                    value={monitorCount}
                    onChange={(_, value) => setMonitorCount(value as number)}
                    min={1}
                    max={3}
                    step={1}
                    marks
                    sx={{
                      color: '#FF7700',
                      '& .MuiSlider-thumb': { bgcolor: '#FF7700' },
                      '& .MuiSlider-track': { bgcolor: '#FF7700' },
                    }}
                  />
                </Box>

                {/* Summary */}
                <Alert severity="info">
                  {selectedUserIds.size === 0
                    ? t('rollout.bulkImport.willCreateAll', 'Alle {{count}} gebruikers worden geïmporteerd', { count: filteredUsers.length })
                    : t('rollout.bulkImport.willCreateSelected', '{{count}} geselecteerde gebruikers worden geïmporteerd', { count: selectedUserIds.size })}
                </Alert>
              </>
            )}

            {createMutation.isError && (
              <Alert severity="error">
                {t('rollout.bulkImport.errorCreating', 'Fout bij aanmaken werkplekken')}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>{result ? t('common.close', 'Sluiten') : t('common.cancel', 'Annuleren')}</Button>
        {!result && (
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!selectedGroup || filteredUsers.length === 0 || createMutation.isPending}
            startIcon={createMutation.isPending ? <CircularProgress size={16} /> : <CloudDownloadIcon />}
            sx={{
              bgcolor: '#FF7700',
              '&:hover': { bgcolor: '#e66a00' },
            }}
          >
            {t('rollout.bulkImport.import', 'Importeren')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

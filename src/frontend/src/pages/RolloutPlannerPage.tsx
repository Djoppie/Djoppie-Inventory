import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Stack,
  Alert,
  Snackbar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ButtonGroup,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  Delete as DeleteIcon,
  QrCodeScanner as QrCodeScannerIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Print as PrintIcon,
  ViewModule as ViewModuleIcon,
  Person as PersonIcon,
  LocationOn as LocationOnIcon,
  Category as CategoryIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { logger } from '../utils/logger';
import { rolloutApi } from '../api/rollout.api';
import { getAssets, getAssetByCode } from '../api/assets.api';
import {
  RolloutSession,
  CreateRolloutSessionDto,
  UpdateRolloutSessionDto,
  RolloutItem,
  CreateRolloutItemDto,
  UpdateRolloutItemDto,
  RolloutSessionStatus,
  RolloutItemStatus,
  MonitorPosition,
} from '../types/rollout.types';
import { Asset, AssetStatus } from '../types/asset.types';
import Loading from '../components/common/Loading';

// Scanner-style card wrapper - consistent with other pages
const scannerCardSx = {
  mb: 3,
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    borderColor: 'primary.main',
    boxShadow: (theme: { palette: { mode: string } }) =>
      theme.palette.mode === 'dark'
        ? '0 8px 32px rgba(255, 215, 0, 0.2), inset 0 0 24px rgba(255, 215, 0, 0.05)'
        : '0 4px 20px rgba(253, 185, 49, 0.3)',
  },
};

// Consistent icon button style
const iconButtonSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    borderColor: 'primary.main',
    boxShadow: (theme: { palette: { mode: string } }) =>
      theme.palette.mode === 'dark'
        ? '0 4px 16px rgba(255, 215, 0, 0.2)'
        : '0 2px 12px rgba(253, 185, 49, 0.3)',
  },
};

type GroupBy = 'none' | 'user' | 'location' | 'type';

interface LocalRolloutItem extends Omit<CreateRolloutItemDto, 'assetId'> {
  tempId: string;
  asset: Asset;
  targetUser?: string;
  targetUserEmail?: string;
  targetLocation?: string;
  targetServiceId?: number;
  monitorPosition?: MonitorPosition;
  monitorDisplayNumber?: number;
}

export default function RolloutPlannerPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Session data
  const { data: session, isLoading: isLoadingSession } = useQuery({
    queryKey: ['rollout', id],
    queryFn: () => rolloutApi.getSession(Number(id)),
    enabled: isEditMode,
  });

  // Available assets for search
  const { data: availableAssets = [], isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assets', 'all'],
    queryFn: () => getAssets(),
  });

  // Form state
  const [formData, setFormData] = useState<CreateRolloutSessionDto>({
    sessionName: '',
    description: '',
    plannedDate: new Date().toISOString().split('T')[0],
  });

  // Items state (local before save or from session)
  const [localItems, setLocalItems] = useState<LocalRolloutItem[]>([]);

  // UI state
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [bulkScanMode, setBulkScanMode] = useState(false);
  const [assetCodeInput, setAssetCodeInput] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);

  // Monitor position state for selected item
  const [selectedItemForMonitor, setSelectedItemForMonitor] = useState<string | null>(null);

  // Load session data into form when editing
  useEffect(() => {
    if (session) {
      setFormData({
        sessionName: session.sessionName,
        description: session.description || '',
        plannedDate: session.plannedDate.split('T')[0],
      });

      // Convert existing items to local items
      const localizedItems: LocalRolloutItem[] = session.items.map((item) => ({
        tempId: `existing-${item.id}`,
        asset: {
          id: item.assetId,
          assetCode: item.assetCode || '',
          assetName: item.assetName || '',
          category: '',
          status: AssetStatus.InGebruik,
          isDummy: false,
          createdAt: '',
          updatedAt: '',
          assetType: item.assetType ? { id: 0, code: '', name: item.assetType } : undefined,
        },
        targetUser: item.targetUser,
        targetUserEmail: item.targetUserEmail,
        targetLocation: item.targetLocation,
        targetServiceId: item.targetServiceId,
        monitorPosition: item.monitorPosition,
        monitorDisplayNumber: item.monitorDisplayNumber,
      }));
      setLocalItems(localizedItems);
    }
  }, [session]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: rolloutApi.createSession,
    onSuccess: async (newSession) => {
      // Add items to the newly created session
      if (localItems.length > 0) {
        const itemDtos: CreateRolloutItemDto[] = localItems.map(item => ({
          assetId: item.asset.id,
          targetUser: item.targetUser,
          targetUserEmail: item.targetUserEmail,
          targetLocation: item.targetLocation,
          targetServiceId: item.targetServiceId,
          monitorPosition: item.monitorPosition,
          monitorDisplayNumber: item.monitorDisplayNumber,
        }));
        await rolloutApi.addItemsBulk(newSession.id, itemDtos);
      }
      queryClient.invalidateQueries({ queryKey: ['rollouts'] });
      setSuccessMessage('Rollout session created successfully!');
      setHasUnsavedChanges(false);
      setTimeout(() => navigate('/rollouts'), 1500);
    },
    onError: (error: Error) => {
      logger.error('Error creating rollout session:', error);
      setErrorMessage(`Failed to create session: ${error.message}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateRolloutSessionDto) =>
      rolloutApi.updateSession(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rollout', id] });
      queryClient.invalidateQueries({ queryKey: ['rollouts'] });
      setSuccessMessage('Rollout session updated successfully!');
      setHasUnsavedChanges(false);
    },
    onError: (error: Error) => {
      logger.error('Error updating rollout session:', error);
      setErrorMessage(`Failed to update session: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => rolloutApi.deleteSession(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rollouts'] });
      setSuccessMessage('Rollout session deleted successfully!');
      setTimeout(() => navigate('/rollouts'), 1500);
    },
    onError: (error: Error) => {
      logger.error('Error deleting rollout session:', error);
      setErrorMessage(`Failed to delete session: ${error.message}`);
    },
  });

  // Update session status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: RolloutSessionStatus) =>
      rolloutApi.updateSessionStatus(Number(id), status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rollout', id] });
      queryClient.invalidateQueries({ queryKey: ['rollouts'] });
      setSuccessMessage('Session status updated successfully!');
    },
    onError: (error: Error) => {
      logger.error('Error updating session status:', error);
      setErrorMessage(`Failed to update status: ${error.message}`);
    },
  });

  // Add item mutations (for edit mode)
  const addItemMutation = useMutation({
    mutationFn: (data: CreateRolloutItemDto) =>
      rolloutApi.addItem(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rollout', id] });
      setSuccessMessage('Item added successfully!');
    },
    onError: (error: Error) => {
      logger.error('Error adding item:', error);
      setErrorMessage(`Failed to add item: ${error.message}`);
    },
  });

  // Delete item mutation (for edit mode)
  const deleteItemMutation = useMutation({
    mutationFn: ({ itemId }: { itemId: number }) =>
      rolloutApi.deleteItem(Number(id), itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rollout', id] });
      setSuccessMessage('Item removed successfully!');
    },
    onError: (error: Error) => {
      logger.error('Error removing item:', error);
      setErrorMessage(`Failed to remove item: ${error.message}`);
    },
  });

  // Handle form field changes
  const handleFormChange = (field: keyof CreateRolloutSessionDto, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  // Add asset by code (manual or QR)
  const handleAddAssetByCode = useCallback(async (code: string) => {
    try {
      const asset = await getAssetByCode(code.trim().toUpperCase());

      // Check if already added
      const alreadyAdded = localItems.some(item => item.asset.id === asset.id);
      if (alreadyAdded) {
        setErrorMessage(`Asset ${code} is already in the rollout`);
        return;
      }

      const newItem: LocalRolloutItem = {
        tempId: `temp-${Date.now()}-${Math.random()}`,
        asset,
      };

      setLocalItems(prev => [...prev, newItem]);
      setAssetCodeInput('');
      setHasUnsavedChanges(true);

      if (!bulkScanMode) {
        setSuccessMessage(`Added ${asset.assetCode} - ${asset.assetName}`);
      }
    } catch (error) {
      logger.error('Error adding asset by code:', error);
      setErrorMessage(`Asset ${code} not found`);
    }
  }, [localItems, bulkScanMode]);

  // Add asset from dropdown
  const handleAddAssetFromSearch = () => {
    if (!selectedAsset) return;

    // Check if already added
    const alreadyAdded = localItems.some(item => item.asset.id === selectedAsset.id);
    if (alreadyAdded) {
      setErrorMessage(`Asset ${selectedAsset.assetCode} is already in the rollout`);
      return;
    }

    const newItem: LocalRolloutItem = {
      tempId: `temp-${Date.now()}-${Math.random()}`,
      asset: selectedAsset,
    };

    setLocalItems(prev => [...prev, newItem]);
    setSelectedAsset(null);
    setHasUnsavedChanges(true);
    setSuccessMessage(`Added ${selectedAsset.assetCode} - ${selectedAsset.assetName}`);
  };

  // Remove item
  const handleRemoveItem = (tempId: string) => {
    setLocalItems(prev => prev.filter(item => item.tempId !== tempId));
    setHasUnsavedChanges(true);
  };

  // Update item field
  const handleUpdateItemField = (
    tempId: string,
    field: keyof LocalRolloutItem,
    value: string | number | MonitorPosition | undefined
  ) => {
    setLocalItems(prev =>
      prev.map(item =>
        item.tempId === tempId ? { ...item, [field]: value } : item
      )
    );
    setHasUnsavedChanges(true);
  };

  // Save draft
  const handleSaveDraft = async () => {
    if (!formData.sessionName.trim()) {
      setErrorMessage('Session name is required');
      return;
    }

    if (isEditMode) {
      await updateMutation.mutateAsync(formData);
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  // Mark as ready
  const handleMarkReady = async () => {
    // Validate all items have target user
    const missingUsers = localItems.filter(item => !item.targetUser?.trim());
    if (missingUsers.length > 0) {
      setErrorMessage(`${missingUsers.length} items are missing target user assignment`);
      return;
    }

    if (isEditMode) {
      await updateStatusMutation.mutateAsync(RolloutSessionStatus.Ready);
    } else {
      // Create with Ready status
      setErrorMessage('Please save the session first before marking as ready');
    }
  };

  // Start rollout
  const handleStartRollout = async () => {
    if (!isEditMode) {
      setErrorMessage('Please save the session first');
      return;
    }

    await updateStatusMutation.mutateAsync(RolloutSessionStatus.InProgress);
    setTimeout(() => navigate(`/rollouts/${id}/execute`), 1000);
  };

  // Delete session
  const handleDeleteSession = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteDialogOpen(false);
    await deleteMutation.mutateAsync();
  };

  // Download QR codes
  const handleDownloadQrCodes = async () => {
    if (!isEditMode) {
      setErrorMessage('Please save the session first');
      return;
    }

    try {
      const blob = await rolloutApi.downloadQrCodes(Number(id));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rollout-${id}-qr-codes.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccessMessage('QR codes downloaded successfully!');
    } catch (error) {
      logger.error('Error downloading QR codes:', error);
      setErrorMessage('Failed to download QR codes');
    }
  };

  // Download checklist
  const handleDownloadChecklist = async () => {
    if (!isEditMode) {
      setErrorMessage('Please save the session first');
      return;
    }

    try {
      const blob = await rolloutApi.downloadChecklist(Number(id));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rollout-${id}-checklist.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccessMessage('Checklist downloaded successfully!');
    } catch (error) {
      logger.error('Error downloading checklist:', error);
      setErrorMessage('Failed to download checklist');
    }
  };

  // Group items
  const getGroupedItems = (): { label: string; items: LocalRolloutItem[] }[] => {
    if (groupBy === 'none') {
      return [{ label: 'All Items', items: localItems }];
    }

    const groups = new Map<string, LocalRolloutItem[]>();

    localItems.forEach(item => {
      let key = 'Unassigned';

      switch (groupBy) {
        case 'user':
          key = item.targetUser || 'Unassigned';
          break;
        case 'location':
          key = item.targetLocation || 'Unassigned';
          break;
        case 'type':
          key = item.asset.assetType?.name || 'Unknown Type';
          break;
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });

    return Array.from(groups.entries())
      .map(([label, items]) => ({ label, items }))
      .sort((a, b) => a.label.localeCompare(b.label));
  };

  // Loading state
  if (isLoadingSession || isLoadingAssets) {
    return <Loading />;
  }

  const canStartRollout = isEditMode && session?.status === RolloutSessionStatus.Ready;
  const canMarkReady = isEditMode && session?.status === RolloutSessionStatus.Planning;
  const isReadOnly = isEditMode && session && session.status !== RolloutSessionStatus.Planning;

  return (
    <Box>
      {/* Back Button */}
      <Tooltip title="Back to Rollouts">
        <IconButton
          onClick={() => navigate('/rollouts')}
          sx={{
            ...iconButtonSx,
            mb: 2,
            color: 'text.secondary',
            '&:hover': {
              ...iconButtonSx['&:hover'],
              color: 'primary.main',
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Tooltip>

      {/* Page Header */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        {isEditMode ? `Edit Rollout: ${session?.sessionName}` : 'Create New Rollout'}
      </Typography>

      {/* Session Form */}
      <Card sx={scannerCardSx}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Session Details
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <TextField
              fullWidth
              required
              label="Session Name"
              value={formData.sessionName}
              onChange={(e) => handleFormChange('sessionName', e.target.value)}
              disabled={isReadOnly}
            />

            <TextField
              fullWidth
              type="date"
              label="Planned Date"
              value={formData.plannedDate}
              onChange={(e) => handleFormChange('plannedDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={isReadOnly}
            />

            <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description (optional)"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                disabled={isReadOnly}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Add Assets Section */}
      {!isReadOnly && (
        <Card sx={scannerCardSx}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Add Assets
              </Typography>

              <Chip
                label={bulkScanMode ? 'Bulk Scan Mode: ON' : 'Bulk Scan Mode: OFF'}
                color={bulkScanMode ? 'primary' : 'default'}
                onClick={() => setBulkScanMode(!bulkScanMode)}
                sx={{ cursor: 'pointer' }}
              />
            </Stack>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, alignItems: 'center' }}>
              <TextField
                fullWidth
                label="Asset Code"
                value={assetCodeInput}
                onChange={(e) => setAssetCodeInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && assetCodeInput.trim()) {
                    handleAddAssetByCode(assetCodeInput);
                  }
                }}
                placeholder="Type or scan QR code"
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => assetCodeInput.trim() && handleAddAssetByCode(assetCodeInput)}
                      disabled={!assetCodeInput.trim()}
                    >
                      <AddIcon />
                    </IconButton>
                  ),
                }}
              />

              <Autocomplete
                fullWidth
                options={availableAssets}
                getOptionLabel={(option) => `${option.assetCode} - ${option.assetName}`}
                value={selectedAsset}
                onChange={(_, newValue) => setSelectedAsset(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Search Assets" placeholder="Select an asset" />
                )}
              />

              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddAssetFromSearch}
                  disabled={!selectedAsset}
                  fullWidth
                >
                  Add to Rollout
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<QrCodeScannerIcon />}
                  onClick={() => setQrScannerOpen(true)}
                >
                  Scan
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Items List Section */}
      <Card sx={scannerCardSx}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Items ({localItems.length})
            </Typography>

            <ToggleButtonGroup
              value={groupBy}
              exclusive
              onChange={(_, value) => value && setGroupBy(value)}
              size="small"
            >
              <ToggleButton value="none">
                <ViewModuleIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="user">
                <PersonIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="location">
                <LocationOnIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="type">
                <CategoryIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {localItems.length === 0 ? (
            <Alert severity="info" sx={{ border: '1px solid', borderColor: 'info.main' }}>
              No items added yet. Use the section above to add assets to this rollout.
            </Alert>
          ) : (
            <Box>
              {getGroupedItems().map(group => (
                <Box key={group.label} mb={3}>
                  {groupBy !== 'none' && (
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      {group.label} ({group.items.length})
                    </Typography>
                  )}

                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Asset Code</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Target User</TableCell>
                          <TableCell>Target Location</TableCell>
                          <TableCell>Monitor Setup</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {group.items.map(item => (
                          <TableRow key={item.tempId}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                {item.asset.assetCode}
                              </Typography>
                            </TableCell>
                            <TableCell>{item.asset.assetName || item.asset.alias}</TableCell>
                            <TableCell>
                              <Chip label={item.asset.assetType?.name || 'Unknown'} size="small" />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                fullWidth
                                value={item.targetUser || ''}
                                onChange={(e) => handleUpdateItemField(item.tempId, 'targetUser', e.target.value)}
                                placeholder="Enter user name"
                                disabled={isReadOnly}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                fullWidth
                                value={item.targetLocation || ''}
                                onChange={(e) => handleUpdateItemField(item.tempId, 'targetLocation', e.target.value)}
                                placeholder="Enter location"
                                disabled={isReadOnly}
                              />
                            </TableCell>
                            <TableCell>
                              {item.asset.assetType?.name === 'Monitor' ? (
                                <Stack direction="row" spacing={1}>
                                  <FormControl size="small" sx={{ minWidth: 100 }}>
                                    <Select
                                      value={item.monitorPosition || ''}
                                      onChange={(e) =>
                                        handleUpdateItemField(
                                          item.tempId,
                                          'monitorPosition',
                                          e.target.value as MonitorPosition
                                        )
                                      }
                                      displayEmpty
                                      disabled={isReadOnly}
                                    >
                                      <MenuItem value="">Position</MenuItem>
                                      <MenuItem value="Left">Left</MenuItem>
                                      <MenuItem value="Center">Center</MenuItem>
                                      <MenuItem value="Right">Right</MenuItem>
                                      <MenuItem value="Primary">Primary</MenuItem>
                                      <MenuItem value="Secondary">Secondary</MenuItem>
                                    </Select>
                                  </FormControl>
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={item.monitorDisplayNumber || ''}
                                    onChange={(e) =>
                                      handleUpdateItemField(
                                        item.tempId,
                                        'monitorDisplayNumber',
                                        parseInt(e.target.value) || undefined
                                      )
                                    }
                                    placeholder="#"
                                    sx={{ width: 60 }}
                                    disabled={isReadOnly}
                                  />
                                </Stack>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  N/A
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {!isReadOnly && (
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveItem(item.tempId)}
                                >
                                  <RemoveIcon />
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card sx={scannerCardSx}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} justifyContent="space-between" flexWrap="wrap">
            <Stack direction="row" spacing={2}>
              {!isReadOnly && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveDraft}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    Save Draft
                  </Button>

                  {canMarkReady && (
                    <Button
                      variant="contained"
                      color="info"
                      startIcon={<CheckCircleIcon />}
                      onClick={handleMarkReady}
                      disabled={updateStatusMutation.isPending || localItems.length === 0}
                    >
                      Mark as Ready
                    </Button>
                  )}
                </>
              )}

              {canStartRollout && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PlayArrowIcon />}
                  onClick={handleStartRollout}
                  disabled={updateStatusMutation.isPending}
                >
                  Start Rollout
                </Button>
              )}
            </Stack>

            <Stack direction="row" spacing={2}>
              {isEditMode && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    onClick={handleDownloadQrCodes}
                  >
                    Print QR Labels
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    onClick={handleDownloadChecklist}
                  >
                    Print Checklist
                  </Button>

                  {!isReadOnly && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleDeleteSession}
                      disabled={deleteMutation.isPending}
                    >
                      Delete Session
                    </Button>
                  )}
                </>
              )}
            </Stack>
          </Stack>

          {hasUnsavedChanges && (
            <Alert severity="warning" sx={{ mt: 2, border: '1px solid', borderColor: 'warning.main' }}>
              You have unsaved changes. Don't forget to save your work!
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Rollout Session?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this rollout session? This action cannot be undone.
            All items and associated data will be permanently removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar - positioned above bottom navigation */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 80, sm: 24 } }}
      >
        <Alert
          severity="success"
          onClose={() => setSuccessMessage('')}
          sx={{ border: '1px solid', borderColor: 'success.main', fontWeight: 600 }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Error Snackbar - positioned above bottom navigation */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 80, sm: 24 } }}
      >
        <Alert
          severity="error"
          onClose={() => setErrorMessage('')}
          sx={{ border: '1px solid', borderColor: 'error.main', fontWeight: 600, maxWidth: 400 }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

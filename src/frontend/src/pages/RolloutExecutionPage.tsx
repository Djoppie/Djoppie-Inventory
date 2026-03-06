import { useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  IconButton,
  Button,
  Card,
  CardContent,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Snackbar,
  CircularProgress,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Fade,
  Stack,
  Badge,
  Skeleton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ErrorIcon from '@mui/icons-material/Error';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CelebrationIcon from '@mui/icons-material/Celebration';
import MonitorIcon from '@mui/icons-material/Monitor';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DevicesIcon from '@mui/icons-material/Devices';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import InventoryIcon from '@mui/icons-material/Inventory';
import BuildIcon from '@mui/icons-material/Build';
import CancelIcon from '@mui/icons-material/Cancel';
import QRScanner from '../components/scanner/QRScanner';
import { rolloutApi } from '../api/rollout.api';
import { getAssetByCode } from '../api/assets.api';
import { RolloutItemStatus, RolloutSessionStatus, getItemStatusLabel, getItemStatusColor } from '../types/rollout.types';
import { Asset, AssetStatus } from '../types/asset.types';
import { logger } from '../utils/logger';

type ScanMode = 'swap' | 'deploy' | 'collect';
type OldAssetStatus = 'Stock' | 'Herstelling' | 'Defect' | 'UitDienst';

export default function RolloutExecutionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State management
  const [scanMode, setScanMode] = useState<ScanMode>('swap');
  const [scannedOldAsset, setScannedOldAsset] = useState<Asset | null>(null);
  const [scannedNewAsset, setScannedNewAsset] = useState<Asset | null>(null);
  const [showItemList, setShowItemList] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Swap dialog state
  const [showSwapDialog, setShowSwapDialog] = useState(false);
  const [oldAssetStatus, setOldAssetStatus] = useState<OldAssetStatus>('Stock');
  const [swapNotes, setSwapNotes] = useState('');

  // Scanner state
  const [isScanning, setIsScanning] = useState(true);
  const isProcessingRef = useRef(false);

  const sessionId = Number(id);

  // Queries
  const { data: session, isLoading: sessionLoading, refetch: refetchSession } = useQuery({
    queryKey: ['rolloutSession', sessionId],
    queryFn: () => rolloutApi.getSession(sessionId),
    enabled: !!sessionId,
    refetchInterval: 5000 // Real-time updates every 5 seconds
  });

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['rolloutProgress', sessionId],
    queryFn: () => rolloutApi.getProgress(sessionId),
    enabled: !!sessionId,
    refetchInterval: 5000
  });

  // Mutations
  const completeItemMutation = useMutation({
    mutationFn: ({ itemId, notes }: { itemId: number; notes?: string }) =>
      rolloutApi.completeItem(sessionId, itemId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rolloutSession', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['rolloutProgress', sessionId] });
      setSuccessMessage('Item marked as complete');
      playSuccessSound();
    },
    onError: (error) => {
      logger.error('[RolloutExecution] Error completing item:', error);
      setErrorMessage('Failed to complete item');
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, status, notes }: { itemId: number; status: RolloutItemStatus; notes?: string }) =>
      rolloutApi.updateItem(sessionId, itemId, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rolloutSession', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['rolloutProgress', sessionId] });
    },
    onError: (error) => {
      logger.error('[RolloutExecution] Error updating item:', error);
      setErrorMessage('Failed to update item');
    }
  });

  const createSwapMutation = useMutation({
    mutationFn: (data: { oldAssetId?: number; newAssetId: number; targetUser?: string; targetLocation?: string }) =>
      rolloutApi.createSwap(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rolloutSession', sessionId] });
      setSuccessMessage('Swap created successfully');
    },
    onError: (error) => {
      logger.error('[RolloutExecution] Error creating swap:', error);
      setErrorMessage('Failed to create swap');
    }
  });

  const executeSwapMutation = useMutation({
    mutationFn: ({ swapId, data }: { swapId: number; data: { oldAssetNewStatus: OldAssetStatus; notes?: string } }) =>
      rolloutApi.executeSwap(sessionId, swapId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rolloutSession', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['rolloutProgress', sessionId] });
      setSuccessMessage('Swap executed successfully');
      playSuccessSound();
      // Reset swap state
      setScannedOldAsset(null);
      setScannedNewAsset(null);
      setShowSwapDialog(false);
      setSwapNotes('');
      setOldAssetStatus('Stock');
    },
    onError: (error) => {
      logger.error('[RolloutExecution] Error executing swap:', error);
      setErrorMessage('Failed to execute swap');
    }
  });

  const startSessionMutation = useMutation({
    mutationFn: () => rolloutApi.updateSessionStatus(sessionId, RolloutSessionStatus.InProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rolloutSession', sessionId] });
      setSuccessMessage('Rollout session started');
    },
    onError: (error) => {
      logger.error('[RolloutExecution] Error starting session:', error);
      setErrorMessage('Failed to start session');
    }
  });

  // Network status monitoring
  useState(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });

  // Sound feedback (placeholders)
  const playSuccessSound = () => {
    // Optional: Play success sound
    logger.debug('[RolloutExecution] Success sound triggered');
  };

  const playErrorSound = () => {
    // Optional: Play error sound
    logger.debug('[RolloutExecution] Error sound triggered');
  };

  // QR Scan Handler
  const handleQrScan = useCallback(async (assetCode: string) => {
    if (isProcessingRef.current) {
      logger.warn('[RolloutExecution] Already processing a scan, ignoring:', assetCode);
      return;
    }

    try {
      isProcessingRef.current = true;
      logger.info('[RolloutExecution] Processing scanned asset:', assetCode);

      // Fetch asset details
      const asset = await getAssetByCode(assetCode);

      if (!asset) {
        setErrorMessage(`Asset ${assetCode} not found`);
        playErrorSound();
        return;
      }

      // Handle based on scan mode
      if (scanMode === 'swap') {
        handleSwapModeScan(asset);
      } else if (scanMode === 'deploy') {
        handleDeployModeScan(asset);
      } else if (scanMode === 'collect') {
        handleCollectModeScan(asset);
      }
    } catch (error) {
      logger.error('[RolloutExecution] Error processing scan:', error);
      setErrorMessage('Failed to fetch asset details');
      playErrorSound();
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1000);
    }
  }, [scanMode, scannedOldAsset, scannedNewAsset, session]);

  // Swap mode scan handling
  const handleSwapModeScan = (asset: Asset) => {
    if (!scannedOldAsset) {
      // First scan: old device
      if (asset.status !== AssetStatus.InGebruik) {
        setErrorMessage('Old asset must be "In gebruik" status');
        playErrorSound();
        return;
      }
      setScannedOldAsset(asset);
      setSuccessMessage('Old device scanned. Now scan the NEW device.');
      playSuccessSound();
    } else if (!scannedNewAsset) {
      // Second scan: new device
      if (asset.status !== AssetStatus.Nieuw && asset.status !== AssetStatus.Stock) {
        setErrorMessage('New asset must be "Nieuw" or "Stock" status');
        playErrorSound();
        return;
      }
      if (asset.id === scannedOldAsset.id) {
        setErrorMessage('Cannot swap asset with itself');
        playErrorSound();
        return;
      }
      setScannedNewAsset(asset);
      setShowSwapDialog(true);
      playSuccessSound();
    }
  };

  // Deploy mode scan handling
  const handleDeployModeScan = (asset: Asset) => {
    // Find matching item in session
    const matchingItem = session?.items.find(
      item => item.assetId === asset.id && item.status === RolloutItemStatus.Pending
    );

    if (!matchingItem) {
      setErrorMessage('This asset is not in the current rollout or already deployed');
      playErrorSound();
      return;
    }

    // Mark as complete
    completeItemMutation.mutate({ itemId: matchingItem.id });
  };

  // Collect mode scan handling
  const handleCollectModeScan = (asset: Asset) => {
    if (asset.status !== AssetStatus.InGebruik) {
      setErrorMessage('Can only collect assets that are "In gebruik"');
      playErrorSound();
      return;
    }

    // Show dialog to select new status
    setScannedOldAsset(asset);
    setShowSwapDialog(true);
  };

  // Execute swap operation
  const handleSwapExecute = async () => {
    if (!scannedOldAsset || !scannedNewAsset) return;

    try {
      // Create swap record
      const swapData = {
        oldAssetId: scannedOldAsset.id,
        newAssetId: scannedNewAsset.id,
        targetUser: scannedOldAsset.owner,
        targetLocation: scannedOldAsset.installationLocation
      };

      const swap = await createSwapMutation.mutateAsync(swapData);

      // Execute swap
      await executeSwapMutation.mutateAsync({
        swapId: swap.id,
        data: {
          oldAssetNewStatus: oldAssetStatus,
          notes: swapNotes || undefined
        }
      });
    } catch (error) {
      logger.error('[RolloutExecution] Swap execution failed:', error);
    }
  };

  // Skip current item
  const handleSkipItem = (itemId: number) => {
    updateItemMutation.mutate({ itemId, status: RolloutItemStatus.Skipped });
  };

  // Mark item as failed
  const handleFailItem = (itemId: number) => {
    updateItemMutation.mutate({ itemId, status: RolloutItemStatus.Failed });
  };

  // Start session
  const handleStartSession = () => {
    startSessionMutation.mutate();
  };

  // Get current pending item
  const currentItem = session?.items.find(i => i.status === RolloutItemStatus.Pending);

  // Loading state
  if (sessionLoading || progressLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  if (!session || !progress) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Session not found
      </Alert>
    );
  }

  // Completion state
  const isCompleted = progress.completionPercentage === 100;

  return (
    <Box sx={{ pb: 8 }}>
      {/* Sticky Header */}
      <Paper
        elevation={3}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          borderRadius: 0,
          py: 1.5,
          px: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <IconButton onClick={() => navigate('/rollouts')} edge="start">
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {session.sessionName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {session.description}
            </Typography>
          </Box>
          <Chip
            label={`${progress.completedItems}/${progress.totalItems}`}
            color="primary"
            size="small"
          />
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress.completionPercentage}
          sx={{ height: 8, borderRadius: 1 }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {progress.completionPercentage.toFixed(0)}% complete
        </Typography>
      </Paper>

      {/* Offline Warning */}
      {isOffline && (
        <Alert severity="warning" sx={{ m: 2 }}>
          You are offline. Changes may not be saved until connection is restored.
        </Alert>
      )}

      {/* Session Not Started */}
      {session.status === RolloutSessionStatus.Ready && (
        <Card sx={{ m: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <PlayArrowIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Ready to Start
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              This rollout session is ready to begin. Click the button below to start execution.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrowIcon />}
              onClick={handleStartSession}
              disabled={startSessionMutation.isPending}
            >
              Start Rollout Session
            </Button>
          </CardContent>
        </Card>
      )}

      {/* QR Scanner Section */}
      {session.status === RolloutSessionStatus.InProgress && !isCompleted && (
        <Card sx={{ m: 2 }}>
          <CardContent>
            {/* Scan Mode Toggle */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <ToggleButtonGroup
                value={scanMode}
                exclusive
                onChange={(_, value) => value && setScanMode(value)}
                size="large"
                fullWidth
                sx={{ maxWidth: 600 }}
              >
                <ToggleButton value="swap">
                  <SwapHorizIcon sx={{ mr: 1 }} />
                  Swap Mode
                </ToggleButton>
                <ToggleButton value="deploy">
                  <CloudDownloadIcon sx={{ mr: 1 }} />
                  Deploy
                </ToggleButton>
                <ToggleButton value="collect">
                  <InventoryIcon sx={{ mr: 1 }} />
                  Collect
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Mode Instructions */}
            <Alert severity="info" sx={{ mb: 2 }}>
              {scanMode === 'swap' && 'Scan the OLD device first, then scan the NEW device to replace it.'}
              {scanMode === 'deploy' && 'Scan NEW devices to mark them as deployed.'}
              {scanMode === 'collect' && 'Scan OLD devices to collect and update their status.'}
            </Alert>

            {/* Scanner */}
            <Box sx={{ minHeight: isScanning ? 400 : 100 }}>
              <QRScanner
                onScanSuccess={handleQrScan}
                onScanError={(error) => {
                  setErrorMessage(error);
                  playErrorSound();
                }}
              />
            </Box>

            {/* Scanned Asset Preview */}
            {scanMode === 'swap' && (scannedOldAsset || scannedNewAsset) && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Scanned Assets:
                </Typography>
                <Stack spacing={1}>
                  {scannedOldAsset && (
                    <Card variant="outlined">
                      <CardContent sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label="OLD" color="error" size="small" />
                          <Typography variant="body2" sx={{ flexGrow: 1 }}>
                            {scannedOldAsset.assetCode} - {scannedOldAsset.assetName}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                  {scannedNewAsset && (
                    <Card variant="outlined">
                      <CardContent sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label="NEW" color="success" size="small" />
                          <Typography variant="body2" sx={{ flexGrow: 1 }}>
                            {scannedNewAsset.assetCode} - {scannedNewAsset.assetName}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                </Stack>
                {scannedOldAsset && !scannedNewAsset && (
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1 }}
                    onClick={() => {
                      setScannedOldAsset(null);
                      setSuccessMessage('Cleared old device. Scan again.');
                    }}
                  >
                    Clear & Restart
                  </Button>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current Task Card */}
      {session.status === RolloutSessionStatus.InProgress && currentItem && !isCompleted && (
        <Card sx={{ m: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DevicesIcon color="primary" />
              Current Task
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={2}>
              {/* Asset Info */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Asset to Deploy
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {currentItem.assetCode} - {currentItem.assetName}
                </Typography>
                {currentItem.assetType && (
                  <Chip label={currentItem.assetType} size="small" sx={{ mt: 0.5 }} />
                )}
              </Box>

              {/* Target User */}
              {currentItem.targetUser && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon color="action" fontSize="small" />
                  <Box>
                    <Typography variant="body2">{currentItem.targetUser}</Typography>
                    {currentItem.targetUserEmail && (
                      <Typography variant="caption" color="text.secondary">
                        {currentItem.targetUserEmail}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              {/* Target Location */}
              {currentItem.targetLocation && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOnIcon color="action" fontSize="small" />
                  <Typography variant="body2">{currentItem.targetLocation}</Typography>
                </Box>
              )}

              {/* Monitor Position */}
              {currentItem.monitorPosition && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MonitorIcon color="action" fontSize="small" />
                  <Typography variant="body2">
                    Monitor: {currentItem.monitorPosition}
                    {currentItem.monitorDisplayNumber && ` (Display ${currentItem.monitorDisplayNumber})`}
                  </Typography>
                </Box>
              )}

              {/* Actions */}
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => completeItemMutation.mutate({ itemId: currentItem.id })}
                  disabled={completeItemMutation.isPending}
                  fullWidth
                >
                  Mark Complete
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SkipNextIcon />}
                  onClick={() => handleSkipItem(currentItem.id)}
                  disabled={updateItemMutation.isPending}
                >
                  Skip
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<ErrorIcon />}
                  onClick={() => handleFailItem(currentItem.id)}
                  disabled={updateItemMutation.isPending}
                >
                  Fail
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Completion State */}
      {isCompleted && (
        <Fade in>
          <Card sx={{ m: 2 }}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <CelebrationIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                All Complete!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                All items in this rollout session have been processed.
              </Typography>
              <Stack spacing={1} sx={{ maxWidth: 400, mx: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Completed:</Typography>
                  <Chip label={progress.completedItems} color="success" size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Skipped:</Typography>
                  <Chip label={progress.skippedItems} color="warning" size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Failed:</Typography>
                  <Chip label={progress.failedItems} color="error" size="small" />
                </Box>
              </Stack>
              <Button
                variant="contained"
                sx={{ mt: 3 }}
                onClick={() => navigate('/rollouts')}
              >
                Back to Rollouts
              </Button>
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* Progress Section */}
      <Card sx={{ m: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={progress.completionPercentage}
                size={120}
                thickness={4}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}
              >
                <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                  {progress.completionPercentage.toFixed(0)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Complete
                </Typography>
              </Box>
            </Box>
          </Box>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="success.main">
                {progress.completedItems}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Completed
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                {progress.pendingItems}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pending
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="error.main">
                {progress.failedItems}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Failed
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="warning.main">
                {progress.skippedItems}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Skipped
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Item List (Collapsible) */}
      <Card sx={{ m: 2 }}>
        <CardContent>
          <Box
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => setShowItemList(!showItemList)}
          >
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              All Items ({session.items.length})
            </Typography>
            <IconButton size="small">
              {showItemList ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={showItemList}>
            <Divider sx={{ my: 2 }} />
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {session.items.map((item, index) => (
                <ListItem
                  key={item.id}
                  divider={index < session.items.length - 1}
                  sx={{
                    bgcolor: item.status === RolloutItemStatus.Pending ? 'action.hover' : 'transparent'
                  }}
                >
                  <ListItemIcon>
                    {item.status === RolloutItemStatus.Completed && (
                      <CheckCircleIcon color="success" />
                    )}
                    {item.status === RolloutItemStatus.Pending && <PendingIcon color="action" />}
                    {item.status === RolloutItemStatus.Failed && <ErrorIcon color="error" />}
                    {item.status === RolloutItemStatus.Skipped && <SkipNextIcon color="warning" />}
                    {item.status === RolloutItemStatus.InProgress && (
                      <CircularProgress size={24} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={`${item.assetCode} - ${item.assetName}`}
                    secondary={
                      <>
                        {item.targetUser && `User: ${item.targetUser}`}
                        {item.targetUser && item.targetLocation && ' | '}
                        {item.targetLocation && `Location: ${item.targetLocation}`}
                      </>
                    }
                  />
                  <Chip
                    label={getItemStatusLabel(item.status)}
                    color={getItemStatusColor(item.status)}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>
        </CardContent>
      </Card>

      {/* Swap Dialog */}
      <Dialog
        open={showSwapDialog}
        onClose={() => setShowSwapDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {scanMode === 'swap' ? 'Complete Asset Swap' : 'Collect Asset'}
        </DialogTitle>
        <DialogContent>
          {scanMode === 'swap' && scannedOldAsset && scannedNewAsset && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Swap Summary:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip label="OLD" color="error" size="small" />
                <Typography variant="body2">
                  {scannedOldAsset.assetCode} - {scannedOldAsset.assetName}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label="NEW" color="success" size="small" />
                <Typography variant="body2">
                  {scannedNewAsset.assetCode} - {scannedNewAsset.assetName}
                </Typography>
              </Box>
            </Box>
          )}

          {scanMode === 'collect' && scannedOldAsset && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Collecting Asset:
              </Typography>
              <Typography variant="body2">
                {scannedOldAsset.assetCode} - {scannedOldAsset.assetName}
              </Typography>
            </Box>
          )}

          <Typography variant="subtitle2" gutterBottom>
            What is the status of the old device?
          </Typography>
          <RadioGroup
            value={oldAssetStatus}
            onChange={(e) => setOldAssetStatus(e.target.value as OldAssetStatus)}
          >
            <FormControlLabel
              value="Stock"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InventoryIcon fontSize="small" />
                  Stock (Working, ready to reuse)
                </Box>
              }
            />
            <FormControlLabel
              value="Herstelling"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BuildIcon fontSize="small" />
                  Herstelling (Needs repair)
                </Box>
              }
            />
            <FormControlLabel
              value="Defect"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ErrorIcon fontSize="small" />
                  Defect (Broken, cannot be repaired)
                </Box>
              }
            />
            <FormControlLabel
              value="UitDienst"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CancelIcon fontSize="small" />
                  Uit dienst (Decommissioned)
                </Box>
              }
            />
          </RadioGroup>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes (Optional)"
            value={swapNotes}
            onChange={(e) => setSwapNotes(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Add any notes about this swap..."
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowSwapDialog(false);
              setScannedOldAsset(null);
              setScannedNewAsset(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSwapExecute}
            disabled={executeSwapMutation.isPending || createSwapMutation.isPending}
            startIcon={executeSwapMutation.isPending ? <CircularProgress size={16} /> : <CheckCircleIcon />}
          >
            {scanMode === 'swap' ? 'Execute Swap' : 'Collect Asset'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar - positioned above bottom navigation */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 80, sm: 24 } }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage('')} sx={{ fontWeight: 600 }}>
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
        <Alert severity="error" onClose={() => setErrorMessage('')} sx={{ fontWeight: 600, maxWidth: 400 }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

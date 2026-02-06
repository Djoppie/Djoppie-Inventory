import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { useAsset, useDeleteAsset } from '../hooks/useAssets';
import Loading from '../components/common/Loading';
import StatusBadge from '../components/common/StatusBadge';

const AssetDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: asset, isLoading, error } = useAsset(Number(id));
  const deleteAsset = useDeleteAsset();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleEdit = () => {
    navigate(`/assets/${id}/edit`);
  };

  const handleDelete = async () => {
    try {
      await deleteAsset.mutateAsync(Number(id));
      navigate('/');
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  if (isLoading) return <Loading />;

  if (error || !asset) {
    return (
      <Box>
        <Alert severity="error">
          {error instanceof Error ? error.message : 'Failed to load asset'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 2 }}
        >
          Back to Dashboard
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {asset.assetName}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                {asset.assetCode}
              </Typography>
              <StatusBadge status={asset.status} />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEdit}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* Main Information */}
        <Box sx={{ flex: 1 }}>
          {/* Identification */}
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Asset Identification
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ flex: '1 1 200px' }}>
                  <Typography variant="caption" color="text.secondary">
                    Asset Code
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {asset.assetCode}
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 200px' }}>
                  <Typography variant="caption" color="text.secondary">
                    Category
                  </Typography>
                  <Typography variant="body1">{asset.category}</Typography>
                </Box>
                <Box sx={{ flex: '1 1 100%' }}>
                  <Typography variant="caption" color="text.secondary">
                    Asset Name
                  </Typography>
                  <Typography variant="body1">{asset.assetName}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Assignment Details */}
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Assignment Details
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ flex: '1 1 200px' }}>
                  <Typography variant="caption" color="text.secondary">
                    Owner
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {asset.owner}
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 200px' }}>
                  <Typography variant="caption" color="text.secondary">
                    Building
                  </Typography>
                  <Typography variant="body1">{asset.building}</Typography>
                </Box>
                <Box sx={{ flex: '1 1 200px' }}>
                  <Typography variant="caption" color="text.secondary">
                    Department
                  </Typography>
                  <Typography variant="body1">{asset.department}</Typography>
                </Box>
                {asset.officeLocation && (
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Typography variant="caption" color="text.secondary">
                      Office Location
                    </Typography>
                    <Typography variant="body1">{asset.officeLocation}</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Technical Specifications */}
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Technical Specifications
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ flex: '1 1 150px' }}>
                  <Typography variant="caption" color="text.secondary">
                    Brand
                  </Typography>
                  <Typography variant="body1">
                    {asset.brand || 'Not specified'}
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 150px' }}>
                  <Typography variant="caption" color="text.secondary">
                    Model
                  </Typography>
                  <Typography variant="body1">
                    {asset.model || 'Not specified'}
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 150px' }}>
                  <Typography variant="caption" color="text.secondary">
                    Serial Number
                  </Typography>
                  <Typography variant="body1">
                    {asset.serialNumber || 'Not specified'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Lifecycle Information */}
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Lifecycle Information
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ flex: '1 1 150px' }}>
                  <Typography variant="caption" color="text.secondary">
                    Purchase Date
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(asset.purchaseDate)}
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 150px' }}>
                  <Typography variant="caption" color="text.secondary">
                    Warranty Expiry
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(asset.warrantyExpiry)}
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 150px' }}>
                  <Typography variant="caption" color="text.secondary">
                    Installation Date
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(asset.installationDate)}
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(asset.createdAt)}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(asset.updatedAt)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* QR Code Section */}
        <Box sx={{ width: { xs: '100%', md: '350px' } }}>
          <Card elevation={2} sx={{ position: { md: 'sticky' }, top: 16 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary" gutterBottom>
                QR Code
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Scan to quickly access this asset
              </Typography>

              <Box
                id="qr-code-container"
                sx={{
                  p: 3,
                  bgcolor: '#FFFFFF',
                  borderRadius: 2,
                  display: 'inline-block',
                  boxShadow: (theme) =>
                    theme.palette.mode === 'dark'
                      ? '0 4px 12px rgba(255, 255, 255, 0.1), inset 0 0 20px rgba(255, 255, 255, 0.05)'
                      : '0 2px 8px rgba(0, 0, 0, 0.1)',
                  border: '3px solid',
                  borderColor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 119, 0, 0.3)'
                      : 'rgba(255, 119, 0, 0.2)',
                }}
              >
                <QRCodeSVG
                  id="asset-qr-code"
                  value={asset.assetCode}
                  size={200}
                  level="H"
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </Box>

              <Typography variant="caption" display="block" sx={{ mt: 2 }} color="text.secondary">
                Asset Code: {asset.assetCode}
              </Typography>

              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 3 }}
                onClick={() => {
                  const svg = document.querySelector('#asset-qr-code');
                  if (svg) {
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const blob = new Blob([svgData], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = `${asset.assetCode}-QR-Label.svg`;
                    link.href = url;
                    link.click();
                    URL.revokeObjectURL(url);
                  }
                }}
              >
                Print Label
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Asset</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{asset.assetName}</strong> ({asset.assetCode})?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              handleDelete();
            }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssetDetailPage;

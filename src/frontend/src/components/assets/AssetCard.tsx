import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip,
  Checkbox,
  keyframes,
} from '@mui/material';
import { Asset } from '../../types/asset.types';
import StatusBadge from '../common/StatusBadge';
import CodeIcon from '@mui/icons-material/Code';
import CategoryIcon from '@mui/icons-material/Category';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';

interface AssetCardProps {
  asset: Asset;
  selectable?: boolean;
  selected?: boolean;
  onSelectionChange?: (assetId: number, selected: boolean) => void;
}

// Pulse animation for hover effect
const glowPulse = keyframes`
  0%, 100% {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  }
  50% {
    box-shadow: 0 8px 32px rgba(255, 215, 0, 0.3), inset 0 0 24px rgba(255, 215, 0, 0.05);
  }
`;

const AssetCard = ({ asset, selectable = false, selected = false, onSelectionChange }: AssetCardProps) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange?.(asset.id, !selected);
  };

  return (
    <Card
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        height: '100%',
        position: 'relative',
        border: '2px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        background: (theme) =>
          selected
            ? theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(255, 119, 0, 0.08) 0%, transparent 50%)'
              : 'linear-gradient(135deg, rgba(255, 119, 0, 0.05) 0%, transparent 50%)'
            : theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.02) 0%, transparent 50%)'
              : 'none',
        '&:hover': {
          borderColor: 'primary.main',
          animation: `${glowPulse} 2s ease-in-out infinite`,
          '&::before': {
            opacity: 1,
          },
        },
        // Glow effect overlay
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.1), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(253, 185, 49, 0.1), transparent)',
          transition: 'left 0.5s ease, opacity 0.3s ease',
          opacity: 0,
          pointerEvents: 'none',
        },
        '&:hover::before': {
          left: '100%',
        },
      }}
    >
      <CardActionArea
        onClick={() => navigate(`/assets/${asset.id}`)}
        sx={{ height: '100%' }}
      >
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header with Checkbox, Title and Status */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
              {/* Selection Checkbox */}
              {selectable && (
                <Checkbox
                  checked={selected}
                  color="primary"
                  size="small"
                  onClick={handleCheckboxClick}
                  sx={{
                    p: 0.5,
                    ml: -0.5,
                    flexShrink: 0,
                  }}
                />
              )}
              <Typography
                variant="h6"
                component="div"
                sx={{
                  color: isHovered ? 'primary.main' : 'text.primary',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  transition: 'color 0.3s ease',
                  textShadow: isHovered
                    ? '0 0 8px rgba(255, 215, 0, 0.3)'
                    : 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {asset.assetName}
              </Typography>
            </Box>
            <StatusBadge status={asset.status} />
          </Box>

          {/* Asset Code */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <CodeIcon
              sx={{
                fontSize: '1rem',
                color: 'text.secondary',
              }}
            />
            <Typography variant="body2" color="text.secondary">
              <strong style={{ color: 'inherit' }}>Code:</strong>{' '}
              <Typography
                component="span"
                sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  fontFamily: 'monospace',
                }}
              >
                {asset.assetCode}
              </Typography>
            </Typography>
          </Box>

          {/* Category Chip */}
          <Box sx={{ mb: 2 }}>
            <Chip
              icon={<CategoryIcon />}
              label={asset.category}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: '0.8rem',
              }}
            />
          </Box>

          {/* Owner and Location Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 2,
              mt: 'auto',
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            {/* Owner */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <PersonIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Owner
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                }}
              >
                {asset.owner}
              </Typography>
            </Box>

            {/* Location */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <LocationOnIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Location
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                }}
              >
                {asset.building?.name || asset.legacyBuilding || '-'}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                }}
              >
                {asset.service?.name || asset.legacyDepartment || '-'}
              </Typography>
              {asset.officeLocation && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                  }}
                >
                  {asset.officeLocation}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Brand and Model */}
          {asset.brand && asset.model && (
            <Typography
              variant="caption"
              sx={{
                mt: 2,
                pt: 1.5,
                display: 'block',
                color: 'text.secondary',
                borderTop: '1px solid',
                borderColor: 'divider',
                fontWeight: 500,
              }}
            >
              {asset.brand} {asset.model}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default AssetCard;

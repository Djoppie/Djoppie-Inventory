import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  alpha,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ScheduleIcon from '@mui/icons-material/Schedule';

import { getNeumorph, getNeumorphInset, getNeumorphColors } from '../../../utils/neumorphicStyles';
import { getPriorityColor, getPriorityLabel } from '../../../hooks/reports';
import type { UnscheduledAsset } from '../../../types/report.types';

const ERROR_COLOR = '#F44336';

interface UnscheduledAssetsPanelProps {
  assets: UnscheduledAsset[];
  isLoading: boolean;
  isDark: boolean;
  neumorphColors: ReturnType<typeof getNeumorphColors>;
}

const UnscheduledAssetsPanel: React.FC<UnscheduledAssetsPanelProps> = ({
  assets,
  isLoading,
  isDark,
  neumorphColors,
}) => (
  <Paper
    elevation={0}
    sx={{
      mb: 1.5,
      p: 1.5,
      borderRadius: 2,
      bgcolor: neumorphColors.bgSurface,
      boxShadow: getNeumorph(isDark, 'soft'),
      borderLeft: `4px solid ${ERROR_COLOR}`,
    }}
  >
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: 2,
          bgcolor: alpha(ERROR_COLOR, isDark ? 0.15 : 0.1),
          boxShadow: getNeumorphInset(isDark),
        }}
      >
        <ScheduleIcon sx={{ fontSize: 22, color: ERROR_COLOR }} />
      </Box>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          Ongeplande Assets ({assets.length})
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Apparaten die nog niet in een rollout sessie zijn gepland
        </Typography>
      </Box>
    </Stack>

    {isLoading ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={32} sx={{ color: ERROR_COLOR }} />
      </Box>
    ) : assets.length === 0 ? (
      <Alert severity="success" icon={<CheckIcon />}>
        Alle apparaten zijn gepland in een rollout sessie.
      </Alert>
    ) : (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Asset Code</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Serienummer</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Gebruiker</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Dienst</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Leeftijd</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Prioriteit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assets.slice(0, 10).map((asset) => (
              <TableRow key={asset.assetId}>
                <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{asset.assetCode}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>{asset.assetTypeName}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{asset.serialNumber || '-'}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>{asset.primaryUserName || '-'}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>{asset.serviceName || '-'}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>{asset.ageInDays} dagen</TableCell>
                <TableCell>
                  <Chip
                    label={getPriorityLabel(asset.priority)}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      bgcolor: alpha(getPriorityColor(asset.priority), isDark ? 0.2 : 0.12),
                      color: getPriorityColor(asset.priority),
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )}
  </Paper>
);

export default UnscheduledAssetsPanel;

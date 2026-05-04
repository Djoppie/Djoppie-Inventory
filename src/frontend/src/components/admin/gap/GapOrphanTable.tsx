import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
  Tooltip,
  IconButton,
  alpha,
  useTheme,
} from '@mui/material';
import LaptopIcon from '@mui/icons-material/Laptop';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import { OrphanDeviceOwner } from '../../../types/physicalWorkplace.types';
import CreateWorkplaceForOrphanDialog from './CreateWorkplaceForOrphanDialog';

const TEAL = '#009688';
const TABLE_MAX_HEIGHT = 420;

interface GapOrphanTableProps {
  orphans: OrphanDeviceOwner[];
  defaultBuildingId: number | null;
  onDefaultBuildingChange: (id: number) => void;
}

const GapOrphanTable = ({
  orphans,
  defaultBuildingId,
  onDefaultBuildingChange,
}: GapOrphanTableProps) => {
  const theme = useTheme();
  const [dialogOrphan, setDialogOrphan] = useState<OrphanDeviceOwner | null>(null);

  if (orphans.length === 0) return null;

  return (
    <>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
        Eigenaren zonder werkplek ({orphans.length})
      </Typography>

      <TableContainer
          sx={{
            maxHeight: TABLE_MAX_HEIGHT,
            overflowY: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            // Without Paper elevation, set a background so sticky headers render correctly
            bgcolor: theme.palette.background.paper,
          }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow
                sx={{
                  '& th': {
                    bgcolor:
                      theme.palette.mode === 'dark'
                        ? alpha(TEAL, 0.18)
                        : alpha(TEAL, 0.07),
                    borderBottom: `2px solid ${TEAL}`,
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    py: 1.25,
                    color: theme.palette.text.secondary,
                    whiteSpace: 'nowrap',
                  },
                }}
              >
                <TableCell>Eigenaar</TableCell>
                <TableCell>Dienst</TableCell>
                <TableCell>Toestel</TableCell>
                <TableCell>Merk / Model</TableCell>
                <TableCell align="right" sx={{ pr: 1.5 }}>
                  Actie
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orphans.map((orphan, index) => {
                const isDesktop = orphan.deviceType === 'desktop';
                return (
                  <TableRow
                    key={orphan.deviceAssetId}
                    sx={{
                      bgcolor:
                        index % 2 === 1
                          ? theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.025)'
                            : 'rgba(0,0,0,0.018)'
                          : 'transparent',
                      '&:hover': {
                        bgcolor:
                          theme.palette.mode === 'dark'
                            ? alpha(TEAL, 0.09)
                            : alpha(TEAL, 0.04),
                      },
                      transition: 'background-color 0.12s ease',
                    }}
                  >
                    {/* Owner */}
                    <TableCell sx={{ py: 0.875 }}>
                      <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.82rem' }}>
                        {orphan.ownerName ?? orphan.ownerEmail}
                      </Typography>
                      {orphan.ownerName && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ fontSize: '0.7rem' }}
                        >
                          {orphan.ownerEmail}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Service */}
                    <TableCell sx={{ py: 0.875 }}>
                      <Typography
                        variant="body2"
                        color={orphan.serviceName ? 'text.primary' : 'text.disabled'}
                        sx={{ fontSize: '0.82rem' }}
                      >
                        {orphan.serviceName ?? '—'}
                      </Typography>
                    </TableCell>

                    {/* Device code */}
                    <TableCell sx={{ py: 0.875 }}>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        {isDesktop ? (
                          <DesktopWindowsIcon
                            fontSize="small"
                            sx={{ color: TEAL, fontSize: '0.95rem' }}
                          />
                        ) : (
                          <LaptopIcon
                            fontSize="small"
                            sx={{ color: TEAL, fontSize: '0.95rem' }}
                          />
                        )}
                        <Typography
                          fontFamily="monospace"
                          sx={{ fontSize: '0.77rem', color: TEAL, fontWeight: 600 }}
                        >
                          {orphan.deviceAssetCode}
                        </Typography>
                      </Stack>
                    </TableCell>

                    {/* Brand / Model */}
                    <TableCell sx={{ py: 0.875 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: '0.8rem' }}
                      >
                        {[orphan.deviceBrand, orphan.deviceModel].filter(Boolean).join(' ') || '—'}
                      </Typography>
                    </TableCell>

                    {/* Action */}
                    <TableCell align="right" sx={{ py: 0.875, pr: 1.25 }}>
                      <Tooltip
                        title={`Werkplek voor ${orphan.ownerName ?? orphan.ownerEmail} aanmaken`}
                        placement="left"
                        arrow
                      >
                        <IconButton
                          size="small"
                          onClick={() => setDialogOrphan(orphan)}
                          sx={{
                            color: TEAL,
                            border: '1px solid',
                            borderColor: alpha(TEAL, 0.3),
                            borderRadius: 1.5,
                            width: 30,
                            height: 30,
                            '&:hover': {
                              bgcolor: alpha(TEAL, 0.1),
                              borderColor: TEAL,
                            },
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <AddBusinessIcon sx={{ fontSize: '0.95rem' }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
      </TableContainer>

      <CreateWorkplaceForOrphanDialog
        orphan={dialogOrphan}
        open={dialogOrphan !== null}
        defaultBuildingId={defaultBuildingId}
        onDefaultBuildingChange={onDefaultBuildingChange}
        onClose={() => setDialogOrphan(null)}
        onSuccess={() => setDialogOrphan(null)}
      />
    </>
  );
};

export default GapOrphanTable;

import {
  Box,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAssetRequests } from '../../../hooks/useAssetRequests';
import { RequestStatusBadge } from './RequestStatusBadge';
import { EmployeeLinkChip } from './EmployeeLinkChip';
import { RequestLinesPreview } from './RequestLinesPreview';
import type { AssetRequestType } from '../../../types/assetRequest.types';
import Loading from '../../common/Loading';
import ApiErrorDisplay from '../../common/ApiErrorDisplay';

interface Props {
  type: AssetRequestType;
  newPath: string;
  detailPath: (id: number) => string;
  titleKey: string;
  subtitleKey: string;
  newButtonKey: string;
}

export function RequestsList({ type, newPath, detailPath, titleKey, subtitleKey, newButtonKey }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: requests, isLoading, error, refetch } = useAssetRequests({ type });

  if (isLoading) return <Loading />;
  if (error) return <ApiErrorDisplay onRetry={() => refetch()} />;

  return (
    <Box sx={{ p: 2.5 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {t(titleKey)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t(subtitleKey)}
          </Typography>
        </Box>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => navigate(newPath)}>
          {t(newButtonKey)}
        </Button>
      </Stack>

      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('requests.form.requestedFor')}</TableCell>
                <TableCell>{t('requests.form.linkedEmployee')}</TableCell>
                <TableCell>{t('requests.form.requestedDate')}</TableCell>
                <TableCell>{t('requests.lines.title')}</TableCell>
                <TableCell>{t('requests.lines.status')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(requests ?? []).map((r) => (
                <TableRow
                  key={r.id}
                  hover
                  onClick={() => navigate(detailPath(r.id))}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{r.requestedFor}</TableCell>
                  <TableCell>
                    <EmployeeLinkChip
                      employeeDisplayName={r.employeeDisplayName}
                      employeeUpn={r.employeeUpn}
                      dense
                    />
                  </TableCell>
                  <TableCell>{new Date(r.requestedDate).toLocaleDateString()}</TableCell>
                  <TableCell sx={{ minWidth: 280, py: 1.5 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      <Box sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600 }}>
                        {r.completedLineCount} / {r.lineCount} voltooid
                      </Box>
                      <RequestLinesPreview lines={r.lines} collapsed />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <RequestStatusBadge status={r.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

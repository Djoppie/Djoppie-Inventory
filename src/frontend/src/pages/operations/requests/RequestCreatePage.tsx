import { useState } from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RequestForm, type RequestFormState } from '../../../components/operations/requests/RequestForm';
import { RequestLinesEditor } from '../../../components/operations/requests/RequestLinesEditor';
import type { EditableLine } from '../../../components/operations/requests/AssetLineRow';
import { useCreateAssetRequest } from '../../../hooks/useAssetRequests';
import { buildRoute } from '../../../constants/routes';
import type { AssetRequestType, CreateAssetRequestLineDto } from '../../../types/assetRequest.types';

export default function RequestCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const requestType: AssetRequestType = location.pathname.includes('/offboarding/')
    ? 'offboarding'
    : 'onboarding';

  const [form, setForm] = useState<RequestFormState>({
    requestedFor: '',
    requestedDate: new Date().toISOString(),
  });
  const [lines, setLines] = useState<EditableLine[]>([]);
  const create = useCreateAssetRequest();

  const submit = async () => {
    const linesDto: CreateAssetRequestLineDto[] = lines.map((l) => ({
      assetTypeId: l.assetTypeId,
      sourceType: 'sourceType' in l ? (l.sourceType ?? 'ToBeAssigned') : 'ToBeAssigned',
      assetId: l.assetId,
      assetTemplateId: l.assetTemplateId,
      returnAction: l.returnAction,
      notes: l.notes,
    }));

    const created = await create.mutateAsync({
      requestType,
      requestedFor: form.requestedFor,
      employeeId: form.employeeId,
      requestedDate: form.requestedDate,
      physicalWorkplaceId: form.physicalWorkplaceId,
      notes: form.notes,
      lines: linesDto,
    });

    const path =
      requestType === 'onboarding'
        ? buildRoute.onboardingRequestDetail(created.id)
        : buildRoute.offboardingRequestDetail(created.id);
    navigate(path);
  };

  return (
    <Box sx={{ p: 2.5 }}>
      <Typography variant="h5" fontWeight={700} mb={3}>
        {t(
          requestType === 'onboarding'
            ? 'requests.onboarding.createTitle'
            : 'requests.offboarding.createTitle',
        )}
      </Typography>

      <Stack spacing={3}>
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <RequestForm value={form} onChange={setForm} />
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <RequestLinesEditor lines={lines} requestType={requestType} onLinesChange={setLines} />
        </Paper>

        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button onClick={() => navigate(-1)}>{t('requests.actions.cancel')}</Button>
          <Button
            variant="contained"
            onClick={submit}
            disabled={!form.requestedFor || create.isPending}
          >
            {t(
              requestType === 'onboarding'
                ? 'requests.onboarding.newButton'
                : 'requests.offboarding.newButton',
            )}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

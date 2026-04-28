import { Box, Paper, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useAddAssetRequestLine,
  useAssetRequest,
  useDeleteAssetRequestLine,
  useTransitionAssetRequest,
  useUpdateAssetRequest,
  useUpdateAssetRequestLine,
} from '../../../hooks/useAssetRequests';
import { RequestForm } from '../../../components/operations/requests/RequestForm';
import { RequestLinesEditor } from '../../../components/operations/requests/RequestLinesEditor';
import { RequestStatusTransition } from '../../../components/operations/requests/RequestStatusTransition';
import { RequestStatusBadge } from '../../../components/operations/requests/RequestStatusBadge';
import { EmployeeLinkChip } from '../../../components/operations/requests/EmployeeLinkChip';
import Loading from '../../../components/common/Loading';
import ApiErrorDisplay from '../../../components/common/ApiErrorDisplay';
import type { EditableLine } from '../../../components/operations/requests/AssetLineRow';

export default function RequestDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const requestId = id ? Number(id) : undefined;
  const { data: request, isLoading, error, refetch } = useAssetRequest(requestId);
  const updateRequest = useUpdateAssetRequest();
  const addLine = useAddAssetRequestLine();
  const updateLine = useUpdateAssetRequestLine();
  const deleteLine = useDeleteAssetRequestLine();
  const transition = useTransitionAssetRequest();

  if (isLoading) return <Loading />;
  if (error || !request) return <ApiErrorDisplay onRetry={() => refetch()} />;

  const readOnly = request.status === 'Completed' || request.status === 'Cancelled';

  const onLinesChange = async (next: EditableLine[]) => {
    // Reconcile against current request.lines: add/update/delete by id.
    const existingById = new Map(request.lines.map((l) => [l.id, l]));
    const seen = new Set<number>();

    for (const line of next) {
      if ('id' in line && line.id !== undefined && existingById.has(line.id)) {
        seen.add(line.id);
        const existing = existingById.get(line.id)!;
        if (
          existing.assetTypeId !== line.assetTypeId ||
          existing.sourceType !== ('sourceType' in line ? line.sourceType : 'ToBeAssigned') ||
          existing.assetId !== line.assetId ||
          existing.assetTemplateId !== line.assetTemplateId ||
          existing.returnAction !== line.returnAction ||
          existing.notes !== line.notes ||
          ('status' in line && existing.status !== line.status)
        ) {
          await updateLine.mutateAsync({
            requestId: request.id,
            lineId: line.id,
            dto: {
              assetTypeId: line.assetTypeId,
              sourceType: 'sourceType' in line ? line.sourceType : 'ToBeAssigned',
              assetId: line.assetId,
              assetTemplateId: line.assetTemplateId,
              status: 'status' in line ? line.status : undefined,
              returnAction: line.returnAction,
              notes: line.notes,
            },
          });
        }
      } else {
        await addLine.mutateAsync({
          requestId: request.id,
          dto: {
            assetTypeId: line.assetTypeId,
            sourceType: 'sourceType' in line ? (line.sourceType ?? 'ToBeAssigned') : 'ToBeAssigned',
            assetId: line.assetId,
            assetTemplateId: line.assetTemplateId,
            returnAction: line.returnAction,
            notes: line.notes,
          },
        });
      }
    }

    for (const existing of request.lines) {
      if (!seen.has(existing.id)) {
        await deleteLine.mutateAsync({ requestId: request.id, lineId: existing.id });
      }
    }
  };

  return (
    <Box sx={{ p: 2.5 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack>
          <Typography variant="h5" fontWeight={700}>
            #{request.id} — {request.requestedFor}
          </Typography>
          <Stack direction="row" spacing={1} mt={1} alignItems="center">
            <RequestStatusBadge status={request.status} />
            <EmployeeLinkChip employeeDisplayName={request.employeeDisplayName} />
          </Stack>
        </Stack>
        <RequestStatusTransition
          request={request}
          onTransition={async (target) => {
            await transition.mutateAsync({ id: request.id, dto: { target } });
          }}
          busy={transition.isPending}
        />
      </Stack>

      <Stack spacing={3}>
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <RequestForm
            value={{
              requestedFor: request.requestedFor,
              employeeId: request.employeeId,
              requestedDate: request.requestedDate,
              physicalWorkplaceId: request.physicalWorkplaceId,
              notes: request.notes,
            }}
            onChange={async (next) => {
              await updateRequest.mutateAsync({
                id: request.id,
                dto: {
                  requestedFor: next.requestedFor,
                  employeeId: next.employeeId,
                  requestedDate: next.requestedDate,
                  physicalWorkplaceId: next.physicalWorkplaceId,
                  notes: next.notes,
                },
              });
            }}
            readOnly={readOnly}
          />
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <RequestLinesEditor
            lines={request.lines}
            requestType={request.requestType}
            onLinesChange={onLinesChange}
            readOnly={readOnly}
          />
        </Paper>

        {request.notes && (
          <Typography variant="body2" color="text.secondary">
            {t('requests.form.notes')}: {request.notes}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

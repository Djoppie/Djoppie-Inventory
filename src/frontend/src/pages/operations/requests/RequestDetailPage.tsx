import { Box, Stack, Typography, alpha, useTheme } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
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
import {
  getNeumorph,
  getNeumorphColors,
} from '../../../utils/neumorphicStyles';

const REQUESTS_COLOR = '#1976D2';
const ONBOARDING_COLOR = '#43A047';
const OFFBOARDING_COLOR = '#E53935';

function SectionCard({
  children,
  title,
  icon,
  accentColor,
  isDark,
}: {
  children: React.ReactNode;
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  isDark: boolean;
}) {
  const { bgSurface } = getNeumorphColors(isDark);
  return (
    <Box
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: bgSurface,
        boxShadow: getNeumorph(isDark, 'medium'),
        border: '1px solid',
        borderColor: 'divider',
        transition: 'box-shadow 0.3s ease',
        '&:hover': {
          boxShadow: `${getNeumorph(isDark, 'strong')}, 0 0 0 1px ${alpha(accentColor, 0.15)}`,
        },
      }}
    >
      {/* Accent header strip */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          background: isDark
            ? `linear-gradient(135deg, ${alpha(accentColor, 0.18)} 0%, ${alpha(accentColor, 0.06)} 100%)`
            : `linear-gradient(135deg, ${alpha(accentColor, 0.1)} 0%, ${alpha(accentColor, 0.03)} 100%)`,
          borderBottom: `2px solid ${alpha(accentColor, isDark ? 0.35 : 0.2)}`,
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(accentColor, isDark ? 0.2 : 0.12),
            color: accentColor,
          }}
        >
          {icon}
        </Box>
        <Typography variant="subtitle2" fontWeight={700} color={accentColor}>
          {title}
        </Typography>
      </Box>
      {/* Card body */}
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Box>
  );
}

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
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  if (isLoading) return <Loading />;
  if (error || !request) return <ApiErrorDisplay onRetry={() => refetch()} />;

  const readOnly = request.status === 'Completed' || request.status === 'Cancelled';
  const typeColor =
    request.requestType === 'onboarding' ? ONBOARDING_COLOR : OFFBOARDING_COLOR;
  const TypeIcon = request.requestType === 'onboarding' ? PersonAddIcon : PersonRemoveIcon;

  const onLinesChange = async (next: EditableLine[]) => {
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
    <Box sx={{ p: { xs: 2, sm: 2, md: 2.5 }, pb: 10 }}>
      {/* Page header */}
      <Box
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: bgSurface,
          boxShadow: getNeumorph(isDark, 'soft'),
          border: '1px solid',
          borderColor: 'divider',
          mb: 3,
        }}
      >
        {/* Gradient accent strip with type color */}
        <Box
          sx={{
            px: 2.5,
            py: 1.75,
            background: isDark
              ? `linear-gradient(135deg, ${alpha(typeColor, 0.18)} 0%, ${alpha(REQUESTS_COLOR, 0.06)} 100%)`
              : `linear-gradient(135deg, ${alpha(typeColor, 0.1)} 0%, ${alpha(REQUESTS_COLOR, 0.03)} 100%)`,
            borderBottom: `2px solid ${alpha(typeColor, isDark ? 0.35 : 0.2)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(typeColor, isDark ? 0.2 : 0.12),
                color: typeColor,
              }}
            >
              <TypeIcon sx={{ fontSize: 20 }} />
            </Box>
            <Stack spacing={0.25}>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                #{request.id} — {request.requestedFor}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <RequestStatusBadge status={request.status} />
                <EmployeeLinkChip employeeDisplayName={request.employeeDisplayName} />
              </Stack>
            </Stack>
          </Stack>

          {/* Status transition actions */}
          <RequestStatusTransition
            request={request}
            onTransition={async (target) => {
              await transition.mutateAsync({ id: request.id, dto: { target } });
            }}
            busy={transition.isPending}
          />
        </Box>
      </Box>

      <Stack spacing={3}>
        {/* Request details card */}
        <SectionCard
          title={t('requests.form.sectionTitle', { defaultValue: 'Aanvraagdetails' })}
          icon={<AssignmentIcon sx={{ fontSize: 16 }} />}
          accentColor={typeColor}
          isDark={isDark}
        >
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
        </SectionCard>

        {/* Asset lines card */}
        <SectionCard
          title={t('requests.lines.sectionTitle', { defaultValue: 'Assetregels' })}
          icon={<ListAltIcon sx={{ fontSize: 16 }} />}
          accentColor={REQUESTS_COLOR}
          isDark={isDark}
        >
          <RequestLinesEditor
            lines={request.lines}
            requestType={request.requestType}
            onLinesChange={onLinesChange}
            readOnly={readOnly}
            employeeId={request.employeeId}
            physicalWorkplaceId={request.physicalWorkplaceId}
          />
        </SectionCard>
      </Stack>
    </Box>
  );
}

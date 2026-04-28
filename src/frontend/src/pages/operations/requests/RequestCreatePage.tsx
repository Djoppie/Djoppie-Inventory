import { useState } from 'react';
import {
  Box,
  Button,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RequestForm, type RequestFormState } from '../../../components/operations/requests/RequestForm';
import { RequestLinesEditor } from '../../../components/operations/requests/RequestLinesEditor';
import type { EditableLine } from '../../../components/operations/requests/AssetLineRow';
import { useCreateAssetRequest } from '../../../hooks/useAssetRequests';
import { buildRoute } from '../../../constants/routes';
import type { AssetRequestType, CreateAssetRequestLineDto } from '../../../types/assetRequest.types';
import {
  getNeumorph,
  getNeumorphColors,
} from '../../../utils/neumorphicStyles';
import { getNeumorphButton } from '../../../utils/designSystem';

// Accent colors per request type
const ONBOARDING_COLOR = '#43A047';
const OFFBOARDING_COLOR = '#E53935';
const REQUESTS_COLOR = '#1976D2';

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

export default function RequestCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const requestType: AssetRequestType = location.pathname.includes('/offboarding/')
    ? 'offboarding'
    : 'onboarding';

  const typeColor = requestType === 'onboarding' ? ONBOARDING_COLOR : OFFBOARDING_COLOR;
  const TypeIcon = requestType === 'onboarding' ? PersonAddIcon : PersonRemoveIcon;

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
    <Box sx={{ p: { xs: 2, sm: 2, md: 2.5 }, pb: 10 }}>
      {/* Page header */}
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2.5,
          py: 1.5,
          borderRadius: 2,
          bgcolor: alpha(typeColor, 0.1),
          border: '1px solid',
          borderColor: alpha(typeColor, 0.2),
          mb: 3,
        }}
      >
        <TypeIcon sx={{ color: typeColor, fontSize: 28 }} />
        <Box>
          <Box sx={{ fontSize: '1.4rem', fontWeight: 700, color: typeColor, lineHeight: 1.2 }}>
            {t(
              requestType === 'onboarding'
                ? 'requests.onboarding.createTitle'
                : 'requests.offboarding.createTitle',
            )}
          </Box>
          <Box sx={{ fontSize: '0.8rem', color: 'text.secondary', mt: 0.25 }}>
            {requestType === 'onboarding'
              ? t('requests.onboarding.createSubtitle', { defaultValue: 'Nieuwe medewerker instroomproces' })
              : t('requests.offboarding.createSubtitle', { defaultValue: 'Medewerker uitstroomproces' })}
          </Box>
        </Box>
      </Box>

      <Stack spacing={3}>
        {/* Request details card */}
        <SectionCard
          title={t('requests.form.sectionTitle', { defaultValue: 'Aanvraagdetails' })}
          icon={<TypeIcon sx={{ fontSize: 16 }} />}
          accentColor={typeColor}
          isDark={isDark}
        >
          <RequestForm value={form} onChange={setForm} />
        </SectionCard>

        {/* Asset lines card */}
        <SectionCard
          title={t('requests.lines.sectionTitle', { defaultValue: 'Assetregels' })}
          icon={<Box sx={{ width: 16, height: 16, fontSize: 16 }}>≡</Box>}
          accentColor={REQUESTS_COLOR}
          isDark={isDark}
        >
          <RequestLinesEditor lines={lines} requestType={requestType} onLinesChange={setLines} />
        </SectionCard>

        {/* Action bar */}
        <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
          <Button
            onClick={() => navigate(-1)}
            sx={{
              ...getNeumorphButton(isDark, REQUESTS_COLOR, 'ghost'),
              px: 2.5,
            }}
          >
            {t('requests.actions.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={submit}
            disabled={!form.requestedFor || create.isPending}
            sx={getNeumorphButton(isDark, typeColor, 'primary')}
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

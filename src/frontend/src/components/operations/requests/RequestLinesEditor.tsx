import { Box, Button, Stack, Typography, alpha, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { AssetLineRow, type EditableLine } from './AssetLineRow';
import {
  AssetTablePickerPanel,
  AssetTablePickerTrigger,
  useAssetTablePicker,
} from './pickers/AssetTablePicker';
import { TemplatePicker } from './pickers/TemplatePicker';
import type { AssetRequestType } from '../../../types/assetRequest.types';
import { type Asset, type AssetTemplate, AssetStatus } from '../../../types/asset.types';
import { getAssets } from '../../../api/assets.api';
import { getTemplates } from '../../../api/templates.api';
import { assetTypesApi } from '../../../api/admin.api';
import { getNeumorphInset } from '../../../utils/neumorphicStyles';

const REQUESTS_COLOR = '#1976D2';

interface AssetTypeOption {
  id: number;
  name: string;
}

interface Props {
  lines: EditableLine[];
  requestType: AssetRequestType;
  onLinesChange: (lines: EditableLine[]) => void;
  readOnly?: boolean;
  /**
   * Form context used to scope the asset picker:
   * - Onboarding only ever surfaces Nieuw / Stock assets.
   * - Offboarding surfaces only assets currently assigned to this employee
   *   and/or workplace. When neither is set we fall back to all InGebruik
   *   assets (offboarding by definition can only target an in-use asset).
   */
  employeeId?: number;
  physicalWorkplaceId?: number;
}

/**
 * Per-line wrapper. Hosts the inline-expanding asset table picker hook (which
 * cannot be called inside a `.map`) and feeds the trigger + panel slots into
 * `AssetLineRow`.
 */
interface LineWrapperProps {
  line: EditableLine;
  idx: number;
  requestType: AssetRequestType;
  assetTypes: AssetTypeOption[];
  assets: Asset[];
  templates: AssetTemplate[];
  employeeId?: number;
  physicalWorkplaceId?: number;
  readOnly?: boolean;
  onChange: (idx: number, next: EditableLine) => void;
  onSkipToggle?: (idx: number) => void;
  onDelete: (idx: number) => void;
}

function LineWrapper({
  line,
  idx,
  requestType,
  assetTypes,
  assets,
  templates,
  employeeId,
  physicalWorkplaceId,
  readOnly,
  onChange,
  onSkipToggle,
  onDelete,
}: LineWrapperProps) {
  const { t } = useTranslation();
  const filterTypeId = line.assetTypeId || undefined;
  const sourceType = ('sourceType' in line ? line.sourceType : undefined) ?? 'ToBeAssigned';

  const hasAssignmentContext =
    employeeId !== undefined || physicalWorkplaceId !== undefined;
  const allowedStatuses: AssetStatus[] | undefined =
    requestType === 'onboarding'
      ? [AssetStatus.Nieuw, AssetStatus.Stock]
      : hasAssignmentContext
        ? undefined
        : [AssetStatus.InGebruik];
  const assignedEmp = requestType === 'offboarding' ? employeeId : undefined;
  const assignedWp =
    requestType === 'offboarding' ? physicalWorkplaceId : undefined;
  const offboardingHelper =
    requestType === 'offboarding' && hasAssignmentContext
      ? t('requests.lines.scopedToAssignedHelper', {
          defaultValue:
            'Toont enkel assets toegewezen aan deze medewerker of werkplek',
        })
      : undefined;

  const tableState = useAssetTablePicker({
    options: assets,
    value: assets.find((a) => a.id === line.assetId) ?? null,
    onChange: (selected) =>
      onChange(idx, {
        ...line,
        assetId: selected?.id,
        sourceType: 'ExistingInventory',
      }),
    filterByAssetTypeId: filterTypeId,
    allowedStatuses,
    assignedToEmployeeId: assignedEmp,
    assignedToWorkplaceId: assignedWp,
  });

  const assetPicker = (
    <AssetTablePickerTrigger
      state={tableState}
      label={t('requests.lines.asset')}
      disabled={readOnly}
      helperText={offboardingHelper}
    />
  );

  const templatePicker = (
    <TemplatePicker
      options={templates}
      value={templates.find((tpl) => tpl.id === line.assetTemplateId) ?? null}
      onChange={(selected) =>
        onChange(idx, {
          ...line,
          assetTemplateId: selected?.id,
          sourceType: 'NewFromTemplate',
        })
      }
      label={t('requests.lines.template')}
      disabled={readOnly}
      filterByAssetTypeId={filterTypeId}
    />
  );

  // Only render the expanding panel when this line is actually using
  // existing-inventory mode — switching the source mode collapses the panel.
  const bottomPanel =
    sourceType === 'ExistingInventory' ? (
      <AssetTablePickerPanel
        state={tableState}
        emptyMessage={
          requestType === 'offboarding' && hasAssignmentContext
            ? 'Geen toegewezen assets gevonden voor deze medewerker of werkplek.'
            : requestType === 'onboarding'
              ? 'Geen Nieuw of Stock assets beschikbaar voor dit type.'
              : 'Geen assets beschikbaar voor deze selectie.'
        }
      />
    ) : undefined;

  return (
    <AssetLineRow
      line={line}
      requestType={requestType}
      assetTypes={assetTypes}
      onChange={(next) => onChange(idx, next)}
      onSkipToggle={onSkipToggle ? () => onSkipToggle(idx) : undefined}
      onDelete={() => onDelete(idx)}
      assetPicker={assetPicker}
      templatePicker={templatePicker}
      bottomPanel={bottomPanel}
      readOnly={readOnly}
    />
  );
}

export function RequestLinesEditor({
  lines,
  requestType,
  onLinesChange,
  readOnly,
  employeeId,
  physicalWorkplaceId,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { data: assetTypes = [] } = useQuery<AssetTypeOption[]>({
    queryKey: ['admin-asset-types'],
    queryFn: () => assetTypesApi.getAll(),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets-for-line-picker'],
    queryFn: () => getAssets(),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['asset-templates-for-line-picker'],
    queryFn: () => getTemplates(),
  });

  const updateLine = (idx: number, next: EditableLine) => {
    const copy = lines.slice();
    copy[idx] = next;
    onLinesChange(copy);
  };

  const removeLine = (idx: number) => {
    onLinesChange(lines.filter((_, i) => i !== idx));
  };

  const addLine = () => {
    onLinesChange([
      ...lines,
      {
        assetTypeId: assetTypes[0]?.id ?? 0,
        sourceType: 'ToBeAssigned',
      },
    ]);
  };

  const skipToggle = (idx: number) => {
    const cur = lines[idx];
    if (!('status' in cur)) return;
    const next = cur.status === 'Skipped' ? 'Pending' : 'Skipped';
    updateLine(idx, { ...cur, status: next });
  };

  return (
    <Box>
      {/* Section header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(REQUESTS_COLOR, isDark ? 0.15 : 0.1),
              color: REQUESTS_COLOR,
            }}
          >
            <ListAltIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography variant="h6" fontWeight={700}>
            {t('requests.lines.title')}
          </Typography>
          {lines.length > 0 && (
            <Box
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 10,
                bgcolor: REQUESTS_COLOR,
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 700,
                lineHeight: 1.6,
              }}
            >
              {lines.length}
            </Box>
          )}
        </Stack>
        {!readOnly && (
          <Button
            startIcon={<AddIcon />}
            onClick={addLine}
            size="small"
            sx={{
              bgcolor: alpha(REQUESTS_COLOR, 0.1),
              color: REQUESTS_COLOR,
              border: `1px solid ${alpha(REQUESTS_COLOR, 0.25)}`,
              borderRadius: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: alpha(REQUESTS_COLOR, 0.18),
                borderColor: REQUESTS_COLOR,
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 12px ${alpha(REQUESTS_COLOR, 0.2)}`,
              },
            }}
          >
            {t('requests.lines.addLine')}
          </Button>
        )}
      </Stack>

      {lines.length === 0 && (
        <Box
          sx={{
            py: 4,
            borderRadius: 2,
            boxShadow: getNeumorphInset(isDark),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography color="text.secondary" variant="body2">
            {t('requests.lines.noLines')}
          </Typography>
        </Box>
      )}

      <Stack spacing={1.5}>
        {lines.map((line, idx) => (
          <LineWrapper
            key={('id' in line && line.id) || `new-${idx}`}
            line={line}
            idx={idx}
            requestType={requestType}
            assetTypes={assetTypes}
            assets={assets}
            templates={templates}
            employeeId={employeeId}
            physicalWorkplaceId={physicalWorkplaceId}
            readOnly={readOnly}
            onChange={updateLine}
            onSkipToggle={readOnly ? undefined : skipToggle}
            onDelete={removeLine}
          />
        ))}
      </Stack>
    </Box>
  );
}

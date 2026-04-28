import { Box, Button, Stack, Typography, alpha, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { AssetLineRow, type EditableLine } from './AssetLineRow';
import { AssetPicker } from './pickers/AssetPicker';
import { TemplatePicker } from './pickers/TemplatePicker';
import type { AssetRequestType } from '../../../types/assetRequest.types';
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
}

export function RequestLinesEditor({ lines, requestType, onLinesChange, readOnly }: Props) {
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
    if (!('status' in cur)) return; // create-mode lines have no status yet
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

      {/* Line cards — spacing between neumorphic cards, no dividers needed */}
      <Stack spacing={1.5}>
        {lines.map((line, idx) => {
          const filterTypeId = line.assetTypeId || undefined;

          const assetPicker = (
            <AssetPicker
              options={assets}
              value={assets.find((a) => a.id === line.assetId) ?? null}
              onChange={(selected) =>
                updateLine(idx, {
                  ...line,
                  assetId: selected?.id,
                  sourceType: 'ExistingInventory',
                })
              }
              label={t('requests.lines.asset')}
              disabled={readOnly}
              filterByAssetTypeId={filterTypeId}
            />
          );

          const templatePicker = (
            <TemplatePicker
              options={templates}
              value={templates.find((tpl) => tpl.id === line.assetTemplateId) ?? null}
              onChange={(selected) =>
                updateLine(idx, {
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

          return (
            <AssetLineRow
              key={('id' in line && line.id) || `new-${idx}`}
              line={line}
              requestType={requestType}
              assetTypes={assetTypes}
              onChange={(next) => updateLine(idx, next)}
              onSkipToggle={'status' in line ? () => skipToggle(idx) : undefined}
              onDelete={() => removeLine(idx)}
              assetPicker={assetPicker}
              templatePicker={templatePicker}
              readOnly={readOnly}
            />
          );
        })}
      </Stack>
    </Box>
  );
}

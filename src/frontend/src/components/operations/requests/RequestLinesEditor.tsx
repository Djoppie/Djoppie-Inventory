import { Box, Button, Stack, Typography, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { AssetLineRow, type EditableLine } from './AssetLineRow';
import { AssetPicker } from './pickers/AssetPicker';
import { TemplatePicker } from './pickers/TemplatePicker';
import type { AssetRequestType } from '../../../types/assetRequest.types';
import { getAssets } from '../../../api/assets.api';
import { getTemplates } from '../../../api/templates.api';
import { assetTypesApi } from '../../../api/admin.api';

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
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6">{t('requests.lines.title')}</Typography>
        {!readOnly && (
          <Button startIcon={<AddIcon />} onClick={addLine} variant="outlined" size="small">
            {t('requests.lines.addLine')}
          </Button>
        )}
      </Stack>

      {lines.length === 0 && (
        <Typography color="text.secondary" variant="body2">
          {t('requests.lines.noLines')}
        </Typography>
      )}

      <Stack spacing={2} divider={<Divider flexItem />}>
        {lines.map((line, idx) => {
          // Filter the asset/template options to the selected line type when present.
          // This keeps the dropdown short and the choice obviously relevant.
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

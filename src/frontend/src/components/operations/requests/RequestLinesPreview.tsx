import { Box, Stack, Tooltip, Typography, alpha, useTheme } from '@mui/material';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import MonitorIcon from '@mui/icons-material/Monitor';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import CableIcon from '@mui/icons-material/Cable';
import AddBoxIcon from '@mui/icons-material/AddBox';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ScheduleIcon from '@mui/icons-material/Schedule';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import type { AssetRequestLineSummaryDto } from '../../../types/assetRequest.types';

interface Props {
  lines: AssetRequestLineSummaryDto[];
  /** When true, max 2 visible + "+N more" — for dense table cells. */
  collapsed?: boolean;
}

function pickAssetIcon(typeName: string) {
  const t = typeName.toLowerCase();
  if (t.includes('laptop')) return LaptopMacIcon;
  if (t.includes('monitor')) return MonitorIcon;
  if (t.includes('keyboard') || t.includes('toetsenbord')) return KeyboardIcon;
  if (t.includes('mouse') || t.includes('muis')) return MouseIcon;
  if (t.includes('headset') || t.includes('koptelefoon')) return HeadsetMicIcon;
  if (t.includes('docking') || t.includes('dock')) return CableIcon;
  return DevicesOtherIcon;
}

const LINE_STATUS_META = {
  Pending: { color: '#9E9E9E', label: 'Open', Icon: ScheduleIcon },
  Reserved: { color: '#FF9800', label: 'Gereserveerd', Icon: BookmarkBorderIcon },
  Completed: { color: '#43A047', label: 'Voltooid', Icon: CheckCircleIcon },
  Skipped: { color: '#757575', label: 'Overgeslagen', Icon: VisibilityOffIcon },
} as const;

/**
 * Maps the offboarding `ReturnAction` to the asset status the device ends up in
 * (matches AssetRequestCompletionService.ApplyOffboardingLine on the backend).
 * The label is shown as a small pill so the user can see at a glance whether
 * the asset went back to stock or was decommissioned.
 */
const RETURN_ACTION_DESTINATION = {
  ReturnToStock: { color: '#1976D2', label: 'Stock' },
  Reassign: { color: '#1976D2', label: 'Stock (her)' },
  Decommission: { color: '#757575', label: 'Uit dienst' },
} as const;

/**
 * Compact stack of mini-cards summarising the assets on a request. Each card
 * shows the asset code (mono), the brand/model, and the serial number, with
 * a status dot and asset-type icon. Designed for use inside the requests list
 * table so the user can scan what each request contains without clicking.
 */
export function RequestLinesPreview({ lines, collapsed }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (lines.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        Geen regels
      </Typography>
    );
  }

  const visible = collapsed ? lines.slice(0, 2) : lines;
  const remaining = collapsed ? lines.length - visible.length : 0;

  return (
    <Stack spacing={0.5}>
      {visible.map((line) => {
        const Icon = pickAssetIcon(line.assetTypeName);
        const meta = LINE_STATUS_META[line.status];
        const subtitleParts = [
          [line.brand, line.model].filter(Boolean).join(' '),
          line.serialNumber ? `SN: ${line.serialNumber}` : null,
        ].filter(Boolean);
        const subtitle = subtitleParts.join(' · ');
        const placeholder =
          !line.assetCode &&
          (line.assetTemplateName
            ? `Nieuw via "${line.assetTemplateName}"`
            : `${line.assetTypeName} (nog te bepalen)`);

        return (
          <Tooltip
            key={line.id}
            arrow
            placement="left"
            title={
              <Box sx={{ p: 0.25 }}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {line.assetTypeName}
                </Typography>
                {line.assetCode && (
                  <Typography
                    variant="caption"
                    sx={{ display: 'block', fontFamily: 'monospace' }}
                  >
                    {line.assetCode}
                  </Typography>
                )}
                {line.assetName && (
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    {line.assetName}
                  </Typography>
                )}
                {subtitle && (
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    {subtitle}
                  </Typography>
                )}
                <Typography
                  variant="caption"
                  sx={{ display: 'block', mt: 0.5, color: meta.color }}
                >
                  {meta.label}
                  {line.returnAction ? ` · ${line.returnAction}` : ''}
                </Typography>
              </Box>
            }
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                px: 1,
                py: 0.5,
                borderRadius: 1,
                bgcolor: alpha(meta.color, isDark ? 0.1 : 0.06),
                border: '1px solid',
                borderColor: alpha(meta.color, isDark ? 0.25 : 0.18),
                opacity: line.status === 'Skipped' ? 0.6 : 1,
                maxWidth: 360,
              }}
            >
              {/* Type icon */}
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: 0.75,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(meta.color, isDark ? 0.18 : 0.12),
                  color: meta.color,
                  flexShrink: 0,
                }}
              >
                <Icon sx={{ fontSize: 14 }} />
              </Box>

              {/* Code + secondary line */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {line.assetCode ? (
                  <>
                    <Typography
                      sx={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        fontFamily:
                          '"SF Mono", "Roboto Mono", "Cascadia Code", Consolas, monospace',
                        letterSpacing: '0.02em',
                        lineHeight: 1.3,
                        color: 'text.primary',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {line.assetCode}
                    </Typography>
                    {subtitle && (
                      <Typography
                        sx={{
                          fontSize: '0.65rem',
                          lineHeight: 1.3,
                          color: 'text.secondary',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {subtitle}
                      </Typography>
                    )}
                  </>
                ) : (
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {line.assetTemplateName ? (
                      <AddBoxIcon
                        sx={{ fontSize: 12, color: 'text.secondary' }}
                      />
                    ) : (
                      <HelpOutlineIcon
                        sx={{ fontSize: 12, color: 'text.secondary' }}
                      />
                    )}
                    <Typography
                      sx={{
                        fontSize: '0.7rem',
                        fontStyle: 'italic',
                        color: 'text.secondary',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {placeholder}
                    </Typography>
                  </Stack>
                )}
              </Box>

              {/* Destination status pill (offboarding only — set when ReturnAction present) */}
              {line.returnAction && RETURN_ACTION_DESTINATION[line.returnAction] && (
                (() => {
                  const dest = RETURN_ACTION_DESTINATION[line.returnAction];
                  return (
                    <Box
                      sx={{
                        flexShrink: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.25,
                        px: 0.75,
                        py: 0.1,
                        borderRadius: 999,
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        bgcolor: alpha(dest.color, isDark ? 0.22 : 0.14),
                        border: '1px solid',
                        borderColor: alpha(dest.color, isDark ? 0.4 : 0.3),
                        color: dest.color,
                        textTransform: 'uppercase',
                        lineHeight: 1.5,
                      }}
                    >
                      <span style={{ opacity: 0.7 }}>→</span> {dest.label}
                    </Box>
                  );
                })()
              )}

              {/* Status icon */}
              <meta.Icon
                sx={{
                  fontSize: 14,
                  color: meta.color,
                  flexShrink: 0,
                }}
              />
            </Stack>
          </Tooltip>
        );
      })}

      {remaining > 0 && (
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontWeight: 600,
            ml: 1,
          }}
        >
          +{remaining} meer
        </Typography>
      )}
    </Stack>
  );
}

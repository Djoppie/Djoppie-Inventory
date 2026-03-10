import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  IconButton,
  Tooltip,
  Collapse,
  TextField,
  InputAdornment,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TerminalIcon from '@mui/icons-material/Terminal';
import MinimizeIcon from '@mui/icons-material/Minimize';
import { useIntuneLiveStatus } from '../../hooks/useIntuneLiveStatus';
import { useProvisioningTimeline } from '../../hooks/useProvisioningTimeline';

// Retro terminal colors
const TERMINAL_COLORS = {
  bg: '#0a0a0a',
  text: '#00ff41',
  dimText: '#00aa2a',
  accent: '#ff7700', // Djoppie orange
  error: '#ff3333',
  border: '#1a1a1a',
  glow: 'rgba(0, 255, 65, 0.3)',
};

// Retro terminal card styling
const terminalCardSx = {
  mb: 3,
  borderRadius: 2,
  border: '1px solid',
  borderColor: TERMINAL_COLORS.border,
  bgcolor: TERMINAL_COLORS.bg,
  overflow: 'hidden',
  boxShadow: `0 0 20px ${TERMINAL_COLORS.glow}, inset 0 0 60px rgba(0, 255, 65, 0.02)`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    borderColor: TERMINAL_COLORS.text,
    boxShadow: `0 0 30px ${TERMINAL_COLORS.glow}, inset 0 0 60px rgba(0, 255, 65, 0.05)`,
  },
};

// Terminal font styling
const terminalFontSx = {
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'Consolas', monospace",
  textShadow: `0 0 8px ${TERMINAL_COLORS.glow}`,
};

// Output line component
interface OutputLineProps {
  type: 'command' | 'output' | 'error' | 'info' | 'ascii';
  content: string;
}

const OutputLine = ({ type, content }: OutputLineProps) => {
  const getColor = () => {
    switch (type) {
      case 'command':
        return TERMINAL_COLORS.text;
      case 'error':
        return TERMINAL_COLORS.error;
      case 'info':
        return TERMINAL_COLORS.dimText;
      case 'ascii':
        return TERMINAL_COLORS.accent;
      default:
        return TERMINAL_COLORS.text;
    }
  };

  return (
    <Typography
      component="div"
      sx={{
        ...terminalFontSx,
        fontSize: type === 'ascii' ? '10px' : '13px',
        color: getColor(),
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        lineHeight: type === 'ascii' ? 1 : 1.6,
        mb: type === 'ascii' ? 0 : 0.5,
      }}
    >
      {type === 'command' ? `$ ${content}` : content}
    </Typography>
  );
};

interface CommandOutput {
  type: 'command' | 'output' | 'error' | 'info' | 'ascii';
  content: string;
}

interface DeviceTerminalProps {
  serialNumber: string;
  deviceName?: string;
}

const DeviceTerminal = ({ serialNumber, deviceName }: DeviceTerminalProps) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentInput, setCurrentInput] = useState('');
  const [output, setOutput] = useState<CommandOutput[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: liveStatus } = useIntuneLiveStatus(serialNumber, { enabled: expanded });
  const { data: timeline } = useProvisioningTimeline(serialNumber, { enabled: expanded, pollInterval: 60000 });

  const displayName = deviceName || serialNumber || 'device';

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Focus input when expanded
  useEffect(() => {
    if (expanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [expanded]);

  // Welcome message on mount
  useEffect(() => {
    setOutput([
      { type: 'ascii', content: getDjoppieAscii() },
      { type: 'info', content: '' },
      { type: 'info', content: `Welcome to Djoppie Terminal v1.0` },
      { type: 'info', content: `Device: ${displayName}` },
      { type: 'info', content: `Type 'help' for available commands.` },
      { type: 'info', content: '' },
    ]);
  }, [displayName]);

  // Command handlers
  const executeCommand = useCallback(
    (cmd: string) => {
      const trimmedCmd = cmd.trim().toLowerCase();
      const args = trimmedCmd.split(' ');
      const command = args[0];

      // Add command to output
      const newOutput: CommandOutput[] = [{ type: 'command', content: cmd }];

      switch (command) {
        case 'help':
          newOutput.push(
            { type: 'info', content: '' },
            { type: 'output', content: 'Available commands:' },
            { type: 'output', content: '' },
            { type: 'output', content: '  help      - Show this help message' },
            { type: 'output', content: '  status    - Device status overview' },
            { type: 'output', content: '  apps      - List detected applications' },
            { type: 'output', content: '  timeline  - Provisioning timeline' },
            { type: 'output', content: '  storage   - Storage information' },
            { type: 'output', content: '  user      - Assigned user info' },
            { type: 'output', content: '  sync      - Last sync information' },
            { type: 'output', content: '  clear     - Clear terminal output' },
            { type: 'output', content: '  ascii     - Show Djoppie ASCII art' },
            { type: 'info', content: '' }
          );
          break;

        case 'status':
          if (liveStatus?.found) {
            newOutput.push(
              { type: 'info', content: '' },
              { type: 'output', content: '┌──────────────────────────────────────────────────┐' },
              { type: 'output', content: '│  DEVICE STATUS                                   │' },
              { type: 'output', content: '├──────────────────────────────────────────────────┤' },
              { type: 'output', content: `│  Compliance    : ${liveStatus.isCompliant ? '✓ Compliant' : '✗ Non-Compliant'}${' '.repeat(Math.max(0, 30 - (liveStatus.isCompliant ? 11 : 14)))}│` },
              { type: 'output', content: `│  Encryption    : ${liveStatus.isEncrypted ? '✓ Encrypted' : '✗ Not Encrypted'}${' '.repeat(Math.max(0, 30 - (liveStatus.isEncrypted ? 11 : 15)))}│` },
              { type: 'output', content: `│  Health Score  : ${liveStatus.healthScore}/100 (${liveStatus.healthStatus})${' '.repeat(Math.max(0, 30 - (String(liveStatus.healthScore).length + liveStatus.healthStatus.length + 7)))}│` },
              { type: 'output', content: `│  OS            : ${(liveStatus.operatingSystem || 'Unknown').substring(0, 25)}${' '.repeat(Math.max(0, 30 - Math.min(25, (liveStatus.operatingSystem || 'Unknown').length)))}│` },
              { type: 'output', content: '└──────────────────────────────────────────────────┘' },
              { type: 'info', content: '' }
            );
          } else {
            newOutput.push({ type: 'error', content: 'Device not found in Intune' });
          }
          break;

        case 'apps':
          if (liveStatus?.found && liveStatus.topApps && liveStatus.topApps.length > 0) {
            newOutput.push(
              { type: 'info', content: '' },
              { type: 'output', content: `DETECTED APPLICATIONS (${liveStatus.totalDetectedApps} total)` },
              { type: 'output', content: '─'.repeat(50) }
            );
            liveStatus.topApps.slice(0, 10).forEach((app) => {
              const name = app.displayName.substring(0, 35);
              const version = (app.version || '-').substring(0, 12);
              newOutput.push({
                type: 'output',
                content: `  ${name}${' '.repeat(Math.max(1, 36 - name.length))}${version}`,
              });
            });
            if (liveStatus.totalDetectedApps > 10) {
              newOutput.push({
                type: 'info',
                content: `  ... and ${liveStatus.totalDetectedApps - 10} more`,
              });
            }
            newOutput.push({ type: 'info', content: '' });
          } else {
            newOutput.push({ type: 'error', content: 'No application data available' });
          }
          break;

        case 'timeline':
          if (timeline?.found && timeline.events.length > 0) {
            newOutput.push(
              { type: 'info', content: '' },
              { type: 'output', content: 'PROVISIONING TIMELINE' },
              { type: 'output', content: '═'.repeat(50) }
            );
            timeline.events
              .sort((a, b) => a.order - b.order)
              .forEach((event, idx) => {
                const icon = event.status === 'Complete' ? '●' : event.status === 'InProgress' ? '◐' : '○';
                const statusText = event.status === 'Complete' ? '✓' : event.status === 'InProgress' ? '...' : '';
                const duration = event.durationFormatted || '';
                newOutput.push({
                  type: 'output',
                  content: `  ${icon} ${event.title.substring(0, 25)}${' '.repeat(Math.max(1, 26 - event.title.length))}${statusText}${' '.repeat(Math.max(1, 8 - statusText.length))}${duration}`,
                });
                if (idx < timeline.events.length - 1) {
                  newOutput.push({ type: 'info', content: '  │' });
                }
              });
            newOutput.push({ type: 'output', content: '═'.repeat(50) });
            if (timeline.totalDurationFormatted) {
              newOutput.push({
                type: 'output',
                content: `  Total: ${timeline.totalDurationFormatted}`,
              });
            }
            newOutput.push({ type: 'info', content: '' });
          } else {
            newOutput.push({ type: 'error', content: 'No provisioning data available' });
          }
          break;

        case 'storage':
          if (liveStatus?.found && liveStatus.totalStorageBytes) {
            const total = (liveStatus.totalStorageBytes / (1024 * 1024 * 1024)).toFixed(1);
            const free = liveStatus.freeStorageBytes
              ? (liveStatus.freeStorageBytes / (1024 * 1024 * 1024)).toFixed(1)
              : '0';
            const used = liveStatus.storageUsagePercent?.toFixed(0) || '0';
            const barWidth = 30;
            const filledWidth = Math.round((parseFloat(used) / 100) * barWidth);
            const bar = '█'.repeat(filledWidth) + '░'.repeat(barWidth - filledWidth);

            newOutput.push(
              { type: 'info', content: '' },
              { type: 'output', content: 'STORAGE INFORMATION' },
              { type: 'output', content: '─'.repeat(50) },
              { type: 'output', content: `  Total    : ${total} GB` },
              { type: 'output', content: `  Free     : ${free} GB` },
              { type: 'output', content: `  Used     : ${used}%` },
              { type: 'output', content: '' },
              { type: 'output', content: `  [${bar}]` },
              { type: 'info', content: '' }
            );
          } else {
            newOutput.push({ type: 'error', content: 'Storage information not available' });
          }
          break;

        case 'user':
          if (liveStatus?.found) {
            newOutput.push(
              { type: 'info', content: '' },
              { type: 'output', content: 'ASSIGNED USER' },
              { type: 'output', content: '─'.repeat(50) },
              {
                type: 'output',
                content: `  Name  : ${liveStatus.userDisplayName || 'Not assigned'}`,
              },
              {
                type: 'output',
                content: `  UPN   : ${liveStatus.userPrincipalName || '-'}`,
              },
              { type: 'info', content: '' }
            );
          } else {
            newOutput.push({ type: 'error', content: 'User information not available' });
          }
          break;

        case 'sync':
          if (liveStatus?.found) {
            const lastSync = liveStatus.lastSyncDateTime
              ? format(new Date(liveStatus.lastSyncDateTime), 'dd MMM yyyy HH:mm:ss')
              : 'Never';
            const enrolled = liveStatus.enrolledDateTime
              ? format(new Date(liveStatus.enrolledDateTime), 'dd MMM yyyy HH:mm')
              : 'Unknown';

            newOutput.push(
              { type: 'info', content: '' },
              { type: 'output', content: 'SYNC INFORMATION' },
              { type: 'output', content: '─'.repeat(50) },
              { type: 'output', content: `  Last Sync  : ${lastSync}` },
              { type: 'output', content: `  Enrolled   : ${enrolled}` },
              { type: 'info', content: '' }
            );
          } else {
            newOutput.push({ type: 'error', content: 'Sync information not available' });
          }
          break;

        case 'clear':
          setOutput([]);
          return;

        case 'ascii':
          newOutput.push(
            { type: 'info', content: '' },
            { type: 'ascii', content: getDjoppieAscii() },
            { type: 'info', content: '' }
          );
          break;

        case '':
          // Empty command, do nothing
          break;

        default:
          newOutput.push({
            type: 'error',
            content: `Command not found: ${command}. Type 'help' for available commands.`,
          });
      }

      setOutput((prev) => [...prev, ...newOutput]);
    },
    [liveStatus, timeline]
  );

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (currentInput.trim()) {
        setCommandHistory((prev) => [...prev, currentInput]);
        executeCommand(currentInput);
        setHistoryIndex(-1);
      }
      setCurrentInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else {
        setHistoryIndex(-1);
        setCurrentInput('');
      }
    }
  };

  return (
    <Card elevation={0} sx={terminalCardSx}>
      <CardContent sx={{ p: 0 }}>
        {/* Terminal header */}
        <Box
          onClick={() => setExpanded(!expanded)}
          sx={{
            px: 2,
            py: 1.5,
            bgcolor: '#1a1a1a',
            borderBottom: `1px solid ${TERMINAL_COLORS.border}`,
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={2} alignItems="center">
              {/* Window control dots */}
              <Stack direction="row" spacing={0.75}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ff5f56' }} />
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ffbd2e' }} />
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#27c93f' }} />
              </Stack>
              <TerminalIcon sx={{ color: TERMINAL_COLORS.text, fontSize: 18 }} />
              <Typography
                sx={{
                  ...terminalFontSx,
                  fontSize: '13px',
                  color: TERMINAL_COLORS.text,
                }}
              >
                djoppie@{displayName.substring(0, 20)}:~
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={t('terminal.minimize', 'Minimize')}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(!expanded);
                  }}
                  sx={{ color: TERMINAL_COLORS.dimText }}
                >
                  {expanded ? <MinimizeIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Tooltip>
              {expanded ? (
                <ExpandLessIcon sx={{ color: TERMINAL_COLORS.dimText }} />
              ) : (
                <ExpandMoreIcon sx={{ color: TERMINAL_COLORS.dimText }} />
              )}
            </Stack>
          </Stack>
        </Box>

        {/* Terminal content */}
        <Collapse in={expanded}>
          {/* Scanline overlay */}
          <Box
            sx={{
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  'repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 2px)',
                pointerEvents: 'none',
                zIndex: 1,
              },
            }}
          >
            {/* Output area */}
            <Box
              ref={outputRef}
              sx={{
                height: 300,
                overflowY: 'auto',
                p: 2,
                '&::-webkit-scrollbar': {
                  width: 6,
                },
                '&::-webkit-scrollbar-track': {
                  bgcolor: TERMINAL_COLORS.bg,
                },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: TERMINAL_COLORS.dimText,
                  borderRadius: 3,
                },
              }}
            >
              {output.map((line, idx) => (
                <OutputLine key={idx} type={line.type} content={line.content} />
              ))}
            </Box>

            {/* Input area */}
            <Box
              sx={{
                p: 2,
                pt: 1,
                borderTop: `1px solid ${TERMINAL_COLORS.border}`,
              }}
            >
              <TextField
                inputRef={inputRef}
                fullWidth
                variant="standard"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('terminal.placeholder', 'Type a command...')}
                InputProps={{
                  disableUnderline: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography
                        sx={{
                          ...terminalFontSx,
                          fontSize: '13px',
                          color: TERMINAL_COLORS.accent,
                        }}
                      >
                        $
                      </Typography>
                    </InputAdornment>
                  ),
                  sx: {
                    ...terminalFontSx,
                    fontSize: '13px',
                    color: TERMINAL_COLORS.text,
                    '& input': {
                      color: TERMINAL_COLORS.text,
                      caretColor: TERMINAL_COLORS.text,
                      '&::placeholder': {
                        color: TERMINAL_COLORS.dimText,
                        opacity: 0.7,
                      },
                    },
                  },
                }}
              />
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

// Djoppie ASCII art
const getDjoppieAscii = (): string => {
  return `
     ██████╗      ██╗ ██████╗ ██████╗ ██████╗ ██╗███████╗
     ██╔══██╗     ██║██╔═══██╗██╔══██╗██╔══██╗██║██╔════╝
     ██║  ██║     ██║██║   ██║██████╔╝██████╔╝██║█████╗
     ██║  ██║██   ██║██║   ██║██╔═══╝ ██╔═══╝ ██║██╔══╝
     ██████╔╝╚█████╔╝╚██████╔╝██║     ██║     ██║███████╗
     ╚═════╝  ╚════╝  ╚═════╝ ╚═╝     ╚═╝     ╚═╝╚══════╝
                 I N V E N T O R Y   T E R M I N A L
`.trim();
};

export default DeviceTerminal;

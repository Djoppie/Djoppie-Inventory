import { Paper, Typography, Stack, Box, alpha, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import type { AttentionItem } from '../../../types/report.types';

const icon = (sev: AttentionItem['severity']) => {
  if (sev === 'error') return <ErrorIcon fontSize="small" sx={{ color: '#F44336' }} />;
  if (sev === 'warning') return <WarningIcon fontSize="small" sx={{ color: '#FF9800' }} />;
  return <InfoIcon fontSize="small" sx={{ color: '#2196F3' }} />;
};

const Section = ({ title, items, color }: { title: string; items: AttentionItem[]; color: string }) => {
  const nav = useNavigate();
  return (
    <Paper sx={{ p: 2, flex: 1, borderLeft: `3px solid ${color}` }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color }}>
        {title}
      </Typography>
      <Stack spacing={1}>
        {items.length === 0 && <Typography variant="body2" color="text.secondary">Niets om te melden.</Typography>}
        {items.map((it, idx) => (
          <Box
            key={idx}
            onClick={() => nav(it.deepLinkUrl)}
            sx={{
              cursor: 'pointer',
              p: 1,
              borderRadius: 1,
              bgcolor: (t) => alpha(t.palette.background.default, 0.5),
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
            }}
          >
            {icon(it.severity)}
            <Typography variant="body2" sx={{ flex: 1 }}>{it.message}</Typography>
            <Chip label={it.count} size="small" />
          </Box>
        ))}
      </Stack>
    </Paper>
  );
};

const AttentionList = ({ items }: { items: AttentionItem[] }) => {
  const actions = items.filter(i => i.category === 'action');
  const upcoming = items.filter(i => i.category === 'upcoming');
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 1 }}>
      <Section title="⚠ Actie nodig" items={actions} color="#F44336" />
      <Section title="📅 Binnenkort" items={upcoming} color="#2196F3" />
    </Stack>
  );
};

export default AttentionList;

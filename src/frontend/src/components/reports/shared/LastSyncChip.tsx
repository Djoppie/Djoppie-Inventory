import { Chip, Tooltip, alpha } from '@mui/material';
import ScheduleIcon from '@mui/icons-material/Schedule';

interface LastSyncChipProps {
  date?: string | null;
  size?: 'small' | 'medium';
}

const formatRelative = (date: Date): { label: string; isStale: boolean } => {
  const ageMs = Date.now() - date.getTime();
  const ageDays = Math.floor(ageMs / 86400000);
  if (ageDays === 0) return { label: 'vandaag', isStale: false };
  if (ageDays === 1) return { label: 'gisteren', isStale: false };
  if (ageDays < 7) return { label: `${ageDays} d geleden`, isStale: false };
  if (ageDays < 30) return { label: `${Math.floor(ageDays / 7)} w geleden`, isStale: false };
  if (ageDays < 365) return { label: `${Math.floor(ageDays / 30)} m geleden`, isStale: true };
  return { label: `${Math.floor(ageDays / 365)} j geleden`, isStale: true };
};

const LastSyncChip = ({ date, size = 'small' }: LastSyncChipProps) => {
  if (!date) return <span style={{ fontSize: '0.75rem', color: '#999' }}>—</span>;
  const d = new Date(date);
  if (isNaN(d.getTime())) return <span style={{ fontSize: '0.75rem', color: '#999' }}>—</span>;

  const { label, isStale } = formatRelative(d);
  const color = isStale ? '#FFC107' : '#2196F3';
  const fullDate = d.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <Tooltip title={fullDate}>
      <Chip
        size={size}
        icon={<ScheduleIcon sx={{ fontSize: 12, color }} />}
        label={label}
        sx={{
          height: size === 'small' ? 20 : 26,
          fontSize: '0.68rem',
          fontWeight: 500,
          bgcolor: alpha(color, 0.1),
          color,
          '& .MuiChip-icon': { color },
        }}
      />
    </Tooltip>
  );
};

export default LastSyncChip;

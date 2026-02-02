import { ToggleButton, ToggleButtonGroup, Tooltip, Box } from '@mui/material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import TableRowsIcon from '@mui/icons-material/TableRows';

export type ViewMode = 'card' | 'table';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const ViewToggle = ({ value, onChange }: ViewToggleProps) => {
  const handleChange = (_event: React.MouseEvent<HTMLElement>, newValue: ViewMode | null) => {
    if (newValue !== null) {
      onChange(newValue);
    }
  };

  return (
    <Box>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={handleChange}
        aria-label="view mode"
        size="small"
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(0, 0, 0, 0.2)'
              : 'rgba(255, 255, 255, 0.8)',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 4px 8px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.05)'
              : '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.8)',
          '& .MuiToggleButton-root': {
            border: 'none',
            borderRadius: 0,
            px: 2,
            py: 1,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 119, 0, 0.1)'
                  : 'rgba(255, 119, 0, 0.08)',
              color: 'primary.main',
            },
            '&.Mui-selected': {
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 119, 0, 0.2)'
                  : 'rgba(255, 119, 0, 0.15)',
              color: 'primary.main',
              fontWeight: 700,
              boxShadow: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'inset 0 2px 8px rgba(255, 119, 0, 0.3)'
                  : 'inset 0 2px 4px rgba(255, 119, 0, 0.2)',
              '&:hover': {
                backgroundColor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 119, 0, 0.25)'
                    : 'rgba(255, 119, 0, 0.2)',
              },
            },
          },
        }}
      >
        <Tooltip title="Card View" arrow placement="top">
          <ToggleButton value="card" aria-label="card view">
            <ViewModuleIcon sx={{ fontSize: '1.2rem' }} />
          </ToggleButton>
        </Tooltip>
        <Tooltip title="Table View" arrow placement="top">
          <ToggleButton value="table" aria-label="table view">
            <TableRowsIcon sx={{ fontSize: '1.2rem' }} />
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>
    </Box>
  );
};

export default ViewToggle;

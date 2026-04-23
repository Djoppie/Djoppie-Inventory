import { useSearchParams } from 'react-router-dom';
import { ToggleButtonGroup, ToggleButton, Box, alpha } from '@mui/material';
import AssetsNuView from './AssetsNuView';
import AssetsHistoryView from './AssetsHistoryView';

type View = 'nu' | 'history';

const AssetsTab = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = (searchParams.get('view') as View) ?? 'nu';

  const handleChange = (_: React.MouseEvent<HTMLElement>, next: View | null) => {
    if (!next) return;
    const params = new URLSearchParams(searchParams);
    params.set('view', next);
    setSearchParams(params, { replace: true });
  };

  return (
    <Box>
      <Box sx={{ mb: 1 }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={view}
          onChange={handleChange}
          aria-label="Assets view"
          sx={{
            '& .Mui-selected': {
              bgcolor: () => alpha('#FF7700', 0.15),
              color: '#FF7700',
              fontWeight: 700,
            },
          }}
        >
          <ToggleButton value="nu" aria-label="Nu">Nu</ToggleButton>
          <ToggleButton value="history" aria-label="Historiek">Historiek</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {view === 'nu' ? <AssetsNuView /> : <AssetsHistoryView />}
    </Box>
  );
};

export default AssetsTab;

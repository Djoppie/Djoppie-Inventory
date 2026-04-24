import { useSearchParams } from 'react-router-dom';
import { Box, ToggleButtonGroup, ToggleButton, alpha } from '@mui/material';
import WerkplekkenWorkplaceView from './WerkplekkenWorkplaceView';
import WerkplekkenEmployeeView from './WerkplekkenEmployeeView';

type View = 'workplace' | 'employee';

const WerkplekkenTab = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = (searchParams.get('view') as View) ?? 'workplace';

  const handleChange = (_: React.MouseEvent<HTMLElement>, next: View | null) => {
    if (!next) return;
    const p = new URLSearchParams(searchParams);
    p.set('view', next);
    setSearchParams(p, { replace: true });
  };

  return (
    <Box>
      <Box sx={{ mb: 1 }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={view}
          onChange={handleChange}
          aria-label="Werkplekken view"
          sx={{
            '& .Mui-selected': {
              bgcolor: () => alpha('#9C27B0', 0.15),
              color: '#9C27B0',
              fontWeight: 700,
            },
          }}
        >
          <ToggleButton value="workplace" aria-label="Per Werkplek">Per Werkplek</ToggleButton>
          <ToggleButton value="employee" aria-label="Per Medewerker">Per Medewerker</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {view === 'workplace' ? <WerkplekkenWorkplaceView /> : <WerkplekkenEmployeeView />}
    </Box>
  );
};

export default WerkplekkenTab;

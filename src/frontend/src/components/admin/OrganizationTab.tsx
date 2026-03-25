import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Stack,
  Chip,
  Alert,
} from '@mui/material';
import {
  Business as SectorIcon,
  Groups as ServiceIcon,
  Desk as WorkplaceIcon,
} from '@mui/icons-material';
import { OrganizationTree } from '../organization/OrganizationTree';
import type { OrganizationSelection } from '../../types/organization.types';
import { SECTOR_COLOR, SERVICE_COLOR, WORKPLACE_COLOR } from '../../constants/filterColors';
import { alpha } from '@mui/material';

const OrganizationTab = () => {
  const [includeInactive, setIncludeInactive] = useState(false);
  const [includeWorkplaces, setIncludeWorkplaces] = useState(true);
  const [selectedNodes, setSelectedNodes] = useState<OrganizationSelection[]>([]);

  const handleSelectionChange = (selections: OrganizationSelection[]) => {
    setSelectedNodes(selections);
  };

  return (
    <Box>
      {/* Info Card */}
      <Card variant="outlined" sx={{ mb: 3, bgcolor: 'action.hover' }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Organisation Hierarchy
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View the complete organization structure: Sectors → Services → Workplaces.
            This tree can be used for filtering assets and planning rollouts.
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Chip
              icon={<SectorIcon />}
              label="Sector"
              size="small"
              sx={{ bgcolor: alpha(SECTOR_COLOR, 0.1), color: SECTOR_COLOR }}
            />
            <Chip
              icon={<ServiceIcon />}
              label="Service"
              size="small"
              sx={{ bgcolor: alpha(SERVICE_COLOR, 0.1), color: SERVICE_COLOR }}
            />
            <Chip
              icon={<WorkplaceIcon />}
              label="Workplace"
              size="small"
              sx={{ bgcolor: alpha(WORKPLACE_COLOR, 0.1), color: WORKPLACE_COLOR }}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Controls */}
      <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              size="small"
            />
          }
          label="Show inactive"
        />
        <FormControlLabel
          control={
            <Switch
              checked={includeWorkplaces}
              onChange={(e) => setIncludeWorkplaces(e.target.checked)}
              size="small"
            />
          }
          label="Show workplaces"
        />
      </Stack>

      {/* Selected nodes info */}
      {selectedNodes.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Selected: {selectedNodes.map((n) => `${n.code} (${n.nodeType})`).join(', ')}
        </Alert>
      )}

      {/* Organization Tree */}
      <OrganizationTree
        params={{
          includeInactive,
          includeWorkplaces,
          maxDepth: 3,
        }}
        onSelectionChange={handleSelectionChange}
        showSearch
        showStats
        maxHeight={500}
      />
    </Box>
  );
};

export default OrganizationTab;

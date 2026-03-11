import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Alert,
  Stack,
  CircularProgress,
  Collapse,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LaptopIcon from '@mui/icons-material/Laptop';
import ComputerIcon from '@mui/icons-material/Computer';
import DockIcon from '@mui/icons-material/Dock';
import MonitorIcon from '@mui/icons-material/Monitor';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import ClearIcon from '@mui/icons-material/Clear';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useAssetTemplates } from '../../hooks/useAssetTemplates';
import type { AssetTemplate } from '../../types/asset.types';
import type { EquipmentType } from '../../types/rollout';

interface TemplateSelectorProps {
  equipmentType: EquipmentType;
  value?: AssetTemplate | null;
  onChange: (template: AssetTemplate | null) => void;
  required?: boolean;
  label?: string;
  showAssetCodePreview?: boolean;
}

/**
 * Equipment type mapping to asset type names for filtering
 */
const EQUIPMENT_TYPE_MAPPING: Record<EquipmentType, string[]> = {
  laptop: ['Laptop', 'laptop'],
  desktop: ['Desktop', 'desktop', 'PC'],
  docking: ['Docking Station', 'Docking', 'docking'],
  monitor: ['Monitor', 'monitor', 'Screen', 'Beeldscherm'],
  keyboard: ['Keyboard', 'keyboard', 'Toetsenbord'],
  mouse: ['Mouse', 'mouse', 'Muis'],
};

/**
 * Asset type code mapping for code preview
 */
const ASSET_TYPE_CODE_MAPPING: Record<EquipmentType, string> = {
  laptop: 'LAP',
  desktop: 'DESK',
  docking: 'DOCK',
  monitor: 'MON',
  keyboard: 'KEY',
  mouse: 'MOU',
};

/**
 * Icon mapping for equipment types
 */
const EQUIPMENT_ICONS: Record<EquipmentType, React.ReactElement> = {
  laptop: <LaptopIcon />,
  desktop: <ComputerIcon />,
  docking: <DockIcon />,
  monitor: <MonitorIcon />,
  keyboard: <KeyboardIcon />,
  mouse: <MouseIcon />,
};

/**
 * Generate asset code preview with Nov/Dec rule
 */
const generateAssetCodePreview = (
  template: AssetTemplate | null,
  equipmentType: EquipmentType
): string => {
  if (!template?.brand) return '';

  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  // Apply Nov/Dec rule: if month >= 11, use next year
  const displayYear = month >= 11 ? year + 1 : year;
  const yearCode = displayYear.toString().slice(-2);

  const typeCode = ASSET_TYPE_CODE_MAPPING[equipmentType];
  const brandCode = template.brand.substring(0, 4).toUpperCase();

  return `${typeCode}-${yearCode}-${brandCode}-?????`;
};

/**
 * Enhanced template selector component with card-based UI and asset code preview
 */
export const TemplateSelector = ({
  equipmentType,
  value,
  onChange,
  required = false,
  label,
  showAssetCodePreview = true,
}: TemplateSelectorProps) => {
  const { data: templates, isLoading } = useAssetTemplates();
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreview, setShowPreview] = useState(true);

  // Filter templates by equipment type
  const filteredTemplates = useMemo(() => {
    if (!templates) return [];

    return templates.filter((template) => {
      if (!template.assetType?.name) return false;
      const allowedTypes = EQUIPMENT_TYPE_MAPPING[equipmentType] || [];
      return allowedTypes.some((type) =>
        template.assetType!.name.toLowerCase().includes(type.toLowerCase())
      );
    });
  }, [templates, equipmentType]);

  // Apply search filter
  const searchedTemplates = useMemo(() => {
    if (!searchQuery.trim()) return filteredTemplates;

    const query = searchQuery.toLowerCase();
    return filteredTemplates.filter((template) => {
      const searchableText = [
        template.brand,
        template.model,
        template.templateName,
        template.assetType?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [filteredTemplates, searchQuery]);

  // Group templates by asset type
  const groupedTemplates = useMemo(() => {
    const groups = new Map<string, AssetTemplate[]>();

    searchedTemplates.forEach((template) => {
      const typeName = template.assetType?.name || 'Onbekend';
      if (!groups.has(typeName)) {
        groups.set(typeName, []);
      }
      groups.get(typeName)!.push(template);
    });

    return Array.from(groups.entries()).map(([typeName, items]) => ({
      typeName,
      items: items.sort((a, b) => {
        const nameA = `${a.brand} ${a.model}`.toLowerCase();
        const nameB = `${b.brand} ${b.model}`.toLowerCase();
        return nameA.localeCompare(nameB);
      }),
    }));
  }, [searchedTemplates]);

  const assetCodePreview = useMemo(
    () => (value ? generateAssetCodePreview(value, equipmentType) : ''),
    [value, equipmentType]
  );

  const defaultLabel = label || `${equipmentType.charAt(0).toUpperCase() + equipmentType.slice(1)} Template`;

  const handleClearSelection = () => {
    onChange(null);
    setSearchQuery('');
  };

  return (
    <Box>
      {/* Header with label and search */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          {defaultLabel}
          {required && (
            <Typography component="span" color="error" sx={{ ml: 0.5 }}>
              *
            </Typography>
          )}
        </Typography>

        <TextField
          fullWidth
          size="small"
          placeholder="Zoek op merk, model of type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Clear selection button */}
        {value && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<ClearIcon />}
            onClick={handleClearSelection}
            sx={{ mb: 2 }}
          >
            Selectie wissen
          </Button>
        )}
      </Box>

      {/* Asset code preview */}
      {showAssetCodePreview && (
        <Collapse in={showPreview && !!value}>
          <Alert
            severity="info"
            icon={<InfoOutlinedIcon />}
            onClose={() => setShowPreview(false)}
            sx={{ mb: 2 }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Verwachte asset code:
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 700,
                color: '#FF7700',
                letterSpacing: 1,
              }}
            >
              {assetCodePreview || 'Selecteer een template om preview te zien'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Format: {ASSET_TYPE_CODE_MAPPING[equipmentType]}-YY-MERK-XXXXX
            </Typography>
          </Alert>
        </Collapse>
      )}

      {/* No template selected warning */}
      {required && !value && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Geen template geselecteerd. Merk en model zijn vereist voor asset code generatie.
        </Alert>
      )}

      {/* Loading state */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* No templates found */}
      {!isLoading && filteredTemplates.length === 0 && (
        <Alert severity="info">
          Geen templates beschikbaar voor {equipmentType}
        </Alert>
      )}

      {/* No search results */}
      {!isLoading && filteredTemplates.length > 0 && searchedTemplates.length === 0 && (
        <Alert severity="info">
          Geen templates gevonden voor "{searchQuery}"
        </Alert>
      )}

      {/* Template cards grouped by type */}
      {!isLoading && groupedTemplates.map((group) => (
        <Box key={group.typeName} sx={{ mb: 3 }}>
          <Typography
            variant="overline"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 1,
              color: 'text.secondary',
              fontWeight: 600,
            }}
          >
            {EQUIPMENT_ICONS[equipmentType]}
            {group.typeName}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 2,
            }}
          >
            {group.items.map((template) => {
              const isSelected = value?.id === template.id;

              return (
                <Card
                  key={template.id}
                  sx={{
                    border: isSelected ? 2 : 1,
                    borderColor: isSelected ? '#FF7700' : 'divider',
                    bgcolor: isSelected ? 'rgba(255, 119, 0, 0.05)' : 'background.paper',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: isSelected ? '#FF7700' : 'primary.main',
                      boxShadow: isSelected ? 3 : 2,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardActionArea onClick={() => onChange(template)}>
                    <CardContent>
                      <Stack spacing={1}>
                        {/* Brand and Model */}
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            fontSize: '1rem',
                            color: isSelected ? '#FF7700' : 'text.primary',
                          }}
                        >
                          {template.brand} {template.model}
                        </Typography>

                        {/* Template name */}
                        {template.templateName && (
                          <Typography variant="body2" color="text.secondary">
                            {template.templateName}
                          </Typography>
                        )}

                        {/* Asset type chip */}
                        {template.assetType?.name && (
                          <Chip
                            label={template.assetType.name}
                            size="small"
                            variant={isSelected ? 'filled' : 'outlined'}
                            color={isSelected ? 'primary' : 'default'}
                            sx={{
                              width: 'fit-content',
                              bgcolor: isSelected ? '#FF7700' : undefined,
                              borderColor: isSelected ? '#FF7700' : undefined,
                              color: isSelected ? 'white' : undefined,
                            }}
                          />
                        )}

                        {/* Selected indicator */}
                        {isSelected && (
                          <Chip
                            label="Geselecteerd"
                            size="small"
                            color="success"
                            sx={{ width: 'fit-content' }}
                          />
                        )}
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default TemplateSelector;

import React, { useMemo, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import {
  Search as SearchIcon,
  Business as SectorIcon,
  Groups as ServiceIcon,
  Desk as WorkplaceIcon,
  Person as EmployeeIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useOrganizationTree } from '../../hooks/useOrganization';
import type {
  OrganizationTreeNode,
  OrganizationNodeType,
  OrganizationTreeParams,
  OrganizationSelection,
} from '../../types/organization.types';
import { useTranslation } from 'react-i18next';
import { SECTOR_COLOR, EMPLOYEE_COLOR, SERVICE_COLOR, WORKPLACE_COLOR } from '../../constants/filterColors';

interface OrganizationTreeProps {
  /** Tree loading parameters */
  params?: OrganizationTreeParams;
  /** Currently selected node IDs */
  selectedIds?: string[];
  /** Called when selection changes */
  onSelectionChange?: (selections: OrganizationSelection[]) => void;
  /** Allow multiple selection */
  multiSelect?: boolean;
  /** Show search box */
  showSearch?: boolean;
  /** Show statistics */
  showStats?: boolean;
  /** Maximum height of the tree container */
  maxHeight?: number | string;
  /** Node types that can be selected (default: all) */
  selectableTypes?: OrganizationNodeType[];
  /** Compact mode (smaller text and spacing) */
  compact?: boolean;
}

const nodeTypeIcons: Record<OrganizationNodeType, React.ReactNode> = {
  sector: <SectorIcon fontSize="small" />,
  service: <ServiceIcon fontSize="small" />,
  workplace: <WorkplaceIcon fontSize="small" />,
  employee: <EmployeeIcon fontSize="small" />,
};

const nodeTypeColors: Record<OrganizationNodeType, string> = {
  sector: SECTOR_COLOR,
  service: SERVICE_COLOR,
  workplace: WORKPLACE_COLOR,
  employee: EMPLOYEE_COLOR,
};

export const OrganizationTree: React.FC<OrganizationTreeProps> = ({
  params = {},
  selectedIds = [],
  onSelectionChange,
  multiSelect = false,
  showSearch = true,
  showStats = false,
  maxHeight = 400,
  selectableTypes,
  compact = false,
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const { data, isLoading, error, refetch } = useOrganizationTree(params);

  // Filter nodes based on search term
  const filterNodes = useCallback(
    (nodes: OrganizationTreeNode[], term: string): OrganizationTreeNode[] => {
      if (!term) return nodes;
      const lowerTerm = term.toLowerCase();

      const result: OrganizationTreeNode[] = [];
      for (const node of nodes) {
        const matchesSelf =
          node.code.toLowerCase().includes(lowerTerm) ||
          node.name.toLowerCase().includes(lowerTerm);
        const filteredChildren = node.children
          ? filterNodes(node.children, term)
          : [];

        if (matchesSelf || filteredChildren.length > 0) {
          result.push({
            ...node,
            children:
              filteredChildren.length > 0 ? filteredChildren : node.children,
          });
        }
      }
      return result;
    },
    []
  );

  const filteredRoots = useMemo(() => {
    if (!data?.roots) return [];
    return filterNodes(data.roots, searchTerm);
  }, [data?.roots, searchTerm, filterNodes]);

  // Auto-expand when searching
  React.useEffect(() => {
    if (searchTerm && data?.roots) {
      const getAllNodeIds = (nodes: OrganizationTreeNode[]): string[] => {
        return nodes.flatMap((node) => [
          node.nodeId,
          ...(node.children ? getAllNodeIds(node.children) : []),
        ]);
      };
      setExpandedIds(getAllNodeIds(filteredRoots));
    }
  }, [searchTerm, filteredRoots, data?.roots]);

  const handleNodeSelect = useCallback(
    (_event: React.SyntheticEvent | null, nodeIds: string | string[] | null) => {
      if (!onSelectionChange) return;
      if (nodeIds === null) {
        onSelectionChange([]);
        return;
      }

      const ids = Array.isArray(nodeIds) ? nodeIds : [nodeIds];

      // Find all selected nodes
      const findNode = (
        nodes: OrganizationTreeNode[],
        id: string
      ): OrganizationTreeNode | null => {
        for (const node of nodes) {
          if (node.nodeId === id) return node;
          if (node.children) {
            const found = findNode(node.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const selections: OrganizationSelection[] = ids
        .map((id) => {
          const node = data?.roots ? findNode(data.roots, id) : null;
          if (!node) return null;
          if (selectableTypes && !selectableTypes.includes(node.nodeType))
            return null;
          return {
            nodeId: node.nodeId,
            nodeType: node.nodeType,
            id: node.id,
            code: node.code,
            name: node.name,
          };
        })
        .filter((s): s is OrganizationSelection => s !== null);

      onSelectionChange(selections);
    },
    [onSelectionChange, data?.roots, selectableTypes]
  );

  const renderTreeItem = useCallback(
    (node: OrganizationTreeNode) => {
      const isSelectable =
        !selectableTypes || selectableTypes.includes(node.nodeType);

      return (
        <TreeItem
          key={node.nodeId}
          itemId={node.nodeId}
          label={
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: compact ? 0.25 : 0.5,
                opacity: node.isActive ? 1 : 0.5,
              }}
            >
              <Box
                sx={{
                  color: nodeTypeColors[node.nodeType],
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {nodeTypeIcons[node.nodeType]}
              </Box>
              <Typography
                variant={compact ? 'body2' : 'body1'}
                sx={{
                  fontWeight: node.nodeType === 'sector' ? 600 : 400,
                  color: isSelectable ? 'text.primary' : 'text.disabled',
                }}
              >
                {node.code !== node.name ? `${node.code} - ${node.name}` : node.name}
              </Typography>
              {node.childCount > 0 && (
                <Chip
                  label={node.childCount}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.7rem',
                    bgcolor: 'action.hover',
                  }}
                />
              )}
              {!node.isActive && (
                <Chip
                  label="Inactief"
                  size="small"
                  color="warning"
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
              )}
            </Box>
          }
          sx={{
            '& .MuiTreeItem-content': {
              cursor: isSelectable ? 'pointer' : 'default',
            },
          }}
        >
          {node.children?.map(renderTreeItem)}
        </TreeItem>
      );
    },
    [compact, selectableTypes]
  );

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 1 }}>
        {t('common.error')}: {(error as Error).message}
      </Alert>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Search and Stats Header */}
      {(showSearch || showStats) && (
        <Box
          sx={{
            p: 1.5,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.default',
          }}
        >
          {showSearch && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder={t('common.search', 'Zoeken...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <Tooltip title={t('common.refresh', 'Vernieuwen')}>
                <IconButton size="small" onClick={() => refetch()}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}

          {showStats && data?.stats && (
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                mt: showSearch ? 1.5 : 0,
                flexWrap: 'wrap',
              }}
            >
              <Chip
                icon={<SectorIcon />}
                label={`${data.stats.activeSectors} sectoren`}
                size="small"
                variant="outlined"
                sx={{ borderColor: nodeTypeColors.sector }}
              />
              <Chip
                icon={<ServiceIcon />}
                label={`${data.stats.activeServices} diensten`}
                size="small"
                variant="outlined"
                sx={{ borderColor: nodeTypeColors.service }}
              />
              <Chip
                icon={<WorkplaceIcon />}
                label={`${data.stats.activeWorkplaces} werkplekken`}
                size="small"
                variant="outlined"
                sx={{ borderColor: nodeTypeColors.workplace }}
              />
            </Box>
          )}
        </Box>
      )}

      {/* Tree View */}
      <Box
        sx={{
          overflow: 'auto',
          maxHeight,
          p: 1,
        }}
      >
        {filteredRoots.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'center', py: 2 }}
          >
            {searchTerm
              ? t('common.noResults', 'Geen resultaten gevonden')
              : t('common.noData', 'Geen gegevens beschikbaar')}
          </Typography>
        ) : (
          <SimpleTreeView
            selectedItems={multiSelect ? selectedIds : selectedIds[0] || null}
            onSelectedItemsChange={handleNodeSelect}
            expandedItems={expandedIds}
            onExpandedItemsChange={(_event: React.SyntheticEvent | null, ids: string[]) => setExpandedIds(ids)}
            multiSelect={multiSelect}
            slots={{
              expandIcon: ChevronRightIcon,
              collapseIcon: ExpandMoreIcon,
            }}
          >
            {filteredRoots.map(renderTreeItem)}
          </SimpleTreeView>
        )}
      </Box>
    </Paper>
  );
};

export default OrganizationTree;

import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Collapse,
  Badge,
  alpha,
  useTheme,
} from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getNeumorph, getNeumorphInset } from '../../utils/neumorphicStyles';
import { ASSET_COLOR } from '../../constants/filterColors';

export interface NavSubItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  matchPaths?: string[];
  badge?: number | string;
}

export interface NavigationGroupProps {
  /** Display label for the group */
  label: string;
  /** Icon for the group header */
  icon: React.ReactNode;
  /** Primary navigation path (clicked on the header) */
  path?: string;
  /** Paths that indicate this group or its children are active */
  matchPaths?: string[];
  /** Sub-navigation items */
  subItems?: NavSubItem[];
  /** Whether sidebar is in collapsed (icon-only) mode */
  isCollapsed: boolean;
  /** Whether this section is expanded */
  isExpanded: boolean;
  /** Callback to toggle expansion */
  onToggle: () => void;
  /** Callback when navigating (e.g., to close mobile drawer) */
  onNavigate: (path: string) => void;
  /** Whether to show a pulsing badge on the icon */
  showBadge?: boolean;
  /** Whether to show a divider after this item */
  showDividerAfter?: boolean;
  /** Extra bottom margin */
  extraBottomMargin?: boolean;
}

/**
 * Reusable collapsible navigation section for the sidebar.
 * Supports collapsed (icon-only) and expanded modes, active state detection,
 * and optional sub-items with their own active state highlighting.
 */
const NavigationGroup = ({
  label,
  icon,
  path,
  matchPaths,
  subItems,
  isCollapsed,
  isExpanded,
  onToggle,
  onNavigate,
  showBadge = false,
  extraBottomMargin = false,
}: NavigationGroupProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const location = useLocation();

  const hasChildren = !!subItems && subItems.length > 0;

  // Check if a path matches the current location
  const isPathActive = useCallback(
    (itemPath?: string, itemMatchPaths?: string[]): boolean => {
      const currentPath = location.pathname;

      if (itemMatchPaths) {
        return itemMatchPaths.some((mp) => {
          if (mp === '/') return currentPath === '/';
          return currentPath.startsWith(mp);
        });
      }

      if (itemPath) {
        if (itemPath === '/' && currentPath === '/') return true;
        if (itemPath !== '/') return currentPath.startsWith(itemPath);
      }

      return false;
    },
    [location.pathname]
  );

  const active = isPathActive(path, matchPaths);
  const childActive = hasChildren
    ? subItems!.some((sub) => isPathActive(sub.path, sub.matchPaths))
    : false;
  const isHighlighted = active || childActive;

  const handleHeaderClick = useCallback(() => {
    if (path) {
      onNavigate(path);
    }
    if (hasChildren) {
      onToggle();
    }
  }, [path, hasChildren, onNavigate, onToggle]);

  const renderIcon = (iconNode: React.ReactNode) => {
    if (showBadge) {
      return (
        <Badge
          variant="dot"
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 },
              },
            },
          }}
        >
          {iconNode}
        </Badge>
      );
    }
    return iconNode;
  };

  // Shared button styles for both collapsed and expanded
  const buttonBaseSx = {
    mx: 1.5,
    my: 0.5,
    borderRadius: 2,
    minHeight: 48,
    bgcolor: isHighlighted
      ? alpha(ASSET_COLOR, isDark ? 0.15 : 0.1)
      : 'transparent',
    boxShadow: isHighlighted ? getNeumorphInset(isDark) : 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative' as const,
    '&::before': {
      content: '""',
      position: 'absolute' as const,
      left: 0,
      top: '20%',
      bottom: '20%',
      width: 3,
      borderRadius: '0 2px 2px 0',
      bgcolor: isHighlighted ? ASSET_COLOR : 'transparent',
      transition: 'all 0.3s ease',
    },
    '&:hover': {
      bgcolor: isHighlighted
        ? alpha(ASSET_COLOR, isDark ? 0.2 : 0.15)
        : alpha(ASSET_COLOR, 0.08),
      boxShadow: isHighlighted
        ? getNeumorphInset(isDark)
        : getNeumorph(isDark, 'soft'),
      transform: 'translateX(3px)',
    },
  };

  return (
    <Box sx={{ mb: extraBottomMargin ? 1 : 0 }}>
      {/* Header / Parent Item */}
      <ListItem disablePadding>
        {isCollapsed ? (
          <Tooltip title={label} placement="right" arrow>
            <ListItemButton
              onClick={handleHeaderClick}
              sx={{
                ...buttonBaseSx,
                justifyContent: 'center',
                px: 1,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  justifyContent: 'center',
                  color: isHighlighted ? ASSET_COLOR : 'inherit',
                  transition: 'all 0.3s ease',
                }}
              >
                {renderIcon(icon)}
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>
        ) : (
          <ListItemButton
            onClick={handleHeaderClick}
            sx={{
              ...buttonBaseSx,
              px: 2,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: isHighlighted ? ASSET_COLOR : 'inherit',
                transition: 'all 0.3s ease',
              }}
            >
              {renderIcon(icon)}
            </ListItemIcon>
            <ListItemText
              primary={label}
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: isHighlighted ? 700 : 600,
                color: isHighlighted ? ASSET_COLOR : 'text.primary',
              }}
            />
            {hasChildren && (
              <Box
                sx={{
                  transition: 'transform 0.3s ease',
                  color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                }}
              >
                {isExpanded ? (
                  <ExpandLessIcon fontSize="small" />
                ) : (
                  <ExpandMoreIcon fontSize="small" />
                )}
              </Box>
            )}
          </ListItemButton>
        )}
      </ListItem>

      {/* Sub Items */}
      {hasChildren && !isCollapsed && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List disablePadding sx={{ pl: 1 }}>
            {subItems!.map((subItem) => {
              const subActive = isPathActive(subItem.path, subItem.matchPaths);

              return (
                <ListItem key={subItem.path} disablePadding>
                  <ListItemButton
                    onClick={() => onNavigate(subItem.path)}
                    sx={{
                      mx: 1.5,
                      my: 0.25,
                      borderRadius: 1.5,
                      minHeight: 40,
                      pl: 5,
                      pr: 2,
                      bgcolor: subActive
                        ? alpha(ASSET_COLOR, isDark ? 0.1 : 0.08)
                        : 'transparent',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      '&:hover': {
                        bgcolor: subActive
                          ? alpha(ASSET_COLOR, isDark ? 0.15 : 0.12)
                          : alpha(ASSET_COLOR, 0.05),
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: subActive ? ASSET_COLOR : 'inherit',
                        fontSize: '0.85rem',
                        transition: 'color 0.2s ease',
                        '& .MuiSvgIcon-root': {
                          fontSize: '1.2rem',
                        },
                      }}
                    >
                      {subItem.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={subItem.label}
                      primaryTypographyProps={{
                        fontSize: '0.8rem',
                        fontWeight: subActive ? 600 : 500,
                        color: subActive ? ASSET_COLOR : 'text.secondary',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Collapse>
      )}
    </Box>
  );
};

export default NavigationGroup;

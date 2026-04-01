import { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Collapse,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  Category as CategoryIcon,
  Folder as FolderIcon,
  Sync as SyncIcon,
  AccountTree as AccountTreeIcon,
  MiscellaneousServices as MiscellaneousServicesIcon,
  People as PeopleIcon,
  Place as PlaceIcon,
  Business as BusinessIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

export interface NavigationSection {
  id: string;
  label: string;
  color: string;
  items: NavigationItem[];
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface AdminNavigationProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  sections: NavigationSection[];
}

const DRAWER_WIDTH = 280;

const AdminNavigation = ({ activeSection, onSectionChange, sections }: AdminNavigationProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDark = theme.palette.mode === 'dark';

  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(sections.map((s) => s.id))
  );

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleGroupClick = (groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleItemClick = (itemId: string) => {
    onSectionChange(itemId);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        bgcolor: isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              background: isDark
                ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                : 'linear-gradient(135deg, #FF7700 0%, #FDB931 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Administration
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            System Configuration
          </Typography>
        </Box>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle} size="small" sx={{ ml: 1 }}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 2 }}>
        <List sx={{ px: 1.5 }}>
          {sections.map((section, sectionIndex) => (
            <Box key={section.id}>
              {/* Section Group Header */}
              <ListItemButton
                onClick={() => handleGroupClick(section.id)}
                sx={{
                  borderRadius: 1.5,
                  mb: 0.5,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(section.color, 0.08),
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Typography
                      variant="overline"
                      fontWeight={700}
                      letterSpacing="0.1em"
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.75rem',
                      }}
                    >
                      {section.label}
                    </Typography>
                  }
                />
                {expandedGroups.has(section.id) ? (
                  <ExpandLess sx={{ color: section.color, fontSize: 20 }} />
                ) : (
                  <ExpandMore sx={{ color: section.color, fontSize: 20 }} />
                )}
              </ListItemButton>

              {/* Section Items */}
              <Collapse in={expandedGroups.has(section.id)} timeout="auto" unmountOnExit>
                <List disablePadding sx={{ pl: 0.5, mb: 1 }}>
                  {section.items.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                          selected={isActive}
                          onClick={() => handleItemClick(item.id)}
                          sx={{
                            borderRadius: 1.5,
                            pl: 2,
                            py: 1.25,
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: 3,
                              bgcolor: section.color,
                              transform: isActive ? 'scaleY(1)' : 'scaleY(0)',
                              transition: 'transform 0.25s ease',
                            },
                            '&:hover': {
                              bgcolor: alpha(section.color, 0.08),
                              transform: 'translateX(4px)',
                              '&::before': {
                                transform: 'scaleY(1)',
                              },
                            },
                            '&.Mui-selected': {
                              bgcolor: alpha(section.color, 0.12),
                              '&:hover': {
                                bgcolor: alpha(section.color, 0.16),
                              },
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 40,
                              color: isActive ? section.color : 'text.secondary',
                              transition: 'all 0.2s ease',
                              transform: isActive ? 'scale(1.1)' : 'scale(1)',
                              filter: isActive && isDark
                                ? `drop-shadow(0 0 8px ${alpha(section.color, 0.6)})`
                                : 'none',
                            }}
                          >
                            {item.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{
                              fontWeight: isActive ? 700 : 500,
                              fontSize: '0.9rem',
                              color: 'text.primary',
                            }}
                          />
                          {item.badge !== undefined && item.badge > 0 && (
                            <Box
                              sx={{
                                minWidth: 24,
                                height: 24,
                                borderRadius: '12px',
                                bgcolor: section.color,
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                px: 1,
                                boxShadow: isDark
                                  ? `0 2px 8px ${alpha(section.color, 0.4)}`
                                  : `0 2px 8px ${alpha(section.color, 0.3)}`,
                              }}
                            >
                              {item.badge}
                            </Box>
                          )}
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Collapse>

              {sectionIndex < sections.length - 1 && (
                <Divider sx={{ my: 2, mx: 1, opacity: 0.5 }} />
              )}
            </Box>
          ))}
        </List>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          Djoppie Inventory v2.0
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Administration Panel
        </Typography>
      </Box>
    </Box>
  );

  // Desktop: Regular box sidebar within flex container
  // Mobile: Temporary drawer
  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button */}
        <IconButton
          onClick={handleDrawerToggle}
          sx={{
            position: 'fixed',
            top: 80,
            left: 16,
            zIndex: 1300,
            bgcolor: isDark ? 'rgba(255, 215, 0, 0.12)' : 'rgba(255, 119, 0, 0.12)',
            backdropFilter: 'blur(10px)',
            border: '1px solid',
            borderColor: 'primary.main',
            '&:hover': {
              bgcolor: isDark ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 119, 0, 0.2)',
              transform: 'scale(1.05)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <MenuIcon sx={{ color: 'primary.main' }} />
        </IconButton>

        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </>
    );
  }

  // Desktop: Regular sidebar (not a drawer)
  return (
    <Box
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        borderRight: '1px solid',
        borderColor: 'divider',
      }}
    >
      {drawerContent}
    </Box>
  );
};

export default AdminNavigation;

// Export icon components for use in parent
export {
  CategoryIcon,
  FolderIcon,
  SyncIcon,
  AccountTreeIcon,
  MiscellaneousServicesIcon,
  PeopleIcon,
  PlaceIcon,
  BusinessIcon,
};

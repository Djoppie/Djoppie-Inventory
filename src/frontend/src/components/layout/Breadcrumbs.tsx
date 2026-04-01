import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { ROUTES } from '../../constants/routes';

// Route segment to label mapping
const routeLabels: Record<string, string> = {
  '': 'Dashboard',
  'devices': 'Assets',
  'assets': 'Assets',
  'new': 'Nieuw',
  'edit': 'Bewerken',
  'bulk-create': 'Bulk Aanmaken',
  'templates': 'Templates',
  'scan': 'QR Scanner',
  'admin': 'Beheer',
  'rollouts': 'Rollout Sessies',
  'execute': 'Uitvoering',
  'report': 'Rapport',
  'days': 'Dagen',
  'workplaces': 'Werkplekken',
  'laptop-swap': 'Laptop Swap',
  'history': 'Geschiedenis',
  'autopilot': 'Autopilot',
  'timeline': 'Timeline',
  'software': 'Software',
  'intune': 'Intune',
};

// Routes that should link to specific paths
const routeLinks: Record<string, string> = {
  'devices': ROUTES.DEVICE_MANAGEMENT,
  'assets': ROUTES.DEVICE_MANAGEMENT,
  'rollouts': ROUTES.ROLLOUTS,
  'workplaces': ROUTES.PHYSICAL_WORKPLACES,
  'laptop-swap': ROUTES.LAPTOP_SWAP,
  'autopilot': ROUTES.AUTOPILOT_DEVICES,
};

interface BreadcrumbItem {
  label: string;
  path: string | null;
  isLast: boolean;
}

const Breadcrumbs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const breadcrumbs = useMemo((): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);

    // Dashboard is always first
    const items: BreadcrumbItem[] = [
      {
        label: 'Dashboard',
        path: ROUTES.DASHBOARD,
        isLast: pathSegments.length === 0,
      },
    ];

    // Build breadcrumb path progressively
    let currentPath = '';

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      // Check if this is a dynamic parameter (numeric ID or specific param)
      const isNumeric = /^\d+$/.test(segment);
      const isParam = Object.values(params).includes(segment);

      let label = routeLabels[segment] || segment;
      let path: string | null = currentPath;

      // Handle dynamic segments
      if (isNumeric || isParam) {
        // For IDs, show a more descriptive label
        const prevSegment = pathSegments[index - 1];
        if (prevSegment === 'assets' || prevSegment === 'devices') {
          label = `Asset #${segment}`;
        } else if (prevSegment === 'rollouts') {
          label = `Sessie #${segment}`;
        } else if (prevSegment === 'days') {
          label = `Dag #${segment}`;
        } else if (prevSegment === 'workplaces') {
          label = `Werkplek #${segment}`;
        } else if (prevSegment === 'timeline') {
          label = segment; // Serial number
        } else {
          label = `#${segment}`;
        }
      }

      // Use predefined links for certain segments
      if (routeLinks[segment]) {
        path = routeLinks[segment];
      }

      // Last item shouldn't be clickable
      if (isLast) {
        path = null;
      }

      items.push({
        label,
        path,
        isLast,
      });
    });

    return items;
  }, [location.pathname, params]);

  // Don't show breadcrumbs on dashboard (only home)
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <Box
      sx={{
        py: 1.5,
        px: 0.5,
      }}
    >
      <MuiBreadcrumbs
        separator={
          <NavigateNextIcon
            sx={{
              fontSize: 16,
              color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
            }}
          />
        }
        sx={{
          '& .MuiBreadcrumbs-ol': {
            flexWrap: 'nowrap',
          },
        }}
      >
        {breadcrumbs.map((item, index) => {
          const isFirst = index === 0;

          if (item.isLast) {
            // Current page - not clickable
            return (
              <Typography
                key={item.path || item.label}
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  color: '#FF7700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                {item.label}
              </Typography>
            );
          }

          // Clickable breadcrumb
          return (
            <Link
              key={item.path || item.label}
              component="button"
              variant="body2"
              onClick={() => item.path && navigate(item.path)}
              underline="hover"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: '0.8rem',
                fontWeight: 500,
                color: 'text.secondary',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: '#FF7700',
                },
              }}
            >
              {isFirst && (
                <HomeIcon
                  sx={{
                    fontSize: 16,
                    opacity: 0.8,
                  }}
                />
              )}
              {item.label}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
};

export default Breadcrumbs;

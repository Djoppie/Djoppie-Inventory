import { ReactNode } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  Breadcrumbs,
  Link,
  alpha,
  useTheme,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

export interface QuickStat {
  label: string;
  value: number | string;
  color?: string;
  icon?: ReactNode;
}

interface AdminSectionProps {
  sectionId: string;
  title: string;
  description: string;
  icon: ReactNode;
  color: string;
  quickStats?: QuickStat[];
  children: ReactNode;
}

const AdminSection = ({
  sectionId: _sectionId,
  title,
  description,
  icon,
  color,
  quickStats = [],
  children,
}: AdminSectionProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
          sx={{
            '& .MuiBreadcrumbs-separator': {
              color: 'text.secondary',
            },
          }}
        >
          <Link
            underline="hover"
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: 'text.secondary',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'color 0.2s ease',
              '&:hover': {
                color: 'primary.main',
              },
            }}
            href="#"
          >
            <AdminPanelSettingsIcon sx={{ mr: 0.5, fontSize: 18 }} />
            Administration
          </Link>
          <Typography
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: color,
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            {title}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Section Header Card */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: color,
            boxShadow: isDark
              ? `0 8px 32px ${alpha(color, 0.2)}, inset 0 0 24px ${alpha(color, 0.05)}`
              : `0 4px 20px ${alpha(color, 0.25)}`,
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            {/* Icon */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: 2,
                border: '2px solid',
                borderColor: alpha(color, 0.3),
                bgcolor: alpha(color, 0.08),
                transition: 'all 0.3s ease',
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  color: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                  filter: isDark ? `drop-shadow(0 0 6px ${alpha(color, 0.5)})` : 'none',
                  '& > *': {
                    fontSize: 'inherit',
                  },
                }}
              >
                {icon}
              </Box>
            </Box>

            {/* Title & Description */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h5"
                component="h2"
                fontWeight={700}
                sx={{
                  color: color,
                  mb: 0.5,
                }}
              >
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            </Box>
          </Stack>

          {/* Quick Stats */}
          {quickStats.length > 0 && (
            <Stack
              direction="row"
              spacing={2}
              sx={{
                mt: 3,
                pt: 3,
                borderTop: '1px solid',
                borderColor: 'divider',
                flexWrap: 'wrap',
                gap: 1.5,
              }}
            >
              {quickStats.map((stat, index) => (
                <Chip
                  key={index}
                  icon={stat.icon as React.ReactElement | undefined}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        {stat.label}:
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {stat.value}
                      </Typography>
                    </Box>
                  }
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    py: 2,
                    px: 1,
                    height: 'auto',
                    borderColor: alpha(stat.color || color, 0.3),
                    bgcolor: alpha(stat.color || color, 0.05),
                    transition: 'all 0.2s ease',
                    '& .MuiChip-icon': {
                      color: stat.color || color,
                      fontSize: 20,
                    },
                    '&:hover': {
                      borderColor: stat.color || color,
                      bgcolor: alpha(stat.color || color, 0.1),
                      transform: 'translateY(-2px)',
                      boxShadow: isDark
                        ? `0 4px 12px ${alpha(stat.color || color, 0.3)}`
                        : `0 4px 12px ${alpha(stat.color || color, 0.2)}`,
                    },
                  }}
                />
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Section Content */}
      <Box>{children}</Box>
    </Box>
  );
};

export default AdminSection;

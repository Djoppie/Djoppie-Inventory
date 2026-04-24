import React from 'react';
import { Box, Typography, useTheme, alpha, Fade } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { getNeumorph, getNeumorphColors } from '../../../utils/neumorphicStyles';

interface DashboardSectionProps {
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  route: string;
  children: React.ReactNode;
  span?: 1 | 2;
  delay?: number;
  /** When true, highlights the section to indicate the dashboard filter is narrowing its data */
  filterActive?: boolean;
  /** If true, the section is not affected by the dashboard filter — rendered dimmed */
  filterIgnored?: boolean;
}

const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  icon,
  accentColor,
  route,
  children,
  span = 1,
  delay = 0,
  filterActive = false,
  filterIgnored = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const { bgSurface } = getNeumorphColors(isDark);

  const handleHeaderClick = () => {
    navigate(route);
  };

  return (
    <Fade in timeout={500 + delay}>
      <Box
        sx={{
          gridColumn: { xs: 'span 1', md: `span ${span}` },
          borderRadius: 3,
          bgcolor: bgSurface,
          boxShadow: getNeumorph(isDark, 'medium'),
          overflow: 'hidden',
          transition: 'all 0.3s ease, opacity 0.3s ease, filter 0.3s ease',
          opacity: filterIgnored ? 0.55 : 1,
          filter: filterIgnored ? 'saturate(0.5)' : 'none',
          // Subtle ring when the filter actively narrows this section's data
          ...(filterActive && !filterIgnored && {
            outline: `1px solid ${alpha(accentColor, 0.35)}`,
            outlineOffset: -1,
          }),
          '&:hover': {
            opacity: 1,
            filter: 'none',
            boxShadow: isDark
              ? `8px 8px 20px rgba(0,0,0,0.5), -4px -4px 12px rgba(255,255,255,0.05)`
              : `8px 8px 20px rgba(0,0,0,0.12), -4px -4px 12px rgba(255,255,255,0.9)`,
          },
        }}
      >
        {/* Colored Top Border — brighter + thicker when filter is focusing this section */}
        <Box
          sx={{
            height: filterActive && !filterIgnored ? 5 : 4,
            background: filterActive && !filterIgnored
              ? `linear-gradient(90deg, ${accentColor}, ${alpha(accentColor, 0.9)}, ${accentColor})`
              : `linear-gradient(90deg, ${accentColor}, ${alpha(accentColor, 0.6)})`,
            boxShadow: filterActive && !filterIgnored
              ? `0 0 12px ${alpha(accentColor, 0.5)}`
              : 'none',
            transition: 'all 0.3s ease',
          }}
        />

        {/* Section Header */}
        <Box
          onClick={handleHeaderClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2.5,
            py: 2,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: alpha(accentColor, 0.08),
              '& .section-chevron': {
                transform: 'translateX(4px)',
                opacity: 1,
              },
            },
          }}
        >
          {/* Icon Container */}
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(accentColor, 0.15),
              color: accentColor,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>

          {/* Title */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: '1rem',
              color: isDark ? '#fff' : '#1a1a2e',
              flex: 1,
            }}
          >
            {title}
          </Typography>

          {/* Filter badges */}
          {filterActive && !filterIgnored && (
            <Box
              sx={{
                fontSize: '0.58rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                px: 0.85,
                py: 0.25,
                borderRadius: 999,
                bgcolor: alpha(accentColor, 0.18),
                color: accentColor,
                border: `1px solid ${alpha(accentColor, 0.35)}`,
              }}
            >
              Gefilterd
            </Box>
          )}
          {filterIgnored && (
            <Box
              sx={{
                fontSize: '0.58rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                px: 0.85,
                py: 0.25,
                borderRadius: 999,
                bgcolor: isDark ? alpha('#ffffff', 0.05) : alpha('#000000', 0.05),
                color: isDark ? alpha('#ffffff', 0.5) : alpha('#000000', 0.5),
                border: '1px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              }}
            >
              Niet beïnvloed
            </Box>
          )}

          {/* Chevron */}
          <ChevronRightIcon
            className="section-chevron"
            sx={{
              color: accentColor,
              opacity: 0.5,
              transition: 'all 0.2s ease',
            }}
          />
        </Box>

        {/* Content */}
        <Box sx={{ px: 2.5, pb: 2.5 }}>
          {children}
        </Box>
      </Box>
    </Fade>
  );
};

export default DashboardSection;

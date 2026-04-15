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
}

const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  icon,
  accentColor,
  route,
  children,
  span = 1,
  delay = 0,
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
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: isDark
              ? `8px 8px 20px rgba(0,0,0,0.5), -4px -4px 12px rgba(255,255,255,0.05)`
              : `8px 8px 20px rgba(0,0,0,0.12), -4px -4px 12px rgba(255,255,255,0.9)`,
          },
        }}
      >
        {/* Colored Top Border */}
        <Box
          sx={{
            height: 4,
            background: `linear-gradient(90deg, ${accentColor}, ${alpha(accentColor, 0.6)})`,
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

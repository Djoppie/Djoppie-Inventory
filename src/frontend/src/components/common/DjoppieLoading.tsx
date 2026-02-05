import { Box, Typography, keyframes, useTheme } from '@mui/material';
import { useState, useEffect } from 'react';
import DjoppieLogo from './DjoppieLogo';

// Orbital arc rotation
const orbitSweep = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

// Counter-rotating inner ring
const orbitSweepReverse = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(-360deg);
  }
`;

// Gentle float for the logo
const gentleFloat = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
`;

// Fade cycle for messages
const messageFade = keyframes`
  0% {
    opacity: 0;
    transform: translateY(4px);
  }
  15% {
    opacity: 1;
    transform: translateY(0);
  }
  85% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-4px);
  }
`;

// Staggered dot bounce
const dotBounce = keyframes`
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.3;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
`;

// Subtle ambient pulse on the container
const ambientPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 119, 0, 0);
  }
  50% {
    box-shadow: 0 0 40px 0 rgba(255, 119, 0, 0.06);
  }
`;

interface DjoppieLoadingProps {
  message?: string;
  fullScreen?: boolean;
}

const LOADING_MESSAGES = [
  'Loading inventory...',
  'Scanning assets...',
  'Syncing data...',
  'Almost ready...',
  'Organizing records...',
  'Fetching details...',
];

const DjoppieLoading = ({
  message,
  fullScreen = false,
}: DjoppieLoadingProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [messageIndex, setMessageIndex] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    if (message) return; // Don't rotate if custom message provided
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      setFadeKey((prev) => prev + 1);
    }, 2800);
    return () => clearInterval(interval);
  }, [message]);

  const displayMessage = message || LOADING_MESSAGES[messageIndex];
  const primaryColor = theme.palette.primary.main;
  const ringSize = 140;
  const logoSize = 72;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: fullScreen ? '100vh' : '320px',
        gap: 3,
        position: fullScreen ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: fullScreen
          ? 'background.default'
          : 'transparent',
        zIndex: fullScreen ? 9999 : 'auto',
      }}
    >
      {/* Orbital ring container */}
      <Box
        sx={{
          position: 'relative',
          width: ringSize,
          height: ringSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: `${ambientPulse} 3s ease-in-out infinite`,
        }}
      >
        {/* Outer orbital arc */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            animation: `${orbitSweep} 2.4s linear infinite`,
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `2.5px solid transparent`,
              borderTopColor: primaryColor,
              borderRightColor: isDark
                ? 'rgba(255, 146, 51, 0.3)'
                : 'rgba(255, 119, 0, 0.2)',
              filter: `drop-shadow(0 0 6px ${isDark ? 'rgba(255, 146, 51, 0.4)' : 'rgba(255, 119, 0, 0.3)'})`,
            },
          }}
        />

        {/* Inner orbital arc (counter-rotating) */}
        <Box
          sx={{
            position: 'absolute',
            inset: 10,
            borderRadius: '50%',
            animation: `${orbitSweepReverse} 1.8s linear infinite`,
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `2px solid transparent`,
              borderBottomColor: isDark
                ? 'rgba(255, 146, 51, 0.5)'
                : 'rgba(255, 119, 0, 0.35)',
              borderLeftColor: isDark
                ? 'rgba(255, 146, 51, 0.15)'
                : 'rgba(255, 119, 0, 0.1)',
            },
          }}
        />

        {/* Subtle static track ring */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: isDark
              ? '1px solid rgba(255, 255, 255, 0.04)'
              : '1px solid rgba(0, 0, 0, 0.06)',
          }}
        />

        {/* Logo container with float */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            animation: `${gentleFloat} 3s ease-in-out infinite`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DjoppieLogo size={logoSize} animate intensity="low" />
        </Box>
      </Box>

      {/* Loading dots */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          height: 10,
        }}
      >
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: primaryColor,
              animation: `${dotBounce} 1.2s ease-in-out infinite`,
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </Box>

      {/* Message */}
      <Typography
        key={message ? 'static' : fadeKey}
        variant="body2"
        sx={{
          color: 'text.secondary',
          fontWeight: 500,
          letterSpacing: '0.02em',
          textAlign: 'center',
          fontSize: '0.875rem',
          minHeight: '1.5em',
          animation: message ? 'none' : `${messageFade} 2.8s ease-in-out`,
        }}
      >
        {displayMessage}
      </Typography>
    </Box>
  );
};

export default DjoppieLoading;

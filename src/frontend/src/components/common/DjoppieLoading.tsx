import { Box, Typography, keyframes } from '@mui/material';
import { useState, useEffect } from 'react';
import DjoppieLogo from './DjoppieLogo';

// Subtle breathing animation for Djoppie
const subtleBreath = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
`;

// Scanning beam that moves vertically across QR code
const scanBeam = keyframes`
  0% {
    transform: translateY(-100%);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(100%);
    opacity: 0;
  }
`;

// Eye glow intensifies during scan
const scanningEyeGlow = keyframes`
  0%, 100% {
    filter: brightness(1) drop-shadow(0 0 8px rgba(255, 119, 0, 0.6));
  }
  50% {
    filter: brightness(1.5) drop-shadow(0 0 16px rgba(255, 119, 0, 1));
  }
`;

// QR code pixels appearing
const pixelAppear = keyframes`
  0% {
    opacity: 0;
    transform: scale(0);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`;

// Data stream effect
const dataStream = keyframes`
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateX(100%);
    opacity: 0;
  }
`;

// Subtle pulse for loading text
const subtlePulse = keyframes`
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
`;

interface DjoppieLoadingProps {
  message?: string;
  fullScreen?: boolean;
  bootSequence?: boolean;
  partyMode?: boolean;
}

const FUN_MESSAGES = [
  'Counting inventory boxes...',
  'Waking up Djoppie...',
  'Charging robot batteries...',
  'Scanning QR codes...',
  'Organizing assets...',
  'Brewing coffee for the team...',
  'Doing robot gymnastics...',
  'Polishing metallic surfaces...',
];

const DjoppieLoading = ({
  message,
  fullScreen = false,
  bootSequence = false,
  partyMode = false,
}: DjoppieLoadingProps) => {
  const [funMessage, setFunMessage] = useState(FUN_MESSAGES[0]);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    // Rotate through fun messages
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % FUN_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setFunMessage(FUN_MESSAGES[messageIndex]);
  }, [messageIndex]);

  // Subtle scanning animation - Djoppie scanning a QR code
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: fullScreen ? '100vh' : '300px',
        gap: 2.5,
        position: fullScreen ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: fullScreen ? 'background.default' : 'transparent',
        backdropFilter: fullScreen ? 'blur(10px)' : 'none',
        zIndex: fullScreen ? 9999 : 'auto',
        overflow: 'hidden',
      }}
    >
      {/* Main Container - Djoppie and QR Code side by side */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          position: 'relative',
        }}
      >
        {/* Djoppie with subtle breathing and eye glow */}
        <Box
          sx={{
            position: 'relative',
            animation: `${subtleBreath} 3s ease-in-out infinite`,
            '& #djoppie-logo': {
              animation: `${scanningEyeGlow} 2s ease-in-out infinite`,
            },
          }}
        >
          <DjoppieLogo size={100} animate intensity="medium" />
        </Box>

        {/* Scanning beam connecting eyes to QR code */}
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '42%',
            width: '80px',
            height: '2px',
            background: 'linear-gradient(90deg, rgba(255, 119, 0, 0.9), rgba(255, 119, 0, 0.3))',
            transform: 'translateY(-50%)',
            opacity: 0.7,
            animation: `${subtlePulse} 1.5s ease-in-out infinite`,
            boxShadow: '0 0 8px rgba(255, 119, 0, 0.7)',
            '&::after': {
              content: '""',
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid rgba(255, 119, 0, 0.9)',
              borderTop: '4px solid transparent',
              borderBottom: '4px solid transparent',
            },
          }}
        />

        {/* QR Code Being Scanned */}
        <Box
          sx={{
            position: 'relative',
            width: '90px',
            height: '90px',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--neu-shadow-light-md)',
            padding: 1.5,
            border: '2px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          {/* QR Code Pattern - Higher resolution */}
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gridTemplateRows: 'repeat(7, 1fr)',
              gap: '1px',
            }}
          >
            {/* Generate more realistic QR-like pattern */}
            {[...Array(49)].map((_, i) => {
              // More realistic QR pattern with finder patterns in corners
              const row = Math.floor(i / 7);
              const col = i % 7;
              const isCorner =
                (row < 3 && col < 3) || // Top-left
                (row < 3 && col > 3) || // Top-right
                (row > 3 && col < 3);   // Bottom-left

              const isFinderPattern = isCorner && (
                (row === 0 || row === 2 || col === 0 || col === 2) ||
                (row === 1 && col === 1)
              );

              const isDataPattern = !isCorner && Math.random() > 0.45;

              const isBlack = isFinderPattern || isDataPattern;

              return (
                <Box
                  key={i}
                  sx={{
                    backgroundColor: isBlack ? '#000000' : 'transparent',
                    borderRadius: '1px',
                    animation: `${pixelAppear} 0.4s ease-out ${i * 0.015}s both`,
                  }}
                />
              );
            })}
          </Box>

          {/* Scanning Beam Effect - More prominent */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, transparent, rgba(255, 119, 0, 0.9), transparent)',
              boxShadow: '0 0 12px rgba(255, 119, 0, 0.9), 0 0 6px rgba(255, 119, 0, 0.6)',
              animation: `${scanBeam} 2.5s ease-in-out infinite`,
              filter: 'blur(0.5px)',
            }}
          />

          {/* Success flash on complete scan */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'var(--radius-md)',
              border: '2px solid transparent',
              animation: 'successFlash 2.5s ease-in-out infinite',
              '@keyframes successFlash': {
                '0%, 85%': {
                  borderColor: 'transparent',
                  opacity: 0,
                },
                '90%': {
                  borderColor: 'rgba(76, 175, 80, 0.8)',
                  opacity: 1,
                },
                '95%, 100%': {
                  borderColor: 'transparent',
                  opacity: 0,
                },
              },
            }}
          />
        </Box>
      </Box>

      {/* Minimal Data Indicator */}
      <Box
        sx={{
          display: 'flex',
          gap: 0.75,
          alignItems: 'center',
          height: '12px',
        }}
      >
        {[...Array(4)].map((_, i) => (
          <Box
            key={i}
            sx={{
              width: 3,
              height: 3,
              borderRadius: '50%',
              backgroundColor: 'primary.main',
              animation: `${subtlePulse} 1.2s ease-in-out infinite`,
              animationDelay: `${i * 0.15}s`,
              boxShadow: '0 0 4px rgba(255, 119, 0, 0.6)',
            }}
          />
        ))}
      </Box>

      {/* Loading Message */}
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          fontWeight: 500,
          letterSpacing: '0.03em',
          textAlign: 'center',
          fontSize: '0.875rem',
          animation: `${subtlePulse} 2s ease-in-out infinite`,
        }}
      >
        {message || funMessage}
      </Typography>
    </Box>
  );
};

export default DjoppieLoading;

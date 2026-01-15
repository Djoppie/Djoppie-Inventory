import { Box, Typography, keyframes, LinearProgress } from '@mui/material';
import { useState, useEffect } from 'react';
import DjoppieLogo from './DjoppieLogo';

// Advanced animation keyframes
const bootTextAppear = keyframes`
  0% {
    opacity: 0;
    transform: translateX(-20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
`;

const scanlineSweep = keyframes`
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100vh);
  }
`;

const statusBlink = keyframes`
  0%, 49% {
    opacity: 1;
  }
  50%, 100% {
    opacity: 0.3;
  }
`;

const glitchEffect = keyframes`
  0%, 90%, 100% {
    transform: translate(0, 0);
    filter: hue-rotate(0deg);
  }
  92% {
    transform: translate(-2px, 1px);
    filter: hue-rotate(90deg);
  }
  94% {
    transform: translate(2px, -1px);
    filter: hue-rotate(-90deg);
  }
  96% {
    transform: translate(-1px, 2px);
    filter: hue-rotate(45deg);
  }
`;

const matrixRain = keyframes`
  0% {
    transform: translateY(-100%);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh);
    opacity: 0;
  }
`;

const energyPulse = keyframes`
  0%, 100% {
    box-shadow:
      0 0 10px rgba(255, 215, 0, 0.3),
      inset 0 0 10px rgba(255, 215, 0, 0.1);
  }
  50% {
    box-shadow:
      0 0 25px rgba(255, 215, 0, 0.6),
      inset 0 0 20px rgba(255, 215, 0, 0.2);
  }
`;

const funBounce = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

interface DjoppieLoadingProps {
  message?: string;
  fullScreen?: boolean;
  bootSequence?: boolean;
  partyMode?: boolean;
}

interface SystemCheck {
  id: string;
  label: string;
  delay: number;
}

const SYSTEM_CHECKS: SystemCheck[] = [
  { id: 'init', label: '[INIT] Initializing Djoppie Core Systems', delay: 0 },
  { id: 'memory', label: '[MEM] Allocating memory buffers', delay: 300 },
  { id: 'neural', label: '[AI] Loading neural pathways', delay: 600 },
  { id: 'database', label: '[DB] Connecting to inventory database', delay: 900 },
  { id: 'auth', label: '[AUTH] Verifying security protocols', delay: 1200 },
  { id: 'graphics', label: '[GFX] Rendering holographic interface', delay: 1500 },
  { id: 'ready', label: '[SYS] All systems operational', delay: 1800 },
];

const DjoppieLoading = ({
  message = '[EXEC] Processing request...',
  fullScreen = false,
  bootSequence = false,
  partyMode = false,
}: DjoppieLoadingProps) => {
  const [completedChecks, setCompletedChecks] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every second for boot sequence
    if (bootSequence) {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [bootSequence]);

  useEffect(() => {
    if (!bootSequence) return;

    // Simulate boot sequence
    SYSTEM_CHECKS.forEach((check) => {
      setTimeout(() => {
        setCompletedChecks((prev) => [...prev, check.id]);
        setProgress((prev) => Math.min(prev + (100 / SYSTEM_CHECKS.length), 100));
      }, check.delay);
    });
  }, [bootSequence]);

  if (bootSequence) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: fullScreen ? '100vh' : '400px',
          position: fullScreen ? 'fixed' : 'relative',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(10, 14, 39, 0.98)',
          backdropFilter: 'blur(12px)',
          zIndex: fullScreen ? 9999 : 'auto',
          overflow: 'hidden',
        }}
      >
        {/* Animated Scanline Effect */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #FFD700, transparent)',
            animation: `${scanlineSweep} 3s linear infinite`,
            opacity: 0.3,
          }}
        />

        {/* Matrix Rain Effect (subtle) */}
        {[...Array(8)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              left: `${i * 12.5}%`,
              width: '2px',
              height: '100px',
              background: 'linear-gradient(transparent, #FFD700, transparent)',
              animation: `${matrixRain} ${3 + i * 0.3}s linear infinite`,
              animationDelay: `${i * 0.2}s`,
              opacity: 0.1,
            }}
          />
        ))}

        {/* Main Content */}
        <Box
          sx={{
            width: '100%',
            maxWidth: '800px',
            px: 4,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Header with Time */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mb: 4,
              pb: 2,
              borderBottom: '2px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="overline"
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                fontSize: '1.1rem',
                letterSpacing: '0.1em',
                animation: `${glitchEffect} 5s ease-in-out infinite`,
              }}
            >
              DJOPPIE OS v1.0.0
            </Typography>
            <Typography
              variant="overline"
              sx={{
                color: 'success.main',
                fontWeight: 600,
                fontSize: '0.9rem',
                fontFamily: 'monospace',
              }}
            >
              {currentTime.toLocaleTimeString()}
            </Typography>
          </Box>

          {/* Animated Logo - BIGGER AND COOLER! */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 4,
            }}
          >
            <DjoppieLogo size={180} animate intensity="party" />
          </Box>

          {/* System Checks */}
          <Box
            sx={{
              mb: 4,
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              animation: `${energyPulse} 2s ease-in-out infinite`,
            }}
          >
            {SYSTEM_CHECKS.map((check, index) => {
              const isCompleted = completedChecks.includes(check.id);
              const isActive = completedChecks.length === index;

              return (
                <Box
                  key={check.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mb: 1.5,
                    opacity: isCompleted ? 1 : isActive ? 0.8 : 0.3,
                    animation: isCompleted ? `${bootTextAppear} 0.3s ease-out` : 'none',
                  }}
                >
                  {/* Status Indicator */}
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: isCompleted ? 'success.main' : isActive ? 'warning.main' : 'text.disabled',
                      animation: isActive ? `${statusBlink} 0.8s infinite` : 'none',
                      boxShadow: isCompleted
                        ? '0 0 8px rgba(0, 255, 136, 0.6)'
                        : isActive
                        ? '0 0 8px rgba(255, 184, 108, 0.6)'
                        : 'none',
                    }}
                  />

                  {/* Check Label */}
                  <Typography
                    variant="body2"
                    sx={{
                      color: isCompleted ? 'success.main' : isActive ? 'warning.main' : 'text.secondary',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {check.label}
                  </Typography>

                  {/* OK Badge */}
                  {isCompleted && (
                    <Typography
                      variant="caption"
                      sx={{
                        ml: 'auto',
                        px: 1.5,
                        py: 0.25,
                        bgcolor: 'success.main',
                        color: 'background.paper',
                        fontWeight: 700,
                        borderRadius: 0.5,
                        fontSize: '0.7rem',
                        letterSpacing: '0.1em',
                      }}
                    >
                      OK
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>

          {/* Progress Bar */}
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                }}
              >
                BOOT PROGRESS
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'primary.main',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                }}
              >
                {Math.round(progress)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 1,
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #FFD700, #FDB931, #E07B28)',
                  boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
                  borderRadius: 1,
                },
              }}
            />
          </Box>

          {/* Footer Status */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 1,
              alignItems: 'center',
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'success.main',
                animation: `${statusBlink} 1s ease-in-out infinite`,
                boxShadow: '0 0 8px rgba(0, 255, 136, 0.6)',
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: 'success.main',
                letterSpacing: '0.1em',
                fontWeight: 600,
              }}
            >
              ONLINE
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  // Standard loading (non-boot sequence) - BIGGER DJOPPIE!
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: fullScreen ? '100vh' : '400px',
        gap: 3,
        position: fullScreen ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: fullScreen ? 'rgba(10, 14, 39, 0.98)' : 'transparent',
        backdropFilter: fullScreen ? 'blur(8px)' : 'none',
        zIndex: fullScreen ? 9999 : 'auto',
      }}
    >
      {/* Animated Djoppie Logo - EVEN BIGGER! */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          animation: `${funBounce} 2s ease-in-out infinite`,
        }}
      >
        <DjoppieLogo size={160} animate intensity={partyMode ? 'party' : 'high'} />
      </Box>

      {/* Console-style Message */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: 'secondary.main',
            fontWeight: 700,
            letterSpacing: '0.05em',
            animation: `${statusBlink} 2s ease-in-out infinite`,
            textAlign: 'center',
            textShadow: '0 0 10px rgba(224, 123, 40, 0.5)',
          }}
        >
          {message}
        </Typography>

        {/* Loading Dots (console style) */}
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          {[0, 1, 2].map((i) => (
            <Typography
              key={i}
              component="span"
              sx={{
                color: 'primary.main',
                fontSize: '2rem',
                fontWeight: 700,
                animation: `${statusBlink} 1.4s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
                textShadow: '0 0 12px rgba(255, 215, 0, 0.6)',
              }}
            >
              .
            </Typography>
          ))}
        </Box>
      </Box>

      {/* System indicator */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          mt: 2,
          px: 2,
          py: 1,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          animation: `${energyPulse} 2s ease-in-out infinite`,
        }}
      >
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: 'success.main',
            animation: `${statusBlink} 1s ease-in-out infinite`,
            boxShadow: '0 0 10px rgba(0, 255, 136, 0.8)',
          }}
        />
        <Typography
          variant="body2"
          sx={{
            color: 'success.main',
            letterSpacing: '0.1em',
            fontWeight: 700,
            textShadow: '0 0 8px rgba(0, 255, 136, 0.5)',
          }}
        >
          SYSTEM READY
        </Typography>
      </Box>
    </Box>
  );
};

export default DjoppieLoading;

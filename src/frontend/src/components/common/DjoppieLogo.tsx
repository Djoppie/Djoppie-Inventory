import { Box, keyframes } from '@mui/material';
import { useState } from 'react';

// Modern 3D floating animation with perspective
const float3D = keyframes`
  0%, 100% {
    transform: translateY(0) rotateX(0deg) rotateY(0deg);
  }
  25% {
    transform: translateY(-8px) rotateX(5deg) rotateY(-3deg);
  }
  50% {
    transform: translateY(-12px) rotateX(0deg) rotateY(0deg);
  }
  75% {
    transform: translateY(-8px) rotateX(-5deg) rotateY(3deg);
  }
`;

// Advanced eye glow with brightness and blur
const modernEyeGlow = keyframes`
  0%, 100% {
    filter: brightness(1) drop-shadow(0 0 4px rgba(255, 215, 0, 0.6));
    opacity: 0.85;
  }
  50% {
    filter: brightness(1.3) drop-shadow(0 0 8px rgba(255, 215, 0, 0.9));
    opacity: 1;
  }
`;

// Pulsing ring animation with scale and opacity
const ringPulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.9;
  }
`;

// Gentle head tilt animation
const headTilt = keyframes`
  0%, 100% {
    transform: rotate(0deg) translateY(0);
  }
  25% {
    transform: rotate(-2deg) translateY(-2px);
  }
  50% {
    transform: rotate(0deg) translateY(0);
  }
  75% {
    transform: rotate(2deg) translateY(-2px);
  }
`;

// Smooth eye scanning animation
const eyeScan = keyframes`
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  20% {
    transform: translate(3px, -1px) scale(1.05);
  }
  40% {
    transform: translate(0, 0) scale(1);
  }
  60% {
    transform: translate(-3px, -1px) scale(1.05);
  }
  80% {
    transform: translate(0, 0) scale(1);
  }
`;

// Ambient glow effect
const ambientGlow = keyframes`
  0%, 100% {
    filter: drop-shadow(0 0 10px rgba(255, 168, 65, 0.3));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(255, 168, 65, 0.6));
  }
`;

interface DjoppieLogoProps {
  size?: number;
  animate?: boolean;
  intensity?: 'low' | 'medium' | 'high' | 'party';
  headerMode?: boolean;
  headOnly?: boolean;
}

const DjoppieLogo = ({ size = 80, animate = true, intensity = 'high', headerMode = false, headOnly = false }: DjoppieLogoProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const animationDuration = intensity === 'high' ? 3 : intensity === 'medium' ? 4 : 5;

  // Head-only mode with focused viewport
  const viewBox = headOnly ? "30 20 140 100" : "0 0 200 200";

  return (
    <Box
      id="djoppie-logo"
      onMouseEnter={() => !headerMode && setIsHovered(true)}
      onMouseLeave={() => !headerMode && setIsHovered(false)}
      sx={{
        width: size,
        height: size,
        perspective: '1000px',
        transformStyle: 'preserve-3d',
        animation: animate && !headerMode ? `${float3D} ${animationDuration}s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite` : 'none',
        cursor: headerMode ? 'default' : 'pointer',
        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: isHovered && !headerMode ? 'scale(1.15) translateZ(20px)' : 'scale(1) translateZ(0)',
        filter: isHovered && !headerMode ? 'brightness(1.1)' : 'brightness(1)',
        willChange: 'transform',
        '&:hover': {
          animation: animate && !headerMode ? `${float3D} ${animationDuration * 0.7}s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite` : 'none',
        },
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: animate ? 'drop-shadow(0 4px 12px rgba(255, 140, 31, 0.3))' : 'none',
          willChange: 'filter',
        }}
      >
        <defs>
          {/* Animated orange gradient */}
          <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFA841">
              <animate
                attributeName="stop-color"
                values="#FFA841;#FFB858;#FFA841"
                dur={`${animationDuration}s`}
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor="#FF8C1F" />
            <stop offset="100%" stopColor="#E67A0D" />
          </linearGradient>

          {/* Brown gradient for visor */}
          <linearGradient id="brownGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8B4513" />
            <stop offset="100%" stopColor="#5C2E0A" />
          </linearGradient>

          {/* Animated eye glow gradient */}
          <radialGradient id="eyeGlowGradient">
            <stop offset="0%" stopColor="#FFD700">
              <animate
                attributeName="stop-color"
                values="#FFD700;#FFED4E;#FFD700"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor="#FFA841" />
            <stop offset="100%" stopColor="#FF8C1F" />
          </radialGradient>

          {/* Shimmer gradient for hover effect */}
          <linearGradient id="shimmerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
            <stop offset="50%" stopColor="rgba(255, 255, 255, 0.3)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </linearGradient>

          {/* Blur filter for depth */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Rounded helmet/head with animation */}
        <g
          style={{
            animation: animate ? `${headTilt} ${animationDuration}s ease-in-out infinite` : 'none',
            transformOrigin: '100px 75px',
            willChange: 'transform',
          }}
        >
          <ellipse
            cx="100"
            cy="75"
            rx="60"
            ry="50"
            fill="url(#orangeGradient)"
            style={{
              animation: animate ? `${ambientGlow} ${animationDuration}s ease-in-out infinite` : 'none',
            }}
          />

          {/* Top of helmet */}
          <path
            d="M 50 60 Q 100 40 150 60"
            fill="url(#orangeGradient)"
          />

          {/* Visor/Face area (brown) */}
          <ellipse
            cx="100"
            cy="85"
            rx="50"
            ry="35"
            fill="url(#brownGradient)"
            opacity="0.95"
          />

          {/* Shimmer effect on helmet when hovered */}
          {isHovered && !headerMode && (
            <ellipse
              cx="100"
              cy="75"
              rx="60"
              ry="50"
              fill="url(#shimmerGradient)"
              opacity="0.6"
              style={{
                mixBlendMode: 'overlay',
              }}
            >
              <animate
                attributeName="opacity"
                values="0;0.6;0"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </ellipse>
          )}
        </g>

        {/* Left headphone */}
        <g>
          <ellipse
            cx="40"
            cy="75"
            rx="15"
            ry="20"
            fill="url(#orangeGradient)"
          />
          <ellipse
            cx="42"
            cy="75"
            rx="8"
            ry="12"
            fill="#5C2E0A"
            opacity="0.6"
          />
        </g>

        {/* Right headphone */}
        <g>
          <ellipse
            cx="160"
            cy="75"
            rx="15"
            ry="20"
            fill="url(#orangeGradient)"
          />
          <ellipse
            cx="158"
            cy="75"
            rx="8"
            ry="12"
            fill="#5C2E0A"
            opacity="0.6"
          />
        </g>

        {/* Glowing eyes - concentric circles with modern animations */}
        <g
          style={{
            animation: animate && headerMode ? `${eyeScan} 8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite` : 'none',
            transformOrigin: '100px 85px',
            willChange: 'transform',
          }}
        >
          {/* Left Eye */}
          <g>
            {/* Outer glow ring with pulse */}
            <circle
              cx="80"
              cy="85"
              r="16"
              fill="none"
              stroke="url(#eyeGlowGradient)"
              strokeWidth="3"
              opacity="0.6"
              filter="url(#glow)"
              style={{
                animation: animate ? `${ringPulse} 2.5s ease-in-out infinite` : 'none',
                transformOrigin: '80px 85px',
              }}
            />
            {/* Middle ring */}
            <circle
              cx="80"
              cy="85"
              r="12"
              fill="none"
              stroke="#FFD700"
              strokeWidth="2.5"
              opacity="0.8"
              style={{
                animation: animate ? `${ringPulse} 2s ease-in-out infinite 0.2s` : 'none',
                transformOrigin: '80px 85px',
              }}
            />
            {/* Inner ring */}
            <circle
              cx="80"
              cy="85"
              r="8"
              fill="none"
              stroke="#FFA841"
              strokeWidth="2"
            />
            {/* Center glow with modern effect */}
            <circle
              cx="80"
              cy="85"
              r="5"
              fill="url(#eyeGlowGradient)"
              opacity="0.9"
              filter="url(#glow)"
              style={{
                animation: animate ? `${modernEyeGlow} 2s ease-in-out infinite` : 'none',
              }}
            />
          </g>

          {/* Right Eye */}
          <g>
            {/* Outer glow ring with pulse */}
            <circle
              cx="120"
              cy="85"
              r="16"
              fill="none"
              stroke="url(#eyeGlowGradient)"
              strokeWidth="3"
              opacity="0.6"
              filter="url(#glow)"
              style={{
                animation: animate ? `${ringPulse} 2.5s ease-in-out infinite 0.15s` : 'none',
                transformOrigin: '120px 85px',
              }}
            />
            {/* Middle ring */}
            <circle
              cx="120"
              cy="85"
              r="12"
              fill="none"
              stroke="#FFD700"
              strokeWidth="2.5"
              opacity="0.8"
              style={{
                animation: animate ? `${ringPulse} 2s ease-in-out infinite 0.35s` : 'none',
                transformOrigin: '120px 85px',
              }}
            />
            {/* Inner ring */}
            <circle
              cx="120"
              cy="85"
              r="8"
              fill="none"
              stroke="#FFA841"
              strokeWidth="2"
            />
            {/* Center glow with modern effect */}
            <circle
              cx="120"
              cy="85"
              r="5"
              fill="url(#eyeGlowGradient)"
              opacity="0.9"
              filter="url(#glow)"
              style={{
                animation: animate ? `${modernEyeGlow} 2s ease-in-out infinite 0.15s` : 'none',
              }}
            />
          </g>
        </g>

        {/* Body - only show when not in head-only mode */}
        {!headOnly && (
          <>
            {/* Body (rounded rectangle) */}
            <rect
              x="55"
              y="120"
              width="90"
              height="70"
              rx="15"
              fill="url(#orangeGradient)"
            />

            {/* Body accent lines with subtle animation */}
            <line
              x1="60"
              y1="135"
              x2="140"
              y2="135"
              stroke="#5C2E0A"
              strokeWidth="2"
              opacity="0.3"
            >
              {animate && (
                <animate
                  attributeName="opacity"
                  values="0.3;0.5;0.3"
                  dur={`${animationDuration}s`}
                  repeatCount="indefinite"
                />
              )}
            </line>
            <line
              x1="60"
              y1="165"
              x2="140"
              y2="165"
              stroke="#5C2E0A"
              strokeWidth="2"
              opacity="0.3"
            >
              {animate && (
                <animate
                  attributeName="opacity"
                  values="0.3;0.5;0.3"
                  dur={`${animationDuration}s`}
                  repeatCount="indefinite"
                />
              )}
            </line>

            {/* Chest panel (Diepenbeek logo area) */}
            <rect
              x="75"
              y="145"
              width="50"
              height="30"
              rx="5"
              fill="#5C2E0A"
              opacity="0.4"
            />

            {/* Simple "D" for Diepenbeek with glow */}
            <text
              x="100"
              y="165"
              fontFamily="Arial, sans-serif"
              fontSize="20"
              fontWeight="bold"
              fill="#FFD700"
              textAnchor="middle"
              style={{
                filter: animate ? 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.6))' : 'none',
              }}
            >
              D
              {animate && (
                <animate
                  attributeName="opacity"
                  values="0.9;1;0.9"
                  dur="3s"
                  repeatCount="indefinite"
                />
              )}
            </text>
          </>
        )}
      </svg>
    </Box>
  );
};

export default DjoppieLogo;

import { Box, keyframes } from '@mui/material';

// Eye glow animation - subtle pulsing
const eyeGlow = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;

// Ring rotation animation - slow continuous rotation
const ringRotate = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Glow pulse animation - breathing effect
const glowPulse = keyframes`
  0%, 100% {
    filter: drop-shadow(0 0 8px rgba(255, 119, 0, 0.6));
  }
  50% {
    filter: drop-shadow(0 0 16px rgba(255, 119, 0, 0.9));
  }
`;

// Ring pulse animation - expanding/contracting effect
const ringPulse = keyframes`
  0%, 100% {
    opacity: 0.8;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.03);
  }
`;

interface DjoppieLogoProps {
  size?: number;
  animate?: boolean;
  headerMode?: boolean;
  intensity?: 'low' | 'medium' | 'high' | 'party';
  headOnly?: boolean;
}

/**
 * Djoppie Logo - Robot head with concentric rings
 * High-tech design with circular robot face, dark visor, glowing ring eyes,
 * and animated concentric orange rings inspired by the Djoppie mascot
 */
const DjoppieLogo = ({
  size = 80,
  animate = true,
  headerMode = false,
}: DjoppieLogoProps) => {
  return (
    <Box
      id="djoppie-logo"
      sx={{
        width: size,
        height: size,
        cursor: headerMode ? 'default' : 'pointer',
        transition: 'transform 0.3s ease',
        animation: animate ? `${glowPulse} 3s ease-in-out infinite` : 'none',
        '&:hover': {
          transform: headerMode ? 'none' : 'scale(1.08)',
        },
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Orange gradient for rings */}
          <linearGradient id="ringGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF9933" />
            <stop offset="50%" stopColor="#FF7700" />
            <stop offset="100%" stopColor="#E06600" />
          </linearGradient>

          <linearGradient id="ringGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFB347" />
            <stop offset="50%" stopColor="#FF9933" />
            <stop offset="100%" stopColor="#FF7700" />
          </linearGradient>

          <linearGradient id="ringGradient3" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#E06600" />
            <stop offset="50%" stopColor="#FF7700" />
            <stop offset="100%" stopColor="#FF9933" />
          </linearGradient>

          {/* Head gradient - yellow to orange */}
          <radialGradient id="headGradient" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFD966" />
            <stop offset="30%" stopColor="#FFC847" />
            <stop offset="70%" stopColor="#FFB830" />
            <stop offset="100%" stopColor="#FF9933" />
          </radialGradient>

          {/* Dark visor gradient */}
          <linearGradient id="visorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4A3228" />
            <stop offset="50%" stopColor="#3D2820" />
            <stop offset="100%" stopColor="#2D1C15" />
          </linearGradient>

          {/* Eye glow gradient */}
          <radialGradient id="eyeGlowGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFEECC" />
            <stop offset="40%" stopColor="#FFD699" />
            <stop offset="100%" stopColor="#FFB347" />
          </radialGradient>

          {/* Shine gradient */}
          <radialGradient id="shineGradient" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          {/* Headphone gradient */}
          <linearGradient id="headphoneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E07D15" />
            <stop offset="50%" stopColor="#FF9933" />
            <stop offset="100%" stopColor="#E07D15" />
          </linearGradient>

          {/* Segmented ring pattern filter */}
          <filter id="segmentGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feComponentTransfer in="blur" result="bright">
              <feFuncA type="linear" slope="1.5" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="bright" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background glow circle */}
        <circle
          cx="100"
          cy="100"
          r="95"
          fill="none"
          stroke="url(#ringGradient1)"
          strokeWidth="1"
          opacity="0.15"
          style={{
            animation: animate ? `${ringPulse} 4s ease-in-out infinite` : 'none',
          }}
        />

        {/* Outer concentric ring - 4th ring (outermost) */}
        <g
          style={{
            animation: animate ? `${ringRotate} 20s linear infinite` : 'none',
            transformOrigin: '100px 100px',
          }}
        >
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            stroke="url(#ringGradient1)"
            strokeWidth="3"
            strokeDasharray="15 8"
            opacity="0.4"
            filter="url(#segmentGlow)"
          />
        </g>

        {/* 3rd concentric ring */}
        <g
          style={{
            animation: animate ? `${ringRotate} 15s linear infinite reverse` : 'none',
            transformOrigin: '100px 100px',
          }}
        >
          <circle
            cx="100"
            cy="100"
            r="78"
            fill="none"
            stroke="url(#ringGradient2)"
            strokeWidth="4"
            strokeDasharray="20 10"
            opacity="0.5"
            filter="url(#segmentGlow)"
          />
        </g>

        {/* 2nd concentric ring */}
        <g
          style={{
            animation: animate ? `${ringRotate} 12s linear infinite` : 'none',
            transformOrigin: '100px 100px',
          }}
        >
          <circle
            cx="100"
            cy="100"
            r="68"
            fill="none"
            stroke="url(#ringGradient3)"
            strokeWidth="5"
            strokeDasharray="25 12"
            opacity="0.6"
            filter="url(#segmentGlow)"
          />
        </g>

        {/* 1st concentric ring - closest to head */}
        <circle
          cx="100"
          cy="100"
          r="58"
          fill="none"
          stroke="url(#ringGradient1)"
          strokeWidth="2"
          opacity="0.3"
          style={{
            animation: animate ? `${ringPulse} 3s ease-in-out infinite` : 'none',
          }}
        />

        {/* Main robot head - circular */}
        <circle
          cx="100"
          cy="100"
          r="48"
          fill="url(#headGradient)"
        />

        {/* Head rim/border */}
        <circle
          cx="100"
          cy="100"
          r="48"
          fill="none"
          stroke="#E07D15"
          strokeWidth="3"
        />

        {/* Shine/reflection on head */}
        <ellipse
          cx="85"
          cy="85"
          rx="20"
          ry="28"
          fill="url(#shineGradient)"
        />

        {/* Left headphone */}
        <g>
          <ellipse
            cx="52"
            cy="100"
            rx="14"
            ry="20"
            fill="url(#headphoneGradient)"
          />
          <ellipse
            cx="50"
            cy="100"
            rx="7"
            ry="12"
            fill="#3D2820"
          />
          {/* Headphone detail lines */}
          <line x1="48" y1="92" x2="48" y2="108" stroke="#2D1C15" strokeWidth="1.5" />
          <line x1="52" y1="92" x2="52" y2="108" stroke="#2D1C15" strokeWidth="1.5" />
        </g>

        {/* Right headphone */}
        <g>
          <ellipse
            cx="148"
            cy="100"
            rx="14"
            ry="20"
            fill="url(#headphoneGradient)"
          />
          <ellipse
            cx="150"
            cy="100"
            rx="7"
            ry="12"
            fill="#3D2820"
          />
          {/* Headphone detail lines */}
          <line x1="148" y1="92" x2="148" y2="108" stroke="#2D1C15" strokeWidth="1.5" />
          <line x1="152" y1="92" x2="152" y2="108" stroke="#2D1C15" strokeWidth="1.5" />
        </g>

        {/* Dark visor area */}
        <ellipse
          cx="100"
          cy="100"
          rx="36"
          ry="22"
          fill="url(#visorGradient)"
        />

        {/* Visor border/rim */}
        <ellipse
          cx="100"
          cy="100"
          rx="37"
          ry="23"
          fill="none"
          stroke="#E07D15"
          strokeWidth="2"
        />

        {/* Visor detail lines - horizontal segments */}
        <line x1="70" y1="100" x2="130" y2="100" stroke="#4A3228" strokeWidth="0.5" opacity="0.5" />
        <line x1="75" y1="95" x2="125" y2="95" stroke="#4A3228" strokeWidth="0.5" opacity="0.3" />
        <line x1="75" y1="105" x2="125" y2="105" stroke="#4A3228" strokeWidth="0.5" opacity="0.3" />

        {/* Left eye - glowing ring */}
        <g style={{ animation: animate ? `${eyeGlow} 2.5s ease-in-out infinite` : 'none' }}>
          <circle cx="82" cy="100" r="10" fill="none" stroke="url(#eyeGlowGradient)" strokeWidth="3" />
          <circle cx="82" cy="100" r="6" fill="#2D1810" />
          <circle cx="82" cy="98" r="2" fill="#FFD699" opacity="0.8" />
          {/* Inner glow */}
          <circle cx="82" cy="100" r="8" fill="none" stroke="#FFB347" strokeWidth="1" opacity="0.4" />
        </g>

        {/* Right eye - glowing ring */}
        <g style={{ animation: animate ? `${eyeGlow} 2.5s ease-in-out infinite 0.2s` : 'none' }}>
          <circle cx="118" cy="100" r="10" fill="none" stroke="url(#eyeGlowGradient)" strokeWidth="3" />
          <circle cx="118" cy="100" r="6" fill="#2D1810" />
          <circle cx="118" cy="98" r="2" fill="#FFD699" opacity="0.8" />
          {/* Inner glow */}
          <circle cx="118" cy="100" r="8" fill="none" stroke="#FFB347" strokeWidth="1" opacity="0.4" />
        </g>

        {/* "D" logo on forehead (above visor) */}
        <g transform="translate(100, 75)">
          <text
            x="0"
            y="0"
            textAnchor="middle"
            fontFamily="Arial Black, sans-serif"
            fontSize="20"
            fontWeight="900"
            fill="#E07D15"
            stroke="#2D1C15"
            strokeWidth="0.5"
          >
            D
          </text>
        </g>

        {/* Antenna on top */}
        <line
          x1="100"
          y1="52"
          x2="100"
          y2="35"
          stroke="#FF7700"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle
          cx="100"
          cy="33"
          r="4"
          fill="#FFD966"
          stroke="#FF7700"
          strokeWidth="1.5"
        />
        {/* Antenna glow */}
        <circle
          cx="100"
          cy="33"
          r="6"
          fill="none"
          stroke="#FF9933"
          strokeWidth="1"
          opacity="0.4"
          style={{
            animation: animate ? `${ringPulse} 2s ease-in-out infinite` : 'none',
          }}
        />
      </svg>
    </Box>
  );
};

export default DjoppieLogo;

import { Box, keyframes } from '@mui/material';

// Subtle eye glow animation
const eyeGlow = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
`;

interface DjoppieLogoProps {
  size?: number;
  animate?: boolean;
  headerMode?: boolean;
  intensity?: 'low' | 'medium' | 'high' | 'party';
  headOnly?: boolean;
}

/**
 * Djoppie Logo - 3D-style robot head with glowing eyes
 * Clean design with CSS-based effects
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
        '&:hover': {
          transform: headerMode ? 'none' : 'scale(1.05)',
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
          {/* Orange helmet gradient */}
          <linearGradient id="helmetGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFB347" />
            <stop offset="30%" stopColor="#FF9933" />
            <stop offset="70%" stopColor="#F7931E" />
            <stop offset="100%" stopColor="#E07D15" />
          </linearGradient>

          {/* Dark visor gradient */}
          <linearGradient id="visorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5C3D2E" />
            <stop offset="50%" stopColor="#4A2F23" />
            <stop offset="100%" stopColor="#3D251B" />
          </linearGradient>

          {/* Headphone gradient */}
          <linearGradient id="headphoneGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E07D15" />
            <stop offset="50%" stopColor="#FF9933" />
            <stop offset="100%" stopColor="#E07D15" />
          </linearGradient>

          {/* Headphone inner gradient */}
          <linearGradient id="headphoneInnerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5C3D2E" />
            <stop offset="100%" stopColor="#3D251B" />
          </linearGradient>

          {/* Eye glow gradient */}
          <radialGradient id="eyeGlowGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFEECC" />
            <stop offset="40%" stopColor="#FFD699" />
            <stop offset="100%" stopColor="#FFB347" />
          </radialGradient>

          {/* Highlight gradient for 3D effect */}
          <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* Main helmet/head */}
        <ellipse
          cx="100"
          cy="95"
          rx="65"
          ry="60"
          fill="url(#helmetGradient)"
        />

        {/* Top highlight for 3D effect */}
        <ellipse
          cx="85"
          cy="55"
          rx="30"
          ry="15"
          fill="url(#highlightGradient)"
          opacity="0.6"
        />

        {/* Dark visor/face area */}
        <ellipse
          cx="100"
          cy="105"
          rx="50"
          ry="40"
          fill="url(#visorGradient)"
        />

        {/* Visor border/rim */}
        <ellipse
          cx="100"
          cy="105"
          rx="52"
          ry="42"
          fill="none"
          stroke="#E07D15"
          strokeWidth="3"
        />

        {/* Left headphone */}
        <ellipse
          cx="38"
          cy="100"
          rx="18"
          ry="25"
          fill="url(#headphoneGradient)"
        />
        <ellipse
          cx="35"
          cy="100"
          rx="10"
          ry="16"
          fill="url(#headphoneInnerGradient)"
        />

        {/* Right headphone */}
        <ellipse
          cx="162"
          cy="100"
          rx="18"
          ry="25"
          fill="url(#headphoneGradient)"
        />
        <ellipse
          cx="165"
          cy="100"
          rx="10"
          ry="16"
          fill="url(#headphoneInnerGradient)"
        />

        {/* Left eye - glowing ring */}
        <g style={{ animation: animate ? `${eyeGlow} 2s ease-in-out infinite` : 'none' }}>
          <circle cx="75" cy="105" r="20" fill="none" stroke="url(#eyeGlowGradient)" strokeWidth="5" />
          <circle cx="75" cy="105" r="12" fill="#2D1810" />
          <circle cx="75" cy="105" r="3" fill="#FFD699" opacity="0.6" />
        </g>

        {/* Right eye - glowing ring */}
        <g style={{ animation: animate ? `${eyeGlow} 2s ease-in-out infinite 0.1s` : 'none' }}>
          <circle cx="125" cy="105" r="20" fill="none" stroke="url(#eyeGlowGradient)" strokeWidth="5" />
          <circle cx="125" cy="105" r="12" fill="#2D1810" />
          <circle cx="125" cy="105" r="3" fill="#FFD699" opacity="0.6" />
        </g>

        {/* Bottom chin area */}
        <path
          d="M 60 145 Q 100 160 140 145"
          fill="url(#helmetGradient)"
        />
      </svg>
    </Box>
  );
};

export default DjoppieLogo;

import { Box, keyframes } from '@mui/material';
import { useEffect, useState } from 'react';

// SUPER FUN ANIMATIONS! 🎉

// Bouncy bounce! Makes Djoppie super energetic
const superBounce = keyframes`
  0%, 100% {
    transform: translateY(0px) rotate(0deg) scale(1);
  }
  10% {
    transform: translateY(-15px) rotate(-5deg) scale(1.05);
  }
  20% {
    transform: translateY(0px) rotate(0deg) scale(1);
  }
  30% {
    transform: translateY(-10px) rotate(5deg) scale(1.03);
  }
  40% {
    transform: translateY(0px) rotate(0deg) scale(1);
  }
  50% {
    transform: translateY(-20px) rotate(-3deg) scale(1.08);
  }
  60% {
    transform: translateY(0px) rotate(0deg) scale(1);
  }
`;

// Rainbow glow - PARTY MODE!
const rainbowGlow = keyframes`
  0% {
    filter:
      drop-shadow(0 0 20px rgba(255, 0, 0, 0.8))
      drop-shadow(0 0 40px rgba(255, 0, 0, 0.4));
  }
  16% {
    filter:
      drop-shadow(0 0 20px rgba(255, 165, 0, 0.8))
      drop-shadow(0 0 40px rgba(255, 165, 0, 0.4));
  }
  32% {
    filter:
      drop-shadow(0 0 20px rgba(255, 255, 0, 0.8))
      drop-shadow(0 0 40px rgba(255, 255, 0, 0.4));
  }
  48% {
    filter:
      drop-shadow(0 0 20px rgba(0, 255, 0, 0.8))
      drop-shadow(0 0 40px rgba(0, 255, 0, 0.4));
  }
  64% {
    filter:
      drop-shadow(0 0 20px rgba(0, 255, 255, 0.8))
      drop-shadow(0 0 40px rgba(0, 255, 255, 0.4));
  }
  80% {
    filter:
      drop-shadow(0 0 20px rgba(0, 0, 255, 0.8))
      drop-shadow(0 0 40px rgba(0, 0, 255, 0.4));
  }
  100% {
    filter:
      drop-shadow(0 0 20px rgba(255, 0, 255, 0.8))
      drop-shadow(0 0 40px rgba(255, 0, 255, 0.4));
  }
`;

// Crazy spin rotation!
const crazyRotate = keyframes`
  0% {
    transform: rotate(0deg) scale(1);
  }
  25% {
    transform: rotate(90deg) scale(1.1);
  }
  50% {
    transform: rotate(180deg) scale(1.2);
  }
  75% {
    transform: rotate(270deg) scale(1.1);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
`;

// Wobble wobble - makes Djoppie jiggle
const wobble = keyframes`
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(5deg);
  }
  75% {
    transform: rotate(-5deg);
  }
`;

// Head bobbing like listening to music!
const headBob = keyframes`
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  25% {
    transform: translateY(-3px) rotate(-2deg);
  }
  50% {
    transform: translateY(0) rotate(2deg);
  }
  75% {
    transform: translateY(-3px) rotate(-2deg);
  }
`;

// Pulsing orbital ring - SUPER FAST!
const hyperOrbit = keyframes`
  from {
    transform: rotate(0deg) scale(1);
    opacity: 0.8;
  }
  50% {
    opacity: 1;
    transform: rotate(180deg) scale(1.05);
  }
  to {
    transform: rotate(360deg) scale(1);
    opacity: 0.8;
  }
`;

// Counter orbit - even faster opposite direction!
const hyperOrbitReverse = keyframes`
  from {
    transform: rotate(360deg) scale(1);
  }
  to {
    transform: rotate(0deg) scale(1.08);
  }
`;

// Eye winking animation!
const wink = keyframes`
  0%, 90%, 100% {
    transform: scaleY(1);
  }
  93%, 97% {
    transform: scaleY(0.1);
  }
`;

// Smile getting bigger!
const bigSmile = keyframes`
  0%, 100% {
    d: path('M 162 220 Q 192 235 222 220');
  }
  50% {
    d: path('M 162 215 Q 192 245 222 215');
  }
`;

// Particle explosion effect!
const particleFloat = keyframes`
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(var(--tx), var(--ty)) scale(0);
    opacity: 0;
  }
`;

// Disco ball effect on the background
const discoSpin = keyframes`
  from {
    transform: rotate(0deg);
    background-position: 0% 50%;
  }
  to {
    transform: rotate(360deg);
    background-position: 100% 50%;
  }
`;

// Sound wave from headphones!
const soundWave = keyframes`
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
`;

interface DjoppieLogoProps {
  size?: number;
  animate?: boolean;
  intensity?: 'low' | 'medium' | 'high' | 'party';
}

const DjoppieLogo = ({ size = 80, animate = true, intensity = 'high' }: DjoppieLogoProps) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isWinking, setIsWinking] = useState(false);
  const [showParty, setShowParty] = useState(false);

  useEffect(() => {
    if (!animate) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = document.getElementById('djoppie-logo')?.getBoundingClientRect();
      if (rect) {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = (e.clientX - centerX) / rect.width;
        const deltaY = (e.clientY - centerY) / rect.height;
        setMousePos({ x: deltaX * 10, y: deltaY * 10 });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [animate]);

  // Random winking!
  useEffect(() => {
    if (!animate || intensity === 'low') return;

    const winkInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setIsWinking(true);
        setTimeout(() => setIsWinking(false), 300);
      }
    }, 3000);

    return () => clearInterval(winkInterval);
  }, [animate, intensity]);

  // Party mode trigger!
  useEffect(() => {
    if (intensity === 'party') {
      setShowParty(true);
    } else {
      setShowParty(false);
    }
  }, [intensity]);

  const isPartyMode = intensity === 'party' || showParty;
  const animationSpeed = intensity === 'high' || isPartyMode ? 0.8 : intensity === 'medium' ? 1.2 : 1.8;

  return (
    <Box
      id="djoppie-logo"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => intensity !== 'party' && setShowParty(!showParty)}
      sx={{
        width: size,
        height: size,
        animation: animate
          ? isPartyMode
            ? `${rainbowGlow} 2s linear infinite, ${superBounce} 2s ease-in-out infinite`
            : `${superBounce} ${animationSpeed * 3}s ease-in-out infinite`
          : 'none',
        cursor: 'pointer',
        transition: 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        transform: isHovered ? 'scale(1.15)' : 'scale(1)',
        '&:hover': {
          animation: animate
            ? `${wobble} 0.5s ease-in-out, ${rainbowGlow} 1s linear infinite`
            : 'none',
        },
        '&:active': {
          transform: 'scale(0.95) rotate(10deg)',
        },
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 384 384"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Party disco background! */}
        {isPartyMode && (
          <circle
            cx="192"
            cy="192"
            r="190"
            fill="url(#discoGradient)"
            style={{
              animation: `${discoSpin} 2s linear infinite`,
            }}
          />
        )}

        {/* Sound waves from headphones! */}
        {animate && (isHovered || isPartyMode) && (
          <>
            {[1, 2, 3].map((i) => (
              <ellipse
                key={`left-${i}`}
                cx="90"
                cy="192"
                rx="30"
                ry="40"
                fill="none"
                stroke={isPartyMode ? '#ff00ff' : '#FFD700'}
                strokeWidth="2"
                opacity="0.6"
                style={{
                  animation: `${soundWave} ${1 + i * 0.3}s ease-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
            {[1, 2, 3].map((i) => (
              <ellipse
                key={`right-${i}`}
                cx="294"
                cy="192"
                rx="30"
                ry="40"
                fill="none"
                stroke={isPartyMode ? '#00ffff' : '#FFD700'}
                strokeWidth="2"
                opacity="0.6"
                style={{
                  animation: `${soundWave} ${1 + i * 0.3}s ease-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </>
        )}

        {/* Outer Ring - HYPER SPEED! */}
        <g
          style={{
            transformOrigin: '192px 192px',
            animation: animate ? `${hyperOrbit} ${animationSpeed * 1.5}s linear infinite` : 'none',
          }}
        >
          <circle
            cx="192"
            cy="192"
            r="170"
            stroke={isPartyMode ? 'url(#rainbowGradient)' : 'url(#goldGradient)'}
            strokeWidth="10"
            fill="none"
            opacity="0.8"
          />
          <circle cx="192" cy="40" r="15" fill={isPartyMode ? '#ff00ff' : '#FFD700'} />
          <circle cx="192" cy="344" r="15" fill={isPartyMode ? '#00ffff' : '#FDB931'} />
        </g>

        {/* Inner Ring - COUNTER HYPER SPEED! */}
        <g
          style={{
            transformOrigin: '192px 192px',
            animation: animate ? `${hyperOrbitReverse} ${animationSpeed * 1.2}s linear infinite` : 'none',
          }}
        >
          <circle
            cx="192"
            cy="192"
            r="130"
            stroke={isPartyMode ? 'url(#rainbowGradient2)' : 'url(#warmGoldGradient)'}
            strokeWidth="8"
            fill="none"
            opacity="0.9"
          />
          <circle cx="192" cy="78" r="12" fill={isPartyMode ? '#ffff00' : '#FDB931'} />
          <circle cx="192" cy="306" r="12" fill={isPartyMode ? '#00ff00' : '#E07B28'} />
        </g>

        {/* Gradient Definitions */}
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#FDB931" />
            <stop offset="100%" stopColor="#DAA520" />
          </linearGradient>
          <linearGradient id="warmGoldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FDB931" />
            <stop offset="100%" stopColor="#FFD700" />
          </linearGradient>
          <linearGradient id="robotGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#FDB931" />
            <stop offset="100%" stopColor="#E07B28" />
          </linearGradient>
          <linearGradient id="rainbowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff0000" />
            <stop offset="16%" stopColor="#ff7f00" />
            <stop offset="32%" stopColor="#ffff00" />
            <stop offset="48%" stopColor="#00ff00" />
            <stop offset="64%" stopColor="#0000ff" />
            <stop offset="80%" stopColor="#4b0082" />
            <stop offset="100%" stopColor="#9400d3" />
          </linearGradient>
          <linearGradient id="rainbowGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#9400d3" />
            <stop offset="16%" stopColor="#4b0082" />
            <stop offset="32%" stopColor="#0000ff" />
            <stop offset="48%" stopColor="#00ff00" />
            <stop offset="64%" stopColor="#ffff00" />
            <stop offset="80%" stopColor="#ff7f00" />
            <stop offset="100%" stopColor="#ff0000" />
          </linearGradient>
          <radialGradient id="discoGradient" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#ff00ff" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#00ffff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffff00" stopOpacity="0.1" />
          </radialGradient>
          <radialGradient id="eyeGlow" cx="50%" cy="50%">
            <stop offset="0%" stopColor={isPartyMode ? '#ff00ff' : '#00ffff'} />
            <stop offset="100%" stopColor={isPartyMode ? '#00ffff' : '#0088ff'} />
          </radialGradient>
        </defs>

        {/* Robot Head with bobbing animation! */}
        <g
          style={{
            transformOrigin: '192px 202px',
            animation: animate && isHovered ? `${headBob} 0.6s ease-in-out infinite` : 'none',
          }}
        >
          <rect
            x="132"
            y="152"
            width="120"
            height="100"
            rx="20"
            fill={isPartyMode ? 'url(#rainbowGradient)' : 'url(#robotGradient)'}
            stroke={isPartyMode ? '#fff' : 'none'}
            strokeWidth={isPartyMode ? '3' : '0'}
          />
        </g>

        {/* Eyes with WINKING! */}
        <g>
          {/* Left Eye */}
          <ellipse
            cx="162"
            cy="192"
            rx="16"
            ry={isWinking ? "2" : "16"}
            fill="white"
            style={{
              transition: 'ry 0.15s ease-in-out',
            }}
          />
          <circle cx="222" cy="192" r="16" fill="white" />

          {/* Eye pupils with mouse tracking */}
          {!isWinking && (
            <>
              <circle
                cx={166 + mousePos.x * 0.8}
                cy={194 + mousePos.y * 0.8}
                r="8"
                fill="#0a0e27"
                style={{
                  transition: 'cx 0.15s ease, cy 0.15s ease',
                }}
              />
              <circle
                cx={226 + mousePos.x * 0.8}
                cy={194 + mousePos.y * 0.8}
                r="8"
                fill="#0a0e27"
                style={{
                  transition: 'cx 0.15s ease, cy 0.15s ease',
                }}
              />

              {/* Cybernetic eye glints - BIGGER AND BRIGHTER! */}
              {animate && (
                <>
                  <circle
                    cx={164 + mousePos.x * 0.8}
                    cy={192 + mousePos.y * 0.8}
                    r="4"
                    fill="url(#eyeGlow)"
                    style={{
                      transition: 'cx 0.15s ease, cy 0.15s ease',
                    }}
                  />
                  <circle
                    cx={224 + mousePos.x * 0.8}
                    cy={192 + mousePos.y * 0.8}
                    r="4"
                    fill="url(#eyeGlow)"
                    style={{
                      transition: 'cx 0.15s ease, cy 0.15s ease',
                    }}
                  />
                </>
              )}
            </>
          )}
        </g>

        {/* Left Ear/Headphone with sound effect */}
        <g>
          <ellipse
            cx="115"
            cy="192"
            rx="25"
            ry="35"
            fill={isPartyMode ? 'url(#rainbowGradient)' : 'url(#warmGoldGradient)'}
            opacity="0.95"
          />
          <ellipse
            cx="118"
            cy="192"
            rx="12"
            ry="20"
            fill="#1a1410"
            opacity="0.4"
          />
          <ellipse
            cx="118"
            cy="192"
            rx="8"
            ry="16"
            stroke={isPartyMode ? '#fff' : '#FFD700'}
            strokeWidth="2"
            fill="none"
            opacity="0.8"
          />
        </g>

        {/* Right Ear/Headphone with sound effect */}
        <g>
          <ellipse
            cx="269"
            cy="192"
            rx="25"
            ry="35"
            fill={isPartyMode ? 'url(#rainbowGradient2)' : 'url(#warmGoldGradient)'}
            opacity="0.95"
          />
          <ellipse
            cx="266"
            cy="192"
            rx="12"
            ry="20"
            fill="#1a1410"
            opacity="0.4"
          />
          <ellipse
            cx="266"
            cy="192"
            rx="8"
            ry="16"
            stroke={isPartyMode ? '#fff' : '#FFD700'}
            strokeWidth="2"
            fill="none"
            opacity="0.8"
          />
        </g>

        {/* BIG HAPPY SMILE! */}
        <path
          d={isHovered ? 'M 162 215 Q 192 245 222 215' : 'M 162 220 Q 192 235 222 220'}
          stroke="white"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          style={{
            transition: 'd 0.3s ease-out',
          }}
        />
        {animate && (
          <path
            d={isHovered ? 'M 162 215 Q 192 245 222 215' : 'M 162 220 Q 192 235 222 220'}
            stroke={isPartyMode ? '#ff00ff' : '#FFD700'}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            opacity="0.7"
            style={{
              filter: 'blur(3px)',
              transition: 'd 0.3s ease-out',
            }}
          />
        )}

        {/* Sparkle particles when hovered! */}
        {animate && isHovered && (
          <>
            {[...Array(12)].map((_, i) => {
              const angle = (i * 360) / 12;
              const tx = Math.cos((angle * Math.PI) / 180) * 100;
              const ty = Math.sin((angle * Math.PI) / 180) * 100;
              return (
                <circle
                  key={i}
                  cx="192"
                  cy="192"
                  r="4"
                  fill={isPartyMode ? ['#ff0000', '#00ff00', '#0000ff', '#ffff00'][i % 4] : '#FFD700'}
                  style={{
                    // @ts-ignore - CSS variables work fine here
                    '--tx': `${tx}px`,
                    '--ty': `${ty}px`,
                    animation: `${particleFloat} 1s ease-out infinite`,
                    animationDelay: `${i * 0.08}s`,
                  }}
                />
              );
            })}
          </>
        )}
      </svg>

      {/* Party mode indicator! */}
      {isPartyMode && (
        <Box
          sx={{
            position: 'absolute',
            bottom: -10,
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#fff',
            fontSize: '0.7rem',
            fontWeight: 700,
            textShadow: '0 0 10px #ff00ff, 0 0 20px #00ffff',
            animation: `${wobble} 0.5s ease-in-out infinite`,
          }}
        >
          🎉 PARTY MODE! 🎉
        </Box>
      )}
    </Box>
  );
};

export default DjoppieLogo;

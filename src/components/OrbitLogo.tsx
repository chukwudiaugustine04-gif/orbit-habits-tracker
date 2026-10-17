import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const sizeMap = {
  sm: { box: 36, text: 'text-xl', planet: 14, orbit: 30 },
  md: { box: 56, text: 'text-3xl', planet: 22, orbit: 48 },
  lg: { box: 88, text: 'text-5xl', planet: 34, orbit: 76 },
};

export default function OrbitLogo({ size = 'lg', showText = true }: LogoProps) {
  const s = sizeMap[size];

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative flex items-center justify-center"
        style={{ width: s.box, height: s.box }}
      >
        {/* Outer glow */}
        <div
          className="absolute inset-0 rounded-full bg-cyan-500/20 blur-2xl"
          style={{ filter: 'blur(20px)' }}
        />

        {/* Orbit rings — SVG */}
        <motion.svg
          width={s.box}
          height={s.box}
          viewBox="0 0 100 100"
          fill="none"
          className="relative z-10"
        >
          {/* Outer orbit ring (tilted) */}
          <motion.ellipse
            cx="50"
            cy="50"
            rx="44"
            ry="18"
            stroke="url(#orbitGradient)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.4"
            transform="rotate(-25 50 50)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
          />
          {/* Middle orbit ring */}
          <motion.ellipse
            cx="50"
            cy="50"
            rx="38"
            ry="15"
            stroke="url(#orbitGradient2)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.3"
            transform="rotate(35 50 50)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 0.35 }}
          />

          {/* Small orbiting dot on outer ring */}
          <motion.circle
            cx="50"
            cy="50"
            r="2.5"
            fill="#34d399"
            initial={{ rotate: -25 }}
            style={{ transformOrigin: '50px 50px' }}
          >
            <animateMotion
              dur="8s"
              repeatCount="indefinite"
              path="M 44,0 A 44,18 0 1,1 -44,0 A 44,18 0 1,1 44,0"
              transform="rotate(-25, 0, 0)"
            />
          </motion.circle>

          {/* Central planet with gradient */}
          <defs>
            <radialGradient id="planetGradient" cx="35%" cy="35%">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="50%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#0891b2" />
            </radialGradient>
            <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="orbitGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#34d399" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Planet core */}
          <motion.circle
            cx="50"
            cy="50"
            r={s.planet}
            fill="url(#planetGradient)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5, ease: 'backOut' }}
            style={{ transformOrigin: '50px 50px' }}
          />

          {/* Planet highlight */}
          <ellipse
            cx={50 - s.planet * 0.3}
            cy={50 - s.planet * 0.3}
            rx={s.planet * 0.3}
            ry={s.planet * 0.2}
            fill="white"
            opacity="0.3"
          />
        </motion.svg>
      </motion.div>

      {showText && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col items-center gap-0.5"
        >
          <h1
            className={`${s.text} font-bold tracking-tight text-white`}
            style={{
              textShadow: '0 0 20px rgba(34,211,238,0.15)',
            }}
          >
            Orbit
          </h1>
        </motion.div>
      )}
    </div>
  );
}

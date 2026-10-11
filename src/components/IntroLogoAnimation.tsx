import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useOfficialLogo } from './VentyLogo';

interface IntroLogoAnimationProps {
  replayTrigger?: number;
  onFinish?: () => void;
}

// Senior Motion Design Easing Curves
const easeOutQuint = [0.22, 1, 0.36, 1] as const;
const easeInOutCubic = [0.65, 0, 0.35, 1] as const;
const smoothSettle = [0.16, 1, 0.3, 1] as const;
const floatingDrift = [0.42, 0, 0.58, 1] as const;

interface DustParticleConfig {
  id: number;
  startX: string; // percentage or px
  startY: string;
  size: number;
  depth: 'near' | 'mid' | 'far';
  color: string;
  glow: string;
  blur: number;
  delay: number;
  duration: number;
  trajX: number[];
  trajY: number[];
  opacityKeys: number[];
  scaleKeys: number[];
}

// Hand-crafted luxury particle field: 30 depth-stratified coffee studio dust motes
const STUDIO_PARTICLES: DustParticleConfig[] = [
  // --- FOREGROUND NEAR BOKEH (Shallow depth-of-field, warm glow, counter-parallax) ---
  {
    id: 1,
    startX: '32%',
    startY: '64%',
    size: 7.5,
    depth: 'near',
    color: 'radial-gradient(circle, #fff9f0 20%, rgba(245, 223, 184, 0.8) 50%, rgba(201, 131, 58, 0.15) 80%, transparent 100%)',
    glow: '0 0 14px rgba(245, 223, 184, 0.75)',
    blur: 1.8,
    delay: 0.4,
    duration: 3.8,
    trajX: [0, 22, -14, 32],
    trajY: [0, -42, -90, -145],
    opacityKeys: [0, 0.7, 0.85, 0.25],
    scaleKeys: [0.7, 1.1, 1.18, 0.95],
  },
  {
    id: 2,
    startX: '66%',
    startY: '58%',
    size: 6.8,
    depth: 'near',
    color: 'radial-gradient(circle, #fff8ee 20%, rgba(224, 169, 100, 0.75) 55%, rgba(201, 131, 58, 0.1) 85%, transparent 100%)',
    glow: '0 0 12px rgba(224, 169, 100, 0.7)',
    blur: 1.5,
    delay: 0.6,
    duration: 3.7,
    trajX: [0, -18, 16, -26],
    trajY: [0, -38, -85, -135],
    opacityKeys: [0, 0.65, 0.8, 0.3],
    scaleKeys: [0.8, 1.05, 1.15, 0.9],
  },
  {
    id: 3,
    startX: '44%',
    startY: '72%',
    size: 8.5,
    depth: 'near',
    color: 'radial-gradient(circle, #fcf4e8 15%, rgba(245, 223, 184, 0.8) 48%, rgba(201, 131, 58, 0.18) 78%, transparent 100%)',
    glow: '0 0 16px rgba(245, 223, 184, 0.8)',
    blur: 2.2,
    delay: 0.7,
    duration: 3.6,
    trajX: [0, 26, -10, 34],
    trajY: [0, -50, -100, -155],
    opacityKeys: [0, 0.6, 0.75, 0.2],
    scaleKeys: [0.7, 1.12, 1.22, 0.85],
  },
  {
    id: 4,
    startX: '58%',
    startY: '42%',
    size: 6.2,
    depth: 'near',
    color: 'radial-gradient(circle, #fffdf8 25%, rgba(245, 223, 184, 0.85) 55%, transparent 95%)',
    glow: '0 0 10px rgba(245, 223, 184, 0.65)',
    blur: 1.2,
    delay: 0.9,
    duration: 3.4,
    trajX: [0, -15, 20, -12],
    trajY: [0, -32, -72, -120],
    opacityKeys: [0, 0.75, 0.9, 0.35],
    scaleKeys: [0.85, 1.08, 1.0, 0.85],
  },
  {
    id: 5,
    startX: '24%',
    startY: '48%',
    size: 7.0,
    depth: 'near',
    color: 'radial-gradient(circle, #fcf2e3 20%, rgba(201, 131, 58, 0.7) 60%, transparent 100%)',
    glow: '0 0 12px rgba(201, 131, 58, 0.6)',
    blur: 1.6,
    delay: 1.1,
    duration: 3.2,
    trajX: [0, 18, -14, 22],
    trajY: [0, -28, -65, -110],
    opacityKeys: [0, 0.55, 0.7, 0.25],
    scaleKeys: [0.75, 1.05, 1.1, 0.9],
  },

  // --- MIDGROUND CRISP STUDIO PARTICLES (Illuminated coffee & gold dust motes) ---
  {
    id: 6,
    startX: '48%',
    startY: '52%',
    size: 3.2,
    depth: 'mid',
    color: '#fff3e0',
    glow: '0 0 8px rgba(245, 223, 184, 0.9)',
    blur: 0,
    delay: 0.5,
    duration: 3.9,
    trajX: [0, 14, -8, 20],
    trajY: [0, -30, -68, -115],
    opacityKeys: [0, 0.85, 0.95, 0.4],
    scaleKeys: [0.6, 1.15, 1.0, 0.8],
  },
  {
    id: 7,
    startX: '52%',
    startY: '46%',
    size: 2.8,
    depth: 'mid',
    color: '#e6a964',
    glow: '0 0 6px rgba(230, 169, 100, 0.8)',
    blur: 0,
    delay: 0.65,
    duration: 3.8,
    trajX: [0, -12, 10, -16],
    trajY: [0, -28, -62, -105],
    opacityKeys: [0, 0.8, 0.9, 0.35],
    scaleKeys: [0.6, 1.1, 0.95, 0.75],
  },
  {
    id: 8,
    startX: '38%',
    startY: '38%',
    size: 2.5,
    depth: 'mid',
    color: '#c9833a',
    glow: '0 0 6px rgba(201, 131, 58, 0.75)',
    blur: 0,
    delay: 0.8,
    duration: 3.6,
    trajX: [0, 10, -12, 14],
    trajY: [0, -25, -55, -92],
    opacityKeys: [0, 0.75, 0.85, 0.3],
    scaleKeys: [0.5, 1.0, 1.05, 0.8],
  },
  {
    id: 9,
    startX: '62%',
    startY: '34%',
    size: 3.0,
    depth: 'mid',
    color: '#f5dfb8',
    glow: '0 0 7px rgba(245, 223, 184, 0.85)',
    blur: 0,
    delay: 0.9,
    duration: 3.5,
    trajX: [0, -16, 12, -20],
    trajY: [0, -26, -58, -96],
    opacityKeys: [0, 0.8, 0.95, 0.35],
    scaleKeys: [0.6, 1.1, 1.0, 0.85],
  },
  {
    id: 10,
    startX: '42%',
    startY: '60%',
    size: 2.6,
    depth: 'mid',
    color: '#df9e59',
    glow: '0 0 6px rgba(223, 158, 89, 0.8)',
    blur: 0,
    delay: 1.0,
    duration: 3.4,
    trajX: [0, 12, -8, 16],
    trajY: [0, -26, -60, -100],
    opacityKeys: [0, 0.7, 0.85, 0.25],
    scaleKeys: [0.5, 1.05, 0.95, 0.75],
  },
  {
    id: 11,
    startX: '56%',
    startY: '62%',
    size: 3.4,
    depth: 'mid',
    color: '#fff5e6',
    glow: '0 0 8px rgba(255, 245, 230, 0.9)',
    blur: 0,
    delay: 1.1,
    duration: 3.3,
    trajX: [0, -14, 15, -18],
    trajY: [0, -28, -64, -108],
    opacityKeys: [0, 0.85, 1.0, 0.4],
    scaleKeys: [0.7, 1.2, 1.05, 0.85],
  },
  {
    id: 12,
    startX: '34%',
    startY: '54%',
    size: 2.4,
    depth: 'mid',
    color: '#e0a964',
    glow: '0 0 5px rgba(224, 169, 100, 0.7)',
    blur: 0,
    delay: 1.2,
    duration: 3.2,
    trajX: [0, 8, -10, 12],
    trajY: [0, -22, -50, -85],
    opacityKeys: [0, 0.7, 0.8, 0.3],
    scaleKeys: [0.6, 1.0, 0.9, 0.7],
  },
  {
    id: 13,
    startX: '68%',
    startY: '48%',
    size: 2.9,
    depth: 'mid',
    color: '#fcecd2',
    glow: '0 0 7px rgba(252, 236, 210, 0.8)',
    blur: 0,
    delay: 1.25,
    duration: 3.1,
    trajX: [0, -10, 8, -14],
    trajY: [0, -24, -54, -90],
    opacityKeys: [0, 0.75, 0.85, 0.3],
    scaleKeys: [0.6, 1.05, 0.95, 0.8],
  },
  {
    id: 14,
    startX: '46%',
    startY: '30%',
    size: 2.2,
    depth: 'mid',
    color: '#c9833a',
    glow: '0 0 5px rgba(201, 131, 58, 0.65)',
    blur: 0,
    delay: 1.3,
    duration: 3.0,
    trajX: [0, 9, -7, 12],
    trajY: [0, -20, -45, -78],
    opacityKeys: [0, 0.65, 0.75, 0.25],
    scaleKeys: [0.5, 1.0, 0.9, 0.75],
  },
  {
    id: 15,
    startX: '54%',
    startY: '28%',
    size: 2.7,
    depth: 'mid',
    color: '#f5dfb8',
    glow: '0 0 6px rgba(245, 223, 184, 0.75)',
    blur: 0,
    delay: 1.35,
    duration: 2.9,
    trajX: [0, -11, 9, -15],
    trajY: [0, -22, -48, -82],
    opacityKeys: [0, 0.7, 0.8, 0.3],
    scaleKeys: [0.6, 1.05, 0.95, 0.8],
  },

  // --- BACKGROUND MICRO-DUST MOTES (Distant atmospheric depth, subtle blur) ---
  {
    id: 16,
    startX: '28%',
    startY: '35%',
    size: 1.4,
    depth: 'far',
    color: '#df9e59',
    glow: 'none',
    blur: 0.6,
    delay: 0.3,
    duration: 4.1,
    trajX: [0, 6, -5, 8],
    trajY: [0, -18, -40, -68],
    opacityKeys: [0, 0.45, 0.55, 0.15],
    scaleKeys: [0.7, 1.0, 0.95, 0.8],
  },
  {
    id: 17,
    startX: '72%',
    startY: '38%',
    size: 1.6,
    depth: 'far',
    color: '#f5dfb8',
    glow: 'none',
    blur: 0.5,
    delay: 0.45,
    duration: 4.0,
    trajX: [0, -8, 6, -10],
    trajY: [0, -20, -44, -75],
    opacityKeys: [0, 0.5, 0.6, 0.2],
    scaleKeys: [0.6, 1.0, 0.9, 0.75],
  },
  {
    id: 18,
    startX: '36%',
    startY: '68%',
    size: 1.5,
    depth: 'far',
    color: '#e6a964',
    glow: 'none',
    blur: 0.6,
    delay: 0.6,
    duration: 3.9,
    trajX: [0, 7, -6, 9],
    trajY: [0, -22, -48, -82],
    opacityKeys: [0, 0.4, 0.5, 0.15],
    scaleKeys: [0.7, 1.0, 0.95, 0.8],
  },
  {
    id: 19,
    startX: '64%',
    startY: '66%',
    size: 1.7,
    depth: 'far',
    color: '#fcecd2',
    glow: 'none',
    blur: 0.5,
    delay: 0.75,
    duration: 3.8,
    trajX: [0, -9, 8, -12],
    trajY: [0, -24, -52, -88],
    opacityKeys: [0, 0.5, 0.65, 0.2],
    scaleKeys: [0.6, 1.0, 0.9, 0.75],
  },
  {
    id: 20,
    startX: '40%',
    startY: '48%',
    size: 1.3,
    depth: 'far',
    color: '#c9833a',
    glow: 'none',
    blur: 0.7,
    delay: 0.9,
    duration: 3.6,
    trajX: [0, 5, -4, 7],
    trajY: [0, -16, -38, -65],
    opacityKeys: [0, 0.35, 0.45, 0.15],
    scaleKeys: [0.7, 0.95, 0.9, 0.75],
  },
  {
    id: 21,
    startX: '60%',
    startY: '45%',
    size: 1.5,
    depth: 'far',
    color: '#df9e59',
    glow: 'none',
    blur: 0.6,
    delay: 1.05,
    duration: 3.5,
    trajX: [0, -7, 6, -9],
    trajY: [0, -18, -42, -72],
    opacityKeys: [0, 0.4, 0.5, 0.18],
    scaleKeys: [0.6, 1.0, 0.95, 0.8],
  },
  {
    id: 22,
    startX: '22%',
    startY: '58%',
    size: 1.8,
    depth: 'far',
    color: '#f5dfb8',
    glow: 'none',
    blur: 0.5,
    delay: 1.15,
    duration: 3.4,
    trajX: [0, 8, -6, 10],
    trajY: [0, -20, -46, -78],
    opacityKeys: [0, 0.45, 0.55, 0.2],
    scaleKeys: [0.6, 1.0, 0.9, 0.75],
  },
  {
    id: 23,
    startX: '78%',
    startY: '52%',
    size: 1.6,
    depth: 'far',
    color: '#e0a964',
    glow: 'none',
    blur: 0.6,
    delay: 1.2,
    duration: 3.3,
    trajX: [0, -8, 7, -11],
    trajY: [0, -22, -48, -82],
    opacityKeys: [0, 0.4, 0.5, 0.15],
    scaleKeys: [0.7, 1.0, 0.95, 0.8],
  },
  {
    id: 24,
    startX: '50%',
    startY: '22%',
    size: 1.4,
    depth: 'far',
    color: '#fff3e0',
    glow: 'none',
    blur: 0.7,
    delay: 1.3,
    duration: 3.2,
    trajX: [0, 6, -5, 8],
    trajY: [0, -16, -36, -62],
    opacityKeys: [0, 0.5, 0.6, 0.2],
    scaleKeys: [0.6, 0.95, 0.9, 0.75],
  },
  {
    id: 25,
    startX: '30%',
    startY: '24%',
    size: 1.5,
    depth: 'far',
    color: '#fcecd2',
    glow: 'none',
    blur: 0.5,
    delay: 1.4,
    duration: 3.1,
    trajX: [0, 7, -6, 9],
    trajY: [0, -18, -40, -68],
    opacityKeys: [0, 0.45, 0.55, 0.18],
    scaleKeys: [0.7, 1.0, 0.95, 0.8],
  },
  {
    id: 26,
    startX: '70%',
    startY: '26%',
    size: 1.3,
    depth: 'far',
    color: '#e6a964',
    glow: 'none',
    blur: 0.6,
    delay: 1.45,
    duration: 3.0,
    trajX: [0, -7, 6, -9],
    trajY: [0, -16, -38, -64],
    opacityKeys: [0, 0.4, 0.5, 0.15],
    scaleKeys: [0.6, 0.95, 0.9, 0.75],
  },
  {
    id: 27,
    startX: '48%',
    startY: '78%',
    size: 1.7,
    depth: 'far',
    color: '#c9833a',
    glow: 'none',
    blur: 0.6,
    delay: 1.5,
    duration: 2.9,
    trajX: [0, 8, -6, 11],
    trajY: [0, -22, -50, -85],
    opacityKeys: [0, 0.4, 0.55, 0.18],
    scaleKeys: [0.6, 1.0, 0.95, 0.8],
  },
  {
    id: 28,
    startX: '52%',
    startY: '76%',
    size: 1.5,
    depth: 'far',
    color: '#f5dfb8',
    glow: 'none',
    blur: 0.5,
    delay: 1.55,
    duration: 2.8,
    trajX: [0, -8, 7, -10],
    trajY: [0, -20, -46, -78],
    opacityKeys: [0, 0.45, 0.55, 0.2],
    scaleKeys: [0.7, 1.0, 0.9, 0.75],
  },
];

/**
 * FramerAtmosphere Component
 * Renders an atmospheric layer of animated, high-resolution dust particles
 * and volumetric light haze using Framer Motion with organic parallax depth.
 */
const FramerAtmosphere: React.FC<{
  prefersReducedMotion: boolean;
}> = ({ prefersReducedMotion }) => {
  if (prefersReducedMotion) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {/* ======================================================================= */}
      {/* 1. Volumetric Light Shaft 1 (Upper-Left Angled Sunbeam) */}
      {/* ======================================================================= */}
      <motion.div
        initial={{ opacity: 0, rotate: -24, x: -60, y: -40 }}
        animate={{
          opacity: [0, 0.14, 0.22, 0.18, 0.08],
          rotate: [-24, -22, -25, -23, -24],
          x: [-60, -30, 10, 40, 60],
          y: [-40, -20, 0, 15, 25],
        }}
        transition={{
          duration: 4.4,
          times: [0, 0.28, 0.55, 0.8, 1],
          ease: floatingDrift,
        }}
        className="absolute -top-[25%] -left-[10%] w-[420px] sm:w-[580px] h-[160%] origin-top-left pointer-events-none blur-2xl"
        style={{
          background:
            'linear-gradient(108deg, transparent 15%, rgba(245, 223, 184, 0.24) 42%, rgba(201, 131, 58, 0.14) 52%, transparent 75%)',
        }}
      />

      {/* ======================================================================= */}
      {/* 2. Volumetric Light Shaft 2 (Center Backlight Accent Beam) */}
      {/* ======================================================================= */}
      <motion.div
        initial={{ opacity: 0, rotate: 18, x: 40 }}
        animate={{
          opacity: [0, 0.08, 0.16, 0.12, 0.05],
          rotate: [18, 16, 19, 17, 18],
          x: [40, 20, -10, -30, -45],
        }}
        transition={{
          duration: 4.4,
          times: [0, 0.3, 0.6, 0.85, 1],
          ease: floatingDrift,
        }}
        className="absolute -top-[20%] right-[5%] w-[380px] sm:w-[500px] h-[150%] origin-top-right pointer-events-none blur-3xl"
        style={{
          background:
            'linear-gradient(78deg, transparent 20%, rgba(245, 223, 184, 0.18) 45%, rgba(224, 169, 100, 0.1) 55%, transparent 80%)',
        }}
      />

      {/* ======================================================================= */}
      {/* 3. Deep Atmospheric Studio Haze Mist (Horizontal Floating Sheet) */}
      {/* ======================================================================= */}
      <motion.div
        initial={{ opacity: 0, x: '-20%' }}
        animate={{
          opacity: [0, 0.45, 0.6, 0.4, 0.15],
          x: ['-20%', '-8%', '4%', '16%', '25%'],
        }}
        transition={{
          duration: 4.4,
          times: [0, 0.25, 0.55, 0.82, 1],
          ease: floatingDrift,
        }}
        className="absolute inset-y-0 w-[160%] -left-[30%] pointer-events-none blur-3xl"
        style={{
          background:
            'linear-gradient(112deg, transparent 20%, rgba(245, 223, 184, 0.12) 38%, rgba(201, 131, 58, 0.15) 50%, rgba(245, 223, 184, 0.08) 62%, transparent 80%)',
        }}
      />

      {/* ======================================================================= */}
      {/* 4. Coordinated Parallax Particle Canvas Group */}
      {/* Counter-drifts relative to camera movement to amplify 3D studio depth */}
      {/* ======================================================================= */}
      <motion.div
        initial={{ x: 6, y: -10 }}
        animate={{
          x: [6, 2, -4, -8, -12],
          y: [-10, -4, 4, 10, 16],
        }}
        transition={{
          duration: 4.4,
          times: [0, 0.3, 0.6, 0.85, 1],
          ease: floatingDrift,
        }}
        className="absolute inset-0 w-full h-full pointer-events-none transform-gpu"
      >
        {(typeof window !== 'undefined' && window.innerWidth < 768
          ? STUDIO_PARTICLES.slice(0, 10)
          : STUDIO_PARTICLES
        ).map((p) => {
          return (
            <motion.div
              key={p.id}
              initial={{
                opacity: 0,
                x: 0,
                y: 0,
                scale: p.scaleKeys[0],
              }}
              animate={{
                opacity: p.opacityKeys,
                x: p.trajX,
                y: p.trajY,
                scale: p.scaleKeys,
              }}
              transition={{
                delay: p.delay,
                duration: p.duration,
                times: [0, 0.35, 0.75, 1],
                ease: floatingDrift,
              }}
              style={{
                left: p.startX,
                top: p.startY,
                width: `${p.size}px`,
                height: `${p.size}px`,
                background: p.color,
                boxShadow: p.glow,
                filter: p.blur > 0 ? `blur(${p.blur}px)` : 'none',
                willChange: 'transform, opacity',
              }}
              className="absolute rounded-full pointer-events-none transform-gpu"
            />
          );
        })}
      </motion.div>
    </div>
  );
};

export const IntroLogoAnimation: React.FC<IntroLogoAnimationProps> = ({
  replayTrigger = 0,
  onFinish,
}) => {
  const { logoSrc } = useOfficialLogo();
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(true);

  // Exact 4.40s Luxury Cinematic Timeline
  // Hold 3.80s + Exit transition 0.60s = 4.40s Total
  useEffect(() => {
    setIsVisible(true);
    const holdDuration = prefersReducedMotion ? 750 : 3800;

    const exitTimer = window.setTimeout(() => {
      setIsVisible(false);
    }, holdDuration);

    return () => window.clearTimeout(exitTimer);
  }, [replayTrigger, prefersReducedMotion]);

  // Clean lock on body and document element scroll while intro is running
  useEffect(() => {
    if (isVisible) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [isVisible]);

  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => {
        if (onFinish) onFinish();
      }}
    >
      {isVisible && (
        <motion.div
          key={`intro-cinema-${replayTrigger}`}
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={
            prefersReducedMotion
              ? { opacity: 0, transition: { duration: 0.25 } }
              : {
                  opacity: 0,
                  transition: {
                    duration: 0.6,
                    ease: easeInOutCubic,
                  },
                }
          }
          onClick={() => {
            setIsVisible(false);
          }}
          className="fixed inset-0 z-[100] bg-[#faf6ef] flex flex-col items-center justify-center px-6 select-none cursor-pointer overflow-hidden"
          aria-label="VENTY luxury brand reveal"
          role="dialog"
          aria-modal="true"
        >
          {/* ========================================================================= */}
          {/* 0.00–0.40s: Cinematic Exposure Pulse (Near-black warm fade to studio tone) */}
          {/* ========================================================================= */}
          {!prefersReducedMotion && (
            <motion.div
              initial={{ opacity: 0.95 }}
              animate={{ opacity: [0.95, 0.4, 0] }}
              transition={{
                duration: 0.45,
                times: [0, 0.5, 1],
                ease: [0.33, 1, 0.68, 1],
              }}
              className="absolute inset-0 bg-[#120a05] pointer-events-none z-40"
            />
          )}

          {/* ========================================================================= */}
          {/* Subtle 35mm Atmospheric Film Grain Texture */}
          {/* ========================================================================= */}
          <div
            className="absolute inset-0 pointer-events-none z-30 opacity-[0.038] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
            }}
          />

          {/* ========================================================================= */}
          {/* Gentle Cinematic Vignette (Preserves studio depth without dark edges) */}
          {/* ========================================================================= */}
          <div
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              background:
                'radial-gradient(ellipse at center, transparent 40%, rgba(56, 28, 16, 0.05) 75%, rgba(44, 21, 12, 0.14) 100%)',
            }}
          />

          {/* ========================================================================= */}
          {/* Atmospheric Layer of Animated Dust Particles & Volumetric Light Haze */}
          {/* Uses Framer Motion with gentle, organic trajectories & parallax movement  */}
          {/* ========================================================================= */}
          <FramerAtmosphere prefersReducedMotion={!!prefersReducedMotion} />

          {/* ========================================================================= */}
          {/* Cinematic Background Light Source (Moving upper-left -> center -> upper-right) */}
          {/* ========================================================================= */}
          {!prefersReducedMotion && (
            <motion.div
              initial={{
                opacity: 0,
                x: '-18%',
                y: '-14%',
                scale: 0.8,
              }}
              animate={{
                opacity: [0, 0.65, 0.85, 0.9, 0.75],
                x: ['-18%', '-8%', '0%', '6%', '12%'],
                y: ['-14%', '-6%', '0%', '-4%', '-8%'],
                scale: [0.8, 1.0, 1.1, 1.15, 1.2],
              }}
              transition={{
                duration: 3.8,
                times: [0, 0.25, 0.5, 0.75, 1],
                ease: easeInOutCubic,
              }}
              className="absolute w-[520px] h-[520px] sm:w-[740px] sm:h-[740px] rounded-full pointer-events-none blur-3xl z-0"
              style={{
                background:
                  'radial-gradient(circle at center, rgba(245, 223, 184, 0.52) 0%, rgba(201, 131, 58, 0.22) 36%, rgba(250, 246, 239, 0) 72%)',
              }}
            />
          )}

          {/* ========================================================================= */}
          {/* Cinematic Camera Rig & Parallax Container for Foreground Logo Stage */}
          {/* 0.0s: Zoomed in 1.035, pulling back gently to 1.00 with micro drift */}
          {/* ========================================================================= */}
          <motion.div
            initial={
              prefersReducedMotion
                ? { scale: 1, x: 0, y: 0 }
                : { scale: 1.035, x: -6, y: 4 }
            }
            animate={
              prefersReducedMotion
                ? { scale: 1, x: 0, y: 0 }
                : {
                    scale: [1.035, 1.015, 1.002, 1.0, 0.985],
                    x: [-6, -2, 0, 2, 4],
                    y: [4, 1, 0, -1, -2],
                  }
            }
            transition={{
              duration: 4.4,
              times: [0, 0.35, 0.65, 0.86, 1],
              ease: smoothSettle,
            }}
            className="relative z-20 flex flex-col items-center text-center max-w-md w-full"
          >
            {/* ===================================================================== */}
            {/* Subtle Luxury Architectural Outer Border Frame */}
            {/* ===================================================================== */}
            <motion.div
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 0.55, scale: 1 }}
              transition={{
                duration: prefersReducedMotion ? 0.3 : 1.2,
                delay: prefersReducedMotion ? 0 : 0.35,
                ease: easeOutQuint,
              }}
              className="fixed inset-4 sm:inset-7 border border-[#ded7c8]/60 pointer-events-none z-10"
            />

            {/* ===================================================================== */}
            {/* LOGO REVEAL: OFFICIAL VENTY EMBLEM (0.30s – 1.50s) */}
            {/* Scale 92% -> 101% -> 100%, blur -> sharp, upward lift, halo, light sweep */}
            {/* ===================================================================== */}
            <div className="relative mb-6 flex items-center justify-center">
              {/* Expanding Warm Halo Bloom behind emblem */}
              {!prefersReducedMotion && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{
                    opacity: [0, 0, 0.75, 0.6, 0.5],
                    scale: [0.6, 0.6, 1.15, 1.25, 1.3],
                  }}
                  transition={{
                    duration: 3.4,
                    times: [0, 0.22, 0.45, 0.7, 1],
                    ease: easeOutQuint,
                  }}
                  className="absolute w-48 h-48 -inset-8 rounded-full blur-2xl pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(245, 223, 184, 0.55) 0%, rgba(201, 131, 58, 0.28) 45%, transparent 70%)',
                  }}
                />
              )}

              {/* Advanced Horizontal Light Sweep Behind & Across Logo (0.80s – 1.50s) */}
              {!prefersReducedMotion && (
                <motion.div
                  initial={{ opacity: 0, x: -140 }}
                  animate={{
                    opacity: [0, 0, 0.85, 0.5, 0],
                    x: [-140, -140, 0, 110, 180],
                  }}
                  transition={{
                    duration: 3.2,
                    times: [0, 0.25, 0.42, 0.6, 0.75],
                    ease: easeOutQuint,
                  }}
                  className="absolute h-16 w-60 -top-2 pointer-events-none blur-xl z-0"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(255, 245, 228, 0.7) 50%, transparent 100%)',
                  }}
                />
              )}

              {/* Micro Anamorphic Lens Flare Line (Flashes gently at 1.10s) */}
              {!prefersReducedMotion && (
                <motion.div
                  initial={{ opacity: 0, scaleX: 0.2 }}
                  animate={{
                    opacity: [0, 0, 0.7, 0.9, 0],
                    scaleX: [0.2, 0.2, 0.7, 1.2, 0.4],
                  }}
                  transition={{
                    duration: 2.8,
                    times: [0, 0.28, 0.35, 0.42, 0.58],
                    ease: easeOutQuint,
                  }}
                  className="absolute h-[1.5px] w-64 top-1/2 -translate-y-1/2 pointer-events-none z-10"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(255, 245, 230, 0.95) 50%, transparent 100%)',
                    boxShadow: '0 0 12px rgba(245, 223, 184, 0.8)',
                  }}
                />
              )}

              {/* Emblem Motion Wrapper: Starts at 92%, blur 8px, y: 18px -> sharp, 101% -> 100% settle */}
              <motion.div
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        y: 18,
                        scale: 0.92,
                        filter: 'blur(8px)',
                      }
                }
                animate={
                  prefersReducedMotion
                    ? { opacity: 1 }
                    : {
                        opacity: [0, 0.2, 1, 1],
                        y: [18, 12, -1, 0],
                        scale: [0.92, 0.94, 1.012, 1.0],
                        filter: ['blur(8px)', 'blur(5px)', 'blur(0px)', 'blur(0px)'],
                      }
                }
                transition={
                  prefersReducedMotion
                    ? { duration: 0.3 }
                    : {
                        duration: 1.1,
                        delay: 0.35,
                        times: [0, 0.35, 0.85, 1],
                        ease: easeOutQuint,
                      }
                }
                className="h-24 sm:h-28 md:h-32 w-auto max-w-[240px] flex items-center justify-center relative z-20"
              >
                {/* Official Unchanged Brand Asset */}
                <img
                  src={logoSrc}
                  alt="VENTY THE COFFEE Official Logo"
                  className="h-full w-auto max-h-24 sm:max-h-28 md:max-h-32 max-w-[240px] object-contain block drop-shadow-[0_10px_24px_rgba(56,28,16,0.14)] relative z-10"
                  draggable={false}
                />

                {/* Subtle Specular Highlight Sweep Across Emblem Surface (0.90s - 1.50s) */}
                {!prefersReducedMotion && (
                  <motion.div
                    initial={{ opacity: 0, x: '-120%' }}
                    animate={{
                      opacity: [0, 0, 0.65, 0.3, 0],
                      x: ['-120%', '-120%', '0%', '100%', '160%'],
                    }}
                    transition={{
                      duration: 3.2,
                      times: [0, 0.28, 0.42, 0.58, 0.72],
                      ease: easeOutQuint,
                    }}
                    className="absolute inset-0 pointer-events-none z-20 rounded-full overflow-hidden"
                    style={{
                      background:
                        'linear-gradient(115deg, transparent 35%, rgba(255, 248, 238, 0.45) 50%, transparent 65%)',
                      mixBlendMode: 'soft-light',
                    }}
                  />
                )}
              </motion.div>
            </div>

            {/* ===================================================================== */}
            {/* WORDMARK REVEAL: OFFICIAL "VENTY" (1.10s – 1.80s) */}
            {/* Vertical lift, blur -> sharp, micro scale 97% -> 100%, tracking settle */}
            {/* ===================================================================== */}
            <div className="relative overflow-visible">
              <motion.div
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        y: 14,
                        scale: 0.97,
                        letterSpacing: '0.07em',
                        filter: 'blur(5px)',
                      }
                }
                animate={
                  prefersReducedMotion
                    ? { opacity: 1 }
                    : {
                        opacity: [0, 0.3, 1, 1],
                        y: [14, 8, -0.5, 0],
                        scale: [0.97, 0.985, 1.004, 1.0],
                        letterSpacing: ['0.07em', '0.04em', '-0.028em', '-0.025em'],
                        filter: ['blur(5px)', 'blur(3px)', 'blur(0px)', 'blur(0px)'],
                      }
                }
                transition={
                  prefersReducedMotion
                    ? { duration: 0.3 }
                    : {
                        duration: 0.95,
                        delay: 1.05,
                        times: [0, 0.4, 0.85, 1],
                        ease: easeOutQuint,
                      }
                }
                className="relative inline-block"
              >
                {/* Official Wordmark Typography */}
                <span className="font-serif italic font-bold text-3xl sm:text-4xl text-[#381c10] leading-none tracking-tight block drop-shadow-[0_4px_14px_rgba(56,28,16,0.08)]">
                  VENTY
                </span>

                {/* Printed Luxury Sheen Highlight Passing Across Text (1.30s – 1.90s) */}
                {!prefersReducedMotion && (
                  <motion.div
                    initial={{ opacity: 0, x: '-100%' }}
                    animate={{
                      opacity: [0, 0, 0.55, 0.25, 0],
                      x: ['-100%', '-100%', '30%', '110%', '160%'],
                    }}
                    transition={{
                      duration: 3.4,
                      times: [0, 0.38, 0.52, 0.66, 0.78],
                      ease: easeOutQuint,
                    }}
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(110deg, transparent 30%, rgba(245, 223, 184, 0.6) 50%, rgba(201, 131, 58, 0.4) 55%, transparent 70%)',
                      mixBlendMode: 'overlay',
                    }}
                  />
                )}
              </motion.div>
            </div>

            {/* ===================================================================== */}
            {/* DIVIDER LINE ANIMATION (1.40s – 1.95s) */}
            {/* Center origin expansion, luminous traveling highlight, amber settle */}
            {/* ===================================================================== */}
            <div className="relative flex items-center justify-center my-3.5">
              <motion.div
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : {
                        scaleX: 0,
                        opacity: 0,
                        backgroundColor: '#f5dfb8',
                      }
                }
                animate={
                  prefersReducedMotion
                    ? { opacity: 1, scaleX: 1 }
                    : {
                        scaleX: [0, 0.3, 1.02, 1.0],
                        opacity: [0, 0.8, 1, 1],
                        backgroundColor: ['#f5dfb8', '#e6a964', '#df9e59', '#c9833a'],
                      }
                }
                transition={
                  prefersReducedMotion
                    ? { duration: 0.25 }
                    : {
                        duration: 0.68,
                        delay: 1.35,
                        times: [0, 0.3, 0.82, 1],
                        ease: easeOutQuint,
                      }
                }
                className="w-14 h-[1.5px] origin-center shadow-[0_0_10px_rgba(201,131,58,0.35)] relative"
              >
                {/* Luminous Edge Highlight traveling along line */}
                {!prefersReducedMotion && (
                  <motion.div
                    initial={{ opacity: 0, x: '-50%' }}
                    animate={{
                      opacity: [0, 0.9, 0],
                      x: ['-100%', '0%', '100%'],
                    }}
                    transition={{
                      duration: 0.6,
                      delay: 1.38,
                      ease: easeOutQuint,
                    }}
                    className="absolute inset-y-0 w-4 -top-[1px] -bottom-[1px] bg-white blur-[1px] pointer-events-none"
                  />
                )}
              </motion.div>
            </div>

            {/* ===================================================================== */}
            {/* SUBTITLE: "THE COFFEE · MILIANA" (1.65s – 2.20s) */}
            {/* Mask reveal from left, upward lift, tracking settle, subtle shimmer */}
            {/* ===================================================================== */}
            <div className="relative overflow-hidden py-0.5">
              <motion.div
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        y: 7,
                        clipPath: 'inset(0 100% 0 0)',
                        letterSpacing: '0.36em',
                        filter: 'blur(3px)',
                      }
                }
                animate={
                  prefersReducedMotion
                    ? { opacity: 1 }
                    : {
                        opacity: [0, 0.4, 1, 1],
                        y: [7, 3, 0, 0],
                        clipPath: [
                          'inset(0 100% 0 0)',
                          'inset(0 55% 0 0)',
                          'inset(0 0% 0 0)',
                          'inset(0 0% 0 0)',
                        ],
                        letterSpacing: ['0.36em', '0.32em', '0.265em', '0.26em'],
                        filter: ['blur(3px)', 'blur(1.5px)', 'blur(0px)', 'blur(0px)'],
                      }
                }
                transition={
                  prefersReducedMotion
                    ? { duration: 0.25 }
                    : {
                        duration: 0.85,
                        delay: 1.6,
                        times: [0, 0.4, 0.85, 1],
                        ease: easeOutQuint,
                      }
                }
                className="relative"
              >
                <span className="font-sans uppercase text-[10px] sm:text-[11px] text-[#8a7b70] font-semibold tracking-[0.26em] block">
                  The Coffee · Miliana
                </span>
              </motion.div>
            </div>

            {/* ===================================================================== */}
            {/* 2.40s–3.20s: ONE LUXURY DIAGONAL SHIMMER PASS ACROSS FULL LOGO */}
            {/* Warm light reflection sweeps diagonally across the composition */}
            {/* ===================================================================== */}
            {!prefersReducedMotion && (
              <motion.div
                initial={{
                  opacity: 0,
                  x: '-120%',
                  y: '-100%',
                }}
                animate={{
                  opacity: [0, 0, 0.6, 0.4, 0],
                  x: ['-120%', '-120%', '0%', '80%', '150%'],
                  y: ['-100%', '-100%', '0%', '60%', '120%'],
                }}
                transition={{
                  duration: 3.4,
                  times: [0, 0.68, 0.8, 0.9, 1],
                  ease: easeOutQuint,
                }}
                className="absolute inset-0 -m-8 pointer-events-none z-30"
                style={{
                  background:
                    'linear-gradient(135deg, transparent 40%, rgba(255, 248, 238, 0.35) 48%, rgba(201, 131, 58, 0.28) 52%, transparent 60%)',
                  mixBlendMode: 'overlay',
                }}
              />
            )}
          </motion.div>

          {/* ========================================================================= */}
          {/* Subtle Accessible Skip Prompt */}
          {/* ========================================================================= */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            transition={{ delay: 2.5, duration: 0.6 }}
            className="absolute bottom-6 text-[10px] uppercase font-mono tracking-widest text-[#8a7b70] pointer-events-none z-20"
          >
            tap anywhere to enter
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

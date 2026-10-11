import React, { useEffect, useRef, useState, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  shape: 'rect' | 'circle' | 'star' | 'bean';
  opacity: number;
  gravity: number;
  drag: number;
  oscillationSpeed: number;
  oscillationDistance: number;
  wobble: number;
}

interface CelebratoryConfettiProps {
  active?: boolean;
  durationMs?: number;
  particleCount?: number;
  onComplete?: () => void;
  className?: string;
  enableSound?: boolean;
}

// Luxurious gold, coffee, caramel, champagne, and emerald palette
const CONFETTI_COLORS = [
  '#ffd700', // Pure gold
  '#c9833a', // Coffee bronze / caramel
  '#f59e0b', // Warm amber
  '#fef08a', // Pale gold shimmer
  '#f5d061', // Champagne gold
  '#351016', // Deep espresso
  '#6b3a1f', // Roasted coffee
  '#10b981', // Emerald victory
  '#34d399', // Mint emerald
  '#ffffff', // Crisp white sparkle
];

export const CelebratoryConfetti: React.FC<CelebratoryConfettiProps> = ({
  active = true,
  durationMs = 4500,
  particleCount = 140,
  onComplete,
  className = '',
  enableSound = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(active);

  // Gentle celebratory audio chime using Web Audio API (safe, soft, non-intrusive)
  const playCelebrationChime = useCallback(() => {
    if (!enableSound || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      // Friendly pleasant ascending chime chords (C5 -> E5 -> G5 -> C6)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.65);
      });
    } catch {
      // Audio playback fails gracefully if browser restricts autoplay
    }
  }, [enableSound]);

  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = [];
    const shapes: ('rect' | 'circle' | 'star' | 'bean')[] = ['rect', 'circle', 'star', 'bean'];

    // Create particles from dual left and right lower cannons for dramatic celebratory arch
    for (let i = 0; i < particleCount; i++) {
      const isLeftCannon = i % 2 === 0;
      const originX = isLeftCannon ? width * 0.15 : width * 0.85;
      const originY = height * 0.82;

      // Velocity: high initial upward burst with horizontal arc inward towards center
      const angle = isLeftCannon
        ? -Math.PI / 4 + (Math.random() - 0.5) * 0.55 // Angles ~45 deg to the right
        : (-3 * Math.PI) / 4 + (Math.random() - 0.5) * 0.55; // Angles ~45 deg to the left

      const speed = Math.random() * 14 + 10;
      const vx = Math.cos(angle) * speed + (Math.random() - 0.5) * 3;
      const vy = Math.sin(angle) * speed - Math.random() * 4;

      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];

      particles.push({
        x: originX,
        y: originY,
        vx,
        vy,
        size: Math.random() * 8 + 6,
        color,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        shape,
        opacity: 1,
        gravity: 0.32 + Math.random() * 0.1,
        drag: 0.982,
        oscillationSpeed: Math.random() * 0.08 + 0.03,
        oscillationDistance: Math.random() * 2 + 1,
        wobble: Math.random() * Math.PI * 2,
      });
    }

    particlesRef.current = particles;
  }, [particleCount]);

  const startAnimation = useCallback(() => {
    setIsRunning(true);
    playCelebrationChime();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    initParticles(rect.width, rect.height);
    const startTime = performance.now();

    const render = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = elapsed / durationMs;

      ctx.clearRect(0, 0, rect.width, rect.height);

      let activeParticles = 0;

      for (const p of particlesRef.current) {
        // Physics update
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.wobble += p.oscillationSpeed;
        p.x += p.vx + Math.sin(p.wobble) * p.oscillationDistance;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Fade out in the last 25% of duration
        if (progress > 0.75) {
          p.opacity = Math.max(0, 1 - (progress - 0.75) / 0.25);
        }

        if (p.opacity > 0 && p.y < rect.height + 50) {
          activeParticles++;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;

          if (p.shape === 'rect') {
            ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
          } else if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2.2, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.shape === 'star') {
            // 4-pointed shimmering star
            ctx.beginPath();
            const s = p.size / 1.5;
            ctx.moveTo(0, -s);
            ctx.quadraticCurveTo(0, 0, s, 0);
            ctx.quadraticCurveTo(0, 0, 0, s);
            ctx.quadraticCurveTo(0, 0, -s, 0);
            ctx.quadraticCurveTo(0, 0, 0, -s);
            ctx.fill();
          } else if (p.shape === 'bean') {
            // Coffee bean silhouette
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size / 1.8, p.size / 2.8, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            // Inner bean crease
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-p.size / 3, -p.size / 4);
            ctx.lineTo(p.size / 3, p.size / 4);
            ctx.stroke();
          }

          ctx.restore();
        }
      }

      if (elapsed < durationMs && activeParticles > 0) {
        animationFrameRef.current = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, rect.width, rect.height);
        setIsRunning(false);
        if (onComplete) onComplete();
      }
    };

    animationFrameRef.current = requestAnimationFrame(render);
  }, [durationMs, initParticles, onComplete, playCelebrationChime]);

  useEffect(() => {
    if (active) {
      startAnimation();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsRunning(false);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [active, startAnimation]);

  if (!isRunning && !active) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-30 w-full h-full overflow-hidden ${className}`}
      style={{ touchAction: 'none' }}
    />
  );
};

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Particle {
  id: string;
  originXvw: number;
  originYvh: number;
  dx: number;
  dy: number;
  size: number;
  color: string;
}

interface Flash {
  id: string;
  originXvw: number;
  originYvh: number;
  color: string;
}

// Vivid, high-saturation palette — several bursts share a hue family so each
// explosion reads as one coherent, rich color rather than confetti noise.
const PALETTES = [
  ["#ff2d55", "#ff6b9d", "#ffd93d"],
  ["#00e5ff", "#5b8dff", "#c77dff"],
  ["#39ff14", "#a3ff33", "#ffe600"],
  ["#ff9500", "#ff2d55", "#ffd93d"],
  ["#c77dff", "#ff6b9d", "#00e5ff"],
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeBurst(originXvw: number, originYvh: number): Particle[] {
  const palette = pick(PALETTES);
  const count = 22 + Math.floor(Math.random() * 10);
  return Array.from({ length: count }).map((_, i) => {
    const angle = ((360 / count) * i + (Math.random() * 18 - 9)) * (Math.PI / 180);
    const distance = 90 + Math.random() * 110;
    return {
      id: `${originXvw}-${originYvh}-${i}-${Math.random().toString(36).slice(2)}`,
      originXvw,
      originYvh,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      size: 5 + Math.random() * 7,
      color: pick(palette),
    };
  });
}

export default function FireworksOverlay({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [flashes, setFlashes] = useState<Flash[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      setFlashes([]);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    function fireBurst() {
      const originXvw = 12 + Math.random() * 76;
      const originYvh = 10 + Math.random() * 42;
      const burstParticles = makeBurst(originXvw, originYvh);
      setParticles((prev) => [...prev, ...burstParticles]);
      setFlashes((prev) => [
        ...prev,
        { id: `${originXvw}-${originYvh}-flash-${Math.random().toString(36).slice(2)}`, originXvw, originYvh, color: burstParticles[0].color },
      ]);

      // Occasionally double up for a fuller sky, then schedule the next round.
      if (Math.random() < 0.35) {
        const originXvw2 = 12 + Math.random() * 76;
        const originYvh2 = 10 + Math.random() * 42;
        const burst2 = makeBurst(originXvw2, originYvh2);
        setParticles((prev) => [...prev, ...burst2]);
        setFlashes((prev) => [
          ...prev,
          { id: `${originXvw2}-${originYvh2}-flash-${Math.random().toString(36).slice(2)}`, originXvw: originXvw2, originYvh: originYvh2, color: burst2[0].color },
        ]);
      }

      timeoutId = setTimeout(fireBurst, 550 + Math.random() * 400);
    }

    fireBurst();
    return () => clearTimeout(timeoutId);
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {flashes.map((f) => (
          <motion.div
            key={f.id}
            initial={{ left: `${f.originXvw}vw`, top: `${f.originYvh}vh`, opacity: 0.9, scale: 0.2 }}
            animate={{ opacity: 0, scale: 3.2 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            onAnimationComplete={() => setFlashes((prev) => prev.filter((x) => x.id !== f.id))}
            style={{
              position: "fixed",
              width: 26,
              height: 26,
              marginLeft: -13,
              marginTop: -13,
              borderRadius: "50%",
              background: `radial-gradient(circle, #ffffff 0%, ${f.color} 55%, transparent 75%)`,
            }}
          />
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{
              left: `${p.originXvw}vw`,
              top: `${p.originYvh}vh`,
              opacity: 1,
              scale: 0.5,
            }}
            animate={{
              left: [`${p.originXvw}vw`, `calc(${p.originXvw}vw + ${p.dx}px)`, `calc(${p.originXvw}vw + ${p.dx}px)`],
              top: [
                `${p.originYvh}vh`,
                `calc(${p.originYvh}vh + ${p.dy}px)`,
                `calc(${p.originYvh}vh + ${p.dy + 46}px)`,
              ],
              opacity: [1, 1, 0],
              scale: [0.5, 1.15, 0.25],
            }}
            transition={{ duration: 1.3, ease: "easeOut", times: [0, 0.5, 1] }}
            onAnimationComplete={() => setParticles((prev) => prev.filter((x) => x.id !== p.id))}
            style={{
              position: "fixed",
              width: p.size,
              height: p.size,
              marginLeft: -p.size / 2,
              marginTop: -p.size / 2,
              borderRadius: "50%",
              backgroundColor: p.color,
              boxShadow: `0 0 4px 1px ${p.color}, 0 0 12px 3px ${p.color}88`,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

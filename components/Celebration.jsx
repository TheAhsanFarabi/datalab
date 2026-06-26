"use client";
import { useEffect, useState } from "react";

const COLORS = ["#2FAE60", "#2D7FF9", "#8B5CF6", "#E8930C", "#F4733F", "#F2B705"];

export default function Celebration({ burst, onDone }) {
  // burst: { key, xp, badges: [{icon,name}] } | null
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!burst) return;
    setPieces(
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.35,
        dur: 1.1 + Math.random() * 0.9,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 7
      }))
    );
    const t = setTimeout(() => onDone?.(), 2600);
    return () => clearTimeout(t);
  }, [burst, onDone]);

  if (!burst) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={`${burst.key}-${p.id}`}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            animation: `confetti ${p.dur}s ${p.delay}s ease-in both`
          }}
        />
      ))}
      <div className="absolute inset-x-0 top-20 flex justify-center">
        <div className="animate-pop rounded-2xl bg-white shadow-card border border-line px-6 py-4 text-center">
          <div className="text-3xl">✅</div>
          {burst.xp > 0 && (
            <p className="font-display font-extrabold text-sprout-dark text-lg">+{burst.xp} XP</p>
          )}
          {burst.xp === 0 && <p className="font-display font-bold text-inkmute text-sm">Already solved — nice review!</p>}
          {burst.badges?.map((b) => (
            <p key={b.id} className="mt-1 text-sm font-bold text-gold">
              {b.icon} New badge: {b.name}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

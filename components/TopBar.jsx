"use client";
import { TOPICS } from "../lib/tasks";

const LEVEL_XP = 100;

export default function TopBar({ task, progress, busy, onRun, onReset, onCheck }) {
  const topic = TOPICS.find((t) => t.id === task.topic);
  const level = Math.floor(progress.xp / LEVEL_XP) + 1;
  const into = progress.xp % LEVEL_XP;

  return (
    <header className="h-16 shrink-0 border-b border-line bg-white/80 backdrop-blur flex items-center gap-4 px-5">
      <div className="min-w-0">
        <p className="text-[11px] text-inkmute font-semibold">{topic.title}</p>
        <h2 className="font-display font-extrabold text-lg leading-tight truncate">{task.title}</h2>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <button
          onClick={onRun}
          disabled={busy}
          className="btn-3d rounded-xl bg-pymode text-white font-display font-extrabold text-sm px-4 py-2 disabled:opacity-50"
        >
          ▶ Run
        </button>
        <button
          onClick={onReset}
          disabled={busy}
          className="btn-3d rounded-xl bg-white border border-line font-display font-bold text-sm px-3.5 py-2 text-inkmute disabled:opacity-50"
        >
          ↺ Reset
        </button>
        <button
          onClick={onCheck}
          disabled={busy}
          className="btn-3d rounded-xl bg-sprout text-white font-display font-extrabold text-sm px-4 py-2 disabled:opacity-50"
        >
          ✓ Check answer
        </button>
      </div>

      <div className="hidden md:flex items-center gap-4 pl-4 border-l border-line">
        <div className="text-center" title="Daily streak — complete one task a day to keep it">
          <span className="text-xl">🔥</span>
          <span className="font-display font-extrabold ml-1">{progress.streak}</span>
        </div>
        <div className="w-36" title={`${progress.xp} XP total`}>
          <div className="flex justify-between text-[10px] font-bold text-inkmute">
            <span>Lv {level}</span>
            <span>{progress.xp} XP</span>
          </div>
          <div className="h-2.5 rounded-full bg-line overflow-hidden">
            <div className="h-full bg-gold rounded-full transition-all duration-700" style={{ width: `${(into / LEVEL_XP) * 100}%` }} />
          </div>
        </div>
      </div>
    </header>
  );
}

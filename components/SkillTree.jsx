"use client";
import { TOPICS, TASKS } from "../lib/tasks";
import { topicState, BADGES } from "../lib/progress";

export default function SkillTree({ progress, currentTaskId, onSelect }) {
  const states = topicState(progress);
  const totalTasks = Object.keys(TASKS).length;
  const doneTasks = Object.keys(progress.completed).length;

  return (
    <aside className="w-72 shrink-0 border-r border-line bg-white/70 overflow-y-auto">
      <div className="px-5 pt-5 pb-4 border-b border-line">
        <h1 className="font-display font-black text-2xl tracking-tight">
          Data<span className="text-sprout">Lab</span> <span className="text-base">🧪</span>
        </h1>
        <p className="text-xs text-inkmute mt-0.5">One problem · three tools</p>
        <div className="mt-3 h-2.5 rounded-full bg-line overflow-hidden" role="progressbar" aria-valuenow={doneTasks} aria-valuemax={totalTasks}>
          <div
            className="h-full bg-sprout rounded-full transition-all duration-700"
            style={{ width: `${(doneTasks / totalTasks) * 100}%` }}
          />
        </div>
        <p className="text-xs text-inkmute mt-1">{doneTasks} / {totalTasks} tasks complete</p>
      </div>

      <nav className="px-4 py-4">
        {TOPICS.map((topic, ti) => {
          const st = states[topic.id];
          return (
            <div key={topic.id} className="relative pb-2">
              {ti < TOPICS.length - 1 && (
                <span className="absolute left-[18px] top-9 bottom-0 w-1 rounded bg-line" aria-hidden />
              )}
              <div className="flex items-center gap-3">
                <span
                  className={`relative z-10 grid place-items-center w-9 h-9 rounded-full text-base font-bold border-2
                    ${st.complete ? "bg-sprout border-sprout-dark text-white" :
                      st.locked ? "bg-line border-line text-inkmute/70" :
                      "bg-white border-sprout text-sprout-dark"}`}
                >
                  {st.complete ? "✓" : st.locked ? "🔒" : topic.icon}
                </span>
                <div>
                  <p className={`font-display font-extrabold text-sm ${st.locked ? "text-inkmute/70" : ""}`}>{topic.title}</p>
                  <p className="text-[11px] text-inkmute">{st.doneCount}/{st.total}</p>
                </div>
              </div>

              {!st.locked && (
                <ul className="ml-[18px] border-l-4 border-transparent pl-7 mt-1 space-y-0.5">
                  {topic.tasks.map((tid) => {
                    const t = TASKS[tid];
                    const done = !!progress.completed[tid];
                    const active = tid === currentTaskId;
                    return (
                      <li key={tid}>
                        <button
                          onClick={() => onSelect(tid)}
                          className={`w-full text-left text-[13px] rounded-lg px-2.5 py-1.5 flex items-center gap-2 transition-colors
                            ${active ? "bg-sprout-soft font-bold text-sprout-dark" : "hover:bg-paper"}`}
                        >
                          <span className={done ? "text-sprout-dark" : "text-line"}>{done ? "●" : "○"}</span>
                          <span className="flex-1 truncate">{t.title}</span>
                          <span className="text-[10px] text-inkmute">+{t.xp}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <div className="px-5 pb-6">
        <p className="text-xs font-bold text-inkmute uppercase tracking-wide mb-2">Badges</p>
        <div className="flex flex-wrap gap-1.5">
          {BADGES.map((b) => {
            const earned = progress.badges.includes(b.id);
            return (
              <span
                key={b.id}
                title={`${b.name} — ${b.desc}`}
                className={`text-lg leading-none rounded-lg border px-1.5 py-1 ${earned ? "bg-white border-gold" : "bg-paper border-line grayscale opacity-40"}`}
              >
                {b.icon}
              </span>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

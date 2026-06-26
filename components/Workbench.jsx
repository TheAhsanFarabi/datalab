"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { TASKS, MODE_META, taskList } from "../lib/tasks";
import { DATASETS } from "../lib/datasets";
import { loadProgress, completeTask, topicState } from "../lib/progress";
import SkillTree from "./SkillTree";
import TopBar from "./TopBar";
import TaskPanel from "./TaskPanel";
import DataPreview from "./DataPreview";
import CodeCell from "./CodeCell";
import ExcelCell from "./ExcelCell";
import Celebration from "./Celebration";

function firstAvailableMode(task) {
  return ["python", "sql", "excel"].find((m) => task.modes[m]);
}

function pickStartTask(progress) {
  const states = topicState(progress);
  for (const id of taskList()) {
    const t = TASKS[id];
    if (states[t.topic] !== "locked" && !progress.completed[id]) return id;
  }
  return taskList()[0];
}

export default function Workbench() {
  const [progress, setProgress] = useState(null);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [mode, setMode] = useState("python");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [burst, setBurst] = useState(null);
  const cellRef = useRef(null);

  useEffect(() => {
    const p = loadProgress();
    setProgress(p);
    const start = pickStartTask(p);
    setCurrentTaskId(start);
    setMode(firstAvailableMode(TASKS[start]));
  }, []);

  const task = currentTaskId ? TASKS[currentTaskId] : null;
  const dataset = task ? DATASETS[task.dataset] : null;

  const selectTask = (id) => {
    setCurrentTaskId(id);
    setMode(firstAvailableMode(TASKS[id]));
  };

  const onPassed = (normalizedResult) => {
    const { progress: next, gainedXp, newBadges } = completeTask(task.id, normalizedResult);
    setProgress(next);
    setBurst({ xp: gainedXp, badges: newBadges });
  };

  if (!progress || !task) {
    return (
      <div className="h-full grid place-items-center bg-paper">
        <p className="font-display font-extrabold text-inkmute animate-pulse">Setting up your lab…</p>
      </div>
    );
  }

  const isExcel = mode === "excel";

  return (
    <div className="h-full flex bg-paper text-ink font-display">
      <SkillTree progress={progress} currentTaskId={currentTaskId} onSelect={selectTask} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          task={task}
          progress={progress}
          busy={busy}
          onRun={() => cellRef.current?.run()}
          onReset={() => cellRef.current?.reset()}
          onCheck={() => cellRef.current?.check()}
        />

        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Instruction cell */}
          <section className="rounded-2xl border border-line bg-white shadow-card px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-wide text-inkmute mb-1">Task</p>
            <h2 className="font-extrabold text-lg">{task.title}</h2>
            <p className="text-[14px] leading-relaxed mt-1">{task.brief}</p>
          </section>

          <DataPreview dataset={dataset} />

          {isExcel ? (
            <ExcelCell
              ref={cellRef}
              task={task}
              dataset={dataset}
              onPassed={onPassed}
              onBusy={setBusy}
            />
          ) : (
            <CodeCell
              ref={cellRef}
              task={task}
              mode={mode}
              dataset={dataset}
              onStatus={setStatus}
              onPassed={onPassed}
              onBusy={setBusy}
            />
          )}

          {status && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 rounded-full bg-ink text-white text-xs font-bold px-4 py-2 shadow-card animate-pop">
              {status}
            </div>
          )}
        </main>
      </div>

      <TaskPanel task={task} mode={mode} onMode={setMode} progress={progress} />

      <Celebration burst={burst} onDone={() => setBurst(null)} />
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import Workbench from "./Workbench";
import Workspace from "./workspace/Workspace";

const MODE_KEY = "datalab-app-mode";

export default function AppShell() {
  const [mode, setMode] = useState("learn");

  useEffect(() => {
    const saved = localStorage.getItem(MODE_KEY);
    if (saved === "workspace") setMode("workspace");
  }, []);

  const switchTo = (m) => {
    setMode(m);
    localStorage.setItem(MODE_KEY, m);
  };

  const tab = (m, label) => (
    <button
      onClick={() => switchTo(m)}
      className={`px-4 py-1.5 rounded-full text-sm font-extrabold transition-colors
        ${mode === m ? "bg-ink text-paper" : "text-inkmute hover:text-ink"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="h-screen flex flex-col bg-paper text-ink font-display">
      <header className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-line bg-white">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧪</span>
          <span className="font-extrabold">DataLab</span>
        </div>
        <nav className="flex items-center gap-1 bg-paper rounded-full p-1 border border-line">
          {tab("learn", "Learn")}
          {tab("workspace", "Workspace")}
        </nav>
        <span className="text-xs text-inkmute hidden sm:block">
          {mode === "learn" ? "Guided lessons with XP" : "Free-form notebooks"}
        </span>
      </header>
      <div className="flex-1 min-h-0">
        {mode === "learn" ? <Workbench /> : <Workspace />}
      </div>
    </div>
  );
}

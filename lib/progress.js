// Progress lives entirely in localStorage — no backend, no account.

import { TOPICS, TASKS } from "./tasks";

const KEY = "datalab-progress-v1";

const EMPTY = {
  xp: 0,
  streak: 0,
  lastActive: null, // "YYYY-MM-DD" of last completed task
  completed: {}, // taskId -> true
  badges: [], // badge ids
  capstoneResults: {} // taskId -> normalized result (for the report)
};

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function yesterday() {
  const d = new Date(Date.now() - 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function loadProgress() {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY };
  }
}

function save(p) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* private mode etc. — progress just won't persist */
  }
}

export const BADGES = [
  { id: "first-task", name: "First steps", desc: "Complete your first task", icon: "🌱" },
  { id: "topic-excel-basics", name: "Grid greeter", desc: "Finish Excel Basics", icon: "▦" },
  { id: "topic-sql-fundamentals", name: "Query starter", desc: "Finish SQL Fundamentals", icon: "⌁" },
  { id: "topic-pandas-cleaning", name: "Data janitor", desc: "Finish Pandas Cleaning", icon: "🧹" },
  { id: "topic-groupby-agg", name: "Aggregator", desc: "Finish GroupBy & Aggregation", icon: "Σ" },
  { id: "topic-joins", name: "Matchmaker", desc: "Finish Joins & Merges", icon: "⋈" },
  { id: "topic-visualization", name: "Chart whisperer", desc: "Finish Visualization", icon: "📊" },
  { id: "streak-3", name: "On a roll", desc: "3-day streak", icon: "🔥" },
  { id: "capstone", name: "Case closed", desc: "Complete the capstone case study", icon: "🏆" },
  { id: "all-done", name: "Analyst in training", desc: "Complete every task", icon: "🎓" }
];

function earnedBadges(p) {
  const ids = [];
  const done = (id) => !!p.completed[id];
  if (Object.keys(p.completed).length >= 1) ids.push("first-task");
  for (const topic of TOPICS) {
    if (topic.tasks.every(done)) ids.push(topic.id === "capstone" ? "capstone" : `topic-${topic.id}`);
  }
  if (p.streak >= 3) ids.push("streak-3");
  if (Object.keys(TASKS).every(done)) ids.push("all-done");
  return ids;
}

// Marks a task complete; returns { progress, gainedXp, newBadges }.
export function completeTask(taskId, normalizedResult) {
  const p = loadProgress();
  const task = TASKS[taskId];
  const alreadyDone = !!p.completed[taskId];

  const t = today();
  if (p.lastActive !== t) {
    p.streak = p.lastActive === yesterday() ? p.streak + 1 : 1;
    p.lastActive = t;
  }

  let gainedXp = 0;
  if (!alreadyDone) {
    p.completed[taskId] = true;
    gainedXp = task.xp;
    p.xp += gainedXp;
  }
  if (task.capstone && normalizedResult) {
    p.capstoneResults[taskId] = normalizedResult;
  }

  const before = new Set(p.badges);
  p.badges = earnedBadges(p);
  const newBadges = p.badges.filter((b) => !before.has(b)).map((id) => BADGES.find((b) => b.id === id));

  save(p);
  return { progress: p, gainedXp, newBadges };
}

export function topicState(progress) {
  // Duolingo-style locking: a topic unlocks once the previous topic is complete.
  const states = {};
  let unlocked = true;
  for (const topic of TOPICS) {
    const doneCount = topic.tasks.filter((t) => progress.completed[t]).length;
    const complete = doneCount === topic.tasks.length;
    states[topic.id] = { locked: !unlocked, doneCount, total: topic.tasks.length, complete };
    unlocked = unlocked && complete;
  }
  return states;
}

export function resetProgress() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {}
  return { ...EMPTY };
}

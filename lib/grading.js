// Results from every engine are normalized to either
//   { kind: "scalar", value }            or
//   { kind: "table", cols: [], rows: [][] }
// Grading compares the learner's normalized output against the reference
// solution's output from the same engine. Column names are ignored so
// `SUM(revenue)` vs `SUM(revenue) AS total` both pass.

function normCell(v) {
  if (v === null || v === undefined) return "∅";
  if (typeof v === "number") {
    if (Number.isNaN(v)) return "∅";
    const r = Math.round(v * 10000) / 10000;
    return String(r === 0 ? 0 : r);
  }
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  const s = String(v).trim();
  // "120.50" and 120.5 should match across engines
  if (s !== "" && !Number.isNaN(Number(s))) return normCell(Number(s));
  return s;
}

function asMatrix(res) {
  if (!res) return null;
  if (res.kind === "scalar") {
    const v = res.value;
    if (Array.isArray(v)) return [v.map(normCell)];
    return [[normCell(v)]];
  }
  return res.rows.map((r) => r.map(normCell));
}

export function compareResults(user, expected, orderMatters = false) {
  const u = asMatrix(user);
  const e = asMatrix(expected);
  if (!u || !e) return { pass: false, reason: "No result to compare." };
  if (u.length !== e.length) {
    return { pass: false, reason: `Expected ${e.length} row${e.length === 1 ? "" : "s"}, got ${u.length}.` };
  }
  if ((u[0]?.length || 0) !== (e[0]?.length || 0)) {
    return { pass: false, reason: `Expected ${e[0]?.length || 0} column${(e[0]?.length || 0) === 1 ? "" : "s"}, got ${u[0]?.length || 0}.` };
  }
  const key = (row) => row.join("␟");
  const us = orderMatters ? u.map(key) : u.map(key).sort();
  const es = orderMatters ? e.map(key) : e.map(key).sort();
  for (let i = 0; i < es.length; i++) {
    if (us[i] !== es[i]) {
      return {
        pass: false,
        reason: orderMatters
          ? "The values or their order don't match the expected result."
          : "Right shape, but some values don't match the expected result."
      };
    }
  }
  return { pass: true };
}

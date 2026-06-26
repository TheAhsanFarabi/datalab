// A small Excel-style formula engine: arithmetic, cell refs, ranges, and the
// functions a beginner data course needs. Grid rows are 1-indexed like Excel
// (row 1 = headers), columns are letters.

function colIndex(letters) {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function tokenize(src) {
  const tokens = [];
  let i = 0;
  const peek = () => src[i];
  while (i < src.length) {
    const c = src[i];
    if (c === " " || c === "\t") { i++; continue; }
    if (c === '"') {
      let j = i + 1, s = "";
      while (j < src.length && src[j] !== '"') s += src[j++];
      if (src[j] !== '"') throw new Error("Unclosed quote in formula");
      tokens.push({ t: "str", v: s });
      i = j + 1; continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      tokens.push({ t: "num", v: Number(src.slice(i, j)) });
      i = j; continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      const word = src.slice(i, j).toUpperCase();
      i = j;
      const cellMatch = word.match(/^([A-Z]+)([0-9]+)$/);
      if (cellMatch && peek() === ":") {
        i++; // consume ':'
        let k = i;
        while (k < src.length && /[A-Za-z0-9]/.test(src[k])) k++;
        const end = src.slice(i, k).toUpperCase().match(/^([A-Z]+)([0-9]+)$/);
        if (!end) throw new Error("#REF! bad range");
        i = k;
        tokens.push({ t: "range", c1: colIndex(cellMatch[1]), r1: +cellMatch[2], c2: colIndex(end[1]), r2: +end[2] });
      } else if (cellMatch) {
        tokens.push({ t: "cell", c: colIndex(cellMatch[1]), r: +cellMatch[2] });
      } else {
        tokens.push({ t: "name", v: word });
      }
      continue;
    }
    const two = src.slice(i, i + 2);
    if (two === "<>" || two === "<=" || two === ">=") { tokens.push({ t: "op", v: two }); i += 2; continue; }
    if ("+-*/(),=<>&".includes(c)) { tokens.push({ t: "op", v: c }); i++; continue; }
    throw new Error(`Unexpected character "${c}" in formula`);
  }
  return tokens;
}

export function evaluateFormula(formula, grid) {
  const src = String(formula).trim();
  if (!src.startsWith("=")) throw new Error("Formulas must start with =");
  const tokens = tokenize(src.slice(1));
  let pos = 0;

  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  const expectOp = (v) => {
    const tk = next();
    if (!tk || tk.t !== "op" || tk.v !== v) throw new Error(`Expected "${v}" in formula`);
  };

  function cellValue(c, r) {
    const row = grid[r - 1];
    if (!row || c >= row.length || c < 0 || r < 1) throw new Error("#REF! cell outside the data");
    return row[c];
  }

  function rangeValues(tk) {
    const out = [];
    for (let r = tk.r1; r <= tk.r2; r++) {
      for (let c = tk.c1; c <= tk.c2; c++) out.push(cellValue(c, r));
    }
    return out;
  }

  function toNum(v) {
    if (typeof v === "number") return v;
    if (v === null || v === undefined || v === "") return 0;
    const n = Number(v);
    if (Number.isNaN(n)) throw new Error("#VALUE! expected a number");
    return n;
  }

  const numsOnly = (vals) => vals.filter((v) => typeof v === "number");

  function matchCriteria(value, crit) {
    if (typeof crit === "number") return typeof value === "number" && value === crit;
    const s = String(crit);
    const m = s.match(/^(<>|<=|>=|<|>|=)(.*)$/);
    if (m) {
      const [, op, rest] = m;
      const num = Number(rest);
      const isNum = rest !== "" && !Number.isNaN(num);
      const a = value;
      if (op === "=") return isNum ? a === num : String(a ?? "") === rest;
      if (op === "<>") return isNum ? a !== num : String(a ?? "") !== rest;
      if (a === null || a === undefined || typeof a !== "number" || !isNum) return false;
      if (op === "<") return a < num;
      if (op === ">") return a > num;
      if (op === "<=") return a <= num;
      if (op === ">=") return a >= num;
    }
    return String(value ?? "").toLowerCase() === s.toLowerCase();
  }

  function ifsPairs(args, start) {
    const pairs = [];
    for (let i = start; i < args.length; i += 2) {
      if (!args[i + 1]) throw new Error("#VALUE! IFS functions need range/criteria pairs");
      if (args[i].kind !== "range") throw new Error("#VALUE! expected a range");
      pairs.push([args[i].values, args[i + 1].value]);
    }
    return pairs;
  }

  function rowsMatching(pairs, length) {
    const keep = [];
    for (let i = 0; i < length; i++) {
      if (pairs.every(([vals, crit]) => matchCriteria(vals[i], crit))) keep.push(i);
    }
    return keep;
  }

  const FUNCS = {
    SUM: (a) => flat(a).reduce((s, v) => s + (typeof v === "number" ? v : 0), 0),
    AVERAGE: (a) => {
      const ns = numsOnly(flat(a));
      if (!ns.length) throw new Error("#DIV/0! AVERAGE of nothing");
      return ns.reduce((s, v) => s + v, 0) / ns.length;
    },
    COUNT: (a) => numsOnly(flat(a)).length,
    COUNTA: (a) => flat(a).filter((v) => v !== null && v !== undefined && v !== "").length,
    COUNTBLANK: (a) => flat(a).filter((v) => v === null || v === undefined || v === "").length,
    MIN: (a) => { const ns = numsOnly(flat(a)); if (!ns.length) throw new Error("#VALUE! MIN of nothing"); return Math.min(...ns); },
    MAX: (a) => { const ns = numsOnly(flat(a)); if (!ns.length) throw new Error("#VALUE! MAX of nothing"); return Math.max(...ns); },
    ROUND: (a) => {
      const x = toNum(a[0].value), n = a[1] ? toNum(a[1].value) : 0;
      const f = Math.pow(10, n);
      return Math.round((x + Number.EPSILON) * f) / f;
    },
    IF: (a) => (truthy(a[0].value) ? a[1]?.value ?? true : a[2]?.value ?? false),
    COUNTIF: (a) => {
      requireRange(a[0]);
      return a[0].values.filter((v) => matchCriteria(v, a[1].value)).length;
    },
    SUMIF: (a) => {
      requireRange(a[0]);
      const sumVals = a[2] ? (requireRange(a[2]), a[2].values) : a[0].values;
      return a[0].values.reduce((s, v, i) => s + (matchCriteria(v, a[1].value) && typeof sumVals[i] === "number" ? sumVals[i] : 0), 0);
    },
    AVERAGEIF: (a) => {
      requireRange(a[0]);
      const avgVals = a[2] ? (requireRange(a[2]), a[2].values) : a[0].values;
      const picked = avgVals.filter((v, i) => matchCriteria(a[0].values[i], a[1].value) && typeof v === "number");
      if (!picked.length) throw new Error("#DIV/0! no matching cells");
      return picked.reduce((s, v) => s + v, 0) / picked.length;
    },
    COUNTIFS: (a) => rowsMatching(ifsPairs(a, 0), a[0].values.length).length,
    SUMIFS: (a) => {
      requireRange(a[0]);
      const idx = rowsMatching(ifsPairs(a, 1), a[0].values.length);
      return idx.reduce((s, i) => s + (typeof a[0].values[i] === "number" ? a[0].values[i] : 0), 0);
    },
    AVERAGEIFS: (a) => {
      requireRange(a[0]);
      const idx = rowsMatching(ifsPairs(a, 1), a[0].values.length).filter((i) => typeof a[0].values[i] === "number");
      if (!idx.length) throw new Error("#DIV/0! no matching cells");
      return idx.reduce((s, i) => s + a[0].values[i], 0) / idx.length;
    }
  };

  function requireRange(arg) {
    if (arg.kind !== "range") throw new Error("#VALUE! expected a range like D2:D25");
  }

  const flat = (args) => args.flatMap((a) => (a.kind === "range" ? a.values : [a.value]));
  const truthy = (v) => v === true || (typeof v === "number" && v !== 0);

  function parseExpr() {
    let left = parseAdd();
    const tk = peek();
    if (tk && tk.t === "op" && ["=", "<>", "<", ">", "<=", ">="].includes(tk.v)) {
      next();
      const right = parseAdd();
      const a = left.value, b = right.value;
      const cmp = {
        "=": a === b, "<>": a !== b,
        "<": toNum(a) < toNum(b), ">": toNum(a) > toNum(b),
        "<=": toNum(a) <= toNum(b), ">=": toNum(a) >= toNum(b)
      }[tk.v];
      return { kind: "value", value: cmp };
    }
    return left;
  }

  function parseAdd() {
    let left = parseTerm();
    while (peek() && peek().t === "op" && (peek().v === "+" || peek().v === "-")) {
      const op = next().v;
      const right = parseTerm();
      left = { kind: "value", value: op === "+" ? toNum(left.value) + toNum(right.value) : toNum(left.value) - toNum(right.value) };
    }
    return left;
  }

  function parseTerm() {
    let left = parseFactor();
    while (peek() && peek().t === "op" && (peek().v === "*" || peek().v === "/")) {
      const op = next().v;
      const right = parseFactor();
      if (op === "/") {
        const d = toNum(right.value);
        if (d === 0) throw new Error("#DIV/0!");
        left = { kind: "value", value: toNum(left.value) / d };
      } else {
        left = { kind: "value", value: toNum(left.value) * toNum(right.value) };
      }
    }
    return left;
  }

  function parseFactor() {
    const tk = next();
    if (!tk) throw new Error("Formula ended unexpectedly");
    if (tk.t === "num") return { kind: "value", value: tk.v };
    if (tk.t === "str") return { kind: "value", value: tk.v };
    if (tk.t === "cell") return { kind: "value", value: cellValue(tk.c, tk.r) };
    if (tk.t === "range") return { kind: "range", values: rangeValues(tk) };
    if (tk.t === "op" && tk.v === "-") {
      const f = parseFactor();
      return { kind: "value", value: -toNum(f.value) };
    }
    if (tk.t === "op" && tk.v === "(") {
      const inner = parseExpr();
      expectOp(")");
      return inner;
    }
    if (tk.t === "name") {
      const fn = FUNCS[tk.v];
      if (!fn) throw new Error(`#NAME? ${tk.v}`);
      expectOp("(");
      const args = [];
      if (peek() && !(peek().t === "op" && peek().v === ")")) {
        args.push(parseExpr());
        while (peek() && peek().t === "op" && peek().v === ",") {
          next();
          args.push(parseExpr());
        }
      }
      expectOp(")");
      return { kind: "value", value: fn(args) };
    }
    throw new Error("Couldn't parse the formula");
  }

  const out = parseExpr();
  if (pos < tokens.length) throw new Error("Extra content after the formula");
  if (out.kind === "range") throw new Error("#VALUE! a bare range isn't a result — wrap it in a function");
  return out.value;
}

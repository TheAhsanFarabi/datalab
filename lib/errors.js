// Rule-based plain-English explanations for the errors beginners hit most.

const PYTHON_RULES = [
  {
    re: /KeyError: ['"]?(.+?)['"]?\n?$/m,
    explain: (m) =>
      `Python can't find a column or key named ${m[1]}. Check the spelling and capitalization — column names must match exactly. Run df.columns to see the real names.`
  },
  {
    re: /NameError: name '(.+?)' is not defined/,
    explain: (m) =>
      `You used the name "${m[1]}" but nothing with that name exists yet. It's usually a typo, or a variable you forgot to create. The dataset is loaded as df.`
  },
  {
    re: /SyntaxError/,
    explain: () =>
      "Python couldn't read your code's structure. Common causes: a missing closing bracket ) or ], unbalanced quotes, or a stray comma. Check the line the error points at — and the line just above it."
  },
  {
    re: /IndentationError/,
    explain: () =>
      "Python is picky about leading spaces. Make sure lines that belong together start at the same indentation, and only indent after a line ending in a colon."
  },
  {
    re: /AttributeError: .*has no attribute '(.+?)'/,
    explain: (m) =>
      `Whatever is before the dot doesn't have a method or property called "${m[1]}". Check the spelling (it's drop_duplicates, sort_values, reset_index — with underscores), and make sure you're calling it on the right thing.`
  },
  {
    re: /TypeError: .*not callable/,
    explain: () =>
      "You used parentheses () on something that isn't a function. For example df.shape is a property, not a function — no parentheses needed."
  },
  {
    re: /TypeError/,
    explain: () =>
      "Two pieces of your code don't fit together — often mixing text and numbers, or passing the wrong kind of argument. Check what each value actually is."
  },
  {
    re: /ValueError/,
    explain: () =>
      "A function received a value it can't work with. Check the arguments you're passing in — a common one is using a column name that produces unexpected data."
  },
  {
    re: /__no_result__/,
    explain: () =>
      "Your code ran fine, but no variable called result was created. Assign your final answer to it, like: result = df.head()"
  }
];

const SQL_RULES = [
  {
    re: /no such table: (\w+)/i,
    explain: (m) =>
      `There's no table called "${m[1]}" in this lesson. Check the task description for the exact table name — table names are case-sensitive here.`
  },
  {
    re: /no such column: ([\w.]+)/i,
    explain: (m) =>
      `The column "${m[1]}" doesn't exist in that table. Check the spelling against the column headers shown in the data preview.`
  },
  {
    re: /near "(.*?)": syntax error/i,
    explain: (m) =>
      `SQL got confused right around "${m[1]}". Common causes: a missing comma between columns, a missing FROM, or keywords out of order (SELECT → FROM → WHERE → GROUP BY → ORDER BY → LIMIT).`
  },
  {
    re: /misuse of aggregate/i,
    explain: () =>
      "Aggregate functions like SUM() and AVG() can't go in a WHERE clause. Filter plain columns with WHERE; filter aggregated values with HAVING after GROUP BY."
  },
  {
    re: /ambiguous column name/i,
    explain: () =>
      "Both joined tables have a column with this name. Prefix it with the table alias, like o.customer_id or c.customer_id."
  },
  {
    re: /__no_result__/,
    explain: () =>
      "The query ran but returned no result set. Make sure you're writing a SELECT statement."
  }
];

const EXCEL_RULES = [
  {
    re: /#NAME\?\s*(.*)/,
    explain: (m) =>
      `Excel doesn't recognize a function name${m[1] ? ` (${m[1]})` : ""}. Supported here: SUM, AVERAGE, COUNT, COUNTA, COUNTBLANK, MIN, MAX, ROUND, IF, COUNTIF, SUMIF, AVERAGEIF, COUNTIFS, SUMIFS, AVERAGEIFS.`
  },
  {
    re: /#REF/,
    explain: () =>
      "A cell reference points outside the data. References look like B2 or a range like B2:B25 — check the row numbers in the grid."
  },
  {
    re: /#DIV\/0/,
    explain: () => "You're dividing by zero (or by an empty cell). Check the denominator."
  },
  {
    re: /must start with =/i,
    explain: () => "Formulas start with an equals sign, like =SUM(F2:F25)."
  },
  {
    re: /.*/,
    explain: () =>
      "The formula couldn't be evaluated. Check that every ( has a matching ), text criteria are in double quotes, and arguments are separated by commas."
  }
];

export function explainError(mode, message) {
  const rules = mode === "python" ? PYTHON_RULES : mode === "sql" ? SQL_RULES : EXCEL_RULES;
  for (const rule of rules) {
    const m = String(message).match(rule.re);
    if (m) return rule.explain(m);
  }
  return null;
}

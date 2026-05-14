// Triggers biome's lint/style/noNonNullAssertion at warning level when the
// rule is enabled with `level: "warn"`. Verifies that the lint parse_regex
// captures '!' (warning marker) findings, not just '×' (error marker).
const value: number | null = null;
const result = value!.toFixed();
console.log(result);

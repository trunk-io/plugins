import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { REPO_ROOT } from "tests/utils";

// TODO(Tyler): Burndown this list.
const excludedLinters: string[] = ["codespell", "cspell", "nancy", "oxipng", "sqlfmt", "trivy"];

describe("All linters must have tests", () => {
  // Find all tests detected by jest
  const stdout = execSync("npm run test -- --listTests", { cwd: REPO_ROOT }).toString();
  const testFiles = stdout
    .split("\n")
    .filter((file) => file.startsWith("/"))
    .map((file) => path.relative(REPO_ROOT, file));

  // Key the tests by their linter subdirectory
  const testDirMap = testFiles.reduce((accumulator: Map<string, string[]>, file: string) => {
    const linterSubdir = file.match(/linters\/[^/]+/);
    if (linterSubdir) {
      const matches = accumulator.get(linterSubdir[0]) ?? [];
      accumulator.set(linterSubdir[0], [...matches, file]);
    }
    return accumulator;
  }, new Map<string, string[]>());
  const testDirObject = Object.fromEntries(testDirMap);

  // Find all linter subdirectories
  const linterDir = path.resolve(REPO_ROOT, "linters");
  const linters = fs
    .readdirSync(linterDir)
    .filter((file) => fs.lstatSync(path.resolve(linterDir, file)).isDirectory());

  // Assert that each linter subdirectory has a test (excluding an explicit subset)
  linters
    .filter((linter) => !excludedLinters.includes(linter))
    .forEach((linter) => {
      // trunk-ignore(eslint/jest/valid-title)
      it(linter, () => {
        const linterSubdir = path.join("linters", linter);
        expect(testDirObject).toHaveProperty(linterSubdir);
      });
    });
});

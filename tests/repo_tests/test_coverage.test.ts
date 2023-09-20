import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { REPO_ROOT } from "tests/utils";

// This should be empty unless we've agreed that certain linters can omit coverage. e.g. ["oxipng"]
// Note that any linters without tests will not upload validated versions for `trunk upgrade`.
const excludedLinters: string[] = [];

// This test asserts that all linters have at least one test. All new linters are expected to have
// test coverage. Review tests/readme.md for testing guidelines. Prefer using npm test for indirection
// in this test so that we get an accurate list of all tests, regardless of any changes to the test spec
// in jest.config.json.
describe("All linters must have tests", () => {
  // Find all tests detected by jest
  const stdout = execSync("npm test -- --listTests", { cwd: REPO_ROOT }).toString();
  const testFiles = stdout
    .split("\n")
    .filter((file) => file.startsWith("/") || file.match(/[A-Z]:\\/))
    .map((file) => path.relative(REPO_ROOT, file));

  // Key the tests by their linter subdirectory
  const testDirMap = testFiles.reduce((accumulator: Map<string, string[]>, file: string) => {
    const linterSubdir =
      process.platform === "win32" ? file.match(/linters\\[^\\]+/) : file.match(/linters\/[^/]+/);
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

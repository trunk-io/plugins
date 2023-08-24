import fs from "fs";
import path from "path";
import { REPO_ROOT } from "tests/utils";

const excludedLinters: string[] = [];
const abbreviationMapping = new Map<string, string>([["iwyu", "include-what-you-use"]]);

const readmeContents = fs.readFileSync(path.resolve(REPO_ROOT, "readme.md"), { encoding: "utf-8" });
const readmeTableContents = readmeContents.substring(
  readmeContents.indexOf("### Supported Linters"),
  readmeContents.indexOf("### Supported Trunk Actions"),
);
const reducedReadmeContents = readmeTableContents ? readmeTableContents : readmeContents;

// This test asserts that all linters are included in the root readme.md. This does not cover subcommands, and it assumes one
// directory per linter. Name mapping can be achieved through `abbreviationMapping`.
describe("All linters must be included in readme.md", () => {
  // Find all linter subdirectories
  const linterDir = path.resolve(REPO_ROOT, "linters");
  const linters = fs
    .readdirSync(linterDir)
    .filter((file) => fs.lstatSync(path.resolve(linterDir, file)).isDirectory());

  // Assert that each linter subdirectory is included in the repo's readme.md
  linters
    .filter((linter) => !excludedLinters.includes(linter))
    .forEach((linter) => {
      // trunk-ignore(eslint/jest/valid-title)
      it(linter, () => {
        const fullName = abbreviationMapping.get(linter) ?? linter;
        expect(reducedReadmeContents).toContain(fullName);
      });
    });
});

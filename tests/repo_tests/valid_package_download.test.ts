import fs from "fs";
import path from "path";
import { REPO_ROOT } from "tests/utils";
import { parseYaml } from "tests/utils/trunk_config";

// These linters use go or rust downloads.
const excludedLinters: string[] = [
  "clippy",
  "gofmt",
  "rustfmt",
  "terraform-fmt",
  "terraform-validate",
];

// This test asserts that all linters that have a `download` specified (as opposed to custom run command or package)
// Must also define that download in its same file. Otherwise, this would be a runtime error.
// Additionally, any linters that reference a download or package must have a known_good_version.
describe("Validate linter download/package setup", () => {
  // Find all linter subdirectories
  const linterDir = path.resolve(REPO_ROOT, "linters");
  const linters = fs
    .readdirSync(linterDir)
    .filter((file) => fs.lstatSync(path.resolve(linterDir, file)).isDirectory());

  linters.forEach((linter) => {
    // trunk-ignore(eslint/jest/valid-title)
    it(linter, () => {
      // trunk-ignore-begin(eslint): Expected any accesses
      // Ignoring no-unsafe-member-access, no-unsafe-assignment, no-unsafe-call, no-unsafe-return, and conditional jest expect
      const yamlContents = parseYaml(path.resolve(linterDir, linter, "plugin.yaml"));

      yamlContents.lint?.definitions?.forEach((definition: any) => {
        // All linters that have downloads must define them
        if (definition.download && !excludedLinters.includes(definition.name)) {
          const downloads: string[] = [];
          if (yamlContents.lint?.downloads) {
            yamlContents.lint?.downloads.forEach((download: any) => {
              downloads.push(download.name);
            });
          }
          if (yamlContents.downloads) {
            yamlContents.downloads.forEach((download: any) => {
              downloads.push(download.name);
            });
          }
          expect(downloads).toContain(definition.download);
          // trunk-ignore-end(eslint)
        }
      });
    });
  });
});

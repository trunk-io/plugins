import { execFileSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import path from "path";
import { fuzzyLinterCheckTest } from "tests";
import { FileIssue } from "tests/types";
import { conditionalTest } from "tests/utils";
import { createFuzzyMatcher } from "tests/utils/landing_state";

// trunk-ignore(eslint/@typescript-eslint/no-unsafe-assignment)
const expectedFileIssues = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "expected_issues.json")).toString(),
);

fuzzyLinterCheckTest({
  linterName: "osv-scanner",
  args: "-a -n",
  fileIssueAssertionCallback: createFuzzyMatcher(() => expectedFileIssues as FileIssue[], 100),
});

const resolvePython = (): string | undefined => {
  for (const bin of ["python3", "python"]) {
    try {
      execFileSync(bin, ["--version"], { stdio: "ignore" });
      return bin;
    } catch {
      // Try the next candidate.
    }
  }
  return undefined;
};

// Runs osv_to_sarif.py directly on hand-written osv-scanner output, so edge cases in
// the advisory data can be tested without depending on what the live OSV database returns.
describe("osv_to_sarif.py", () => {
  const pythonBin = resolvePython();
  let sandbox: string;
  let lockfile: string;

  beforeAll(() => {
    sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "osv-to-sarif-"));
    lockfile = path.join(sandbox, "yarn.lock");
    fs.writeFileSync(lockfile, 'phoenix@1.8.8:\n  version "1.8.8"\n');
  });

  afterAll(() => {
    if (sandbox) {
      fs.rmSync(sandbox, { recursive: true, force: true });
    }
  });

  const runParser = (name: string, summary: string, affected: unknown[]): string[] => {
    const osvOutput = {
      results: [
        {
          source: { path: lockfile, type: "lockfile" },
          packages: [
            {
              package: { name, version: "1.8.8", ecosystem: "npm" },
              vulnerabilities: [{ id: "TEST-0001", summary, affected }],
            },
          ],
        },
      ],
    };
    const out = execFileSync(pythonBin ?? "python3", [path.join(__dirname, "osv_to_sarif.py")], {
      input: JSON.stringify(osvOutput),
      encoding: "utf8",
    });
    const sarif = JSON.parse(out) as { runs: { results: { message: { text: string } }[] }[] };
    return sarif.runs[0].results.map((result) => result.message.text);
  };

  conditionalTest(pythonBin === undefined, "handles affected entries without a package", () => {
    const messages = runParser("phoenix", "XSS in phoenix", [
      { ranges: [{ type: "GIT", repo: "https://github.com/phoenixframework/phoenix" }] },
      {
        package: { name: "phoenix", ecosystem: "npm" },
        ranges: [{ type: "ECOSYSTEM", events: [{ introduced: "0" }, { fixed: "1.8.9" }] }],
      },
    ]);
    expect(messages).toEqual([
      "XSS in 'phoenix'. Current version is vulnerable: 1.8.8. Patch available: upgrade to 1.8.9 or higher.",
    ]);
  });

  conditionalTest(pythonBin === undefined, "quotes package names with regex characters", () => {
    const messages = runParser("libstdc++6", "Overflow in libstdc++6 allocator", []);
    expect(messages).toEqual([
      "Overflow in 'libstdc++6' allocator. Current version is vulnerable: 1.8.8.",
    ]);
  });
});

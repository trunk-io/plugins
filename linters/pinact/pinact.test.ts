import { execFileSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { customLinterCheckTest, setupLintDriver } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { conditionalTest, TEST_DATA } from "tests/utils";

const moveWorkflowFile =
  (filename: string, disableGhAuth = false) =>
  async (driver: TrunkLintDriver) => {
    if (disableGhAuth) {
      process.env.PINACT_DISABLE_GH_AUTH = "1";
    } else {
      delete process.env.PINACT_DISABLE_GH_AUTH;
    }
    driver.moveFile(path.join(TEST_DATA, filename), path.join(".github/workflows", filename));
    await driver.gitDriver?.add(".").commit("moved");
  };

const moveWorkflowFiles =
  (sourceDir = TEST_DATA) =>
  async (driver: TrunkLintDriver) => {
    delete process.env.PINACT_DISABLE_GH_AUTH;

    fs.readdirSync(path.resolve(driver.getSandbox(), sourceDir), { withFileTypes: true })
      .filter((file) => file.isFile())
      .forEach((file) => {
        driver.moveFile(path.join(sourceDir, file.name), path.join(".github/workflows", file.name));
      });
    await driver.gitDriver?.add(".").commit("moved");
  };

const enablePinactCommand =
  (command: string, preCheck?: (driver: TrunkLintDriver) => Promise<void>) =>
  async (driver: TrunkLintDriver) => {
    delete process.env.PINACT_DISABLE_GH_AUTH;

    const trunkYamlPath = ".trunk/trunk.yaml";
    const currentContents = driver.readFile(trunkYamlPath);
    const pinactRegex = /- pinact@(.+)\n/;

    driver.writeFile(
      trunkYamlPath,
      currentContents.replace(pinactRegex, `- pinact@$1:\n        commands: [${command}]\n`),
    );

    if (preCheck) {
      await preCheck(driver);
    }
  };

const skipIfMissingGitHubToken = () => {
  if (!process.env.GH_TOKEN && !process.env.GITHUB_TOKEN && !process.env.PINACT_GITHUB_TOKEN) {
    console.log(
      "Skipping pinact online audit test because GH_TOKEN, GITHUB_TOKEN, and PINACT_GITHUB_TOKEN are not set.",
    );
    return true;
  }
  return false;
};

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

const preCheckBadConfig = async (driver: TrunkLintDriver) => {
  process.env.PINACT_DISABLE_GH_AUTH = "1";
  driver.moveFile(path.join(TEST_DATA, "bad.pinact.yaml"), path.join(".pinact.yaml"));
  driver.moveFile(
    path.join(TEST_DATA, "missing_version_comment.in.yaml"),
    path.join(".github/workflows", "missing_version_comment.in.yaml"),
  );
  await driver.gitDriver?.add(".").commit("moved");
};

customLinterCheckTest({
  linterName: "pinact",
  testName: "bad_config",
  args: ".github",
  preCheck: preCheckBadConfig,
});

customLinterCheckTest({
  linterName: "pinact",
  testName: "missing_version_comment",
  args: ".github",
  preCheck: moveWorkflowFile("missing_version_comment.in.yaml", true),
});

customLinterCheckTest({
  linterName: "pinact",
  testName: "unpinned",
  args: ".github",
  preCheck: moveWorkflowFile("unpinned.in.yaml", true),
});

customLinterCheckTest({
  linterName: "pinact",
  testName: "version_comment",
  args: ".github",
  preCheck: moveWorkflowFiles(path.join(TEST_DATA, "online")),
  skipTestIf: skipIfMissingGitHubToken,
});

customLinterCheckTest({
  linterName: "pinact",
  testName: "upgrade",
  args: ".github",
  preCheck: enablePinactCommand("upgrade", moveWorkflowFile("unpinned.in.yaml")),
  skipTestIf: skipIfMissingGitHubToken,
});

// The snapshot tests above never apply a fix (the driver's runCheck forces
// `-n`), so none of them caught pinact SARIF whose `deletedRegion` was
// line-only: Trunk read that as a zero-width insert and concatenated the pinned
// `uses:` with the original one on a single line. This applies the fix for real
// and asserts the rewrite is clean. Kept online (a resolvable SHA is required to
// exercise the fix path) and version-independent (no snapshot of the volatile
// SHA) — it only asserts the structural invariant the bug violated.
describe("Testing linter pinact fix application", () => {
  const driver = setupLintDriver(
    __dirname,
    {},
    "pinact",
    undefined,
    moveWorkflowFile("unpinned.in.yaml"),
  );

  conditionalTest(
    skipIfMissingGitHubToken(),
    "pins to a SHA without corrupting the line",
    async () => {
      await driver
        .runTrunkCmd("check --filter=pinact --fix -y --no-progress --ignore-git-state .github")
        .catch(() => undefined);

      const fixed = driver.readFile(".github/workflows/unpinned.in.yaml");
      // The action is pinned to a full 40-char SHA with its version comment...
      expect(fixed).toMatch(/uses: actions\/checkout@[0-9a-f]{40} # v\d/);
      // ...and no line carries the concatenated `<pinned> # … <original>` corruption.
      expect(fixed).not.toMatch(/uses:.*#.*uses:/);
      // The single input `uses:` stays single — the corruption doubled it.
      expect(fixed.match(/uses:/g)).toHaveLength(1);
    },
  );
});

interface FixRegion {
  startLine: number;
  startColumn?: number;
  endLine?: number;
  endColumn?: number;
}

interface FixSarif {
  runs: {
    results: {
      fixes: { artifactChanges: { replacements: { deletedRegion: FixRegion }[] }[] }[];
    }[];
  }[];
}

// Deterministic, offline coverage of the SARIF fix-region normalization that
// pinact_run.py applies before Trunk consumes it. pinact can only pin online
// (it resolves tags -> SHAs via the GitHub API), so the end-to-end fix test
// above is token-gated; this drives the pure transformation directly, so the
// invariant is locked on every CI run with no token or network.
describe("pinact SARIF fix-region normalization", () => {
  const pythonBin = resolvePython();
  // A representative unpinned step; the trailing `@v4` is what pinact rewrites.
  const line = "      - uses: actions/checkout@v4";
  let sandbox: string;

  beforeAll(() => {
    sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "pinact-normalize-"));
    const workflowDir = path.join(sandbox, ".github", "workflows");
    fs.mkdirSync(workflowDir, { recursive: true });
    fs.writeFileSync(path.join(workflowDir, "wf.yaml"), `jobs:\n  a:\n    steps:\n${line}\n`);
  });

  afterAll(() => {
    if (sandbox) {
      fs.rmSync(sandbox, { recursive: true, force: true });
    }
  });

  // Invoke pinact_run.normalize_fix_regions on `sarif` with cwd at the sandbox,
  // so the relative artifact URI resolves to the fixture workflow above.
  const normalize = (sarif: unknown): FixSarif => {
    const script =
      "import sys; sys.path.insert(0, sys.argv[1]); import pinact_run; " +
      "sys.stdout.write(pinact_run.normalize_fix_regions(sys.stdin.read()))";
    const out = execFileSync(pythonBin ?? "python3", ["-c", script, __dirname], {
      input: JSON.stringify(sarif),
      cwd: sandbox,
      encoding: "utf8",
    });
    return JSON.parse(out) as FixSarif;
  };

  const sarifWithRegion = (deletedRegion: FixRegion) => ({
    runs: [
      {
        results: [
          {
            fixes: [
              {
                artifactChanges: [
                  {
                    artifactLocation: { uri: ".github/workflows/wf.yaml" },
                    replacements: [
                      {
                        deletedRegion,
                        insertedContent: { text: line.replace("@v4", "@<sha> # v4.4.0") },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });

  const regionOf = (sarif: FixSarif): FixRegion =>
    sarif.runs[0].results[0].fixes[0].artifactChanges[0].replacements[0].deletedRegion;

  conditionalTest(
    pythonBin === undefined,
    "widens a line-only region to span the whole original line",
    () => {
      const out = normalize(sarifWithRegion({ startLine: 4 }));
      // Full-line replacement covers columns 1..len(line); endColumn is exclusive.
      expect(regionOf(out)).toEqual({
        startLine: 4,
        startColumn: 1,
        endLine: 4,
        endColumn: line.length + 1,
      });
    },
  );

  conditionalTest(
    pythonBin === undefined,
    "leaves an already fully-specified region unchanged",
    () => {
      const region: FixRegion = { startLine: 4, startColumn: 5, endLine: 4, endColumn: 10 };
      expect(regionOf(normalize(sarifWithRegion(region)))).toEqual(region);
    },
  );

  conditionalTest(
    pythonBin === undefined,
    "preserves an explicit startColumn while backfilling the line end",
    () => {
      const out = normalize(sarifWithRegion({ startLine: 4, startColumn: 9 }));
      expect(regionOf(out)).toEqual({
        startLine: 4,
        startColumn: 9,
        endLine: 4,
        endColumn: line.length + 1,
      });
    },
  );

  conditionalTest(
    pythonBin === undefined,
    "backfills endColumn when only startLine and endLine are given",
    () => {
      const out = normalize(sarifWithRegion({ startLine: 4, endLine: 4 }));
      expect(regionOf(out)).toEqual({
        startLine: 4,
        startColumn: 1,
        endLine: 4,
        endColumn: line.length + 1,
      });
    },
  );

  conditionalTest(
    pythonBin === undefined,
    "leaves a line-only region untouched when the target line is out of range",
    () => {
      const region: FixRegion = { startLine: 999 };
      expect(regionOf(normalize(sarifWithRegion(region)))).toEqual(region);
    },
  );
});

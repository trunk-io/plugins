import Debug from "debug";
import fs from "fs";
import * as os from "os";
import path from "path";
import semver from "semver";
import { CheckType, LandingState, LinterVersion, TaskFailure, TestingArguments } from "tests/types";

export const REPO_ROOT = path.resolve(__dirname, "../..");
export const TEST_DATA = "test_data";
export const TEMP_PREFIX = "plugins_";
export const DOWNLOAD_CACHE = path.resolve(
  fs.realpathSync(os.tmpdir()),
  `${TEMP_PREFIX}testing_download_cache`,
);

// As this file and folder increase in complexity, extract out functionality into other categories.
// Avoid overpolluting a `utils` folder.

/**
 * Parse the environment variable-specified linter version. This can either be:
 * 1. KnownGoodVersion, which parses the linter definition and attempts to specify a known_good_version.
 * 2. Latest, which automatically retrieves the latest linter version if network connectivity is available.
 * 3. Snapshots, which runs tests against all of the generated snapshots for a linter or formatter.
 * 4. A specified version. Note that this will apply to all tests, so only use this environment variable when tests are filtered.
 */
const parseLinterVersion = (value: string): LinterVersion | undefined => {
  if (value && value.length > 0) {
    return value;
  }
  return undefined;
};

const coalesceString = (value?: string): string | undefined => {
  if (value && value !== "") {
    return value;
  }
  return undefined;
};

const normalizePath = (value?: string): string | undefined => {
  if (value && coalesceString(value)) {
    if (path.isAbsolute(value)) {
      return value;
    }
    return path.resolve(REPO_ROOT, value);
  }
  return undefined;
};

/**
 * Parses the global testing config inputs, specified as environment variables.
 * - PLUGINS_TEST_CLI_VERSION replaces the repo-wide trunk.yaml's specified cli-version.
 * - PLUGINS_TEST_CLI_PATH specifies an alternative path to a trunk binary.
 * - PLUGINS_TEST_LINTER_VERSION specifies a linter version semantic (see `parseLinterVersion`).
 * - PLUGINS_TEST_UPDATE_SNAPSHOTS uses the snapshot from the enabled version of the linter, creating a new snapshot if necessary.
 * - SANDBOX_DEBUG prevents test directories from being deleted.
 */
export const ARGS: TestingArguments = {
  cliVersion: coalesceString(process.env.PLUGINS_TEST_CLI_VERSION),
  cliPath: normalizePath(process.env.PLUGINS_TEST_CLI_PATH),
  linterVersion: parseLinterVersion(process.env.PLUGINS_TEST_LINTER_VERSION ?? ""),
  dumpNewSnapshot: Boolean(process.env.PLUGINS_TEST_UPDATE_SNAPSHOTS),
  sandboxDebug: Boolean(process.env.SANDBOX_DEBUG),
};
// TODO(Tyler): PLUGINS_TEST_LINTER_VERSION is a string version, we should mandate that a test filter is applied
// to avoid accidental enables.
if (
  ARGS.cliVersion ||
  ARGS.cliPath ||
  ARGS.linterVersion ||
  ARGS.dumpNewSnapshot ||
  ARGS.sandboxDebug
) {
  Debug("Tests").extend("Global")("%o", ARGS);
}

/**
 * Calculate the name for a given snapshot file. Use this as a standardized convention.
 * Rationale for each component:
 *  - linterName is required because a user could define multiple linters and have them run on the same target
 *  - prefix is required because a user could have a linter run on multiple targets (the driver currently is one target each)
 *  - checkType is required because a linter could have lint and fix subcommands and run on the same target
 *  - linterVersion is required because of linter changes (see tests/readme.md)
 * In the future we may want to segment these by directories for each test case/target, but for now we keep everything
 * proximally located for clarity and simplicity.
 * The check and fmt versions may not have the same count, since formatters tend to be more stable than linter diagnostics.
 *
 * @param linterName the name of the linter being tested. Does not include subcommand
 * @param prefix the prefix of the named file tested against
 * @param checkType "check" or "fmt"
 * @param linterVersion optionally, the version of the linter that was enabled. If not set, assume versionless.
 */
export const getSnapshotName = (
  linterName: string,
  prefix: string,
  checkType: CheckType,
  linterVersion?: string,
) => {
  const normalizedName = linterName.replace(/-/g, "_");
  if (!linterVersion) {
    return `${normalizedName}_${prefix}.${checkType}.shot`;
  }
  return `${normalizedName}_v${linterVersion}_${prefix}.${checkType}.shot`;
};

/**
 * Calculate the regex for a given snapshot file to determine available versions. Use this as a standardized convention.
 * @param linterName the name of the linter being tested. Does not include subcommand
 * @param prefix the prefix of the named file tested against. For custom fmt tests, includes the test name and file path
 * @param checkType "check" or "fmt"
 */
export const getSnapshotRegex = (linterName: string, prefix: string, checkType: CheckType) =>
  `${linterName.replace(/-/g, "_")}_(v(?<version>[^_]+)_)?${prefix}.${checkType}.shot`;

/**
 * Identifies snapshot file to use, based on linter, version, and ARGS.dumpNewSnapshot.
 *
 * @param snapshotDirPath absolute path to snapshot directory
 * @param linterName name of the linter being tested
 * @param prefix prefix of the file being checked
 * @param checkType "check" or "fmt"
 * @param linterVersion version of the linter that was enabled (may be undefined)
 * @param versionGreaterThanOrEqual optional comparator for sorting non-semver linter snapshots
 * @returns absolute path to the relevant snapshot file
 */
export const getSnapshotPathForAssert = (
  snapshotDirPath: string,
  linterName: string,
  prefix: string,
  checkType: CheckType,
  linterVersion?: string,
  versionGreaterThanOrEqual?: (_a: string, _b: string) => boolean,
): string => {
  const specificVersionSnapshotName = path.resolve(
    snapshotDirPath,
    getSnapshotName(linterName, prefix, checkType, linterVersion),
  );

  // If this is a versionless linter, don't specify a version.
  if (!linterVersion) {
    return specificVersionSnapshotName;
  }

  // If this is a versioned linter && dumpNewSnapshot, return its generated name.
  // TODO(Tyler): When npm test -- -u is suggested, we should also call out PLUGINS_TEST_UPDATE_SNAPSHOTS in the output
  if (ARGS.dumpNewSnapshot) {
    return specificVersionSnapshotName;
  }

  // Otherwise, find the most recent matching snapshot.
  const snapshotFileRegex = getSnapshotRegex(linterName, prefix, checkType);
  const availableSnapshots = fs
    .readdirSync(snapshotDirPath)
    .filter((name) => name.match(snapshotFileRegex))
    .reverse();

  // No snapshots exist.
  if (availableSnapshots.length === 0) {
    return specificVersionSnapshotName;
  }

  // Find the closest version such that version <= linterVersion
  let closestMatch;
  let closestMatchPath;
  for (const snapshotName of availableSnapshots) {
    const match = snapshotName.match(snapshotFileRegex);
    if (match && match.groups) {
      const snapshotVersion = match.groups.version;
      const comparator = versionGreaterThanOrEqual ?? semver.gte;
      if (
        comparator(linterVersion, snapshotVersion) &&
        (!closestMatch || comparator(snapshotVersion, closestMatch))
      ) {
        closestMatch = snapshotVersion;
        closestMatchPath = path.resolve(snapshotDirPath, snapshotName);
      }
    }
  }
  if (closestMatchPath) {
    return closestMatchPath;
  }

  return specificVersionSnapshotName;
};

export const getVersionsForTest = (
  dirname: string,
  linterName: string,
  prefix: string,
  checkType: CheckType,
) => {
  // TODO(Tyler): Add ARGS.linterVersion Query case for full matrix coverage
  let matchExists = false;

  const versionsList = fs
    .readdirSync(path.resolve(dirname, TEST_DATA))
    .map((file) => {
      const fileMatch = file.match(getSnapshotRegex(linterName, prefix, checkType));
      if (fileMatch) {
        matchExists = true;
        return fileMatch.groups?.version;
      }
    })
    .filter(Boolean);
  const uniqueVersionsList = Array.from(new Set(versionsList)).sort();

  // Check if no snapshots exist yet. If this is the case, run with KnownGoodVersion and Latest, and print advisory text.
  if (!matchExists && !ARGS.linterVersion) {
    console.log(
      `No snapshots detected for ${linterName} ${prefix} ${checkType} test. Running test against KnownGoodVersion. See tests/readme.md for more information.`,
    );
    return ["KnownGoodVersion"];
  }

  // Versionless linters must return a non-empty array, so check the list's length here.
  if (ARGS.linterVersion === "Snapshots" && uniqueVersionsList.length > 0) {
    return uniqueVersionsList;
  }

  // Enabled version logic will be handled later in the pipeline if ARGS.linterVersion is KnownGoodVersion|Latest|string
  if (ARGS.linterVersion) {
    return [ARGS.linterVersion];
  }
  return [undefined];
};

/**
 * Helper function to step N directories into a path. Throws if unavailable
 */
export const recurseLevels = (starterPath: string, n: number) => {
  let currentPath = starterPath;
  for (let i = 0; i < n; i++) {
    const contents = fs.readdirSync(currentPath);
    for (const file of contents) {
      if (fs.lstatSync(path.resolve(currentPath, file)).isDirectory()) {
        currentPath = path.resolve(currentPath, file);
        break;
      }
      throw new Error(`Could not find directory inside of ${currentPath}`);
    }
  }
  return currentPath;
};

/**
 * Helper callback that skips a test if the OS is included in excludedOS.
 * Intended to be passed to `skipTestIf`.
 */
export const skipOS = (excludedOS: string[]) => (_version?: string) =>
  excludedOS.length === 0 || excludedOS.includes(process.platform);

/**
 * Helper callback that skips a test if the CPU arch is included in excludedCPU.
 * Intended to be passed to `skipTestIf`.
 */
export const skipCPU = (excludedCPU: string[]) => (_version?: string) =>
  excludedCPU.length === 0 || excludedCPU.includes(process.arch);

/**
 * Helper callback that skips a test if the OS and CPU arch is included in excludedCPU and excludedOS.
 * Intended to be passed to `skipTestIf`.
 */
interface CpuOsPair {
  os: string;
  cpu: string;
}

export const skipCPUOS = (pairs: CpuOsPair[]) => (_version?: string) =>
  pairs
    .map((pair: CpuOsPair) => pair.os == process.platform && pair.cpu == process.arch)
    .reduce((acc: boolean, val: boolean) => acc || val);

/**
 * GitHub MacOS runners can run much slower, so allow for a larger timeout.
 */
export const osTimeoutMultiplier =
  process.platform === "darwin"
    ? 3
    : process.platform === "win32"
    ? 3
    : process.platform === "linux" && process.arch === "arm64"
    ? 3
    : 1;

/**
 * This wrapper on existing matchers is used to improve debuggability when an unexpected failure occurs.
 * Every `TaskFailure` present in the `LandingState` is examined as follows:
 *  - If no snapshot exists yet, or a new one is to be dumped, replace `details` with a matcher against any string
 *  - Otherwise, check the existing snapshot. For each failure present in the actual result, check if a matching name and message
 *    appear in the expected snapshot.
 *      - If so, replace `details` with a matcher, so that failure will succeed.
 *      - Otherwise, leave the `details` as is, so that the failure information shows up in the results.
 *
 * Without this, the entire details will be present in the snapshot, or no detail information will show up in CI.
 *
 * This does have the side effect that if overwriting an existing snapshot with a new one that has failures,
 * PLUGINS_TEST_UPDATE_SNAPSHOTS must be true (and PLUGINS_TEST_LINTER_VERSION must be set) to avoid buggy results.
 *
 * Passing both the actual and expected to this wrapper is not ideal, but it's worth the tradeoff of CI debuggability.
 */
export const landingStateWrapper = (actual: LandingState | undefined, snapshotPath: string) => {
  if (!fs.existsSync(snapshotPath) || ARGS.dumpNewSnapshot) {
    // A new snapshot is being dumped
    return {
      taskFailures: (actual?.taskFailures ?? []).map((failure) => ({
        name: failure.name,
        message: failure.message,
        // trunk-ignore(eslint/@typescript-eslint/no-unsafe-assignment)
        details: expect.stringMatching(/.*$/m),
      })),
    };
  }

  // Failures are sorted deterministically, so go in order to preserve de-duplication.
  const snapshot = fs.readFileSync(snapshotPath);
  let counterOffset = 0;
  const snapshotContainsFailure = (failure: TaskFailure) => {
    const nameIndex = snapshot.indexOf(`"name": "${failure.name}`, counterOffset);
    const failureIndex = snapshot.indexOf(`"message": "${failure.message}`, counterOffset);

    // It is possible that nameIndex and failureIndex could correspond to separate failures, but this case would necessarily
    // result in an eventual assertion error, allowing the test runner to audit the failures.
    if (nameIndex != -1 && failureIndex != -1) {
      // `name` will always show up second in the snapshots.
      counterOffset = nameIndex + 1;
      return true;
    }

    return false;
  };

  return {
    taskFailures: (actual?.taskFailures ?? []).map((failure) => ({
      name: failure.name,
      message: failure.message,
      // trunk-ignore(eslint/@typescript-eslint/no-unsafe-assignment)
      details: snapshotContainsFailure(failure) ? expect.stringMatching(/.*$/m) : failure.details,
    })),
  };
};

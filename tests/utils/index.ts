import Debug from "debug";
import fs from "fs";
import path from "path";
import semver from "semver";
import { CheckType, LinterVersion, TestingArguments } from "tests/types";

export const REPO_ROOT = path.resolve(__dirname, "../..");
export const TEST_DATA = "test_data";

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

/**
 * Parses the global testing config inputs, specified as environment variables.
 * - PLUGINS_TEST_CLI_VERSION replaces the repo-wide trunk.yaml's specified cli-version.
 * - PLUGINS_TEST_CLI_PATH specifies an alternative path to a trunk binary.
 * - PLUGINS_TEST_LINTER_VERSION specifies a linter version semantic (see `parseLinterVersion`).
 * - PLUGINS_TEST_UPDATE_SNAPSHOTS uses the snapshot from the enabled version of the linter, creating a new snapshot if necessary.
 */
export const ARGS: TestingArguments = {
  cliVersion: process.env.PLUGINS_TEST_CLI_VERSION,
  cliPath: process.env.PLUGINS_TEST_CLI_PATH,
  linterVersion: parseLinterVersion(process.env.PLUGINS_TEST_LINTER_VERSION ?? ""),
  dumpNewSnapshot: Boolean(process.env.PLUGINS_TEST_UPDATE_SNAPSHOTS),
};
// TODO(Tyler): PLUGINS_TEST_LINTER_VERSION is a string version, we should mandate that a test filter is applied
// to avoid accidental enables.
if (ARGS.cliVersion || ARGS.cliPath || ARGS.linterVersion || ARGS.dumpNewSnapshot) {
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
  linterVersion?: string
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
 * @param prefix the prefix of the named file tested against
 * @param checkType "check" or "fmt"
 * @param custom whether or not this is invoked from a customLinterCheckTest/customFmtCheckTest
 */
export const getSnapshotRegex = (
  linterName: string,
  prefix: string,
  checkType: CheckType,
  custom: boolean
) => {
  if (checkType == "fmt" && custom) {
    // For custom fmt tests, there is no central prefixed snapshot, only specific files.
    return `${linterName.replace(/-/g, "_")}_(v(?<version>[^_]+)_)?(?<file>.+).${checkType}.shot`;
  }
  return `${linterName.replace(/-/g, "_")}_(v(?<version>[^_]+)_)?${prefix}.${checkType}.shot`;
};

/**
 * Identifies snapshot file to use, based on linter, version, and ARGS.dumpNewSnapshot.
 *
 * @param snapshotDirPath absolute path to snapshot directory
 * @param linterName name of the linter being tested
 * @param prefix prefix of the file being checked
 * @param checkType "check" or "fmt"
 * @param linterVersion version of the linter that was enabled (may be undefined)
 * @param custom denotes whether this is a custom test, for use with custom fmt test naming
 * @param versionGreaterThanOrEqual optional comparator for sorting non-semver linter snapshots
 * @returns absolute path to the relevant snapshot file
 */
export const getSnapshotPathForAssert = (
  snapshotDirPath: string,
  linterName: string,
  prefix: string,
  checkType: CheckType,
  linterVersion?: string,
  custom = false,
  versionGreaterThanOrEqual?: (_a: string, _b: string) => boolean
): string => {
  const specificVersionSnapshotName = path.resolve(
    snapshotDirPath,
    getSnapshotName(linterName, prefix, checkType, linterVersion)
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
  const snapshotFileRegex = getSnapshotRegex(linterName, prefix, checkType, custom);
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
  custom = false
) => {
  // TODO(Tyler): Add ARGS.linterVersion Query case for full matrix coverage
  let matchExists = false;

  const versionsList = fs
    .readdirSync(path.resolve(dirname, TEST_DATA))
    .map((file) => {
      const fileMatch = file.match(getSnapshotRegex(linterName, prefix, checkType, custom));
      if (fileMatch) {
        matchExists = true;
        return fileMatch.groups?.version;
      }
    })
    .filter(Boolean)
    .sort();

  // Check if no snapshots exist yet. If this is the case, run with KnownGoodVersion and Latest, and print advisory text.
  if (!matchExists && !ARGS.linterVersion) {
    console.log(
      `No snapshots detected for ${linterName} ${prefix} ${checkType} test. Running test against KnownGoodVersion. See tests/readme.md for more information.`
    );
    return ["KnownGoodVersion"];
  }

  // Versionless linters must return a non-empty array, so check the list's length here.
  if (ARGS.linterVersion === "Snapshots" && versionsList.length > 0) {
    return versionsList;
  }

  // Enabled version logic will be handled later in the pipeline if ARGS.linterVersion is KnownGoodVersion|Latest|string
  if (ARGS.linterVersion) {
    return [ARGS.linterVersion];
  }
  return [undefined];
};

/**
 * Helper callback that skips a test if the OS is included in excludedOS.
 * Intended to be passed to `skipTestIf`.
 */
export const skipOS = (excludedOS: string[]) => (_version?: string) =>
  excludedOS.length === 0 || excludedOS.includes(process.platform);

export const osTimeoutMultiplier = process.platform === "darwin" ? 3 : 1;

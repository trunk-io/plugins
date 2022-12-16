import fs from "fs";
import path from "path";
import semver from "semver";
import { LinterVersion, TestingArguments } from "tests/types";

export const REPO_ROOT = path.resolve(__dirname, "../..");

/**
 * Parse the environment variable-specified linter version. This can either be:
 * 1. KnownGoodVersion, which parses the linter definition and attempts to specify a known_good_version
 * 2. Latest, which automatically retrieves the latest linter version if network connectivity is available.
 * 3. A specified version. Note that this will apply to all tests, so only use this environment variable when tests are filtered.
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
 */
export const ARGS: TestingArguments = {
  cliVersion: process.env.PLUGINS_TEST_CLI_VERSION,
  cliPath: process.env.PLUGINS_TEST_CLI_PATH,
  linterVersion: parseLinterVersion(process.env.PLUGINS_TEST_LINTER_VERSION ?? ""),
  dumpNewSnapshot: process.env.PLUGINS_TEST_NEW_SNAPSHOT?.toLowerCase() === "true",
};
if (ARGS.cliVersion || ARGS.cliPath || ARGS.linterVersion || ARGS.dumpNewSnapshot) {
  console.debug(ARGS);
}

/**
 * Identifies snapshot file to use, based on linter, version, and ARGS.dumpNewSnapshot.
 *
 * @param snapshotDirPath absolute path to snapshot directory
 * @param linterName name of the linter being tested
 * @param prefix prefix of the file being checked
 * @param linterVersion version of the linter that was enabled (may be undefined)
 * @returns absolute path to the relevant snapshot file
 */
export const getSnapshotPath = (
  snapshotDirPath: string,
  linterName: string,
  prefix: string,
  linterVersion?: string
): string => {
  // If this is a versionless linter, don't specify a version.
  if (!linterVersion) {
    return path.resolve(snapshotDirPath, `${linterName}_${prefix}.shot`);
  }

  // If this is a versioned linter && dumpNewSnapshot, return its generated name.
  const specificVersionSnapshotName = path.resolve(
    snapshotDirPath,
    `${linterName}_v${linterVersion}_${prefix}.shot`
  );
  if (ARGS.dumpNewSnapshot) {
    return specificVersionSnapshotName;
  }

  // Otherwise, find the most recent matching snapshot.
  const snapshotFileRegex = `${linterName}_v(?<version>(\\d.?)+)_${prefix}.shot$`;
  const availableSnapshots = fs
    .readdirSync(snapshotDirPath)
    .filter((name) => name.match(snapshotFileRegex))
    .sort()
    .reverse();

  // No snapshots exist.
  if (availableSnapshots.length === 0) {
    return specificVersionSnapshotName;
  }

  // Newest are checked first. Find the closest version such that version <= linterVersion
  for (const snapshotName of availableSnapshots) {
    const match = snapshotName.match(snapshotFileRegex);
    if (match && match.groups) {
      const snapshotVersion = match.groups.version;
      if (semver.gte(linterVersion, snapshotVersion)) {
        return path.resolve(snapshotDirPath, snapshotName);
      }
    }
  }

  return specificVersionSnapshotName;
};

/**** Check runs ****/

/**
 * Which primary trunk command was run.
 */
export type TrunkVerb = "Check" | "Format";

/**
 * Which snapshot type to generate based on trunk command.
 */
export type CheckType = "check" | "fmt";

/**** Testing setup ****/

/**
 * Version of a linter to enable and test against.
 * 1. KnownGoodVersion: attempt to parse the linter definition for a known_good_version. Fallback to latest.
 * 2. Latest: use network connection to query for the latest linter version (default).
 * 3. Snapshots: use all previously written snapshot versions.
 * 4. string: a manually specified version. Note that this will apply to all tests.
 */
// trunk-ignore(eslint/@typescript-eslint/no-redundant-type-constituents): Added for clarity.
export type LinterVersion = "KnownGoodVersion" | "Latest" | "Snapshots" | string;

/**
 * Global testing configuration based on environment variables.
 */
export interface TestingArguments {
  /** Trunk cli version to run in tests. */
  cliVersion?: string;
  /** Path to a cli binary. */
  cliPath?: string;
  /** Version of linters to enable and test against. */
  linterVersion?: LinterVersion;
  /** Whether tests should create new snapshot files if snapshots already exist
   * even if a match is found. */
  dumpNewSnapshot: boolean;
  /** Prevents the deletion of sandbox test dirs. */
  sandboxDebug: boolean;
}

export interface Replacement {
  filePath?: string;
  length?: number;
  offset?: number;
  replacementText?: string;
}

export interface Autofix {
  // message?: string;
  replacements?: Replacement[];
}

/**** Landing state ****/

// LandingState and its subfields must be strongly typed in order for tests
// to be most effective in asserting relevant, idempotent information.
// Unimportant assertion fields omitted here.

/**
 * A diagnostic issue or unformatted file.
 */
export interface FileIssue {
  file: string;
  line: number;
  column: number;
  message?: string;
  // detailPath: string;
  code: string;
  level: string;
  // bucket: string;
  issueClass: string;
  // below_threshold: boolean;
  linter: string;
  targetType: string;
  targetPath?: string;
  autofixOptions?: Autofix[];
  ranges?: any[];
  issueUrl: string;
}

/**
 * A linting action undertaken by trunk. Records linter and path information.
 */
export interface LintAction {
  paths: string[];
  linter: string;
  parser: string;
  report: string;
  cacheHit?: boolean;
  cacheExpiration?: string;
  upstream: boolean;
  fileGroupName: string;
  command: string;
  verb: string;
  actionDurationMs?: number;
}

/**
 * A failure occurred during the setup of a linter (e.g. install error) or from an unsuccessful exit code
 * (e.g. linter internal parsing error)
 */
export interface TaskFailure {
  name: string;
  message: string;
  detailPath?: string;
  details?: string;
}

/**
 * The data result of a `trunk check` or `trunk fmt` run.
 */
export interface LandingState {
  issues?: FileIssue[];
  unformattedFiles?: FileIssue[];
  // bucketViolations?: any[];
  // compareToUpstream?: boolean;
  lintActions?: LintAction[];
  // discards?: any[];
  // changeStats?: any[];
  // show_new_user_hint?: boolean;
  // ignores?: any[];
  // check_skipped?: boolean;
  taskFailures?: TaskFailure[];
  // notices?: any[];
  // bad_config?: boolean;
}

/**** Result post-processing ****/

/**
 * The reason why a test might fail (predictive).
 * - unknown: unknown, usually a test timeout, discrepancy, or other setup error -> requires investigation
 * - task_failure: a task failure occurred, whether during execution or linter install -> requires investigation
 * - passed: only during post-processing, if at least some of the tests passed -> can still generate a snapshot
 * - assertion_failure: the expected diagnostics vary -> we can usually generate a snapshot proactively
 * - skipped: the test was skipped -> defer to other tests
 */
export type FailureMode = "unknown" | "passed" | "task_failure" | "assertion_failure" | "skipped";

/**
 * Which OS the test was run on. Must be kept in sync with the matrix in nightly.yaml.
 */
export enum TestOS {
  LINUX = "ubuntu",
  MAC_OS = "macos",
  WINDOWS = "windows",
}

/**
 * The result of a linter's tests.
 * - passed: all linter tests were successful.
 * - failed: any of a linter's tests failed.
 * - skipped: all tests so far were skipped (overriden by a pass or failure).
 * - mismatch: "Latest" tests ran on different linter versions. Ultimately treated as a failure.
 */
export type TestResultStatus = "passed" | "failed" | "skipped" | "mismatch";

/**
 * A result from an individual test or multiple merged tests on a singular linter.
 * Includes the version of the linter if present, the full names of the tests that ran, and the status of the tests.
 */
export interface TestResult {
  version?: string;
  // A map of test fullName to suspected failure mode. Is the composite result across multiple OSs.
  testFailureMetadata: Map<string, FailureMode>;
  testResultStatus: TestResultStatus;
  allVersions: Map<TestOS, Set<string>>;
  failedPlatforms: Set<TestOS>;
  testFilePath: string;
}

/**
 * A summary of all tests run with an individual OS (or the merged result of all OSs).
 * Includes a map of linter/tool name to linter/tool test results.
 */
export interface TestResultSummary {
  os: TestOS | "composite";
  testResults: Map<string, TestResult>;
}

/**
 * The final format of a validated linter and its version used for uploading.
 */
export interface ValidatedVersion {
  linter: string;
  version: string;
}

/**
 * The final format of a failed linter and its version used for Slack notifications.
 */
export interface FailedVersion {
  linter: string;
  version?: string;
  status: TestResultStatus;
  allVersions: Map<TestOS, Set<string>>;
  failedPlatforms: Set<TestOS>;
  rerunningTest: boolean;
}

/**
 * Which primary trunk command was run.
 */
export type TrunkVerb = "Check" | "Format";

/**
 * Version of a linter to enable and test against.
 * 1. KnownGoodVersion: attempt to parse the linter definition for a known_good_version. Fallback to latest.
 * 2. Latest: use network connection to query for the latest linter verison (default)
 * 3. string: a manually specified version. Note that this will apply to all tests.
 */
export type LinterVersion = "KnownGoodVersion" | "Latest" | string;

/**
 * Global testing configuration based on environment variables.
 */
export interface TestingArguments {
  /** Trunk cli version to run in tests. */
  cliVersion?: string;
  /** Path to a cli binary. */
  cliPath?: string;
  /** Version of linters to enable and test against. */
  linterVersion?: LinterVersion | string;
  /** Whether tests should create new snapshot files if snapshots already exist
   * even if a match is found. */
  dumpNewSnapshot?: boolean;
}

// LandingState and its subfields must be strongly typed in order for tests
// to be most effective in asserting relevant, idempotent information.
// Unimportant assertion fields omitted here.
export interface FileIssue {
  file: string; // requires path transformation
  line: number;
  column: number;
  message?: string;
  // detailPath: string;
  code: string;
  level: string;
  // bucket: string;
  // issueClass: string;
  // below_threshold: boolean;
  linter: string;
  targetType: string;
  // autofixOptions: any[];
  // ranges: any[];
  issueUrl: string;
}

export interface LintAction {
  paths: string[]; // require path transformations
  linter: string;
  parser: string;
  report: string;
  // cacheHit: boolean;
  upstream: boolean;
  fileGroupName: string;
  command: string;
  verb: string;
  actionDurationMs?: number;
}

export interface TaskFailure {
  name: string;
  message: string; // may require path transformation
  detailPath?: string;
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

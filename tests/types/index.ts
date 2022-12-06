export enum ILinterVersion {
  KnownGoodVersion = 1,
  Latest,
}

export interface ITestingArguments {
  // Trunk cli version to run in tests
  cliVersion?: string;
  // Path to a cli binary
  cliPath?: string;
  // Whether to use a linter's latest or KnownGoodVersion (network connectivity may vary)
  linterVersion?: ILinterVersion;
}

// LandingState and its subfields must be strongly typed in order for tests
// to be most effective in asserting relevant, idempotent information.
// Unimportant assertion fields omitted here.
export interface IFileIssue {
  file: string; // requires path transformation
  line: number;
  column: number;
  message: string;
  // detailPath: string;
  code: string;
  level: string;
  // bucket: string;
  // issueClass: string;
  // below_threshold: boolean;
  linter: string;
  targetType: string;
  // autofixOptions: any[];
  ranges: any[];
  issueUrl: string;
}

export interface ILintAction {
  paths: string[]; // require path transformations
  linter: string;
  parser: string;
  report: string;
  // cacheHit: boolean;
  upstream: boolean;
  fileGroupName: string;
  command: string;
  verb: string;
}

export interface ITaskFailure {
  name: string;
  message: string; // may require path transformation
  // detailPath: string;
}

export interface ILandingState {
  issues?: IFileIssue[];
  unformattedFiles?: IFileIssue[];
  // bucketViolations?: any[];
  // compareToUpstream?: boolean;
  lintActions?: ILintAction[];
  // discards?: any[];
  // changeStats?: any[];
  // show_new_user_hint?: boolean;
  // ignores?: any[];
  // check_skipped?: boolean;
  taskFailures?: ITaskFailure[];
  // notices?: any[];
  // bad_config?: boolean;
}

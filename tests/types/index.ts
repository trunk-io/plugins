import { Expose } from "class-transformer";

export enum ILinterVersion {
  KnownGoodVersion = 1,
  Latest,
}

export interface ITestingArguments {
  cliVersion?: string;
  cliPath?: string;
  linterVersion?: ILinterVersion;
  linters?: string[];
  verbose?: boolean;
  help?: boolean;
}

// LandingState and its subfields must be strongly typed in order for tests to be most effective in asserting relevant, idempotent information.
// Unimportant assertion fields omitted here.
export class FileIssue {
  @Expose() file?: string; // requires path transformation
  @Expose() line?: number;
  @Expose() column?: number;
  @Expose() message?: string;
  // detailPath: string;
  @Expose() code?: string;
  @Expose() level?: string;
  // bucket: string;
  // issueClass: string;
  // below_threshold: boolean;
  @Expose() linter?: string;
  @Expose() targetType?: string;
  // autofixOptions: any[];
  @Expose() ranges?: any[];
  @Expose() issueUrl?: string;
}

export interface ILintAction {
  paths: string[]; // require path transformations
  linter: string;
  parser: string;
  report: string;
  // cacheHit: boolean;
  // upstream: boolean;
  fileGroupName: string;
  command: string;
  verb: string;
}

export interface ITaskFailure {
  name: string;
  message: string; // may require path transformation
  // detailPath: string;
}

export class LandingState {
  @Expose() issues?: FileIssue[];
  @Expose() unformatted_files?: FileIssue[];
  // bucketViolations?: any[];
  // compareToUpstream?: boolean;
  @Expose() lintActions?: ILintAction[];
  // discards?: any[];
  // changeStats?: any[];
  // show_new_user_hint?: boolean;
  // ignores?: any[];
  // check_skipped?: boolean;
  @Expose() taskFailures?: ITaskFailure[];
  // notices?: any[];
  // bad_config?: boolean;
}

export interface ILandingState extends LandingState {}
export interface IFileIssue extends FileIssue {}

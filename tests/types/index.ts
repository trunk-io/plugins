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

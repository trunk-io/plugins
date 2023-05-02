/**
 * Configuration for when a TrunkLintDriver instance runs `setUp`.
 */
export interface SetupSettings {
  /** Whether or not to run `git init` and attach a gitDriver. */
  setupGit?: boolean;
  /** Whether or not to create a new .trunk/trunk.yaml */
  setupTrunk?: boolean;
  /** Version of trunk to initialize (overrides environment vars) */
  trunkVersion?: string;
}

export * from "./lint_driver";
export * from "./tool_driver";

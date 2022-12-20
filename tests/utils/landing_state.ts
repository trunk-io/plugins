import { sort } from "fast-sort";
import path from "path";
import { LandingState, LintAction, TaskFailure } from "tests/types";
import { REPO_ROOT } from "tests/utils";

// TODO(Tyler): These extract functions are used to filter down to deterministic fields. In the future
// we should preserve the original structure and use jest matchers on the non-deterministic fields.
const extractLintActionFields = ({
  actionDurationMs: _actionDurationMs,
  ...rest
}: LintAction): LintAction => ({
  ...rest,
});

const extractTaskFailureFields = ({
  detailPath: _detailPath,
  ...rest
}: TaskFailure): TaskFailure => ({
  ...rest,
});

/**
 * Remove unwanted fields. Prefer object destructuring to be explicit about required fields
 * for forward compatibility.
 */
const extractLandingStateFields = ({
  issues = [],
  unformattedFiles = [],
  lintActions = [],
  taskFailures = [],
}: LandingState) =>
  <LandingState>{
    issues: sort(issues).asc((issue) => [
      issue.file,
      issue.line,
      issue.column,
      issue.code,
      issue.message,
    ]),
    unformattedFiles: sort(unformattedFiles).asc((issue) => [
      issue.file,
      issue.line,
      issue.column,
      issue.code,
      issue.message,
    ]),
    lintActions: sort(lintActions.map(extractLintActionFields)).asc((action) => [
      action.linter,
      action.command,
      action.verb,
      action.upstream,
      action.paths,
    ]),
    taskFailures: sort(taskFailures.map(extractTaskFailureFields)).asc((failure) => [
      failure.name,
      failure.message,
    ]),
  };

/**
 * Extract the LandingState from an input `json`, returning a deterministic landing state
 * (e.g. timing-dependent fields are removed, repeated fields are sorted deterministically).
 * @param json The nonempty `outputJson` from a `TrunkRunResult`
 */
export const extractLandingState = (json: unknown): LandingState =>
  extractLandingStateFields(json as LandingState);

/**
 * Attempt to parse the JSON result of a `trunk check` or `trunk fmt` run into
 * A landing state, transforming all relative paths to match them as they would appear
 * from the repo root. Sandboxed testing currently creates a repo root centered around the linter
 * subdirectory. In order to match diagnostics as run from the original repo root, the paths must be
 * modified.
 *
 * TODO(Tyler): Investigate creating a shadow tree rather than sandboxing on a subdirectory.
 */
export const tryParseLandingState = (
  repoTestDir: string,
  outputJson: unknown
): LandingState | undefined => {
  if (!outputJson) {
    return undefined;
  }

  const landingState = extractLandingState(outputJson);

  const absLinterDir = path.parse(repoTestDir).dir;
  const relativeLinterDir = path.relative(REPO_ROOT, absLinterDir);

  const transformPath = (testFileRelativePath: string): string => {
    // validate path is parsable
    const parsed = path.parse(testFileRelativePath);
    if (parsed.dir.length > 0) {
      return path.join(relativeLinterDir, testFileRelativePath);
    }
    return testFileRelativePath;
  };

  const normalizedLandingState = {
    ...landingState,
    issues: (landingState.issues ?? []).map(({ file, ...issue }) => ({
      ...issue,
      file: transformPath(file),
    })),
    unformattedFiles: (landingState.unformattedFiles ?? []).map(({ file, ...unformattedFile }) => ({
      ...unformattedFile,
      file: transformPath(file),
    })),
    lintActions: (landingState.lintActions ?? []).map(({ paths, ...lintAction }) => ({
      ...lintAction,
      paths: paths.map(transformPath),
    })),
    taskFailures: (landingState.taskFailures ?? []).map(({ message, ...taskFailure }) => ({
      ...taskFailure,
      message: transformPath(message),
    })),
  };

  return normalizedLandingState;
};

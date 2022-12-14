import { sort } from "fast-sort";
import path from "path";
import { FileIssue, LandingState, LintAction, TaskFailure } from "tests/types";
import { REPO_ROOT } from "tests/utils";

const extractFileIssueFields = (
  { file, line, column, message, code, level, linter, targetType, issueUrl, ..._rest }: FileIssue,
  skip_message: boolean
): FileIssue =>
  skip_message
    ? {
        file,
        line,
        column,
        // omitted message for assertions
        code,
        level,
        linter,
        targetType,
        issueUrl,
      }
    : {
        file,
        line,
        column,
        message,
        code,
        level,
        linter,
        targetType,
        issueUrl,
      };

// Also de-dupe, since sometimes we will have discrepancies in the count for multiple commands
const extractLintActionFields = ({
  paths,
  linter,
  parser,
  report,
  upstream,
  fileGroupName,
  command,
  verb,
  ..._rest
}: LintAction): LintAction => ({
  paths,
  linter,
  parser,
  report,
  upstream,
  fileGroupName,
  command,
  verb,
});

const extractTaskFailureFields = ({ name, message, ..._rest }: TaskFailure): TaskFailure => ({
  name,
  message,
});

/**
 * Remove unwanted fields. Prefer object destructuring to be explicit about required fields
 * for forward compatibility.
 */
const extractLandingStateFields = (
  { issues = [], unformattedFiles = [], lintActions = [], taskFailures = [] }: LandingState,
  skip_message: boolean
) =>
  <LandingState>{
    issues: sort(issues.map((i) => extractFileIssueFields(i, skip_message))).asc([
      (issue) => issue.file,
      (issue) => issue.line,
      (issue) => issue.column,
      (issue) => issue.code,
      (issue) => issue.message,
    ]),
    unformattedFiles: sort(
      unformattedFiles.map((i) => extractFileIssueFields(i, skip_message))
    ).asc([
      (issue) => issue.file,
      (issue) => issue.line,
      (issue) => issue.column,
      (issue) => issue.code,
      (issue) => issue.message,
    ]),
    lintActions: sort(lintActions.map(extractLintActionFields)).asc([
      (action) => action.linter,
      (action) => action.command,
      (action) => action.verb,
      (action) => action.upstream,
      (action) => action.paths,
    ]),
    taskFailures: sort(taskFailures.map(extractTaskFailureFields)).asc([
      (failure) => failure.name,
      (failure) => failure.message,
    ]),
  };

/**
 * Extract the LandingState from an input `json`, only retrieving assertable fields. Discard
 * fields that depend on git and cache states. Also sorts repeatable fields deterministically.
 * @param json The nonempty `outputJson` from a `TrunkRunResult`
 */
export const extractLandingState = (json: unknown, skip_message = false): LandingState =>
  extractLandingStateFields(json as LandingState, skip_message);

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

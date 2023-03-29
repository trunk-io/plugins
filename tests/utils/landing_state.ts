import { sort } from "fast-sort";
import * as fs from "fs";
import * as os from "os";
import path from "path";
import { FileIssue, LandingState, LintAction, TaskFailure } from "tests/types";

// TODO(Tyler): These extract functions are used to filter down to deterministic fields. In the future
// we should preserve the original structure and use jest matchers on the non-deterministic fields.
const extractLintActionFields = ({
  actionDurationMs: _actionDurationMs,
  cacheHit: _cacheHit,
  ...rest
}: LintAction): LintAction => ({
  ...rest,
});

const extractTaskFailureFields = (
  sandboxPath: string,
  { detailPath, ...rest }: TaskFailure
): TaskFailure => ({
  ...rest,
  details: detailPath
    ? fs.readFileSync(path.resolve(sandboxPath, detailPath), { encoding: "utf-8" })
    : undefined,
});

// Replace any occurrences of the nondeterministic sandbox path in the output message
const normalizeMessage = (message?: string) =>
  message
    ?.replace(fs.realpathSync(os.tmpdir()), "/tmp")
    .replace(/\/plugins_.{6}/gm, "/plugins_")
    .trim();

const normalizeIssues = ({ message: _message, ...rest }: FileIssue): FileIssue => ({
  ...rest,
  message: normalizeMessage(_message),
});

/**
 * Remove unwanted fields. Prefer object destructuring to be explicit about required fields
 * for forward compatibility.
 */
const extractLandingStateFields = (
  sandboxPath: string,
  { issues = [], unformattedFiles = [], lintActions = [], taskFailures = [] }: LandingState
) =>
  <LandingState>{
    issues: sort(issues.map(normalizeIssues)).asc((issue) => [
      issue.file,
      issue.line,
      issue.column,
      issue.code,
      issue.message,
    ]),
    unformattedFiles: sort(unformattedFiles.map(normalizeIssues)).asc((issue) => [
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
    taskFailures: sort(
      taskFailures.map((failure) => extractTaskFailureFields(sandboxPath, failure))
    ).asc((failure) => [failure.name, failure.message]),
  };

/**
 * Extract the LandingState from an input `json`, returning a deterministic landing state
 * (e.g. timing-dependent fields are removed, repeated fields are sorted deterministically).
 * @param sandboxPath The path to the workspace from which trunk was run
 * @param json The nonempty `outputJson` from a `TrunkRunResult`
 */
export const extractLandingState = (sandboxPath: string, json: unknown): LandingState =>
  extractLandingStateFields(sandboxPath, json as LandingState);

/**
 * Attempt to parse the JSON result of a `trunk check` or `trunk fmt` run into
 * A landing state, removing any non-deterministic fields.
 */
export const tryParseLandingState = (
  sandboxPath: string,
  outputJson: unknown
): LandingState | undefined => {
  if (!outputJson) {
    return undefined;
  }

  return extractLandingState(sandboxPath, outputJson);
};

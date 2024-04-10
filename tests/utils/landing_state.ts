import { sort } from "fast-sort";
import * as fs from "fs";
import * as os from "os";
import path from "path";
import {
  Autofix,
  FileIssue,
  LandingState,
  LintAction,
  Replacement,
  TaskFailure,
} from "tests/types";

const normalizePlatformPath = (originalPath: string | undefined) => {
  if (!originalPath) {
    return undefined;
  }
  if (process.platform == "win32") {
    return originalPath.replaceAll("\\", "/");
  }
  return originalPath;
};

// TODO(Tyler): These extract functions are used to filter down to deterministic fields. In the future
// we should preserve the original structure and use jest matchers on the non-deterministic fields.
const extractLintActionFields = ({
  actionDurationMs: _actionDurationMs,
  cacheHit: _cacheHit,
  cacheExpiration: _cacheExpiration,
  paths: _paths,
  ...rest
}: LintAction): LintAction => ({
  paths: _paths.map((originalPath) => normalizePlatformPath(originalPath)!),
  ...rest,
});

const extractTaskFailureFields = (
  sandboxPath: string,
  { detailPath, message, ...rest }: TaskFailure,
): TaskFailure => ({
  ...rest,
  message: normalizePlatformPath(message)!,
  details: detailPath
    ? fs.readFileSync(path.resolve(sandboxPath, detailPath), { encoding: "utf-8" })
    : undefined,
});

const normalizeReplacement = ({
  replacementText: _replacementText,
  filePath: _filePath,
  ...rest
}: Replacement): Replacement => {
  const ret: Replacement = {
    ...rest,
    filePath: normalizePlatformPath(_filePath),
  };
  // TODO(lauri): Add this unconditionally once ruff is fixed.
  if (_replacementText) {
    ret.replacementText = Buffer.from(_replacementText, "base64").toString();
  }
  return ret;
};

const normalizeAutofix = ({ replacements: _replacements = [], ...rest }: Autofix): Autofix => ({
  ...rest,
  replacements: _replacements.map(normalizeReplacement),
});

// Replace any occurrences of the nondeterministic sandbox path in the output message
const normalizeMessage = (message?: string) =>
  message
    ?.replace(fs.realpathSync(os.tmpdir()), "/tmp")
    .replace(`${process.env.LOCALAPPDATA ?? ""}\\Temp`, "/tmp")
    .replaceAll("\\", "/")
    .replace(/\/plugins_.{6}/gm, "/plugins_")
    .replace(".dup.", ".")
    .trim();

const normalizeFile = (file: string) => normalizePlatformPath(file.replace(".dup.", "."))!;

const normalizeRange = ({ filePath: _filePath = undefined, ...rest }) => ({
  filePath: normalizePlatformPath(_filePath),
  ...rest,
});

const normalizeIssues = ({
  message: _message,
  targetPath: _targetPath,
  file: _file,
  autofixOptions: _autofixOptions = [],
  ranges: _ranges,
  ...rest
}: FileIssue): FileIssue => {
  const ret: FileIssue = {
    ...rest,
    message: normalizeMessage(_message),
    file: normalizeFile(_file),
  };
  if (_ranges) {
    // trunk-ignore(eslint/@typescript-eslint/no-unsafe-argument)
    ret["ranges"] = _ranges.map((range) => normalizeRange(range));
  }
  if (_autofixOptions.length > 0) {
    ret.autofixOptions = _autofixOptions.map(normalizeAutofix);
  }
  return ret;
};

/**
 * Remove unwanted fields. Prefer object destructuring to be explicit about required fields
 * for forward compatibility.
 */
const extractLandingStateFields = (
  sandboxPath: string,
  { issues = [], unformattedFiles = [], lintActions = [], taskFailures = [] }: LandingState,
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
      taskFailures.map((failure) => extractTaskFailureFields(sandboxPath, failure)),
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
  outputJson: unknown,
): LandingState | undefined => {
  if (!outputJson) {
    return undefined;
  }

  return extractLandingState(sandboxPath, outputJson);
};

/**
 * Create an assertion callback to pass into the fuzzyLinterCheckTest, given an expectedFileIssueProvider and a minimum overlap.
 */
export const createFuzzyMatcher =
  (expectedFileIssueProvider: (version?: string) => FileIssue[], minimumOverlap: number) =>
  (actualIssues: FileIssue[], version?: string): void => {
    const expectedFileIssues = expectedFileIssueProvider(version);
    expect(actualIssues).toHaveIssueOverlap(expectedFileIssues, minimumOverlap);
  };

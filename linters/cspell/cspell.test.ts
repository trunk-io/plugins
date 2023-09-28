import * as fs from "fs";
import path from "path";
import { fuzzyLinterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { FileIssue, LandingState } from "tests/types";
import { skipOS } from "tests/utils";
import { createFuzzyMatcher } from "tests/utils/landing_state";

const preCheck = (driver: TrunkLintDriver) => {
  // Create config
  driver.writeFile(
    "cspell.yaml",
    `version: "0.2"
suggestionsTimeout: 5000
dictionaryDefinitions:
  - name: plugin-words
    path: cspell-words.txt
    addWords: true
dictionaries:
  - plugin-words`,
  );

  // Create dictionary
  driver.writeFile(
    "cspell-words.txt",
    `cachedir
codespell
commitlint
eamodio
elif
kwargs
proto
protobuf
pyyaml
runtimes
sarif
SCRIPTDIR
trunkio
vuln`,
  );
};

// cspell will regularly update their dictionary, which often has the effect of reordering
const normalizeLandingState = (landingState: LandingState) => {
  if (landingState.issues) {
    for (const issue of landingState.issues) {
      if (issue.message) {
        const suggestionsRegex = /Suggestions: \[(?<suggestions>.+)\]/;
        const suggestions = issue.message.match(suggestionsRegex);
        const suggestionsContent = suggestions?.groups?.suggestions;
        if (suggestionsContent) {
          const sortedSuggestions = suggestionsContent?.split(", ").sort().join(", ");
          issue.message = issue.message.replace(suggestionsContent, sortedSuggestions);
        }
      }
    }
  }
};

// trunk-ignore-begin(eslint)
const expectedBasicFileIssues = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "expected_basic_issues.json")).toString(),
);

const expectedDictionaryFileIssues = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "expected_dictionary_issues.json")).toString(),
);
// trunk-ignore-end(eslint)

// TODO(Tyler): Determine root cause of flakiness on Mac runners
// cspell will update their dictionaries fairly frequently. Rather than erroring every time this happens,
// we sort the order of the suggestions they provide for diagnostics, and we use a fuzzy matcher.
// Note however that the actual order of the suggestions in typical diagnostics is important and based on their recommendations.
fuzzyLinterCheckTest({
  linterName: "cspell",
  testName: "basic",
  args: "-a",
  skipTestIf: skipOS(["darwin"]),
  fileIssueAssertionCallback: createFuzzyMatcher(() => expectedBasicFileIssues as FileIssue[], 25),
  normalizeLandingState,
});

fuzzyLinterCheckTest({
  linterName: "cspell",
  testName: "dictionary",
  args: "-a",
  preCheck,
  skipTestIf: skipOS(["darwin"]),
  fileIssueAssertionCallback: createFuzzyMatcher(
    () => expectedDictionaryFileIssues as FileIssue[],
    12,
  ),
  normalizeLandingState,
});

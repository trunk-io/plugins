import { customLinterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { skipOS } from "tests/utils";

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
  - plugin-words`
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
vuln`
  );
};

// TODO(Tyler): Determine root cause of flakiness on Mac runners
customLinterCheckTest({
  linterName: "cspell",
  testName: "basic",
  args: "-a",
  skipTestIf: skipOS(["darwin"]),
});

customLinterCheckTest({
  linterName: "cspell",
  testName: "dictionary",
  args: "-a",
  preCheck,
  skipTestIf: skipOS(["darwin"]),
});

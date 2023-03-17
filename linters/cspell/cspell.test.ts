import { customLinterCheckTest } from "tests";
import { TrunkDriver } from "tests/driver";
import { skipOS } from "tests/utils";

const preCheck = (addDictionary: boolean) => (driver: TrunkDriver) => {
  const defaultTestingConfig = `$schema: https://raw.githubusercontent.com/streetsidesoftware/cspell/main/cspell.schema.json
version: "0.2"`;
  //

  const dictionaryConfig = `
dictionaryDefinitions:
  - name: plugin-words
    path: cspell-words.txt
    addWords: true
dictionaries:
  - plugin-words`;

  // Create config
  driver.writeFile(
    "cspell.config.yaml",
    addDictionary ? defaultTestingConfig.concat(dictionaryConfig) : defaultTestingConfig
  );

  if (addDictionary) {
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
  }
};

// TODO(Tyler): Determine root cause of flakiness on Mac runners
customLinterCheckTest({
  linterName: "cspell",
  testName: "basic",
  args: "-a",
  preCheck: preCheck(false),
  skipTestIf: skipOS(["darwin"]),
});

customLinterCheckTest({
  linterName: "cspell",
  testName: "dictionary",
  args: "-a",
  preCheck: preCheck(true),
  skipTestIf: skipOS(["darwin"]),
});

import { customLinterCheckTest, TestCallback } from "tests";
import { skipOS } from "tests/utils";

// TODO(Tyler): Determine root cause of flakiness on Mac runners for basic tests
customLinterCheckTest({
  linterName: "cspell",
  testName: "basic",
  args: "-a",
  skipTestIf: skipOS(["darwin"]),
});

const preCheck: TestCallback = (driver) => {
  // Create config
  driver.writeFile(
    "cspell.config.yaml",
    `$schema: https://raw.githubusercontent.com/streetsidesoftware/cspell/main/cspell.schema.json
version: "0.2"
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

customLinterCheckTest({
  linterName: "cspell",
  testName: "dictionary",
  args: "-a",
  preCheck,
  skipTestIf: skipOS(["darwin"]),
});

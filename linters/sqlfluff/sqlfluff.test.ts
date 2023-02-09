import { linterCheckTest, linterFmtTest, TestCallback } from "tests";

// basic_check.out.json is the result of running:
// trunk check linters/sqlfluff/test/basic_check.in.sql --force --filter=sqlfluff --output=json
linterCheckTest({ linterName: "sqlfluff", namedTestPrefixes: ["basic_check"] });

// Due to sqlfluff's fix subcommand being disabled by default, we need to manually enable it in the trunk.yaml.
const fmtCallbacks: TestCallback = (driver) => {
  const trunkYamlPath = ".trunk/trunk.yaml";
  const currentContents = driver.readFile(trunkYamlPath);
  const sqlfluffRegex = /- sqlfluff@(.+)\n/;
  const newContents = currentContents.replace(
    sqlfluffRegex,
    "- sqlfluff@$1:\n        commands: [lint, fix]\n"
  );
  driver.writeFile(trunkYamlPath, newContents);
};

// TODO(Tyler): We will eventually need to add a couple more test cases involving failure modes.
linterFmtTest({ linterName: "sqlfluff", namedTestPrefixes: ["basic_fmt"], preCheck: fmtCallbacks });

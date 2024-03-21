import { linterCheckTest, linterFmtTest } from "tests";
import { TrunkLintDriver } from "tests/driver";

// Due to tofu's validate subcommand being disabled by default, we need to manually enable it in our test's trunk.yaml.
const preCheck = (driver: TrunkLintDriver) => {
  const trunkYamlPath = ".trunk/trunk.yaml";
  const currentContents = driver.readFile(trunkYamlPath);
  const sqlfluffRegex = /- tofu@(.+)\n/;
  const newContents = currentContents.replace(
    sqlfluffRegex,
    "- tofu@$1:\n        commands: [validate, fmt]\n",
  );
  driver.writeFile(trunkYamlPath, newContents);
};

linterCheckTest({ linterName: "tofu", preCheck });

linterFmtTest({ linterName: "tofu" });

import { linterFmtTest, TestCallback } from "tests";

// Due to sqlfluff's fix subcommand being disabled by default, we need to manually enable it in the trunk.yaml.
const fmtCallbacks: TestCallback = (driver) => {
  const trunkYamlPath = ".trunk/trunk.yaml";
  const currentContents = driver.readFile(trunkYamlPath);
  const enableRegex = /- pre-commit-hooks@(.+)\n/;
  const newContents = currentContents.replace(
    enableRegex,
    "- pre-commit-hooks@$1:\n        commands: [end-of-file-fixer]\n",
  );
  driver.writeFile(trunkYamlPath, newContents);
};

linterFmtTest({
  linterName: "pre-commit-hooks",
  namedTestPrefixes: ["end-of-file-fixer"],
  preCheck: fmtCallbacks,
});

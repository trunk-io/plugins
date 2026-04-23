import semver from "semver";
import { linterCheckTest, linterFmtTest } from "tests";
import { TrunkLintDriver } from "tests/driver";

// stylelint requires additional install steps
const preCheck = (driver: TrunkLintDriver) => {
  const stylelintContents = `
{
  "extends": "stylelint-config-standard"
}
  `;

  driver.writeFile(".trunk/configs/.stylelintrc", stylelintContents);

  const enabledVersion = driver.enabledVersion ?? "0.0.0";
  const configVersion = semver.gte(enabledVersion, "17.0.0")
    ? "stylelint-config-standard@40.0.0"
    : semver.gte(enabledVersion, "16.0.0")
      ? "stylelint-config-standard@35.0.0"
      : "stylelint-config-standard@25.0.0";
  const trunkYamlPath = ".trunk/trunk.yaml";
  const currentContents = driver.readFile(trunkYamlPath);
  const sqlfluffRegex = /- stylelint@(.+)\n/;
  const newContents = currentContents.replace(
    sqlfluffRegex,
    `- stylelint@$1:\n        packages: [${configVersion}]\n`,
  );
  driver.writeFile(trunkYamlPath, newContents);
};

linterCheckTest({ linterName: "stylelint", preCheck });
linterFmtTest({ linterName: "stylelint", preCheck });

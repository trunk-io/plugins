import { execSync } from "child_process";
import { linterCheckTest, linterFmtTest } from "tests";
import { TrunkDriver } from "tests/driver";

// stylelint requires additional install steps
const preCheck = (driver: TrunkDriver) => {
  if (driver.gitDriver) {
    const packageJsonContents = `
{
  "private": true,
  "devDependencies": {
    "stylelint": "^14.6.1",
    "stylelint-config-standard": "^25.0.0"
  }
}
    `;
    const stylelintContents = `
{
  "extends": "stylelint-config-standard"
}
    `;

    driver.writeFile("package.json", packageJsonContents);
    driver.writeFile(".trunk/configs/.stylelintrc", stylelintContents);
    execSync("npm install", { cwd: driver.getSandbox() });
  }
};

linterCheckTest({ linterName: "stylelint", preCheck });
linterFmtTest({ linterName: "stylelint", preCheck });

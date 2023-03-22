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
    "stylelint": "^15.3.0",
    "stylelint-config-standard": "^31.0.0",
    "stylelint-config-standard-scss": "^7.0.0"
  }
}
    `;

    driver.writeFile("package.json", packageJsonContents);
    execSync("npm install", { cwd: driver.getSandbox() });
  }
};

linterCheckTest({ linterName: "stylelint", preCheck });
linterFmtTest({ linterName: "stylelint", preCheck });

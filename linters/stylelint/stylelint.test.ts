import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { linterCheckTest, linterFmtTest } from "tests";
import { TrunkDriver } from "tests/driver";

// stylelint requires additional install steps
const preCheck = (driver: TrunkDriver) => {
  if (driver.sandboxPath && driver.gitDriver) {
    // trunk-ignore-begin(semgrep): driver.sandboxPath is generated deterministically and is safe
    const packageJsonPath = path.resolve(driver.sandboxPath, "package.json");
    const configDir = path.resolve(driver.sandboxPath, ".trunk/configs");
    const configPath = path.resolve(configDir, ".stylelintrc");
    // trunk-ignore-end(semgrep)

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

    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(packageJsonPath, packageJsonContents);
    fs.writeFileSync(configPath, stylelintContents);
    execSync("npm install", { cwd: driver.sandboxPath });
  }
};

linterCheckTest({ linterName: "stylelint", preCheck });
linterFmtTest({ linterName: "stylelint", preCheck });

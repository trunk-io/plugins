import * as fs from "fs";
import path from "path";
import { defaultLinterCheckTest, defaultLinterFmtTest, TestCallbacks } from "tests";

defaultLinterCheckTest(__dirname, "sqlfluff", ["basic_check"]);

// Due to sqlfluff's fix subcommand being disabled by default, we need to manually enable it in our test's
// trunk.yaml.
const fmtCallbacks = <TestCallbacks>{
  preCheck: (driver) => {
    const trunkYamlPath = path.resolve(driver.sandboxPath ?? "", ".trunk/trunk.yaml");
    const currentContents = fs.readFileSync(trunkYamlPath, 'utf8');
    const sqlfluffRegex = /- sqlfluff@((\d.?)+)\n/;
    const newContents = currentContents.replace(sqlfluffRegex, "- sqlfluff@$1:\n        commands: [lint, fix]\n");
    fs.writeFileSync(trunkYamlPath, newContents);
  }
}

defaultLinterFmtTest(__dirname, "sqlfluff", ["basic_fmt"], fmtCallbacks);

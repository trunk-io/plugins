import * as fs from "fs";
import path from "path";
import { linterCheckTest, linterFmtTest, TestCallback } from "tests";

// basic_check.out.json is the result of running:
// trunk check linters/sqlfluff/test/basic_check.in.sql --force --filter=sqlfluff --output=json
linterCheckTest({ linterName: "sqlfluff" });

// // Due to sqlfluff's fix subcommand being disabled by default, we need to manually enable it in our test's
// // trunk.yaml.
// const fmtCallbacks: TestCallback = (driver) => {
//   // trunk-ignore(semgrep): driver.sandboxPath is generated deterministically and is safe
//   const trunkYamlPath = path.resolve(driver.sandboxPath ?? "", ".trunk/trunk.yaml");
//   const currentContents = fs.readFileSync(trunkYamlPath, "utf8");
//   const sqlfluffRegex = /- sqlfluff@((\d.?)+)\n/;
//   const newContents = currentContents.replace(
//     sqlfluffRegex,
//     "- sqlfluff@$1:\n        commands: [lint, fix]\n"
//   );
//   fs.writeFileSync(trunkYamlPath, newContents);
// };

// linterFmtTest({ linterName: "sqlfluff", namedTestPrefixes: ["basic_fmt"], preCheck: fmtCallbacks });

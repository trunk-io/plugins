import * as fs from "fs";
import * as path from "path";
import { linterCheckTest, linterFmtTest } from "tests";
import { TrunkDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

// buf-breaking detects breaking changes to proto files by using git-awareness
const preCheck = async (driver: TrunkDriver) => {
  if (driver.sandboxPath && driver.gitDriver) {
    // trunk-ignore-begin(semgrep): driver.sandboxPath is generated deterministically and is safe
    const testPath = path.resolve(driver.sandboxPath, TEST_DATA);
    const inputName = "buf_breaking.in.proto";
    const inputPath = path.resolve(testPath, inputName);
    // trunk-ignore-end(semgrep)

    const newContents = `
    syntax = "proto3";

    package trunk;

    // Change the types of these fields (breaking change)
    message HelloWorld {
      int32 hello = 1;
      int32 world = 2;
    }
    `;

    await driver.gitDriver.add(inputPath).commit("Committed original version");
    fs.writeFileSync(inputPath, newContents);
  }
};

// TODO(Tyler): We will eventually need to add a couple more test cases involving failure modes and more coverage for format.
linterCheckTest({ linterName: "buf-lint", namedTestPrefixes: ["buf_lint"] });
linterFmtTest({ linterName: "buf-format", namedTestPrefixes: ["buf_lint"] });

linterCheckTest({ linterName: "buf-breaking", namedTestPrefixes: ["buf_breaking"], preCheck });

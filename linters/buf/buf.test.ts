import * as path from "path";
import { customLinterCheckTest, linterCheckTest, linterFmtTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

// buf-breaking detects breaking changes to proto files by using git-awareness
const preCheck = (addDup: boolean) => async (driver: TrunkLintDriver) => {
  if (driver.gitDriver) {
    const inputName = "buf_breaking.in.proto";
    const inputPath = path.join(TEST_DATA, inputName);

    const dupInputName = "buf_breaking.dup.in.proto";
    const dupInputPath = path.join(TEST_DATA, dupInputName);

    const newContents = `
    syntax = "proto3";

    package trunk;

    // Change the types of these fields (breaking change)
    message HelloWorld {
      int32 hello = 1;
      int32 world = 3;
    }
    `;

    await driver.gitDriver.add(inputPath).commit("Committed original version");
    driver.writeFile(inputPath, newContents);

    if (addDup) {
      driver.writeFile(dupInputPath, newContents);
    }
  }
};

// TODO(Tyler): We will eventually need to add a couple more test cases involving failure modes and more coverage for format.
linterCheckTest({
  linterName: "buf-lint",
  namedTestPrefixes: ["buf_lint"],
});
linterFmtTest({
  linterName: "buf-format",
  namedTestPrefixes: ["buf_lint"],
});

// NOTE(Tyler): This isn't a perfect config of buf breaking. For instance, if files are moved/renamed, buf cannot account for
// them, but it offers a best effort that covers primary buf use cases.
customLinterCheckTest({
  linterName: "buf-breaking",
  testName: "basic",
  args: "-a",
  preCheck: preCheck(false),
});

// NOTE(Tyler): buf-breaking will non-deterministically choose one of the proto files to be the original and one to be the
// duplicate. Because of this, we have custom replacement for file and message to replace ".dup." -> "."
customLinterCheckTest({
  linterName: "buf-breaking",
  testName: "dupFile",
  args: "-a",
  preCheck: preCheck(true),
});

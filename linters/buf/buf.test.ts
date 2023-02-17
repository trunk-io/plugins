// import * as path from "path";
import { linterCheckTest, linterFmtTest } from "tests";
// import { TrunkDriver } from "tests/driver";
// import { TEST_DATA } from "tests/utils";

// buf-breaking detects breaking changes to proto files by using git-awareness
// const preCheck = async (driver: TrunkDriver) => {
//   if (driver.gitDriver) {
//     const inputName = "buf_breaking.in.proto";
//     const inputPath = path.join(TEST_DATA, inputName);

//     const newContents = `
//     syntax = "proto3";

//     package trunk;

//     // Change the types of these fields (breaking change)
//     message HelloWorld {
//       int32 hello = 1;
//       int32 world = 2;
//     }
//     `;

//     await driver.gitDriver.add(inputPath).commit("Committed original version");
//     driver.writeFile(inputPath, newContents);
//   }
// };

// TODO(Tyler): We will eventually need to add a couple more test cases involving failure modes and more coverage for format.
linterCheckTest({ linterName: "buf-lint", namedTestPrefixes: ["buf_lint"] });
linterFmtTest({ linterName: "buf-format", namedTestPrefixes: ["buf_lint"] });

// TODO(Tyler): Buf-breaking tests and the config itself are currently in a semi-broken state. Need to fix and re-enable.
// linterCheckTest({ linterName: "buf-breaking", namedTestPrefixes: ["buf_breaking"], preCheck });

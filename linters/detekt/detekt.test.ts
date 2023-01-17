import * as fs from "fs";
import path from "path";
import { customLinterCheckTest, linterCheckTest, TestCallback } from "tests";
import { TrunkDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

// Running check on the input manually requires the existence of a top level .detekt.yaml
const preCheck = (driver: TrunkDriver) => {
  driver.writeFile(".detekt.yaml", "");
};

// TODO(Tyler): We will eventually need to add a couple more test cases involving failure modes.
linterCheckTest({ linterName: "detekt", namedTestPrefixes: ["basic_detekt"], preCheck });

// detekt-explicit has no default settings, leading to an empty result
linterCheckTest({ linterName: "detekt-explicit", namedTestPrefixes: ["basic_explicit"], preCheck });

// detekt-gradle tests rely on a particular gradle-focused system setup, and they require a level of greater configuration here.
// TODO(Tyler): Because of this setup, this leads to reduced coverage for different versions. We should augment this logic
// without using a static jar.
const gradlePreCheck: TestCallback = (driver) => {
  // Move files to root
  // trunk-ignore-begin(semgrep): paths used here are safe
  fs.readdirSync(path.resolve(driver.getSandbox(), TEST_DATA, "detekt_gradle")).forEach((file) => {
    driver.moveFile(path.join(TEST_DATA, "detekt_gradle", file), file);
  });
  // trunk-ignore-end(semgrep)
};

customLinterCheckTest({ linterName: "detekt-gradle", args: "-a", preCheck: gradlePreCheck });

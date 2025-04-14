import path from "path";
import { customLinterCheckTest, linterCheckTest, linterFmtTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

linterCheckTest({ linterName: "biome", namedTestPrefixes: ["basic_check"] });

linterFmtTest({ linterName: "biome", namedTestPrefixes: ["basic_fmt", "basic_json"] });

const preCheck = (driver: TrunkLintDriver) => {
  // Write an invalid biome config and verify we surface an error for format.
  // NOTE(Tyler): We should handle config errors better for 'lint' too, but the JSON
  // output for biome is not stable and they don't support SARIF.
  driver.writeFile("biome.json", JSON.stringify({ rules: { "no-foo": "error" } }));
};

customLinterCheckTest({
  linterName: "biome",
  testName: "error",
  args: path.join(TEST_DATA, "basic_check.in.ts"),
  preCheck,
});

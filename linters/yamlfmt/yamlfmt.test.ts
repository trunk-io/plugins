import { linterCheckTest, linterFmtTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { osTimeoutMultiplier } from "tests/utils";

// This install is quite slow on some Linux machines.
jest.setTimeout(600000 * osTimeoutMultiplier);

const writeTrunkConfig = (driver: TrunkLintDriver) => {
  const config = `formatter:
  type: basic
  scan_folded_as_literal: true
  retain_line_breaks: true
`;
  driver.writeFile(".trunk/configs/.yamlfmt.yml", config);
};

linterCheckTest({ linterName: "yamlfmt", namedTestPrefixes: ["empty"] });

linterFmtTest({ linterName: "yamlfmt", namedTestPrefixes: ["basic"] });

linterFmtTest({
  linterName: "yamlfmt",
  namedTestPrefixes: ["config"],
  preCheck: writeTrunkConfig,
});

import { customLinterCheckTest } from "tests";

customLinterCheckTest({
  linterName: "renovate",
  args: "-a -foo", // TODO: TYLER REMOVE FOO
});

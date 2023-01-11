import path from "path";
import { customLinterCheckTest } from "tests";
import { TEST_DATA } from "tests/utils";

// As mentioned in the plugin.yaml, svgo could be a formatter, but is not classified as such.
// Thus, rather than having just a diagnostic telling us the file is unformatted, we run with `check -y` to assert its formats.
customLinterCheckTest({
  linterName: "svgo",
  args: "-y",
  pathsToSnapshot: [path.join(TEST_DATA, "basic.svg")],
});

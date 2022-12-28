import { linterCheckTest } from "tests";

// TODO(Tyler): As mentioned in the plugin.yaml, svgo could be a formatter, but is not classified as such.
// Thus, the diagnostic in the test just lists it as unformatted. We should add a `check -y` option to the test
// for better coverage.
linterCheckTest({ linterName: "svgo" });

import { customLinterCheckTest } from "tests";

// TODO(Tyler): This test is known to be flaky. We need to add another test type for it.
customLinterCheckTest({
  linterName: "osv-scanner",
  args: "-a -y",
});

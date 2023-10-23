import { linterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";

// NOTE(Tyler): Terrascan will sometimes fail due to a git error:
// "failed to fetch references from git repo. error: 'some refs were not updated'"
// Add a remote in order to avoid this error.
const preCheck = async (driver: TrunkLintDriver) => {
  await driver.gitDriver?.addRemote("origin", driver.getSandbox());
};

linterCheckTest({ linterName: "terrascan", preCheck });

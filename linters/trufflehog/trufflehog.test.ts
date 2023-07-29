import { customLinterCheckTest, linterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";

linterCheckTest({ linterName: "trufflehog" });

// Create secrets that exist both only in history, and also in the working tree.
const preCheck = async (driver: TrunkLintDriver) => {
  if (driver.gitDriver) {
    await driver.gitDriver.checkoutLocalBranch("branch-with-secrets");
    driver.copyFileFromRootTo("linters/trufflehog/test_data/secrets.in.py", "secrets.in.py");
    driver.copyFileFromRootTo("linters/trufflehog/test_data/secrets.in.py", "secrets2.in.py");
    await driver.gitDriver.add("secrets.in.py").add("secrets2.in.py").commit("Add secrets");
    driver.deleteFile("secrets.in.py");
    await driver.gitDriver.add("secrets.in.py").commit("Remove secrets");
  }
};

customLinterCheckTest({
  linterName: "trufflehog-git",
  testName: "secret_in_history",
  preCheck,
});

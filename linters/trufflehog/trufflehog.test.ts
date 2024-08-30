import { customLinterCheckTest, linterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { LandingState } from "tests/types";

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
  } else {
    driver.debug("Error: failed to initialize git driver");
  }
};

// Rewrite the landing state to remove non-deterministic commit hashes.
const normalizeLandingState = (landingState: LandingState) => {
  if (landingState.issues) {
    for (const issue of landingState.issues) {
      if (issue.message) {
        issue.message = issue.message.replace(/commit [0-9a-f]{40}/g, "commit <hash>");
      }
    }
  }
};

customLinterCheckTest({
  linterName: "trufflehog-git",
  preCheck,
  normalizeLandingState,
});

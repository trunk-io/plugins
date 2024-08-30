import { makeToolTestConfig, toolTest } from "tests";

const sampleDiff = `diff --git a/.trunk/trunk.yaml b/.trunk/trunk.yaml
index dc4f1f8..fb8fe54 100644
--- a/.trunk/trunk.yaml
+++ b/.trunk/trunk.yaml
@@ -13,3 +13,6 @@ lint:
         - node_modules/**
         - .trunk/configs/**
         - .gitattributes
+tools:
+  enabled:
+    - diff-so-fancy@1.4.3`;

let exitCode = 25;
if (process.platform === "darwin") {
  exitCode = 102;
} else if (process.platform === "win32") {
  exitCode = 0;
}
// diff-so-fancy returns a nonzero exit code for its version command, so we have to
// use the custom test constructor.
toolTest({
  toolName: "diff-so-fancy",
  toolVersion: "1.4.3",
  testConfigs: [
    makeToolTestConfig({
      command: ["diff-so-fancy"],
      expectedExitCode: exitCode,
      expectedOut: "modified:",
      stdin: sampleDiff,
    }),
  ],
});

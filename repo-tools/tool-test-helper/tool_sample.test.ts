import { makeToolTestConfig, toolInstallTest, toolTest } from "tests";

// Guidelines for configuring tests:
//  - Prefer using health check in config + toolInstallTest, if you must use toolTest leave a
//    comment explaining why. Only one of the two options is sufficient.
//  - Usually, just a version or help text command is sufficient
//  - add a test for each command that is used in the plugin.yaml
//  - exit code 0 is assumed, so set expectedExitCode if it is different
//  - expectedOut/expectedErr do a substring match, so you can just put a portion of the output
//
// If you are unable to write a test for this tool, please document why in your PR. Feel free to ask for help!

toolInstallTest({
  toolName: "NAME_HERE",
  toolVersion: "VERSION_HERE",
});

// No need to include if a toolInstallTest is included.
toolTest({
  toolName: "NAME_HERE",
  toolVersion: "VERSION_HERE",
  testConfigs: [
    makeToolTestConfig({
      command: ["SHIM_NAME", "COMMAND_HERE"],
      expectedOut: "OUTPUT_HERE",
    }),
  ],
});

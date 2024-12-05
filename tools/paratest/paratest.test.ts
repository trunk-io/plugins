import { toolInstallTest } from "tests";
import { skipOS } from "tests/utils";

toolInstallTest({
  toolName: "paratest",
  toolVersion: "7.6.0",
  skipTestIf: skipOS(["win32"]),
});

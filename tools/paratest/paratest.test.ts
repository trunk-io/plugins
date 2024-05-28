import { toolInstallTest } from "tests";
import { skipOS } from "tests/utils";

toolInstallTest({
  toolName: "paratest",
  toolVersion: "7.4.3",
  skipTestIf: skipOS(["win32"]),
});

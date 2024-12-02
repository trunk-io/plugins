import { toolInstallTest } from "tests";
import { skipOS } from "tests/utils";

toolInstallTest({
  toolName: "phpunit",
  toolVersion: "11.4.4",
  skipTestIf: skipOS(["win32"]),
});

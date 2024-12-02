import { toolInstallTest } from "tests";
import { skipOS } from "tests/utils";

toolInstallTest({
  toolName: "phpunit",
  toolVersion: "11.1.3",
  skipTestIf: skipOS(["win32"]),
});

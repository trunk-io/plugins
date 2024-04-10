import { toolInstallTest } from "tests";
import { osTimeoutMultiplier } from "tests/utils";

// This install is quite slow on some Linux machines.
jest.setTimeout(600000 * osTimeoutMultiplier);

toolInstallTest({
  toolName: "goreleaser",
  toolVersion: "1.25.1",
});

import { linterFmtTest } from "tests";
import { osTimeoutMultiplier, skipOS } from "tests/utils";

jest.setTimeout(600000 * osTimeoutMultiplier);

linterFmtTest({ linterName: "nixpkgs-fmt", skipTestIf: skipOS(["win32"]) });

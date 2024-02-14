import { linterFmtTest } from "tests";
import { skipCPUOS } from "tests/utils";

linterFmtTest({ linterName: "deno", skipTestIf: skipCPUOS([{ os: "linux", cpu: "arm64" }]) });

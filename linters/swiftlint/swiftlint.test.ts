import { customLinterCheckTest } from "tests";
import { skipOS } from "tests/utils";

customLinterCheckTest({ linterName: "swiftlint", args: "-a", skipTestIf: skipOS(["linux"]) });

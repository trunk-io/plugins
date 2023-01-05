import { customLinterCheckTest } from "tests";
import { TEST_DATA } from "tests/utils";

customLinterCheckTest({ linterName: "brakeman", args: TEST_DATA });

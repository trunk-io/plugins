import { customLinterCheckTest } from "tests";
import { TEST_DATA } from "tests/utils";

customLinterCheckTest({ linterName: "dustilock", args: TEST_DATA });

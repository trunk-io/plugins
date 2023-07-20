import { linterCheckTest } from "tests";
import { skipOS } from "tests/utils";

linterCheckTest({ linterName: "graphql-schema-linter", skipTestIf: skipOS(["win32"]) });

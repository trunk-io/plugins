import { linterCheckTest } from "tests";

linterCheckTest({ linterName: "ruff", namedTestPrefixes: ["basic"] });
linterCheckTest({ linterName: "ruff-nbqa", namedTestPrefixes: ["basic_nb"] });

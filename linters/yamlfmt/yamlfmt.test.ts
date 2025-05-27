import { linterCheckTest, linterFmtTest } from "tests";
import { osTimeoutMultiplier } from "tests/utils";

// This install is quite slow on some Linux machines.
jest.setTimeout(600000 * osTimeoutMultiplier);

linterCheckTest({ linterName: "yamlfmt", namedTestPrefixes: ["empty"] });

linterFmtTest({ linterName: "yamlfmt", namedTestPrefixes: ["basic"] });

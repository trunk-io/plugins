import { linterCheckTest, linterFmtTest } from "tests";

// sql-formatter runs successfully on an empty file
linterCheckTest({ linterName: "sql-formatter", namedTestPrefixes: ["empty"] });

linterFmtTest({ linterName: "sql-formatter", namedTestPrefixes: ["basic"] });

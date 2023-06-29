import { linterCheckTest, linterFmtTest } from "tests";

linterFmtTest({ linterName: "prisma", namedTestPrefixes: ["test0"] });
linterCheckTest({ linterName: "prisma" });

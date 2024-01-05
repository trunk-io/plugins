import { linterCheckTest, linterFmtTest } from "tests";

linterCheckTest({ linterName: "biome", namedTestPrefixes: ["basic_check"] });

linterFmtTest({ linterName: "biome", namedTestPrefixes: ["basic_fmt", "basic_json"] });

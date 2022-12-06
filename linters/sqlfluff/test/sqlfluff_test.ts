import { defaultLinterCheckTest, defaultLinterFmtTest } from "tests";

defaultLinterCheckTest(__dirname, "sqlfluff", ["basic_check"]);
// TODO: TYLER FIX THE FORMAT TEST
// defaultLinterFmtTest(__dirname, "sqlfluff-fix", ["basic_fmt"]);

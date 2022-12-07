import { defaultLinterCheckTest, defaultLinterFmtTest } from "tests";

defaultLinterCheckTest(__dirname, "sqlfluff", ["basic_check"]);
defaultLinterFmtTest(__dirname, "sqlfluff", ["basic_fmt"]);

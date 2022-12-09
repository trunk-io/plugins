import { defaultLinterCheckTest, defaultLinterFmtTest } from "tests";

defaultLinterCheckTest(__dirname, "sqlfluff", ["basic_check"]);
// TODO: TYLER THIS NEEDS TO ENABLE THE SPECIFIC COMMANDS
// defaultLinterFmtTest(__dirname, "sqlfluff", ["basic_fmt"]);

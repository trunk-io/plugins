import { linterCheckTest, linterFmtTest } from "tests";

// `trunk check basic_check.in.cc --force --filter=todo_linter_test --output=json`
//  ----> basic_check.out.json
linterCheckTest({linterName: "todo-linter", namedTestPrefixes: ["basic_check"]});
// `cat basic_fmt.in.cc | trunk format-stdin basic_fmt.in.cc`
//  ----> basic_fmt.out.cc
linterFmtTest({linterName: "todo-linter", namedTestPrefixes: ["basic_fmt"]});

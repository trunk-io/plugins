import { linterFmtTest } from "tests";

// A simple formatter test to run 'pragma-once' on 'test_data/basic.in.hh'
linterFmtTest({ linterName: "pragma-once" });

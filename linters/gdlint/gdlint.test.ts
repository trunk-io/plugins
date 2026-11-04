import { linterCheckTest } from "tests";

// gdlint exits 1 for rule findings and for files it cannot parse alike, so parse_error
// checks that an unparsable file is reported as gdlint/parse-error rather than as clean.
linterCheckTest({ linterName: "gdlint" });

# Testing

## Overview

Thank you for contributing to the trunk plugins repository! We appreciate your support as we work to
streamline the discovery, management and integration of new tools.

We ask that new linter definitions in this repository add some basic testing logic. This should be a
straightforward and simple process, with minimal overhead, but let us know if you need help! Please
start by following the instructions below:

## Configuring Tests

Please create a directory structure in your linter/formatter definition analogous to the following:

```
linters/
└─my-linter/
  │ plugin.yaml
  │ readme.md (optional)
  │ my-config.json (optional)
  └─test/
    │ basic.in.py
    │ basic.out.json
    │ my_linter_test.ts
```

- Specify a `readme.md` if your linter integration requires additional explanation or configuration.
- Specify a `my-config.json` (or whatever `direct_configs` item applies) ONLY if providing this
  config file is sufficient to enable your linter in ALL cases. This will be created whenever
  someone enables your linter.
- Inside of `test/`, provide a testing file and at least one pair of input/output files.
  - For linters, specify a sample input file (with an appropriate file extension). Your output file
    should be the result of running
    `trunk check ${path_to_input_file} --force --filter=${my_linter} --output=json` and should have
    a `.json` file extension.
  - For formatters, specify a sample input file (with an appropriate file extension). Your output
    file should be the result of running
    `trunk fmt ${path_to_input_file} --force --filter=${my_linter} --output=json` and should have
    the same file extension as the input file.
  - The typescript test file should call `defaultLinterCheckTest` or `defaultLinterFmtTest` with
    `__dirname`, the name of your linter, and (optionally) the prefixes of your input/output files.

Refer to [sqlfluff](../linters/sqlfluff) or [pragma-once](../linters/pragma-once) as testing
examples.

## Running Tests

To run all tests, run

```bash
npm run test
```

To run an individual test, run

```bash
npm run test ${path_to_linter_subdir}
```

## Additional Options

### Test Configuration

`defaultLinterCheckTest` or `defaultLinterFmtTest` should be sufficient for most linters and
formatters. If your test requires additional setup, follow the example of setup in
[config_check_test.ts](./config_check_test.ts).

### Environment Overrides

Additional configuration can be passed by running `npm run build-test` and then prepending
`npm run test` with environment variables. Options include:

- `PLUGINS_TEST_CLI_VERSION` replaces the repo-wide trunk.yaml's specified cli-version
- `PLUGINS_TEST_CLI_PATH` specifies an alternative path to a trunk binary
- `PLUGINS_TEST_LINTER_VERSION` specifies a linter version semantic (KnownGoodVersion | Latest |
  version)

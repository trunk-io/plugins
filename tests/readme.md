# Testing

## Overview

Thank you for contributing to the trunk plugins repository! We appreciate your support as we work to
streamline the discovery, management and integration of new tools.

We ask that new linter definitions in this repository add some basic testing logic. This should be a
straightforward and simple process, with minimal overhead, but let us know if you need help! Please
start by following the instructions below:

## Configuring Tests

Please create a directory structure in your linter/formatter definition analogous to the following:

```text
linters/
└─my-linter/
  │ plugin.yaml
  │ readme.md (optional)
  │ my-config.json (optional)
  └─test/
    │ basic.in.py
    │ my_linter_test.ts
```

- Specify a `readme.md` if your linter integration requires additional explanation or configuration.
- Specify a `my-config.json` (or whatever `direct_configs` item applies) ONLY if providing this
  config file is sufficient to enable your linter in ALL cases. This will be created whenever
  someone enables your linter.
- Inside of `test/`, provide a testing file and at least one input file.

  - For linters, specify a sample input file (with an appropriate file extension). For reference,
    the tests will run the following command against your input file:

    ```bash
    trunk check ${path_to_input_file} --force --filter=${my_linter} --output=json
    ```

  - For formatters, specify a sample input file (with an appropriate file extension). For reference,
    the tests will run the following command against your input file:

    ```bash
    cat ${path_to_input_file} | trunk format-stdin ${path_to_input_file} --filter=${my_linter}
    ```

  - The typescript test file should call `linterCheckTest` or `linterFmtTest` with the name of your
    linter and (optionally) the prefixes of your input files.

Refer to [sqlfluff](../linters/sqlfluff) or [pragma-once](../linters/pragma-once) as testing
examples.

## Running Tests

To run all tests, run `npm install` and then run:

```bash
npm run test
```

To run an individual test, run:

```bash
npm run test ${path_to_linter_subdir}
```

Then verify that the generated snapshot file includes the results you would expect (e.g. several
fileIssues, no taskFailures).

### Linter Versioning

Missing snapshots will be automatically created based on test input files. If an existing test fails
because a new linter version has introduced a breaking change, rather than running
`npm run test -- -u`, **instead run**
`PLUGINS_TEST_NEW_SNAPSHOT=true npm run test ${path_to_failing_test}`. This is used to track
historical test behavior and ensure compatibility with trunk across multiple linter versions. See
"Environment Overrides" below.

If you need to run tests for all the existing snapshots, run
`PLUGINS_TEST_LINTER_VERSION=Snapshots npm run test`.

## Additional Options

### Test Configuration

`linterCheckTest` or `linterFmtTest` should be sufficient for most linters and formatters. If your
test requires additional setup, follow the example of setup in
[config_check_test.ts](./config_check_test.ts).

### Environment Overrides

Additional configuration can be passed by prepending `npm run test` with environment variables.
Options include:

- `PLUGINS_TEST_CLI_VERSION` replaces the repo-wide trunk.yaml's specified cli-version
- `PLUGINS_TEST_CLI_PATH` specifies an alternative path to a trunk binary
- `PLUGINS_TEST_LINTER_VERSION` specifies a linter version semantic (KnownGoodVersion | Latest |
  Snapshots | version)
- `PLUGINS_TEST_NEW_SNAPSHOT` if "true" tells tests to use an exact match of the linter version when
  checking the output. Only set this if a linter has introduced a results change with a version
  change

### Debugging

Errors encountered during test runs are reported through the standard `console`, but additional
debugging is provided using [debug](https://www.npmjs.com/package/debug). The namespace convention
used is `<Location>:<linter>:<#>`, where Location is `Driver | Tests`, linter is the name of the
linter being tested (alternatively `test<#>` if no linter is specified), and # is a counter used to
distinguish between multiple tests with the same linter.

Accordingly, in order to view debug logs for all sqlfluff tests, you can set the environment
variable:

```bash
DEBUG=*:sqlfluff*
```

To just see debug logs from the test driver, use:

```bash
DEBUG=Driver:*
```

We also recommend setting `DEBUG_COLORS=true` for clarity.

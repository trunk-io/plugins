# Testing

## Overview

We ask that all new linter definitions in this repository add some basic testing. This should be a
straightforward and simple process, with minimal overhead, but let us know if you need help! Please
start by following the instructions below:

## Configuring Tests

Please create a directory structure in your linter/formatter definition analogous to the following:

```text
linters/
└─my-linter/
  │ plugin.yaml
  │ my_linter.test.ts
  │ readme.md (optional)
  │ my-config.json (optional)
  └─test_data/
    └─basic.in.py (with appropriate extension)
```

- Specify a `readme.md` if your linter integration requires additional explanation or configuration.
- Specify a `my-config.json` (or whatever `direct_configs` item applies) ONLY if providing this
  config file is sufficient to enable your linter in ALL cases. This will be created whenever
  someone enables your linter.
- Specify a typescript test file that calls `linterCheckTest` or `linterFmtTest` with the name of
  your linter and (optionally) the prefixes of your input files and any special callbacks.
- Inside of `test_data/`, provide at least one input file.

  - For linters, specify a sample input file (with an appropriate file extension). For reference,
    the tests will run the following command against your input file:

    ```bash
    trunk check ${path_to_input_file} --force --filter=${my_linter} --output=json
    ```

  - For formatters, specify a sample input file (with an appropriate file extension). For reference,
    the tests will essentially run the following command against your input file:

    ```bash
    cat ${path_to_input_file} | trunk format-stdin ${path_to_input_file} --filter=${my_linter}
    ```

Refer to [sqlfluff](../linters/sqlfluff) or [pragma-once](../linters/pragma-once) as testing
examples.

## Running Tests

To run all tests, run `npm install` and then run:

```bash
npm test
```

To run an individual test, run:

```bash
npm test ${path_to_linter_subdir}
```

Then, verify that the generated snapshot file includes the results you would expect (e.g. an Object
with several fileIssues, no taskFailures).

For context, the general test execution is as follows:

1. Create a sandbox testing directory by copying a linter's subdirectory and its `test_data`.
2. Initialize a base .trunk/trunk.yaml in the sandbox with the version in
   [.trunk/trunk.yaml](../.trunk/trunk.yaml).
3. Run `trunk check enable <linter>`.
4. Run `trunk check` or `trunk fmt` on files with the `<name>.in.<extension>` syntax.

### Linter Versioning

The first time a test runs, it will attempt to run against a linter's `known_good_version`. This
snapshot mirrors the behavior in CI and is used to validate that a linter runs as expected across
multiple versions. Subsequent test runs will only run against its latest version unless otherwise
specified (See [Environment Overrides](#environment-overrides)).

If this causes the test to fail when run with the latest version, this is most likely because there
are discrepancies in the linter output across versions. Rather than running `npm test -- -u`,
**instead run** `PLUGINS_TEST_UPDATE_SNAPSHOTS=true npm test ${path_to_failing_test}`. This will
create an additional snapshot for the latest version and is used to track historical test behavior
and ensure compatibility with trunk across multiple linter versions.

If you need to run tests for all the existing snapshots, run
`PLUGINS_TEST_LINTER_VERSION=Snapshots npm test`.

The process of resolving snapshots for asserting output correctness is as follows:

1. If the linter being tested has no version (e.g. `pragma-once`), the same snapshot is used in all
   cases.
2. If `PLUGINS_TEST_UPDATE_SNAPSHOTS` is truthy, the enabled version of the linter is used, and if a
   snapshot with this version does not exist, a new snapshot is created.
3. Otherwise, use the most recent snapshot version that precedes the enabled version of the linter.
   If such a snapshot does not exist, a new snapshot is created with the enabled version of the
   linter (use [debug logging](#debugging) to see what version was enabled).

The reasoning for this setup is threefold:

1. Linters can update their arguments or outputs on occasion, which can lead to a different trunk
   output. We would like to be aware of these changes, particularly if they require trunk to accept
   a different output format entirely.
2. We want to ensure we can support older versions of linters when possible. Thus, when changes are
   introduced, set `PLUGINS_TEST_UPDATE_SNAPSHOTS` rather than running with the `-u` flag. This
   preserves the older snapshots.
3. We don't want to require a snapshot for _every_ version of _every_ linter. This is overkill,
   pollutes the test data, and causes friction with in progress PRs when new linter versions are
   released. Therefore, by default we resolve to the most recent snapshot version and assume that
   its output will match, unless otherwise specified.

## Additional Options

### System Prereqs

trunk is [compatible](https://docs.trunk.io/docs/compatibility) with most versions of Linux and
macOS. If your linter only runs on certain OSs, refer to the example of
[stringslint](linters/stringslint/stringslint.test.ts) to skip OS-dependent test runs.

### Test Configuration

`linterCheckTest` or `linterFmtTest` should be sufficient for most linters and formatters. If your
test requires additional setup, follow the example of `preCheck` in
[sqlfluff_test.ts](../linters/sqlfluff/test/sqlfluff_test.ts).

### Environment Overrides

Additional configuration can be passed by prepending `npm test` with environment variables. Options
include:

- `PLUGINS_TEST_CLI_VERSION` replaces the repo-wide [`trunk.yaml`](../.trunk/trunk.yaml)'s specified
  cli-version
- `PLUGINS_TEST_CLI_PATH` specifies an alternative path to a trunk launcher
- `PLUGINS_TEST_LINTER_VERSION` specifies a linter version semantic (KnownGoodVersion | Latest |
  Snapshots | version). Latest is the default.
- `PLUGINS_TEST_UPDATE_SNAPSHOTS` if `true`, tells tests to use an exact match of the linter version
  when checking the output. Only set this if a linter has introduced a output variation with a
  version change.
- `SANDBOX_DEBUG` if `true`, prevents sandbox test directories from being deleted, and logs their
  path for additional debugging.

### CI

PRs will run 5 types of tests across both ubuntu and macOS as applicable:

1. Enable and test all linters with their `known_good_version`, if applicable. To replicate this
   behavior, run: `PLUGINS_TEST_LINTER_VERSION=KnownGoodVersion npm test`. If the
   `known_good_version` is different from the version enabled when you defined the linter, you will
   need to first run this locally to generate a snapshot file.
2. Enable and test all linters with their latest version, if applicable. To replicate this behavior,
   run: `npm test`.
3. Assert that all linters pass config validation. This is also validated while running: `npm test`.
4. Assert that all linters have test coverage.
5. Assert that all linters are included in the [`readme.md`](../readme.md).

### Debugging

Individual tests normally complete in less than 1 minute. They may take up to 5 minutes or so if the
dependency cache is empty (linters need to be downloaded and installed to run the linter tests).
Subsequent runs will not experience this delay.

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

# Contribution

Thanks for contributing to Trunk's default plugins! Read on to learn more.

- [Prerequisites](#prerequisites)
- [Overview](#overview)
- [Adding new linters](#linters)
- [Adding new tools](#tools)
- [Adding new actions](#actions)
- [Release process](#releases)
- [Guidelines](#guidelines)
- [Docs](https://docs.trunk.io)

## Prerequisites

1. Please [install the trunk CLI](https://docs.trunk.io/check/usage#install-the-cli)
2. Run `trunk check` in this repo to quickstart git-hooks and codegen

## Overview

We use this repository to provide our users with default linters, tools, and actions. Trunk
automatically adds the following to users' trunk.yaml:

```yaml
plugins:
  sources:
    - id: trunk
      uri: https://github.com/trunk-io/plugins
      ref: <latest_release>
```

Plugins can also be loaded from local paths, as below:

```yaml
plugins:
  sources:
    - id: trunk
      local: </path/to/repo/root>
```

Adding a plugin source lets users run `trunk check enable`, `trunk tools enable`, or
`trunk actions enable` with definitions in that plugin. For more information, see our
[docs](https://docs.trunk.io/docs/plugins).

**Please review our [Testing Guide](tests/README.md) for info on writing and running tests.**

If you have questions, please [stop by our community Slack](https://slack.trunk.io/), and if you
have a feature request, you can [file it here](https://features.trunk.io/).

## Linters

To add a new linter:

1. Run `trunk check` to start up Trunk in the background.
2. Run `mkdir linters/<my-linter>` to start. This should autopopulate with a sample
   [plugin.yaml](./repo-tools/linter-test-helper/linter_sample_plugin.yaml) and
   [test file](./repo-tools/linter-test-helper/linter_sample.test.ts). If necessary, add them
   yourself:

   ```text
   linters/
   └─my-linter/
     │ plugin.yaml
     │ my_linter.test.ts
     │ README.md (optional)
     │ my-config.json (optional)
     └─test_data/
        └─basic.in.foo (with appropriate extension)
   ```

3. Add your linter definition to `plugin.yaml` (consult the docs for [custom linters] and [custom
   parsers]
   to understand how it should be defined). Most linters in this repository are defined as tools as
   well, so that they can be easily run manually from the command line.
4. Run `trunk check enable <my-linter>` to enable your linter, and run `trunk check` to verify that
   the configuration is valid and that you get desired diagnostics. Running `trunk check --verbose`
   can help provide greater insights when debugging. You may also wish to run on your test data,
   i.e. `trunk check --verbose --force linters/<my-linter>/test_data/basic.in.foo`.
5. Add a few simple test cases to `my_linter.test.ts` to exercise your linter and generate
   snapshots. **Refer to the [Testing Guide](tests/README.md) for more information on writing,
   running, and debugging tests.**
6. Revert any `.trunk/trunk.yaml` changes, and run `trunk check` to lint your changes.
7. Open a PR!

[custom linters]: https://docs.trunk.io/code-quality/linters/custom-linters
[custom parsers]: https://docs.trunk.io/cli/configuration/lint/output-parsing

## Tools

If the tool you intend to add functions primarily as a linter, please follow the instruction in
[linters](#linters). If it functions more as a standalone tool, please add it in the `tools/`
directory and follow the instructions below.

To add a new tool:

1. Run `trunk check` to start up Trunk in the background.
2. Run `mkdir tools/<my-tool>` to start. This should autopopulate with a sample
   [plugin.yaml](./repo-tools/tool-test-helper/tool_sample_plugin.yaml) and
   [test file](./repo-tools/tool-test-helper/tool_sample.test.ts). If necessary, add them yourself:

   ```text
   tests/
   └─my-tool/
     │ plugin.yaml
     │ my_tool.test.ts
     └─README.md (optional)
   ```

3. Add your tool definition to `plugin.yaml` (consult the docs for
   [custom tools](https://docs.trunk.io/tools/configuration#tool-definitions) to understand how it
   should be defined).
4. Run `trunk tools enable <my-tool>` to enable your tool, and run its shim(s) from
   `.trunk/tools/<tool-name>`.
5. Add a `toolInstallTest` to `my_tool.test.ts` to verify your tool's installation. If neccessary,
   use `toolTest` instead. **Refer to the [Testing Guide](tests/README.md) for more information on
   writing, running, and debugging tests.**
6. Revert any `.trunk/trunk.yaml` changes, and run `trunk check` to lint your changes.
7. Open a PR!

## Actions

To add a new action:

1. Create a directory inside `actions/` with the name of your new action.
2. Inside this new directory, create the following structure:

   ```text
   actions/
   └─my-action/
     │ plugin.yaml
     └─README.md
   ```

3. Add your action definition to `plugin.yaml` (consult the docs on [actions] to understand how it
   should be defined).
4. If necessary, add additional scripts in the same directory for your action to reference.
5. Making sure the plugin in .trunk/trunk.yaml is pointing to your local repository, run
   `trunk actions enable <my-action>` to enable your linter, and run `trunk run <my-action>` to
   verify that the configuration is valid and that you get desired results. Running
   `trunk actions history <my-action>` can help provide greater insights when debugging.
6. Please briefly document your action in its README.md as appropriate.
7. Run `trunk check` to lint your changes.
8. Open a PR!

Testing for Trunk Actions in this repo is in early development, so we do not require testing for new
action definitions.

[actions]: https://docs.trunk.io/actions

## Releases

`trunk-io/plugins` is released on every few weeks. Users will pick up these configuration changes by
running `trunk upgrade` to automatically update their plugin version to the latest release.

```yaml
plugins:
  sources:
    - id: trunk
      uri: https://github.com/trunk-io/plugins
      ref: v1.2.5 # will change to the latest release on next `trunk upgrade`
```

We recommend only setting the above `ref` field to be our released tags, but if you need a
linter/tool/action that hasn't been released yet, you can set `ref` to be a git SHA. Do **not** set
`ref` to be a branch name, as plugin branches are not refreshed.

Note that the ref and the cli version in the trunk.yaml must be compatible. This is managed by
`required_trunk_version`, as specified in [`plugin.yaml`](plugin.yaml). Users will not be able to
load a plugin source until they have upgraded to a compliant CLI version.

## Guidelines

Please follow the guidelines below when contributing:

- After defining a new linter or action, please add it to [`README.md`](README.md).
- If you run into any problems while defining new linters/tools/actions, feel free to reach out on
  our [Slack](https://slack.trunk.io/). We are continuously working to improve the process of
  integrating with Trunk, and all feedback is appreciated!

## Development

For ease of development, we provide support for
[Github Codespaces](https://github.com/features/codespaces).

Just check out the repo in a codespace and you'll have everything ready to go!

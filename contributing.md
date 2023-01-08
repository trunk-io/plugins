# Contribution

Thank you for your interest in contributing to the trunk plugins repository! We appreciation your
support as we work to streamline the discovery, management, and integration of new tools with
[trunk](https://docs.trunk.io/docs/what-is-trunk). Please refer to the instructions below:

- [Overview](#overview)
- [Release process](#releases)
- [Adding new linters](#linters)
- [Adding new actions](#actions)
- [Guidelines](#guidelines)
- [Docs](https://docs.trunk.io)

## Overview

This repository provides the default plugin loaded with the trunk CLI. This is managed through the
following configuration in a user's trunk.yaml:

```yaml
plugins:
  sources:
    - id: trunk
      uri: https://github.com/trunk-io/plugins
      ref: v0.0.8
```

Plugins can also be loaded from local paths, as below:

```yaml
plugins:
  sources:
    - id: trunk
      local: # path to root of repo
```

Run `trunk run toggle-local` to quickly toggle this setting.

The specified source defines additional linters and actions that users can enable in their
repositories. For more information, see our [docs](https://docs.trunk.io/docs/plugins).

If you would like to request a new feature or seek help with a problem, please see our
[Features Page](https://features.trunk.io/) or our [Slack](https://slack.trunk.io/).

## Releases

We aim to provide a fairly regular release cadence for this repository. Releases are tied to minimum
versions of the trunk CLI, identified by the `required_trunk_version` field. Users will not be able
to load a plugin source until they have upgraded to a sufficient CLI version.

If you need a linter or action definition that has not yet been released, you can change the `ref`
field of a plugin source to be any `git` ref. However, we recommend sticking to our releases unless
absolutely necessary.

## Linters

If you wish to define a new linter to run with trunk, refer to our docs on
[custom linters](https://docs.trunk.io/docs/check-custom-linters) and
[custom parsers](https://docs.trunk.io/docs/custom-parsers). Once you are familiar with the basics
of how trunk invokes linters, proceed with the following:

1. Create a directory inside `linters/` with the name of your new linter.
2. Inside this new directory, create the following structure. If you have run `trunk check` in this
   repository recently, some of these files will be automatically created for you:

```text
linters/
└─my-linter/
  │ plugin.yaml
  │ my_linter_test.ts
  │ readme.md (optional)
  │ my-config.json (optional)
  └─test_data/
    │ basic.in.py
```

3. Modify plugin.yaml to define your new linter. Refer to the other definitions in this repository
   as examples.
4. Making sure `.trunk/trunk.yaml` is pointing to your local repository, run
   `trunk check enable <my-linter>` to enable your linter, and run `trunk check` to verify that the
   configuration is valid and that you get desired diagnostics. Running `trunk check --verbose` can
   help provide greater insights when debugging.
5. Add a few simple test cases to `my_linter_test.ts` to exercise your linter. Refer to
   [Testing Guidelines](tests/readme.md) for more information on writing and running tests.
6. Run `trunk check` to lint your changes.
7. Commit your entire linter subdirectory and create a
   [Pull Request](https://github.com/trunk-io/plugins/compare). We will review your changes as soon
   as we can.

## Actions

If you wish to define a new action to run with trunk, refer to our
[docs](https://docs.trunk.io/docs/actions). Once you are familiar with the basics of how trunk runs
actions, proceed with the following:

1. Create a directory inside `actions/` with the name of your new action.
2. Inside this new directory, create the following structure:

```text
actions/
└─my-action/
  │ plugin.yaml
  └─readme.md
```

3. Modify plugin.yaml to define your new action. Refer to the other definitions in this repository
   as examples.
4. If necessary, add additional scripts in this same directory that your script can reference.
5. Making sure .trunk/trunk.yaml is pointing to your local repository, run
   `trunk actions enable <my-action>` to enable your linter, and run `trunk run <my-action>` to
   verify that the configuration is valid and that you get desired results. Running
   `trunk actions history <my-action>` can help provide greater insights when debugging.
6. We have not yet defined a testing framework for plugin actions, but we are working to add one
   soon! Please briefly document your action in its readme.md and in your PR.
7. Run trunk check to lint your changes.
8. Commit your entire action subdirectory and create a Pull Request. We will review your changes as
   soon as we can.

## Guidelines

Please follow the guidelines below when contributing:

- TODO
- TODO
- After defining a new linter or action, please add it to the repository's root
  [readme.md](readme.md).
- If you run into any problems while defining new linters or actions, feel free to reach out on our
  [Slack](https://slack.trunk.io/). We are continuously working to improve the process of
  integrating with trunk, and all feedback is appreciated!

# Contribution

Thanks for contributing to trunk's default plugins! Read on to learn more.

- [Overview](#overview)
- [Release process](#releases)
- [Adding new linters](#linters)
- [Adding new actions](#actions)
- [Guidelines](#guidelines)
- [Docs](https://docs.trunk.io)

## Overview

We use this repository to provide our users with default linters and actions. trunk automatically
adds the following to users' trunk.yaml:

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

Adding a plugin source lets users run `trunk check enable` or `trunk actions enable` with linters
and actions defined in that plugin. For more information, see our
[docs](https://docs.trunk.io/docs/plugins).

If you have questions, please [stop by our community Slack](https://slack.trunk.io/), and if you
have a feature request, you can [file it here](https://features.trunk.io/).

## Releases

`trunk-io/plugins` is released on a fairly regular cadence that is independent of PRs. Users will
pick up these configuration changes by running `trunk upgrade` to automatically update their plugin
version to the latest release.

```yaml
plugins:
  sources:
    - id: trunk
      uri: https://github.com/trunk-io/plugins
      ref: v0.0.8 # will change to v0.0.9 on next `trunk upgrade`
```

We recommend only setting the above `ref` field to be our released tags, but if you need a linter or
action that hasn't been released yet, you can set `ref` to be a git SHA. Do **not** set `ref` to be
a branch name, or `HEAD`, as users will observe buggy behavior.

Note that the ref and the cli version in the trunk.yaml must be compatible. This is managed by
`required_trunk_version`, as specified in [`plugin.yaml`](plugin.yaml). Users will not be able to
load a plugin source until they have upgraded to a compliant CLI version.

## Linters

To add a new linter:

1. Create a directory inside `linters/` with the name of your new linter.
2. Inside this new directory, create the following structure. If you ran `trunk check` in this
   repository recently, some of these files should be automatically created for you:

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

3. Add your linter definition to `plugin.yaml` (consult the docs for [custom linters] and [custom
   parsers] to understand how it should be defined).
4. Making sure the plugin in [`.trunk/trunk.yaml`](.trunk/trunk.yaml) is pointing to your local
   repository, run `trunk check enable <my-linter>` to enable your linter, and run `trunk check` to
   verify that the configuration is valid and that you get desired diagnostics. Running
   `trunk check --verbose` can help provide greater insights when debugging.
5. Add a few simple test cases to `my_linter.test.ts` to exercise your linter and generate
   snapshots. Refer to [Testing Guidelines](tests/readme.md) for more information on writing and
   running tests.
6. Run `trunk check` to lint your changes.
7. Open a PR!

[custom linters]: https://docs.trunk.io/docs/check-custom-linters
[custom parsers]: https://docs.trunk.io/docs/custom-parsers

## Actions

To add a new action:

1. Create a directory inside `actions/` with the name of your new action.
2. Inside this new directory, create the following structure:

   ```text
   actions/
   └─my-action/
     │ plugin.yaml
     └─readme.md
   ```

3. Add your action definition to `plugin.yaml` (consult the docs on [actions] to understand how it
   should be defined).
4. If necessary, add additional scripts in the same directory for your action to reference.
5. Making sure the plugin in .trunk/trunk.yaml is pointing to your local repository, run
   `trunk actions enable <my-action>` to enable your linter, and run `trunk run <my-action>` to
   verify that the configuration is valid and that you get desired results. Running
   `trunk actions history <my-action>` can help provide greater insights when debugging.
6. We have not yet defined a testing framework for plugin actions, but we are working to add one
   soon! Please briefly document your action in its readme.md and in your PR.
7. Run `trunk check` to lint your changes.
8. Open a PR!

[actions]: https://docs.trunk.io/docs/actions

## Guidelines

Please follow the guidelines below when contributing:

- After defining a new linter or action, please add it to [`readme.md`](readme.md).
- If you run into any problems while defining new linters or actions, feel free to reach out on our
  [Slack](https://slack.trunk.io/). We are continuously working to improve the process of
  integrating with trunk, and all feedback is appreciated!

## Development

For ease of development, we provide support for
[Github Codespaces](https://github.com/features/codespaces).

Just check out the repo in a codespace and you'll have everything ready to go!

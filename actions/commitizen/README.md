# Commitizen

https://github.com/commitizen/cz-cli

## Simple configuration

Under the default configuration, Commitizen will pull its configuration from commitlint config
files, as there is a high likelihood both tools will be used together. The below sample
configuration will apply the
[@commitlint/config-conventional](https://github.com/conventional-changelog/commitlint/tree/master/@commitlint/config-conventional)
standard for both Commitizen and commitlint.

1. Create a `.czrc` Commitizen config file with the following contents:

   ```JSON
   {"path": "@commitlint/cz-commitlint"}
   ```

1. If you don't already have a commitlint config, create one of the following:

   - JS config (`commitlint.config.js`)

     ```JavaScript
     {extends: ['@commitlint/config-conventional']}
     ```

   - YAML config: (`.commitlintrc.yaml`)

     ```YAML
     extends: "@commitlint/config-conventional"
     ```

1. If you wish to install a git hook that will run Commitizen upon `git commit`:

   ```Shell
   trunk actions enable commitizen
   ```

1. If you wish to have the `commitizen` and `cz` CLIs available for your project:

   ```Shell
   trunk tools enable commitizen
   ```

1. If you wish to enable `commitlint` to lint your commit contents:

   ```Shell
   trunk actions enable commitlint
   ```

## Overriding configuration

In order to use a different Commitizen adapter than the default `@commitlint/cz-commitlint`, change
the contents of the `path` value in `.czrc`. After changing this, Commitizen will no longer use
commitlint config files.

You'll need to consult the documentation for your new adapter in order to configure further
settings.

If you still want to use commitlint configs with Commitizen, but not
`@commitlint/config-conventional`, simply change the value of `extends` in your commitlint config
file.

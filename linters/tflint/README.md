# Tflint

`tflint` uses
[config files](https://github.com/terraform-linters/tflint/blob/master/docs/user-guide/config.md)
local to the
[directory](https://github.com/terraform-linters/tflint/blob/master/docs/user-guide/working-directory.md)
being scanned. This means that `tflint` does not have a built-in conception of a global
configuration file. If you want to use a top-level config file or a hidden config in
`.trunk/configs`, please add the following to your `.trunk/trunk.yaml`:

```yaml
lint:
  definitions:
    - name: tflint
      environment:
        - name: TFLINT_CONFIG_FILE
          value: ${workspace}/.tflint.hcl # or ${workspace}/.trunk/configs/.tflint.hcl
```

## Tflint --init

`tflint --init` is required to load plugins before tflint can run. At high parallelism with a cold
cache, you may run into some initialization errors. These issues should go away after rerunning.

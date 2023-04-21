# Sourcery

Sourcery requires users to [login](https://docs.sourcery.ai/Guides/Getting-Started/Command-Line/)
before being run. To run with trunk locally, create a Sourcery account and run
`trunk exec sourcery login`.

## CI

Because of this required authentication step, we recommend either disabling Sourcery in trunk check
runs in CI:

```yaml
- name: Trunk Check
  uses: trunk-io/trunk-action@v1.0.8
  with:
    args: --exclude=sourcery
```

or setting up an established environment override, as we've done here with
[\_plugin.yaml](./test_data/_plugin.yaml).

# Sourcery

Sourcery requires users to [login](https://docs.sourcery.ai/Guides/Getting-Started/Command-Line/)
before being run. To run with trunk locally, create a Sourcery account and run
`trunk exec sourcery login`.

## CI

Because of this required authentication step, we recommend 1 of 3 options for a smooth experience in
CI:

1. Disable Sourcery in trunk check runs in CI:

```yaml
- name: Trunk Check
  uses: trunk-io/trunk-action@v1.0.8
  with:
    args: --exclude=sourcery
```

<!-- trunk-ignore-begin(markdownlint/MD029) -->

2. Run `trunk exec sourcery login` during as a setup before the `trunk check` step

3. Set up an established environment override, as we've done here with
   [\_plugin.yaml](./test_data/_plugin.yaml).

<!-- trunk-ignore-end(markdownlint/MD029) -->

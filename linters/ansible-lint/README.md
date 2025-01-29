# Ansible-Lint

## Usage

### New Recommendation

We now recommend using
[inverse ignores](https://docs.trunk.io/code-quality/linters/ignoring-issues-and-files#ignoring-multiple-files)
to run ansible-lint. For backwards compatibility, you will need to specify filetypes yourself and
then a list of ignores.

```yaml
lint:
  definitions:
    - name: ansible-lint
      files: [yaml]
  enabled:
    - ansible-lint@5.3.2
  ignore:
    - linters: [ansible-lint]
      paths:
        - "**"
        - "!test_data/jboss-standalone"
```

### Legacy Mode

[Ansible-lint](https://github.com/ansible/ansible-lint) is used to check ansible playbooks.
Historically, in order to integrate well with trunk, you would invoke ansible-lint with
[triggers](https://docs.trunk.io/check/configuration#trigger-rules).

```yaml
lint:
  enabled:
    - ansible-lint@5.3.2

  triggers:
    # Run these linters
    - linters:
        - ansible-lint
      # If any files matching these change
      paths:
        - "**"
      # On this target (A directory in this case)
      targets:
        - test_data/jboss-standalone
```

## FQCN

As of version `6.12.0`, ansible-lint began requiring
[fully-qualified collection names](https://ansible-lint.readthedocs.io/rules/fqcn/) and canonical
module names in some contexts. Violation of this pattern can result in fatal syntax warning
diagnostics. If you're using an older version of ansible that still supports short-form or aliased
names, you can add the following to your trunk.yaml:

```yaml
lint:
  enabled:
    - ansible-lint@x.y.z:
        packages:
          - ansible-core@2.13.7
```

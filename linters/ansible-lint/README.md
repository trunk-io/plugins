# Ansible-Lint

## Usage

[Ansible-lint](https://github.com/ansible/ansible-lint) is used to check ansible playbooks. In order
to integrate well with trunk, ansible is usually run using triggers. The trigger system allows file
changes to trigger lint runs. An example of an ansible-lint trigger is included below, but more
information can be found in our [docs](https://docs.trunk.io/docs/check-config#trigger-rules).

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

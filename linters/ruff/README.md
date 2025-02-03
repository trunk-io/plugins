# ruff

## Ignores

Here is a conversion guide for
[ruff-style ignores](https://docs.astral.sh/ruff/linter/#disabling-fixes) and
[trunk-ignores](https://docs.trunk.io/code-quality/linters/ignoring-issues-and-files):

### Same Line

```python
x = 1  # trunk-ignore(ruff)

x = 1  # noqa
```

### Next Line

```python
# trunk-ignore(ruff)
x = 1

# Unsupported in ruff
x = 1
```

### With Comments

```python
x = 1  # trunk-ignore(ruff): Expected var

x = 1  # noqa Expected var
```

### Specific Issue

```python
x = 1  # trunk-ignore(ruff/F841)

x = 1  # noqa: F841
```

### Multiple Issues

```python
x = 1  # trunk-ignore(ruff/E741,ruff/F841)

x = 1  # noqa: E741, F841
```

### Blocks

```python
# trunk-ignore-begin(ruff/F841)
x = 1
# trunk-ignore-end(ruff/F841)

# Unsupported in ruff
x = 1
```

### Whole File

```python
# trunk-ignore-all(ruff/F841)
x = 1

# ruff: noqa: F841
x = 1
```

### Notes

You can also configure which rules to use and which files to apply them to using
[ruff config files](https://docs.astral.sh/ruff/settings/#lint_per-file-ignores).

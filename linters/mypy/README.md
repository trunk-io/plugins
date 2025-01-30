# mypy

## Ignores

Here is a conversion guide for
[mypy-style ignores](https://mypy.readthedocs.io/en/stable/common_issues.html#spurious-errors-and-locally-silencing-the-checker)
and [trunk-ignores](https://docs.trunk.io/code-quality/linters/ignoring-issues-and-files):

### Same Line

```python
x: str = 1  # trunk-ignore(mypy)

x: str = 1  # type: ignore
```

### Next Line

```python
# trunk-ignore(mypy)
x: str = 1

# Unsupported in mypy
```

### Specific Issue

```python
x: str = 1  # trunk-ignore(mypy/assignment)

x: str = 1  # type: ignore[assignment]
```

### Multiple Issues

```python
x: str = 1  # trunk-ignore(mypy/assignment,mypy/note)

x: str = 1  # type: ignore[assignment, note]
```

### Blocks

```python
# trunk-ignore-begin(mypy/assigment)
x: str = 1
# trunk-ignore-end(mypy/assigment)

# Unsupported in mypy
```

### Whole File

```python
# trunk-ignore-all(mypy/assigment)
x: str = 1

# mypy: disable-error-code="assignment"
x: str = 1
```

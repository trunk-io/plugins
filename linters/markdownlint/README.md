# markdownlint

## Ignores

Here is a conversion guide for
[markdownlint-style ignores](https://github.com/DavidAnson/markdownlint/blob/main/README.md#configuration)
and [trunk-ignores](https://docs.trunk.io/code-quality/linters/ignoring-issues-and-files):

### Same Line

```markdown
# (name)[link] <!-- trunk-ignore(markdownlint) -->

# (name)[link] <!-- markdownlint-disable-line -->
```

### Next Line

```markdown
<!-- trunk-ignore(markdownlint) -->
# (name)[link]

<!-- markdownlint-disable-next-line -->
# (name)[link]
```

### With Comments

```markdown
<!-- trunk-ignore(markdownlint): Intentional -->
# (name)[link]

<!-- Unsupported in markdownlint -->
# (name)[link]
```

### Specific Issue

```markdown
<!-- trunk-ignore(markdownlint/MD011) -->
# (name)[link]

<!-- markdownlint-disable-next-line MD011 -->
# (name)[link]
```

### Multiple Issues

```markdown
<!-- trunk-ignore(markdownlint/MD001,markdownlint/MD011) -->
# (name)[link]

<!-- markdownlint-disable-next-line MD001 MD011 -->
# (name)[link]
```

### Blocks

```markdown
<!-- trunk-ignore-begin(markdownlint/MD011) -->

# (name)[link]

<!-- trunk-ignore-end(markdownlint/MD011) -->

<!-- markdownlint-disable MD011 -->

# (name)[link]

<!-- markdownlint-enable MD011 -->
```

### Whole File

```markdown
<!-- trunk-ignore-all(markdownlint/MD011) -->

# (name)[link]

<!-- markdownlint-disable MD011 -->

# (name)[link]
```

### Notes

By default, prettier will add empty lines between markdown content and comments.
For this reason, we recommend using next-line ignores with [prettier ignores](https://prettier.io/docs/ignore/#range-ignore) or using ignore bocks.

Specific rules and multi-file ignores can be specified in a
[markdownlint config file](https://github.com/DavidAnson/markdownlint#optionsconfig).

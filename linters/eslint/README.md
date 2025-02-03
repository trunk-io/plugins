# eslint

## Configuration Notice

`eslint@9.x` requires a flat config format (see their
[migration guide](https://eslint.org/docs/latest/use/migrate-to-9.0.0#flat-config)) in order to run.
Trunk will automatically detect which config file you have and by default will only enable a
compatible version.

## Ignores

Here is a conversion guide for
[ESLint-style ignores](https://eslint.org/docs/latest/use/configure/rules#disabling-rules) and
[trunk-ignores](https://docs.trunk.io/code-quality/linters/ignoring-issues-and-files):

### Same Line

```typescript
alert("foo"); // trunk-ignore(eslint)

alert("foo"); // eslint-disable-line
```

### Next Line

```typescript
// trunk-ignore(eslint)
alert("foo");

/* eslint-disable-next-line */
alert("foo");
```

### With Comments

```typescript
// trunk-ignore(eslint): Expected alert
alert("foo");

/* eslint-disable-next-line -- Expected alert */
alert("foo");
```

### Specific Issue

```typescript
// trunk-ignore(eslint/no-alert)
alert("foo");

/* eslint-disable-next-line no-alert */
alert("foo");
```

### Multiple Issues

```typescript
// trunk-ignore(eslint/no-alert,eslint/quotes)
alert("foo");

/* eslint-disable-next-line no-alert, quotes */
alert("foo");
```

### Blocks

```typescript
// trunk-ignore-begin(eslint/no-alert)
alert("foo");
// trunk-ignore-end(eslint/no-alert)

/* eslint-disable no-alert */
alert("foo");
/* eslint-enable no-alert */
```

### Whole File

```typescript
// trunk-ignore-all(eslint/no-alert)
alert("foo");

/* eslint-disable no-alert */
alert("foo");
```

### Notes

Only `eslint-disable-line` and `eslint-disable-next-line` support `//` comments. All other
ESLint-style ignores must use `/* */` comments. The full set of rules and their applicable files can
be configured in an
[eslint config file](https://eslint.org/docs/latest/use/configure/rules#using-configuration-files).

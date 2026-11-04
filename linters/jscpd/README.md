# jscpd

[jscpd](https://github.com/kucherenko/jscpd) is a copy/paste detector for 220+ programming languages
and file formats (Rust binary, no runtime needed).

jscpd compares every file against every other file, so trunk runs it once per check from the
workspace root (`target: .`) rather than once per file, in the same way as `ls-lint`. Because the
whole repository is scanned on each run, `hold_the_line` is disabled for this linter.

Configuration is read from `.jscpd.json` (or `.config/jscpd.json`, or the `jscpd` key in
`package.json`). Useful keys:

- `minTokens` / `minLines` – minimum size of a reported clone (defaults 50 / 5)
- `ignore` – glob patterns to skip (`.gitignore` is respected by default)
- `threshold` – maximum duplication percentage; when exceeded jscpd exits 1

Clones are reported from the SARIF reporter as `jscpd/duplicate-code` (and `jscpd/renamed-code`,
`jscpd/similar-code`, `jscpd/semantic-code` when those detection modes are enabled).

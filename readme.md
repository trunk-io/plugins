<!-- trunk-ignore(markdownlint/MD041) -->
<p align="center">
  <a href="https://docs.trunk.io">
    <img height="260" src="https://static.trunk.io/assets/trunk_plugins_logo.png" />
  </a>
</p>
<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=Trunk.io">
    <img src="https://img.shields.io/visual-studio-marketplace/i/Trunk.io?logo=visualstudiocode"/>
  </a>
  <a href="https://slack.trunk.io">
    <img src="https://img.shields.io/badge/slack-slack.trunk.io-blue?logo=slack"/>
  </a>
  <a href="https://docs.trunk.io">
    <img src="https://img.shields.io/badge/docs.trunk.io-7f7fcc?label=docs&logo=readthedocs&labelColor=555555&logoColor=ffffff"/>
  </a>
    <a href="https://trunk.io">
    <img src="https://img.shields.io/badge/trunk.io-enabled-brightgreen?logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0ZGRiIgc3Ryb2tlLXdpZHRoPSIxMSIgdmlld0JveD0iMCAwIDEwMSAxMDEiPjxwYXRoIGQ9Ik01MC41IDk1LjVhNDUgNDUgMCAxIDAtNDUtNDVtNDUtMzBhMzAgMzAgMCAwIDAtMzAgMzBtNDUgMGExNSAxNSAwIDAgMC0zMCAwIi8+PC9zdmc+"/>
  </a>
</p>

### Welcome

This repository is the official, managed repository for integration actions and linters into trunk. It is imported by default in all trunk configurations.

By consolidating and sharing integrations for linters/actions into a single repository we hope to make the discovery, management and integration of new tools as straight-forward as possible.

### Enabling a supported linter

| technology | linters                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------- |
| All        | [cspell](https://github.com/streetsidesoftware/cspell), [codespell](https://github.com/codespell-project/codespell) |
| C++        | [pragma-once](linters/pragma-once/readme.md)                                                                        |
| PNG        | [oxipng](https://github.com/shssoichiro/oxipng)                                                                     |
| SQL        | [sqlfluff](https://github.com/sqlfluff/sqlfluff), [sqlfmt](https://github.com/tconbeer/sqlfmt)                      |
| Security   | [nancy](https://github.com/sonatype-nexus-community/nancy), [trivy](https://github.com/aquasecurity/trivy)          |

```bash
trunk check enable {linter}
```

### Enabling a supported action

| action                                                               | description                                                |
| -------------------------------------------------------------------- | ---------------------------------------------------------- |
| [`buf-gen`](actions/buf/readme.md)                                   | run `buf` on .proto file change                            |
| [`commitlint`](https://github.com/conventional-changelog/commitlint) | enforce conventional commit message for your local commits |
| [`go-mod-tidy`](actions/go-mod-tidy/readme.md)                       | automatically tidy go.mod file                             |
| [`go-mod-tidy-vendor`](actions/go-mod-tidy-vendor/readme.md)         | automatically tidy and vendor go.mod file                  |

```bash
trunk actions enable {action}
```

Read more about how to use plugins [here](https://docs.trunk.io/docs/plugins).

### Mission

Our goal is to make engineering faster, more efficient and dare we say - more fun. This repository will hopefully allow our community to share ideas on the best tools and best practices/workflows to make everyone's job of building code a little bit easier, a little bit faster and maybe in the process - a little bit more fun.

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
</p>

### Welcome

This repository is the official, managed repository for integration actions and linters into trunk. It is imported by default in all trunk configurations (since v0.17.0-beta).

By consolidating and sharing integrations for linters/actions into a single repository we hope to make the discovery, management and integration of new tools as straight-forward as possible.

### Enabling a supported linter

| language | linters  |
| -------- | -------- |
| All      | `cspell` |

```bash
trunk check enable {linter}
```

### Enabling a supported action

| action     | description                                                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| commitlint | [`commitlint`](https://github.com/conventional-changelog/commitlint) checks if your commit messages meet the conventional commit format. |

```bash
trunk actions enable {action}
```

Read more about how to use plugins [here](https://docs.trunk.io/docs/plugins).

### Mission

Our goal is to make engineering faster, more efficient and dare we say - more fun. This repository will hopefully allow our community to share ideas on the best tools and best practices/workflows to make everyones job of building code a little bit easier, a little bit faster and maybe in the process - a litte bit more fun.

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
  </a>
    <a href="https://api.securityscorecards.dev/projects/github.com/trunk-io/plugins">
    <img src="https://api.securityscorecards.dev/projects/github.com/trunk-io/plugins/badge"/>
  </a>
</p>

### Welcome

This repository is the official, managed repository for integration actions and linters into trunk.
It is imported by default in all trunk configurations.

By consolidating and sharing integrations for linters/actions into a single repository we hope to
make the discovery, management and integration of new tools as straight-forward as possible.

### Enabling a supported linter

| Technology      | Linters                                                                                       |
| --------------- | --------------------------------------------------------------------------------------------- |
| All             | [codespell], [cspell], [gitleaks], [git-diff-check]                                           |
| Ansible         | [ansible-lint]                                                                                |
| Bash            | [shellcheck], [shfmt]                                                                         |
| Bazel, Starlark | [buildifier]                                                                                  |
| C, C++          | [clang-format], [clang-tidy], [include-what-you-use], [pragma-once]                           |
| CircleCI Config | [circleci]                                                                                    |
| Cloudformation  | [cfnlint]                                                                                     |
| CSS, SCSS       | [stylelint]                                                                                   |
| Cue             | [cue-fmt]                                                                                     |
| Docker          | [hadolint]                                                                                    |
| Dotenv          | [dotenv-linter]                                                                               |
| GitHub          | [actionlint]                                                                                  |
| Go              | [gofmt], [golangci-lint], [semgrep], [goimports]                                              |
| HAML            | [haml-lint]                                                                                   |
| Java            | [google-java-format], [semgrep]                                                               |
| Javascript      | [eslint], [prettier], [rome], [semgrep]                                                       |
| JSON            | [eslint], [prettier], [semgrep]                                                               |
| Kotlin          | [detekt]<sup><a href="#note-detekt">1</a></sup>, [ktlint]                                     |
| Kubernetes      | [kube-linter]                                                                                 |
| Markdown        | [markdownlint], [remark-lint]                                                                 |
| Nix             | [nixpkgs-fmt]                                                                                 |
| package.json    | [sort-package-json]                                                                           |
| PNG             | [oxipng]                                                                                      |
| Protobuf        | [buf] (breaking, lint, and format), [clang-format], [clang-tidy]                              |
| Python          | [autopep8], [bandit], [black], [flake8], [isort], [mypy], [pylint], [semgrep], [yapf], [ruff] |
| Renovate        | [renovate]                                                                                    |
| Ruby            | [brakeman], [rubocop], [rufo], [semgrep], [standardrb]                                        |
| Rust            | [clippy], [rustfmt]                                                                           |
| Scala           | [scalafmt]                                                                                    |
| Security        | [nancy], [trivy]                                                                              |
| SQL             | [sqlfluff], [sqlfmt], [sql-formatter]                                                         |
| SVG             | [svgo]                                                                                        |
| Swift           | [stringslint], [swiftlint], [swiftformat]                                                     |
| Terraform       | [terraform] (validate and fmt), [tflint]<sup><a href="#note-tflint">2</a></sup>               |
| TOML            | [taplo]                                                                                       |
| Typescript      | [eslint], [prettier], [rome], [semgrep]                                                       |
| YAML            | [prettier], [semgrep], [yamllint]                                                             |

[actionlint]: https://github.com/rhysd/actionlint#readme
[ansible-lint]: https://github.com/ansible/ansible-lint#readme
[autopep8]: https://github.com/hhatto/autopep8#readme
[bandit]: https://github.com/PyCQA/bandit#readme
[black]: https://github.com/psf/black#readme
[brakeman]: https://github.com/presidentbeef/brakeman#readme
[buf]: https://github.com/bufbuild/buf#readme
[buildifier]: https://github.com/bazelbuild/buildtools/blob/master/buildifier/README.md
[circleci]: https://github.com/CircleCI-Public/circleci-cli#readme
[cfnlint]: https://github.com/aws-cloudformation/cfn-lint#readme
[clang-format]: https://clang.llvm.org/docs/ClangFormat.html
[clang-tidy]: https://clang.llvm.org/extra/clang-tidy/
[clippy]: https://github.com/rust-lang/rust-clippy#readme
[codespell]: https://github.com/codespell-project/codespell#readme
[cspell]: https://github.com/streetsidesoftware/cspell#readme
[cue-fmt]: https://cuelang.org/
[detekt]: https://github.com/detekt/detekt#readme
[dotenv-linter]: https://github.com/dotenv-linter/dotenv-linter#readme
[eslint]: https://github.com/eslint/eslint#readme
[flake8]: https://github.com/PyCQA/flake8#readme
[gitleaks]: https://github.com/zricethezav/gitleaks#readme
[git-diff-check]: https://git-scm.com/docs/git-diff
[gofmt]: https://pkg.go.dev/cmd/gofmt
[goimports]: https://pkg.go.dev/golang.org/x/tools/cmd/goimports
[golangci-lint]: https://github.com/golangci/golangci-lint#readme
[google-java-format]: https://github.com/google/google-java-format#readme
[hadolint]: https://github.com/hadolint/hadolint#readme
[haml-lint]: https://github.com/sds/haml-lint#readme
[isort]: https://github.com/PyCQA/isort#readme
[include-what-you-use]: https://github.com/include-what-you-use/include-what-you-use#readme
[ktlint]: https://github.com/pinterest/ktlint#readme
[kube-linter]: https://github.com/stackrox/kube-linter#readme
[markdownlint]: https://github.com/DavidAnson/markdownlint#readme
[mypy]: https://github.com/python/mypy#readme
[nancy]: https://github.com/sonatype-nexus-community/nancy#readme
[nixpkgs-fmt]: https://github.com/nix-community/nixpkgs-fmt
[oxipng]: https://github.com/shssoichiro/oxipng#readme
[pragma-once]: linters/pragma-once/readme.md
[prettier]: https://github.com/prettier/prettier#readme
[pylint]: https://github.com/PyCQA/pylint#readme
[remark-lint]: https://github.com/remarkjs/remark-lint#readme
[renovate]: https://github.com/renovatebot/renovate#readme
[rome]: https://github.com/rome/tools#readme
[rubocop]: https://github.com/rubocop/rubocop#readme
[rufo]: https://github.com/ruby-formatter/rufo#readme
[ruff]: https://github.com/charliermarsh/ruff
[rustfmt]: https://github.com/rust-lang/rustfmt#readme
[scalafmt]: https://github.com/scalameta/scalafmt#readme
[semgrep]: https://github.com/returntocorp/semgrep#readme
[shellcheck]: https://github.com/koalaman/shellcheck#readme
[shfmt]: https://github.com/mvdan/sh#readme
[sort-package-json]: https://github.com/keithamus/sort-package-json#readme
[sql-formatter]: https://github.com/sql-formatter-org/sql-formatter#readme
[sqlfluff]: https://github.com/sqlfluff/sqlfluff#readme
[sqlfmt]: https://github.com/tconbeer/sqlfmt#readme
[standardrb]: https://github.com/testdouble/standard#readme
[stringslint]: https://github.com/dral3x/StringsLint#readme
[stylelint]: https://github.com/stylelint/stylelint#readme
[svgo]: https://github.com/svg/svgo#readme
[swiftlint]: https://github.com/realm/SwiftLint#readme
[swiftformat]: https://github.com/nicklockwood/SwiftFormat#readme
[taplo]: https://github.com/tamasfe/taplo#readme
[terraform]: https://developer.hashicorp.com/terraform/cli/code
[tflint]: https://github.com/terraform-linters/tflint#readme
[trivy]: https://github.com/aquasecurity/trivy#readme
[yamllint]: https://github.com/adrienverge/yamllint#readme
[yapf]: https://github.com/google/yapf#readme

<sup><ol>

<li><a aria-hidden="true" tabindex="-1" class="customAnchor" id="note-detekt"></a>
Support for Detekt is under active development; see our <a href="https://docs.trunk.io/docs/check-supported-linters#detekt">docs</a> for more
details.
</li>

<li><a aria-hidden="true" tabindex="-1" class="customAnchor" id="note-tflint"></a>
<a href="https://github.com/terraform-linters/tflint/blob/master/docs/user-guide/module-inspection.md">Module inspection</a>, <a href="https://github.com/terraform-linters/tflint-ruleset-aws/blob/master/docs/deep_checking.md">deep checking</a>, and setting variables are not currently supported.
</li>

</ol></sup>

<br/>

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
| [`git-blame-ignore-revs`](actions/git-blame-ignore-revs/readme.md)   | automatically configure git to use .git-blame-ignore-revs  |

```bash
trunk actions enable {action}
```

Read more about how to use plugins [here](https://docs.trunk.io/docs/plugins).

### Mission

Our goal is to make engineering faster, more efficient and dare we say - more fun. This repository
will hopefully allow our community to share ideas on the best tools and best practices/workflows to
make everyone's job of building code a little bit easier, a little bit faster and maybe in the
process - a little bit more fun.

### Additional Reference

Some linters provide built-in formatters or autofix options that don't always produce ideal outputs,
especially in conjunction with other formatters. Trunk supports defining autofix options for these
linters, but has their formatting turned off by default. An example of this is
[sqlfluff](./linters/sqlfluff/plugin.yaml):

```yaml
- name: sqlfluff
  files: [sql, sql-j2, dml, ddl]
  runtime: python
  package: sqlfluff
  direct_configs:
    - .sqlfluff
  commands:
    - name: lint
      run: sqlfluff lint ${target} --format json --dialect ansi --nofail
      output: sarif
      success_codes: [0]
      read_output_from: stdout
      parser:
        runtime: python
        run: ${plugin}/linters/sqlfluff/sqlfluff_to_sarif.py
    - name: fix
      run: sqlfluff fix ${target} --dialect ansi --disable-progress-bar --force
      output: rewrite
      formatter: true
      in_place: true
      success_codes: [0]
      enabled: false
```

The `fix` subcommand has `enabled: false`, so when you run `trunk check enable sqlfluff`, only the
`lint` subcommand is enabled. To override this behavior, specify in your `trunk.yaml`:

```yaml
lint:
  enabled:
    - sqlfluff@<version>:
        commands: [lint, fix]
```

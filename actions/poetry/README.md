# Poetry

## Recommended Usage

The recommended way to run [Poetry](https://python-poetry.org/docs/) using Trunk is to use the
SYSTEM environment, rather than a hermetic setup. This is because Poetry provides its own
environment management that will often collide with Trunk's hermetic setup. Nevertheless, leveraging
Poetry and Trunk in parallel can be powerful.

Trunk provides 4 different Actions for running Poetry validation, matching parity with
[Poetry pre-commit hooks](https://python-poetry.org/docs/pre-commit-hooks/).

| action           | description                                                                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `poetry-check`   | Validate `pyproject.toml` when running `git commit`                                                                                                   |
| `poetry-lock`    | Update `poetry.lock` to match `pyproject.toml` when running `git commit`. To avoid updating packages, you can override `run` to include `--no-update` |
| `poetry-export`  | Update `requirements.txt` to match `pyproject.toml` when running `git commit`                                                                         |
| `poetry-install` | Install dependencies to make sure all locked packages are installed when running `git checkout` or `git merge`                                        |

You can enable any subset of these Actions using `trunk actions enable`.

As written, all of these actions require that you have `poetry` in your `PATH` in order to run.

## Hermetic Installation

Trunk provides some mechanisms for a hermetic installation and execution of `poetry`. You can use
the Poetry [Tool](https://docs.trunk.io/check/advanced-setup/tools) to run `poetry` manually, and
you can override each of the action definitions to include the `packages_file` and `runtime`, like
so:

```yaml
version: 0.1
actions:
  definitions:
    - id: poetry-check
      runtime: python
      packages_file: ${cwd}/requirements.txt
```

These overrides will tell Trunk to use the hermetic install of `poetry` and use a sandboxed
execution for the Action. Note that this approach has some limitations, namely when creating
`poetry` shells or virtual environments. Currently full functionality is blocked by the inability to
unset runtime-inherited environments. Note that the `poetry` Tool suffers from the same problem.

When using the hermetic installation, you will want to ensure that your `python` runtime is enabled
at the same version required by your Poetry configuration. See our
[docs](https://docs.trunk.io/check/advanced-setup/runtimes) for more information about specifying
runtime versions.

## Notes

Poetry requires Python 3.8 or higher to run.

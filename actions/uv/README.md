# uv

## Recommended Usage

The recommended way to run [uv](https://docs.astral.sh/uv/) using Trunk is to use the SYSTEM
environment, rather than a hermetic setup. This is because uv provides its own environment
management that will often collide with Trunk's hermetic setup. Nevertheless, leveraging uv and
Trunk in parallel can be powerful.

Trunk provides several different Actions for running your uv validation and dependency management.

| action     | description                                                                    |
| ---------- | ------------------------------------------------------------------------------ |
| `uv-check` | Validate `pyproject.toml` when running `git commit`                            |
| `uv-lock`  | Create or update `uv.lock` when running `git commit`                           |
| `uv-sync`  | Install dependencies from `uv.lock` when running `git checkout` or `git merge` |

You can enable any subset of these Actions using `trunk actions enable`.

As written, all of these actions require that you have `uv` in your `PATH` in order to run.

## Hermetic Installation

Trunk provides some mechanisms for a hermetic installation and execution of `uv`. You can use the uv
[Tool](https://docs.trunk.io/check/advanced-setup/tools) to run `uv` manually, and you can override
each of the action definitions to include the `packages_file` and `runtime`, like so:

```yaml
version: 0.1
actions:
  definitions:
    - id: uv-check
      runtime: python
      packages_file: ${cwd}/requirements.txt
```

These overrides will tell Trunk to use the hermetic install of `uv` and use a sandboxed execution
for the Action. Note that this approach has some limitations, namely when creating uv virtual
environments. Currently full functionality is blocked by the inability to unset runtime-inherited
environments. Note that the `uv` Tool suffers from the same problem.

When using the hermetic installation, you will want to ensure that your `python` runtime is enabled
at the same version required by your uv configuration. See our
[docs](https://docs.trunk.io/check/advanced-setup/runtimes) for more information about specifying
runtime versions.

## Notes

uv requires Python 3.8 or higher to run.

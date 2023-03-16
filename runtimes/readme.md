# Runtimes

Runtime definitions are provided in this directory. Currently, runtimes don't have any testing in
this repository, but their configuration is exercised with linter tests.

## Upgrades

Runtime upgrades are handled through the `known_good_version` field. When a user upgrades to a new
release of this plugins repository, trunk will recommend that they upgrade their runtimes to the
versions identified by `known_good_version` values at that release.

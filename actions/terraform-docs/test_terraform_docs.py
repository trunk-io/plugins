#!/usr/bin/env python3
"""
Unit tests for terraform-docs.py.

These tests cover the directory-discovery and README-status parsing logic that
underpins the monorepo-aware behaviour of the action. They do not require
terraform-docs or git to be installed.

Run with: python3 -m unittest actions/terraform-docs/test_terraform_docs.py
"""

import importlib.util
import os
import pathlib
import tempfile
import unittest

HERE = pathlib.Path(__file__).resolve().parent
SCRIPT = HERE / "terraform-docs.py"


def _load_script_module():
    spec = importlib.util.spec_from_file_location("terraform_docs_action", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


terraform_docs = _load_script_module()


class TerraformDirsFromPathsTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = self.tmp.name

    def _touch(self, *parts):
        path = os.path.join(self.root, *parts)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        pathlib.Path(path).touch()

    def test_groups_files_by_directory(self):
        for rel in ("modules/a/main.tf", "modules/a/vars.tf", "modules/b/main.tf"):
            self._touch(*rel.split("/"))

        dirs = terraform_docs.terraform_dirs_from_paths(
            [
                "modules/a/main.tf",
                "modules/a/vars.tf",
                "modules/b/main.tf",
            ],
            repo_root=self.root,
        )

        self.assertEqual(dirs, {"modules/a", "modules/b"})

    def test_root_level_files_use_dot(self):
        self._touch("main.tf")

        dirs = terraform_docs.terraform_dirs_from_paths(
            ["main.tf"], repo_root=self.root
        )

        self.assertEqual(dirs, {"."})

    def test_picks_up_all_terraform_extensions(self):
        for rel in ("a/x.tf", "b/y.tofu", "c/z.tfvars"):
            self._touch(*rel.split("/"))

        dirs = terraform_docs.terraform_dirs_from_paths(
            ["a/x.tf", "b/y.tofu", "c/z.tfvars"], repo_root=self.root
        )

        self.assertEqual(dirs, {"a", "b", "c"})

    def test_ignores_non_terraform_files(self):
        self._touch("modules/a/main.tf")
        # README.md and other files should never trigger a re-run.
        dirs = terraform_docs.terraform_dirs_from_paths(
            ["modules/a/README.md", "src/main.go", "modules/a/main.tf"],
            repo_root=self.root,
        )

        self.assertEqual(dirs, {"modules/a"})

    def test_skips_deleted_directories(self):
        # `modules/gone/main.tf` was deleted along with its directory; the
        # function should silently drop it instead of crashing later when we
        # try to chdir/run there.
        self._touch("modules/here/main.tf")

        dirs = terraform_docs.terraform_dirs_from_paths(
            ["modules/here/main.tf", "modules/gone/main.tf"],
            repo_root=self.root,
        )

        self.assertEqual(dirs, {"modules/here"})

    def test_handles_empty_input(self):
        self.assertEqual(
            terraform_docs.terraform_dirs_from_paths([], repo_root=self.root),
            set(),
        )

    def test_strips_whitespace_and_blank_lines(self):
        self._touch("modules/a/main.tf")
        dirs = terraform_docs.terraform_dirs_from_paths(
            ["", "  ", "modules/a/main.tf\n"], repo_root=self.root
        )
        self.assertEqual(dirs, {"modules/a"})


class BuildTerraformDocsCmdTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = self.tmp.name

    def test_uses_config_when_present(self):
        config = os.path.join(self.root, ".terraform-docs.yaml")
        pathlib.Path(config).write_text("formatter: markdown table\n")

        cmd = terraform_docs.build_terraform_docs_cmd(self.root)

        self.assertEqual(cmd, ["terraform-docs", "--config", config, "."])

    def test_falls_back_to_markdown_table_subcommand(self):
        cmd = terraform_docs.build_terraform_docs_cmd(self.root)

        # `markdown-table` is a single positional subcommand recognised by
        # terraform-docs; the previous form (`markdown table`) split it across
        # two args, which only worked by accident.
        self.assertEqual(cmd, ["terraform-docs", "markdown-table", "."])


class FindUnstagedReadmesTest(unittest.TestCase):
    def test_detects_modified_but_unstaged_readme(self):
        porcelain = " M modules/a/README.md\n"
        self.assertEqual(
            terraform_docs.find_unstaged_readmes(porcelain),
            ["modules/a/README.md"],
        )

    def test_detects_partially_staged_readme(self):
        # `MM` means staged + further unstaged changes; the unstaged half still
        # needs to be added before the commit can land.
        porcelain = "MM modules/a/README.md\n"
        self.assertEqual(
            terraform_docs.find_unstaged_readmes(porcelain),
            ["modules/a/README.md"],
        )

    def test_detects_newly_generated_untracked_readme(self):
        # A previously-undocumented module gets its first README.md on this
        # run; `??` means untracked. The original code missed this case.
        porcelain = "?? modules/new/README.md\n"
        self.assertEqual(
            terraform_docs.find_unstaged_readmes(porcelain),
            ["modules/new/README.md"],
        )

    def test_ignores_fully_staged_readme(self):
        porcelain = "M  modules/a/README.md\n"
        self.assertEqual(terraform_docs.find_unstaged_readmes(porcelain), [])

    def test_ignores_other_files(self):
        porcelain = " M modules/a/main.tf\n M src/app.go\n"
        self.assertEqual(terraform_docs.find_unstaged_readmes(porcelain), [])

    def test_handles_multiple_entries(self):
        porcelain = (
            " M modules/a/README.md\n"
            "M  modules/b/README.md\n"
            "?? modules/c/README.md\n"
            " M modules/d/main.tf\n"
        )
        self.assertEqual(
            sorted(terraform_docs.find_unstaged_readmes(porcelain)),
            ["modules/a/README.md", "modules/c/README.md"],
        )


if __name__ == "__main__":
    unittest.main()

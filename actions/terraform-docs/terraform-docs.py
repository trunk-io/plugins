#!/usr/bin/env python3
"""
Trunk.io plugin for terraform-docs integration.

This script acts as a pre-commit hook to ensure terraform documentation is up to date.
It performs the following:
1. Finds directories where Terraform files have changed
2. Runs terraform-docs in each directory containing changed Terraform files
3. Checks if any README.md files show up in the unstaged changes
4. Exits with failure if there are unstaged README changes, success otherwise
"""

import os
import subprocess  # trunk-ignore(bandit/B404)
import sys

TERRAFORM_EXTENSIONS = (".tf", ".tofu", ".tfvars")
CONFIG_FILENAME = ".terraform-docs.yaml"


def run_command(cmd, cwd=None):
    """
    Execute a shell command and return its exit code, stdout, and stderr.

    Args:
        cmd: List of command arguments to execute
        cwd: Optional working directory in which to run the command

    Returns:
        Tuple containing (return_code, stdout, stderr)
    """
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
            cwd=cwd,
            # trunk-ignore(bandit/B603)
            shell=False,  # Explicitly disable shell to prevent command injection
        )
        stdout, stderr = process.communicate()
        return process.returncode, stdout, stderr
    except FileNotFoundError:
        print(
            f"terraform-docs error: {cmd[0]} not found. Please ensure it's installed and in your PATH"
        )
        sys.exit(1)
    except Exception as e:
        print(f"terraform-docs error: Executing command {' '.join(cmd)}: {e}")
        sys.exit(1)


def terraform_dirs_from_paths(paths, repo_root="."):
    """
    Given an iterable of repo-relative file paths, return the set of directories
    that contain Terraform files and still exist on disk.

    Deleted files are skipped because their parent directory may no longer exist
    (or the module may have been removed entirely), and there's nothing for
    terraform-docs to document there.
    """
    dirs = set()
    for file_path in paths:
        file_path = file_path.strip()
        if not file_path or not file_path.endswith(TERRAFORM_EXTENSIONS):
            continue
        dir_path = os.path.dirname(file_path) or "."
        abs_dir = dir_path if os.path.isabs(dir_path) else os.path.join(repo_root, dir_path)
        if os.path.isdir(abs_dir):
            dirs.add(dir_path)
    return dirs


def get_changed_terraform_directories():
    """
    Return the set of directories containing Terraform files that are part of
    this commit (staged) or have been modified in the working tree.

    The hook runs pre-commit, so staged changes are the primary source of truth;
    we also include unstaged edits so that a developer iterating in the working
    tree sees their docs regenerated.
    """
    paths = set()
    for diff_args in (["--cached", "--name-only"], ["--name-only"]):
        cmd = ["git", "diff", *diff_args]
        return_code, stdout, _stderr = run_command(cmd)
        if return_code != 0:
            continue
        paths.update(stdout.splitlines())
    return terraform_dirs_from_paths(paths)


def build_terraform_docs_cmd(repo_root):
    """Pick the terraform-docs invocation based on whether a config file exists."""
    config_file_path = os.path.join(repo_root, CONFIG_FILENAME)
    if os.path.exists(config_file_path):
        return ["terraform-docs", "--config", config_file_path, "."]
    return ["terraform-docs", "markdown-table", "."]


def find_unstaged_readmes(porcelain_output):
    """
    Parse `git status --porcelain` output and return README.md paths that are
    either modified-but-unstaged or untracked. Both states block the commit
    because the developer needs to `git add` the regenerated docs.
    """
    unstaged = []
    for line in porcelain_output.splitlines():
        if len(line) < 3:
            continue
        status = line[:2]
        path = line[3:].strip()
        # `_M` = unstaged modification (any X), `??` = untracked.
        if (status[1] == "M" or status == "??") and path.endswith("README.md"):
            unstaged.append(path)
    return unstaged


def main():
    repo_root = os.getcwd()
    terraform_dirs = get_changed_terraform_directories()

    if not terraform_dirs:
        print("terraform-docs: No Terraform files changed, skipping documentation update")
        return 0

    update_cmd = build_terraform_docs_cmd(repo_root)

    for directory in sorted(terraform_dirs):
        print(f"terraform-docs: Updating documentation in {directory}")
        target = directory if directory != "." else repo_root
        _return_code, _stdout, stderr = run_command(update_cmd, cwd=target)
        if stderr:
            print(f"terraform-docs warning in {directory}: {stderr}", file=sys.stderr)

    _return_code, stdout, _stderr = run_command(["git", "status", "--porcelain"])
    unstaged_readmes = find_unstaged_readmes(stdout)
    if unstaged_readmes:
        print("terraform-docs error: Please stage any README changes before committing.")
        return 1

    print("terraform-docs: Documentation is up to date")
    return 0


if __name__ == "__main__":
    sys.exit(main())

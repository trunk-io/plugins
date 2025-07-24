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

# trunk-ignore(bandit/B404)
import os
import subprocess
import sys


def get_changed_terraform_directories():
    """
    Get directories containing changed Terraform files.

    Returns:
        set: Set of directory paths containing changed Terraform files
    """
    # Get list of changed files from git
    status_cmd = ["git", "diff", "--name-only", "HEAD"]
    return_code, stdout, stderr = run_command(status_cmd)

    if return_code != 0:
        # If git diff fails, fall back to checking staged files
        status_cmd = ["git", "diff", "--cached", "--name-only"]
        return_code, stdout, stderr = run_command(status_cmd)

    changed_files = stdout.strip().split("\n") if stdout.strip() else []

    # Filter for Terraform files and get their directories
    terraform_extensions = (".tf", ".tofu", ".tfvars")
    terraform_dirs = set()

    for file_path in changed_files:
        if file_path.endswith(terraform_extensions):
            dir_path = os.path.dirname(file_path)
            # Use current directory if file is in root
            terraform_dirs.add(dir_path if dir_path else ".")

    return terraform_dirs


def run_command(cmd):
    """
    Execute a shell command and return its exit code, stdout, and stderr.

    Args:
        cmd: List of command arguments to execute

    Returns:
        Tuple containing (return_code, stdout, stderr)
    """
    try:

        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
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


# Get directories with changed Terraform files
terraform_dirs = get_changed_terraform_directories()

if not terraform_dirs:
    print("terraform-docs: No Terraform files changed, skipping documentation update")
    sys.exit(0)

# Run terraform-docs in each directory with changed Terraform files
for directory in sorted(terraform_dirs):
    print(f"terraform-docs: Updating documentation in {directory}")

    # Change to the target directory
    original_cwd = os.getcwd()
    try:
        if directory != ".":
            os.chdir(directory)

        # Check if there's a config file in the repository root
        config_file_path = os.path.join(original_cwd, ".terraform-docs.yaml")

        # Run terraform-docs with config file if it exists
        if os.path.exists(config_file_path):
            update_cmd = ["terraform-docs", "--config", config_file_path, "."]
        else:
            # Fallback to markdown format if no config file
            update_cmd = ["terraform-docs", "markdown", "table", "."]

        return_code, stdout, stderr = run_command(update_cmd)

        if stderr:
            print(f"terraform-docs warning in {directory}: {stderr}", file=sys.stderr)

    finally:
        # Always return to original directory
        os.chdir(original_cwd)

# Check git status for unstaged README changes
status_cmd = ["git", "status", "--porcelain"]
return_code, stdout, stderr = run_command(status_cmd)

# Look for any README.md files in the unstaged changes
unstaged_readmes = [
    line.split()[-1]
    for line in stdout.splitlines()
    if line.startswith(" M") and line.endswith("README.md")
]

# Check if we found any unstaged README files
if len(unstaged_readmes) > 0:
    print("terraform-docs error: Please stage any README changes before committing.")
    sys.exit(1)

print("terraform-docs: Documentation is up to date")
sys.exit(0)

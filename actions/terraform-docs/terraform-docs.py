#!/usr/bin/env python3
"""
Trunk.io plugin for terraform-docs integration.

This script acts as a pre-commit hook to ensure terraform documentation is up to date.
It performs the following:
1. Runs terraform-docs to update documentation
2. Checks if any README.md files show up in the unstaged changes
3. Exits with failure if there are unstaged README changes, success otherwise
"""

# trunk-ignore(bandit/B404)
import subprocess
import sys


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


# First, run terraform-docs to update documentation
update_cmd = ["terraform-docs", "."]
return_code, stdout, stderr = run_command(update_cmd)

if stderr:
    print(f"terraform-docs error: Warning during execution:\n{stderr}", file=sys.stderr)

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

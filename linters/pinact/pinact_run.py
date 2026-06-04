#!/usr/bin/env python3
import os
import shutil
import subprocess
import sys
from pathlib import Path


def resolve_executable(name: str) -> str | None:
    return shutil.which(name)


def require_executable(name: str) -> str:
    path = resolve_executable(name)
    if path is None:
        print(f"{name} not found in PATH", file=sys.stderr)
        raise SystemExit(127)
    return path


def validate_targets(paths: list[str]) -> list[str]:
    validated: list[str] = []
    for path in paths:
        target = Path(path)
        if not target.exists():
            print(f"target not found: {path}", file=sys.stderr)
            raise SystemExit(2)
        validated.append(str(target.resolve()))
    return validated


def gh_auth_token() -> str | None:
    gh = resolve_executable("gh")
    if gh is None:
        return None

    try:
        result = subprocess.run(
            [gh, "auth", "token"],
            shell=False,
            check=False,
            capture_output=True,
            text=True,
        )
    except OSError:
        return None

    if result.returncode != 0:
        return None

    token = result.stdout.strip()
    return token or None


def configure_token_env() -> None:
    github_token = os.environ.get("GITHUB_TOKEN")
    pinact_github_token = os.environ.get("PINACT_GITHUB_TOKEN")
    gh_token = os.environ.get("GH_TOKEN")

    if not github_token and gh_token:
        os.environ["GITHUB_TOKEN"] = gh_token
        github_token = gh_token

    if not pinact_github_token and github_token:
        os.environ["PINACT_GITHUB_TOKEN"] = github_token

    if not os.environ.get("GITHUB_TOKEN") and not os.environ.get("PINACT_GITHUB_TOKEN"):
        if not os.environ.get("PINACT_DISABLE_GH_AUTH"):
            token = gh_auth_token()
            if token:
                os.environ["GITHUB_TOKEN"] = token
                os.environ["PINACT_GITHUB_TOKEN"] = token


def has_github_token() -> bool:
    return bool(os.environ.get("GITHUB_TOKEN") or os.environ.get("PINACT_GITHUB_TOKEN"))


def build_pinact_args(mode: str) -> list[str]:
    args = ["pinact", "run", "-format", "sarif"]
    if mode == "upgrade":
        # -update bumps to latest semver; SARIF suggestions only (Trunk applies fixes).
        args.extend(["-update"])
        return args

    # SARIF output implies -fix=false; let Trunk apply fixes from SARIF suggestions.
    if os.environ.get("PINACT_DISABLE_GH_AUTH"):
        args.append("-no-api")
    elif has_github_token():
        args.append("-verify-comment")
    else:
        args.append("-no-api")
    return args


def run_pinact(mode: str, targets: list[str]) -> int:
    pinact = require_executable("pinact")
    return subprocess.run(
        [pinact, *build_pinact_args(mode)[1:], *validate_targets(targets)],
        shell=False,
        check=False,
    ).returncode


def main() -> int:
    configure_token_env()

    argv = sys.argv[1:]
    mode = "lint"
    if argv and argv[0] == "--upgrade":
        mode = "upgrade"
        argv = argv[1:]

    return run_pinact(mode, argv)


if __name__ == "__main__":
    raise SystemExit(main())

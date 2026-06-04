#!/usr/bin/env python3
import os
import subprocess
import sys


def gh_auth_token() -> str | None:
    try:
        result = subprocess.run(
            ["gh", "auth", "token"],
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


def main() -> int:
    configure_token_env()

    argv = sys.argv[1:]
    mode = "lint"
    if argv and argv[0] == "--upgrade":
        mode = "upgrade"
        argv = argv[1:]

    return subprocess.call(build_pinact_args(mode) + argv)


if __name__ == "__main__":
    raise SystemExit(main())

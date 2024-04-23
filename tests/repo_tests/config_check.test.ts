import * as fs from "fs";
import path from "path";
import { setupLintDriver } from "tests";
import { osTimeoutMultiplier, REPO_ROOT } from "tests/utils";

// Avoid strictly typing composite config
// trunk-ignore-all(eslint/@typescript-eslint/no-unsafe-assignment)
// trunk-ignore-all(eslint/@typescript-eslint/no-unsafe-member-access)
// trunk-ignore-all(eslint/@typescript-eslint/no-unsafe-call)
// trunk-ignore-all(eslint/@typescript-eslint/no-unsafe-argument)
// trunk-ignore-all(eslint/@typescript-eslint/no-unsafe-return)

jest.setTimeout(300000 * osTimeoutMultiplier);

/**
 * This test runs 'trunk config print' from the root of the repository to verify a healthy config.
 * This serves as a general, basic healthcheck and asserts that all definitions resolve correctly,
 * even in the context of each other. If this test were to fail, users would experience config errors
 * when sourcing plugins from this repository.
 */
describe("Global config health check", () => {
  // Step 1: Define test setup and teardown
  const driver = setupLintDriver(REPO_ROOT, {
    setupGit: false,
    setupTrunk: true,
    // NOTE: This version should be kept compatible in lockstep with the `required_trunk_version` in plugin.yaml
    // IfChange
    trunkVersion: "1.21.1-beta.20",
    // ThenChange plugin.yaml
  });

  // Step 2a: Validate config
  it("trunk config print with required_trunk_version", async () => {
    // Remove user.yaml if it exists, since some definitions may not exist in composite config.
    // Specifying force avoid errors being thrown if it doesn't exist.
    fs.rmSync(path.resolve(driver.getSandbox(), ".trunk/user.yaml"), {
      force: true,
    });

    // Test that config healthily resolves
    try {
      const testRunResult = await driver.runTrunkCmd("config print");
      expect(testRunResult.stdout).toContain("version: 0.1");
      expect(testRunResult.stdout).toContain("local:");
    } catch (error) {
      console.log(
        "`trunk config print` failed. You likely have bad configuration or need to update trunkVersion in this test.",
      );
      throw error;
    }
  });

  // TODO(Tyler): Add snapshot about generated configs
  // Step 2b: Validate only verified linters are auto-enabled
  it("validate auto-enabled linters", async () => {
    const defaultFiles = [
      "basic.BUILD",
      "WORKSPACE",
      "basic.c",
      "basic.hh",
      "basic.cc",
      "basic.cs",
      "basic.yaml",
      "basic.css",
      "basic.cue",
      "basic.ddl",
      "basic.dml",
      "basic.Dockerfile",
      "basic.env",
      "basic.gemspec",
      ".github/workflows/basic.yaml",
      "basic.go",
      "basic.graphql",
      "basic.haml",
      "basic.html",
      "basic.java",
      "basic.js",
      "basic.json",
      "basic.ipynb",
      "basic.kt",
      "basic.tex",
      "Cargo.lock",
      "basic.lua",
      "basic.md",
      "basic.nix",
      "basic.m",
      "basic.php",
      "basic.png",
      ".prettierrc",
      "basic.proto",
      "basic.py",
      "basic.rb",
      "Cargo.toml",
      "basic.rs",
      "basic.sass",
      "basic.sc",
      "basic.sh",
      "basic.sql",
      "basic.sql.j2",
      "basic.bzl",
      "basic.storyboard",
      "basic.strings",
      "basic.svg",
      "basic.swift",
      "basic.tf",
      "basic.toml",
      "basic.ts",
      "basic.xib",
      "basic.zsh",
    ];
    defaultFiles.forEach((file) => driver.writeFile(file, "\n"));

    const defaultFilesContents = new Map([
      ["cloudformation.yaml", "AWSTemplateFormatVersion: true\n"],
    ]);
    defaultFilesContents.forEach((contents, file) => driver.writeFile(file, contents));

    await driver.runTrunkCmd("upgrade check --no-progress -y");

    const newYaml = await driver.getTrunkConfig();
    const autoEnabledLinters = newYaml.lint.enabled
      .map((enabledLinter: any) => enabledLinter.split("@")[0])
      .sort();

    /**
     * At present, in order to be auto-enabled without prior existence of a config, a linter must have:
     * suggest_if: files_present
     *
     * With suggest_if: legacy, in order to be auto-enabled without prior existence of a config, a linter must have:
     * 1. is_recommended: true (default true)
     * 2. good_without_config: true OR have a recommended direct_config to dump
     */

    /**
     * This is a curated list. A linter must undergo audits and dogfooding in order to be included in this list.
     * If this test is failing for a newly added linter, please set known_good_version to false or remove/rename the
     * config included in your linter subdirectory (it can be put in `test_data` and then moved during `preCheck`).
     */
    expect(autoEnabledLinters).toMatchInlineSnapshot(`
      [
        "actionlint",
        "bandit",
        "black",
        "buildifier",
        "cfnlint",
        "checkov",
        "clippy",
        "cue-fmt",
        "dotenv-linter",
        "git-diff-check",
        "gofmt",
        "golangci-lint",
        "hadolint",
        "haml-lint",
        "isort",
        "ktlint",
        "markdownlint",
        "nixpkgs-fmt",
        "osv-scanner",
        "oxipng",
        "prettier",
        "ruff",
        "rustfmt",
        "shellcheck",
        "shfmt",
        "svgo",
        "taplo",
        "tflint",
        "trivy",
        "trufflehog",
        "yamllint",
      ]
    `);
  });
});

/**
 * This test validates that only explicitly enumerated linters are recommended by default.
 */
describe("Explicitly enabled healthcheck", () => {
  // Step 1: Define test setup and teardown
  const driver = setupLintDriver(REPO_ROOT, {
    setupGit: false,
    setupTrunk: true,
  });

  // Step 2: Validate that no plugin linters or actions are explicitly enabled
  it("validate explicitly enabled actions and linters", async () => {
    // Remove user.yaml if it exists, since it could affect the enabled set.
    // Specifying force avoid errors being thrown if it doesn't exist.
    fs.rmSync(path.resolve(driver.getSandbox(), ".trunk/user.yaml"), {
      force: true,
    });

    const compositeConfig = await driver.getFullTrunkConfig();
    const lintDefinitions = compositeConfig.lint.definitions;
    const actionDefinitions = compositeConfig.actions.definitions;

    const explicitlyEnabledLinters = lintDefinitions.reduce(
      (enabledLinters: string[], definition: any) => {
        if (definition.enabled) {
          return enabledLinters.concat(definition.name);
        }

        if (definition.commands) {
          const commandEnabled = definition.commands.reduce((enabled: boolean, command: any) => {
            if (command.enabled) {
              return true;
            }
            return enabled;
          }, false);
          if (commandEnabled) {
            return enabledLinters.concat(definition.name);
          }
        }

        return enabledLinters;
      },
      [],
    );

    // No linters should be enabled by default
    expect(explicitlyEnabledLinters).toMatchInlineSnapshot(`[]`);

    const explicitlyEnabledActions = actionDefinitions.reduce(
      (enabledActions: string[], definition: any) => {
        if (definition.enabled) {
          return enabledActions.concat(definition.id);
        }

        return enabledActions;
      },
      [],
    );

    // Built-in actions only
    expect(explicitlyEnabledActions).toMatchInlineSnapshot(`
      [
        "trunk-cache-prune",
        "trunk-share-with-everyone",
        "trunk-single-player-auto-upgrade",
        "trunk-single-player-auto-on-upgrade",
        "trunk-whoami",
      ]
    `);
  });
});

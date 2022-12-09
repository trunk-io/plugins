import * as fs from "fs";
import path from "path";
import YAML from "yaml";

import { ARGS, REPO_ROOT } from ".";

/**
 * Read and parse a YAML file. Throws on failure.
 * @param filePath Absolute path
 */
export const parseYaml = (filePath: string): any => {
  const yamlContents = fs.readFileSync(filePath, "utf8");
  return YAML.parse(yamlContents);
};

/**
 * Return the yaml result of parsing the .trunk/trunk.yaml in a specified repo root.
 */
export const getTrunkConfig = (repoRoot: string): any => {
  const trunkYamlPath = path.resolve(repoRoot ?? "", ".trunk/trunk.yaml");
  return parseYaml(trunkYamlPath);
};

/**
 * Retrieve the desired trunk version for tests. Prefer the environment variable-specified version,
 * then the cli version in the .trunk/trunk.yaml of the repository root.
 */
export const getTrunkVersion = (): string => {
  // trunk-ignore(eslint/@typescript-eslint/no-unsafe-member-access)
  const repoCliVersion = getTrunkConfig(REPO_ROOT).cli.version as string;
  return ARGS.cliVersion ?? repoCliVersion ?? "1.1.1-beta.14";
};

/**
 * Generate contents for a newly generated, empty trunk.yaml.
 */
export const newTrunkYamlContents = (): string => {
  return `version: 0.1
cli:
  version: ${getTrunkVersion()}
plugins:
  sources:
  - id: trunk
    local: ${REPO_ROOT}
  `;
};

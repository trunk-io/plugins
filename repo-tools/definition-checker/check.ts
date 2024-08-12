import fs from "fs";
import path from "path";
// trunk-ignore(eslint/import-x/no-extraneous-dependencies)
import YAML from "yaml";

// Avoid strictly typing composite config
// trunk-ignore-all(eslint/@typescript-eslint/no-unsafe-assignment)
// trunk-ignore-all(eslint/@typescript-eslint/no-unsafe-member-access)
// trunk-ignore-all(eslint/@typescript-eslint/no-unsafe-call)
// trunk-ignore-all(eslint/@typescript-eslint/no-unsafe-return)

/**** Helpers ****/

/**
 * Generate a diagnostic message that matches the parse_regex spec.
 */
const generateMessage = (file: string, message: string, code: string): string =>
  `${file} [error]: ${message} (${code})`;

/**
 * Validate that a plugin.yaml doesn't explicitly enable any linters, tools, or actions.
 */
const validateEnables = (file: string, config: any): string[] => {
  const enableErrors: string[] = [];
  const lintEnabled = config.lint?.enabled;
  const toolsEnabled = config.tools?.enabled;
  const actionsEnabled = config.actions?.enabled;

  [
    [lintEnabled, "Linter"],
    [toolsEnabled, "Tool"],
    [actionsEnabled, "Action"],
  ].forEach((value: any[][]) => {
    const [enableds, enabledType] = value as [any[], string];
    if (enableds?.length) {
      enableErrors.push(
        ...enableds.map((enabled: string) =>
          generateMessage(
            file,
            `${enabledType} ${enabled} is explicitly enabled`,
            `no-enable-${enabledType.toLowerCase()}`,
          ),
        ),
      );
    }
  });

  const lintDefinitions = config.lint?.definitions;
  const toolsDefinitions = config.tools?.definitions;
  const actionsDefinitions = config.actions?.definitions;

  [
    [lintDefinitions, "Linter"],
    [toolsDefinitions, "Tool"],
    [actionsDefinitions, "Action"],
  ].forEach((value: any[][]) => {
    const [definitions, definitionType] = value as [any[], string];
    if (!definitions) {
      return;
    }
    enableErrors.push(
      ...definitions.reduce((acc: string[], definition: any) => {
        if (definition?.enabled) {
          acc.push(
            generateMessage(
              file,
              `${definitionType} ${definition.name ?? definition.id} is explicitly enabled`,
              `no-enable-${definitionType.toLowerCase()}`,
            ),
          );
        }
        return acc;
      }, []),
    );
  });

  return enableErrors;
};

/**
 * Ensure that a linter definition has a 'suggest_if' and 'description' field.
 */
const validateLinters = (file: string, config: any): string[] => {
  if (!config.lint?.definitions) {
    return [];
  }

  return config.lint.definitions.reduce((acc: string[], definition: any) => {
    if (definition.deprecated) {
      return acc;
    }
    if (!definition.suggest_if) {
      acc.push(
        generateMessage(
          file,
          `Linter ${definition.name} should specify 'suggest_if'`,
          "suggest-if-linter",
        ),
      );
    }
    if (!definition.description) {
      acc.push(
        generateMessage(
          file,
          `Linter ${definition.name} should specify 'description'`,
          "description-linter",
        ),
      );
    }
    return acc;
  }, []);
};

/**
 * Ensure that a plugin.yaml in the linters or tools subfolders has a matching test file.
 */
const validateTests = async (file: string): Promise<string[]> => {
  if (!file.includes("linters") || !file.includes("tools")) {
    return [];
  }

  const directoryContents = await fs.promises.readdir(path.dirname(file));
  const hasTest = directoryContents.some((dirFile: string) => dirFile.endsWith(".test.ts"));
  if (hasTest) {
    return [];
  }
  return [generateMessage(file, "No test file found", "no-test-file")];
};

/**** Lint Plugin Files ****/

const fileArgs = process.argv.slice(2);

const processFile = async (filePath: string) => {
  const fileContent = await fs.promises.readFile(filePath, "utf8");
  const yamlContents = YAML.parse(fileContent);
  const errors = validateEnables(filePath, yamlContents);
  errors.push(...validateLinters(filePath, yamlContents));
  errors.push(...(await validateTests(filePath)));
  console.log(errors.join("\n"));
};

const processFiles = async (filePaths: string[]) => {
  for (const filePath of filePaths) {
    await processFile(filePath);
  }
};

void processFiles(fileArgs);

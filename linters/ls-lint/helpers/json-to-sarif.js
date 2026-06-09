#!/usr/bin/env node
"use strict";

const fs = require("fs");

const directory = ".dir";

const toSarif = (path, rule, message) => ({
  level: "error",
  locations: [
    {
      physicalLocation: {
        artifactLocation: {
          uri: path,
        },
      },
    },
  ],
  message: {
    text: message,
  },
  ruleId: rule,
});

const loadJsonSafe = () => {
  try {
    const inputData = JSON.parse(fs.readFileSync(0, "utf-8"));
    return inputData;
  } catch {
    return [];
  }
};

const main = () => {
  const results = [];
  const inputData = loadJsonSafe();

  for (const [path, descriptor] of Object.entries(inputData)) {
    // src/directory { '.dir': [ 'kebabcase' ] }
    for (const [key, rules] of Object.entries(descriptor)) {
      // .dir [ 'kebabcase' ]
      const type = key === directory ? "Directory" : "File";

      for (const rule of rules) {
        // kebabcase
        const message = `${type} ${path} does not comply with rule ${rule}`;
        results.push(toSarif(path, rule, message));
      }
    }
  }

  const output = {
    $schema:
      "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        results: results,
        tool: {
          driver: {
            name: "ls-lint",
          },
        },
      },
    ],
  };

  console.log(JSON.stringify(output, null, 2));
};

main();

#!/usr/bin/env node

let fs = require("fs");

let to_diagnostic_level = (severity) => {
  return (
    {
      high: "error",
      moderate: "warning",
      low: "info",
    }[severity] || "error"
  );
};

let fix_to_message = (vuln) => {
  return `Upgrade ${vuln.fixAvailable.name} to ${vuln.fixAvailable.version}`;
};

let to_result_sarif = (vuln, message) => {
  return {
    level: to_diagnostic_level(vuln.severity),
    locations: [
      {
        physicalLocation: {
          artifactLocation: {
            uri: ".",
          },
          region: {
            startColumn: 0,
            startLine: 0,
          },
        },
      },
    ],
    message: {
      text: message,
    },
    ruleId: "vulnerability",
  };
};

let main = () => {
  let npm_audit = JSON.parse(fs.readFileSync(0, "utf8"));

  let results = [];

  let vulns = npm_audit.audit.vulnerabilities;
  for (const vuln_key in vulns) {
    let vuln = vulns[vuln_key];

    if (vuln.fixAvailable) {
      results.push(
        to_result_sarif(
          vuln,
          `Run 'npm audit fix --force' to upgrade ${vuln.fixAvailable.name} to ${vuln.fixAvailable.version}`
        )
      );
    }

    for (const via of vuln.via) {
      if (typeof via === "object") {
        // Otherwise, this is just a dependency edge that we don't need to surface in a diagnostic
        results.push(
          to_result_sarif(
            vuln,
            `${vuln.name} ${vuln.range}: because ${via.title} (see ${via.url})`
          )
        );
      }
    }
  }

  let sarif = {
    $schema:
      "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [{ results: results }],
  };

  console.log(JSON.stringify(sarif));
};

main();

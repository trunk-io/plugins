#!/usr/bin/env node

let fs = require("fs");

// def to_result_sarif(
//     path: str, line_number: int, column_number: int, rule_id: str, message: str
// ):
//     return {
//         "level": "error",
//         "locations": [
//             {
//                 "physicalLocation": {
//                     "artifactLocation": {
//                         "uri": path,
//                     },
//                     "region": {
//                         "startColumn": column_number,
//                         "startLine": line_number,
//                     },
//                 }
//             }
//         ],
//         "message": {
//             "text": message,
//         },
//         "ruleId": rule_id,
//     }
//
//
// def main(argv):
//     results = []
//
//     for line in sys.stdin.readlines():
//         filename, line_number, message = line.split(":")
//         results.append(
//             to_result_sarif(
//                 filename, int(line_number), 0, "misspelled", message.strip()
//             )
//         )
//
//     sarif = {
//         "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
//         "version": "2.1.0",
//         "runs": [{"results": results}],
//     }
//
//     print(json.dumps(sarif, indent=2))

let to_result_sarif = (vuln) => {
  try {
    return {
      level: vuln.severity,
      locations: [
        {
          physicalLocation: {
            artifactLocation: {
              uri: "package.json",
            },
            region: {
              startColumn: 0,
              startLine: 0,
            },
          },
        },
      ],
      message: {
        text: vuln.via[0].title,
      },
      ruleId: "vulnerability",
    };
  } catch (e) {
    return null;
  }
};

let main = () => {
  let npm_audit = JSON.parse(fs.readFileSync(0, "utf8"));

  let results = [];

  let vulns = npm_audit["audit"]["vulnerabilities"];
  for (const vuln in vulns) {
    let vuln_sarif = to_result_sarif(vulns[vuln]);
    if (vuln_sarif) {
      results.push(vuln_sarif);
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

/**
 *{
  "added": 471,
  "removed": 0,
  "changed": 0,
  "audited": 481,
  "funding": 30,
  "audit": {
    "auditReportVersion": 2,
    "vulnerabilities": {
      "ansi-html": {
        "name": "ansi-html",
        "severity": "high",
        "isDirect": false,
        "via": [
          {
            "source": 1082045,
            "name": "ansi-html",
            "dependency": "ansi-html",
            "title": "Uncontrolled Resource Consumption in ansi-html",
            "url": "https://github.com/advisories/GHSA-whgm-jr23-g3j9",
            "severity": "high",
            "range": "<0.0.8"
          }
        ],
        "effects": [
          "webpack-dev-server"
        ],
        "range": "<0.0.8",
        "nodes": [
          "node_modules/ansi-html"
        ],
        "fixAvailable": {
          "name": "webpack-dev-server",
          "version": "3.11.3",
          "isSemVerMajor": false
        }
      },
      "chokidar": {
        "name": "chokidar",
        "severity": "high",
        "isDirect": false,
        "via": [
          "glob-parent"
        ],
        "effects": [
          "webpack-dev-server"
        ],
        "range": "1.0.0-rc1 - 2.1.8",
        "nodes": [
          "node_modules/chokidar"
        ],
        "fixAvailable": {
          "name": "webpack-dev-server",
          "version": "3.11.3",
          "isSemVerMajor": false
        }
      },
      "glob-parent": {
        "name": "glob-parent",
        "severity": "high",
        "isDirect": false,
        "via": [
          {
            "source": 1081884,
            "name": "glob-parent",
            "dependency": "glob-parent",
            "title": "glob-parent before 5.1.2 vulnerable to Regular Expression Denial of Service in enclosure regex",
            "url": "https://github.com/advisories/GHSA-ww39-953v-wcq6",
            "severity": "high",
            "range": "<5.1.2"
          }
        ],
        "effects": [
          "chokidar"
        ],
        "range": "<5.1.2",
        "nodes": [
          "node_modules/glob-parent"
        ],
        "fixAvailable": {
          "name": "webpack-dev-server",
          "version": "3.11.3",
          "isSemVerMajor": false
        }
      },stdinstdin
      "node-forge": {
        "name": "node-forge",
        "severity": "moderate",
        "isDirect": false,
        "via": [
          {
            "source": 1070354,
            "name": "node-forge",
            "dependency": "node-forge",
            "title": "Improper Verification of Cryptographic Signature in `node-forge`",
            "url": "https://github.com/advisories/GHSA-2r2c-g63r-vccr",
            "severity": "moderate",
            "range": "<1.3.0"
          },
          {
            "source": 1081840,
            "name": "node-forge",
            "dependency": "node-forge",
            "title": "URL parsing in node-forge could lead to undesired behavior.",
            "url": "https://github.com/advisories/GHSA-gf8q-jrpm-jvxq",
            "severity": "low",
            "range": "<1.0.0"
          }
        ],
        "effects": [
          "selfsigned"
        ],
        "range": "<=1.2.1",
        "nodes": [
          "node_modules/node-forge"
        ],
        "fixAvailable": {
          "name": "webpack-dev-server",
          "version": "3.11.3",
          "isSemVerMajor": false
        }
      },
      "selfsigned": {
        "name": "selfsigned",
        "severity": "moderate",
        "isDirect": false,
        "via": [
          "node-forge"
        ],
        "effects": [
          "webpack-dev-server"
        ],
        "range": "1.1.1 - 1.10.14",
        "nodes": [
          "node_modules/selfsigned"
        ],
        "fixAvailable": {
          "name": "webpack-dev-server",
          "version": "3.11.3",
          "isSemVerMajor": false
        }
      },
      "sockjs": {
        "name": "sockjs",
        "severity": "moderate",
        "isDirect": false,
        "via": [
          {
            "source": 1082255,
            "name": "sockjs",
            "dependency": "sockjs",
            "title": "Improper Input Validation in SocksJS-Node",
            "url": "https://github.com/advisories/GHSA-c9g6-9335-x697",
            "severity": "moderate",
            "range": "<0.3.20"
          }
        ],
        "effects": [
          "webpack-dev-server"
        ],
        "range": "<0.3.20",
        "nodes": [
          "node_modules/sockjs"
        ],
        "fixAvailable": {
          "name": "webpack-dev-server",
          "version": "3.11.3",
          "isSemVerMajor": false
        }
      },
      "webpack-dev-server": {
        "name": "webpack-dev-server",
        "severity": "high",
        "isDirect": true,
        "via": [
          "ansi-html",
          "chokidar",
          "selfsigned",
          "sockjs",
          "yargs"
        ],
        "effects": [],
        "range": "2.0.0-beta - 4.7.2",
        "nodes": [
          "node_modules/webpack-dev-server"
        ],
        "fixAvailable": {
          "name": "webpack-dev-server",
          "version": "3.11.3",
          "isSemVerMajor": false
        }
      },
      "yargs": {
        "name": "yargs",
        "severity": "moderate",
        "isDirect": false,
        "via": [
          "yargs-parser"
        ],
        "effects": [
          "webpack-dev-server"
        ],
        "range": "8.0.0-candidate.0 - 12.0.5",
        "nodes": [
          "node_modules/yargs"
        ],
        "fixAvailable": {
          "name": "webpack-dev-server",
          "version": "3.11.3",
          "isSemVerMajor": false
        }
      },
      "yargs-parser": {
        "name": "yargs-parser",
        "severity": "moderate",
        "isDirect": false,
        "via": [
          {
            "source": 1081885,
            "name": "yargs-parser",
            "dependency": "yargs-parser",
            "title": "yargs-parser Vulnerable to Prototype Pollution",
            "url": "https://github.com/advisories/GHSA-p9pc-299p-vxgp",
            "severity": "moderate",
            "range": ">=6.0.0 <13.1.2"
          }
        ],
        "effects": [
          "yargs"
        ],
        "range": "6.0.0 - 13.1.1",
        "nodes": [
          "node_modules/yargs-parser"
        ],
        "fixAvailable": {
          "name": "webpack-dev-server",
          "version": "3.11.3",
          "isSemVerMajor": false
        }
      }
    },
    "metadata": {
      "vulnerabilities": {
        "info": 0,
        "low": 0,
        "moderate": 5,
        "high": 4,
        "critical": 0,
        "total": 9
      },
      "dependencies": {
        "prod": 408,
        "dev": 8,
        "optional": 0,
        "peer": 65,
        "peerOptional": 0,
        "total": 480
      }
    }
  }
}

*/

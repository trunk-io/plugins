// trunk-ignore-begin(eslint)
const yaml = require("js-yaml");
const jq = require("node-jq");
// trunk-ignore-end(eslint)

const filter = process.argv.slice(2).join("");

let chunks = [];

process.stdin.on("data", (chunk) => {
  chunks.push(chunk);
});

process.stdin.on("end", () => {
  let data = Buffer.concat(chunks).toString();
  // trunk-ignore-begin(eslint)
  const doc = yaml.load(data);
  jq.run(filter, doc, { input: "json" }).then(console.log);
  // trunk-ignore-end(eslint)
});

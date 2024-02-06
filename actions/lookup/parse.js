const yaml = require("js-yaml");
const jq = require("node-jq");

const filter = process.argv.slice(2).join("");

let data = "";

process.stdin.on("data", function (chunk) {
  data += chunk;
});

process.stdin.on("end", function () {
  try {
    const doc = yaml.load(data);
    jq.run(filter, doc, { input: "json" }).then(console.log);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
});

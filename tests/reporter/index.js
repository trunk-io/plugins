// trunk-ignore-all(eslint)
const path = require("path");
const tsNode = require("ts-node");

const REPO_ROOT = path.resolve(__dirname, "../..");

tsNode.register({
  transpileOnly: true,
  compilerOptions: require(path.resolve(REPO_ROOT, "tsconfig.json")).compilerOptions,
});

module.exports = require("./reporter");

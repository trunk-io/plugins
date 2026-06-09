import { linterCheckTest } from "tests";

const manualVersionReplacer = (version: string) => {
  if (version === "3.12.1") {
    // As of 3/19, 3.12.1 cannot check for anchors, so we view it as a bad version.
    return "3.11.2";
  }
  return version;
};

linterCheckTest({ linterName: "markdown-link-check", manualVersionReplacer });

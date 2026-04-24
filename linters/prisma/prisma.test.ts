import { linterFmtTest } from "tests";

const manualVersionReplacer = (version: string) => {
  const [major] = version.split(".").map((part) => Number.parseInt(part, 10));
  if (!Number.isNaN(major) && major >= 7) {
    return "6.19.0";
  }
  return version;
};

linterFmtTest({ linterName: "prisma", manualVersionReplacer });

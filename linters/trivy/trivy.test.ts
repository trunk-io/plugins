import { customLinterCheckTest } from "tests";

customLinterCheckTest({
  linterName: "trivy",
  args: "-a -y",
});

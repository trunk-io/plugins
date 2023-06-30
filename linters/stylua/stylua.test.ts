import { linterFmtTest } from "tests";

linterFmtTest({
  linterName: "stylua",
  postCheck: (driver) => {
    console.log(driver.readFile(".trunk/trunk.yaml"));
  },
});

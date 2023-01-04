import { linterCheckTest } from "tests";
import { TrunkDriver } from "tests/driver";

// Running check on the input manually requires the existence of a top level .detekt.yaml
const preCheck = (driver: TrunkDriver) => {
  driver.writeFile(".detekt.yaml", "");
};

// TODO(Tyler): We will eventually need to add a couple more test cases involving failure modes.
linterCheckTest({ linterName: "detekt", namedTestPrefixes: ["basic_detekt"], preCheck });

// detekt-explicit has no default settings, leading to an empty result
linterCheckTest({ linterName: "detekt-explicit", namedTestPrefixes: ["basic_explicit"], preCheck });

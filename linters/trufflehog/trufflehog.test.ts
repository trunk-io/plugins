import path from "path";
import { customLinterCheckTest } from "tests";
import { TrunkDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

const preCheck = (file: string) => (driver: TrunkDriver) => {
  driver.writeFile(
    file,
    driver
      .readFile(file)
      .replace("${aws_key}", "A" + "KIAXYZDQCEN4B6JSJQI")
      .replace("${aws_secret}", "T" + "g0pz8Jii8hkLx4+PnUisM8GmKs3a2DK+9qz/lie")
  );
};

const target = "secrets.py";

customLinterCheckTest({
  linterName: "trufflehog",
  testName: target,
  preCheck: preCheck(path.join(TEST_DATA, target)),
});

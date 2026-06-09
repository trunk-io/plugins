import { linterFmtTest } from "tests";

linterFmtTest({
  linterName: "php-cs-fixer",
  // Next release will include support for php@8.4
  // https://github.com/PHP-CS-Fixer/PHP-CS-Fixer/releases/tag/v3.65.0
  skipTestIf: () => true,
  // skipTestIf: skipOS(["win32"]),
});

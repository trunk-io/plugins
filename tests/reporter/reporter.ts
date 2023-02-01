import { LogType } from "@jest/console";
import { Reporter } from "@jest/reporters";
import { AggregatedResult, Test, TestResult } from "@jest/test-result";

type CustomReporter = Pick<Reporter, "onTestResult">;

/**
 * This reporter is run before the default jest reporter. This allows console output to be parsed and then filtered
 * in order to extract linter version information from the test itself.
 *
 * While somewhat hacky, this approach is much simpler than the alternatives, which involve using a shared file or server
 * to process incoming linter version information from tests. Jest currently offers no means of passing information directly
 * from tests to reporters, other than an incidental implementation with the console. The default reporter prints everything
 * in the final test result into stderr, so we can remove custom objects from the console before this forwarding step.
 *
 * Alternative options considered were:
 *  - Atomically writing to a shared file or object between tests (would likely require over-engineering)
 *  - Bootstrapping a custom BufferConsole or the injected global jest console to handle custom buffer pushes
 *    https://github.com/facebook/jest/blob/v29.4.1/packages/jest-console/src/BufferedConsole.ts#L66
 *  - Overriding the default reporter to only print certain messages
 *    https://github.com/facebook/jest/blob/v29.4.1/packages/jest-reporters/src/DefaultReporter.ts#L34
 *
 * Note that due to implementation restrictions with jest, this behavior only applies when more than one test file is run.
 */
export default class TestReporter implements CustomReporter {
  onTestResult(_test: Test, testResult: TestResult, _aggregatedResult: AggregatedResult) {
    // Step 1: Strip console of linter version messages, and populate map
    const linterVersionMap = new Map<string, string | undefined>();
    const filteredConsole = testResult.console?.filter(({ message, origin, type }) => {
      const isLinterVersionMessage = type === ("linter-version" as LogType);
      if (isLinterVersionMessage) {
        // full test name is stored in origin, linter version is stored in message
        linterVersionMap.set(origin, message);
      }
      return !isLinterVersionMessage;
    });
    testResult.console = filteredConsole?.length ? filteredConsole : undefined;

    // Step 2: Lookup version information and add to each test result
    // trunk-ignore-begin(eslint): Unsafe assignment here is expected
    testResult.testResults = testResult.testResults.map((individualResult: any) => {
      individualResult.version = linterVersionMap.get(individualResult.fullName);
      return individualResult;
    });
    // trunk-ignore-end(eslint)
  }
}

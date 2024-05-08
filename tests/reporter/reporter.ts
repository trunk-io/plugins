import { LogType } from "@jest/console";
import { Reporter } from "@jest/reporters";
import { AggregatedResult, Test, TestResult } from "@jest/test-result";
import { FailureMode } from "tests/types";

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
    // Step 1: Strip console of linter version messages, test-type, and failure-mode, and populate map
    const linterVersionMap = new Map<string, string | undefined>();
    const testTypeMap = new Map<string, string | undefined>();
    const suspectedFailureModeMap = new Map<string, FailureMode>();

    const filteredConsole = testResult.console?.filter(({ message, origin, type }) => {
      const hasFailureMode = type === ("suspected-failure-mode" as LogType);
      if (hasFailureMode && !suspectedFailureModeMap.has(origin)) {
        suspectedFailureModeMap.set(origin, message as FailureMode);
      }

      const isLinterVersionMessage = type === ("linter-version" as LogType);
      if (isLinterVersionMessage) {
        // full test name is stored in origin, linter version is stored in message
        linterVersionMap.set(origin, message);
      }

      const hasTestType = type === ("test-type" as LogType);
      if (hasTestType) {
        // full test name is stored in origin, test type label is stored in message
        testTypeMap.set(origin, message);
      }
      // Return whether or not console should include the message.
      return !isLinterVersionMessage && !hasTestType && !hasFailureMode;
    });
    testResult.console = filteredConsole?.length ? filteredConsole : undefined;

    // Step 2: Lookup version/type/failure information and add to each test result
    // trunk-ignore-begin(eslint): Unsafe assignment here is expected
    testResult.testResults = testResult.testResults.map((individualResult: any) => {
      individualResult.version = linterVersionMap.get(individualResult.fullName);
      individualResult.testType = testTypeMap.get(individualResult.fullName);
      if (individualResult.status === "failed") {
        individualResult.suspectedFailureMode =
          suspectedFailureModeMap.get(individualResult.fullName) ?? "unknown";
      } else if (individualResult.status === "pending") {
        individualResult.suspectedFailureMode = "skipped";
      } else {
        individualResult.suspectedFailureMode = "passed";
      }
      return individualResult;
    });
    // trunk-ignore-end(eslint)
  }
}

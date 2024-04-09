import { FileIssue } from "tests/types";
import { osTimeoutMultiplier } from "tests/utils";
import { isDeepStrictEqual } from "util";

jest.setTimeout(300000 * osTimeoutMultiplier);

/**
 * Compares 2 file issues to determine exact equality.
 */
const fileIssueEquals = (expectedIssue: FileIssue) => (actualIssue: FileIssue) =>
  isDeepStrictEqual(expectedIssue, actualIssue);

/**
 * Create a symmetric matcher to determine if a sufficient overlap is found between fileIssues.
 */
expect.extend({
  toHaveIssueOverlap: (actual: any, expected: FileIssue[], minimumOverlap: number) => {
    if (typeof actual !== "object") {
      throw new Error("Actual value must be an array of file issues");
    }
    const overlap = (actual as FileIssue[]).filter((actualIssue) =>
      expected.some(fileIssueEquals(actualIssue)),
    );
    const pass = overlap.length >= minimumOverlap;
    return {
      pass,
      message: pass
        ? () =>
            `expected overlap of less than ${minimumOverlap} with actual (got ${
              overlap.length
            }): ${JSON.stringify(actual, undefined, 2)}`
        : () =>
            `expected overlap of at least ${minimumOverlap} with actual (got ${
              overlap.length
            }): ${JSON.stringify(actual, undefined, 2)}`,
    };
  },
});

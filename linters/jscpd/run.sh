#!/bin/sh
# jscpd compares every file against every other one, so it has to see the whole
# repository: trunk runs this once from the workspace root (target: .) and passes
# ${workspace} as the only argument. Its SARIF reporter only writes to a directory
# (<output>/<report-name>.sarif), while trunk reads linter output from stdout, so the
# report goes to a scratch directory and is then printed.
set -eu

WORKSPACE="${1}"

OUT_DIR="$(mktemp -d)"
trap 'rm -rf "${OUT_DIR}"' EXIT

REPORT="${OUT_DIR}/jscpd-report.sarif"
LOG="${OUT_DIR}/jscpd.log"

# Exit code 0: scan finished (clones are only reported via SARIF).
# Exit code 1: a gate configured in .jscpd.json fired (threshold, failOnNewClones, ...),
#              or jscpd failed; in the latter case no report exists and we fail below.
STATUS=0
cd "${WORKSPACE}"
jscpd . --reporters sarif,silent --output "${OUT_DIR}" --report-name jscpd-report >"${LOG}" 2>&1 || STATUS=$?

if [ ! -f "${REPORT}" ]; then
  cat "${LOG}" >&2
  echo "jscpd did not write ${REPORT} (exit code ${STATUS})" >&2
  exit 1
fi

cat "${REPORT}"
exit "${STATUS}"

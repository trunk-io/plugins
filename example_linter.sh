#!/bin/bash

LINE_NUMBER=0
COLUMN_NUMBER=0
SEVERITY="error"
MESSAGE="example message"
CODE="example-finding"

for PATH in "${BASH_ARGV[@]}"
do
  echo "${PATH}:${LINE_NUMBER}:${COLUMN_NUMBER}: [${SEVERITY}] ${MESSAGE} (${CODE})"
done

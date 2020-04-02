#!/bin/bash -e

DIR="$(cd "$(dirname $0)"; pwd)"


# Output an error message and exit with an error code
error() {
  echo "$0: ERROR: $1" 1>&2
  exit 1
}


# Output an info message
info() {
  echo "$0: INFO: $1" 1>&2
}


check_git_status() {
  # Check that we're releasing only what was committed
  git diff-index --quiet HEAD -- || error "Uncommitted changes"

  # Check that we're on the master branch
  git
}


validate() {
  check_git_status
}


deploy() {
  echo "Deploying..."
}


cd "${DIR}/.."
validate
deploy
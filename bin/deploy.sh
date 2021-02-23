#!/bin/bash -e

DIR="$(cd "$(dirname $0)"; pwd)"


# Output an error message and exit with an error code
error() {
  echo -e "\x1b[31m$0: ERROR: $1\x1b[0m" 1>&2
  exit 1
}


# Output an info message
info() {
  echo -e "\x1b[33m$0: INFO: $1\x1b[0m" 1>&2
}


# Perform git-related validations
check_git_status() {
  # Check that we're releasing only what was committed
  git diff-index --quiet HEAD -- || (git status; error "Uncommitted changes")

  # Check that we're on the master branch
  branch="$(git rev-parse --abbrev-ref HEAD)"
  [ "${branch}" == "master" ] || error "Not on master branch (on ${branch})"
}


# Put any validations before deploying here
validate() {
  info "Validating..."
  check_git_status
}


# Record the version number so we can access it at runtime
record_version() {
  git rev-parse --short HEAD > static/siteversion.txt
}


# Deploy
deploy() {
  info "Deploying..."
  gcloud app deploy . --project "${PROJECT}"
}

# Cleanup old versions
cleanup() {
  info "Cleaning up old versions..."

  OLD_VERSIONS=$(gcloud app versions list --project "${PROJECT}" | sed 's/  */:/g' | cut -f 2 -d : | tail -n +2 | head -n -5 | tr "\n" " ")
  if [ -z ${OLD_VERSIONS} ]; then
    info "No versions to delete"
  else
    info "Deleting versions: ${OLD_VERSIONS}"
    gcloud app versions delete --project "${PROJECT}" ${OLD_VERSIONS}
  fi

}

DEST="$1"
if [[ -z "${DEST}" || ( "${DEST}" != "prod" && "${DEST}" != "beta" ) ]]; then
  error "Usage: $0 {prod|beta} {true|false}"
fi

QUIET="$2"
if [[ -n "${QUIET}" && "${QUIET}" != "true" && "${QUIET}" != "false" ]]; then
  error "Usage: $0 {prod|beta} {true|false}"
elif [[ "${QUIET}" == "true" ]]; then
  export CLOUDSDK_CORE_DISABLE_PROMPTS=1
else
  export CLOUDSDK_CORE_DISABLE_PROMPTS=0
fi

PROJECT=""
if [ "${DEST}" == "prod" ]; then
  PROJECT="os-covid"
elif [ "${DEST}" == "beta" ]; then
  PROJECT="os-covid-beta"
else
  error "Unknown destination. Use 'prod' or 'beta'"
fi

cd "${DIR}/.."
if [ -z "${SKIP_VALIDATE}" ]; then
  validate
fi
record_version
cleanup
deploy
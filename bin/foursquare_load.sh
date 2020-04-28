#!/bin/bash

DATA_DIR="$1"
VERSION="$2"

BUCKET="data.visitdata.org"

if [ -z "${DATA_DIR}" ] || [ -z "${VERSION}" ]; then
    echo "Usage: $0 <data-directory> <YYYYMMDD-vN>" 1>&2
    exit 1
fi

# Ensure data directory does not end with /
if [ "${DATA_DIR:$length-1:1}" == "/" ]; then
    DATA_DIR="${DATA_DIR::-1}"
fi

if [ ! -d "${DATA_DIR}" ]; then
    echo "$0: Input dir ${DATA_DIR} does not exist." 1>&2
    exit 1
fi

if [[ ! "${VERSION}" =~ ^[0-9]{8}-v[0-9]+$ ]]; then
    echo "$0: Version not in correct format. Must be YYYYMMDD-vN (e.g. 20200401-v0)" 1>&2
    exit 1
fi


validateInputDir() {
    if [ "$(find "${DATA_DIR}" -type f -name "*.csv" | wc -l)" -lt 100 ]; then
        echo "$0: Data dir ${DATA_DIR} has fewer than 200 CSV files. This is not typical." 1>&2
        exit 1
    fi

    for file in cats.json taxonomy.json; do
        if [ ! -f "${DATA_DIR}/${file}" ]; then
            echo "$0: Missing file ${DATA_DIR}/${file}" 1>&2
            exit 1
        fi
    done
}


validateOutputUrl() {
    if gsutil ls -d "${TARGET_URL}"; then
        echo "$0: Target URL ${TARGET_URL} already exists. Delete the old data or bump the version" 1>&2
        exit 1
    fi
}


loadData() {
    echo "Loading ${DATA_DIR} to ${TARGET_URL}..."
    gsutil -m cp -r "${DATA_DIR}"/. "${TARGET_URL}"
}


TARGET_URL="gs://${BUCKET}/processed/vendor/foursquare/asof/${VERSION}/"
validateInputDir
validateOutputUrl
loadData

echo "Load to ${TARGET_URL} successful. Don't forget to update app.yaml version."

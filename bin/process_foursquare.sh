#!/bin/bash

# arguments FS.tar yesterdayYYYYMMDD-v# todayYYYYMMDD-v# scratchdir

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

FS_TAR="$1"
PREV_DAY_VERSION_STR="$2"
TODAY_VERSION_STR="$3"
SCRATCHDIR="$4"

if [ -z "${FS_TAR}" ] || -z "${PREV_DAY_VERSION_STR}" ] || [ -z "${TODAY_VERSION_STR}" ] || [ -z "${SCRATCHDIR}" ]; then
    echo "Usage: $0 <foursquare.tar> <prev-day version string YYYYMMDD-v#> <today version string YYYYMMDD-v#> <scratchdir>" 1>&2
    exit 1
fi

if [ ! -f "${FS_TAR}" ]; then
    echo "$0: Foursquare tar ${FS_TAR} does not exist." 1>&2
    exit 1
fi

# TODO check version string for today

if [ -d "${SCRATCHDIR}" ]; then
    echo "$0: Scratch dir ${SCRATCHDIR} already exists. Please remove first." 1>&2
    exit 1
fi

# tmp directory
mkdir -p ${SCRATCHDIR}

# untar to tmp
tar -C ${SCRATCHDIR} -xf ${FS_TAR}

# run extract to tmp


# load from tmp
# modify app.yaml
# git commit -m
# output message to push and deploy
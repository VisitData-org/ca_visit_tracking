#!/bin/bash -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

PREV_DAY_DIR="$1"
FOURSQUARE_DATA="$2"
OUTDIR="$3"

if [ -z "${PREV_DAY_DIR}" ] || [ -z "${FOURSQUARE_DATA}" ] || [ -z "${OUTDIR}" ]; then
    echo "Usage: $0 <prev-day-dir> <source-directory> <target-dir>" 1>&2
    exit 1
fi

if [ ! -d "${FOURSQUARE_DATA}" ]; then
    echo "$0: Input dir ${FOURSQUARE_DATA} does not exist." 1>&2
    exit 1
fi

if [ ! -d "${PREV_DAY_DIR}" ] || [ ! -f "${PREV_DAY_DIR}/taxonomy.json" ]; then
    echo "$0: Previous day directory ${PREV_DAY_DIR} does not exist or does not look right." 1>&2
    exit 1
fi

if [ -d "${OUTDIR}" ]; then
    echo "$0: Output dir ${OUTDIR} already exists. Please remove first." 1>&2
    exit 1
fi

mkdir -p "${OUTDIR}"


copyPrevDayData() {
    cp -rp "${PREV_DAY_DIR}/." "${OUTDIR}/."
}


# Foursquare directory names have spaces in them. Get rid of them.
fixFilenames () {
    if [ ! -d "${SOURCEDIR}" ]; then
        echo "$0: Dir ${SOURCEDIR} does not exist" 1>&2
        exit 1
    fi
    for OriginalFile in "${SOURCEDIR}"/*/*
    do
        # http://hints.macworld.com/article.php?story=20020611094717930
        Location="$(dirname "$OriginalFile")"
        FileName="$(basename "$OriginalFile")"

        ShortName="$(echo "$FileName" | sed 's/ //g' | sed 's/,//g' | sed 's/\.//g')"

        if [ "$ShortName" != "$FileName" ]
        then
            cd "$Location"
            mv "$FileName" "$ShortName"
        fi
    done
}

crunchGZs () {
    SOURCEDIR=$1
    DESTFILEPREFIX=$2

    echo 'renaming files'
    fixFilenames $SOURCEDIR
    echo 'done renaming files'

    DATES=$( ls "$SOURCEDIR" | sed 's/date=//g' )
    for DATE in $DATES
    do
        echo "doing $DATE"
        STATES=$( ls $SOURCEDIR/date=${DATE} | sed 's/state=//g' )
        for STATE in $STATES
        do
            DESTFILE=${DESTFILEPREFIX}${STATE}.csv
            gunzip -c $SOURCEDIR/date=$DATE/state=$STATE/*.csv.gz | awk -F,  'BEGIN{OFS=","} { date=$2; state=$1; $1=date; $2=state; print $0 }' >> $DESTFILE
        done
    done
}

processStates () {
    SOURCEDIR=$1
    DESTFILEPREFIX=$2

    echo 'fixing filenames'
    fixFilenames $SOURCEDIR
    echo 'done fixing filenames'
    
    ALLSTATEDESTFILE=${DESTFILEPREFIX}.csv
    mkdir -p "$(dirname "${ALLSTATEDESTFILE}")"

    DATES=$( ls "$SOURCEDIR" | sed 's/date=//g' )
    for DATE in $DATES
    do
        echo "doing $DATE"
        STATES=$( ls $SOURCEDIR/date=${DATE} | sed 's/state=//g' )
        for STATE in $STATES
        do
            THISSTATEDESTFILE=${DESTFILEPREFIX}${STATE/ //}.csv
            gunzip -c $SOURCEDIR/date=$DATE/state=$STATE/*.csv.gz | awk -F,  'BEGIN{OFS=","} { date=$2; state=$1; $1=date; $2=state; print $0 }' >> $ALLSTATEDESTFILE
            gunzip -c $SOURCEDIR/date=$DATE/state=$STATE/*.csv.gz | awk -F,  'BEGIN{OFS=","} { date=$2; state=$1; $1=date; $2=state; print $0 }' >> $THISSTATEDESTFILE
        done
    done
}

processDataCube () {
    SOURCEDIR=$1
    DESTFILEPREFIX=$2

    # echo 'renaming files'
    # fixFilenames $SOURCEDIR
    # echo 'done renaming files'

    DATES=$( ls "$SOURCEDIR" | sed 's/dt=//g' )
    for DATE in $DATES
    do
        echo "doing $DATE"
        DESTFILE=${DESTFILEPREFIX}.csv
        touch $DESTFILE
        echo "writing to ${DESTFILE}"
        gunzip -c $SOURCEDIR/dt=$DATE/*.csv.gz | awk -F,  'BEGIN{OFS=","} { print $0 }' >> $DESTFILE
    done
}

copyPrevDayData "${PREV_DAY_DIR}" "${OUTDIR}"
# crunchGZs "${FOURSQUARE_DATA}/countyCategoryGz" "${OUTDIR}/raw"
# crunchGZs "${FOURSQUARE_DATA}/countyCategoryGroupGz" "${OUTDIR}/grouped"
processDataCube "${FOURSQUARE_DATA}/percentileWeekAgo" "${OUTDIR}/percentileWeekAgo"
processDataCube "${FOURSQUARE_DATA}/percentileVsMarchFirstWeek" "${OUTDIR}/percentileVsMarchFirstWeek"
processDataCube "${FOURSQUARE_DATA}/rollupVsMarchFirstWeek" "${OUTDIR}/rollupVsMarchFirstWeek"
processDataCube "${FOURSQUARE_DATA}/rollupWeekAgo" "${OUTDIR}/rollupWeekAgo"
# processStates "${FOURSQUARE_DATA}/stateCategoryGz" "${OUTDIR}/allstate/raw"
# processStates "${FOURSQUARE_DATA}/stateCategoryGroupGz" "${OUTDIR}/allstate/grouped"

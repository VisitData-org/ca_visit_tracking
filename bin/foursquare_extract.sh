#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

FOURSQUARE_DATA="$1"
OUTDIR="$2"

if [ -z "${FOURSQUARE_DATA}" ] || [ -z "${OUTDIR}" ]; then
    echo "Usage: $0 <source-directory> <target-directory>" 1>&2
    exit 1
fi

if [ ! -d "${FOURSQUARE_DATA}" ]; then
    echo "$0: Input dir ${FOURSQUARE_DATA} does not exist." 1>&2
    exit 1
fi

if [ -d "${OUTDIR}" ]; then
    echo "$0: Output dir ${OUTDIR} already exists. Please remove first." 1>&2
    exit 1
fi

mkdir -p "${OUTDIR}"


# Foursquare directory names have spaces in them. Get rid of them.
fixFilenames () {
    for OriginalFile in $SOURCEDIR/*/*
    do
        # http://hints.macworld.com/article.php?story=20020611094717930
        Location=`dirname "$OriginalFile"`
        FileName=`basename "$OriginalFile"`

        ShortName=`echo $FileName | sed 's/ //g' | sed 's/,//g' | sed 's/\.//g' `

        if [ $ShortName != "$FileName" ]
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

processTopVenues() {
    SOURCEDIR=$1
    DESTFILEPREFIX=$2

    echo 'fixing filenames'
    fixFilenames $SOURCEDIR
    echo 'done fixing filenames'
    
    DATES=$( ls "$SOURCEDIR" | fgrep "date=" | sed 's/date=//g' )
    echo $DATES
    for DATE in $DATES
    do
        echo "doing $DATE"
        STATES=$( ls $SOURCEDIR/date=${DATE} | fgrep "state=" | fgrep -v "HIVE_DEFAULT" | sed 's/state=//g' )
        for STATE in $STATES
        do
            THISSTATETOPVENUEDESTFILE=${DESTFILEPREFIX}${STATE/ //}.csv
            gunzip -c $SOURCEDIR/date=$DATE/state=$STATE/*.csv.gz | awk -F,  'BEGIN{OFS=","} { date=$2; state=$1; $1=date; $2=state; print $0 }' >> $THISSTATETOPVENUEDESTFILE
        done
    done
}

crunchGZs "$FOURSQUARE_DATA/countyCategoryGz" "$OUTDIR/raw"
crunchGZs "$FOURSQUARE_DATA/countyCategoryGroupGz" "$OUTDIR/grouped"
processStates "$FOURSQUARE_DATA/stateCategoryGz" "$OUTDIR/allstate/raw"
processStates "$FOURSQUARE_DATA/stateCategoryGroupGz" "$OUTDIR/allstate/grouped"
processTopVenues "$FOURSQUARE_DATA/countyCategoryGroupedVenueGz" "$OUTDIR/topvenues/grouped"
processTopVenues "$FOURSQUARE_DATA/countyCategoryVenueGz" "$OUTDIR/topvenues/raw"

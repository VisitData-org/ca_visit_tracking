#!/bin/bash

# Usage:
# static/data/foursquare_extract.sh <directory> <blow away files before adding to them, 1 or 0>

FOURSQUARE_DATA=$1
REMOVE_ALSO=$2      # 
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Foursquare directory names have spaces in them. Get rid of them.
fixFilenames () {
    for OriginalFile in $SOURCEDIR/*/*
    do
        # http://hints.macworld.com/article.php?story=20020611094717930
        Location=`dirname "$OriginalFile"`
        FileName=`basename "$OriginalFile"`

        ShortName=`echo $FileName | sed 's/ //g'`

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
            gunzip -c $SOURCEDIR/date=$DATE/state=$STATE/*.csv.gz | awk -F,  'BEGIN{OFS=","} { date=$2; state=$1; gsub (" ", "", state); $1=date; $2=state; print $0 }' >> $DESTFILE
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
            THISSTATEDESTFILE=${DESTFILEPREFIX}${STATE}.csv
            gunzip -c $SOURCEDIR/date=$DATE/state=$STATE/*.csv.gz | awk -F,  'BEGIN{OFS=","} { date=$2; state=$1; gsub (" ", "", state); $1=date; $2=state; print $0 }' >> $ALLSTATEDESTFILE
            gunzip -c $SOURCEDIR/date=$DATE/state=$STATE/*.csv.gz | awk -F,  'BEGIN{OFS=","} { date=$2; state=$1; gsub (" ", "", state); $1=date; $2=state; print $0 }' >> $THISSTATEDESTFILE
        done
    done
}

if [ $REMOVE_ALSO -eq 1 ]
then
    rm $DIR/raw*.csv
    rm $DIR/grouped*.csv
    rm $DIR/allstate/raw*.csv
    rm $DIR/allstate/grouped*.csv
fi

crunchGZs $FOURSQUARE_DATA/countyCategoryGz $DIR/raw
crunchGZs $FOURSQUARE_DATA/countyCategoryGroupGz $DIR/grouped
processStates $FOURSQUARE_DATA/stateCategoryGz $DIR/allstate/raw
processStates $FOURSQUARE_DATA/stateCategoryGroupGz $DIR/allstate/grouped

#!/bin/bash

FOURSQUARE_DATA=$1
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

    fixFilenames $SOURCEDIR

    DATES=$( ls "$SOURCEDIR" | sed 's/date=//g' )
    for DATE in $DATES
    do
    
        STATES=$( ls $SOURCEDIR/date=${DATE} | sed 's/state=//g' )
        for STATE in $STATES
        do
            DESTFILE=${DESTFILEPREFIX}${STATE}.csv
            gunzip -c $SOURCEDIR/date=$DATE/state=$STATE/*.csv.gz | awk -F,  'BEGIN{OFS=","} { date=$2; state=$1; $1=date; $2=state; print $0 }' >> $DESTFILE
            echo "$STATE"
        done
    done
}

crunchGZs $FOURSQUARE_DATA/countyCategoryGz $DIR/raw
crunchGZs $FOURSQUARE_DATA/countyCategoryGroupGz $DIR/grouped

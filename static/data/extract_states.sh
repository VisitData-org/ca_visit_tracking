#!/bin/bash

FOURSQUARE_DATA=$1
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Foursquare directory names have spaces in them. Get rid of them.
fixFilenames () {
    for OriginalFile in $SOURCEDIR/*
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

    STATES=$( ls $SOURCEDIR | sed 's/state=//g' )
    for STATE in $STATES
    do
        DESTFILE=${DESTFILEPREFIX}${STATE}.csv
        rm -f $DESTFILE
        DATES=$( ls "$SOURCEDIR/state=$STATE" | sed 's/date=//g' )
        for DATE in $DATES
        do
            gunzip -c $SOURCEDIR/state=$STATE/date=$DATE/*.csv.gz | awk '{print "'$DATE'" ","'$STATE'"," $0}' >> $DESTFILE
        done

        echo "$DESTFILE"
    done
}

crunchGZs $FOURSQUARE_DATA/countyCategoryGz $DIR/raw
crunchGZs $FOURSQUARE_DATA/countyCategoryGroupGz $DIR/grouped

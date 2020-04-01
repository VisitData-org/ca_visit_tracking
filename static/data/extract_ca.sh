#!/bin/bash

FOURSQUARE_DATA=$1
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

crunchGZs () {
    SOURCEDIR=$1
    DESTFILE=$2
    
    rm -f $DESTFILE
    DATES=$( ls $SOURCEDIR/state=California | sed 's/date=//g' )
    for DATE in $DATES
    do
        gunzip -c $SOURCEDIR/state=California/date=$DATE/*.csv.gz | awk '{print "'$DATE'" ",California," $0}' >> $DESTFILE
    done

    echo 'Done. Sanity check:'
    awk -F, '{print $1}' $DESTFILE | sort | uniq -c
    echo "New data is in $DESTFILE"
}

crunchGZs $FOURSQUARE_DATA/countyCategoryGz $DIR/raw.csv
crunchGZs $FOURSQUARE_DATA/countyCategoryGroupGz $DIR/grouped.csv

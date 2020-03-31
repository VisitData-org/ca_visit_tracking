#!/bin/bash

cp grouped.csv oldGrouped.csv
dos2unix oldGrouped.csv 
grep -v 2020-03-28 oldGrouped.csv > grouped.csv
gunzip -c ~/Downloads/allData/countyCategoryGroupGz/state=California/date=2020-03-28/*.gz | awk '{print "2020-03-28,California," $0}' >> grouped.csv
gunzip -c ~/Downloads/allData/countyCategoryGroupGz/state=California/date=2020-03-29/*.gz | awk '{print "2020-03-29,California," $0}' >> grouped.csv
gunzip -c ~/Downloads/allData/countyCategoryGroupGz/state=California/date=2020-03-30/*.gz | awk '{print "2020-03-30,California," $0}' >> grouped.csv
awk -F, '{print $1}' grouped.csv | sort | uniq -c

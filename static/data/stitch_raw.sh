#!/bin/bash

cp raw.csv oldRaw.csv
dos2unix oldRaw.csv 
grep -v 2020-03-28 oldRaw.csv > raw.csv
gunzip -c ~/Downloads/allData/countyCategoryGz/state=California/date=2020-03-28/*.gz | awk '{print "2020-03-28,California," $0}' >> raw.csv
gunzip -c ~/Downloads/allData/countyCategoryGz/state=California/date=2020-03-29/*.gz | awk '{print "2020-03-29,California," $0}' >> raw.csv
gunzip -c ~/Downloads/allData/countyCategoryGz/state=California/date=2020-03-30/*.gz | awk '{print "2020-03-30,California," $0}' >> raw.csv
awk -F, '{print $1}' raw.csv | sort | uniq -c

#!/bin/sh
source /Users/thomas/.profile

MMDD=`date +%y%m%d`
YYMMDD1=`date -v-2d +%y%m%d`
YYMMDD2=`date -v-3d +%y%m%d`
YYMMDD3=`date -v-4d +%y%m%d`
YYMMDD4=`date -v-5d +%y%m%d`
YYMMDD0=`date -v-6d +%y%m%d`

pg_dump -c -t "s__*" -t "*__${YYMMDD1}" -t "*__${YYMMDD2}" -t "*__${YYMMDD3}" -t "*__${YYMMDD4}" -t "*__${YYMMDD0}"  bigoptions | gzip > weekly$MMDD.gz

## pg_dump bigoptions | gzip > bigoptions$MMDD.gz


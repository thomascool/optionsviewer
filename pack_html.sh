#!/bin/sh

MMDD=`date +%m%d`
MMDD1=`date -v-1d +%m%d`
MMDD7=`date -v-7d +%m%d`

rm -rf ./$MMDD1
rm -rf ./$MMDD7
mkdir ./html/$MMDD
mv ./html/*html ./html/$MMDD
tar -cvzf ../databackup/$MMDD.gz ./html/$MMDD
mv ./html/$MMDD .


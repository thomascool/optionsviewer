#!/bin/sh

MMDD=`date +%m%d`
MMDD7=`date -v-7d +%m%d`

rm -rf ./$MMDD7
mkdir ./html/$MMDD
mv ./html/*html ./html/$MMDD
tar -cvzf ../databackup/$MMDD.gz ./html/$MMDD
mv ./html/$MMDD .


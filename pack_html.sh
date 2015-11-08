#!/bin/sh

MMDD=`date +%m%d`

mkdir ./html/$MMDD
mv ./html/*html ./html/$MMDD
tar -cvzf ../$MMDD.gz ./html/$MMDD
mv ./html/$MMDD .
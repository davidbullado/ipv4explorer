#!/bin/bash
source /etc/environment

rm db1lite.zip
wget -O db1lite.zip "http://www.ip2location.com/download/?token=${IP2LOCATION_TOKEN}&file=DB1LITE"
[ -f db1lite.zip ] && unzip -o db1lite.zip

rm DBASNLITE.zip
wget -O DBASNLITE.zip "http://www.ip2location.com/download/?token=${IP2LOCATION_TOKEN}&file=DBASNLITE"
[ -f DBASNLITE.zip ] && unzip -o DBASNLITE.zip

wget -O ipv4-address-space.csv https://www.iana.org/assignments/ipv4-address-space/ipv4-address-space.csv
[ -f ipv4-address-space.csv ] && cp -rf ipv4-address-space.csv build-tiles/ipv4-address-space.csv

sudo service ipv4explorer restart

#!/bin/bash
source /etc/environment

rm db1lite.zip
wget -O db1lite.zip "http://www.ip2location.com/download/?token=${IP2LOCATION_TOKEN}&file=DB1LITE"
[ -f db1lite.zip ] && unzip -o db1lite.zip

rm DBASNLITE.zip
wget -O DBASNLITE.zip "http://www.ip2location.com/download/?token=${IP2LOCATION_TOKEN}&file=DBASNLITE"
[ -f DBASNLITE.zip ] && unzip -o DBASNLITE.zip
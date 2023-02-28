#!/bin/bash
#source /etc/environment
set -e

echo "This script is executed from: $PWD"

#if [ ! -f "./server.key" ]; then
#   openssl genrsa 2048 > server.key
#   chmod 400 server.key
#   if [ ! -f "./server.crt" ]; then
#      openssl req -batch -new -x509 -nodes -sha256 -days 365 -key server.key -out ./server.crt
#   fi
#fi


if [ -z "$IP2LOCATION_TOKEN" ]; then
   echo "You must create a .env file and set IP2LOCATION_TOKEN" && exit 1
else
   echo "Successfuly load ip2location token: $IP2LOCATION_TOKEN"
fi

FILE=db1lite.zip
if [ `find $FILE -type f -mtime +2 -print` ];
then
  echo "Le fichier $FILE a été modifié il y a plus de 2 jours."
  rm $FILE
  wget -O $FILE "http://www.ip2location.com/download/?token=${IP2LOCATION_TOKEN}&file=DB1LITE"
  [ -f $FILE ] && unzip -o $FILE
else
  echo "Le fichier $FILE a été modifié il y a moins de 2 jours."
fi

FILE=DBASNLITE.zip
if [ `find $FILE -type f -mtime +2 -print` ];
then
  echo "Le fichier $FILE a été modifié il y a plus de 2 jours."
  rm $FILE
  wget -O $FILE "http://www.ip2location.com/download/?token=${IP2LOCATION_TOKEN}&file=DBASNLITE"
  [ -f $FILE ] && unzip -o $FILE
else
  echo "Le fichier $FILE a été modifié il y a moins de 2 jours."
fi

FILE=ipv4-address-space.csv
if [ `find $FILE -type f -mtime +2 -print` ];
then
  echo "Le fichier $FILE a été modifié il y a plus de 2 jours."
  wget -O ipv4-address-space.csv https://www.iana.org/assignments/ipv4-address-space/ipv4-address-space.csv
   [ -f ipv4-address-space.csv ] && cp -rf ipv4-address-space.csv build-tiles/ipv4-address-space.csv
else
  echo "Le fichier $FILE a été modifié il y a moins de 2 jours."
fi

#sudo service ipv4explorer restart

#!/bin/bash

#record pwd
odir=$(pwd)
cd /home/licode/licode
#pull latest code with admin@mail.licode.io
sudo -u licode git pull
#run migrations
python3 migrations/migrations.py migrate
#build the front end in the react dir
cd /home/licode/licode/react-app && npm run build
#return to pwd
cd "$odir"
#reload/restart relevant services
./restart.sh

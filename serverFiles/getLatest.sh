#!/bin/bash
odir=$(pwd)
cd /home/licode/licode
sudo -u licode git pull
python3 migrations/migrations.py migrate
cd /home/licode/licode/react-app && npm run build
cd "$odir"
systemctl daemon-reload
systemctl reload nginx.service
systemctl restart licode.server.service
systemctl restart go.server.service


#!/bin/bash

#restart/reload relevant services

#notify all services of any changes in their source code
systemctl daemon-reload
#reload nginx (web server)
systemctl reload nginx.service
#TODO:  move deno and go into one service that
#	can be reloaded to apply changes
#restart deno
systemctl restart licode.server.service
#restart go (realtime stuff)
systemctl restart go.server.service

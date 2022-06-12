#!/bin/bash

systemctl status nginx.service
systemctl status licode.server.service
systemctl status go.server.service
ps aux | egrep "go|deno"

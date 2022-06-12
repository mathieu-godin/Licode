Files used around the server
They are stored here and symlinks are made in the relevant server locations
To add a file; make it, add it to this doc and then
```bash
cd [Server Location]
ln -s [File] [Server Location] (w sudo if needed, see `man ln` for renaming options)
```
File,Server Location,Description
licode,/etc/nginx/sites-available/licode,nginx config for licode.io (a symlink to this in sites-enabled is needed to enable the site)
licode.server.service,/etc/systemd/system/licode.server.service,systemd unit file (runs deno run ... as a service)
go.server.service,/etc/systemd/system/go.server.service,systemd unit file (runs go run ... (as a binary) as a service)
getLatest.sh,/home/licode/getLatest.sh,script to get latest code, migrate, build, reload/restart services, etc.
diagnostics.sh,/home/licode/diagnostics.sh,script to show the status og nginx, licode.server, go.server, etc. and show PIDS

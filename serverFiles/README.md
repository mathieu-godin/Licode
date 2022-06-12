Files used around the server
They are stored here and symlinks are made in the relevant server locations
ln -s [File] [Server Location]
File,Server Location,Description
licode,/etc/nginx/sites-available/licode,nginx config for licode.io (a symlink to this in sites-enabled is needed to enable the site)
licode.server.service,/etc/systemd/system/licode.server.service,systemd unit file (runs deno run ... as a service)
go.server.service,/etc/systemd/system/go.server.service,systemd unit file (runs go run ... (as a binary) as a service)

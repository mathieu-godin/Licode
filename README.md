# licode

Licode is a confrontational coding platform.

## Technologies

### Back End

The back-end Deno server uses Oak. Deno is a modern and nascent equivalent of Node.js that uses TypeScript, is more secure and offers other new features. Oak is to Deno what Express is to Node.js. Actually, Koa is a recent successor of Express for Node.js and Oak could be as seen as what Koa is to Node.js for Deno. The Deno backend server will be used for one time HTTPS requests.

A Go server will be used for realtime WebSocket interactions between the client and the server.

### Front End

The front-end application uses React. Deno along with Oak make that React web application available through an HTTPS request.

### Database

The database is a Postgres one. A migrations.py script made by us is used to add or remove tables and columns. Deno Postgres is used to read or write data to the database.

## Setup

This setup assumes you clone the server repository in your home folder ($HOME or ~ on Linux).

### Installing Postgres

#### Linux (Ubuntu)

```bash
sudo apt install postgresql
```

To test that Postgres was installed successfully and create the licode database and user, do the following.

```bash
sudo -u postgres psql
CREATE USER licode WITH PASSWORD 'edocil';
CREATE DATABASE licode;
GRANT ALL PRIVILEGES ON DATABASE licode to licode;
ALTER USER postgres with password 'my-password';
\q
sudo systemctl restart postgresql
```

We then install pgAdmin, the best GUI tool to manage a Postgres database (only on development machine, not on server)

```bash
sudo curl https://www.pgadmin.org/static/packages_pgadmin_org.pub | sudo apt-key add
sudo sh -c 'echo "deb https://ftp.postgresql.org/pub/pgadmin/pgadmin4/apt/$(lsb_release -cs) pgadmin4 main" > /etc/apt/sources.list.d/pgadmin4.list && apt update'
sudo apt install pgadmin4
```

### Windows

Download the installer for the latest version of PostgreSQL from https://www.enterprisedb.com/downloads/postgres-postgresql-downloads. It will take a few minutes to download.

Open the installer file and in "Setup - PostgreSQL" click Next.

In "Installation Directory" Specify the Installation Directory or keep it as default and click Next.

In "Select Components" you can unselect Stack Builder since it is not needed, but make sure that PostgreSQL Server, pgAdmin 4 and Command Line Tools are selected. Click next.

In "Data Directory" Select the directory for PostgreSQL to store your databaces or keep it as default and click Next.

In "Password" Enter the password for the database super user, also known as "postgres". Make sure you don't forget the password because it is not easy to reset. Click Next.

In "Port" Use the default Port and click Next.

In "Advanced Options" Use the default Locale and click Next.

In "Pre Installation Summary" make sure that all the information makes sense and click next.

In "Ready to Install" click next.

In "Installing" the installation will run through, and if it finishes successfully you should be able to click next.

In "Completing the PostgreSQL Setup Wizard" click Finish.

Once the installation is complete, set up the environment variable by doing the following:

Go to "This PC", right click and select "Properties", then select "Advanced System Settings" and then select "Environment Variables...".

Under System variables, double click on the variable named "Path". Use "New" to create the following two entries: %INSTALL_DIR%\bin and %INSTALL_DIR%\lib where %INSTALL_DIR% is your installation directory, "C:\Program Files\PostgreSQL\14" by default.

To test that Postgres was installed successfully and create the licode database user, first run a PowerShell terminal as administrator (Search for PowerShell in the search bar, right click and select "run as administrator"). Then do the following:

```bash
psql -u postgres
CREATE USER licode WITH PASSWORD 'edocil';
CREATE DATABASE licode;
GRANT ALL PRIVILEGES ON DATABASE licode to licode;
ALTER USER postgres with password 'my-password';
\q
Restart-Service -Name postgresql-x64-14
```

If the "Restart-Service -Name postgresql-x64-14" command fails, then check the name of the service running postgres by running "Get-Service"

#### On Development Machine
Open pgAdmin (by searching it in your programs and starting it). It will ask you to set a master password. Let's set it to _edocil_ for now (simply licode spelled backwards).

Click on **Add New Server** at the center of the pgAdmin window. In the new window, set **Name** to _pgServer1_. Switch to the **Connection** tab. Set **Host name/address** to _localhost_, **Username** to _licode_, and **Password** to _edocil_. Leave the remaining fields with their default values. Press **Save**. You should now have **pgServer1** under **Servers**, **Databases**, **Login/Group Roles**, and **Tablespaces** under **pgServer1**, and **licode** and **postgres** under **Databases** on the left panel.

Using pgAdmin to add or remove columns and tables in our database is ill-advised as it prevents us from restoring a previous version of our database.

For this reason, we need something similar to Laravel Migrations. We will use our own migrations frameowrk, i.e., a simple Python script called migrations.py.

#### On Server
```bash
sudo -u postgres psql
CREATE EXTENSION postgres_fdw;
CREATE SERVER pgServer1 FOREIGN DATA WRAPPER postgres_fdw OPTIONS (host 'localhost');
CREATE USER MAPPING FOR licode SERVER pgServer1 OPTIONS (user 'licode', password 'edocil');
\q
sudo systemctl restart postgresql
```

#### Development and Server
We then need to replace the first line below with the second one below in */etc/postgresql/12/main/pg_hba.conf*.

```bash
local   all             postgres                                peer
```

```bash
local   all             postgres                                md5
```

This will let us execute SQL scripts to modify the database, which will let us use migrations.py.

### On Server, run these before continuing:
```bash
sudo apt update
sudo apt install unzip
sudo apt install npm
npm install -g n
sudo n install stable
sudo n                  (use arrow keys to select the version)
source $HOME/.bashrc
ssh-keygen              (just hit enter to accept all defaults)
```
Add the key to a github account with access to this repo

### Installing Deno

#### Linux and Mac

```bash
curl -fsSL https://deno.land/x/install/install.sh | sh
```

Add the following two lines to ~/.bashrc (on Linux).

```bash
export DENO_INSTALL="/$HOME/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"
```

#### Windows

```powershell
iwr https://deno.land/x/install/install.ps1 -useb | iex
```

### Installing Go

Install version go1.18

This is probably the best resource, you may have to set GOROOT and/or GOPATH if you
deviate from the install instructions

https://go.dev/doc/install

You also have to install github.com/gorilla/websocket.
I used go get github.com/gorilla/websocket which is deprecated,
maybe try go install instead.


### Server Installation and Execution

#### Cloning the Repository

```bash
git clone git@github.com:mathieu-godin/licode.git
```

#### Building the Front-End Application

Make sure you have Node.js and npm installed as React needs them. This seems to take a long time on the server,
try building on your machine and copying the build/ directory onto the server.

```bash
cd licode/react-app
npm run build
```

#### Setting the Environment Variables

```bash
export DENO_DIR="$HOME/licode/packages"
export LICODE_PORT=3000
```

Add the above two lines to ~/.profile (Linux) if you want these environment variables to still be there when you reboot your system (recommended).

Packages will be saved in the licode repository by setting DENO_DIR with the above value. The packages are what we import using URLs at the top of our TypeScript files. For now, our server will be accessed from port 3000. The LICODE_PORT environment variable is what holds the port our server can be accessed from.

#### Performing the Database Migrations

##### Linux

```bash
cd ..
sudo apt install libpq-dev python3-dev
pip install psycopg2
python migrations/migrations.py migrate
```

#### Windows
On Powershell:

```bash
cd ..
pip install psycopg2
python migrations/migrations.py migrate
```

#### Setting up the Sandbox

```bash
sudo docker load < py-sandbox.tar
```

#### Setting Deno to the Right Version

```bash
deno version --upgrade 1.20.3
```

#### Running the Server (on development machine)

```bash
sudo -E $DENO_INSTALL/bin/deno run --allow-all mod.ts
```

#### Running the GO Server (on development machine)

(in /goServer)
```bash
go run server.go
```

#### Running the Server (on the server)
```bash
sudo -E $DENO_INSTALL/bin/deno run --allow-all mod.ts
```

If you go to localhost:3000 on a web browser, you should see our React application.

## Useful Things to Know

### How to Reload Packages

All the packages used by our Deno server were saved in the _packages_ folder the first time we ran "deno run ...".
To reload the packages, run the following.

```bash
sudo -E $DENO_INSTALL/bin/deno run --allow-all mod.ts
```

### How to Not Have to Restart the Server Each Time a Change Is Made

#### Installing Denon

```bash
deno install -qAf --unstable https://deno.land/x/denon/denon.ts
```

#### Starting the Server Such That It Doesn’t Have to Be Restarted Each Time a Change Is Made

```bash
sudo -E $DENO_INSTALL/bin/denon run --allow-all mod.ts
```

### How to Quickly Test the Frontend Application Without a Backend

```bash
cd licode/react-app
npm start
```

### Using the Docker Sandbox

#### Accessing the Sandbox

```bash
sudo docker run -it py-sandbox
cd home/TestEnvironment
```

#### Saving an Image of the Sandbox

```bash
sudo docker ps -a
```

Take note of the most recent Docker instance hash.

```bash
docker commit <most-recent-hash> py-sandbox
sudo docker save py-sandbox > py-sandbox.tar
```

#### Terminating a Sandbox Instance

```bash
sudo docker ps -a
```

Take note of the most recent Docker instance hash.

```bash
sudo docker kill <most-recent-hahs>
```

## Security

### Password Encryption

As done with other aspects of the application, we opt for state-of-the-art technologies when it comes to password encryption. As seen in **ECE 458: Computer Security**, MD5 is 100% insecure, SHA-1 is now considered breakable, and SHA-2 is what most applications are currently using. There's also SHA-3 which was released in 2015 and hasn't been used by many companies yet. However, it's definitely more secure than SHA-2 and that's why we should use it. More specifically, we should use SHA3-512, which has 256 bits security against collision attacks (considered military grade). SHA-3 is also much more secure than SHA-2 when it comes to length extension attacks. Most websites use scrypt or bcrypt to store their passwords which doesn't hold to the best security standards and isn't even approved by NIST.

#### User Registration

We generate a random salt. We then save: _Hash_(_password_ || _salt_) and _salt_.

#### User Authentication

We perform Hash(_password_ || _salt_) and compare it with the saved hash. If the two hashes match, the user logs in succesfully.


## Database Management

### Database Migrations

We use a simple Python script called migrations.py. To add or remove database tables or columns, we create a migration file and run it using migrations.py.

Create a new migration file by running the following.

```bash
python migrations/migrations.py make <migration-name>
```

Edit the migration file that just got created (should be printed by the migrations utility).

To run all migration files and update the database accordingly, run the following.

```bash
sudo apt install libpq-dev python3-dev
pip install psycopg2
python migrations/migrations.py migrate
```

For more information about migrations.py, visit:

https://github.com/mathieu-godin/migrations

## Important Notes About Deno

### Unstable SSL/TLS Support

As Deno is a recent back-end framework, not everything is stable or well supported. SSL/TLS support, i.e., what makes handling HTTPS requests possible, is not well supported yet and requires the _--unstable_ flag when running Deno and it usually doesn't work very well.
TODO (Is this still an issue, I think Nginx fixed it)


### The Ubuntu Server

The Ubuntu server; runs the deno server, runs the go server and may run another server for sandboxing.

To manage the server you can ssh in with ssh -i keyfile.pem ubuntu@licode.io. 

You will need to add your ip to the white list on AWS

EC2 -> Instances -> Click the instance -> Security -> Click the security group -> 
Edit the rule for ssh.) 

You will also need the key file. AWS only allows one download, so ask me
for it then store it somewhere.

It uses Nginx to forward requests from default ports and with given protocols to the ports that the deno
and go servers expect. This is managed from /etc/nginx/sites-available/default. This is where TLS is handled,
i.e. that file specifies our certificate. I used certbot from Let's Encrypt to generate the certificate.

The deno server is run as a systemd service. The unit file for this service is found /etc/systemd/system/licode.server.service.
It specifies the same environment variables specified above, and runs as root in the ~/licode directory. It runs on start up and will restart
if it crashes.

The go server(s) will be the same

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

```bash
cd ..
sudo apt install libpq-dev python3-dev
pip install psycopg2
python migrations/migrations.py migrate
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

# licode

A confrontational coding platform.

## Technologies

### Backend

Deno server using Oak. Deno is like an equivalent of Node. Oak is like an equivalent of Express. Actually, the successor of Express that came out recently is Koa (on Node). Oak is the Koa equivalent for Deno. Deno is used for one time HTTPS requests. We intend to use Go for our realtime server.

### Frontend

React web application. Deno Oak deploys that React application.

### Database

Postgres Database. Deno Nessie is used to modify the scheme of the database (aka migrations). Deno Postgres is used to read or write data to the database.

## Setup

This setup assumes you clone the server repository in your home folder ($HOME or ~).

### Install Postgres

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

We then install pgAdmin, the best GUI tool to manage a Postgres database.

```bash
sudo curl https://www.pgadmin.org/static/packages_pgadmin_org.pub | sudo apt-key add
sudo sh -c 'echo "deb https://ftp.postgresql.org/pub/pgadmin/pgadmin4/apt/$(lsb_release -cs) pgadmin4 main" > /etc/apt/sources.list.d/pgadmin4.list && apt update'
sudo apt install pgadmin4
```

### Set up the Database

Open pgAdmin (by searching it in your programs and starting it). It will ask you to set a master password. Let's set it to _edocil_ for now (simply licode spelled backwards).

Click on **Add New Server** at the center of the pgAdmin window. In the new window, write _pgServer1_ in the **Name** field. Switch from the **General** to the **Connection** tab. Enter _localhost_ in the **Host name/address** field. Set the **Username** field to _licode_ and the **Password** field to _edocil_. Leave all the other fields with their default values. Press **Save**. You should now have **pgServer1** under **Servers** on the left. You should have **Databases**, **Login/Group Roles**, and **Tablespaces** under **pgServer1**. You should have **licode** and **postgres** under **Databases**.

Although we could use pgAdmin to modify our database scheme as we go along, this would be an ill-advised decision as we wouldn't be able to track how we modify our database as we go along.

For this reason, we need something similar to Laravel Migrations. We will use our own migration frameowrk, i.e., a simple Python script.

We then need to replace the following line in */etc/postgresql/12/main/pg_hba.conf*:

```bash
local   all             postgres                                peer
```

With this one (basically change peer to md5):

```bash
local   all             postgres                                md5
```

This will let us execute SQL scripts to modify the database, which is needed for our migrations workflow.

### Install Deno

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

### Server Installation and Execution

#### Clone the Repository

```bash
git clone https://github.com/mathieu-godin/licode
```

#### Build the Frontend Application

Make sure you have Node.js installed (and as such npm). React needs this.

```bash
cd licode/react-app
npm install
npm run build
```

#### Set Backend Server Environment Variables

```bash
export DENO_DIR="$HOME/licode/packages"
export LICODE_PORT=3000
```

If you want these environment variables to still be there when you reboot your system, add the above two lines to ~/.profile (Linux).

DENO_DIR allows us to save the packages we use in our licode repository. The packages are what we import using URLs at the top of our .ts files. For now, we will run our server on port 3000. We set it with the LICODE_PORT environment variable.

#### Run the Server

```bash
cd ..
deno run --allow-net --allow-env --allow-read mod.ts
```

If you go to localhost:3000 on your web browser, you should see a very simple React application.

## Useful Things to Know

### How to Reload Packages

All the packages being used by our Deno server were downloaded to the packages folder the first time we ran "deno run ...".
To reload the packages, run the following.

```bash
deno run --allow-net --allow-env --allow-read --reload mod.ts
```

### How to Not Have to Restart the Server Each Time a Change Is Made

#### Install Denon

```bash
deno install -qAf --unstable https://deno.land/x/denon/denon.ts
```

#### Start Server That Doesn't Have to Be Restarted Whenever a Change Is Made

```bash
denon run --allow-net --allow-env --allow-read mod.ts
```

### How to Quickly Test the Frontend Application Without a Backend

```bash
cd licode/react-app
npm start
```

## Security

### Password Encryption

As done with the other aspects of this application, we will use state-of-the-art technologies. As seen in **ECE 458: Computer Security**, MD5 is 100% insecure, SHA-1 is considered broken, though not as bad as MD5, and SHA-2 is what most applications are using currently. However, SHA-3, which was released in 2015, hasn't been used by many companies yet. However, it's definitely more secure than SHA-2 and that's why I think we should use it. More specifically, I think we should use SHA3-512, which has 256 bits security against collision attacks (considered military grade). 128 bits collision security would be considered application grade. However, as processing power greatly augments every year, what used to be considered military grade could definitely become considered application grade. SHA-3 also offers much better security against length extension attacks than SHA-2. Most companies actually do not do this. They only use scrypt or bcrypt which isn't even approved by NIST. Furthermore, plaintext passwords are captured on the server side each time somebody logs in or registers. Nothing stops us from doing much better than this.

#### When the User Registers

We generate a client and server salt randomly. We send the client salt to the client. The client sends us Hash(password || client_salt). The server receives that (let's call that *received*). We would then save in the database in their user row, Hash(*received* || server_salt) (or effectively Hash(Hash(password || client_salt) || server_salt)), client_salt, and server_salt.

#### When the User Logs In

We send the clien salt to the client. The client sends Hash(password || client_salt). On the server side, we perform Hash(*received* || server_salt) (or effectively Hash(Hash(password || client_salt) || server_salt)) and compare it with the hash that was saved when the user registered. If the two hashes match, the user logs in succesfully. Otherwise, the user doesn't.


## Database Management

### Database Migrations

We use our own migration framework which is a simple Python script. Each time we modify the database (a.k.a. a migration), we create a migration and run that migration.

To create a new migration, do the following:

```bash
python migrations/migrations.py make <migration-name>
```

Edit the migration that just got created (should be printed by the migrations utility)

To run all the migrations and update the database accordingly, to the following:

```bash
python migrations/migrations.py migrate
```

For more information about the migrations utility, visit: https://github.com/mathieu-godin/migrations

## Important Notes About Deno

### Unstable SSL/TLS Support

As Deno is a recent backend framework, not everything is very stable or well supported. SSL/TLS support, i.e., what is used to have an encrypted tunnel to have HTTPS etc., is not very well supported and requires the *--unstable* flag when running Deno and it usually doesn't work very well. This is what caused connection issues with the database earlier.

### Nessie is Unstable

Nessie, the database migration framework we were using requires the use of the *--unstable* flag. We will stop using Nessie and find an alternative for this reason. There isn't a lot of very well reputed migration frameworks out there except for Laravel Migrations for PHP. That's probably because a migration framework is so simple, most companies make their own and that's what we'll do. We just need the *migrate* and the *make* command (we can ignore *revert* and other operations we never planned to use). Making a Python script that does that should actually be very simple and take a very short amount of time.

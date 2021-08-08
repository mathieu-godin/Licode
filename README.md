# licode

A confrontational coding platform.

## Technologies

### Backend

Deno server using Oak. Deno is like an equivalent of Node. Oak is like an equivalent of Express. Actually, the successor of Express that came out recently is Koa (on Node). Oak is the Koa equivalent for Deno. Deno is used for one time HTTPS requests. We intend to use Go for our realtime server.

### Frontend

React web application.

### Database

I was thinking of using PostgreSQL instead of MySQL. It's the same thing but I think it's better these days for production applications.

## Setup

This setup assumes you clone the server repository in your home folder ($HOME or ~).

<<<<<<< HEAD

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

We then need to replace the following line in _/etc/postgresql/12/main/pg_hba.conf_:

```bash
local   all             postgres                                peer
```

With this one (basically change peer to md5):

```bash
local   all             postgres                                md5
```

This will let us execute SQL scripts to modify the database, which is needed for our migrations workflow.

=======

> > > > > > > parent of 2de2b11... merged userReg into master

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

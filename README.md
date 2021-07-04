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

### Initial Setup

#### Install Deno

##### Linux and Mac

```bash
curl -fsSL https://deno.land/x/install/install.sh | sh
```

Add the following two lines to ~/.bashrc (on Linux).

```bash
export DENO_INSTALL="/$HOME/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"
```

##### Windows

```powershell
iwr https://deno.land/x/install/install.ps1 -useb | iex
```

#### Server Installation and Execution

##### Clone the Repository

```bash
git clone https://github.com/mathieu-godin/licode
```
##### Build the Frontend Application

Make sure you have Node.js installed (and as such npm). React needs this.

```bash
cd licode/react-app
npm run build
```
##### Set Backend Server Environment Variables

```bash
export DENO_DIR="$HOME/licode/packages"
export LICODE_PORT=3000
```
If you want these environment variables to still be there when you reboot your system, add the above two lines to ~/.profile (Linux).

DENO_DIR allows us to save the packages we use in our licode repository. The packages are what we import using URLs at the top of our .ts files. For now, we will run our server on port 3000. We set it with the LICODE_PORT environment variable.

##### Run the Server

```bash
cd ..
deno run --allow-net --allow-env --allow-read mod.ts 
```

If you go to localhost:3000 on your web browser, you should see a default React application.

### Useful Things to Know

#### How to Reload Packages

All the packages being used by our Deno server were downloaded to the packages folder the first time we ran "deno run ...".
To reload the packages, run the following.

```bash
deno run --allow-net --allow-env --allow-read --reload mod.ts 
```

#### How to Not Have to Restart the Server Each Time a Change Is Made

##### Install Denon

```bash
deno install -qAf --unstable https://deno.land/x/denon/denon.ts
```

##### Start Server That Doesn't Need to Be Restarted When a Change Is Made

```bash
denon run --allow-net --allow-env --allow-read mod.ts 
```

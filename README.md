# licode

A confrontational coding platform.

## Technologies

### Backend

Deno server using Oak. Deno is like an equivalent of Node. Oak is like an equivalent of Express. Actually, the successor or Express that came out recently is Koa (on Node). Oak is the Koa equivalent for Deno. Deno is used for one time HTTPS requests. We intend to use Go for our realtime server.

### Frontend

React web application.

### Database

I was thinking of using PostgreSQL instead of MySQL. It's the same thing but I think it's better these days for production applications.

## Setup

This setup assumes you clone the server repository in your home ($HOME or ~) folder.

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

```bash
git clone https://github.com/mathieu-godin/licode
cd licode
export DENO_DIR="$HOME/licode/packages"
deno run --allow-net mod.ts 
```

DENO_DIR allows us to save the packages we use in our licode repository. The packages are what we import using URLs at the top of our .ts files.

#### Have DENO_DIR Permanently Set On Your System

Add the following line to ~/.profile (on Linux).

```bash
export DENO_DIR="$HOME/licode/packages"
```

### Reload Packages

```bash
deno run --allow-net --reload mod.ts 
```

### Not Have to Restart the Server Each Time a Change Is Made

#### Install Denon

```bash
deno install -qAf --unstable https://deno.land/x/denon/denon.ts
```

#### Start Server That Doesn't Need to Be Restarted When a Change Is Made

```bash
denon run --allow-net mod.ts 
```

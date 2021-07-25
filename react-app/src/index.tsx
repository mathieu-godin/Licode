//import { config } from 'https://deno.land/x/dotenv/mod.ts';
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import Auth0ProviderWithHistory  from "./auth/auth0-provider-with-history.js";

//config({export: true});

//const authDomain = "dev-vakl44ek.us.auth0.com"
//const authClient = "PyykIoYBm39EUgeLnJ1WBuHhSg94EU0z"

ReactDOM.render(
  <BrowserRouter>
    <Auth0ProviderWithHistory>
      <App />
    </Auth0ProviderWithHistory>
  </BrowserRouter>,
  document.getElementById("root")
);

import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import SignupButton from "./signup-button.js"
import LoginButton from "./login-button.js";
import LogoutButton from "./logout-button.js";
import Profile from "./profile.js";

const AuthButtons = () => {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <div>Loading ...</div>;
  }

  return (
    isAuthenticated ? 
    (
      <>
        <div>
          <Profile/>
        </div>
        <div>
          <LogoutButton/>
        </div>
      </>
    ) :
    (
      <>
        <div>
          <LoginButton/>
        </div>
        <div>
          <SignupButton/>
        </div>
      </>
    )
  );
};

export default AuthButtons;
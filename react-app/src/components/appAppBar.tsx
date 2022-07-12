import * as React from 'react';
import { Box, Link, Typography } from '@mui/material';
import AppBar from "./common/appBar";
import Toolbar from "./common/toolBar";
import LCButton from "./common/lcButton";

const rightLink = {
  fontSize: 16,
  color: 'common.white',
  ml: 3,
};

function AppAppBar() {
  return (
    <div>
      <AppBar position="fixed">
        <Toolbar sx={{ justifyContent: 'space-between', backgroundColor: '#000000' }}>
          <Box sx={{ flex: 1 }} />
          <Typography variant="mainTitle" sx={{ color: '#ffffff' }}>
          licode
          </Typography>
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <LCButton href="/signin" sx={{color: '#ffffff' }}>
                Sign In
            </LCButton>
            <LCButton href="/register" sx={{color: '#ffffff' }}>
                Sign Up
            </LCButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Toolbar />
    </div>
  );
}

export default AppAppBar;
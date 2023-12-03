import * as React from 'react';
import { Box, Link, Typography } from '@mui/material';
import AppBar from "./common/appBar";
import Toolbar from "./common/toolBar";
import LCButton from "./common/lcButton";
import { ThemeProvider } from '@mui/material/styles';
import editorTheme from './themes/editorTheme';

const rightLink = {
  fontSize: 16,
  color: 'common.white',
  ml: 3,
};

export interface GreetingProps {
    username: string,
    loaded: boolean,
}

function Greeting(props: GreetingProps) {
    const loaded: boolean = props.loaded;
    if (loaded) {
        return <Typography variant="h6" sx={{ mr: 55, color: '#ffffff'}}>Welcome, {props.username}</Typography>;
    } else {
        return <Typography variant="h6" sx={{ mr: 55, display: "none"  }} />;
    }
}

export interface AppAppBarProps {
    hasToken: boolean;
    username: string;
}

function AppAppBar(props: AppAppBarProps) {
    if (props.hasToken) {
        return (
            <ThemeProvider theme={editorTheme}>
                <div>
                    <AppBar position="fixed">
                    <Toolbar sx={{  justifyContent: 'space-between', backgroundColor: '#000000' }}>
                        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                            <Greeting loaded={props.hasToken} username={props.username} />
                        </Box>
                        <Typography variant="mainTitle" sx={{ color: '#ffffff'}}>
                            licode
                        </Typography>
                        <Box sx={{ flex: 1 }} />
                    </Toolbar>
                    </AppBar>
                    <Toolbar />
                </div>
            </ThemeProvider>
        );
    } else {
        return (
            <ThemeProvider theme={editorTheme}>
                <div>
                    <AppBar position="fixed">
                    <Toolbar sx={{ justifyContent: 'space-between', backgroundColor: '#000000' }}>
                        <Box sx={{ flex: 1 }} />
                        <Typography variant="mainTitle" sx={{ color: '#ffffff' }}>
                            licode
                        </Typography>
                        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                            <LCButton href="/licode/signin" sx={{color: '#ffffff' }}>
                                Sign In
                            </LCButton>
                            <LCButton href="/licode/register" sx={{color: '#ffffff' }}>
                                Sign Up
                            </LCButton>
                        </Box>
                    </Toolbar>
                    </AppBar>
                    <Toolbar />
                </div>
            </ThemeProvider>
        );
    }
}

export default AppAppBar;
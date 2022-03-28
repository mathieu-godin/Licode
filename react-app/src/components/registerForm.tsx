import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import FormErrorMessage from "./common/formErrorMessage";

function Copyright(props: any) {
  return (
    <Typography variant="body2" color="text.secondary" align="center" {...props}>
      {'Copyright © '}
      <Link color="inherit" href="https://licode.ca/">
        licode
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

interface User {
  email: { value: string };
  username: { value: string };
  password: { value: string };
}

const theme = createTheme();

export interface RegisterFormProps {
    setToken: Function
}

export interface RegisterFormState {
    errorMessage: string;
}

class RegisterForm extends React.Component<RegisterFormProps, RegisterFormState> {
    constructor(props: RegisterFormProps) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.state = { errorMessage: '' };
    }
    
    async handleSubmit (e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        /*let user: User = {
            email: { value: '' },
            username: { value: '' },
            password: { value: '' },
        }
        user.email.value = (e.target as typeof e.target & User).email.value;
        user.username.value = (e.target as typeof e.target & User).username.value;
        user.password.value = (e.target as typeof e.target & User).password.value;
        try {
            let res = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(user),
            }).then(response => response.json());
            if (res.text) {
                this.setState({ errorMessage: res.text });
            } else {
                this.props.setToken();
            }
        } catch (err) {
            console.log(err);
        }*/
        this.props.setToken();
    };

    render() {
        const errorMessage  = this.state.errorMessage;
        return (
            <ThemeProvider theme={theme}>
            <Container component="main" maxWidth="xs">
                <CssBaseline />
                <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
                >
                <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                    <LockOutlinedIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                    Sign up
                </Typography>
                <Box component="form" noValidate onSubmit={this.handleSubmit} sx={{ mt: 3 }}>
                    <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                        required
                        fullWidth
                        id="username"
                        label="Username"
                        name="username"
                        autoComplete="username"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="new-password"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                        required
                        fullWidth
                        name="confirmpassword"
                        label="Confirm Password"
                        type="confirmpassword"
                        id="confirmpassword"
                        autoComplete="new-password"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FormErrorMessage message={errorMessage} />
                    </Grid>
                    <Grid item xs={12}>
                        <FormControlLabel
                        control={<Checkbox value="allowExtraEmails" color="primary" />}
                        label="I want to receive licode updates via email"
                        />
                    </Grid>
                    </Grid>
                    <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                    >
                    Sign Up
                    </Button>
                    <Grid container justifyContent="flex-end">
                    <Grid item>
                        <Link href="signin" variant="body2">
                        Already have an account? Sign in
                        </Link>
                    </Grid>
                    </Grid>
                </Box>
                </Box>
                <Copyright sx={{ mt: 5 }} />
            </Container>
            </ThemeProvider>
        );
    }
}

export default RegisterForm;
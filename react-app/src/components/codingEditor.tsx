import * as React from "react";
import { Box, Typography, Grid } from '@mui/material';

export interface FormProps {}

export interface FormState {
    data: { [name: string]: string };
}

class CodingEditor extends React.Component<FormProps, FormState> {
    state = {
        data: { username: "", password: "", name: "" },
        errors: {},
    };

    doSubmit = () => {
        // Call the server
        console.log("Submitted");
    };

    render() {
        return (
            <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'primary.main', m: 0, p: 0 }}>
                <Grid container direction="column">
                    sdfdsf
                </Grid>
            </Box>
        );
    }
}

export default CodingEditor;
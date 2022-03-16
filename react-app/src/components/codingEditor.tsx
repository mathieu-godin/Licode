import * as React from "react";
import { Box, Typography, Grid, Button, IconButton, TextField } from '@mui/material';
import { ButtonProps } from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { ThemeProvider } from '@mui/material/styles';
import editorTheme from './themes/editorTheme';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SpeedIcon from '@mui/icons-material/Speed';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';

export interface FormProps {}

export interface FormState {}

const ColorButton = styled(Button)<ButtonProps>(({ theme }) => ({
    color: theme.palette.getContrastText('#268acd'),
    backgroundColor: '#268acd',
    '&:hover': {
      backgroundColor: '#1468ab',
    },
}));

class CodingEditor extends React.Component<FormProps, FormState> {
    render() {
        const leftEditorCode: string = "for i in range(150):\n    if i < 5:\n        print(i)";
        return (
            <ThemeProvider theme={editorTheme}>
                <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'primary.main', m: 0, p: 0 }}>
                    <Grid container direction="column">
                        <Grid item xs={0.5} />
                        <Grid container item xs={2}>
                            <Grid item xs={1} />
                            <Grid container direction="column" item xs={10}>
                                <Grid item xs="auto">
                                    <Typography variant="problemDescription" sx={{ m: 0, p: 0 }}>
                                        Given an array of integers
                                    </Typography>
                                    <Typography variant="problemHighlightedWord" sx={{ m: 0, p: 0 }}>
                                        &nbsp;nums
                                    </Typography>
                                    <Typography variant="problemDescription" sx={{ m: 0, p: 0 }}>
                                        &nbsp;and an integer
                                    </Typography>
                                    <Typography variant="problemHighlightedWord" sx={{ m: 0, p: 0 }}>
                                        &nbsp;target
                                    </Typography>
                                    <Typography variant="problemDescription" sx={{ m: 0, p: 0 }}>
                                        ,
                                    </Typography>
                                    <Typography variant="problemDescription" sx={{ m: 0, p: 0 }}>
                                        &nbsp;return
                                    </Typography>
                                    <Typography variant="problemDescriptionItalic" sx={{ m: 0, p: 0 }}>
                                        &nbsp;indices of the two numbers such that they add up to
                                    </Typography>
                                    <Typography variant="problemHighlightedItalicWord" sx={{ m: 0, p: 0 }}>
                                        &nbsp;target
                                    </Typography>
                                    <Typography variant="problemDescription" sx={{ m: 0, p: 0 }}>
                                        .
                                    </Typography>
                                </Grid>
                                <Grid item xs={2} />
                                <Grid item xs="auto">
                                    <Typography variant="problemDescription" sx={{ m: 0, p: 0 }}>
                                        You may assume that each input would have
                                    </Typography>
                                    <Typography variant="problemDescriptionItalic" sx={{ m: 0, p: 0 }}>
                                        &nbsp;exactly
                                    </Typography>
                                    <Typography variant="problemDescription" sx={{ m: 0, p: 0 }}>
                                        &nbsp;one solution, and you may not use the
                                    </Typography>
                                    <Typography variant="problemDescriptionItalic" sx={{ m: 0, p: 0 }}>
                                        &nbsp;same
                                    </Typography>
                                    <Typography variant="problemDescription" sx={{ m: 0, p: 0 }}>
                                        &nbsp;element twice.
                                    </Typography>
                                </Grid>
                                <Grid item xs={2} />
                                <Grid item xs="auto">
                                    <Typography variant="problemDescription" sx={{ m: 0, p: 0 }}>
                                        You can return the answer in any order.
                                    </Typography>
                                </Grid>
                            </Grid>
                            <Grid item xs ={1} />
                        </Grid>
                        <Grid container item xs={8}>
                            <Grid item xs={0.75} />
                            <Grid container direction="column" item xs={5}>
                                <Grid container item xs={3}>
                                    <Grid item xs={0.5} />
                                    <Grid container direction="column" item xs={11}>
                                        <Grid item xs={4}>
                                            <Typography variant="aboveEditor" sx={{ m: 0, p: 0 }}>
                                                You: Rank 138
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <IconButton color="button">
                                                <CheckCircleIcon sx={{ fontSize: 32 }} />
                                            </IconButton>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Typography variant="aboveEditor" sx={{ m: 0, p: 0 }}>
                                                Question 1/3
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={0.5} />
                                </Grid>
                                <Grid item xs={7}>
                                    <TextField id="filled-multiline-static" multiline fullWidth rows={15} variant="filled"
                                        defaultValue={leftEditorCode} />
                                </Grid>
                                <Grid container item xs={2}>
                                    <Grid item xs={0.5} />
                                    <Grid container direction="column" item xs={11}>
                                        <Grid item xs={1} />
                                        <Grid item xs="auto">
                                            <Typography variant="aboveEditor" sx={{ m: 0, p: 0 }}>
                                                Test Cases
                                            </Typography>
                                        </Grid>
                                        <Grid container item xs="auto">
                                            <Grid item xs={0.5} />
                                            <Grid item xs={1}>
                                                <CheckIcon sx={{ fontSize: 60, color: 'primary.checkmark' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CheckIcon sx={{ fontSize: 60, color: 'primary.checkmark' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CheckIcon sx={{ fontSize: 60, color: 'primary.checkmark' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CheckIcon sx={{ fontSize: 60, color: 'primary.checkmark' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CloseIcon sx={{ fontSize: 60, color: 'primary.cross' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CloseIcon sx={{ fontSize: 60, color: 'primary.cross' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CloseIcon sx={{ fontSize: 60, color: 'primary.cross' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CloseIcon sx={{ fontSize: 60, color: 'primary.cross' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CloseIcon sx={{ fontSize: 60, color: 'primary.cross' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CloseIcon sx={{ fontSize: 60, color: 'primary.cross' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CloseIcon sx={{ fontSize: 60, color: 'primary.cross' }} />
                                            </Grid>
                                            <Grid item xs={0.5} />
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={0.5} />
                                </Grid>
                            </Grid>
                            <Grid item xs={0.5} />
                            <Grid container direction="column" item xs={5}>
                            <Grid container item xs={3}>
                                    <Grid item xs={0.5} />
                                    <Grid container direction="column" item xs={11}>
                                        <Grid item xs={4}>
                                            <Typography variant="aboveEditor" sx={{ m: 0, p: 0 }}>
                                                Alex: Rank 150
                                            </Typography>
                                        </Grid>
                                        <Grid container item xs={4}>
                                            <Grid item xs="auto">
                                                <IconButton color="button">
                                                    <SpeedIcon sx={{ fontSize: 32 }} />
                                                </IconButton>
                                            </Grid>
                                            <Grid item xs="auto">
                                                <Typography variant="buttonExponent" sx={{ m: 0, p: 0 }}>
                                                    2
                                                </Typography>
                                            </Grid>
                                            <Grid item xs="auto">
                                                <IconButton color="button">
                                                    <RemoveRedEyeIcon sx={{ fontSize: 32 }} />
                                                </IconButton>
                                            </Grid>
                                            <Grid item xs="auto">
                                                <Typography variant="buttonExponent" sx={{ m: 0, p: 0 }}>
                                                    1
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Typography variant="aboveEditor" sx={{ m: 0, p: 0 }}>
                                                Question 2/3
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={0.5} />
                                </Grid>
                                <Grid item xs={7}>
                                    <TextField id="filled-multiline-static" multiline fullWidth rows={15} variant="filled" />
                                </Grid>
                                <Grid container item xs={2}>
                                    <Grid item xs={0.5} />
                                    <Grid container direction="column" item xs={11}>
                                        <Grid item xs={1} />
                                        <Grid item xs="auto">
                                            <Typography variant="aboveEditor" sx={{ m: 0, p: 0 }}>
                                                Test Cases
                                            </Typography>
                                        </Grid>
                                        <Grid container item xs="auto">
                                            <Grid item xs={0.5} />
                                            <Grid item xs={1}>
                                                <CheckIcon sx={{ fontSize: 60, color: 'primary.checkmark' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CheckIcon sx={{ fontSize: 60, color: 'primary.checkmark' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CheckIcon sx={{ fontSize: 60, color: 'primary.checkmark' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CheckIcon sx={{ fontSize: 60, color: 'primary.checkmark' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CloseIcon sx={{ fontSize: 60, color: 'primary.cross' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CloseIcon sx={{ fontSize: 60, color: 'primary.cross' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CloseIcon sx={{ fontSize: 60, color: 'primary.cross' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CloseIcon sx={{ fontSize: 60, color: 'primary.cross' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CloseIcon sx={{ fontSize: 60, color: 'primary.cross' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CloseIcon sx={{ fontSize: 60, color: 'primary.cross' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CloseIcon sx={{ fontSize: 60, color: 'primary.cross' }} />
                                            </Grid>
                                            <Grid item xs={0.5} />
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={0.5} />
                                </Grid>
                            </Grid>
                            <Grid item xs={0.75} />
                        </Grid>
                        <Grid item xs={0.25} />
                        <Grid container item xs={1}>
                            <Grid item xs={0.5} />
                            <Grid item xs={1.5}>
                                <ColorButton variant="contained" sx={{ minWidth: 125, fontSize: 24 }}>Run</ColorButton>
                            </Grid>
                            <Grid item xs={10} />
                        </Grid>
                        <Grid item xs={0.25} />
                    </Grid>
                </Box>
            </ThemeProvider>
        );
    }
}

export default CodingEditor;
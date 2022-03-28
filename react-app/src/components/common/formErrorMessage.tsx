import React, { Component } from "react";
import Typography from '@mui/material/Typography';

export interface FormProps {
    message: string,
}

export interface FormState {}

class FormErrorMessage extends React.Component<FormProps, FormState> {
    render() {
        return (
            <Typography sx={{ display: 'inline', color: '#ff0000' }}>{this.props.message}</Typography>
        );
    }
}

export default FormErrorMessage;
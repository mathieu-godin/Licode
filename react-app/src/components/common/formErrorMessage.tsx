import React, { Component } from "react";
import Typography from '@mui/material/Typography';

export interface FormProps {
    message: string,
    keepFormatting: boolean,
}

export interface FormState {}

class FormErrorMessage extends React.Component<Partial<FormProps>, FormState> {
    render() {
        const text = (<Typography sx={{ display: 'inline', color: '#ff0000' }}>{this.props.message}</Typography>);
        if ((this.props.message ?? "") !== "" && (this.props.keepFormatting ?? false)) {
            return (
                <pre style={{ fontFamily: 'inherit' }}>
                    {text}
                </pre>
            );
        }
        return text;
    }
}

export default FormErrorMessage;
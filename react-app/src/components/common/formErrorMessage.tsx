import React, { Component } from "react";
import Typography from '@mui/material/Typography';

export interface FormProps {
    message: string,
    keepFormatting: boolean,
}

export interface FormState {}

class FormErrorMessage extends React.Component<Partial<FormProps>, FormState> {
    render() {
        if ((this.props.message ?? "") !== "") {
            const text = (<div style={{ paddingLeft: 16, paddingTop: 16 }}><Typography sx={{ display: 'inline', color: '#ff0000'}}>{this.props.message}</Typography></div>);
            if (this.props.keepFormatting ?? false) {
                return (
                    <pre style={{ fontFamily: 'inherit' }}>
                        {text}
                    </pre>
                );
            }
            return text;
        }
        return <div style={{display: 'none'}}></div>
    }
}

export default FormErrorMessage;
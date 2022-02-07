import React, { Component } from "react";
import Input from "./input";

export interface FormProps {}

export interface FormState {
    data: { [name: string]: string };
}

class Form extends React.Component<FormProps, FormState> {
    state = {
        data: {},
        errors: {},
    };

    validate = () => {
        const options = { abortEarly: false };
        return false;
    };

    handleSubmit = () => {
        return null;
    };

    handleChange = ({ currentTarget: input }: { currentTarget: {name: string, value: string} }) => {
        
    };

    renderButton(label: string) {
        return (
            <button disabled={this.validate()} className="btn btn-primary">
                {label}
            </button>
        );
    }

    renderInput(name: string, label: string) {
        const { data, errors } = this.state;
        return (
            <Input
                name={name}
                label={label}
                error=""
            />
        );
    }
}

export default Form;
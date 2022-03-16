import * as React from "react";

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
            <div>
                sdfsfsdf
            </div>
        );
    }
}

export default CodingEditor;
import React from 'react';
import CodingEditor, {CodingEditorProps} from './codingEditor';

export interface CodingEditorWaiterState {
    otherPlayerAvailable: boolean
}

class CodingEditorWaiter extends React.Component<CodingEditorProps, CodingEditorWaiterState> {
    constructor(props: CodingEditorProps) {
        super(props)
        this.state = {
            otherPlayerAvailable: false,
        }
    }
    render() {
        if(this.state.otherPlayerAvailable) {
            return (
                <CodingEditor id={1}/>
            );
        } else {
            return (
                <div> Waiting for another player to join . . . </div>
            );
        }
    }
}

export default CodingEditorWaiter;
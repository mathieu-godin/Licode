import React from 'react';
import CodingEditor from './codingEditor';

const CodingEditorWaiter = () => {
    let otherPlayerAvailable = false;
    if (otherPlayerAvailable) {
        return (
            <CodingEditor />
        );
    }
    return (
        <div />
    );
}

export default CodingEditorWaiter;
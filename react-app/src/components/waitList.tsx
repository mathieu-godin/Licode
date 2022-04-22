import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const WaitList = () => {
    const navigate = useNavigate();
    useEffect(() => {
        fetch('/api/matchmaking').then(response => response.json()).then((json) => { navigate('/editor'); });
    }, []);
    return (
        <div>Waiting to be matched with another player . . . </div>
    );
}

export default WaitList;
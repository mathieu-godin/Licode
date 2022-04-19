import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const WaitList = () => {
    const navigate = useNavigate();
    useEffect(() => {
        fetch('/api/matchmaking').then(response => response.json()).then((json) => {
            console.log("AAA");
            console.log(json.username);
            console.log(json.opponentUsername);
            console.log(json.eloRating);
            console.log(json.opponentEloRating);
            console.log("BBB");
        })
        //navigate('/editor');
    });
    /*setTimeout(function() {
        document.getElementsByTagName('div')[0].click();
    }, 100);*/
    return (
        <div>Waiting to be matched with another player . . . </div>
    );
}

export default WaitList;
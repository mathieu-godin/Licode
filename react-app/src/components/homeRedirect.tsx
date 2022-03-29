import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HomeRedirect = () => {
    const navigate = useNavigate();
    useEffect(() => {
        navigate('/');
    });
    setTimeout(function() {
        document.getElementsByTagName('div')[0].click();
    }, 100);
    return (
        <div />
    );
}

export default HomeRedirect;
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HomeRedirect = () => {
    const navigate = useNavigate();
    useEffect(() => {
        navigate('/');
    });
    return (
        <div />
    );
}

export default HomeRedirect;
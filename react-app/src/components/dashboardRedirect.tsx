import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardRedirect = () => {
    const navigate = useNavigate();
    useEffect(() => {
        navigate('/dashboard');
    });
    setTimeout(function() {
        document.getElementsByTagName('div')[0].click();
    }, 100);
    return (
        <div />
    );
}

export default DashboardRedirect;
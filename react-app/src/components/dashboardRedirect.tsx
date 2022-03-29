import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardRedirect = () => {
    const navigate = useNavigate();
    useEffect(() => {
        navigate('/dashboard');
    });
    return (
        <div />
    );
}

export default DashboardRedirect;
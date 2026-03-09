import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const Auth = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { success, error: showError } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = isLogin ? 'login' : 'register';
        const apiUrl = `${process.env.REACT_APP_API_URL || ''}/api/auth/${endpoint}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok && data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                onLogin(data.user);
                success(isLogin ? 'Welcome back!' : 'Account created successfully!');
                navigate('/');
            } else {
                setError(data.error || 'An error occurred.');
                showError(data.error || 'An error occurred.');
            }
        } catch (error) {
            console.error('Auth error:', error);
            const errorMsg = 'Unable to connect to server. Please try again.';
            setError(errorMsg);
            showError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </div>
                    <h2>{isLogin ? 'Welcome Back' : 'Join CaptureNest'}</h2>
                    <p>{isLogin ? 'Enter your credentials to access your gallery' : 'Create your account to start capturing memories'}</p>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            placeholder="Type your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoComplete="username"
                            className="input-field"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete={isLogin ? 'current-password' : 'new-password'}
                            className="input-field"
                        />
                    </div>

                    <button type="submit" disabled={loading} className="primary-btn full-width">
                        {loading ? <span className="loader" /> : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        {isLogin ? "New here? " : "Already have an account? "}
                        <button onClick={() => setIsLogin(!isLogin)} className="link-btn">
                            {isLogin ? 'Create Account' : 'Sign In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;

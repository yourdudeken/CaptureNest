import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const Settings = ({ onLogout }) => { // Accept onLogout prop
    const { theme, toggleTheme } = useTheme();
    const user = JSON.parse(localStorage.getItem('user'));

    // Add Simple Icons locally since they are not exported from App.jsx
    const SunIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
    const MoonIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;

    if (!user) return null;

    return (
        <div className="page-container settings-page">
            <div className="profile-section">
                <div className="profile-card">
                    <div className="profile-avatar">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="profile-info">
                        <h2>{user.username}</h2>
                        <p className="profile-email">User ID: {user.id}</p>
                    </div>
                </div>
            </div>

            <div className="settings-list">
                <div className="settings-item">
                    <div className="item-left">
                        <div className="item-icon">
                            {theme === 'light' ? <SunIcon /> : <MoonIcon />}
                        </div>
                        <span>Dark Mode</span>
                    </div>
                    <div className="item-right">
                        <button
                            className={`theme-toggle-switch ${theme}`}
                            onClick={toggleTheme}
                            aria-label="Toggle Theme"
                        >
                            <div className="toggle-track">
                                <span className="toggle-icon sun"><SunIcon /></span>
                                <span className="toggle-icon moon"><MoonIcon /></span>
                                <div className="toggle-thumb" />
                            </div>
                        </button>
                    </div>
                </div>

                <div className="settings-item danger-item" onClick={onLogout}>
                    <div className="item-left">
                        <div className="item-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        </div>
                        <span>Log Out</span>
                    </div>
                </div>
            </div>

            <div className="app-version">
                v1.0.0 • CaptureNest
            </div>
        </div>
    );
};

export default Settings;

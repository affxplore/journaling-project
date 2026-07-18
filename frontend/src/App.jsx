import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://54.224.248.145:3000/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [activeTab, setActiveTab] = useState('home');
  
  // Auth state
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');

  // Journals state
  const [journals, setJournals] = useState([]);
  const [newEntry, setNewEntry] = useState({ title: '', content: '' });

  useEffect(() => {
    if (token) {
      fetchJournals();
    }
  }, [token]);

  const fetchJournals = async () => {
    try {
      const res = await axios.get(`${API_URL}/journals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJournals(res.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
      }
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const endpoint = authMode === 'login' ? '/login' : '/register';
      const res = await axios.post(`${API_URL}${endpoint}`, authForm);
      
      if (authMode === 'login') {
        setToken(res.data.token);
        setUsername(res.data.username);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('username', res.data.username);
      } else {
        setAuthMode('login');
        setAuthError('Registered! Please login.');
      }
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Authentication failed');
    }
  };

  const handleEntrySubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/journals`, newEntry, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewEntry({ title: '', content: '' });
      setActiveTab('home');
      fetchJournals();
    } catch (err) {
      console.error(err);
    }
  };

  const logout = () => {
    setToken(null);
    setUsername('');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  };

  if (!token) {
    return (
      <div className="app-container">
        <div className="auth-container">
          <div className="auth-box">
            <h2 className="pixel-font" style={{ color: 'var(--dark-pink)', marginBottom: '20px' }}>
              {authMode === 'login' ? 'LOGIN' : 'REGISTER'}
            </h2>
            {authError && <p style={{ color: 'red', fontSize: '0.8rem', marginBottom: '10px' }}>{authError}</p>}
            <form onSubmit={handleAuthSubmit}>
              <div className="input-group">
                <input 
                  type="text" 
                  placeholder="Username" 
                  value={authForm.username}
                  onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
                  required 
                />
              </div>
              <div className="input-group">
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={authForm.password}
                  onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                  required 
                />
              </div>
              <button type="submit" className="pixel-btn">
                {authMode === 'login' ? 'START' : 'CREATE'}
              </button>
            </form>
            <p 
              style={{ marginTop: '20px', cursor: 'pointer', fontSize: '0.8rem' }}
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            >
              {authMode === 'login' ? 'Need an account? Register' : 'Have an account? Login'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="brand">
          <span className="pixel-font">🍓 PIXEL JOURNAL</span>
        </div>
        <div className="nav-menu">
          <div 
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            📋 My Journals
          </div>
          <div 
            className={`nav-item ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => setActiveTab('new')}
          >
            ✨ New Entry
          </div>
          <div 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            🐱 Profile
          </div>
        </div>
        <div style={{ marginTop: 'auto', textAlign: 'center' }}>
          <button className="pixel-btn" style={{ background: '#ff7f50', borderColor: '#ff4500', boxShadow: '0 4px 0 #ff4500' }} onClick={logout}>
            LOGOUT
          </button>
        </div>
      </div>
      
      <div className="main-area">
        {activeTab === 'home' && (
          <>
            <h2 className="header-title pixel-font">MY JOURNALS</h2>
            <div className="journal-grid">
              {journals.length === 0 ? (
                <p style={{ zIndex: 1 }}>No journals yet! Create one.</p>
              ) : (
                journals.map(journal => (
                  <div key={journal.id} className="journal-card">
                    <div className="journal-title">{journal.title}</div>
                    <div className="journal-content">{journal.content}</div>
                    <div className="journal-date">{new Date(journal.timestamp).toLocaleDateString()}</div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'new' && (
          <>
            <h2 className="header-title pixel-font">NEW ENTRY</h2>
            <form className="new-entry-form" onSubmit={handleEntrySubmit}>
              <input 
                type="text" 
                placeholder="Title..." 
                value={newEntry.title}
                onChange={(e) => setNewEntry({...newEntry, title: e.target.value})}
                required
              />
              <textarea 
                placeholder="Dear diary..." 
                value={newEntry.content}
                onChange={(e) => setNewEntry({...newEntry, content: e.target.value})}
                required
              />
              <button type="submit" className="pixel-btn" style={{ width: 'auto', alignSelf: 'flex-start' }}>SAVE ENTRY</button>
            </form>
          </>
        )}

        {activeTab === 'profile' && (
          <>
            <h2 className="header-title pixel-font">PROFILE</h2>
            <div style={{ zIndex: 1, textAlign: 'center', marginTop: '50px' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🐱</div>
              <p>Welcome back,</p>
              <h3 className="pixel-font" style={{ marginTop: '10px', color: 'var(--dark-pink)' }}>{username}</h3>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;

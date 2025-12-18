import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './styles.css';
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import MyEvents from './pages/MyEvents';
import EditEvent from './pages/EditEvent';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('dark') === '1');

  useEffect(() => {
    if (dark) document.body.classList.add('dark'); else document.body.classList.remove('dark');
    localStorage.setItem('dark', dark ? '1' : '0');
  }, [dark]);

  return (
    <BrowserRouter>
      <div className="App">
        <header className="top-nav">
          <div className="app-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="brand">MiniEvent</div>
              <button onClick={() => setDark(d => !d)} className="btn secondary dark-btn">{dark ? 'Light' : 'Dark'}</button>
            </div>

            <div className="nav-links">
              {localStorage.getItem('token') ? (
                <>
                  <Link to="/dashboard" className="nav-btn">Dashboard</Link>
                  <Link to="/create" className="nav-btn">Create</Link>
                  <Link to="/my-events" className="nav-btn">My Events</Link>
                  <button className="nav-btn nav-logout" onClick={() => { localStorage.removeItem('token'); window.location.href = '/'; }}>Log out</button>
                </>
              ) : (
                <>
                  <Link to="/" className="nav-btn">Login</Link>
                  <Link to="/signup" className="nav-btn">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="content">
          <div className="app-container">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/create" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
              <Route path="/my-events" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />
              <Route path="/events/:id/edit" element={<ProtectedRoute><EditEvent /></ProtectedRoute>} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

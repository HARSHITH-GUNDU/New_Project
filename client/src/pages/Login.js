import React, { useState } from 'react';
import api from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      window.location.href = '/dashboard';
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

    return (
      <div className="app-container">
        <div className="card" style={{ maxWidth: 420, margin: '24px auto' }}>
          <h3 style={{ marginTop: 0 }}>Log in to MiniEvent</h3>
          <form className="form" onSubmit={submit}>
            <label>Email
              <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            </label>
            <label style={{ marginTop: 8 }}>Password
              <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </label>
            <div style={{ marginTop: 12 }}>
              <button className="btn" type="submit">Login</button>
              <a href="/signup" className="btn secondary" style={{ marginLeft: 8 }}>Create account</a>
            </div>
          </form>
        </div>
      </div>
    );
}

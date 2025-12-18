import React, { useState } from 'react';
import api from '../api';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/signup', { name, email, password });
      // After successful signup, redirect to login page
      window.location.href = '/';
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="app-container">
      <div className="card" style={{ maxWidth: 420, margin: '24px auto' }}>
        <h3 style={{ marginTop: 0 }}>Create your account</h3>
        <form className="form" onSubmit={submit}>
          <label>Name
            <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
          </label>
          <label style={{ marginTop: 8 }}>Email
            <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          <label style={{ marginTop: 8 }}>Password
            <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </label>
          <div style={{ marginTop: 12 }}>
            <button className="btn" type="submit">Sign Up</button>
            <a href="/login" className="btn secondary" style={{ marginLeft: 8 }}>Already have an account</a>
          </div>
        </form>
      </div>
    </div>
  );
}

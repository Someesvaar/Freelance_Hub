import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import "../App.css";


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // clear previous errors
    try {
      // Call login and handle different return styles:
      //  - some login() implementations return a boolean
      //  - others return an object (e.g. { ok: true, user } or token)
      //  - some throw when response status is 401/400
      const result = await login(email, password);

      // If login returns boolean-like success:
      if (result === true) {
        navigate('/projects');
        return;
      }

      // If login returns an object with success flag:
      if (result && typeof result === 'object') {
        if (result.ok || result.success) {
          navigate('/projects');
          return;
        }
        // optional message from backend:
        const msg = result.message || result.error;
        setError(msg || 'Invalid email or password. Please try again.');
        return;
      }

      // Fallback when login returns falsy (e.g. false)
      if (!result) {
        setError('Invalid email or password. Please try again.');
      }
    } catch (err) {
      // Catch network/401 errors thrown by login()
      console.error('login error:', err);
      // If the error object contains a server message, use it:
      const serverMsg = err?.message || (err?.response && err.response.data && err.response.data.message);
      setError(serverMsg || 'Login failed. Check credentials and try again.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="login-card">
        <h2 className="login-title">Login</h2>
        {error && <p className="error-msg">{error}</p>}
        <form onSubmit={handleSubmit} className="form-group">
          <div>
            <label className="login-label">Email</label>
            <input type="email" className="login-input" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="login-label">Password</label>
            <input type="password" className="login-input" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="login-btn">Login</button>
        </form>
      </div>
    </div>
  );
}

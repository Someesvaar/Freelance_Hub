import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isFreelancer, setIsFreelancer] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const ok = await register(username, email, password, isFreelancer);
    if (ok) {
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } else {
      setError('Registration failed. Try different credentials.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="login-card">
        <h2 className="login-title">Register</h2>
        {error && <p className="error-msg" style={{display:'block',background:'rgba(255,100,100,0.8)'}}>{error}</p>}
        {success && <p className="error-msg" style={{display:'block',background:'rgba(100,255,100,0.8)'}}>{success}</p>}
        <form onSubmit={handleSubmit} className="form-group">
          <div>
            <label className="login-label">Username</label>
            <input type="text" className="login-input" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div>
            <label className="login-label">Email</label>
            <input type="email" className="login-input" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="login-label">Password</label>
            <input type="password" className="login-input" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div style={{display:'flex',alignItems:'center',marginBottom:'10px'}}>
            <input id="isFreelancer" type="checkbox" style={{height:'18px',width:'18px'}} checked={isFreelancer} onChange={e => setIsFreelancer(e.target.checked)} />
            <label htmlFor="isFreelancer" className="login-label" style={{marginLeft:'8px',marginBottom:0}}>I am a freelancer</label>
          </div>
          <button type="submit" className="login-btn">Register</button>
        </form>
      </div>
    </div>
  );
}

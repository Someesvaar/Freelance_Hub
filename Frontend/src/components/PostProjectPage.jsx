import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function PostProjectPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await axios.post('/projects', { title, description, budget: parseFloat(budget) });
      setSuccess('Project posted successfully! Redirecting...');
      setTimeout(() => navigate(`/project/${res.data.id}`), 1200);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to post project. Please try again.');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="card max-w-3xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Post a New Project</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {success && <p className="text-green-500 text-center mb-4">{success}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm mb-1">Project Title</label>
            <input type="text" className="form-input w-full" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Description</label>
            <textarea className="form-input w-full" rows="6" value={description} onChange={e => setDescription(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Budget ($)</label>
            <input type="number" className="form-input w-full" value={budget} onChange={e => setBudget(e.target.value)} required min="1" />
          </div>
          <button type="submit" className="btn btn-primary w-full px-4 py-2 bg-indigo-600 text-white rounded">Post Project</button>
        </form>
      </div>
    </div>
  );
}

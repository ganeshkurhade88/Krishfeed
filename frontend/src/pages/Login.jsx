import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', formData);
      // Backend returns: { success: true, data: { token, user } }
      const token = res.data?.data?.token;
      const user = res.data?.data?.user;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        window.location.href = '/dashboard';
      } else {
        setError('Login succeeded but no token received. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      if (!err.response) {
        setError('Cannot reach server. Make sure backend is running on port 5000.');
      } else {
        setError(err.response?.data?.message || 'Invalid phone number or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <div className="card space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-dark-green">Welcome Back! 🌾</h1>
          <p className="text-sm text-grey mt-1">Log in to manage your feed tests & marketplace listings.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label-text">Phone Number</label>
            <input 
              type="tel" 
              name="phone" 
              value={formData.phone} 
              onChange={handleInputChange} 
              className="input-field" 
              placeholder="e.g. 9876543210" 
              required 
            />
          </div>
          <div>
            <label className="label-text">Password</label>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleInputChange} 
              className="input-field" 
              placeholder="••••••••" 
              required 
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="text-center text-sm text-grey">
          Don't have an account?{' '}
          <Link to="/signup" className="text-mid-green font-bold hover:underline">
            Sign up here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

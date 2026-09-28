import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    password: '',
    district: '',
    state: 'Maharashtra',
    role: 'farmer',
    consent_given: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = { ...formData, consent_given: formData.consent_given ? 'true' : 'false' };
      const res = await api.post('/auth/register', payload);
      const token = res.data?.data?.token;
      const user = res.data?.data?.user;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        window.location.href = '/dashboard';
      } else {
        setError('Signup succeeded but no token received. Please log in manually.');
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.map(e => e.msg).join(', '));
      } else {
        setError(err.response?.data?.message || 'Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 mb-16 px-4">
      <div className="card space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-dark-green">Create Account 🌱</h1>
          <p className="text-sm text-grey mt-1">Join the smart feed network today.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="label-text">Full Name</label>
            <input 
              type="text" name="name" 
              value={formData.name} onChange={handleInputChange} 
              className="input-field" placeholder="e.g. Ramesh Patil" required 
            />
          </div>
          <div>
            <label className="label-text">Phone Number</label>
            <input 
              type="tel" name="phone" 
              value={formData.phone} onChange={handleInputChange} 
              className="input-field" placeholder="e.g. 9876543210" required 
            />
          </div>
          <div>
            <label className="label-text">Password (min 8 chars)</label>
            <input 
              type="password" name="password" minLength="8"
              value={formData.password} onChange={handleInputChange} 
              className="input-field" placeholder="••••••••" required 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">District</label>
              <select name="district" value={formData.district} onChange={handleInputChange} className="input-field" required>
                <option value="">Select...</option>
                <option value="Akola">Akola</option>
                <option value="Kolhapur">Kolhapur</option>
                <option value="Pune">Pune</option>
                <option value="Ahmednagar">Ahmednagar</option>
              </select>
            </div>
            <div>
              <label className="label-text">State</label>
              <input type="text" name="state" value={formData.state} className="input-field bg-gray-50" readOnly />
            </div>
          </div>

          <div className="flex items-start gap-3 mt-4 bg-light-grey p-3 rounded-lg">
            <input 
              type="checkbox" 
              name="consent_given" 
              id="consent_given"
              checked={formData.consent_given} 
              onChange={handleInputChange} 
              className="mt-1" required 
            />
            <label htmlFor="consent_given" className="text-xs text-grey">
              I agree to share my farm location data for disease tracking and understand this platform is an ICAR validated AI tool.
            </label>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center text-sm text-grey">
          Already have an account?{' '}
          <Link to="/login" className="text-mid-green font-bold hover:underline">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;

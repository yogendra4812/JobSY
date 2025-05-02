import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'https://jobsy-uye6.onrender.com';

const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only redirect to jobs on login flow
    if (isAuthenticated && !isSignUp) {
      navigate('/jobs');
    }
  }, [isAuthenticated, isSignUp, navigate]);

  const isPasswordStrong = (pwd: string) => {
    const hasLength = pwd.length >= 8;
    const hasDigitOrSymbol = /[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd);
    return hasLength && hasDigitOrSymbol;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignUp && !isPasswordStrong(password)) {
      setError('Choose a strong password');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isSignUp ? '/user-register' : '/user-login';
      const payload = isSignUp
        ? { full_name: fullName, email, password }
        : { email, password };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();

      if (!res.ok) {
        if (!isSignUp) {
          if (res.status === 401) throw new Error('Incorrect password');
          if (res.status === 404) throw new Error('Email not registered');
        }
        throw new Error(typeof body.detail === 'string' ? body.detail : 'Request failed');
      }

      // On successful registration, log in and go to upload
      login({ user_id: body.user_id, email });
      if (isSignUp) {
        navigate('/upload');
      } else {
        navigate('/jobs');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">JobSY</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Find your dream job with personalized recommendations
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            required
          />

          {error && <p className="text-red-500 text-xs text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-xs text-center text-gray-700">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <span
            className="text-blue-600 cursor-pointer hover:underline"
            onClick={() => {
              setIsSignUp(prev => !prev);
              setError('');
              setPassword('');
              setFullName('');
            }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </span>
        </p>

        <p className="text-center text-xs text-gray-500 mt-6">
          By signing in, you agree to our{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'https://jobsy-uye6.onrender.com';

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  // On mount or auth change, redirect based on resume existence
  useEffect(() => {
    if (!isAuthenticated) return;

    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/profile?user_email=${encodeURIComponent(user?.email ?? email)}`
        );
        if (res.ok) {
          navigate('/profile');
        } else {
          navigate('/upload');
        }
      } catch {
        navigate('/upload');
      }
    })();
  }, [isAuthenticated, navigate, user, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const res = await fetch(`${API_BASE}/user-register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: fullName, email, password }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(typeof body.detail === 'string' ? body.detail : 'Registration failed');
        setError('Registration successful! Please log in.');
        setIsSignUp(false);
      } else {
        const res = await fetch(`${API_BASE}/user-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(typeof body.detail === 'string' ? body.detail : 'Login failed');

        // set auth context
        login({ user_id: body.user_id, email });

        // After login, check if resume exists
        try {
          const profileRes = await fetch(
            `${API_BASE}/profile?user_email=${encodeURIComponent(email)}`
          );
          if (profileRes.ok) {
            navigate('/profile');
          } else {
            navigate('/upload');
          }
        } catch {
          navigate('/upload');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">JobSY</h1>
          <p className="text-gray-600">Find your dream job with personalized recommendations</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>

        <p
          className="mt-4 text-sm text-center text-blue-600 cursor-pointer hover:underline"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError('');
            setPassword('');
            if (isSignUp) setFullName('');
          }}
        >
          {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
        </p>

        <p className="text-center text-sm text-gray-500 mt-6">
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

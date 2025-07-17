import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Employee',
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { setUser, backendUrl } = useConfig();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const url = isLogin ? `${backendUrl}/api/auth/login` : `${backendUrl}/api/auth/register`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(
          isLogin
            ? { email: form.email, password: form.password }
            : form
        ),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(isLogin ? 'Login successful!' : 'Registration successful!');
        if (isLogin) {
          setUser({ email: form.email }); // You may want to fetch more user info
          navigate('/layout');
        }
      } else {
        setMessage(data.error || 'Something went wrong');
      }
    } catch (err) {
      setMessage('Network error');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">{isLogin ? 'Login' : 'Register'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-gray-700 mb-1">Name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          )}
          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          {!isLogin && (
            <div>
              <label className="block text-gray-700 mb-1">Role</label>
              <select name="role" value={form.role} onChange={handleChange} required className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="Employee">Employee</option>
                <option value="HR">HR</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          )}
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors font-semibold mt-2">
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        <button
          onClick={() => { setIsLogin(!isLogin); setMessage(''); }}
          className="w-full mt-4 text-blue-600 hover:underline focus:outline-none"
        >
          {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
        </button>
        {message && (
          <div className={`mt-4 text-center font-medium ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth; 
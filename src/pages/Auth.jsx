import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';

const DEFAULT_PASSWORD = 'password';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Employee',
  });
  const [message, setMessage] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [changePasswordMsg, setChangePasswordMsg] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetMsg, setResetMsg] = useState('');
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
          // If default password, prompt change
          if (form.password === DEFAULT_PASSWORD) {
            setShowChangePassword(true);
          } else {
            navigate('/layout');
          }
        }
      } else {
        setMessage(data.error || 'Something went wrong');
      }
    } catch (err) {
      setMessage('Network error');
    }
  };

  // Placeholder for forgot password handler
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch(`${backendUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      setMessage(data.message || 'If this email exists, a reset link will be sent.');
      if (data.token) {
        setShowReset(true);
        setResetToken(data.token);
      }
    } catch (err) {
      setMessage('Network error');
    }
  };

  // Handle token-based password reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetMsg('');
    if (resetNewPassword.length < 6) {
      setResetMsg('Password must be at least 6 characters.');
      return;
    }
    try {
      const res = await fetch(`${backendUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword: resetNewPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setShowReset(false);
        setShowForgot(false);
        setResetMsg('');
        setMessage('Password reset successful! Please log in.');
        setForm({ ...form, password: '' });
        setIsLogin(true);
      } else {
        setResetMsg(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      setResetMsg('Network error');
    }
  };

  // Placeholder for change password handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePasswordMsg('');
    if (newPassword.length < 6) {
      setChangePasswordMsg('Password must be at least 6 characters.');
      return;
    }
    try {
      const res = await fetch(`${backendUrl}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, oldPassword: DEFAULT_PASSWORD, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setShowChangePassword(false);
        setChangePasswordMsg('');
        setMessage('Password changed successfully! Please log in again.');
        setForm({ ...form, password: '' });
        setIsLogin(true);
      } else {
        setChangePasswordMsg(data.error || 'Failed to change password.');
      }
    } catch (err) {
      setChangePasswordMsg('Network error');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">{isLogin ? 'Login' : 'Register'}</h2>
        {showChangePassword ? (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-1">New Password</label>
              <input type="password" name="newPassword" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            {changePasswordMsg && <div className="text-red-600 text-sm">{changePasswordMsg}</div>}
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors font-semibold mt-2">Change Password</button>
          </form>
        ) : showReset ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-1">Reset Token</label>
              <input type="text" name="resetToken" value={resetToken} onChange={e => setResetToken(e.target.value)} required className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">New Password</label>
              <input type="password" name="resetNewPassword" value={resetNewPassword} onChange={e => setResetNewPassword(e.target.value)} required className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            {resetMsg && <div className="text-red-600 text-sm">{resetMsg}</div>}
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors font-semibold mt-2">Reset Password</button>
            <button type="button" className="w-full mt-2 text-blue-600 hover:underline focus:outline-none" onClick={() => { setShowReset(false); setShowForgot(false); }}>Back to Login</button>
          </form>
        ) : showForgot ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-1">Enter your email</label>
              <input type="email" name="forgotEmail" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors font-semibold mt-2">Send Reset Link</button>
            <button type="button" className="w-full mt-2 text-blue-600 hover:underline focus:outline-none" onClick={() => setShowForgot(false)}>Back to Login</button>
          </form>
        ) : (
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
        )}
        {!showChangePassword && !showForgot && isLogin && (
          <button
            type="button"
            className="w-full mt-2 text-blue-600 hover:underline focus:outline-none"
            onClick={() => setShowForgot(true)}
          >
            Forgot Password?
          </button>
        )}
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
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

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
  const [showPassword, setShowPassword] = useState(false);
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

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {showChangePassword ? (
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <div className="mt-1">
                  <input type="password" name="newPassword" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
              </div>
              {changePasswordMsg && <div className="text-red-600 text-sm">{changePasswordMsg}</div>}
              <div>
                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Change Password</button>
              </div>
            </form>
          ) : showReset ? (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Reset Token</label>
                <div className="mt-1">
                  <input type="text" name="resetToken" value={resetToken} onChange={e => setResetToken(e.target.value)} required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <div className="mt-1">
                  <input type="password" name="resetNewPassword" value={resetNewPassword} onChange={e => setResetNewPassword(e.target.value)} required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
              </div>
              {resetMsg && <div className="text-red-600 text-sm">{resetMsg}</div>}
              <div>
                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Reset Password</button>
              </div>
              <div className="text-sm">
                <a href="#" onClick={() => { setShowReset(false); setShowForgot(false); }} className="font-medium text-indigo-600 hover:text-indigo-500">
                  Back to Login
                </a>
              </div>
            </form>
          ) : showForgot ? (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Enter your email</label>
                <div className="mt-1">
                  <input type="email" name="forgotEmail" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
              </div>
              <div>
                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Send Reset Link</button>
              </div>
              <div className="text-sm">
                <a href="#" onClick={() => setShowForgot(false)} className="font-medium text-indigo-600 hover:text-indigo-500">
                  Back to Login
                </a>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <div className="mt-1">
                    <input type="text" name="name" value={form.name} onChange={handleChange} required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <div className="mt-1">
                  <input type="email" name="email" value={form.email} onChange={handleChange} required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
                    {showPassword ? (
                      <FaEyeSlash className="h-5 w-5 text-gray-400 cursor-pointer" onClick={toggleShowPassword} />
                    ) : (
                      <FaEye className="h-5 w-5 text-gray-400 cursor-pointer" onClick={toggleShowPassword} />
                    )}
                  </div>
                </div>
              </div>
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select name="role" value={form.role} onChange={handleChange} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    <option>Employee</option>
                    <option>HR</option>
                    <option>Admin</option>
                  </select>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>
                {isLogin && (
                  <div className="text-sm">
                    <a href="#" onClick={() => setShowForgot(true)} className="font-medium text-indigo-600 hover:text-indigo-500">
                      Forgot your password?
                    </a>
                  </div>
                )}
              </div>
              <div>
                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  {isLogin ? 'Sign in' : 'Register'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {isLogin ? 'Or continue with' : 'Already have an account?'}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <div>
                <a href="#" onClick={() => { setIsLogin(!isLogin); setMessage(''); }}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  {isLogin ? 'Create a new account' : 'Sign in'}
                </a>
              </div>
            </div>
            {message && (
              <div className={`mt-6 text-center text-sm font-medium ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
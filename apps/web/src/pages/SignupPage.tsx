import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, UserPlus, AlertCircle, Key, Home } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'RESIDENT' | 'ADMIN'>('RESIDENT');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [pgName, setPgName] = useState('');
  const [pgAddress, setPgAddress] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (activeTab === 'RESIDENT' && !inviteCode.trim()) {
        throw new Error('An invite code is required to join a PG property');
      }

      const user = await signup({
        name,
        email,
        password,
        inviteCode: activeTab === 'RESIDENT' ? inviteCode.trim() : undefined,
        pgName: activeTab === 'ADMIN' ? pgName : undefined,
        pgAddress: activeTab === 'ADMIN' ? pgAddress : undefined,
      });

      if (user.role === 'RESIDENT') {
        navigate('/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3 bg-sky-100 rounded-2xl text-sky-600 mb-3">
          <Building2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900">Create PG Connect Account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-sky-600 hover:text-sky-500">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-gray-200">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => { setActiveTab('RESIDENT'); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold border-b-2 flex items-center justify-center gap-2 ${
                activeTab === 'RESIDENT'
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Key className="w-4 h-4" />
              Join PG (Invite Code)
            </button>
            <button
              onClick={() => { setActiveTab('ADMIN'); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold border-b-2 flex items-center justify-center gap-2 ${
                activeTab === 'ADMIN'
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Home className="w-4 h-4" />
              Register PG (Owner)
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm"
                placeholder="Riya Sharma"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm"
                placeholder="riya@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm"
                placeholder="At least 6 characters"
              />
            </div>

            {activeTab === 'RESIDENT' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700">Invite Code</label>
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm font-mono tracking-wider"
                  placeholder="e.g. SUNRISE123"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ask your PG warden or owner for the invite code.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">PG Property Name</label>
                  <input
                    type="text"
                    required
                    value={pgName}
                    onChange={(e) => setPgName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm"
                    placeholder="Sunrise PG"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    required
                    value={pgAddress}
                    onChange={(e) => setPgAddress(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm"
                    placeholder="Indiranagar, Bengaluru"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none transition disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

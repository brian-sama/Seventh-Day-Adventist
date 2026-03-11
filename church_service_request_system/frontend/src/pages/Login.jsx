import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Church, Lock, User } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:8080/api/auth/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                login({
                    id: data.user_id,
                    username: data.username,
                    role: data.role
                }, data.token);
                navigate('/');
            } else {
                setError(data.non_field_errors?.[0] || 'Login failed. Please check your credentials.');
            }
        } catch (err) {
            setError('Network error. Is the server running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-[pulse_6s_ease-in-out_infinite]"></div>
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-[pulse_8s_ease-in-out_infinite_reverse]"></div>
            <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-[pulse_7s_ease-in-out_infinite]"></div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 hover:scale-[1.01] transition-transform duration-300">
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30 transform transition hover:rotate-6 duration-300">
                        <Church className="text-white w-8 h-8" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
                    Service Request Portal
                </h2>
                <p className="mt-2 text-center text-sm text-slate-400">
                    Sign in to manage church documents and requests
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="glass py-8 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-slate-700/50 bg-slate-800/80 transition-all duration-300 hover:shadow-primary-900/40">
                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm rounded-xl p-3 text-center animate-pulse shadow-sm">
                                {error}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-300">Username</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-500" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block w-full pl-11 sm:text-sm border-slate-600 bg-slate-900/50 text-white rounded-xl py-3.5 transition duration-200 outline-none"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300">Password</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-500" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block w-full pl-11 sm:text-sm border-slate-600 bg-slate-900/50 text-white rounded-xl py-3.5 transition duration-200 outline-none"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-primary-500 transform transition-all duration-200 cursor-pointer ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-primary-500/40 active:scale-95'}`}
                            >
                                {loading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
